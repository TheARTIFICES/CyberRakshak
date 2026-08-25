"""
Chat Assistant Service - Unified RAG Pipeline

Simplified pipeline using a single FAISS index:
1. Intent Classification (CPU, deterministic)
2. Embedding (remote GPU /embed)
3. FAISS Search (local CPU, single unified index)
4. Deduplication + Token Budget (CPU)
5. Prompt Assembly (CPU)
6. Generation (remote GPU /generate)
7. Logging
"""

import logging
import asyncio
import json
import uuid
import hashlib
import time
from typing import AsyncGenerator, List, Dict, Any, Set

from app.utils.ai_client import get_remote_embedding, generate_llm_response
from app.utils.context_builder import build_unified_context
from app.models import Job
from app.rag import rag, RAGResult
from app.intent_classifier import classify_intent, IntentType, IntentResult
from app.rag_logger import rag_logger
from app.rag_tools import execute_whitelisted_tool, TOOL_CALL_WHITELIST
from sqlmodel import Session, select
from app.database import engine
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)


# =============================================================================
# TOKEN BUDGET CONFIGURATION
# =============================================================================

class TokenBudget:
    """Unified token budget allocation for prompt assembly."""
    TOTAL_PROMPT_TOKENS = 4000

    SYSTEM_ROLE_TOKENS = 200
    ACCESS_LEVEL_TOKENS = 50
    SCAN_CONTEXT_TOKENS = 800
    RAG_CONTEXT_TOKENS = 1200
    HISTORY_TOKENS = 600
    USER_QUERY_TOKENS = 150
    BUFFER_TOKENS = 1000

    @classmethod
    def get_history_char_limit(cls) -> int:
        return cls.HISTORY_TOKENS * 4

    @classmethod
    def get_scan_context_char_limit(cls) -> int:
        return cls.SCAN_CONTEXT_TOKENS * 4

    @classmethod
    def get_rag_context_char_limit(cls) -> int:
        return cls.RAG_CONTEXT_TOKENS * 4


# =============================================================================
# CHAT ASSISTANT SERVICE
# =============================================================================

class ChatAssistantService:
    def __init__(self):
        # Cross-turn deduplication cache
        self._recent_doc_ids: Dict[str, Set[str]] = {}
        self._max_recent_docs = 50

    def _get_recent_doc_ids(self, conversation_id: str) -> Set[str]:
        return self._recent_doc_ids.get(conversation_id, set())

    def _update_recent_doc_ids(self, conversation_id: str, doc_ids: List[str]):
        if conversation_id not in self._recent_doc_ids:
            self._recent_doc_ids[conversation_id] = set()

        self._recent_doc_ids[conversation_id].update(doc_ids)

        if len(self._recent_doc_ids[conversation_id]) > self._max_recent_docs:
            all_ids = list(self._recent_doc_ids[conversation_id])
            self._recent_doc_ids[conversation_id] = set(all_ids[-self._max_recent_docs:])

    def _get_raw_jobs(self, job_ids: List[str]) -> List[Job]:
        valid_uuids = []
        for jid in job_ids:
            try:
                if jid:
                    valid_uuids.append(uuid.UUID(jid))
            except (ValueError, AttributeError):
                continue

        if not valid_uuids:
            return []

        with Session(engine) as session:
            return list(session.exec(select(Job).where(Job.id.in_(valid_uuids))).all())

    def _deduplicate_results(
        self,
        results: List[RAGResult],
        recent_doc_ids: Set[str],
    ) -> List[RAGResult]:
        """
        Deduplicate RAG results:
        1. By content hash (exact text dedup)
        2. By CVE ID + chunk_index (same chunk from same CVE)
        3. Cross-turn (skip recently shown docs)
        """
        seen_ids: Set[str] = set()
        seen_chunks: Set[str] = set()
        deduped: List[RAGResult] = []

        for result in results:
            # Content hash for exact dedup
            doc_id = hashlib.sha256(result.text.encode()).hexdigest()[:16]

            if doc_id in recent_doc_ids:
                continue

            if doc_id in seen_ids:
                continue

            # CVE + chunk dedup
            chunk_key = f"{result.cve_id}:{result.chunk_index}"
            if chunk_key in seen_chunks:
                continue

            seen_ids.add(doc_id)
            seen_chunks.add(chunk_key)
            deduped.append(result)

        return deduped

    def _truncate_to_budget(self, results: List[RAGResult]) -> List[RAGResult]:
        """Truncate results to fit within the RAG token budget."""
        max_chars = TokenBudget.get_rag_context_char_limit()
        truncated: List[RAGResult] = []
        total_chars = 0

        for result in results:
            doc_chars = len(result.text) + 80  # overhead for labels/formatting
            if total_chars + doc_chars <= max_chars:
                truncated.append(result)
                total_chars += doc_chars
            else:
                break

        return truncated

    def _build_structured_prompt(
        self,
        user_query: str,
        access_level: str,
        scan_context: Dict,
        rag_results: List[RAGResult],
        history: List[Dict],
    ) -> str:
        """Build structured prompt with RAG context and absolute IF/THEN constraints."""

        # Scan context
        if scan_context:
            context_str = json.dumps(scan_context, indent=2)
            max_context_chars = TokenBudget.get_scan_context_char_limit()
            if len(context_str) > max_context_chars:
                context_str = context_str[:max_context_chars] + "\n... (truncated)"
        else:
            context_str = "EMPTY - No active scan data."

        # RAG context from unified index
        rag_context = ""
        for i, result in enumerate(rag_results, 1):
            severity_tag = f" | {result.severity}" if result.severity != "unknown" else ""
            cvss_tag = f" | CVSS: {result.cvss}" if result.cvss != "N/A" else ""
            exploitdb_tag = " | ExploitDB: Yes" if result.has_exploitdb else ""

            rag_context += f"""
--- SOURCE [{i}]: {result.cve_id}{severity_tag}{cvss_tag}{exploitdb_tag} ---
{result.text}
"""

        if not rag_context:
            rag_context = "EMPTY - No reference material found."

        # Conversation history
        history_str = ""
        max_history_chars = TokenBudget.get_history_char_limit()
        for msg in history[-3:]:
            role = msg.get("role", "user").upper()
            text = msg.get("content", "")
            history_str += f"{role}: {text}\n"

        if len(history_str) > max_history_chars:
            history_str = history_str[:max_history_chars] + "\n... (truncated)"

        # NOTE: No "RESPONSE:" marker here — the Kaggle script's
        # "### Response:" wrapper is the generation trigger. Having
        # two response labels causes prompt bleed.
        prompt = f"""You are Cyra, an expert offensive security AI. You operate with absolute technical precision and zero fabrication.

[CRITICAL DIRECTIVES]
1. ZERO FABRICATION: You must ONLY use facts, payloads, or scripts explicitly present in the [Reference Material]. IF the [Reference Material] does not contain a script or code block, YOU MUST NOT WRITE ONE.
2. TARGET LOCK: IF the user specifies a target (e.g., a domain, IP, or URL) AND that target is not explicitly listed in the [Active Scan Context], you MUST output EXACTLY this string before proceeding: "I do not have active scan context verifying endpoints for [Target]." Do not embed unverified targets into payloads.
3. NO PREACHING: Do not include ethical considerations, responsible disclosure warnings, or disclaimers. Give raw technical data only.
4. CITATIONS: Cite your data inline using [Source: Name].

[Reference Material]
{rag_context}

[Active Scan Context]
{context_str}

[Conversation History]
{history_str}
USER: {user_query}
"""
        return prompt

    async def get_response_async(
        self,
        user_message: str,
        history: List[Dict[str, str]] = None,
        context_job_ids: List[str] = None,
        conversation_id: str = None,
    ) -> str:
        """
        Unified RAG Pipeline:
        Query → Intent → Embed → FAISS Search → Dedup → Prompt → Generate
        """
        history = history or []
        context_job_ids = context_job_ids or []

        start_time = time.perf_counter()
        conversation_id = conversation_id or str(uuid.uuid4())

        # 1. Fetch Scan Data (Database)
        jobs = await run_in_threadpool(self._get_raw_jobs, context_job_ids)
        scan_context: Dict[str, Any] = {}
        access_level = "none"
        if jobs:
            job_dict = jobs[0].dict() if hasattr(jobs[0], 'dict') else jobs[0].__dict__
            scan_context = build_unified_context(job_dict)
            access_level = job_dict.get("access_level", "none") or "none"

        # 2. Intent Classification
        intent_result: IntentResult = classify_intent(
            user_message, access_level, scan_context
        )

        intent_names = [i.value for i in intent_result.primary_intents]
        logger.info(
            f"Intent: {intent_names}, Confidence: {intent_result.confidence:.3f}, "
            f"Trivial: {intent_result.is_trivial}, Meta: {intent_result.is_meta_query}"
        )

        # 3. Check for Financial / Tool-Calling Intents
        tool_context_str = ""
        for intent in intent_result.primary_intents:
            try:
                if intent == IntentType.FINANCIAL_RISK:
                    t_res = execute_whitelisted_tool("risk_tool")
                    tool_context_str += f"\n[Live Quantitative Risk Engine Telemetry]\n{json.dumps(t_res, indent=2)}\n"
                elif intent == IntentType.OPTIMIZATION:
                    t_res = execute_whitelisted_tool("optimizer_tool", budget_inr=500000.0)
                    tool_context_str += f"\n[Live PuLP Optimizer Capital Allocation Matrix]\n{json.dumps(t_res, indent=2)}\n"
                elif intent == IntentType.SIMULATION:
                    t_res = execute_whitelisted_tool("simulation_tool", scenario_name="MFA_EVERYWHERE")
                    tool_context_str += f"\n[Live Scenario Simulation Workbench]\n{json.dumps(t_res, indent=2)}\n"
                elif intent == IntentType.COMPLIANCE:
                    t_res = execute_whitelisted_tool("compliance_tool")
                    tool_context_str += f"\n[Live Regulatory Compliance Posture]\n{json.dumps(t_res, indent=2)}\n"
            except Exception as e:
                logger.warning(f"Error executing AI tool for intent {intent}: {e}")

        # 4. Handle trivial/meta queries (skip RAG)
        if intent_result.is_trivial:
            latency_ms = (time.perf_counter() - start_time) * 1000
            rag_logger.log_request(
                intent="trivial", intent_confidence=0.0,
                documents_used=0, doc_ids_used=[], latency_ms=latency_ms,
                access_level=access_level,
            )
            return "Hello! I'm CyberRakshak, your cybersecurity assistant. How can I help you today?"

        if intent_result.is_meta_query:
            latency_ms = (time.perf_counter() - start_time) * 1000
            rag_logger.log_request(
                intent="meta", intent_confidence=0.0,
                documents_used=0, doc_ids_used=[], latency_ms=latency_ms,
                access_level=access_level,
            )
            return self._get_capabilities_response()

        # 5. Get Embedding (Remote GPU)
        embedding = await get_remote_embedding(intent_result.normalized_query)

        # 6. FAISS Search (Local CPU — single unified index)
        rag_results: List[RAGResult] = []
        if embedding and rag.is_available():
            rag_results = rag.search(embedding, k=5)
            logger.info(f"RAG returned {len(rag_results)} results from unified index")
        elif not rag.is_available():
            logger.warning("RAG index not available — generating without context")

        # 7. Dedup + Token Budget
        recent_doc_ids = self._get_recent_doc_ids(conversation_id)
        rag_results = self._deduplicate_results(rag_results, recent_doc_ids)
        rag_results = self._truncate_to_budget(rag_results)

        # Update recent doc IDs
        doc_ids = [
            hashlib.sha256(r.text.encode()).hexdigest()[:16]
            for r in rag_results
        ]
        self._update_recent_doc_ids(conversation_id, doc_ids)

        if tool_context_str:
            scan_context["tool_engine_results"] = tool_context_str

        # 8. Prompt Assembly
        final_prompt = self._build_structured_prompt(
            user_message, access_level, scan_context, rag_results, history,
        )

        # 8. Generation (Remote GPU)
        response = await generate_llm_response(final_prompt)

        # 9. Logging
        latency_ms = (time.perf_counter() - start_time) * 1000
        rag_logger.log_request(
            intent=",".join(intent_names),
            intent_confidence=intent_result.confidence,
            documents_used=len(rag_results),
            doc_ids_used=doc_ids,
            latency_ms=latency_ms,
            access_level=access_level,
        )

        # Try to clean up JSON wrapping
        try:
            if response.strip().startswith("{") and "analysis" in response:
                data = json.loads(response)
                return json.dumps(data)
        except (json.JSONDecodeError, AttributeError):
            pass

        return response

    def _get_capabilities_response(self) -> str:
        return """I'm **CyberRakshak**, your AI-powered cybersecurity assistant. Here's what I can help you with:

**🔍 Reconnaissance**
- Port scanning and service enumeration
- Network mapping and fingerprinting
- NMAP guidance and interpretation

**🛡️ Vulnerability Assessment**
- CVE lookup and analysis
- Vulnerability scanning with Nuclei
- Security audit recommendations

**⚔️ Exploitation Guidance**
- Exploit code and payloads (when appropriate)
- Metasploit module recommendations
- Attack vector analysis

**🔑 Privilege Escalation**
- Linux priv-esc techniques (LinPEAS)
- GTFOBins for binary exploitation
- Local privilege escalation guidance

**📋 Planning & Strategy**
- Attack path recommendations
- MITRE ATT&CK technique mapping
- Next steps suggestions

Just ask me a question about your security assessment!"""

    async def stream_response(
        self,
        user_message: str,
        history: List[Dict[str, str]] = None,
        context_job_ids: List[str] = None,
        conversation_id: str = None,
    ) -> AsyncGenerator[str, None]:
        """Streaming wrapper for get_response_async."""
        history = history or []
        context_job_ids = context_job_ids or []

        ai_task = asyncio.create_task(
            self.get_response_async(user_message, history, context_job_ids, conversation_id)
        )

        while not ai_task.done():
            yield " "
            try:
                await asyncio.wait_for(asyncio.shield(ai_task), timeout=2.0)
            except asyncio.TimeoutError:
                continue

        try:
            full_text = await ai_task
            chunk_size = 50
            for i in range(0, len(full_text), chunk_size):
                yield full_text[i:i + chunk_size]
                await asyncio.sleep(0.02)
        except Exception as e:
            logger.error(f"AI Stream Error: {e}")
            yield '{"analysis": "System Error: AI Bridge Failed."}'


# Singleton instance
chat_assistant_service = ChatAssistantService()

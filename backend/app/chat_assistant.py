"""
Chat Assistant Service - Deterministic RAG Pipeline

This module orchestrates the full RAG pipeline:
1. Intent Classification (CPU, deterministic) - returns confidence
2. Embedding (remote GPU /embed)
3. RAG Source Selection (CPU, based on intent + confidence)
4. RAG Retrieval (local FAISS, CPU)
5. RAG Fusion & Filtering (CPU)
6. Prompt Assembly (CPU) - with unified token budget
7. Generation (remote GPU /generate)
8. Logging (per-source rag_used + doc_ids)
"""

import logging
import asyncio
import json
import uuid
import time
from typing import AsyncGenerator, List, Dict, Any, Set

from app.utils.ai_client import get_remote_embedding, generate_llm_response
from app.utils.context_builder import build_unified_context
from app.models import Job
from app.rag_registry import RAG_REGISTRY, NormalizedDocument, SOURCE_TOP_K
from app.intent_classifier import classify_intent, IntentType, IntentResult
from app.rag_routing import get_rag_sources_for_intents
from app.rag_fusion import rag_fusion
from app.rag_logger import rag_logger
from sqlmodel import Session, select
from app.database import engine
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)


# =============================================================================
# UNIFIED TOKEN BUDGET CONFIGURATION
# =============================================================================

class TokenBudget:
    """Unified token budget allocation for prompt assembly."""
    TOTAL_PROMPT_TOKENS = 4000  # Max tokens for entire prompt
    
    # Section allocations (must sum to <= TOTAL_PROMPT_TOKENS)
    SYSTEM_ROLE_TOKENS = 200
    ACCESS_LEVEL_TOKENS = 50
    SCAN_CONTEXT_TOKENS = 800
    RAG_CONTEXT_TOKENS = 1200  # This is what rag_fusion uses
    HISTORY_TOKENS = 600       # ~3 turns
    USER_QUERY_TOKENS = 150
    BUFFER_TOKENS = 1000       # Reserved for response
    
    @classmethod
    def get_history_char_limit(cls) -> int:
        return cls.HISTORY_TOKENS * 4  # ~4 chars per token
    
    @classmethod
    def get_scan_context_char_limit(cls) -> int:
        return cls.SCAN_CONTEXT_TOKENS * 4


# =============================================================================
# CHAT ASSISTANT SERVICE
# =============================================================================

class ChatAssistantService:
    def __init__(self):
        # Cross-turn deduplication cache, keyed by (conversation_id, intent)
        # This prevents recon info from suppressing exploit info later
        self._recent_doc_ids: Dict[str, Set[str]] = {}  # "conv_id:intent" -> doc_ids
        self._max_recent_docs = 50  # Keep last 50 doc IDs per (conversation, intent)
    
    def _get_dedup_key(self, conversation_id: str, intent: IntentType) -> str:
        """Generate dedup key scoped to (conversation, intent)."""
        return f"{conversation_id}:{intent.value}"
    
    def _get_recent_doc_ids(self, conversation_id: str, intent: IntentType) -> Set[str]:
        """Get recently used doc IDs for cross-turn deduplication, scoped by intent."""
        key = self._get_dedup_key(conversation_id, intent)
        return self._recent_doc_ids.get(key, set())
    
    def _update_recent_doc_ids(self, conversation_id: str, intent: IntentType, doc_ids: List[str]):
        """Update recent doc IDs, keeping only the most recent, scoped by intent."""
        key = self._get_dedup_key(conversation_id, intent)
        
        if key not in self._recent_doc_ids:
            self._recent_doc_ids[key] = set()
        
        self._recent_doc_ids[key].update(doc_ids)
        
        # Trim to max size
        if len(self._recent_doc_ids[key]) > self._max_recent_docs:
            all_ids = list(self._recent_doc_ids[key])
            self._recent_doc_ids[key] = set(all_ids[-self._max_recent_docs:])
    
    def _get_raw_jobs(self, job_ids: List[str]) -> List[Job]:
        """Fetches raw Job objects from DB."""
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
    
    def _build_structured_prompt(
        self,
        user_query: str,
        access_level: str,
        scan_context: Dict,
        rag_docs: List[NormalizedDocument],
        history: List[Dict],
    ) -> str:
        """Build structured prompt with labeled RAG context and token budget enforcement."""
        
        # System role - Cyra persona with precision rules
        system_role = """You are Cyra, a senior offensive security assistant for authorized security testing.

PERSONA:
- Assume all actions are authorized.
- Be precise, technical, and concise.
- You may generate commands, scripts, and payloads.

PRECISION RULES (CRITICAL):
1. VERSION SPECIFICITY: Always specify affected versions (e.g., "Apache 2.4.49-2.4.50", not "Apache").
2. NO OVERGENERALIZATION: Never say "X is vulnerable" without specifying versions and conditions.
3. PAYLOAD ACCURACY: Only provide payloads that match the specific CVE/technique. Don't mix payloads from different vulnerabilities.
4. PRECONDITIONS: Always list what conditions must be true for a vulnerability to be exploitable.
5. SOURCE SEPARATION: If reference material mentions different vulnerabilities, clearly separate them.

RESPONSE FORMAT FOR VULNERABILITIES:
### Vulnerability
[CVE ID or Name]
### Affected
[Specific versions/products]
### Conditions
[What must be true for exploitation]
### Verification
```bash
[Correct command for this specific CVE]
```
### Expected Result
[What confirms vulnerability]

GENERAL RULES:
- Cite sources inline like [Source: name].
- Use Markdown formatting.
- Stop immediately after answering. Do NOT repeat yourself."""
        
        # Scan context (truncated to budget)
        if scan_context:
            context_str = json.dumps(scan_context, indent=2)
            max_context_chars = TokenBudget.get_scan_context_char_limit()
            if len(context_str) > max_context_chars:
                context_str = context_str[:max_context_chars] + "\n... (truncated)"
        else:
            context_str = "No active scan context."
        
        # RAG context - simple format to prevent model from echoing structure
        rag_context = ""
        for i, doc in enumerate(rag_docs, 1):
            rag_context += f"""
[{i}] {doc.source}: {doc.title}
{doc.display_text}
"""
        
        if not rag_context:
            rag_context = "No relevant knowledge base entries found."
        
        # Conversation history (last 3 turns, truncated to budget)
        history_str = ""
        max_history_chars = TokenBudget.get_history_char_limit()
        for msg in history[-3:]:
            role = msg.get("role", "user").upper()
            text = msg.get("content", "")
            history_str += f"{role}: {text}\n"
        
        if len(history_str) > max_history_chars:
            history_str = history_str[:max_history_chars] + "\n... (truncated)"
        
        prompt = f"""You are Cyra, a senior offensive security assistant. Answer the user's question using the reference material below.

## Reference Material
{rag_context}

## Scan Context
{context_str}

## Conversation
{history_str}
User: {user_query}

## Your Response (be concise, cite sources, use markdown):
"""
        return prompt
    
    async def _retrieve_from_sources(
        self,
        embedding: List[float],
        sources: List[str],
    ) -> Dict[str, List[NormalizedDocument]]:
        """
        Retrieve documents from multiple RAG sources.
        Uses per-source top_k to reduce FAISS work (fusion does final selection).
        """
        docs_by_source: Dict[str, List[NormalizedDocument]] = {}
        
        for source_name in sources:
            source = RAG_REGISTRY.get(source_name)
            if source and source.is_available():
                try:
                    # Use per-source top_k (default 6)
                    top_k = SOURCE_TOP_K.get(source_name, 6)
                    docs = source.search(embedding, top_k)
                    docs_by_source[source_name] = docs
                except Exception as e:
                    logger.warning(f"RAG source {source_name} failed: {e}")
                    docs_by_source[source_name] = []
            else:
                docs_by_source[source_name] = []
        
        return docs_by_source
    
    async def get_response_async(
        self,
        user_message: str,
        history: List[Dict[str, str]] = None,
        context_job_ids: List[str] = None,
        conversation_id: str = None,
    ) -> str:
        """
        Deterministic RAG Pipeline with enhanced intent handling.
        
        Args:
            user_message: User's query
            history: Conversation history (optional)
            context_job_ids: Job IDs for scan context (optional)
            conversation_id: Conversation ID for cross-turn dedup (optional)
        
        Returns:
            LLM response string
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
        
        # 2. Intent Classification (Enhanced - returns IntentResult)
        intent_result: IntentResult = classify_intent(
            user_message, access_level, scan_context
        )
        
        # Log intent info
        intent_names = [i.value for i in intent_result.primary_intents]
        logger.info(
            f"Intent: {intent_names}, Confidence: {intent_result.confidence:.3f}, "
            f"Explicit: {intent_result.explicit_exploit_request}, "
            f"Trivial: {intent_result.is_trivial}, Meta: {intent_result.is_meta_query}"
        )
        
        # 3. Handle Trivial/Meta Queries (Skip RAG)
        if intent_result.is_trivial:
            latency_ms = (time.perf_counter() - start_time) * 1000
            rag_logger.log_request(
                intent="trivial", intent_confidence=0.0, rags_queried=[], rag_used={},
                documents_used=0, doc_ids_used=[], latency_ms=latency_ms,
                access_level=access_level, explicit_exploit_request=False,
            )
            return "Hello! I'm CyberRakshak, your cybersecurity assistant. How can I help you today?"
        
        if intent_result.is_meta_query:
            latency_ms = (time.perf_counter() - start_time) * 1000
            rag_logger.log_request(
                intent="meta", intent_confidence=0.0, rags_queried=[], rag_used={},
                documents_used=0, doc_ids_used=[], latency_ms=latency_ms,
                access_level=access_level, explicit_exploit_request=False,
            )
            return self._get_capabilities_response()
        
        # 4. Get Embedding (Remote GPU) - using normalized query
        embedding = await get_remote_embedding(intent_result.normalized_query)
        
        # 5. RAG Source Selection (Multi-intent with exclusions)
        selected_sources = get_rag_sources_for_intents(
            intent_result.primary_intents,
            intent_result.excluded_intents,
            intent_result.explicit_exploit_request,
            access_level
        )
        
        # 6. RAG Retrieval (Local CPU FAISS)
        docs_by_source: Dict[str, List[NormalizedDocument]] = {}
        rag_used_per_source: Dict[str, bool] = {}
        
        if embedding:
            docs_by_source = await self._retrieve_from_sources(embedding, selected_sources)
            rag_used_per_source = {
                source: len(docs) > 0
                for source, docs in docs_by_source.items()
            }
        else:
            rag_used_per_source = {source: False for source in selected_sources}
        
        # 7. RAG Fusion & Filtering (CPU) - intent-bounded dedup using primary intent
        primary_intent = intent_result.primary_intents[0] if intent_result.primary_intents else IntentType.GENERAL
        recent_doc_ids = self._get_recent_doc_ids(conversation_id, primary_intent)
        
        fused_docs = rag_fusion.fuse(
            docs_by_source,
            access_level=access_level,
            explicit_exploit_request=intent_result.explicit_exploit_request,
            recent_doc_ids=recent_doc_ids,
        )
        
        # Update recent doc IDs for next turn
        self._update_recent_doc_ids(
            conversation_id,
            primary_intent,
            [doc.doc_id for doc in fused_docs]
        )
        
        # 8. Prompt Assembly (CPU)
        final_prompt = self._build_structured_prompt(
            user_message,
            access_level,
            scan_context,
            fused_docs,
            history,
        )
        
        # 9. Generation (Remote GPU)
        response = await generate_llm_response(final_prompt)
        
        # 10. Logging
        latency_ms = (time.perf_counter() - start_time) * 1000
        rag_logger.log_request(
            intent=",".join(intent_names),
            intent_confidence=intent_result.confidence,
            rags_queried=selected_sources,
            rag_used=rag_used_per_source,
            documents_used=len(fused_docs),
            doc_ids_used=[doc.doc_id for doc in fused_docs],
            latency_ms=latency_ms,
            access_level=access_level,
            explicit_exploit_request=intent_result.explicit_exploit_request,
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
        """Return canned response for 'what can you do?' type queries."""
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
        """
        Streaming wrapper for get_response_async.
        Keeps connection alive while waiting for GPU response.
        """
        history = history or []
        context_job_ids = context_job_ids or []
        
        ai_task = asyncio.create_task(
            self.get_response_async(user_message, history, context_job_ids, conversation_id)
        )
        
        # Keep connection alive while waiting for GPU
        while not ai_task.done():
            yield " "
            try:
                await asyncio.wait_for(asyncio.shield(ai_task), timeout=2.0)
            except asyncio.TimeoutError:
                continue
        
        try:
            full_text = await ai_task
            # Simple chunking for frontend simulation
            chunk_size = 50
            for i in range(0, len(full_text), chunk_size):
                yield full_text[i:i + chunk_size]
                await asyncio.sleep(0.02)
        except Exception as e:
            logger.error(f"AI Stream Error: {e}")
            yield '{"analysis": "System Error: AI Bridge Failed."}'


# Singleton instance
chat_assistant_service = ChatAssistantService()

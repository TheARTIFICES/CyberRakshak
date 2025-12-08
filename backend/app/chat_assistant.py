import logging
import asyncio
from typing import AsyncGenerator, List, Dict, Any, Optional
from app.utils.ai_client import generate_ai_response
from app.models import Job
from sqlmodel import Session, select
from app.database import engine
from starlette.concurrency import run_in_threadpool # <--- IMPORT THIS

logger = logging.getLogger(__name__)

class ChatAssistantService:
    # ... (init and _format_single_report methods remain the same) ...
    def __init__(self):
        # Strict Prompt (Used when scans ARE selected)
        self.scan_context_prompt = """
        You are Cyra, an expert cybersecurity assistant for the CyberRakshak platform.
        CONTEXT:
        You have access to the user's vulnerability scan reports (provided below).
        You also have the history of this conversation.
        RULES:
        1. **No Repetition:** Do NOT introduce yourself ("I am Cyra...") if you have already done so in the conversation history. Just answer the question directly.
        2. **Context Awareness:** Use the scan report(s) provided to answer specific questions about ports, vulnerabilities, and risks. If multiple scans are provided, refer to them by their Target/Date.
        3. **Actionable Advice:** Provide specific commands (Nginx/Apache/Linux) when asked for remediation.
        4. **Unknowns:** If the user asks about a specific vulnerability or asset that is NOT in the provided scan context, explicitly state: "I don't see that in the provided scan results."
        5. **Tone:** Professional, concise, and helpful.
        """

        # General Prompt (Used when NO scans are selected)
        self.general_prompt = """
        You are Cyra, an expert cybersecurity assistant for the CyberRakshak platform.
        CONTEXT:
        The user has NOT selected any specific scan reports for this query. You are operating in **General Knowledge Mode**.
        RULES:
        1. **General Knowledge:** Answer the user's cybersecurity questions based on your general training (e.g., explaining CVEs, writing scripts, general best practices).
        2. **No Repetition:** Do NOT introduce yourself if you have already done so.
        3. **No Scan References:** Do NOT say "I don't see that in the scan" because no scan is loaded. Just answer the question.
        4. **Tone:** Professional, concise, and helpful.
        """

    def _format_single_report(self, job: Job) -> str:
        """Helper to format a single job's report into a string."""
        if not job or not job.normalized_report:
            return f"Scan for {job.target} (ID: {job.id}): No data available."

        report = job.normalized_report
        vulns = report.get("vulnerabilities", [])
        
        summary = [f"--- SCAN REPORT: {job.target} (Date: {str(job.created_at)[:10]}) ---"]
        ports = report.get('ports', [])
        if ports:
            summary.append(f"Open Ports: {', '.join([str(p.get('port')) for p in ports])}")

        if not vulns:
            summary.append("No vulnerabilities found.")
        else:
            summary.append(f"Found {len(vulns)} vulnerabilities. Top findings:")
            for v in vulns[:20]: 
                title = v.get('title', 'Unknown')
                severity = v.get('severity', 'Info')
                cve = v.get('cve') or "N/A"
                summary.append(f"- [{severity}] {title} (CVE: {cve})")
        
        return "\n".join(summary)

    def _get_scan_context(self, job_ids: Optional[List[str]] = None) -> str:
        """
        Fetches scan reports based ONLY on user selection.
        """
        try:
            if not job_ids:
                return "" 

            with Session(engine) as session:
                statement = select(Job).where(Job.id.in_(job_ids))
                jobs = session.exec(statement).all()
                
                if not jobs:
                    return "User selected scans, but no matching data was found."
                
                context_parts = [self._format_single_report(job) for job in jobs]
                return "\n\n".join(context_parts)

        except Exception as e:
            logger.error(f"Context retrieval failed: {e}")
            return "Error retrieving scan data."

    def _format_history(self, history: List[Dict[str, str]]) -> str:
        if not history: return "No previous conversation."

        formatted = []
        for msg in history[-6:]:
            role = "User" if msg.get("role") == "user" else "Cyra (AI)"
            content = msg.get("content", "").replace("\n", " ")
            formatted.append(f"{role}: {content}")
        return "\n".join(formatted)

    async def get_response_async(self, user_message: str, history: List[Dict[str, str]] = [], context_job_ids: List[str] = []) -> str:
        # --- FIX: Run DB Fetch in Threadpool to avoid blocking Heartbeat Loop ---
        scan_context = await run_in_threadpool(self._get_scan_context, context_job_ids)
        history_text = self._format_history(history)

        if context_job_ids and len(context_job_ids) > 0:
            system_instruction = self.scan_context_prompt
            context_block = f"=== PROVIDED SCAN DATA ===\n{scan_context}\n=========================="
        else:
            system_instruction = self.general_prompt
            context_block = "=== NO SCAN CONTEXT SELECTED (General Mode) ==="

        full_prompt = f"""
        {system_instruction}

        {context_block}

        === CONVERSATION HISTORY ===
        {history_text}
        ============================

        User Query: {user_message}
        """

        return await generate_ai_response(full_prompt)

    async def stream_response(self, user_message: str, history: List[Dict[str, str]] = [], context_job_ids: List[str] = []) -> AsyncGenerator[str, None]:
        logger.info(f"Stream Request: {user_message[:50]}... (Context Jobs: {len(context_job_ids)})")
        
        # 1. Create AI task
        ai_task = asyncio.create_task(self.get_response_async(user_message, history, context_job_ids))
        
        # 2. Heartbeat Loop
        while not ai_task.done():
            yield " " 
            try:
                await asyncio.wait_for(asyncio.shield(ai_task), timeout=2.0)
            except asyncio.TimeoutError:
                continue
        
        # 3. Get Result
        try:
            full_response = await ai_task
        except Exception as e:
            logger.error(f"AI Task failed: {e}")
            yield "System Error: AI generation crashed."
            return

        if not full_response:
            yield "System Error: No response received."
            return

        # 4. Stream Content
        chunk_size = 10
        for i in range(0, len(full_response), chunk_size):
            yield full_response[i:i+chunk_size]
            await asyncio.sleep(0.01)

chat_assistant_service = ChatAssistantService()

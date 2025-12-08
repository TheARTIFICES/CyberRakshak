import logging
import asyncio
from typing import AsyncGenerator, List, Dict, Any
from app.utils.ai_client import generate_ai_response
from app.models import Job
from sqlmodel import Session, select
from app.database import engine

logger = logging.getLogger(__name__)

class ChatAssistantService:
    def __init__(self):
        self.system_prompt = """
        You are Cyra, an expert cybersecurity assistant for the CyberRakshak platform.
        CONTEXT:
        You have access to the user's latest vulnerability scan report (provided below).
        You also have the history of this conversation.
        RULES:
        1. **No Repetition:** Do NOT introduce yourself ("I am Cyra...") if you have already done so in the conversation history. Just answer the question directly.
        2. **Context Awareness:** Use the scan report to answer specific questions about ports, vulnerabilities, and risks.
        3. **Actionable Advice:** Provide specific commands (Nginx/Apache/Linux) when asked for remediation.
        4. **Unknowns:** If the user asks about something not in the scan or history, say "I don't see that in your latest scan results."
        5. **Tone:** Professional, concise, and helpful.
        """

    def _get_latest_scan_context(self) -> str:
        """Fetches the most recent completed scan report from the DB."""
        try:
            with Session(engine) as session:
                job = session.exec(select(Job).where(Job.status == "completed").order_by(Job.created_at.desc()).limit(1)).first()

                if not job or not job.normalized_report:
                    return "No scan data available yet."

                report = job.normalized_report
                vulns = report.get("vulnerabilities", [])

                summary = [f"Target: {job.target}"]
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

    async def get_response_async(self, user_message: str, history: List[Dict[str, str]] = []) -> str:
        scan_context = self._get_latest_scan_context()
        history_text = self._format_history(history)

        full_prompt = f"""
        {self.system_prompt}

        === LATEST SCAN DATA ===
        {scan_context}
        ========================

        === CONVERSATION HISTORY ===
        {history_text}
        ============================

        User Query: {user_message}
        """

        # Ensure we await the async function
        return await generate_ai_response(full_prompt)

    async def stream_response(self, user_message: str, history: List[Dict[str, str]] = []) -> AsyncGenerator[str, None]:
        logger.info(f"Stream Request: {user_message[:50]}...")
        
        # 1. Wait for full response (The "Thinking" Phase)
        full_response = await self.get_response_async(user_message, history)
        
        if not full_response:
            logger.error("Received empty response from AI Client")
            yield "System Error: No response received."
            return

        logger.info(f"Starting Stream. Total Length: {len(full_response)} chars")

        # 2. Stream it back in chunks
        chunk_size = 10  # Increased slightly for better network efficiency
        
        for i in range(0, len(full_response), chunk_size):
            chunk = full_response[i:i+chunk_size]
            
            # LOG FIRST FEW CHUNKS TO VERIFY STREAMING IS ACTIVE
            if i < 50: 
                logger.info(f"Yielding chunk: {chunk}")
            
            yield chunk
            await asyncio.sleep(0.01)
            
        logger.info("Stream Finished Successfully")

chat_assistant_service = ChatAssistantService()

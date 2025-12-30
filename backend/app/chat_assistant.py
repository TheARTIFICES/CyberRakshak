import logging
import asyncio
import uuid
from typing import AsyncGenerator, List, Dict, Any, Optional
from app.utils.ai_client import generate_ai_response
from app.utils.context_builder import build_unified_context
from app.models import Job
from sqlmodel import Session, select
from app.database import engine
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)

class ChatAssistantService:
    def _get_raw_jobs(self, job_ids: List[str]) -> List[Job]:
        """Fetches raw Job objects from DB."""
        valid_uuids = []
        for jid in job_ids:
            try:
                if jid: valid_uuids.append(uuid.UUID(jid))
            except: continue
        with Session(engine) as session:
            return session.exec(select(Job).where(Job.id.in_(valid_uuids))).all()

    async def get_response_async(self, user_message: str, history: List[Dict[str, str]] = [], context_job_ids: List[str] = []) -> str:
        """
        Builds the structured JSON payload for the AI Brain.
        REMOVED: formatting scan reports into human-readable strings.
        """
        jobs = await run_in_threadpool(self._get_raw_jobs, context_job_ids)
        
        unified_context = {}
        if jobs:
            # We use the most recent scan as the primary context source
            unified_context = build_unified_context(jobs[0].dict())
        
        payload = {
            "context": unified_context,
            "history": history[-6:],
            "user_query": user_message,
            "access_level": unified_context.get("access_level", "none")
        }
        
        return await generate_ai_response(payload)

    async def stream_response(self, user_message: str, history: List[Dict[str, str]] = [], context_job_ids: List[str] = []) -> AsyncGenerator[str, None]:
        ai_task = asyncio.create_task(self.get_response_async(user_message, history, context_job_ids))
        
        while not ai_task.done():
            yield " " 
            try:
                await asyncio.wait_for(asyncio.shield(ai_task), timeout=2.0)
            except asyncio.TimeoutError: continue
        
        try:
            full_text = await ai_task
            chunk_size = 20
            for i in range(0, len(full_text), chunk_size):
                yield full_text[i:i+chunk_size]
                await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"AI Stream Error: {e}")
            yield '{"analysis": "System Error: AI Bridge Failed."}'

chat_assistant_service = ChatAssistantService()

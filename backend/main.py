from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from app.config import settings
import os
import logging

# Legacy RAG import (kept for fallback mode)
from app.rag import rag

# New multi-index RAG system
from app.rag_registry import RAG_REGISTRY, initialize_all_rags, get_rag_stats

logger = logging.getLogger(__name__)

app = FastAPI(
    title="SIH Vulnerability Scanner API",
    description="Backend for the Centralized Vulnerability Detection system.",
    version="0.2.0"  # Version bump for multi-index RAG
)

# --- CORS ---
origins = [
    "http://161.118.189.151",      # <--- Nginx (Port 80)
    "http://161.118.189.151:5173", # Direct access (Backup)
    "http://localhost",
    "http://localhost:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/rag/stats", tags=["Health"])
def rag_stats():
    """Get statistics for all RAG sources."""
    return {
        "sources": get_rag_stats(),
        "fallback_mode": is_fallback_mode(),
    }

def is_fallback_mode() -> bool:
    """Check if system should use legacy single-index mode."""
    return os.getenv("RAG_FALLBACK_MODE", "false").lower() == "true"

app.include_router(api_router)

@app.on_event("startup")
async def startup():
    # 1. Initialize Redis
    redis = aioredis.from_url(settings.REDIS_URL)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    
    # 2. Get RAG storage path
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    rag_storage = os.path.join(BASE_DIR, "rag_storage")
    
    # 3. Check for fallback mode
    if is_fallback_mode():
        logger.warning("RAG_FALLBACK_MODE=true: Using legacy single-index RAG")
        # Load legacy single-index RAG
        index_path = os.path.join(rag_storage, "faiss.index")
        metadata_path = os.path.join(rag_storage, "metadata.json")
        rag.load_resources(index_path=index_path, metadata_path=metadata_path)
    else:
        # Initialize Multi-Index RAG System
        logger.info("Initializing multi-index RAG system...")
        results = initialize_all_rags(rag_storage)
        
        # Log summary
        loaded = sum(1 for v in results.values() if v)
        total = len(results)
        logger.info(f"Multi-index RAG ready: {loaded}/{total} sources loaded")
        
        # Also load legacy RAG as backup (optional)
        # This allows gradual migration
        try:
            index_path = os.path.join(rag_storage, "faiss.index")
            metadata_path = os.path.join(rag_storage, "metadata.json")
            if os.path.exists(index_path) and os.path.exists(metadata_path):
                rag.load_resources(index_path=index_path, metadata_path=metadata_path)
                logger.info("Legacy RAG also loaded (backup)")
        except Exception as e:
            logger.warning(f"Legacy RAG not loaded: {e}")


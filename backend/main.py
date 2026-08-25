from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from app.config import settings
import os
import logging

# Unified single-index RAG engine
from app.rag import rag
from update_db import patch_database_schema

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CyberRakshak Vulnerability Scanner API",
    description="Backend for the Centralized Vulnerability Detection system.",
    version="0.3.0"  # Version bump for unified RAG
)

# --- CORS ---
origins = [
    "http://161.118.189.151",
    "http://161.118.189.151:80",
    "http://161.118.189.151:5173",
    "http://161.118.189.151:8080",
    "https://161.118.189.151",
    "https://161.118.189.151:8080",
    "http://localhost",
    "http://localhost:80",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:80",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://cyberrakshak.govt.hu",
    "https://cyberrakshak.govt.hu",
    "http://cyberrakshak.govt.hu:5173",
    "https://cyberrakshak.govt.hu:5173",
    "http://cyberrakshak.govt.hu:8080",
    "https://cyberrakshak.govt.hu:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|161\.118\.189\.151|([a-zA-Z0-9-]+\.)*cyberrakshak\.govt\.hu)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/rag/stats", tags=["Health"])
def rag_stats():
    """Get statistics for the unified RAG index."""
    return rag.get_stats()

app.include_router(api_router)

@app.on_event("startup")
async def startup():
    # 0. Synchronize & patch database schema
    try:
        patch_database_schema()
    except Exception as e:
        logger.error(f"Failed to auto-patch database schema: {e}")

    # 1. Initialize Redis
    redis = aioredis.from_url(settings.REDIS_URL)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

    # 2. Load unified RAG index
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    rag_storage = os.path.join(BASE_DIR, settings.RAG_STORAGE_PATH)

    index_path = os.path.join(rag_storage, "cve_index.faiss")
    metadata_path = os.path.join(rag_storage, "metadata_shard.jsonl")

    logger.info(f"Loading unified RAG index from {rag_storage}...")
    rag.load_resources(index_path=index_path, metadata_path=metadata_path)

    if rag.is_available():
        stats = rag.get_stats()
        logger.info(f"RAG ready: {stats['vectors']} vectors, {stats['metadata_entries']} metadata entries")
    else:
        logger.warning("RAG index not loaded — chat assistant will operate without retrieval context")

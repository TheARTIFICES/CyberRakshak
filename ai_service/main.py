import os
import requests
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

# --- CONFIGURATION ---
app = FastAPI(title="CyberRakshak AI Service")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = 6333
COLLECTION_NAME = "cyber_kb"

# --- MODELS (CPU Optimized) ---
logger.info("Loading Embedding Model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

logger.info(f"Connecting to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}...")
qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

# --- API SCHEMAS ---
class ChatRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class IngestRequest(BaseModel):
    text: str
    metadata: Optional[dict] = {}

# --- HELPER FUNCTIONS ---
def get_ollama_response(prompt: str, model: str = "llama3"):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.3, "num_ctx": 4096}
    }
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
        resp.raise_for_status()
        return resp.json().get("response", "")
    except Exception as e:
        logger.error(f"Ollama Error: {e}")
        return f"Error connecting to AI engine: {str(e)}"

def ensure_collection():
    try:
        cols = qdrant.get_collections().collections
        if not any(c.name == COLLECTION_NAME for c in cols):
            qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config={"size": 384, "distance": "Cosine"}
            )
            logger.info(f"Created collection: {COLLECTION_NAME}")
    except Exception as e:
        logger.error(f"Qdrant Init Error: {e}")

@app.on_event("startup")
async def startup_event():
    ensure_collection()

# --- ENDPOINTS ---

@app.post("/generate")
async def generate(req: ChatRequest):
    logger.info(f"Received query: {req.query}")
    vector = embedder.encode(req.query).tolist()
    context_text = ""
    sources = []
    try:
        hits = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=vector,
            limit=req.top_k
        )
        for hit in hits:
            payload = hit.payload or {}
            text = payload.get("text", "")
            context_text += f"- {text}\n"
            sources.append(payload)
    except Exception as e:
        logger.warning(f"Search failed (index might be empty): {e}")

    if not context_text:
        context_text = "No specific context found in knowledge base."

    prompt = f"""
    You are Cyra, an expert cybersecurity assistant.
    Answer the user question based STRICTLY on the context provided below.
    
    === CONTEXT ===
    {context_text}
    ===============
    
    USER QUESTION: {req.query}
    
    ANSWER:
    """
    answer = get_ollama_response(prompt)
    return {"response": answer, "sources": sources}

@app.post("/ingest")
async def ingest(req: IngestRequest):
    try:
        vector = embedder.encode(req.text).tolist()
        import hashlib
        doc_id = hashlib.md5(req.text.encode()).hexdigest()
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[{
                "id": doc_id,
                "vector": vector,
                "payload": {"text": req.text, **req.metadata}
            }]
        )
        return {"status": "success", "id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "online"}

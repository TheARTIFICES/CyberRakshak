import os
import httpx
import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")

# Configuration for remote GPU calls
# TIMEOUT: 1800 seconds = 30 minutes. Adjust if needed for longer/shorter waits.
TIMEOUT_CONFIG = httpx.Timeout(1800.0, connect=60.0)
HEADERS = {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json"
}

async def get_remote_embedding(text: str) -> Optional[List[float]]:
    """
    Calls POST /embed on the external GPU service.
    Enforces "query: " prefix and L2 normalization logic.
    """
    if not AI_SERVICE_URL:
        logger.error("AI_SERVICE_URL not set.")
        return None

    url = f"{AI_SERVICE_URL.rstrip('/')}/embed"

    # 1. Enforce Prefixing Rule
    # The nomic-embed-text-v1.5 model requires "search_query: " prefix for retrieval queries.
    if not text.startswith("search_query: "):
        text = f"search_query: {text}"
    
    payload = {"text": text}

    try:
        # Log payload for verification (temporary)
        logger.info(f"Embedding Request Payload: {payload}")

        async with httpx.AsyncClient(timeout=TIMEOUT_CONFIG) as client:
            response = await client.post(url, json=payload, headers=HEADERS)
            
        if response.status_code == 200:
            data = response.json()
            # Expecting format: {"embedding": [float...], "dim": 768}
            raw_embedding = data.get("embedding")
            
            if raw_embedding:
                # 2. Enforce L2 Normalization
                # FAISS IndexFlatIP requires normalized vectors.
                try:
                    import numpy as np
                    vec = np.array(raw_embedding, dtype=np.float32)
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                        
                    # Log norm for verification (temporary)
                    logger.info(f"Embedding Norm: {norm:.4f} -> {np.linalg.norm(vec):.4f}")
                    
                    return vec.tolist()
                except ImportError:
                    logger.warning("Numpy not found. Returning raw embedding (may reduce retrieval quality).")
                    return raw_embedding
            return None
        else:
            logger.error(f"Embedding failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Embedding Connection Error: {e}")
        return None

async def generate_llm_response(prompt: str) -> str:
    """
    Calls POST /generate on the external GPU service.
    """
    if not AI_SERVICE_URL:
        return '{"analysis": "System Error: AI URL not configured."}'

    url = f"{AI_SERVICE_URL.rstrip('/')}/generate"
    payload = {"prompt": prompt}

    try:
        logger.info(f"Sending prompt to LLM (Length: {len(prompt)})")
        async with httpx.AsyncClient(timeout=TIMEOUT_CONFIG) as client:
            response = await client.post(url, json=payload, headers=HEADERS)
            
        if response.status_code == 200:
            result = response.json()
            # Expecting format: {"response": "..."}
            return result.get("response", "")
        else:
            logger.error(f"Generation failed: {response.status_code}")
            return f"Error: AI Service returned {response.status_code}"

    except httpx.ReadTimeout:
        return "Error: The model took too long to respond."
    except Exception as e:
        logger.error(f"Generation Connection Error: {e}")
        return f"Error: {str(e)}"

# Deprecated: Keep purely for legacy compatibility if needed, 
# but ChatAssistantService will now use the functions above.
async def generate_ai_response(payload: dict) -> str:
    return await generate_llm_response(json.dumps(payload))

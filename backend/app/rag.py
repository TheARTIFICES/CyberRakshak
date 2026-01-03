import os
import json
import logging
import numpy as np
import faiss
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    DEPRECATED: Legacy single-index RAG engine.
    
    Kept for:
    - Fallback mode during issues
    - Safe rollback during first deploy
    - Single-index debugging mode
    
    Use RAG_FALLBACK_MODE=true to enable this engine.
    
    For new code, use app.rag_registry instead.
    """
    
    def __init__(self):
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict] = []
        self.dim = 1024  # Matches BAAI/bge-large-en-v1.5 dimensions
        # NOTE: This system is CPU-only.
        # Artifacts (faiss.index, metadata.json) are generated OFFLINE on a GPU machine.
    
    @staticmethod
    def is_fallback_mode() -> bool:
        """Check if system should use legacy single-index mode."""
        return os.getenv("RAG_FALLBACK_MODE", "false").lower() == "true"

    def load_resources(self, index_path: str = "rag_storage/faiss.index", metadata_path: str = "rag_storage/metadata.json"):
        """
        Loads FAISS index and metadata from disk into memory (CPU).
        Must be called at application startup.
        """
        if not os.path.exists(index_path) or not os.path.exists(metadata_path):
            logger.warning(f"RAG artifacts not found at {index_path}. RAG will be disabled.")
            return

        try:
            logger.info(f"Loading RAG Index from {index_path}...")
            # Load FAISS index (CPU-mapped)
            self.index = faiss.read_index(index_path)
            
            # Load Metadata (Chunks)
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

            logger.info(f"RAG Initialized: {self.index.ntotal} vectors loaded with {len(self.metadata)} metadata entries.")
        
        except Exception as e:
            logger.error(f"CRITICAL: Failed to load RAG system: {str(e)}")
            self.index = None
            self.metadata = []

    def search(self, embedding: List[float], k: int = 5) -> List[Dict]:
        """
        Performs vector search on the local CPU FAISS index.
        The query vector MUST be L2-normalized before search (handled by client + here).
        """
        if not self.index:
            return []

        if len(embedding) != self.dim:
            logger.error(f"Embedding dimension mismatch. Expected {self.dim}, got {len(embedding)}")
            return []

        try:
            # Convert to float32 numpy array required by FAISS
            query_vector = np.array([embedding], dtype=np.float32)
            
            # Normalize vector (Required for IndexFlatIP to behave like Cosine Similarity)
            faiss.normalize_L2(query_vector)

            # Perform search
            distances, indices = self.index.search(query_vector, k)
            
            results = []
            # indices[0] contains the IDs of the neighbors
            for idx in indices[0]:
                if idx != -1 and idx < len(self.metadata):
                    # Append the metadata chunk (assumed to have 'text' and 'source' fields)
                    results.append(self.metadata[idx])
            
            return results
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

# Singleton instance
rag = RAGEngine()

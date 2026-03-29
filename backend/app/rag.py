"""
RAG Engine - Unified Single-Index Architecture

Loads a single FAISS index (cve_index.faiss) and JSONL metadata
(metadata_shard.jsonl) into RAM at startup. All queries search
the same consolidated index.

Embedding model: nomic-embed-text-v1.5 (768 dimensions)
Prefix convention: "search_query: <text>"

Data files expected in RAG_STORAGE_PATH:
  - cve_index.faiss       (~3GB unified FAISS index)
  - metadata_shard.jsonl   (one JSON object per line, position = FAISS ID)
"""

import os
import json
import logging
import numpy as np
import faiss
from typing import List, Dict, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RAGResult:
    """A single retrieval result from the unified index."""
    faiss_id: int
    cve_id: str
    chunk_index: int
    total_chunks: int
    cvss: str
    severity: str
    has_exploitdb: bool
    source_file: str
    text: str
    score: float  # similarity score from FAISS


class RAGEngine:
    """
    Unified single-index RAG engine.

    Loads one FAISS index + one JSONL metadata file into RAM.
    All queries search the same index — no per-source routing needed.
    """

    def __init__(self):
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict] = []
        self.dim = 768  # nomic-embed-text-v1.5 output dimension
        self._loaded = False

    def load_resources(
        self,
        index_path: str = "rag_storage/cve_index.faiss",
        metadata_path: str = "rag_storage/metadata_shard.jsonl",
    ):
        """
        Loads FAISS index and JSONL metadata into RAM.
        Must be called ONCE at application startup.
        """
        if not os.path.exists(index_path):
            logger.warning(f"FAISS index not found at {index_path}. RAG disabled.")
            return

        if not os.path.exists(metadata_path):
            logger.warning(f"Metadata not found at {metadata_path}. RAG disabled.")
            return

        try:
            # Load FAISS index (CPU-mapped)
            logger.info(f"Loading FAISS index from {index_path}...")
            self.index = faiss.read_index(index_path)
            logger.info(f"FAISS index loaded: {self.index.ntotal} vectors, dim={self.index.d}")

            # Validate dimension
            if self.index.d != self.dim:
                logger.warning(
                    f"Dimension mismatch: index has {self.index.d}, expected {self.dim}. "
                    f"Updating engine dim to match index."
                )
                self.dim = self.index.d

            # Load JSONL metadata (one JSON object per line, line number = FAISS ID)
            logger.info(f"Loading metadata from {metadata_path}...")
            self.metadata = []
            with open(metadata_path, "r", encoding="utf-8") as f:
                for line_num, line in enumerate(f):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        doc = json.loads(line)
                        self.metadata.append(doc)
                    except json.JSONDecodeError as e:
                        logger.warning(f"Skipping malformed JSON at line {line_num}: {e}")
                        self.metadata.append({"text": "", "cve_id": "unknown"})

            self._loaded = True
            logger.info(
                f"RAG Engine ready: {self.index.ntotal} vectors, "
                f"{len(self.metadata)} metadata entries"
            )

        except Exception as e:
            logger.error(f"CRITICAL: Failed to load RAG system: {e}")
            self.index = None
            self.metadata = []
            self._loaded = False

    def is_available(self) -> bool:
        """Check if the index is loaded and ready for queries."""
        return self._loaded and self.index is not None

    def get_stats(self) -> Dict:
        """Return index statistics."""
        return {
            "available": self.is_available(),
            "vectors": self.index.ntotal if self.index else 0,
            "dimension": self.dim,
            "metadata_entries": len(self.metadata),
        }

    def search(self, embedding: List[float], k: int = 5) -> List[RAGResult]:
        """
        Perform similarity search against the unified FAISS index.

        Args:
            embedding: Query vector (must be 768-dim, L2-normalized)
            k: Number of top results to return

        Returns:
            List of RAGResult objects with text + metadata + similarity score
        """
        if not self.is_available():
            logger.warning("RAG search called but index is not loaded.")
            return []

        if len(embedding) != self.dim:
            logger.error(
                f"Embedding dimension mismatch: got {len(embedding)}, expected {self.dim}"
            )
            return []

        try:
            # Convert to float32 numpy array
            query_vector = np.array([embedding], dtype=np.float32)

            # Normalize (required for IndexFlatIP → cosine similarity)
            faiss.normalize_L2(query_vector)

            # Search
            distances, indices = self.index.search(query_vector, k)

            results: List[RAGResult] = []
            for rank, (idx, score) in enumerate(zip(indices[0], distances[0])):
                if idx == -1:
                    continue
                if idx >= len(self.metadata):
                    logger.warning(f"FAISS returned ID {idx} but metadata only has {len(self.metadata)} entries")
                    continue

                doc = self.metadata[idx]
                results.append(RAGResult(
                    faiss_id=int(idx),
                    cve_id=doc.get("cve_id", "unknown"),
                    chunk_index=doc.get("chunk_index", 0),
                    total_chunks=doc.get("total_chunks", 1),
                    cvss=doc.get("cvss", "N/A"),
                    severity=doc.get("severity", "unknown"),
                    has_exploitdb=doc.get("has_exploitdb", False),
                    source_file=doc.get("source_file", ""),
                    text=doc.get("text", ""),
                    score=float(score),
                ))

            return results

        except Exception as e:
            logger.error(f"FAISS search failed: {e}")
            return []

    def search_by_metadata(self, query: str, k: int = 5) -> List[RAGResult]:
        """
        Search metadata by CVE ID or text content (no embedding needed).
        Useful for verification and debugging without the remote GPU.

        Searches cve_id first, then falls back to text content matching.
        """
        if not self.is_available():
            logger.warning("RAG not loaded.")
            return []

        query_lower = query.lower().strip()
        results: List[RAGResult] = []

        for idx, doc in enumerate(self.metadata):
            cve_id = doc.get("cve_id", "").lower()
            text = doc.get("text", "").lower()

            # Match on CVE ID or text content
            if query_lower in cve_id or query_lower in text:
                results.append(RAGResult(
                    faiss_id=idx,
                    cve_id=doc.get("cve_id", "unknown"),
                    chunk_index=doc.get("chunk_index", 0),
                    total_chunks=doc.get("total_chunks", 1),
                    cvss=doc.get("cvss", "N/A"),
                    severity=doc.get("severity", "unknown"),
                    has_exploitdb=doc.get("has_exploitdb", False),
                    source_file=doc.get("source_file", ""),
                    text=doc.get("text", ""),
                    score=1.0,  # metadata match, not vector similarity
                ))

                if len(results) >= k:
                    break

        return results


# Singleton instance — loaded once at startup via main.py
rag = RAGEngine()

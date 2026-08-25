"""
RAG Logger - Structured Pipeline Logging

Simplified for unified single-index architecture.
Logs intent, document count, latency, and doc IDs for debugging.
"""

import logging
import json
import time
from typing import List
from contextlib import contextmanager

# Dedicated logger for RAG pipeline
logger = logging.getLogger("rag.pipeline")


class RAGLogger:
    """Structured logging for RAG pipeline requests."""

    @staticmethod
    def log_request(
        intent: str,
        intent_confidence: float,
        documents_used: int,
        doc_ids_used: List[str],
        latency_ms: float,
        access_level: str = "none",
    ):
        """
        Log structured request data for debugging and evaluation.

        Args:
            intent: Classified intent type
            intent_confidence: Confidence score [0, 1]
            documents_used: Number of documents used in prompt
            doc_ids_used: Hashed content IDs for tracking
            latency_ms: Total pipeline latency
            access_level: User's access level
        """
        log_entry = {
            "intent": intent,
            "intent_confidence": round(intent_confidence, 3),
            "documents_used": documents_used,
            "doc_ids_used": doc_ids_used,
            "latency_ms": round(latency_ms, 2),
            "access_level": access_level,
        }
        logger.info(json.dumps(log_entry))

    @staticmethod
    @contextmanager
    def timer():
        """Context manager for timing RAG operations."""
        start = time.perf_counter()
        yield lambda: (time.perf_counter() - start) * 1000


# Singleton instance
rag_logger = RAGLogger()

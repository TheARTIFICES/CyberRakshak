"""
RAG Logger - Structured Pipeline Logging for Debugging and Evaluation

This module provides:
- RAGLogger: Structured logging with per-source rag_used and doc_ids
- Timer context manager for latency measurement
"""

import logging
import json
import time
from typing import List, Dict
from contextlib import contextmanager

# Create dedicated logger for RAG pipeline
logger = logging.getLogger("rag.pipeline")


class RAGLogger:
    """Structured logging for RAG pipeline requests."""
    
    @staticmethod
    def log_request(
        intent: str,
        intent_confidence: float,
        rags_queried: List[str],
        rag_used: Dict[str, bool],      # Per-source: {"cve": True, "exploitdb": False, ...}
        documents_used: int,
        doc_ids_used: List[str],        # Hashed doc IDs for iteration/pruning
        latency_ms: float,
        access_level: str = "none",
        explicit_exploit_request: bool = False,
        docs_filtered_by_maturity: int = 0,
        docs_filtered_by_dedup: int = 0,
    ):
        """
        Log structured request data for debugging and model evaluation.
        
        Args:
            intent: Classified intent type
            intent_confidence: Confidence score [0, 1]
            rags_queried: List of RAG sources that were queried
            rag_used: Per-source dict showing which returned results
            documents_used: Number of documents after fusion
            doc_ids_used: Hashed content IDs for tracking
            latency_ms: Total pipeline latency
            access_level: User's access level
            explicit_exploit_request: Whether user asked for exploit code
            docs_filtered_by_maturity: Count of docs filtered by maturity
            docs_filtered_by_dedup: Count of docs filtered by deduplication
        
        Logged data enables:
        - Debugging which sources returned results
        - Measuring which docs influence answers
        - Pruning bad/overused data
        - A/B testing RAG configurations
        """
        log_entry = {
            "intent": intent,
            "intent_confidence": round(intent_confidence, 3),
            "rags_queried": rags_queried,
            "rag_used": rag_used,
            "documents_used": documents_used,
            "doc_ids_used": doc_ids_used,
            "latency_ms": round(latency_ms, 2),
            "access_level": access_level,
            "explicit_exploit_request": explicit_exploit_request,
            "docs_filtered_by_maturity": docs_filtered_by_maturity,
            "docs_filtered_by_dedup": docs_filtered_by_dedup,
        }
        logger.info(json.dumps(log_entry))
    
    @staticmethod
    @contextmanager
    def timer():
        """
        Context manager for timing RAG operations.
        
        Usage:
            with RAGLogger.timer() as get_elapsed:
                # ... do work ...
                elapsed_ms = get_elapsed()
        """
        start = time.perf_counter()
        yield lambda: (time.perf_counter() - start) * 1000


# Singleton instance
rag_logger = RAGLogger()

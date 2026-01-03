"""
RAG Registry - Multi-Index RAG System with Strict Schema Normalization

This module provides:
- NormalizedDocument: Canonical schema for all RAG documents
- RAGSource: Base class for all RAG sources
- RAG_REGISTRY: Registry of all available RAG sources
- SOURCE_TOP_K: Per-source retrieval limits
"""

import os
import json
import logging
import hashlib
import numpy as np
import faiss
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ExploitMaturity(str, Enum):
    """Exploit maturity levels for gating."""
    THEORETICAL = "theoretical"
    POC = "poc"
    WEAPONIZED = "weaponized"


@dataclass
class NormalizedDocument:
    """
    Canonical RAG document schema - NO missing keys, NO None values.
    All fields are guaranteed to be populated with at least 'unknown'.
    """
    source: str           # cve | nuclei | exploitdb | linpeas | gtfobins | payloads | mitre | nmap
    category: str         # web | privesc | exploit | recon | misconfig
    title: str            # Short human-readable title
    description: str      # What this technique or vulnerability does
    technique: str        # Path Traversal | SUID Abuse | RCE | etc
    attack_phase: str     # recon | initial-access | privesc | post-exploitation
    os: str               # linux | windows | cross
    service: str          # apache | sudo | kernel | n/a
    prerequisites: List[str]
    exploit_type: str     # info-leak | command-exec | escalation
    embedding_text: str   # FULL text used for vector search (long, descriptive)
    display_text: str     # SUMMARIZED text used in prompts (short, with impact line)
    confidence: str       # high | medium | low
    exploit_maturity: str # theoretical | poc | weaponized
    doc_id: str           # Unique ID for deduplication (content hash)


# Per-source top_k limits (reduces FAISS work, fusion does final selection)
SOURCE_TOP_K: Dict[str, int] = {
    "cve": 10,       # Noisy, needs more candidates
    "nuclei": 10,    # Noisy, needs more candidates
    "exploitdb": 6,  # Dense, high signal
    "payloads": 6,
    "metasploit": 6,
    "linpeas": 6,    # Dense, high signal
    "gtfobins": 6,
    "mitre": 6,
    "nmap": 6,
    "owasp": 6,
    "http": 4,
}


class RAGSource:
    """
    Base class for all RAG sources with standardized interface.
    Each subclass handles its own FAISS index and metadata file.
    """
    
    def __init__(self, source_name: str, index_prefix: str = None):
        """
        Initialize a RAG source.
        
        Args:
            source_name: Name of the source (e.g., 'cve', 'exploitdb')
            index_prefix: Prefix for index files (defaults to source_name)
        """
        self.source_name = source_name
        self.index_prefix = index_prefix or source_name
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict] = []
        self.dim = 1024  # Matches BAAI/bge-large-en-v1.5 dimensions
        self._loaded = False
    
    def load(self, storage_path: str) -> bool:
        """
        Load FAISS index and metadata from disk.
        Returns True if successful, False otherwise.
        """
        # Support versioned indices via environment variable
        version = os.getenv(f"ACTIVE_{self.source_name.upper()}_INDEX", self.index_prefix)
        
        index_path = os.path.join(storage_path, f"{version}_faiss.index")
        metadata_path = os.path.join(storage_path, f"{version}_metadata.json")
        
        if not os.path.exists(index_path) or not os.path.exists(metadata_path):
            logger.warning(f"RAG source '{self.source_name}': Files not found at {index_path}")
            return False
        
        try:
            logger.info(f"Loading RAG source '{self.source_name}' from {index_path}...")
            self.index = faiss.read_index(index_path)
            
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            
            self._loaded = True
            logger.info(f"RAG source '{self.source_name}': {self.index.ntotal} vectors, {len(self.metadata)} metadata entries")
            return True
            
        except Exception as e:
            logger.error(f"RAG source '{self.source_name}' failed to load: {e}")
            self.index = None
            self.metadata = []
            self._loaded = False
            return False
    
    def is_available(self) -> bool:
        """Check if index is loaded and ready."""
        return self._loaded and self.index is not None
    
    def get_stats(self) -> Dict:
        """Return index statistics."""
        return {
            "source": self.source_name,
            "available": self.is_available(),
            "vectors": self.index.ntotal if self.index else 0,
            "metadata_entries": len(self.metadata),
        }
    
    def search(self, embedding: List[float], top_k: int = 5) -> List[NormalizedDocument]:
        """
        Perform vector search and return normalized documents.
        Never returns raw dicts - always NormalizedDocument instances.
        """
        if not self.is_available():
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
            distances, indices = self.index.search(query_vector, top_k)
            
            results = []
            for idx in indices[0]:
                if idx != -1 and idx < len(self.metadata):
                    raw_doc = self.metadata[idx]
                    normalized = self._normalize_document(raw_doc)
                    results.append(normalized)
            
            return results
            
        except Exception as e:
            logger.error(f"RAG source '{self.source_name}' search failed: {e}")
            return []
    
    def _normalize_document(self, raw_doc: Dict) -> NormalizedDocument:
        """
        STRICT normalization - no missing keys, no None values.
        'unknown' is used instead of missing/None.
        """
        # Full text for vector search
        embedding_text = raw_doc.get("text", raw_doc.get("content", ""))
        
        # Generate stable doc_id from embedding text
        doc_id = hashlib.sha256(embedding_text.encode()).hexdigest()[:16]
        
        # Create display text with impact line
        display_text = self._create_display_text(raw_doc, embedding_text)
        
        return NormalizedDocument(
            source=raw_doc.get("source", self.source_name) if isinstance(raw_doc.get("source"), str) else self.source_name,
            category=raw_doc.get("category", "unknown") if isinstance(raw_doc.get("category"), str) else "unknown",
            title=raw_doc.get("title", raw_doc.get("name", "Untitled")),
            description=raw_doc.get("description", "No description available."),
            technique=raw_doc.get("technique", "unknown") if isinstance(raw_doc.get("technique"), str) else "unknown",
            attack_phase=raw_doc.get("attack_phase", "unknown"),
            os=raw_doc.get("os", "cross"),
            service=raw_doc.get("service", "n/a"),
            prerequisites=raw_doc.get("prerequisites", []) if isinstance(raw_doc.get("prerequisites"), list) else [],
            exploit_type=raw_doc.get("exploit_type", "unknown"),
            embedding_text=embedding_text,
            display_text=display_text,
            confidence=raw_doc.get("confidence", "low"),
            exploit_maturity=raw_doc.get("exploit_maturity", "poc"),  # Default: poc
            doc_id=doc_id,
        )
    
    def _create_display_text(self, raw_doc: Dict, full_text: str, max_chars: int = 400) -> str:
        """
        Create concise display text for prompt injection.
        ALWAYS includes 'Why it matters' impact line.
        """
        # Build the core content
        summary = raw_doc.get("summary", raw_doc.get("description", ""))
        if not summary:
            summary = full_text[:300] if len(full_text) > 300 else full_text
        
        # MANDATORY: Add impact line for LLM reasoning
        impact = raw_doc.get("impact", raw_doc.get("risk", ""))
        if not impact:
            # Generate a reasonable impact from available data
            technique = raw_doc.get("technique", "")
            exploit_type = raw_doc.get("exploit_type", "")
            if exploit_type == "command-exec":
                impact = "Allows arbitrary command execution on the target system."
            elif exploit_type == "info-leak":
                impact = "May expose sensitive data such as credentials or configuration files."
            elif exploit_type == "escalation":
                impact = "Enables privilege escalation to higher access levels."
            elif technique:
                impact = f"Enables {technique} attack vector."
            else:
                impact = "Security impact - see details above."
        
        # Construct final display text
        why_it_matters = f"\nWhy it matters: {impact}"
        
        # Truncate summary if needed to fit impact line
        available_chars = max_chars - len(why_it_matters) - 10
        if len(summary) > available_chars:
            summary = summary[:available_chars].rsplit(' ', 1)[0] + "..."
        
        return summary + why_it_matters


# =============================================================================
# SOURCE-SPECIFIC CLASSES
# =============================================================================

class CVERag(RAGSource):
    """CVE vulnerability database."""
    def __init__(self):
        super().__init__("cve", "cve")


class NucleiRag(RAGSource):
    """Nuclei vulnerability templates."""
    def __init__(self):
        super().__init__("nuclei", "nuclei")


class ExploitDBRag(RAGSource):
    """ExploitDB exploit database."""
    def __init__(self):
        super().__init__("exploitdb", "exploitdb")


class LinpeasRag(RAGSource):
    """LinPEAS privilege escalation checks."""
    def __init__(self):
        super().__init__("linpeas", "linpeas")


class GTFOBinsRag(RAGSource):
    """GTFOBins Unix binaries for privilege escalation."""
    def __init__(self):
        super().__init__("gtfobins", "gtfobins")


class PayloadsRag(RAGSource):
    """Payload collection."""
    def __init__(self):
        super().__init__("payloads", "pay")  # Maps to pay_faiss.index


class MitreRag(RAGSource):
    """MITRE ATT&CK framework."""
    def __init__(self):
        super().__init__("mitre", "mitre")


class NmapRag(RAGSource):
    """Nmap scripts and service detection."""
    def __init__(self):
        super().__init__("nmap", "nmap")


class MetasploitRag(RAGSource):
    """Metasploit modules."""
    def __init__(self):
        super().__init__("metasploit", "metasploit")


class OWASPRag(RAGSource):
    """OWASP security guidelines."""
    def __init__(self):
        super().__init__("owasp", "owasp")


class HTTPRag(RAGSource):
    """HTTP-related security knowledge."""
    def __init__(self):
        super().__init__("http", "http")


# =============================================================================
# REGISTRY
# =============================================================================

RAG_REGISTRY: Dict[str, RAGSource] = {
    "cve": CVERag(),
    "nuclei": NucleiRag(),
    "exploitdb": ExploitDBRag(),
    "linpeas": LinpeasRag(),
    "gtfobins": GTFOBinsRag(),
    "payloads": PayloadsRag(),
    "mitre": MitreRag(),
    "nmap": NmapRag(),
    "metasploit": MetasploitRag(),
    "owasp": OWASPRag(),
    "http": HTTPRag(),
}


def initialize_all_rags(storage_path: str) -> Dict[str, bool]:
    """
    Initialize all RAG sources from the given storage path.
    Returns a dict of source_name -> success status.
    """
    results = {}
    for name, source in RAG_REGISTRY.items():
        success = source.load(storage_path)
        results[name] = success
    
    # Log summary
    loaded = sum(1 for v in results.values() if v)
    total = len(results)
    logger.info(f"RAG initialization complete: {loaded}/{total} sources loaded")
    
    return results


def get_rag_stats() -> List[Dict]:
    """Get statistics for all RAG sources."""
    return [source.get_stats() for source in RAG_REGISTRY.values()]

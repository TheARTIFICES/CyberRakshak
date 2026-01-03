"""
RAG Fusion - Deduplication, Priority Ranking, and Context Control

This module provides:
- FusionConfig: Configuration for limits and budgets
- RAGFusion: Main fusion class with all filtering stages
- Exploit maturity gating
- Group-level and per-source limits
- Cross-turn deduplication support
- Token budget enforcement
"""

from typing import List, Dict, Set, Optional
from dataclasses import dataclass, field

from app.rag_registry import NormalizedDocument, ExploitMaturity
from app.rag_routing import RAG_PRIORITY


@dataclass
class FusionConfig:
    """Configuration for RAG fusion."""
    max_total_tokens: int = 1200
    
    # Per-source document limits
    source_limits: Dict[str, int] = field(default_factory=lambda: {
        "cve": 2,
        "exploitdb": 2,
        "payloads": 2,
        "linpeas": 2,
        "gtfobins": 2,
        "nuclei": 3,
        "mitre": 2,
        "nmap": 2,
        "metasploit": 2,
        "owasp": 2,
        "http": 1,
    })
    
    # Group-level limits (applied BEFORE token truncation)
    group_limits: Dict[str, int] = field(default_factory=lambda: {
        "vuln": 4,      # cve, nuclei, owasp
        "exploit": 4,   # exploitdb, payloads, metasploit
        "privesc": 3,   # linpeas, gtfobins
        "recon": 3,     # nmap, mitre, http
    })
    
    # Source-to-group mapping
    source_groups: Dict[str, str] = field(default_factory=lambda: {
        "cve": "vuln",
        "nuclei": "vuln",
        "owasp": "vuln",
        "exploitdb": "exploit",
        "payloads": "exploit",
        "metasploit": "exploit",
        "linpeas": "privesc",
        "gtfobins": "privesc",
        "nmap": "recon",
        "mitre": "recon",
        "http": "recon",
    })


# Default configuration
DEFAULT_CONFIG = FusionConfig()

# HARD CAP: Maximum exploit-style documents per turn (safety valve against dilution)
# Set to 0 to DISABLE this limit
MAX_EXPLOIT_DOCS_PER_TURN = 4
EXPLOIT_SOURCES = {"exploitdb", "payloads", "metasploit"}

# Access levels that grant access to weaponized exploits
OFFENSIVE_ACCESS_LEVELS = {"authenticated", "user", "admin", "root", "shell"}


class RAGFusion:
    """
    Fuses documents from multiple RAG sources with:
    1. Exploit maturity gating
    2. Per-source limits
    3. Deduplication (by technique + cross-turn)
    4. Group-level limits
    5. Priority sorting
    6. Token budget truncation
    7. Hard cap on exploit docs
    """
    
    def __init__(self, config: FusionConfig = None):
        self.config = config or DEFAULT_CONFIG
    
    def fuse(
        self,
        docs_by_source: Dict[str, List[NormalizedDocument]],
        access_level: str = "none",
        explicit_exploit_request: bool = False,
        recent_doc_ids: Optional[Set[str]] = None,
    ) -> List[NormalizedDocument]:
        """
        Fuse documents from multiple sources.
        
        Args:
            docs_by_source: Documents grouped by source name
            access_level: Current access level for maturity gating
            explicit_exploit_request: True if user asked for exploit code
            recent_doc_ids: Doc IDs from recent turns for deduplication
        
        Returns:
            Fused, filtered, and prioritized list of documents
        """
        recent_doc_ids = recent_doc_ids or set()
        
        # Step 1: Filter by exploit maturity
        filtered_docs = self._apply_exploit_maturity_filter(
            docs_by_source, access_level, explicit_exploit_request
        )
        
        # Step 2: Apply per-source limits
        limited_docs = self._apply_source_limits(filtered_docs)
        
        # Step 3: Deduplicate by technique + cross-turn
        deduped_docs = self._deduplicate(limited_docs, recent_doc_ids)
        
        # Step 4: Apply group-level limits
        group_limited_docs = self._apply_group_limits(deduped_docs)
        
        # Step 5: Priority sort
        sorted_docs = self._priority_sort(group_limited_docs)
        
        # Step 6: Token truncation
        token_limited_docs = self._truncate_to_token_budget(sorted_docs)
        
        # Step 7: HARD CAP on exploit docs (last-line safety valve)
        final_docs = self._apply_exploit_hard_cap(token_limited_docs)
        
        return final_docs
    
    def _apply_exploit_maturity_filter(
        self,
        docs_by_source: Dict[str, List[NormalizedDocument]],
        access_level: str,
        explicit_exploit_request: bool,
    ) -> Dict[str, List[NormalizedDocument]]:
        """
        Gate weaponized exploits based on access level and explicit request.
        
        Default: Include theoretical and poc
        Weaponized: Only if access_level >= authenticated OR explicit request
        """
        offensive_access = access_level.lower() in OFFENSIVE_ACCESS_LEVELS
        allow_weaponized = offensive_access or explicit_exploit_request
        
        filtered = {}
        for source, docs in docs_by_source.items():
            filtered[source] = [
                doc for doc in docs
                if doc.exploit_maturity != ExploitMaturity.WEAPONIZED.value or allow_weaponized
            ]
        return filtered
    
    def _apply_source_limits(
        self, docs_by_source: Dict[str, List[NormalizedDocument]]
    ) -> List[NormalizedDocument]:
        """Apply per-source document limits."""
        all_docs = []
        for source, docs in docs_by_source.items():
            limit = self.config.source_limits.get(source, 3)
            all_docs.extend(docs[:limit])
        return all_docs
    
    def _deduplicate(
        self,
        docs: List[NormalizedDocument],
        recent_doc_ids: Set[str],
    ) -> List[NormalizedDocument]:
        """
        Deduplicate by:
        1. Exact doc_id (content hash)
        2. Same technique + same source
        3. Cross-turn (recent_doc_ids)
        """
        seen_ids: Set[str] = set()
        seen_techniques: Set[str] = set()
        deduped: List[NormalizedDocument] = []
        
        for doc in docs:
            # Defensive: ensure doc_id is string
            doc_id = doc.doc_id if isinstance(doc.doc_id, str) else "unknown"
            
            # Skip if seen in recent turns (cross-turn dedup)
            if doc_id in recent_doc_ids:
                continue
            
            # Skip exact duplicates
            if doc_id in seen_ids:
                continue
            
            # Defensive: ensure source and technique are strings
            source = doc.source if isinstance(doc.source, str) else "unknown"
            technique = doc.technique if isinstance(doc.technique, str) else "unknown"
            
            # Skip same technique from same source (allows diff techniques from same source)
            technique_key = f"{source}:{technique}"
            if technique_key in seen_techniques and technique != "unknown":
                continue
            
            seen_ids.add(doc_id)
            seen_techniques.add(technique_key)
            deduped.append(doc)
        
        return deduped
    
    def _apply_group_limits(
        self, docs: List[NormalizedDocument]
    ) -> List[NormalizedDocument]:
        """Apply group-level document limits."""
        group_counts: Dict[str, int] = {g: 0 for g in self.config.group_limits}
        result: List[NormalizedDocument] = []
        
        for doc in docs:
            # Defensive check: ensure source is a string (not dict)
            source = doc.source if isinstance(doc.source, str) else "unknown"
            
            group = self.config.source_groups.get(source, "other")
            limit = self.config.group_limits.get(group, 5)
            
            if group_counts.get(group, 0) < limit:
                result.append(doc)
                group_counts[group] = group_counts.get(group, 0) + 1
        
        return result
    
    def _priority_sort(
        self, docs: List[NormalizedDocument]
    ) -> List[NormalizedDocument]:
        """Sort by RAG_PRIORITY (exploitdb first, etc.)."""
        priority_map = {s: i for i, s in enumerate(RAG_PRIORITY)}
        # Defensive check: ensure source is string
        return sorted(docs, key=lambda d: priority_map.get(d.source if isinstance(d.source, str) else "unknown", 99))
    
    def _truncate_to_token_budget(
        self, docs: List[NormalizedDocument]
    ) -> List[NormalizedDocument]:
        """
        Truncate to stay within token budget.
        Uses display_text for budget calculation (what actually goes in prompt).
        """
        chars_per_token = 4
        max_chars = self.config.max_total_tokens * chars_per_token
        
        result: List[NormalizedDocument] = []
        total_chars = 0
        
        for doc in docs:
            # Use display_text (not embedding_text) for budget
            doc_chars = len(doc.display_text) + len(doc.title) + 50  # overhead for labels
            if total_chars + doc_chars <= max_chars:
                result.append(doc)
                total_chars += doc_chars
            else:
                break
        
        return result
    
    def _apply_exploit_hard_cap(
        self, docs: List[NormalizedDocument]
    ) -> List[NormalizedDocument]:
        """
        Apply hard cap on exploit-style documents.
        This is a last-line safety valve against dilution.
        Set MAX_EXPLOIT_DOCS_PER_TURN = 0 to disable.
        """
        if MAX_EXPLOIT_DOCS_PER_TURN == 0:
            return docs  # Disabled
        
        exploit_count = 0
        result: List[NormalizedDocument] = []
        
        for doc in docs:
            # Defensive check: ensure source is string
            source = doc.source if isinstance(doc.source, str) else "unknown"
            
            if source in EXPLOIT_SOURCES:
                if exploit_count < MAX_EXPLOIT_DOCS_PER_TURN:
                    result.append(doc)
                    exploit_count += 1
                # else: skip this exploit doc
            else:
                result.append(doc)
        
        return result


# Singleton instance
rag_fusion = RAGFusion()

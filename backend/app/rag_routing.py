"""
RAG Routing - Intent-to-RAG Source Mapping with Two-Stage Gating

This module provides:
- RoutingConfig: Configuration for primary/secondary sources
- RAG_ROUTING: Intent -> RAG source mapping
- RAG_PRIORITY: Priority order for fusion
- get_rag_sources_for_intent(): Returns sources based on intent and context
"""

import os
from typing import List, Dict, Optional
from dataclasses import dataclass, field

from app.intent_classifier import IntentType


@dataclass
class RoutingConfig:
    """
    Configuration for RAG source routing.
    
    primary: Always queried for this intent
    secondary: Only queried if secondary_condition is met
    secondary_condition: When to include secondary sources
        - None: Always include
        - "explicit_exploit_request": Include if user asks for exploit code
        - "offensive_access_level": Include if access level implies offensive action
    """
    primary: List[str]
    secondary: List[str] = field(default_factory=list)
    secondary_condition: Optional[str] = None


# Two-stage routing configuration
RAG_ROUTING: Dict[IntentType, RoutingConfig] = {
    IntentType.RECON: RoutingConfig(
        primary=["nmap", "mitre"]
    ),
    IntentType.VULN_CHECK: RoutingConfig(
        primary=["cve", "nuclei", "owasp"]
    ),
    IntentType.EXPLOIT: RoutingConfig(
        primary=["exploitdb", "payloads", "metasploit"],
        secondary=["cve", "nuclei"],
        secondary_condition=None  # Always include secondary for exploit intent
    ),
    IntentType.PRIVESC: RoutingConfig(
        primary=["linpeas", "gtfobins"],
        secondary=["exploitdb", "payloads"],
        secondary_condition="explicit_exploit_request"
    ),
    IntentType.TROUBLESHOOTING: RoutingConfig(
        primary=["linpeas", "nuclei", "cve", "owasp"],
        secondary=["exploitdb", "payloads"],
        secondary_condition="explicit_exploit_request"  # Prevent exploit dilution
    ),
    IntentType.PLANNING: RoutingConfig(
        primary=["mitre", "cve", "nuclei"]
    ),
    IntentType.GENERAL: RoutingConfig(
        primary=["cve", "mitre"]
    ),
}

# Priority order for fusion (highest to lowest)
# ExploitDB > Payloads > Metasploit > GTFOBins > LinPEAS > Nuclei > CVE > MITRE > Nmap > OWASP > HTTP
RAG_PRIORITY: List[str] = [
    "exploitdb", "payloads", "metasploit",
    "gtfobins", "linpeas",
    "nuclei", "cve",
    "mitre", "nmap", "owasp", "http",
]

# Access levels that imply offensive action
OFFENSIVE_ACCESS_LEVELS = ["authenticated", "user", "admin", "root", "shell"]


def get_rag_sources_for_intent(
    intent: IntentType,
    explicit_exploit_request: bool = False,
    access_level: str = "none"
) -> List[str]:
    """
    Returns list of RAG sources to query based on intent and context.
    
    Secondary sources are only included if:
    - secondary_condition is None (always include), OR
    - secondary_condition == "explicit_exploit_request" AND explicit_exploit_request is True, OR
    - secondary_condition == "offensive_access_level" AND access_level implies offensive action
    
    Args:
        intent: Classified intent type
        explicit_exploit_request: True if user explicitly asked for exploit code
        access_level: Current access level (none, user, admin, root, shell)
    
    Returns:
        List of RAG source names to query
    """
    config = RAG_ROUTING.get(intent, RAG_ROUTING[IntentType.GENERAL])
    
    sources = list(config.primary)
    
    if config.secondary:
        include_secondary = False
        
        if config.secondary_condition is None:
            include_secondary = True
        elif config.secondary_condition == "explicit_exploit_request":
            include_secondary = explicit_exploit_request
        elif config.secondary_condition == "offensive_access_level":
            include_secondary = access_level.lower() in OFFENSIVE_ACCESS_LEVELS
        
        if include_secondary:
            sources.extend(config.secondary)
    
    return sources


def get_rag_sources_for_intents(
    intents: List[IntentType],
    excluded_intents: List[IntentType] = None,
    explicit_exploit_request: bool = False,
    access_level: str = "none"
) -> List[str]:
    """
    Get RAG sources for MULTIPLE intents, excluding negated ones.
    
    Args:
        intents: List of detected intents (can be multi-intent)
        excluded_intents: Intents to exclude (from negation detection)
        explicit_exploit_request: True if user asked for exploit code
        access_level: Current access level
    
    Returns:
        Deduplicated, priority-sorted list of RAG sources
    """
    if excluded_intents is None:
        excluded_intents = []
    
    all_sources = set()
    
    # Collect sources for all intents
    for intent in intents:
        sources = get_rag_sources_for_intent(intent, explicit_exploit_request, access_level)
        all_sources.update(sources)
    
    # Remove PRIMARY sources from excluded intents (not secondary, to avoid over-exclusion)
    for excluded in excluded_intents:
        config = RAG_ROUTING.get(excluded, RAG_ROUTING[IntentType.GENERAL])
        # Only exclude primary sources, not secondary (they're often shared)
        all_sources -= set(config.primary)
    
    # Sort by priority
    return sorted(all_sources, key=get_source_priority)


def get_source_priority(source_name: str) -> int:
    """Get priority rank for a source (lower = higher priority)."""
    try:
        return RAG_PRIORITY.index(source_name)
    except ValueError:
        return 99  # Unknown sources get lowest priority


def get_all_sources() -> List[str]:
    """Get list of all configured RAG sources."""
    all_sources = set()
    for config in RAG_ROUTING.values():
        all_sources.update(config.primary)
        all_sources.update(config.secondary)
    return list(all_sources)


def get_routing_summary() -> Dict[str, Dict]:
    """Get routing configuration summary for debugging."""
    return {
        intent.value: {
            "primary": config.primary,
            "secondary": config.secondary,
            "condition": config.secondary_condition
        }
        for intent, config in RAG_ROUTING.items()
    }


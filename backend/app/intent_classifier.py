"""
Intent Classifier - Enhanced Deterministic Intent Detection

This module provides:
- IntentResult: Structured result with multi-intent, negation, and trivial detection
- classify_intent(): Main classification with all enhancements
- Typo correction, negation detection, multi-intent support
- Short/meta query handling
"""

import re
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# Intentionally NOT importing logger to keep this module pure/deterministic


class IntentType(Enum):
    """Supported intent types for RAG routing."""
    RECON = "recon"
    VULN_CHECK = "vuln_check"
    EXPLOIT = "exploit"
    PRIVESC = "privesc"
    TROUBLESHOOTING = "troubleshooting"
    PLANNING = "planning"
    GENERAL = "general"


@dataclass
class IntentResult:
    """Enhanced intent classification result."""
    primary_intents: List[IntentType]      # Can be multiple intents
    excluded_intents: List[IntentType]     # Negated intents to exclude
    explicit_exploit_request: bool         # User asked for exploit code/payload
    confidence: float                      # 0-1 confidence score
    is_trivial: bool                       # Short/greeting query (skip RAG)
    is_meta_query: bool                    # "What can you do?" type query
    normalized_query: str                  # Typo-corrected query


# =============================================================================
# TYPO CORRECTION
# =============================================================================

TOOL_CORRECTIONS = {
    # nmap
    "nmpa": "nmap", "nmaap": "nmap", "nmapp": "nmap",
    # exploit
    "explot": "exploit", "exploite": "exploit", "expoit": "exploit",
    # privilege
    "privelege": "privilege", "priviledge": "privilege", "priv": "privilege",
    # linpeas
    "linpees": "linpeas", "lynpeas": "linpeas", "lenpeas": "linpeas",
    # metasploit
    "metaspliot": "metasploit", "metsploit": "metasploit",
    "msfconsol": "msfconsole", "msf": "metasploit",
    # nuclei
    "nuclie": "nuclei", "nucelie": "nuclei", "nuceli": "nuclei",
    # gtfobins
    "gtfobins": "gtfobins", "gtfobin": "gtfobins",
    # vulnerability
    "vuln": "vulnerability", "vulns": "vulnerabilities",
    # enumeration
    "enum": "enumerate", "enumerat": "enumerate",
}

def normalize_query(query: str) -> str:
    """Fix common typos before classification."""
    words = query.split()
    corrected = []
    for word in words:
        lower = word.lower()
        if lower in TOOL_CORRECTIONS:
            corrected.append(TOOL_CORRECTIONS[lower])
        else:
            corrected.append(word)
    return " ".join(corrected)


# =============================================================================
# TRIVIAL / META QUERY DETECTION
# =============================================================================

MIN_QUERY_LENGTH = 5

TRIVIAL_PATTERNS = [
    r"^hi\b", r"^hello\b", r"^hey\b", r"^\?+$", r"^help$",
    r"^thanks\b", r"^thank\s+you\b", r"^ok\b", r"^okay\b",
    r"^yes\b", r"^no\b", r"^bye\b", r"^goodbye\b",
]

META_QUERY_PATTERNS = [
    r"what\s+can\s+you\s+do",
    r"how\s+do\s+(you|i)\s+use\s+(this|you)",
    r"what\s+are\s+your\s+(capabilities|features)",
    r"what\s+is\s+this\s+(tool|assistant|bot)",
    r"who\s+are\s+you",
    r"explain\s+(yourself|this\s+tool)",
]

def is_trivial_query(query: str) -> bool:
    """Return True if query is too short/trivial for RAG."""
    stripped = query.strip()
    if len(stripped) < MIN_QUERY_LENGTH:
        return True
    return any(re.match(p, stripped.lower()) for p in TRIVIAL_PATTERNS)

def is_meta_query(query: str) -> bool:
    """Return True if user is asking about the tool itself."""
    return any(re.search(p, query.lower()) for p in META_QUERY_PATTERNS)


# =============================================================================
# INTENT PATTERNS
# =============================================================================

INTENT_PATTERNS: Dict[IntentType, list] = {
    IntentType.RECON: [
        r"\bscan\b", r"\bscanning\b", r"\benumerat", r"\bdiscover", r"\bports?\b", 
        r"\bnmap\b", r"\bservices?\b", r"\bfingerprint", r"\brecon", r"\bnetwork",
        r"\bwhat.*running\b", r"\bopen\s+ports?\b", r"\bhost\b", r"\btarget\b",
        r"\bidentify\b", r"\bfind\s+.*server", r"\bmap\b", r"\bversion\b",
    ],
    IntentType.VULN_CHECK: [
        r"\bvulnerab", r"\bcve[-\s]?\d", r"\bcve\b", r"\bnuclei\b", r"\bcheck\b.*\bvuln",
        r"\bdetect\b", r"\bfind\b.*\bvuln", r"\bsecurity\s+scan", r"\baudit\b",
        r"\bmissing\s+patch", r"\boutdated\b", r"\baffected\b",
        r"\bpatch\b", r"\bcheck\s+for\b", r"\brun\b.*\bnuclei\b", r"\bserver\b.*\bvulnerab",
        r"\bweak\b", r"\binsecure\b", r"\bscan\b.*\bvuln",
    ],
    IntentType.EXPLOIT: [
        r"\bexploit", r"\brce\b", r"\bpayload", r"\bshell\b", r"\bexecut",
        r"\battack\b", r"\bpwn\b", r"\bhack\b", r"\bmetasploit", r"\bpoc\b",
        r"\bweapon", r"\bexploit\s+code", r"\breverse\s+shell", r"\bbind\s+shell",
        r"\bmodule\b", r"\bmsfconsole\b", r"\bremote\s+code", r"\bcommand\s+injection",
        r"\bcode\s+execution", r"\brun\b.*\bexploit",
    ],
    IntentType.PRIVESC: [
        r"\bprivilege", r"\bescalat", r"\broot\b", r"\badmin\b", r"\bsudo\b",
        r"\bsuid\b", r"\blinpeas\b", r"\bgtfobins\b", r"\bprivesc", r"\bcapabilit",
        r"\bsetuid\b", r"\bget\s+root\b", r"\brun\b.*\blinpeas\b", r"\belevat",
        r"\bbinaries\b", r"\bpeas\b", r"\bwinpeas\b", r"\blocal\s+priv",
        r"\brootkit\b",
    ],
    IntentType.TROUBLESHOOTING: [
        r"\berror\b", r"\bfail", r"\bnot\s+working", r"\bwhy\b",
        r"\bhow\s+to\s+fix", r"\bissue\b", r"\bproblem\b", r"\bdebug",
        r"\bcrash", r"\btimeout\b", r"\bconnection\s+refused", r"\bbroken\b",
        r"\bdoesn.t\s+work", r"\bwon.t\b", r"\bcan.t\b", r"\bkeeps\s+failing\b",
        r"\bnot\s+found\b", r"\bnot\s+responding\b",
    ],
    IntentType.PLANNING: [
        r"\bplan\b", r"\bstrategy", r"\bapproach", r"\bnext\s+steps?",
        r"\brecommend", r"\badvise", r"\bprioritiz", r"\bwhat\s+should\s+i",
        r"\bhow\s+to\s+proceed", r"\bwhat.*next\b", r"\bbest\b.*\b(way|approach|method)\b",
        r"\bwhere\s+do\s+i\s+start", r"\bwhat\s+now\b", r"\bhow\s+should\b",
    ],
}

# Patterns that indicate explicit exploit code/payload request
EXPLICIT_EXPLOIT_PATTERNS = [
    r"\bexploit\s+code\b",
    r"\bgive\s+me.*payload",
    r"\bshow.*exploit",
    r"\bpoc\b",
    r"\bweaponiz",
    r"\bworking\s+exploit",
    r"\bshell\s+code\b",
    r"\bgenerate.*payload",
    r"\bcreate.*exploit",
]


# =============================================================================
# NEGATION DETECTION
# =============================================================================

NEGATION_PATTERNS = [
    # Exploit negations
    (r"don.?t\s+(give|show|want|need).*\b(exploit|payload)", IntentType.EXPLOIT),
    (r"no\s+(exploit|payload|shell|attack)", IntentType.EXPLOIT),
    (r"without\s+(exploit|attack|payload)", IntentType.EXPLOIT),
    (r"skip\s+(exploit|payload)", IntentType.EXPLOIT),
    # Recon negations
    (r"don.?t\s+scan", IntentType.RECON),
    (r"no\s+(scan|nmap)", IntentType.RECON),
    (r"skip\s+recon", IntentType.RECON),
    # Vuln check negations
    (r"skip\s+(vuln|cve)", IntentType.VULN_CHECK),
    (r"no\s+(vuln|cve)\s+check", IntentType.VULN_CHECK),
]

def detect_negations(query: str) -> List[IntentType]:
    """Detect which intents the user explicitly excludes."""
    excluded = []
    query_lower = query.lower()
    for pattern, intent in NEGATION_PATTERNS:
        if re.search(pattern, query_lower):
            if intent not in excluded:
                excluded.append(intent)
    return excluded


# =============================================================================
# MULTI-INTENT SCORING
# =============================================================================

CONFIDENCE_THRESHOLD = 0.2
MAX_PATTERN_SCORE = 5
MULTI_INTENT_THRESHOLD = 2  # At least 2 matches to be a primary intent


def classify_intent(
    query: str,
    access_level: str = "none",
    scan_context: Optional[Dict] = None
) -> IntentResult:
    """
    Enhanced intent classification with multi-intent, negation, and typo support.
    
    Args:
        query: User's natural language query
        access_level: Current access level (none, user, admin, root, shell)
        scan_context: Optional scan context for additional hints
    
    Returns:
        IntentResult with all classification details
    """
    # Step 1: Normalize query (fix typos)
    normalized = normalize_query(query)
    query_lower = normalized.lower()
    
    # Step 2: Check for trivial/meta queries
    trivial = is_trivial_query(query)
    meta = is_meta_query(query)
    
    if trivial or meta:
        return IntentResult(
            primary_intents=[IntentType.GENERAL],
            excluded_intents=[],
            explicit_exploit_request=False,
            confidence=0.0,
            is_trivial=trivial,
            is_meta_query=meta,
            normalized_query=normalized,
        )
    
    # Step 3: Check for explicit exploit request
    explicit_exploit_request = any(
        re.search(p, query_lower) for p in EXPLICIT_EXPLOIT_PATTERNS
    )
    
    # Step 4: Detect negations (what to exclude)
    excluded_intents = detect_negations(query)
    
    # Step 5: Score each intent
    scores: Dict[IntentType, int] = {}
    for intent, patterns in INTENT_PATTERNS.items():
        score = sum(1 for p in patterns if re.search(p, query_lower))
        if score > 0:
            scores[intent] = score
    
    # Step 6: Boost EXPLOIT if explicit request
    if explicit_exploit_request:
        scores[IntentType.EXPLOIT] = scores.get(IntentType.EXPLOIT, 0) + 3
    
    # Step 6b: Boost TROUBLESHOOTING if error/failure keywords present
    # This ensures "My scan keeps timing out" → troubleshooting, not recon
    troubleshooting_boost_patterns = [
        r"\b(timeout|timing|error|fail|crash|not\s+work|broken|issue|problem)\b"
    ]
    if any(re.search(p, query_lower) for p in troubleshooting_boost_patterns):
        scores[IntentType.TROUBLESHOOTING] = scores.get(IntentType.TROUBLESHOOTING, 0) + 2
    
    # Step 7: Find ALL primary intents (multi-intent support)
    primary_intents = []
    
    if scores:
        # Get max score first
        max_score = max(scores.values())
        
        # Include all intents with score >= MULTI_INTENT_THRESHOLD
        # OR within 1 of max score (for close ties)
        for intent, score in scores.items():
            if score >= MULTI_INTENT_THRESHOLD or score >= max_score - 1:
                if intent not in excluded_intents:
                    primary_intents.append(intent)
        
        # If nothing passes threshold, take the best (if above confidence threshold)
        if not primary_intents and max_score >= 1:
            best = max(scores, key=scores.get)
            if best not in excluded_intents:
                primary_intents.append(best)
    
    # Step 8: Fallback to GENERAL if no intents
    if not primary_intents:
        primary_intents = [IntentType.GENERAL]
    
    # Step 9: Calculate confidence (based on best score)
    best_score = max(scores.values()) if scores else 0
    confidence = min(best_score / MAX_PATTERN_SCORE, 1.0)
    
    # Step 10: Context-based confidence boost
    if scan_context:
        for intent in primary_intents:
            if _context_supports_intent(scan_context, intent):
                confidence = min(confidence + 0.1, 1.0)
                break
    
    # Sort intents by score for priority
    primary_intents.sort(key=lambda i: scores.get(i, 0), reverse=True)
    
    return IntentResult(
        primary_intents=primary_intents,
        excluded_intents=excluded_intents,
        explicit_exploit_request=explicit_exploit_request,
        confidence=confidence,
        is_trivial=False,
        is_meta_query=False,
        normalized_query=normalized,
    )


def _context_supports_intent(scan_context: Dict, intent: IntentType) -> bool:
    """Check if scan context provides supporting evidence for the intent."""
    if intent == IntentType.VULN_CHECK:
        vulns = scan_context.get("web_findings", [])
        return len(vulns) > 0
    elif intent == IntentType.RECON:
        services = scan_context.get("services", [])
        return len(services) > 0
    elif intent == IntentType.PRIVESC:
        access = scan_context.get("access_level", "none")
        return access.lower() in ["user", "authenticated", "shell"]
    return False


# =============================================================================
# LEGACY COMPATIBILITY
# =============================================================================

def classify_intent_legacy(
    query: str,
    access_level: str = "none",
    scan_context: Optional[Dict] = None
) -> tuple:
    """
    Legacy interface returning (IntentType, bool, float) for backward compatibility.
    """
    result = classify_intent(query, access_level, scan_context)
    primary = result.primary_intents[0] if result.primary_intents else IntentType.GENERAL
    return primary, result.explicit_exploit_request, result.confidence


# =============================================================================
# TESTING
# =============================================================================

def get_intent_keywords(intent: IntentType) -> list:
    """Get the keyword patterns for a specific intent (for debugging)."""
    return INTENT_PATTERNS.get(intent, [])


def test_classify_intent():
    """Comprehensive test function for manual verification."""
    test_cases = [
        # Basic intents
        ("Scan the target for open ports", ["recon"]),
        ("Check for CVE-2024-1234", ["vuln_check"]),
        ("Show me the exploit code", ["exploit"]),
        ("How do I get root?", ["privesc"]),
        ("Why is my scan failing?", ["troubleshooting"]),
        ("What should I do next?", ["planning"]),
        ("Hello!", ["general"]),
        # Multi-intent
        ("Scan and exploit the server", ["recon", "exploit"]),
        ("Find vulnerabilities and escalate privileges", ["vuln_check", "privesc"]),
        # Negation
        ("Find vuln but don't give exploits", ["vuln_check"]),
        # Typo
        ("Run nmpa on target", ["recon"]),
        ("Check for privelege escalation", ["privesc"]),
        # Edge cases
        ("My scan keeps timing out", ["troubleshooting"]),
        ("Failed to exploit the target", ["troubleshooting"]),  # "failed" should win
        ("Metasploit not working", ["troubleshooting"]),
    ]
    
    print("\n" + "="*60)
    print("Intent Classifier Tests")
    print("="*60)
    
    passed = 0
    for query, expected in test_cases:
        result = classify_intent(query)
        actual = [i.value for i in result.primary_intents]
        
        # Check if any expected intent is in actual
        match = any(e in actual for e in expected)
        status = "✅" if match else "❌"
        if match:
            passed += 1
        
        print(f"\n{status} Query: '{query}'")
        print(f"   Expected: {expected}")
        print(f"   Got: {actual}")
        print(f"   Excluded: {[i.value for i in result.excluded_intents]}")
        print(f"   Confidence: {result.confidence:.2f}")
        if result.normalized_query != query:
            print(f"   Normalized: '{result.normalized_query}'")
    
    print(f"\n\nResults: {passed}/{len(test_cases)} passed")


if __name__ == "__main__":
    test_classify_intent()

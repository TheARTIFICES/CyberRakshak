import re
import logging
from typing import Optional, Dict, Tuple
import urllib.request
import json

logger = logging.getLogger("cyberrakshak.epss")
CVE_REGEX = re.compile(r"^CVE-\d{4}-\d{4,}$", re.IGNORECASE)

# In-memory LRU-like cache for EPSS scores: cve_id -> (score, percentile)
_EPSS_CACHE: Dict[str, Tuple[float, float]] = {}

def get_epss_score(cve_id: str, timeout_sec: float = 8.0) -> Optional[Tuple[float, float]]:
    """
    Fetches EPSS (Exploit Prediction Scoring System) score and percentile from FIRST.org API.
    
    Security Controls:
    - Strict regex validation on CVE ID to prevent SSRF or query injection.
    - Max response size validation.
    - Safe float parsing with [0.0, 1.0] bounds check.
    - In-memory caching for sub-millisecond repeated queries.
    """
    if not cve_id or not isinstance(cve_id, str):
        return None
    
    clean_cve = cve_id.strip().upper()
    if not CVE_REGEX.match(clean_cve):
        logger.warning(f"Invalid CVE ID rejected for EPSS lookup: {cve_id}")
        return None
    
    if clean_cve in _EPSS_CACHE:
        return _EPSS_CACHE[clean_cve]
    
    url = f"https://api.first.org/data/v1/epss?cve={clean_cve}"
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "CyberRakshak-Vitta-RiskEngine/2.5"}
        )
        with urllib.request.urlopen(req, timeout=timeout_sec) as response:
            if response.status != 200:
                return None
            raw_data = response.read(65536) # Max 64KB limit to prevent memory exhaustion
            data = json.loads(raw_data.decode("utf-8"))
            
            items = data.get("data", [])
            if not items:
                return None
            
            first_item = items[0]
            score = float(first_item.get("epss", 0.0))
            percentile = float(first_item.get("percentile", 0.0))
            
            # Security bounds check
            if not (0.0 <= score <= 1.0) or not (0.0 <= percentile <= 1.0):
                logger.warning(f"Out-of-bounds EPSS value received for {clean_cve}: epss={score}, pct={percentile}")
                return None
            
            res = (score, percentile)
            _EPSS_CACHE[clean_cve] = res
            return res
            
    except Exception as e:
        logger.debug(f"EPSS API lookup failed for {clean_cve} (offline or timeout): {e}")
        return None

def set_cached_epss(cve_id: str, score: float, percentile: float = 0.0) -> None:
    """Manually seed or cache EPSS score (useful for testing or offline dataset pre-loading)."""
    clean_cve = cve_id.strip().upper()
    if CVE_REGEX.match(clean_cve) and (0.0 <= score <= 1.0):
        _EPSS_CACHE[clean_cve] = (score, percentile)

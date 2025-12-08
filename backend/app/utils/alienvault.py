import requests
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

OTX_API_URL = "https://otx.alienvault.com/api/v1/indicators/cve"

def get_alienvault_cve_data(cve_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetches threat intelligence for a specific CVE from AlienVault OTX.
    Returns a dict with pulse count, tags, and references.
    """
    if not cve_id: return None

    # Header with API Key
    headers = {
        "X-OTX-API-KEY": settings.ALIENVAULT_API_KEY, 
        "User-Agent": "CyberRakshak-Scanner/1.0"
    }

    try:
        url = f"{OTX_API_URL}/{cve_id}/general"
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 404: return None
        response.raise_for_status()
        
        data = response.json()
        pulses = data.get("pulse_info", {}).get("pulses", [])
        
        tags = set()
        references = set()
        
        for pulse in pulses:
            for tag in pulse.get("tags", []): tags.add(tag)
            for ref in pulse.get("references", []): 
                if ref: references.add(ref)

        return {
            "pulse_count": data.get("pulse_info", {}).get("count", 0),
            "tags": list(tags)[:10],       # Store top 10 tags
            "references": list(references)[:5] # Store top 5 refs
        }

    except Exception as e:
        logger.error(f"AlienVault OTX lookup failed for {cve_id}: {e}")
        return None

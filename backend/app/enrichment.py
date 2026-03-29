import requests
import logging
import re
from typing import Dict, Any, Optional
from sqlmodel import Session
from app.database import engine
from app.models import VulnerabilityMetadata, get_ist_time
from app.utils.nvd_sync import fetch_nvd_data
from app.utils.alienvault import get_alienvault_cve_data
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

def get_cisa_kev_data() -> Dict[str, Any]:
    """Fetches CISA KEV catalog."""
    cve_map = {}
    try:
        response = requests.get(CISA_KEV_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        for vuln in data.get("vulnerabilities", []):
            cve_id = vuln.get("cveID")
            if cve_id:
                cve_map[cve_id] = {
                    "is_exploited": True,
                    "date_added": vuln.get("dateAdded"),
                    "required_action": vuln.get("requiredAction")
                }
    except Exception as e:
        logger.error(f"Failed to fetch CISA KEV: {e}")
    return cve_map

def enrich_vulnerability(vuln: Dict[str, Any], cisa_cache: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enriches a vuln object using Local DB (ExploitDB, NVD, AlienVault) + API fallbacks.
    """
    # 1. Extract CVE ID
    cve_id = vuln.get("cve") or vuln.get("template_id", "")
    
    if isinstance(cve_id, list) and len(cve_id) > 0: cve_id = cve_id[0]
    if not isinstance(cve_id, str): cve_id = ""

    # Regex Fallback for CVE-YYYY-NNNN
    if not cve_id or not cve_id.upper().startswith("CVE-"):
        text_blob = f"{vuln.get('title', '')} {vuln.get('description', '')}"
        match = re.search(r'(CVE-\d{4}-\d{4,7})', text_blob, re.IGNORECASE)
        if match:
            cve_id = match.group(1).upper()
            vuln["cve"] = cve_id 

    cve_id = cve_id.upper()

    enrichment_data = {
        "cve_id": cve_id,
        "cisa_kev": False,
        "cisa_details": None,
        "nvd_data": None,
        "exploit_info": None, 
        "otx_data": None      
    }

    if not cve_id.startswith("CVE-"):
        return {**vuln, "enrichment": enrichment_data}

    # 2. CISA KEV Lookup
    if cve_id in cisa_cache:
        enrichment_data["cisa_kev"] = True
        enrichment_data["cisa_details"] = cisa_cache[cve_id]

    # 3. Database Lookup
    with Session(engine) as session:
        cached_vuln = session.get(VulnerabilityMetadata, cve_id)
        
        # Sync AlienVault if needed
        if cached_vuln:
            should_sync = not cached_vuln.otx_last_synced or \
                          (get_ist_time() - cached_vuln.otx_last_synced > timedelta(days=7))
            
            if should_sync:
                otx = get_alienvault_cve_data(cve_id)
                if otx:
                    cached_vuln.otx_pulse_count = otx["pulse_count"]
                    cached_vuln.otx_tags = otx["tags"]
                    cached_vuln.otx_references = otx["references"]
                    cached_vuln.otx_last_synced = get_ist_time()
                    session.add(cached_vuln)
                    session.commit()
                    session.refresh(cached_vuln)

        # Populate Data
        if cached_vuln:
            enrichment_data["nvd_data"] = {
                "score": cached_vuln.cvss_score,
                "severity": cached_vuln.severity,
                "description": cached_vuln.description
            }
            
            if cached_vuln.has_exploit:
                enrichment_data["exploit_info"] = {
                    "available": True,
                    "ids": cached_vuln.exploit_ids
                }
            
            if cached_vuln.otx_pulse_count > 0:
                enrichment_data["otx_data"] = {
                    "pulse_count": cached_vuln.otx_pulse_count,
                    "tags": cached_vuln.otx_tags
                }

            if cached_vuln.remediation:
                vuln["remediation"] = cached_vuln.remediation
                vuln["remediation_source"] = cached_vuln.remediation_source

        else:
            # Fallback: Fetch NVD if new
            nvd_info = fetch_nvd_data(cve_id)
            if nvd_info:
                new_meta = VulnerabilityMetadata(
                    cve_id=cve_id,
                    description=nvd_info["description"],
                    cvss_score=nvd_info["cvss_score"],
                    severity=nvd_info["severity"],
                    is_cisa_kev=enrichment_data["cisa_kev"],
                    otx_last_synced=get_ist_time()
                )
                
                # Fetch OTX immediately
                otx = get_alienvault_cve_data(cve_id)
                if otx:
                    new_meta.otx_pulse_count = otx["pulse_count"]
                    new_meta.otx_tags = otx["tags"]
                    new_meta.otx_references = otx["references"]

                session.add(new_meta)
                session.commit()
                
                enrichment_data["nvd_data"] = nvd_info
                if new_meta.otx_pulse_count > 0:
                    enrichment_data["otx_data"] = {
                        "pulse_count": new_meta.otx_pulse_count,
                        "tags": new_meta.otx_tags
                    }

    vuln["enrichment"] = enrichment_data
    return vuln

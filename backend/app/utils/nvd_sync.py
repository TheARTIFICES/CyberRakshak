import time
import requests
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlmodel import Session, select, delete
from app.database import engine
from app.models import VulnerabilityMetadata

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nvd_sync")

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

def remove_stale_data(days: int = 180):
    """
    Removes records that haven't been updated in 'days'.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    logger.info(f"Cleaning up data older than {cutoff_date}...")
    
    with Session(engine) as session:
        statement = delete(VulnerabilityMetadata).where(VulnerabilityMetadata.last_updated < cutoff_date)
        result = session.exec(statement)
        session.commit()
        logger.info(f"Deleted {result.rowcount} stale records.")

def fetch_nvd_data(cve_id: str) -> Optional[Dict[str, Any]]:
    """
    Queries NIST NVD API for a single CVE (Rate Limited).
    Used by enrichment.py for on-demand lookups.
    """
    try:
        # Respect rate limits (NIST is strict, 2s delay)
        time.sleep(2) 
        
        url = f"{NVD_API_URL}?cveId={cve_id}"
        logger.info(f"Fetching single NVD record: {url}")
        
        resp = requests.get(url, timeout=10)
        
        if resp.status_code != 200:
            logger.error(f"NVD API failed for {cve_id}: Status {resp.status_code}")
            return None
            
        data = resp.json()
        vulnerabilities = data.get("vulnerabilities", [])
        if not vulnerabilities: 
            return None
            
        cve_item = vulnerabilities[0].get("cve", {})
        metrics = cve_item.get("metrics", {})
        
        cvss_data = None
        # Try V3.1, fallback to V3.0, then V2
        if "cvssMetricV31" in metrics:
            cvss_data = metrics["cvssMetricV31"][0].get("cvssData", {})
        elif "cvssMetricV30" in metrics:
            cvss_data = metrics["cvssMetricV30"][0].get("cvssData", {})
        elif "cvssMetricV2" in metrics:
             cvss_data = metrics["cvssMetricV2"][0].get("cvssData", {})

        desc_list = cve_item.get("descriptions", [])
        description = desc_list[0].get("value", "No description") if desc_list else "No description"

        return {
            "description": description,
            "cvss_score": cvss_data.get("baseScore") if cvss_data else 0.0,
            "severity": cvss_data.get("baseSeverity") if cvss_data else "UNKNOWN",
            "vector_string": cvss_data.get("vectorString") if cvss_data else None
        }
    except Exception as e:
        logger.error(f"NVD API exception for {cve_id}: {e}")
        return None

def sync_nvd(days_back: int = 90):
    """
    Fetches CVEs modified in the last `days_back` days and upserts them to DB.
    """
    start_date = (datetime.utcnow() - timedelta(days=days_back)).isoformat()
    pub_start = start_date.split(".")[0] # ISO format without microseconds
    
    logger.info(f"Starting NVD Sync (Changes since {pub_start})...")

    start_index = 0
    results_per_page = 2000
    
    with Session(engine) as session:
        while True:
            try:
                params = {
                    "lastModStartDate": pub_start,
                    "lastModEndDate": datetime.utcnow().isoformat().split(".")[0],
                    "resultsPerPage": results_per_page,
                    "startIndex": start_index
                }
                
                logger.info(f"Fetching batch index {start_index}...")
                resp = requests.get(NVD_API_URL, params=params, timeout=30)
                
                if resp.status_code == 403:
                    logger.warning("Rate limit hit. Sleeping 6s...")
                    time.sleep(6)
                    continue
                
                if resp.status_code != 200:
                    logger.error(f"NVD Error: {resp.status_code}")
                    break

                data = resp.json()
                vulnerabilities = data.get("vulnerabilities", [])
                
                if not vulnerabilities:
                    break

                for item in vulnerabilities:
                    cve_item = item.get("cve", {})
                    cve_id = cve_item.get("id")
                    
                    # Extract Metrics
                    metrics = cve_item.get("metrics", {})
                    cvss_data = None
                    if "cvssMetricV31" in metrics:
                        cvss_data = metrics["cvssMetricV31"][0].get("cvssData", {})
                    elif "cvssMetricV30" in metrics:
                        cvss_data = metrics["cvssMetricV30"][0].get("cvssData", {})
                    elif "cvssMetricV2" in metrics:
                        cvss_data = metrics["cvssMetricV2"][0].get("cvssData", {})

                    # Extract Description
                    descriptions = cve_item.get("descriptions", [])
                    desc_text = descriptions[0].get("value", "") if descriptions else ""

                    # UPSERT Logic
                    vuln_meta = session.get(VulnerabilityMetadata, cve_id)
                    if not vuln_meta:
                        vuln_meta = VulnerabilityMetadata(cve_id=cve_id)

                    vuln_meta.description = desc_text
                    vuln_meta.cvss_score = cvss_data.get("baseScore", 0.0) if cvss_data else 0.0
                    vuln_meta.severity = cvss_data.get("baseSeverity", "UNKNOWN") if cvss_data else "UNKNOWN"
                    vuln_meta.vector_string = cvss_data.get("vectorString") if cvss_data else None
                    vuln_meta.last_updated = datetime.utcnow()

                    session.add(vuln_meta)

                session.commit()
                logger.info(f"Processed {len(vulnerabilities)} CVEs.")
                
                start_index += results_per_page
                if start_index >= data.get("totalResults", 0):
                    break
                
                time.sleep(2) # Polite delay

            except Exception as e:
                logger.error(f"Sync failed: {e}")
                time.sleep(5)
                
    logger.info("NVD Sync Completed.")

if __name__ == "__main__":
    remove_stale_data(days=180)
    sync_nvd(days_back=30)

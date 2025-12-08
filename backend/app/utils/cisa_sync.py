import requests
import logging
from sqlmodel import Session, select
from app.database import engine
from app.models import VulnerabilityMetadata
from datetime import datetime

logger = logging.getLogger(__name__)

CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

def sync_cisa_kev():
    """
    Downloads the CISA Known Exploited Vulnerabilities catalog 
    and updates the VulnerabilityMetadata table.
    """
    logger.info("Starting CISA KEV Sync...")
    
    try:
        response = requests.get(CISA_KEV_URL, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        vulns = data.get("vulnerabilities", [])
        logger.info(f"Fetched {len(vulns)} KEV entries from CISA.")
        
        with Session(engine) as session:
            count = 0
            for item in vulns:
                cve_id = item.get("cveID")
                if not cve_id: continue
                
                # Check if exists
                vuln = session.get(VulnerabilityMetadata, cve_id)
                
                if not vuln:
                    # Create new record if it doesn't exist (NVD might fill details later)
                    vuln = VulnerabilityMetadata(cve_id=cve_id)
                    vuln.description = item.get("shortDescription")
                
                # Update CISA specific fields
                vuln.is_cisa_kev = True
                
                # We can also store the 'Required Action' as remediation if we don't have one
                if not vuln.remediation:
                    vuln.remediation = item.get("requiredAction")
                    vuln.remediation_source = "CISA KEV"
                
                session.add(vuln)
                
                count += 1
                if count % 500 == 0:
                    session.commit()
            
            session.commit()
            logger.info(f"CISA KEV Sync Completed. Updated {count} records.")

    except Exception as e:
        logger.error(f"CISA Sync Failed: {e}")

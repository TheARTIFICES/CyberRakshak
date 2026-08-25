import os
import sys
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import Session, select, func
from app.database import engine
from app.models import VulnerabilityMetadata
from app.utils.exploitdb import sync_exploitdb
from app.utils.nvd_sync import sync_nvd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sync_threat_intel")

def run_sync():
    print("=================================================================")
    print("1. STARTING EXPLOIT-DB CATALOG SYNC")
    print("=================================================================")
    try:
        sync_exploitdb()
        print("ExploitDB Sync Successfully Completed.")
    except Exception as e:
        print(f"ExploitDB Sync Error: {e}")

    print("\n=================================================================")
    print("2. STARTING NIST NVD CVE SYNC")
    print("=================================================================")
    try:
        # Sync the last 14 days of NVD CVE updates
        sync_nvd(days_back=14)
        print("NIST NVD Sync Successfully Completed.")
    except Exception as e:
        print(f"NIST NVD Sync Error: {e}")

    print("\n=================================================================")
    print("3. FINAL THREAT INTEL KNOWLEDGE BASE STATISTICS")
    print("=================================================================")
    with Session(engine) as session:
        total_vulns = session.exec(select(func.count(VulnerabilityMetadata.cve_id))).one()
        cisa_vulns = session.exec(select(func.count(VulnerabilityMetadata.cve_id)).where(VulnerabilityMetadata.is_cisa_kev == True)).one()
        exploits_vulns = session.exec(select(func.count(VulnerabilityMetadata.cve_id)).where(VulnerabilityMetadata.has_exploit == True)).one()
        high_critical = session.exec(select(func.count(VulnerabilityMetadata.cve_id)).where(VulnerabilityMetadata.cvss_score >= 7.0)).one()
        
        print(f"Total CVE Records in Knowledge Base:     {total_vulns:,}")
        print(f"Total CISA KEV Confirmed Exploited:       {cisa_vulns:,}")
        print(f"Total CVEs with ExploitDB Payloads/PoCs:  {exploits_vulns:,}")
        print(f"Total High & Critical Severity (CVSS>=7): {high_critical:,}")
    print("=================================================================")

if __name__ == "__main__":
    run_sync()

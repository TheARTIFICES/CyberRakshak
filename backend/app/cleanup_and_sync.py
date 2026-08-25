import os
import sys
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import Session, select, delete, func
from app.database import engine
from app.models import Job, JobStatus, AuditLog, Notification, VulnerabilityMetadata
from app.utils.cisa_sync import sync_cisa_kev
from app.utils.nvd_sync import fetch_nvd_data
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("cleanup_and_sync")

def run():
    print("=================================================================")
    print("1. CHECKING & CLEARING FAILED / PENDING / STUCK SCANS")
    print("=================================================================")
    
    with Session(engine) as session:
        all_jobs = session.exec(select(Job)).all()
        print(f"Total scan jobs found: {len(all_jobs)}")
        
        status_counts = {}
        for j in all_jobs:
            status_counts[j.status.value] = status_counts.get(j.status.value, 0) + 1
        
        for st, count in status_counts.items():
            print(f"  - Status '{st}': {count}")
            
        stuck_jobs = [j for j in all_jobs if j.status in [JobStatus.PENDING, JobStatus.RUNNING, JobStatus.FAILED]]
        print(f"\nIdentified {len(stuck_jobs)} failed / pending / running scans to remove.")
        
        for j in stuck_jobs:
            session.exec(delete(AuditLog).where(AuditLog.job_id == j.id))
            session.exec(delete(Notification).where(Notification.job_id == j.id))
            session.exec(delete(Job).where(Job.id == j.id))
        
        session.commit()
        print(f"Cleared {len(stuck_jobs)} jobs and all associated audit logs/notifications.")
        
        remaining_jobs = session.exec(select(Job)).all()
        print(f"Remaining active completed/clean jobs: {len(remaining_jobs)}")

    print("\n=================================================================")
    print("2. TRIGGERING CISA KEV CATALOG SYNC")
    print("=================================================================")
    sync_cisa_kev()
    print("CISA KEV Sync Finished.")

    print("\n=================================================================")
    print("3. ENRICHING ACTIVE VULNERABILITIES WITH NVD & EPSS DATA")
    print("=================================================================")
    with Session(engine) as session:
        # Get all unique CVEs across all completed jobs
        completed_jobs = session.exec(select(Job).where(Job.status == JobStatus.COMPLETED)).all()
        unique_cves = set()
        for j in completed_jobs:
            if not j.normalized_report:
                continue
            for v in j.normalized_report.get("vulnerabilities", []):
                cve = v.get("cve")
                if cve and str(cve).startswith("CVE-"):
                    unique_cves.add(cve)
        
        print(f"Found {len(unique_cves)} unique CVEs across active scan reports: {sorted(list(unique_cves))}")
        
        for cve in unique_cves:
            meta = session.get(VulnerabilityMetadata, cve)
            if not meta or not meta.cvss_score:
                print(f"Fetching NVD enrichment for {cve}...")
                nvd_data = fetch_nvd_data(cve)
                if nvd_data:
                    if not meta:
                        meta = VulnerabilityMetadata(cve_id=cve)
                    meta.description = nvd_data.get("description", meta.description or "")
                    meta.cvss_score = nvd_data.get("cvss_score", 0.0)
                    meta.severity = nvd_data.get("severity", "UNKNOWN")
                    meta.vector_string = nvd_data.get("vector_string")
                    session.add(meta)
                    session.commit()
                    print(f"  -> Enriched {cve}: CVSS {meta.cvss_score} ({meta.severity})")
                else:
                    print(f"  -> NVD returned no record for {cve}, keeping default metadata.")
            else:
                print(f"  -> {cve} already has full metadata: CVSS {meta.cvss_score} ({meta.severity}), CISA KEV: {meta.is_cisa_kev}")

    print("\n=================================================================")
    print("4. SUMMARY POST-ENRICHMENT STATISTICS")
    print("=================================================================")
    with Session(engine) as session:
        total_vulns = session.exec(select(func.count(VulnerabilityMetadata.cve_id))).one()
        cisa_vulns = session.exec(select(func.count(VulnerabilityMetadata.cve_id)).where(VulnerabilityMetadata.is_cisa_kev == True)).one()
        cve_with_exploits = session.exec(select(func.count(VulnerabilityMetadata.cve_id)).where(VulnerabilityMetadata.has_exploit == True)).one()
        print(f"Total Vulnerabilities in Database KB: {total_vulns}")
        print(f"Total CISA KEV Exploited In The Wild: {cisa_vulns}")
        print(f"Total CVEs with Known Exploits:       {cve_with_exploits}")
    print("=================================================================")

if __name__ == "__main__":
    run()

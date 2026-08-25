import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Add backend directory to sys.path to allow importing from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import Session, select
from app.database import engine
from app.models import Job, JobStatus, AuditLog, Notification, VulnerabilityMetadata, User, get_ist_time
from passlib.context import CryptContext

# Helper function to create a fully formed vulnerability entry
def create_vuln(tool, title, severity, description, cve, cvss_score, port, solution, is_cisa_kev_val, nvd_severity, exploit_available, otx_tags):
    return {
        "tool": tool,
        "title": title,
        "severity": severity,
        "description": description,
        "cve": cve,
        "cvss_score": cvss_score,
        "port": port,
        "solution": solution,
        "references": [f"https://nvd.nist.gov/vuln/detail/{cve}"],
        "enrichment": {
            "cve_id": cve,
            "cisa_kev": is_cisa_kev_val,
            "cisa_details": {"is_exploited": is_cisa_kev_val, "date_added": (get_ist_time() - timedelta(days=random.randint(100, 1000))).strftime("%Y-%m-%d"), "required_action": "Apply updates per vendor instructions."} if is_cisa_kev_val else None,
            "nvd_data": {"score": cvss_score, "severity": nvd_severity, "description": description},
            "exploit_info": {"available": exploit_available, "ids": [f"EDB-{random.randint(10000, 99999)}"]} if exploit_available else None,
            "otx_data": {"pulse_count": random.randint(5, 500) if otx_tags else 0, "tags": otx_tags} if otx_tags else None
        }
    }

def seed_data():
    with Session(engine) as session:
        print("Starting Database Seeding...")

        # 1. Ensure an admin user exists (optional, but good for testing)
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        admin = session.exec(select(User).where(User.username == "admin")).first()
        if not admin:
            admin = User(username="admin", hashed_password=pwd_context.hash("admin"), role="admin")
            session.add(admin)
            session.commit()
            print("Created default admin user.")

        scanners = ["nmap", "nuclei", "nikto", "zap", "wappalyzer", "metasploit", "openvas", "whois", "whatweb", "dirsearch", "wfuzz", "dalfox", "grype"]
        tool_status_completed = {s: "completed" for s in scanners}

        # --- SCENARIO DATA ---
        scenarios = [
            {
                "target": "10.0.2.10",
                "host_info": {
                    "ip": "10.0.2.10",
                    "hostnames": ["guest-wifi-portal.hospital.local"],
                    "registrar": "Internal Network",
                    "creation_date": "2023-01-15",
                    "name_servers": ["ns1.hospital.local", "ns2.hospital.local"]
                },
                "ports": [
                    {"port": 80, "protocol": "tcp", "service": "http", "product": "Apache", "version": "2.4.41"},
                    {"port": 443, "protocol": "tcp", "service": "https", "product": "Apache", "version": "2.4.41"},
                    {"port": 22, "protocol": "tcp", "service": "ssh", "product": "OpenSSH", "version": "8.2p1"}
                ],
                "technologies": [
                    {"name": "Apache", "version": "2.4.41", "categories": ["Web servers"], "confidence": 100},
                    {"name": "PHP", "version": "7.4.3", "categories": ["Programming languages"], "confidence": 100}
                ],
                "vulns": [
                    create_vuln("openvas", "Windows Print Spooler RCE (PrintNightmare)", "critical", "A remote code execution vulnerability exists when the Windows Print Spooler service improperly performs privileged file operations.", "CVE-2021-34527", 9.8, "443/tcp", "Apply the appropriate Microsoft security updates.", True, "CRITICAL", True, ["ransomware", "lateral-movement"]),
                    create_vuln("nuclei", "Default SSH Credentials", "medium", "The device is using default or easily guessable SSH credentials (root:root) allowing unauthorized access.", "CWE-798", 5.5, "22/tcp", "Change default passwords immediately.", False, "MEDIUM", False, ["default-passwords", "iot"]),
                    create_vuln("zap", "Unencrypted Database Connection", "high", "The application connects to the backend database without using TLS/SSL encryption.", "CWE-319", 7.5, "80/tcp", "Enforce TLS for all database connections.", False, "HIGH", False, ["mitm", "cleartext"])
                ]
            },
            {
                "target": "198.51.100.15",
                "host_info": {
                    "ip": "198.51.100.15",
                    "hostnames": ["pharmacy-inventory.hospital.org"],
                    "registrar": "GoDaddy",
                    "creation_date": "2018-05-20",
                    "name_servers": ["ns1.godaddy.com"]
                },
                "ports": [
                    {"port": 80, "protocol": "tcp", "service": "http", "product": "nginx", "version": "1.18.0"},
                    {"port": 443, "protocol": "tcp", "service": "https", "product": "nginx", "version": "1.18.0"}
                ],
                "technologies": [
                    {"name": "nginx", "version": "1.18.0", "categories": ["Web servers"], "confidence": 100},
                    {"name": "React", "version": "17.0.2", "categories": ["JavaScript frameworks"], "confidence": 100}
                ],
                "vulns": [
                    create_vuln("zap", "SQL Injection in Inventory Search", "high", "The 'search' parameter in the inventory API is vulnerable to SQL injection, allowing unauthorized data access and potential database modification.", "CVE-2023-XXXX", 8.5, "443/tcp", "Use prepared statements or parameterized queries.", False, "HIGH", True, ["sqli", "data-breach"]),
                    create_vuln("nuclei", "Hardcoded Credentials in API Endpoint", "critical", "Hardcoded administrative credentials were found exposed in the frontend JavaScript bundle.", "CWE-798", 9.1, "443/tcp", "Remove hardcoded credentials and implement secure authentication mechanisms.", False, "CRITICAL", False, ["credentials-exposure", "medical-device"])
                ]
            },
            {
                "target": "198.51.100.22",
                "host_info": {
                    "ip": "198.51.100.22",
                    "hostnames": ["vpn-gateway.hospital.org"],
                    "registrar": "Namecheap",
                    "creation_date": "2020-11-01",
                    "name_servers": ["ns1.namecheap.com"]
                },
                "ports": [
                    {"port": 443, "protocol": "tcp", "service": "https", "product": "Fortinet FortiGate SSL VPN", "version": ""},
                    {"port": 500, "protocol": "udp", "service": "isakmp", "product": "", "version": ""}
                ],
                "technologies": [
                    {"name": "Fortinet FortiGate", "version": "", "categories": ["Firewalls"], "confidence": 100}
                ],
                "vulns": [
                    create_vuln("openvas", "FortiOS SSL-VPN Heap-Based Buffer Overflow", "critical", "A heap-based buffer overflow vulnerability in FortiOS SSL-VPN may allow a remote, unauthenticated attacker to execute arbitrary code or commands.", "CVE-2022-42475", 9.8, "443/tcp", "Upgrade to patched versions of FortiOS.", True, "CRITICAL", True, ["fortinet", "rce", "vpn", "scada-access"]),
                    create_vuln("nmap", "Insecure Modbus TCP Access", "critical", "The maintenance interface exposes Modbus TCP without authentication, allowing direct control over connected SCADA systems (like elevators/HVAC).", "CWE-306", 10.0, "502/tcp", "Implement network segmentation, VPNs, and strong authentication for Modbus access.", False, "CRITICAL", True, ["modbus", "scada", "ics"])
                ]
            },
            {
                 "target": "10.0.4.15",
                 "host_info":{
                     "ip": "10.0.4.15",
                     "hostnames": ["mobile-md-tablet-05.hospital.local"],
                     "registrar": "Internal",
                     "creation_date": "2024-02-12",
                     "name_servers": []
                 },
                 "ports": [
                     {"port": 8080, "protocol": "tcp", "service": "http-proxy", "product": "", "version": ""}
                 ],
                 "technologies": [
                     {"name": "Android", "version": "13", "categories": ["Operating systems"], "confidence": 90}
                 ],
                 "vulns": [
                      create_vuln("nuclei", "F5 BIG-IP iControl REST Auth Bypass", "critical", "This vulnerability allows an unauthenticated attacker with network access to the BIG-IP system through the management port and/or self IP addresses to execute arbitrary system commands, create or delete files, and disable services.", "CVE-2022-1388", 9.8, "443/tcp", "Update F5 BIG-IP to the latest version.", True, "CRITICAL", True, ["f5", "auth-bypass", "rce"]),
                      create_vuln("dalfox", "Stolen Session Token via XSS", "high", "A reflected XSS vulnerability can be leveraged to steal active session tokens from the doctor's tablet, granting unauthorized access to the PACS network.", "CWE-384", 7.2, "8080/tcp", "Implement strict CSP and session management features (e.g., short timeouts, IP binding).", False, "HIGH", False, ["xss", "session-hijacking", "pacs"])
                 ]
            },
            {
                 "target": "198.51.100.50",
                 "host_info":{
                     "ip": "198.51.100.50",
                     "hostnames": ["telemed-portal.hospital.org"],
                     "registrar": "AWS Route53",
                     "creation_date": "2021-08-05",
                     "name_servers": ["ns-123.awsdns-45.com"]
                 },
                 "ports": [
                     {"port": 80, "protocol": "tcp", "service": "http", "product": "nginx", "version": "1.20.1"},
                     {"port": 443, "protocol": "tcp", "service": "https", "product": "nginx", "version": "1.20.1"}
                 ],
                 "technologies": [
                     {"name": "Node.js", "version": "18.x", "categories": ["Web servers"], "confidence": 100},
                     {"name": "Express", "version": "4.17.1", "categories": ["Web frameworks"], "confidence": 100}
                 ],
                 "vulns": [
                      create_vuln("grype", "XZ Utils Backdoor (Supply Chain)", "critical", "Malicious code in the xz tools/libraries (liblzma) allows unauthenticated remote attackers to execute arbitrary code via SSH.", "CVE-2024-3094", 10.0, "22/tcp", "Downgrade xz-utils to an uncompromised version or upgrade to a patched release.", True, "CRITICAL", True, ["supply-chain", "backdoor", "rce", "telemedicine"]),
                      create_vuln("nuclei", "Default Root Password on VoIP Gateway", "high", "The internal VoIP gateway connected to the telemed API uses default factory credentials.", "CWE-798", 8.1, "443/tcp", "Change default passwords.", False, "HIGH", False, ["voip", "default-creds"])
                 ]
            },
             {
                 "target": "10.0.14.10",
                 "host_info":{
                     "ip": "10.0.14.10",
                     "hostnames": ["smart-meter-westwing.hospital.local"],
                     "registrar": "Internal",
                     "creation_date": "2019-12-01",
                     "name_servers": []
                 },
                 "ports": [
                     {"port": 1883, "protocol": "tcp", "service": "mqtt", "product": "Mosquitto", "version": "1.6.9"}
                 ],
                 "technologies": [
                     {"name": "Mosquitto", "version": "1.6.9", "categories": ["Message brokers"], "confidence": 100}
                 ],
                 "vulns": [
                      create_vuln("openvas", "Schneider Electric IGSS Buffer Overflow", "critical", "A buffer overflow in the IGSS data server allows remote arbitrary code execution, potentially affecting generator control panels.", "CVE-2020-15368", 9.8, "1883/tcp", "Apply the vendor patch.", False, "CRITICAL", True, ["scada", "ics", "generator", "buffer-overflow"]),
                      create_vuln("zap", "Unencrypted Zigbee/MQTT Communication", "medium", "Smart meter data is transmitted without encryption, allowing local network attackers to read or inject false telemetry data.", "CWE-319", 6.5, "1883/tcp", "Enable TLS for MQTT communications.", False, "MEDIUM", False, ["iot", "smart-meter", "cleartext"])
                 ]
            },
            {
                 "target": "10.0.5.10",
                 "host_info":{
                     "ip": "10.0.5.10",
                     "hostnames": ["phlebotomy-kiosk-01.hospital.local"],
                     "registrar": "Internal",
                     "creation_date": "2020-03-10",
                     "name_servers": []
                 },
                 "ports": [
                      {"port": 135, "protocol": "tcp", "service": "msrpc", "product": "Microsoft Windows RPC", "version": ""},
                      {"port": 139, "protocol": "tcp", "service": "netbios-ssn", "product": "Microsoft Windows netbios-ssn", "version": ""},
                      {"port": 445, "protocol": "tcp", "service": "microsoft-ds", "product": "Microsoft Windows Server 2008 R2 - 2012 microsoft-ds", "version": ""}
                 ],
                 "technologies": [
                     {"name": "Windows", "version": "10", "categories": ["Operating systems"], "confidence": 95}
                 ],
                 "vulns": [
                      create_vuln("openvas", "Microsoft Outlook Privilege Escalation", "critical", "Microsoft Outlook Elevation of Privilege Vulnerability allows an attacker to access a user's NetNTLMv2 hash.", "CVE-2023-23397", 9.8, "445/tcp", "Apply Microsoft security update.", True, "CRITICAL", True, ["outlook", "ntlm", "privesc", "lis"]),
                      create_vuln("nuclei", "USB AutoRun Enabled", "high", "The endpoint allows automatic execution of binaries from removable media (USB), highly increasing the risk of malware (like Stuxnet variants) reaching the internal LIS network.", "CWE-1188", 7.8, "N/A", "Disable AutoRun via Group Policy.", False, "HIGH", False, ["usb", "malware", "endpoint-security"])
                 ]
            },
            {
                 "target": "198.51.100.80",
                 "host_info":{
                     "ip": "198.51.100.80",
                     "hostnames": ["hr-portal.hospital.org"],
                     "registrar": "Cloudflare",
                     "creation_date": "2016-09-12",
                     "name_servers": ["ns1.cloudflare.com"]
                 },
                 "ports": [
                     {"port": 80, "protocol": "tcp", "service": "http", "product": "Apache Tomcat", "version": "9.0.43"},
                     {"port": 443, "protocol": "tcp", "service": "https", "product": "Apache Tomcat", "version": "9.0.43"}
                 ],
                 "technologies": [
                     {"name": "Atlassian Confluence", "version": "7.18.0", "categories": ["CMS"], "confidence": 100},
                     {"name": "Java", "version": "", "categories": ["Programming languages"], "confidence": 100}
                 ],
                 "vulns": [
                      create_vuln("nuclei", "Atlassian Confluence OGNL Injection RCE", "critical", "An OGNL injection vulnerability exists that allows an unauthenticated attacker to execute arbitrary code on a Confluence Server or Data Center instance.", "CVE-2022-26134", 10.0, "443/tcp", "Upgrade Confluence to a patched version.", True, "CRITICAL", True, ["confluence", "rce", "cisa-kev"]),
                      create_vuln("zap", "Kerberoasting Susceptibility on AD Server", "critical", "Weak Service Principal Name (SPN) configurations on the backend Active Directory allow attackers to request service tickets and crack passwords offline.", "CWE-522", 9.0, "389/tcp", "Use complex service account passwords and enable AES Kerberos encryption.", False, "CRITICAL", True, ["activedirectory", "kerberoasting", "privesc"])
                 ]
            },
            {
                 "target": "198.51.100.90",
                 "host_info":{
                     "ip": "198.51.100.90",
                     "hostnames": ["dispatch-interface.hospital.org"],
                     "registrar": "Network Solutions",
                     "creation_date": "2015-08-30",
                     "name_servers": ["ns1.networksolutions.com"]
                 },
                 "ports": [
                     {"port": 443, "protocol": "tcp", "service": "https", "product": "Microsoft IIS", "version": "10.0"}
                 ],
                 "technologies": [
                     {"name": "Microsoft Exchange Server", "version": "2019", "categories": ["Mail"], "confidence": 100},
                     {"name": "Microsoft IIS", "version": "10.0", "categories": ["Web servers"], "confidence": 100}
                 ],
                 "vulns": [
                      create_vuln("openvas", "Microsoft Exchange Server SSRF (ProxyLogon)", "critical", "A server-side request forgery (SSRF) vulnerability in Exchange Server allows an attacker to authenticate as the Exchange server.", "CVE-2021-26855", 9.8, "443/tcp", "Apply the necessary Microsoft security patches.", True, "CRITICAL", True, ["proxylogon", "exchange", "ssrf", "apt"]),
                      create_vuln("zap", "Unsigned Firmware Acceptance on Gateways", "critical", "Ambulance mobile gateways lack firmware signature verification, allowing remote deployment of malicious firmware images.", "CWE-347", 9.5, "N/A", "Implement cryptographically signed firmware checks on all mobile endpoints.", False, "CRITICAL", False, ["firmware", "iot", "tampering"])
                 ]
            },
             {
                 "target": "198.51.100.18",
                 "host_info":{
                     "ip": "198.51.100.18",
                     "hostnames": ["bms-map-portal.hospital.org"],
                     "registrar": "GoDaddy",
                     "creation_date": "2022-01-11",
                     "name_servers": ["ns1.godaddy.com"]
                 },
                 "ports": [
                     {"port": 443, "protocol": "tcp", "service": "https", "product": "Citrix ADC", "version": ""}
                 ],
                 "technologies": [
                     {"name": "Citrix ADC", "version": "", "categories": ["Load balancers"], "confidence": 100}
                 ],
                 "vulns": [
                      create_vuln("openvas", "Citrix NetScaler ADC Unauthenticated RCE", "critical", "Unauthenticated remote code execution vulnerability in Citrix NetScaler ADC and NetScaler Gateway.", "CVE-2023-3519", 9.8, "443/tcp", "Update NetScaler ADC and Gateway to a fixed version.", True, "CRITICAL", True, ["citrix", "rce", "cisa-kev"]),
                      create_vuln("nuclei", "BMS Deserialization RCE", "critical", "The Building Management System API endpoint suffers from insecure deserialization, allowing RCE and control over critical HVAC systems.", "CWE-502", 9.8, "443/tcp", "Avoid deserializing untrusted data or implement strict type checking.", False, "CRITICAL", True, ["bms", "hvac", "deserialization", "cwe-502"])
                 ]
            }
        ]

        # --- SEEDING LOOP ---
        cves_processed = set()
        
        for i, scenario in enumerate(scenarios):
            target = scenario["target"]
            # Stagger creation times over the last 14 days
            created_at = get_ist_time() - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))

            # 1. Save VulnerabilityMetadata for Intel Feed
            for v in scenario["vulns"]:
                cve = v["cve"]
                if cve and cve.startswith("CVE-") and cve not in cves_processed:
                    enrich = v.get("enrichment", {})
                    nvd = enrich.get("nvd_data", {})
                    otx = enrich.get("otx_data", {})
                    exp = enrich.get("exploit_info", {})
                    
                    meta = session.get(VulnerabilityMetadata, cve)
                    if not meta:
                        meta = VulnerabilityMetadata(
                            cve_id=cve,
                            description=v["description"],
                            cvss_score=nvd.get("score"),
                            severity=nvd.get("severity"),
                            is_cisa_kev=enrich.get("cisa_kev", False),
                            has_exploit=exp is not None,
                            exploit_ids=exp.get("ids", []) if exp else [],
                            otx_pulse_count=otx.get("pulse_count", 0) if otx else 0,
                            otx_tags=otx.get("tags", []) if otx else [],
                            remediation=v["solution"],
                            last_updated=created_at
                        )
                        session.add(meta)
                        cves_processed.add(cve)

            # 2. Build Job & Normalized Report
            normalized_report = {
                "host_info": scenario["host_info"],
                "ports": scenario["ports"],
                "technologies": scenario["technologies"],
                "vulnerabilities": scenario["vulns"],
                "tool_errors": {}
            }

            job = Job(
                target=target,
                status=JobStatus.COMPLETED,
                created_at=created_at,
                scanners_requested=scanners,
                tool_status=tool_status_completed,
                output_files={},
                normalized_report=normalized_report,
                notify_email=False,
                email_recipients=[]
            )
            session.add(job)
            session.commit() # Commit Job ID to DB first
            session.refresh(job)

            # 3. Add Audit Logs
            log_start = AuditLog(
                event_type="SCAN_STARTED", 
                timestamp=created_at - timedelta(minutes=15),
                details={"target": target, "scanners": scanners, "user": "admin", "info": "MOCK DATA SEED"}, 
                job_id=job.id
            )
            log_comp = AuditLog(
                event_type="SCAN_COMPLETED", 
                timestamp=created_at,
                details={"target": target, "status": "completed", "vuln_count": len(scenario["vulns"])}, 
                job_id=job.id
            )
            session.add(log_start)
            session.add(log_comp)

            # 4. Add Notification
            notif = Notification(
                title=f"Scan Finished: {target}",
                message=f"Scan completed with status: completed. Found {len(scenario['vulns'])} issues.",
                type="success",
                job_id=job.id,
                timestamp=created_at
            )
            session.add(notif)
            session.commit()
            
            print(f"[{i+1}/10] Inserted Mock Job for {target}")

        print(f"Successfully seeded 10 Hospital Network Mock Scans and {len(cves_processed)} Threat Intel entries.")

if __name__ == "__main__":
    seed_data()

import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List
import re
import logging

# Configure logging
logger = logging.getLogger(__name__)

def parse_nmap(file_path: str) -> Dict[str, Any]:
    """Parses Nmap XML output."""
    results = {"host_info": {}, "open_ports": []}
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
    except Exception as e:
        logger.error(f"Error reading Nmap file {file_path}: {e}")
        return results

    host = root.find("host")
    if not host: return results

    address = host.find("address")
    if address is not None:
        results["host_info"]["ip"] = address.get("addr")
        results["host_info"]["type"] = address.get("addrtype")

    hostnames = host.find("hostnames")
    if hostnames:
        names = [hn.get("name") for hn in hostnames.findall("hostname")]
        results["host_info"]["hostnames"] = names

    ports_element = host.find("ports")
    if ports_element:
        for port in ports_element.findall("port"):
            state = port.find("state")
            if state is not None and state.get("state") == "open":
                port_id = int(port.get("portid"))
                protocol = port.get("protocol")
                service = port.find("service")
                service_name = service.get("name", "unknown") if service is not None else "unknown"
                product = service.get("product", "") if service is not None else ""
                version = service.get("version", "") if service is not None else ""

                results["open_ports"].append({
                    "port": port_id,
                    "protocol": protocol,
                    "service": service_name,
                    "product": product,
                    "version": version
                })
    return results

def parse_nuclei(file_path: str) -> List[Dict[str, Any]]:
    """Parses Nuclei JSONL output."""
    vulnerabilities = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                try:
                    data = json.loads(line)
                    info = data.get("info", {})
                    
                    # --- ENRICHMENT FIX: Extract CVE & Score ---
                    classification = info.get("classification", {})
                    cve_list = classification.get("cve-id", [])
                    # Nuclei can return a list or null. Handle both.
                    cve_id = cve_list[0] if cve_list and isinstance(cve_list, list) else None
                    
                    cvss_score = classification.get("cvss-score")
                    # -------------------------------------------

                    vuln = {
                        "tool": "nuclei",
                        "title": info.get("name", "Unknown Vulnerability"),
                        "severity": info.get("severity", "info"),
                        "description": info.get("description", ""),
                        "cve": cve_id,          # Captured CVE
                        "cvss_score": cvss_score, # Captured Score
                        "template_id": data.get("template-id"),
                        "ip": data.get("ip"),
                        "port": data.get("port"),
                        "references": info.get("reference", [])
                    }
                    vulnerabilities.append(vuln)
                except json.JSONDecodeError: continue
    except Exception as e:
        logger.error(f"Error reading Nuclei file {file_path}: {e}")
    return vulnerabilities

def parse_nikto(file_path: str) -> List[Dict[str, Any]]:
    """Parses Nikto JSON output."""
    vulnerabilities = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Nikto structure varies (list vs dict)
            if isinstance(data, list):
                for host_data in data:
                    for item in host_data.get("vulnerabilities", []):
                         vuln = {
                            "tool": "nikto",
                            "title": item.get("msg", "Web Server Issue"),
                            "severity": "unknown", 
                            "description": f"OSVDB: {item.get('osvdb', 'N/A')}. Method: {item.get('method')}",
                            "url": item.get("url"),
                            "id": item.get("id"),
                            "references": [item.get("references", "")]
                         }
                         vulnerabilities.append(vuln)
            elif isinstance(data, dict):
                 for item in data.get("vulnerabilities", []):
                     vuln = {
                        "tool": "nikto",
                        "title": item.get("msg", "Web Server Issue"),
                        "severity": "unknown",
                        "description": f"OSVDB: {item.get('osvdb', 'N/A')}. Method: {item.get('method')}",
                        "url": item.get("url"),
                        "id": item.get("id"),
                        "references": [item.get("references", "")]
                     }
                     vulnerabilities.append(vuln)
    except Exception as e:
        logger.error(f"Error reading Nikto file {file_path}: {e}")
    return vulnerabilities

def parse_zap(file_path: str) -> List[Dict[str, Any]]:
    """Parses OWASP ZAP JSON output."""
    vulnerabilities = []
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            for site in data.get("site", []):
                for alert in site.get("alerts", []):
                    vuln = {
                        "tool": "zap",
                        "title": alert.get("name", "Unknown Vulnerability"),
                        "severity": alert.get("riskdesc", "Info").split()[0].lower(),
                        "description": alert.get("desc", ""),
                        "solution": alert.get("solution", ""),
                        "url": site.get("@name", "") + alert.get("instances", [{}])[0].get("uri", ""),
                        "references": alert.get("reference", "").split("\n")
                    }
                    vulnerabilities.append(vuln)
    except Exception as e:
        logger.error(f"Error reading ZAP file {file_path}: {e}")
    return vulnerabilities

def parse_wappalyzer(file_path: str) -> List[Dict[str, Any]]:
    """Parses Wappalyzer JSON output."""
    technologies = []
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            for url, info in data.get("urls", {}).items():
                for tech in info.get("technologies", []):
                    technologies.append({
                        "name": tech.get("name"),
                        "version": tech.get("version"),
                        "categories": [cat.get("name") for cat in tech.get("categories", [])],
                        "confidence": tech.get("confidence")
                    })
    except Exception as e:
        logger.error(f"Error reading Wappalyzer file {file_path}: {e}")
    return technologies

def parse_metasploit(file_path: str) -> List[Dict[str, Any]]:
    """Parses Metasploit output."""
    vulnerabilities = []
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        for line in content.splitlines():
            line = line.strip()
            if not line or "deprecated" in line.lower() or "Gem::" in line: continue
            if line.startswith("[+]"):
                vuln = {
                    "tool": "metasploit",
                    "title": "Metasploit Finding",
                    "severity": "info", 
                    "description": line,
                    "raw_output": line
                }
                if "SSH server version" in line: vuln["title"] = "SSH Version Detected"
                elif "Anonymous READ" in line: 
                    vuln["title"] = "Anonymous FTP Access"
                    vuln["severity"] = "medium"
                elif "OS:" in line: vuln["title"] = "OS Detection"
                elif "Apache" in line or "nginx" in line: vuln["title"] = "Web Server Version Detected"
                vulnerabilities.append(vuln)
    except Exception as e:
        logger.error(f"Error reading Metasploit file {file_path}: {e}")
    return vulnerabilities

def parse_openvas(file_path: str) -> List[Dict[str, Any]]:
    """Parses OpenVAS XML report safely."""
    vulnerabilities = []
    
    def safe_text(element, tag, default=""):
        if element is None: return default
        child = element.find(tag)
        if child is None or child.text is None: return default
        return child.text

    try:
        tree = ET.parse(file_path)
        root = tree.getroot()

        for result in root.findall(".//result"):
            name = safe_text(result, "name", "Unknown Vulnerability")
            description = safe_text(result, "description", "No description provided.")
            
            # FIX: Strip whitespace from severity to prevent format errors
            severity_score = safe_text(result, "severity", "0.0").strip()
            
            try: score = float(severity_score)
            except ValueError: score = 0.0

            if score >= 9.0: severity = "critical"
            elif score >= 7.0: severity = "high"
            elif score >= 4.0: severity = "medium"
            elif score > 0.0: severity = "low"
            else: severity = "info"

            nvt_element = result.find("nvt")
            nvt_oid = nvt_element.get("oid") if nvt_element is not None else ""

            vuln = {
                "tool": "openvas",
                "title": name,
                "severity": severity,
                "description": description,
                "cvss_score": severity_score,
                "host": safe_text(result, "host", "unknown"),
                "port": safe_text(result, "port", "unknown"),
                "nvt_oid": nvt_oid
            }
            vulnerabilities.append(vuln)
            
    except Exception as e:
        logger.error(f"Error reading OpenVAS file {file_path}: {e}")

    return vulnerabilities

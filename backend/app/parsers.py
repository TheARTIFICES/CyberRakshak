import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List
import re
import logging

# Configure logging
logger = logging.getLogger(__name__)

# --- NEW: Helper to find CVEs in text ---
def extract_cve_from_text(text: str) -> str:
    """Finds the first CVE-YYYY-NNNN pattern in a string."""
    if not text: return None
    match = re.search(r'(CVE-\d{4}-\d{4,7})', text, re.IGNORECASE)
    return match.group(1).upper() if match else None

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

                # Try to find CVEs in script output (e.g. vulners)
                script_output = ""
                for script in port.findall("script"):
                    script_output += script.get("output", "") + " "
                
                cve_found = extract_cve_from_text(script_output)

                results["open_ports"].append({
                    "port": port_id,
                    "protocol": protocol,
                    "service": service_name,
                    "product": product,
                    "version": version,
                    "cve": cve_found # Pass this up if needed
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
                    
                    classification = info.get("classification", {})
                    cve_list = classification.get("cve-id", [])
                    cve_id = cve_list[0] if cve_list and isinstance(cve_list, list) else None
                    
                    # Fallback: Search in description/name
                    if not cve_id:
                        cve_id = extract_cve_from_text(info.get("description", "")) or \
                                 extract_cve_from_text(info.get("name", ""))

                    cvss_score = classification.get("cvss-score")
                    
                    vuln = {
                        "tool": "nuclei",
                        "title": info.get("name", "Unknown Vulnerability"),
                        "severity": info.get("severity", "info"),
                        "description": info.get("description", ""),
                        "cve": cve_id,
                        "cvss_score": cvss_score,
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
            
            # Normalize structure (Nikto sometimes returns list, sometimes dict)
            scan_items = []
            if isinstance(data, list):
                for host in data: scan_items.extend(host.get("vulnerabilities", []))
            elif isinstance(data, dict):
                scan_items = data.get("vulnerabilities", [])

            for item in scan_items:
                 msg = item.get("msg", "Web Server Issue")
                 desc = f"OSVDB: {item.get('osvdb', 'N/A')}. Method: {item.get('method')}. {msg}"
                 
                 # Look for CVE
                 cve_id = extract_cve_from_text(msg) or extract_cve_from_text(desc)

                 vuln = {
                    "tool": "nikto",
                    "title": msg,
                    "severity": "unknown", 
                    "description": desc,
                    "cve": cve_id,
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
                    desc = alert.get("desc", "")
                    other = alert.get("other", "")
                    
                    # Look for CVE
                    cve_id = extract_cve_from_text(desc) or extract_cve_from_text(other)

                    vuln = {
                        "tool": "zap",
                        "title": alert.get("name", "Unknown Vulnerability"),
                        "severity": alert.get("riskdesc", "Info").split()[0].lower(),
                        "description": desc,
                        "cve": cve_id,
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
            if line.startswith("[+]") or line.startswith("[*]"):
                
                cve_id = extract_cve_from_text(line)
                
                vuln = {
                    "tool": "metasploit",
                    "title": "Metasploit Finding",
                    "severity": "high" if cve_id else "info", 
                    "cve": cve_id,
                    "description": line,
                    "raw_output": line
                }
                
                # Try to give better titles
                if "SSH" in line: vuln["title"] = "SSH Issue Detected"
                elif "FTP" in line: vuln["title"] = "FTP Issue Detected"
                elif "exploitable" in line.lower(): vuln["severity"] = "critical"
                
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
            
            severity_score = safe_text(result, "severity", "0.0").strip()
            try: score = float(severity_score)
            except ValueError: score = 0.0

            if score >= 9.0: severity = "critical"
            elif score >= 7.0: severity = "high"
            elif score >= 4.0: severity = "medium"
            elif score > 0.0: severity = "low"
            else: severity = "info"

            nvt = result.find("nvt")
            nvt_oid = nvt.get("oid") if nvt is not None else ""

            # CVE Extraction
            cve_id = "N/A"
            if nvt is not None:
                # 1. Try explicit tags
                raw_cve = safe_text(nvt, "cve", "NOCVE")
                if "CVE-" in raw_cve:
                    cve_id = raw_cve.split(",")[0].strip()
                
                # 2. Try Refs tag
                if cve_id == "N/A":
                    refs = nvt.find("refs")
                    if refs is not None:
                        for ref in refs.findall("ref"):
                            if ref.get("type") == "cve":
                                cve_id = ref.get("id")
                                break
            
            # 3. Fallback: Search description
            if cve_id == "N/A":
                cve_id = extract_cve_from_text(description) or "N/A"

            vuln = {
                "tool": "openvas",
                "title": name,
                "severity": severity,
                "description": description,
                "cvss_score": score,
                "cve": cve_id,
                "host": safe_text(result, "host", "unknown"),
                "port": safe_text(result, "port", "unknown"),
                "nvt_oid": nvt_oid
            }
            vulnerabilities.append(vuln)
            
    except Exception as e:
        logger.error(f"Error reading OpenVAS file {file_path}: {e}")

    return vulnerabilities

def parse_whois(file_path: str) -> Dict[str, Any]:
    """Parses Whois text output into a dictionary."""
    results = {}
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        results["raw_output"] = content
        # Default values (using keys expected by reporting.py)
        results["registrar"] = None
        results["creation_date"] = None
        results["expiry_date"] = None
        results["name_servers"] = []

        for line in content.splitlines():
            if ":" in line:
                parts = line.split(":", 1)
                if len(parts) == 2:
                    key = parts[0].strip().lower()
                    val = parts[1].strip()
                    
                    # Common Whois Keys mappings
                    if "registrar" in key and "url" not in key and "iana" not in key: 
                        results["registrar"] = val
                    elif "creation date" in key or "created" in key: 
                        results["creation_date"] = val
                    elif "expiry date" in key or "expiration date" in key or "expires" in key: 
                        results["expiry_date"] = val
                    elif "name server" in key or "nserver" in key: 
                        results["name_servers"].append(val)
                
        # Remove duplicates from name servers
        results["name_servers"] = list(set(results["name_servers"]))

    except Exception as e:
        logger.error(f"Error reading Whois file {file_path}: {e}")
        
    return results

def parse_whatweb(file_path: str) -> List[Dict[str, Any]]:
    """Parses WhatWeb JSON output."""
    technologies = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # WhatWeb returns a list of targets, usually we scan one
            for result in data:
                plugins = result.get('plugins', {})
                for name, details in plugins.items():
                    
                    # Extract version
                    version_list = details.get('version', [])
                    version_str = ", ".join(version_list) if version_list else ""
                    
                    # Extract string matches (sometimes useful info)
                    string_list = details.get('string', [])
                    extra_info = ", ".join(string_list) if string_list else ""

                    technologies.append({
                        "name": name,
                        "version": version_str,
                        "extra": extra_info,
                        "source": "WhatWeb"
                    })
    except Exception as e:
        logger.error(f"Error reading WhatWeb file {file_path}: {e}")
    
    return technologies

def parse_dirsearch(file_path: str) -> List[Dict[str, Any]]:
    """Parses Dirsearch JSON output."""
    findings = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            if not isinstance(data, dict):
                return findings

            for key, results in data.items():
                # FIX: Skip metadata keys (like "info") that are not lists
                if not isinstance(results, list):
                    continue

                # The key is usually the Target URL in standard dirsearch json format
                target_url = key

                for item in results:
                    # FIX: Ensure the item is a dictionary
                    if not isinstance(item, dict):
                        continue

                    status = item.get("status")
                    path = item.get("path")
                    content_length = item.get("content-length")
                    redirect = item.get("redirect")
                    
                    title = f"Hidden Directory Found: {path}"
                    description = f"Found hidden path: {path} (Status: {status}, Size: {content_length}b)"
                    if redirect:
                        description += f" -> Redirects to: {redirect}"

                    severity = "info"
                    # Simple heuristic for severity
                    if status == 200:
                        path_lower = str(path).lower()
                        if any(x in path_lower for x in ["admin", "config", "backup", "db", ".env", "git"]):
                            severity = "medium"
                        if "login" in path_lower or "signin" in path_lower:
                            severity = "low"
                    
                    # Construct full URL safely
                    full_url = f"{target_url.rstrip('/')}/{str(path).lstrip('/')}"

                    findings.append({
                        "tool": "dirsearch",
                        "title": title,
                        "severity": severity,
                        "description": description,
                        "cve": "N/A",
                        "url": full_url,
                        "status": status
                    })

    except Exception as e:
        logger.error(f"Error reading Dirsearch file {file_path}: {e}")
    
    return findings

def parse_wfuzz(file_path: str) -> List[Dict[str, Any]]:
    """Parses Wfuzz JSON output."""
    findings = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Wfuzz JSON output is a list of objects
            data = json.load(f)
            
            if not isinstance(data, list):
                return findings

            for item in data:
                # Keys: code, chars, words, lines, payload, url
                code = item.get("code")
                chars = item.get("chars")
                payload = item.get("payload")
                url = item.get("url")
                
                # Title
                title = f"Wfuzz: Found {payload}"
                
                # Determine severity
                severity = "info"
                if code == 200:
                    if "admin" in payload.lower() or "config" in payload.lower():
                        severity = "high"
                    elif "login" in payload.lower():
                        severity = "medium"
                    else:
                        severity = "low"
                elif code in [301, 302, 307]:
                    severity = "low" # Redirects
                
                description = f"Resource found at '{payload}' returning Status {code} (Size: {chars} chars)."

                findings.append({
                    "tool": "wfuzz",
                    "title": title,
                    "severity": severity,
                    "description": description,
                    "cve": "N/A",
                    "url": url,
                    "status": code
                })

    except Exception as e:
        logger.error(f"Error reading Wfuzz file {file_path}: {e}")
    
    return findings

def parse_dalfox(file_path: str) -> List[Dict[str, Any]]:
    """Parses Dalfox JSON output."""
    findings = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return findings

            data = []
            # Dalfox can output a JSON list or NDJSON (line-by-line)
            try:
                data = json.loads(content)
                if not isinstance(data, list):
                    data = [data]
            except json.JSONDecodeError:
                # Try reading line by line
                for line in content.splitlines():
                    if line.strip():
                        try:
                            data.append(json.loads(line))
                        except: pass

            for item in data:
                # Key Dalfox fields: message_str, payload, poc, severity
                title = item.get("message_str", "XSS Vulnerability Detected")
                payload = item.get("payload", "")
                poc_link = item.get("poc", "")
                
                # Dalfox usually finds confirmed XSS
                severity = "high" 
                
                description = f"Reflected XSS found.\nPayload: {payload}\nPoC: {poc_link}"

                findings.append({
                    "tool": "dalfox",
                    "title": title,
                    "severity": severity,
                    "description": description,
                    "cve": "N/A", # XSS usually CWE-79
                    "url": poc_link,
                    "solution": "Sanitize user input and output encoding."
                })

    except Exception as e:
        logger.error(f"Error reading Dalfox file {file_path}: {e}")
    
    return findings

# --- useless code block start ---
# Reason: parse_grype is unreferenced in tasks.py and unused across the active scanning pipeline
def parse_grype(file_path: str) -> List[Dict[str, Any]]:
    """Parses Grype JSON output."""
    findings = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Grype JSON has a 'matches' key
            matches = data.get("matches", [])
            
            for match in matches:
                vuln = match.get("vulnerability", {})
                artifact = match.get("artifact", {})
                
                vuln_id = vuln.get("id")
                severity = vuln.get("severity", "Low").lower()
                desc = vuln.get("description", "No description provided.")
                
                pkg_name = artifact.get("name")
                pkg_version = artifact.get("version")
                pkg_type = artifact.get("type")
                
                title = f"{pkg_name} {pkg_version} ({pkg_type}) - {vuln_id}"
                
                # Grype severity mapping
                if severity == "negligible": severity = "info"
                if severity == "unknown": severity = "info"

                findings.append({
                    "tool": "grype",
                    "title": title,
                    "severity": severity,
                    "description": desc,
                    "cve": vuln_id, # Usually CVE-XXXX-XXXX
                    "solution": f"Upgrade {pkg_name} to a fixed version if available.",
                    "references": vuln.get("urls", [])
                })

    except Exception as e:
        logger.error(f"Error reading Grype file {file_path}: {e}")
    
    return findings
# --- useless code block end ---

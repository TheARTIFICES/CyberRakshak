from typing import Dict, Any, List

def build_unified_context(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Constructs the Unified Security Context for the AI.
    Strictly structures data to prevent 'Script Mode' hallucinations.
    """
    report = job_data.get("normalized_report", {})
    
    # Initialize Context
    context = {
        "target": job_data.get("target"),
        "access_level": job_data.get("access_level", "none"),
        "services": [],
        "tech_stack": report.get("technologies", []),
        "web_findings": [],
        "tool_errors": report.get("tool_errors", {}),
        "evidence_state": {
            "initial_access_confirmed": False,
            "rce_confirmed": False,
            "xss_confirmed": False,
            "sqli_confirmed": False,
            "auth_bypass_confirmed": False
        }
    }

    # 1. Map Services (Nmap)
    for port in report.get("ports", []):
        context["services"].append({
            "port": port.get("port"),
            "service": port.get("service"),
            "product": port.get("product"),
            "version": port.get("version"),
            "protocol": port.get("protocol")
        })

    # 2. Map Vulnerabilities to Structured Objects (Fix 2)
    # We aggregate all parsers that populate the 'vulnerabilities' list in normalized_report
    for vuln in report.get("vulnerabilities", []):
        tool_name = vuln.get("tool", "unknown").upper()
        
        # Determine strict severity
        severity = vuln.get("severity", "info").lower()
        if severity not in ["critical", "high", "medium", "low", "info"]:
            severity = "info"

        # Check for Proof of Concept (Gap 1 Fix)
        # Scan reports rarely have a working PoC unless it's a specific exploit tool
        poc_present = False
        if tool_name in ["METASPLOIT", "NUCLEI"] and severity in ["critical", "high"]:
            # Nuclei/Metasploit imply a higher confidence of exploitability
            poc_present = True

        entry = {
            "tool": tool_name,
            "type": vuln.get("title", "Unknown Issue"),
            "severity": severity.capitalize(),
            "cve": vuln.get("cve", "N/A"),
            "poc_present": poc_present,
            "confirmed": False # Scanners are rarely 100% confirmed without manual verification
        }
        
        context["web_findings"].append(entry)

    return context

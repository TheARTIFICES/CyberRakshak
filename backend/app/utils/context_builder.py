from typing import Dict, Any, List

def build_unified_context(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms the existing normalized_report into the 
    Unified Security Context required by the AI module.
    """
    report = job_data.get("normalized_report", {})
    
    context = {
        "target": job_data.get("target"),
        "access_level": job_data.get("access_level", "none"), # Default to none for MVP
        "services": [],
        "web_findings": [],
        "confirmed_cves": [],
        "raw_outputs": job_data.get("tool_status", {}) # Summarized status
    }

    # 1. Map Nmap results to 'services'
    nmap_data = report.get("nmap", {})
    for port in nmap_data.get("open_ports", []):
        context["services"].append({
            "port": port.get("port"),
            "service": port.get("service"),
            "version": f"{port.get('product')} {port.get('version')}".strip()
        })

    # 2. Map Nuclei, Nikto, and ZAP to 'web_findings' and 'confirmed_cves'
    vulnerability_tools = ["nuclei", "nikto", "zap", "dirsearch"]
    for tool in vulnerability_tools:
        tool_findings = report.get(tool, [])
        for vuln in tool_findings:
            description = vuln.get("title") or vuln.get("description")
            context["web_findings"].append(f"[{tool.upper()}] {description}")
            
            if vuln.get("cve") and vuln.get("cve") != "N/A":
                context["confirmed_cves"].append(vuln.get("cve"))

    # Remove duplicates from CVE list
    context["confirmed_cves"] = list(set(context["confirmed_cves"]))
    
    return context

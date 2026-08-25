from typing import Dict, Any, List
import uuid

# Framework Definitions & Control Mapping
FRAMEWORK_CATALOG = [
    {
        "name": "DPDP_2023",
        "title": "Digital Personal Data Protection Act 2023",
        "category": "Indian Statutory",
        "penalty_cap_inr": 2500000000.0, # ₹250 Crore
        "requirements": [
            {"id": "DPDP-SEC-01", "name": "Reasonable Security Safeguards", "control_type": "MFA"},
            {"id": "DPDP-SEC-02", "name": "Encryption of Personal Data", "control_type": "EDR"},
            {"id": "DPDP-SEC-03", "name": "Data Breach Notification (<6h)", "control_type": "SOC_24x7_Monitoring"},
            {"id": "DPDP-SEC-04", "name": "Data Retention & Erasure", "control_type": "Backups"}
        ]
    },
    {
        "name": "SEBI_CSCRF",
        "title": "SEBI Cybersecurity & Cyber Resilience Framework",
        "category": "Capital Markets",
        "penalty_cap_inr": 50000000.0, # ₹5 Crore
        "requirements": [
            {"id": "SEBI-GOAL-01", "name": "Goal 1: Anticipate (Vulnerability Assessment)", "control_type": "ScanHeuristic"},
            {"id": "SEBI-GOAL-02", "name": "Goal 2: Withstand (Hardening & Micro-Segmentation)", "control_type": "Network_Segmentation"},
            {"id": "SEBI-GOAL-03", "name": "Goal 3: Contain (Privileged Access Management)", "control_type": "PAM"},
            {"id": "SEBI-GOAL-04", "name": "Goal 4: Recover (Immutable Backups & RTO SLA)", "control_type": "Backups"},
            {"id": "SEBI-GOAL-05", "name": "Goal 5: Evolve (Threat Intel & Red Teaming)", "control_type": "EDR"}
        ]
    },
    {
        "name": "RBI_CSF",
        "title": "RBI Cyber Security Framework for Banks",
        "category": "Banking & Financial",
        "penalty_cap_inr": 100000000.0, # ₹10 Crore
        "requirements": [
            {"id": "RBI-ANNEX-01", "name": "Multi-Factor Authentication on All Banking Endpoints", "control_type": "MFA"},
            {"id": "RBI-ANNEX-02", "name": "Continuous Vulnerability Management", "control_type": "ScanHeuristic"},
            {"id": "RBI-ANNEX-03", "name": "Real-time SOC Monitoring", "control_type": "SOC_24x7_Monitoring"},
            {"id": "RBI-ANNEX-04", "name": "Network Isolation of Core Payment Switch", "control_type": "Network_Segmentation"}
        ]
    },
    {
        "name": "ISO_27001",
        "title": "ISO/IEC 27001:2022 ISMS",
        "category": "International Standard",
        "penalty_cap_inr": 0.0,
        "requirements": [
            {"id": "A.5.15", "name": "Access Control Management", "control_type": "MFA"},
            {"id": "A.8.7", "name": "Protection Against Malware", "control_type": "EDR"},
            {"id": "A.8.8", "name": "Management of Technical Vulnerabilities", "control_type": "ScanHeuristic"},
            {"id": "A.8.13", "name": "Information Backup", "control_type": "Backups"},
            {"id": "A.8.20", "name": "Network Security", "control_type": "Network_Segmentation"}
        ]
    },
    {
        "name": "NIST_CSF",
        "title": "NIST Cybersecurity Framework 2.0",
        "category": "Global Framework",
        "penalty_cap_inr": 0.0,
        "requirements": [
            {"id": "GOVERN", "name": "GV.OC: Organizational Context & Risk Strategy", "control_type": "PAM"},
            {"id": "IDENTIFY", "name": "ID.AM: Asset & Vulnerability Identification", "control_type": "ScanHeuristic"},
            {"id": "PROTECT", "name": "PR.AA: Identity Management & Access Control", "control_type": "MFA"},
            {"id": "DETECT", "name": "DE.CM: Continuous Monitoring & Telemetry", "control_type": "EDR"},
            {"id": "RESPOND", "name": "RS.MA: Incident Mitigation & Forensics", "control_type": "SOC_24x7_Monitoring"},
            {"id": "RECOVER", "name": "RC.RP: Resilience Execution & Restoration", "control_type": "Backups"}
        ]
    },
    {
        "name": "CIS_CONTROLS_V8",
        "title": "CIS Critical Security Controls v8",
        "category": "Technical Benchmark",
        "penalty_cap_inr": 0.0,
        "requirements": [
            {"id": "CIS-01", "name": "Inventory & Control of Enterprise Assets", "control_type": "ScanHeuristic"},
            {"id": "CIS-06", "name": "Access Control Management (MFA/PAM)", "control_type": "MFA"},
            {"id": "CIS-07", "name": "Continuous Vulnerability Management", "control_type": "ScanHeuristic"},
            {"id": "CIS-10", "name": "Malware Defenses (EDR)", "control_type": "EDR"},
            {"id": "CIS-11", "name": "Data Recovery Capabilities", "control_type": "Backups"}
        ]
    }
]

def evaluate_framework_compliance(
    active_controls: List[Dict[str, Any]],
    vulnerabilities_count: int = 0
) -> List[Dict[str, Any]]:
    """
    Evaluates compliance percentages, gap counts, and statutory penalty exposures across all 6 frameworks.
    """
    enforced_control_types = set()
    for c in active_controls:
        if c.get("is_enforced", False) and float(c.get("effectiveness", 0.0)) >= 0.70:
            enforced_control_types.add(c.get("control_type"))

    results = []
    for fw in FRAMEWORK_CATALOG:
        reqs = fw["requirements"]
        total_reqs = len(reqs)
        passed_reqs = 0
        gaps = []

        for r in reqs:
            req_ctrl = r["control_type"]
            if req_ctrl in enforced_control_types:
                passed_reqs += 1
            else:
                gaps.append({
                    "req_id": r["id"],
                    "req_name": r["name"],
                    "missing_control": req_ctrl,
                    "remediation": f"Deploy and enforce {req_ctrl} across all in-scope infrastructure."
                })

        score_pct = (passed_reqs / total_reqs) * 100.0 if total_reqs > 0 else 100.0
        
        # Exposure proportional to gap ratio
        penalty_exposure = fw["penalty_cap_inr"] * (len(gaps) / total_reqs) if total_reqs > 0 else 0.0

        results.append({
            "framework_name": fw["name"],
            "framework_title": fw["title"],
            "category": fw["category"],
            "score": round(score_pct, 1),
            "passed_count": passed_reqs,
            "total_count": total_reqs,
            "gap_count": len(gaps),
            "regulatory_penalty_exposure_inr": penalty_exposure,
            "gaps": gaps
        })

    return results

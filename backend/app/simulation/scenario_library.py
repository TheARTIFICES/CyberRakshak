from typing import Dict, Any, List

# Standard Enterprise Scenario Templates
SCENARIO_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "MFA_EVERYWHERE": {
        "id": "MFA_EVERYWHERE",
        "name": "Mandatory Enterprise MFA Enforcement",
        "description": "Deploys hardware-token / authenticator MFA across all privileged access endpoints, raising MFA effectiveness to 95%.",
        "category": "Identity & Access",
        "default_cost_inr": 450000.0,
        "parameter_overrides": {
            "control_overrides": [{"control_type": "MFA", "is_enforced": True, "effectiveness": 0.95}]
        }
    },
    "PATCH_CRITICAL_CVES": {
        "id": "PATCH_CRITICAL_CVES",
        "name": "Rapid Critical Vulnerability Patching",
        "description": "Immediately remediates all CVSS >= 9.0 and CISA KEV cataloged vulnerabilities across the perimeter.",
        "category": "Vulnerability Management",
        "default_cost_inr": 600000.0,
        "parameter_overrides": {
            "filter_critical_cves": True
        }
    },
    "NETWORK_SEGMENTATION": {
        "id": "NETWORK_SEGMENTATION",
        "name": "Micro-Segmentation & Zero Trust Isolation",
        "description": "Isolates core crown jewel databases and switches exposure from Internet-facing to protected DMZ (TEF drops to 2.0/yr).",
        "category": "Network Architecture",
        "default_cost_inr": 1200000.0,
        "parameter_overrides": {
            "exposure_override": "DMZ",
            "control_overrides": [{"control_type": "Network_Segmentation", "is_enforced": True, "effectiveness": 0.90}]
        }
    },
    "DELAY_REMEDIATION_30D": {
        "id": "DELAY_REMEDIATION_30D",
        "name": "Remediation Postponement (Cost of Inaction - 30 Days)",
        "description": "Simulates threat maturation and increased exploit availability over a 30-day delay period (+15% likelihood growth).",
        "category": "Risk Governance",
        "default_cost_inr": 0.0,
        "parameter_overrides": {
            "tef_multiplier": 1.15,
            "vuln_multiplier": 1.20
        }
    },
    "ACTIVE_RANSOMWARE_CAMPAIGN": {
        "id": "ACTIVE_RANSOMWARE_CAMPAIGN",
        "name": "Targeted Sector Ransomware Wave",
        "description": "Simulates an active threat campaign with 2.5x threat event frequency and compromised backup resistance.",
        "category": "Threat Intelligence",
        "default_cost_inr": 0.0,
        "parameter_overrides": {
            "tef_multiplier": 2.5,
            "control_overrides": [{"control_type": "Backups", "is_enforced": False, "effectiveness": 0.0}]
        }
    }
}

def get_scenario_catalog() -> List[Dict[str, Any]]:
    """Returns list of pre-configured scenario templates."""
    return list(SCENARIO_TEMPLATES.values())

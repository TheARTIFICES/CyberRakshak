import math
from typing import List, Dict, Any, Optional
from .epss_client import get_epss_score

# Threat Event Frequency (TEF) defaults (events per year)
TEF_RATES = {
    "Internet-facing": 12.0,
    "Internet": 12.0,
    "Public": 12.0,
    "DMZ": 4.0,
    "Internal": 1.0,
    "Isolated": 0.2
}

def get_threat_event_frequency(exposure: str) -> float:
    """Returns baseline annual Threat Event Frequency (lambda_TEF) based on network exposure."""
    if not exposure:
        return 1.0
    for key, rate in TEF_RATES.items():
        if key.lower() in exposure.lower():
            return rate
    return 1.0

def compute_vulnerability_factor(
    cvss_score: Optional[float],
    cve_id: Optional[str] = None,
    has_exploit: bool = False,
    is_cisa_kev: bool = False,
    epss_score: Optional[float] = None
) -> float:
    """
    Computes conditional probability of compromise given a threat event:
    Vuln = min(1.0, (CVSS / 10.0) * (0.5 + 0.5 * EPSS) * w_exploit * w_kev)
    
    Weights:
    - w_exploit = 1.35 if exploit exists in ExploitDB
    - w_kev = 1.70 if cataloged in CISA KEV
    """
    base_cvss = max(0.0, min(10.0, float(cvss_score or 5.0)))
    cvss_norm = base_cvss / 10.0
    
    # Enrich with EPSS if not explicitly passed
    if epss_score is None and cve_id:
        epss_res = get_epss_score(cve_id)
        if epss_res:
            epss_score = epss_res[0]
            
    if epss_score is not None and 0.0 <= epss_score <= 1.0:
        epss_mod = 0.5 + (0.5 * epss_score)
    else:
        # Neutral modifier if EPSS unavailable
        epss_mod = 1.0
        
    w_exploit = 1.35 if has_exploit else 1.0
    w_kev = 1.70 if is_cisa_kev else 1.0
    
    vuln = cvss_norm * epss_mod * w_exploit * w_kev
    return min(1.0, max(0.01, vuln))

def combine_control_effectiveness(controls: List[Dict[str, Any]]) -> float:
    """
    Combines active control resistance multiplicatively across residual risk:
    CombinedControlEff = 1.0 - product(1.0 - eff_i)
    
    Ensures that two 50% controls combine to 75% protection (25% residual risk).
    """
    if not controls:
        return 0.0
        
    residual = 1.0
    for ctrl in controls:
        if isinstance(ctrl, dict):
            is_enforced = ctrl.get("is_enforced", False)
            eff = float(ctrl.get("effectiveness", 0.0))
        else:
            is_enforced = getattr(ctrl, "is_enforced", False)
            eff = float(getattr(ctrl, "effectiveness", 0.0))
            
        if is_enforced and eff > 0.0:
            capped_eff = min(0.99, max(0.0, eff))
            residual *= (1.0 - capped_eff)
            
    combined = 1.0 - residual
    return min(0.99, max(0.0, combined))

def compute_loss_event_frequency(
    tef: float,
    vuln_factor: float,
    control_eff: float
) -> float:
    """
    FAIR Loss Event Frequency (annual rate lambda_LEF):
    lambda_LEF = TEF * Vuln * (1.0 - ControlEff)
    """
    return max(0.0, tef * vuln_factor * (1.0 - control_eff))

def compute_annual_breach_probability(lambda_lef: float) -> float:
    """
    Poisson-to-probability conversion for probability of >=1 breach per year:
    P_annual = 1.0 - e^(-lambda_LEF)
    """
    if lambda_lef <= 0.0:
        return 0.0
    return min(0.9999, max(0.0, 1.0 - math.exp(-lambda_lef)))

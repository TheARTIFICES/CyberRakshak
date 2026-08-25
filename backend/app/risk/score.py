def compute_enterprise_risk_score(
    total_eal_inr: float,
    total_asset_value_inr: float,
    critical_findings_count: int,
    total_findings_count: int,
    average_control_effectiveness: float
) -> int:
    """
    Computes a standardized, executive-friendly Enterprise Risk Score from 0 to 100
    (100 = Pristine / Low Risk, 0 = Catastrophic Risk Exposure).
    
    Formula components:
    - Loss Ratio Penalty (EAL / Asset Value): Up to 45 points
    - Critical Findings Penalty: Up to 30 points
    - Control Deficiency Penalty: Up to 25 points
    """
    asset_val = max(100000.0, float(total_asset_value_inr or 15000000.0))
    loss_ratio = total_eal_inr / asset_val
    
    # 1. Loss ratio deduction (0 to 45 pts)
    # If loss ratio >= 20% of asset value, max penalty applied
    loss_penalty = min(45.0, (loss_ratio / 0.20) * 45.0)
    
    # 2. Critical findings deduction (0 to 30 pts)
    crit_penalty = min(30.0, float(critical_findings_count) * 6.0)
    
    # 3. Control deficiency deduction (0 to 25 pts)
    ctrl_eff = max(0.0, min(1.0, float(average_control_effectiveness)))
    control_penalty = (1.0 - ctrl_eff) * 25.0
    
    raw_score = 100.0 - (loss_penalty + crit_penalty + control_penalty)
    final_score = int(round(max(0.0, min(100.0, raw_score))))
    return final_score

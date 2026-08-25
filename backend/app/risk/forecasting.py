from typing import List, Dict, Any
from datetime import datetime, timedelta

def project_risk_trend(
    historical_snapshots: List[Dict[str, Any]],
    current_eal_inr: float,
    unmitigated_critical_count: int
) -> Dict[str, Any]:
    """
    Computes risk trajectory and projects 30, 60, and 90-day Expected Annual Loss (EAL)
    assuming no remediation is undertaken (compounding due to threat maturation).
    """
    # Base maturation growth rate: ~2.5% per month baseline + 1.5% per critical vulnerability
    monthly_growth_rate = 0.025 + (0.015 * min(10, unmitigated_critical_count))
    
    projection_30d = current_eal_inr * (1.0 + monthly_growth_rate)
    projection_60d = current_eal_inr * ((1.0 + monthly_growth_rate) ** 2)
    projection_90d = current_eal_inr * ((1.0 + monthly_growth_rate) ** 3)
    
    cost_of_delay_30d = projection_30d - current_eal_inr
    cost_of_delay_60d = projection_60d - current_eal_inr
    cost_of_delay_90d = projection_90d - current_eal_inr
    
    # Calculate historical trend direction
    direction = "stable"
    delta_pct = 0.0
    if len(historical_snapshots) >= 2:
        oldest = float(historical_snapshots[-1].get("expected_annual_loss_inr", current_eal_inr))
        if oldest > 0:
            delta_pct = ((current_eal_inr - oldest) / oldest) * 100.0
            if delta_pct > 5.0:
                direction = "increasing"
            elif delta_pct < -5.0:
                direction = "decreasing"
                
    return {
        "current_eal_inr": current_eal_inr,
        "trend_direction": direction,
        "historical_delta_pct": delta_pct,
        "monthly_growth_rate_pct": monthly_growth_rate * 100.0,
        "projections": {
            "day_30_eal_inr": projection_30d,
            "day_60_eal_inr": projection_60d,
            "day_90_eal_inr": projection_90d
        },
        "cost_of_delay": {
            "day_30_inr": cost_of_delay_30d,
            "day_60_inr": cost_of_delay_60d,
            "day_90_inr": cost_of_delay_90d
        }
    }

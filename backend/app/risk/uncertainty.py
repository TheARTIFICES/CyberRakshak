import numpy as np
from typing import Tuple, Dict, Any, List

# Hard-capped simulation constant to prevent Denial-of-Service / unbounded execution
SIMULATION_YEARS_FIXED = 10000

def simulate_annual_loss(
    tef: float,
    vuln_factor: float,
    control_eff: float,
    point_sle: float,
    uncertainty_factor: float = 0.25
) -> Tuple[float, float, float, float]:
    """
    FAIR Compound Poisson Monte Carlo Simulation (Vectorized across N=10,000 simulation years).
    
    Parameters:
    - tef: Threat Event Frequency (annual rate lambda, e.g. 12.0 events/year)
    - vuln_factor: Vulnerability conditional probability (0.0 to 1.0)
    - control_eff: Combined active control resistance (0.0 to 1.0)
    - point_sle: Single Loss Expectancy (INR)
    - uncertainty_factor: Standard deviation ratio for lognormal severity dispersion
    
    Returns:
    - (eal_point, eal_low_10th, eal_high_90th, var_95) in INR
    """
    lambda_lef = max(0.0, tef * vuln_factor * (1.0 - control_eff))
    if lambda_lef <= 0 or point_sle <= 0:
        return 0.0, 0.0, 0.0, 0.0

    # 1. Sample number of breach events per simulation year
    event_counts = np.random.poisson(lam=lambda_lef, size=SIMULATION_YEARS_FIXED)
    total_events = int(np.sum(event_counts))
    
    if total_events == 0:
        return 0.0, 0.0, 0.0, 0.0

    # 2. Parameterize Lognormal distribution for Single Loss Expectancy (SLE)
    sigma_sle = np.sqrt(np.log(1.0 + (uncertainty_factor ** 2)))
    mu_sle = np.log(point_sle) - (0.5 * (sigma_sle ** 2))
    
    # 3. Sample loss magnitudes across all generated events
    event_losses = np.random.lognormal(mean=mu_sle, sigma=sigma_sle, size=total_events)

    # 4. Map event losses back to annual sum buckets
    annual_losses = np.zeros(SIMULATION_YEARS_FIXED, dtype=np.float64)
    offsets = np.zeros(SIMULATION_YEARS_FIXED + 1, dtype=int)
    offsets[1:] = np.cumsum(event_counts)
    
    for i in range(SIMULATION_YEARS_FIXED):
        start, end = offsets[i], offsets[i + 1]
        if end > start:
            annual_losses[i] = np.sum(event_losses[start:end])

    eal_point = float(np.mean(annual_losses))
    eal_low = float(np.percentile(annual_losses, 10))
    eal_high = float(np.percentile(annual_losses, 90))
    var_95 = float(np.percentile(annual_losses, 95))

    return eal_point, eal_low, eal_high, var_95

def get_loss_distribution_histogram(
    annual_losses: np.ndarray,
    bins_count: int = 20
) -> List[Dict[str, Any]]:
    """Returns histogram bins for rendering loss density distribution in the frontend."""
    if len(annual_losses) == 0 or np.all(annual_losses == 0):
        return []
        
    counts, bin_edges = np.histogram(annual_losses, bins=bins_count)
    histogram = []
    for i in range(len(counts)):
        histogram.append({
            "bin_start_inr": float(bin_edges[i]),
            "bin_end_inr": float(bin_edges[i+1]),
            "frequency": int(counts[i])
        })
    return histogram

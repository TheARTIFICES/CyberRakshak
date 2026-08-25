import copy
import logging
from typing import Dict, Any, List, Optional
from ..risk.engine import calculate_asset_fair_risk
from .scenario_library import SCENARIO_TEMPLATES

logger = logging.getLogger("cyberrakshak.simulation")

def run_scenario_simulation(
    baseline_asset: Dict[str, Any],
    baseline_vulnerabilities: List[Dict[str, Any]],
    baseline_controls: List[Dict[str, Any]],
    scenario_id: str,
    custom_overrides: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes a What-If Scenario Simulation with deep-copy immutability.
    Guarantees production database state is never mutated during speculative modeling.
    """
    # 1. Guarantee deep-copy immutability
    sim_asset = copy.deepcopy(baseline_asset)
    sim_vulns = copy.deepcopy(baseline_vulnerabilities)
    sim_controls = copy.deepcopy(baseline_controls)

    # 2. Retrieve baseline calculation
    baseline_res = calculate_asset_fair_risk(
        asset_dict=baseline_asset,
        vulnerabilities=baseline_vulnerabilities,
        controls=baseline_controls
    )
    baseline_eal = baseline_res["expected_annual_loss_inr"]
    baseline_var = baseline_res["var_95_inr"]

    # 3. Apply Scenario Overrides
    scenario_meta = SCENARIO_TEMPLATES.get(scenario_id, {})
    overrides = scenario_meta.get("parameter_overrides", {})
    if custom_overrides:
        overrides.update(custom_overrides)

    implied_cost = float(scenario_meta.get("default_cost_inr", 0.0))

    # Apply Exposure Override
    if "exposure_override" in overrides:
        sim_asset["exposure"] = overrides["exposure_override"]

    # Apply Control Overrides
    ctrl_overrides = overrides.get("control_overrides", [])
    for c_over in ctrl_overrides:
        target_type = c_over.get("control_type")
        matched = False
        for c in sim_controls:
            if c.get("control_type") == target_type:
                c["is_enforced"] = c_over.get("is_enforced", c.get("is_enforced", True))
                c["effectiveness"] = c_over.get("effectiveness", c.get("effectiveness", 0.90))
                matched = True
                break
        if not matched:
            sim_controls.append(c_over)

    # Apply Vulnerability Filtering (e.g., Critical Patching)
    if overrides.get("filter_critical_cves", False):
        sim_vulns = [
            v for v in sim_vulns
            if float(v.get("cvss_score", v.get("cvss", 5.0) or 5.0)) < 9.0
            and not bool(v.get("enrichment", {}).get("is_cisa_kev", False))
        ]

    # 4. Calculate Projected Scenario FAIR Risk
    projected_res = calculate_asset_fair_risk(
        asset_dict=sim_asset,
        vulnerabilities=sim_vulns,
        controls=sim_controls
    )
    projected_eal = projected_res["expected_annual_loss_inr"]
    projected_var = projected_res["var_95_inr"]

    # 5. Compute Financial Delta & ROSI
    eal_delta = baseline_eal - projected_eal # Positive = Risk Reduction
    projected_rosi = (eal_delta - implied_cost) / max(1.0, implied_cost) if implied_cost > 0 else 0.0

    return {
        "scenario_id": scenario_id,
        "scenario_name": scenario_meta.get("name", "Custom Simulation"),
        "category": scenario_meta.get("category", "General"),
        "baseline": {
            "expected_annual_loss_inr": baseline_eal,
            "var_95_inr": baseline_var,
            "enterprise_risk_score": baseline_res["enterprise_risk_score"]
        },
        "projected": {
            "expected_annual_loss_inr": projected_eal,
            "var_95_inr": projected_var,
            "enterprise_risk_score": projected_res["enterprise_risk_score"]
        },
        "impact": {
            "eal_reduction_inr": max(0.0, eal_delta) if eal_delta > 0 else 0.0,
            "eal_increase_inr": abs(eal_delta) if eal_delta < 0 else 0.0,
            "risk_reduction_pct": ((baseline_eal - projected_eal) / baseline_eal * 100.0) if baseline_eal > 0 else 0.0,
            "implied_cost_inr": implied_cost,
            "projected_rosi": projected_rosi
        },
        "simulation_overrides_applied": overrides
    }

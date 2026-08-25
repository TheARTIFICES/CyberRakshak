import logging
from typing import Dict, Any, List, Optional
import uuid

from .likelihood import (
    get_threat_event_frequency,
    compute_vulnerability_factor,
    combine_control_effectiveness,
    compute_loss_event_frequency,
    compute_annual_breach_probability
)
from .impact import compute_single_loss_expectancy
from .uncertainty import simulate_annual_loss
from .provenance import compute_provenance_input_hash, build_provenance_tree, flatten_provenance_drivers
from .score import compute_enterprise_risk_score
from .epss_client import get_epss_score

logger = logging.getLogger("cyberrakshak.risk_engine")

def calculate_asset_fair_risk(
    asset_dict: Dict[str, Any],
    vulnerabilities: List[Dict[str, Any]],
    controls: List[Dict[str, Any]],
    org_name: str = "Enterprise Organization",
    bu_name: str = "Core Operations",
    tef_multiplier: float = 1.0,
    vuln_severity_multiplier: float = 1.0
) -> Dict[str, Any]:
    """
    Main FAIR Quantitative Risk Engine Pipeline.
    Calculates deterministic EAL, Monte Carlo distribution, candidate mitigations,
    and hierarchical provenance tree for an asset.

    tef_multiplier / vuln_severity_multiplier default to 1.0 (no-op) for every
    normal scan-pipeline call. They exist for the Scenario Simulation Workbench
    (simulation/scenario_engine.py), which models threat-maturation and active-
    campaign what-ifs that change threat frequency or exploit severity without
    changing exposure or controls.
    """
    asset_id = str(asset_dict.get("id", uuid.uuid4()))
    asset_name = asset_dict.get("name", "Target-Asset")
    exposure = asset_dict.get("exposure", "Internal")
    criticality = asset_dict.get("criticality", "Tier-2")
    asset_type = asset_dict.get("asset_type", "Web Server")
    business_val = float(asset_dict.get("business_value_inr", 15000000.0))
    records_count = int(asset_dict.get("records_count", 0))
    data_sensitivity = asset_dict.get("data_sensitivity", "Internal")

    # 1. Threat Event Frequency (TEF)
    tef = get_threat_event_frequency(exposure) * tef_multiplier

    # 2. Combined Active Control Effectiveness
    control_eff = combine_control_effectiveness(controls)

    # 3. Single Loss Expectancy (SLE)
    sle_data = compute_single_loss_expectancy(
        business_value_inr=business_val,
        criticality=criticality,
        records_count=records_count,
        data_sensitivity=data_sensitivity,
        asset_type=asset_type
    )
    point_sle = sle_data["single_loss_expectancy_inr"]

    # 4. Process Each Vulnerability Finding
    finding_records = []
    total_finding_vuln = 0.0
    candidate_actions = []
    critical_count = 0

    for v in vulnerabilities:
        cve = v.get("cve", v.get("cve_id"))
        cvss = min(10.0, float(v.get("cvss_score", v.get("cvss", 5.0) or 5.0)) * vuln_severity_multiplier)
        enrichment = v.get("enrichment", {})
        has_exploit = bool(enrichment.get("has_exploit", v.get("has_exploit", False)))
        is_cisa_kev = bool(enrichment.get("is_cisa_kev", v.get("is_cisa_kev", False)))
        epss_score = enrichment.get("epss_score")

        if cvss >= 9.0:
            critical_count += 1

        vuln_factor = compute_vulnerability_factor(
            cvss_score=cvss,
            cve_id=cve,
            has_exploit=has_exploit,
            is_cisa_kev=is_cisa_kev,
            epss_score=epss_score
        )
        total_finding_vuln += vuln_factor

        # Finding-level loss event frequency & loss contribution
        finding_lambda = compute_loss_event_frequency(tef, vuln_factor, control_eff)
        finding_loss_contrib = finding_lambda * point_sle

        finding_rec = {
            "cve_id": cve,
            "title": v.get("title", v.get("name", cve or "Vulnerability")),
            "cvss_score": cvss,
            "epss_score": epss_score,
            "has_exploit": has_exploit,
            "is_cisa_kev": is_cisa_kev,
            "vuln_factor": vuln_factor,
            "annual_likelihood": compute_annual_breach_probability(finding_lambda),
            "loss_contribution_inr": finding_loss_contrib
        }
        finding_records.append(finding_rec)

        # Generate Candidate Mitigation Action for each finding
        est_cost = 75000.0 if cvss < 7.0 else (150000.0 if cvss < 9.0 else 300000.0) # Standard patch cost benchmark
        projected_reduction = finding_loss_contrib * 0.85 # 85% EAL reduction upon patch verification
        rosi = (projected_reduction - est_cost) / est_cost if est_cost > 0 else 0.0

        candidate_actions.append({
            "id": str(uuid.uuid4()),
            "asset_id": asset_id,
            "cve_id": cve,
            "title": f"Patch & Remediate {cve or v.get('title')}",
            "description": v.get("solution", f"Apply security patch and vendor configuration fix for {cve}."),
            "action_type": "patch",
            "estimated_cost_inr": est_cost,
            "estimated_reduction_inr": projected_reduction,
            "estimated_rosi": rosi,
            "status": "proposed"
        })

    # Add control deployment recommendations if control effectiveness is low
    if control_eff < 0.70:
        candidate_actions.append({
            "id": str(uuid.uuid4()),
            "asset_id": asset_id,
            "cve_id": None,
            "title": f"Enforce Multi-Factor Authentication (MFA) on {asset_name}",
            "description": "Deploy mandatory hardware token / authenticator MFA on privileged access endpoints.",
            "action_type": "control_deployment",
            "estimated_cost_inr": 250000.0,
            "estimated_reduction_inr": (point_sle * tef * 0.15),
            "estimated_rosi": ((point_sle * tef * 0.15) - 250000.0) / 250000.0,
            "status": "proposed"
        })

    # 5. Composite Asset-Level Vulnerability & LEF
    # Average vulnerability bounded by max finding vulnerability
    if finding_records:
        avg_vuln = min(1.0, total_finding_vuln / len(finding_records))
        max_vuln = max(f["vuln_factor"] for f in finding_records)
        composite_vuln = min(1.0, (avg_vuln * 0.4) + (max_vuln * 0.6))
    else:
        composite_vuln = 0.05 # Baseline residual susceptibility

    lambda_lef = compute_loss_event_frequency(tef, composite_vuln, control_eff)
    annual_prob = compute_annual_breach_probability(lambda_lef)

    # 6. Monte Carlo Uncertainty Simulation (Compound Poisson, N=10,000 years)
    eal_point, eal_low, eal_high, var_95 = simulate_annual_loss(
        tef=tef,
        vuln_factor=composite_vuln,
        control_eff=control_eff,
        point_sle=point_sle
    )

    # 7. Enterprise Risk Score (0-100)
    risk_score = compute_enterprise_risk_score(
        total_eal_inr=eal_point,
        total_asset_value_inr=business_val,
        critical_findings_count=critical_count,
        total_findings_count=len(finding_records),
        average_control_effectiveness=control_eff
    )

    # 8. Cryptographic Input Hash for Auditability (HMAC-SHA256)
    snapshot_id = str(uuid.uuid4())
    input_payload = {
        "asset": asset_dict,
        "vulnerabilities": finding_records,
        "controls": controls,
        "tef": tef,
        "control_eff": control_eff,
        "point_sle": point_sle
    }
    input_hash = compute_provenance_input_hash(input_payload)

    # 9. Build Hierarchical Provenance Tree
    prov_tree = build_provenance_tree(
        org_name=org_name,
        bu_name=bu_name,
        asset_id=asset_id,
        asset_name=asset_name,
        findings=finding_records,
        controls=controls,
        total_eal_inr=eal_point
    )
    flattened_drivers = flatten_provenance_drivers(prov_tree, snapshot_id=snapshot_id)

    return {
        "snapshot_id": snapshot_id,
        "asset_id": asset_id,
        "expected_annual_loss_inr": eal_point,
        "eal_low_inr": eal_low,
        "eal_high_inr": eal_high,
        "var_95_inr": var_95,
        "enterprise_risk_score": risk_score,
        "single_loss_expectancy_inr": point_sle,
        "loss_event_frequency_lambda": lambda_lef,
        "annual_breach_probability": annual_prob,
        "threat_event_frequency": tef,
        "composite_vulnerability": composite_vuln,
        "combined_control_effectiveness": control_eff,
        "critical_findings_count": critical_count,
        "total_findings_count": len(finding_records),
        "sle_breakdown": sle_data,
        "candidate_actions": candidate_actions,
        "provenance_tree": prov_tree,
        "risk_drivers": flattened_drivers,
        "input_hash": input_hash
    }

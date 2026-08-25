import pytest
import numpy as np
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.risk import (
    get_epss_score,
    set_cached_epss,
    get_threat_event_frequency,
    compute_vulnerability_factor,
    combine_control_effectiveness,
    compute_loss_event_frequency,
    compute_annual_breach_probability,
    compute_single_loss_expectancy,
    compute_statutory_penalties,
    simulate_annual_loss,
    optimize_security_investments,
    generate_spend_curve,
    compute_provenance_input_hash,
    build_provenance_tree,
    flatten_provenance_drivers,
    compute_enterprise_risk_score,
    calculate_asset_fair_risk
)

def test_epss_client_and_sanitization():
    # Invalid CVE format should return None
    assert get_epss_score("invalid-cve") is None
    assert get_epss_score("../etc/passwd") is None
    assert get_epss_score("CVE-2024-123") is None # too short
    
    # Test manual seeding / caching
    set_cached_epss("CVE-2021-41773", 0.942, 0.98)
    res = get_epss_score("CVE-2021-41773")
    assert res is not None
    assert res[0] == 0.942
    assert res[1] == 0.98

def test_likelihood_mathematics():
    # Test TEF exposure rates
    assert get_threat_event_frequency("Internet-facing") == 12.0
    assert get_threat_event_frequency("DMZ") == 4.0
    assert get_threat_event_frequency("Internal") == 1.0
    assert get_threat_event_frequency("Isolated") == 0.2
    
    # Test Vuln factor calculation
    vuln = compute_vulnerability_factor(cvss_score=9.8, epss_score=0.9, has_exploit=True, is_cisa_kev=True)
    assert 0.0 < vuln <= 1.0
    
    # Test multiplicative control combination
    controls = [
        {"control_type": "MFA", "is_enforced": True, "effectiveness": 0.85},
        {"control_type": "EDR", "is_enforced": True, "effectiveness": 0.75}
    ]
    # Residual: (1 - 0.85) * (1 - 0.75) = 0.15 * 0.25 = 0.0375 -> Combined: 1 - 0.0375 = 0.9625
    combined = combine_control_effectiveness(controls)
    assert pytest.approx(combined, 0.001) == 0.9625
    
    # Test LEF and Poisson-to-probability
    tef = 12.0
    lambda_lef = compute_loss_event_frequency(tef=tef, vuln_factor=0.8, control_eff=0.5)
    assert lambda_lef == 12.0 * 0.8 * 0.5 # 4.8 events/year
    
    prob = compute_annual_breach_probability(lambda_lef)
    assert 0.0 < prob < 1.0

def test_impact_and_statutory_penalties():
    # DPDP 2023 with 50,000 PII records
    penalties = compute_statutory_penalties(
        records_count=50000,
        data_sensitivity="PII",
        asset_type="Web Server"
    )
    # 50,000 * 10,000 = ₹50 Crore
    assert penalties["dpdp_2023_inr"] == 500000000.0
    assert penalties["cert_in_inr"] == 100000.0
    
    # Test DPDP 2023 maximum cap enforcement (e.g. 5,000,000 records -> would be ₹5000 Cr, capped at ₹250 Cr)
    penalties_capped = compute_statutory_penalties(
        records_count=5000000,
        data_sensitivity="PII",
        asset_type="Database"
    )
    assert penalties_capped["dpdp_2023_inr"] == 2500000000.0 # Exactly ₹250 Cr cap
    
    # Full SLE calculation
    sle_res = compute_single_loss_expectancy(
        business_value_inr=50000000.0, # ₹5.0 Cr
        criticality="Tier-1",
        records_count=10000,
        data_sensitivity="PII"
    )
    assert sle_res["single_loss_expectancy_inr"] > 0
    assert sle_res["primary_loss_inr"] > 0
    assert sle_res["secondary_regulatory_loss_inr"] > 0

def test_monte_carlo_compound_poisson():
    # Fixed N=10,000 simulation test
    eal_point, eal_low, eal_high, var_95 = simulate_annual_loss(
        tef=12.0,
        vuln_factor=0.75,
        control_eff=0.60,
        point_sle=15000000.0
    )
    assert eal_point > 0
    assert eal_low >= 0
    assert eal_low <= eal_point
    assert eal_point <= eal_high
    assert eal_high <= var_95

def test_pulp_milp_optimizer():
    actions = [
        {"id": "act_patch_1", "title": "Patch Critical CVE", "estimated_cost_inr": 150000.0, "estimated_reduction_inr": 1200000.0},
        {"id": "act_mfa", "title": "Enforce MFA", "estimated_cost_inr": 250000.0, "estimated_reduction_inr": 2000000.0},
        {"id": "act_pam", "title": "Deploy PAM", "estimated_cost_inr": 500000.0, "estimated_reduction_inr": 1500000.0}
    ]
    # Budget: ₹3 Lakh (can only afford Patch 1 + MFA or PAM)
    res = optimize_security_investments(
        actions=actions,
        budget_inr=350000.0
    )
    assert res["total_cost_inr"] <= 350000.0
    assert len(res["selected_actions"]) >= 1
    assert res["overall_rosi"] > 0
    
    # Test dependency constraint: PAM requires MFA
    # If budget is ₹5 Lakh and PAM is chosen, MFA must be chosen if dependencies specified
    res_dep = optimize_security_investments(
        actions=actions,
        budget_inr=600000.0,
        dependencies=[("act_pam", "act_mfa")]
    )
    selected_ids = [a["id"] for a in res_dep["selected_actions"]]
    if "act_pam" in selected_ids:
        assert "act_mfa" in selected_ids
        
    # Test Pareto spend curve
    curve = generate_spend_curve(actions, max_budget_inr=1000000.0, steps=5)
    assert len(curve["curve_points"]) == 5
    assert curve["knee_point"] is not None

def test_provenance_and_auditability():
    data = {"test_key": "test_value", "num": 12345}
    hash1 = compute_provenance_input_hash(data)
    hash2 = compute_provenance_input_hash(data)
    assert hash1 == hash2
    assert len(hash1) == 64 # SHA256 hex length
    
    tree = build_provenance_tree(
        org_name="Apex Bank",
        bu_name="Retail Banking",
        asset_id=str(uuid.uuid4()),
        asset_name="EHR-Core",
        findings=[{"cve_id": "CVE-2024-3400", "title": "Palo Alto RCE", "cvss_score": 9.8, "loss_contribution_inr": 5000000.0}],
        controls=[{"control_type": "MFA", "is_enforced": False}],
        total_eal_inr=5000000.0
    )
    assert tree["level"] == "org"
    assert len(tree["children"]) == 1 # BU
    
    flattened = flatten_provenance_drivers(tree, snapshot_id=str(uuid.uuid4()))
    assert len(flattened) >= 3

def test_full_asset_fair_pipeline():
    asset = {
        "id": str(uuid.uuid4()),
        "name": "Production-Core-DB",
        "exposure": "Internet-facing",
        "criticality": "Tier-1",
        "asset_type": "Database",
        "business_value_inr": 50000000.0, # ₹5.0 Cr
        "records_count": 25000,
        "data_sensitivity": "PII"
    }
    vulnerabilities = [
        {"cve": "CVE-2021-41773", "cvss_score": 9.8, "has_exploit": True, "is_cisa_kev": True, "solution": "Upgrade Apache"}
    ]
    controls = [
        {"control_type": "MFA", "is_enforced": True, "effectiveness": 0.85},
        {"control_type": "EDR", "is_enforced": False, "effectiveness": 0.75}
    ]
    
    res = calculate_asset_fair_risk(asset, vulnerabilities, controls)
    assert res["expected_annual_loss_inr"] > 0
    assert res["var_95_inr"] >= res["expected_annual_loss_inr"]
    assert 0 <= res["enterprise_risk_score"] <= 100
    assert len(res["candidate_actions"]) >= 1
    assert len(res["input_hash"]) == 64
    assert res["provenance_tree"] is not None

from typing import Dict, Any, Optional

# Indian Statutory Regulatory Penalties Caps & Benchmark Constants (in INR)
DPDP_2023_MAX_CAP_INR = 2500000000.0  # ₹250 Crore statutory maximum cap
DPDP_PER_RECORD_PENALTY_INR = 10000.0 # Tiered statutory benchmark per exposed sensitive record
SEBI_CSCRF_MAX_PENALTY_INR = 50000000.0 # ₹5.0 Crore SEBI settlement non-compliance cap
RBI_CSF_SUPERVISORY_FINE_INR = 100000000.0 # ₹10.0 Crore RBI supervisory fine cap
CERT_IN_SANCTION_INR = 100000.0 # ₹1 Lakh statutory fine for missed 6-hour reporting window

# Asset Criticality Exposure Factors (Single Loss Impact Multipliers)
EXPOSURE_FACTORS = {
    "Tier-1": 0.40, # Crown Jewel: 40% asset impairment on breach
    "Tier-2": 0.25, # High: 25% impairment
    "Tier-3": 0.15, # Medium: 15% impairment
    "Tier-4": 0.05  # Low: 5% impairment
}

def compute_statutory_penalties(
    records_count: int,
    data_sensitivity: str,
    asset_type: str,
    is_critical_settlement: bool = False
) -> Dict[str, float]:
    """
    Computes statutory regulatory penalty exposures under Indian cybersecurity legislation.
    """
    penalties = {
        "dpdp_2023_inr": 0.0,
        "sebi_cscrf_inr": 0.0,
        "rbi_csf_inr": 0.0,
        "cert_in_inr": 0.0,
        "total_regulatory_inr": 0.0
    }
    
    # 1. DPDP Act 2023 (Applies to PII, Health, Financial data breaches)
    if data_sensitivity in ["PII", "Financial", "Health", "Confidential"] and records_count > 0:
        raw_dpdp = float(records_count) * DPDP_PER_RECORD_PENALTY_INR
        penalties["dpdp_2023_inr"] = min(raw_dpdp, DPDP_2023_MAX_CAP_INR)
    elif data_sensitivity in ["PII", "Financial", "Health"]:
        # Minimum baseline regulatory exposure for unquantified PII breach
        penalties["dpdp_2023_inr"] = 10000000.0 # ₹1.0 Crore baseline
        
    # 2. SEBI CSCRF (Applies to Trading, Clearing & Market Infrastructure)
    if is_critical_settlement or asset_type in ["Trading Gateway", "Core Clearing"]:
        penalties["sebi_cscrf_inr"] = SEBI_CSCRF_MAX_PENALTY_INR
    elif asset_type == "Database" and data_sensitivity == "Financial":
        penalties["sebi_cscrf_inr"] = 10000000.0 # ₹1.0 Crore
        
    # 3. RBI Cyber Security Framework (Applies to Banking & Payment Core)
    if asset_type in ["Core Banking", "Payment Switch"] or (data_sensitivity == "Financial" and records_count > 5000):
        penalties["rbi_csf_inr"] = RBI_CSF_SUPERVISORY_FINE_INR
        
    # 4. CERT-In Incident Directions (Mandatory 6-Hour SLA)
    penalties["cert_in_inr"] = CERT_IN_SANCTION_INR
    
    penalties["total_regulatory_inr"] = (
        penalties["dpdp_2023_inr"] +
        penalties["sebi_cscrf_inr"] +
        penalties["rbi_csf_inr"] +
        penalties["cert_in_inr"]
    )
    return penalties

def compute_single_loss_expectancy(
    business_value_inr: float,
    criticality: str = "Tier-2",
    records_count: int = 0,
    data_sensitivity: str = "Internal",
    asset_type: str = "Web Server",
    downtime_hours_estimate: float = 8.0,
    hourly_outage_cost_inr: float = 250000.0 # ₹2.5 Lakh/hr downtime default
) -> Dict[str, Any]:
    """
    Computes Single Loss Expectancy (SLE) = Primary Loss + Secondary Loss (Regulatory Penalties).
    """
    asset_val = max(100000.0, float(business_value_inr or 15000000.0))
    ef = EXPOSURE_FACTORS.get(criticality, 0.25)
    
    # 1. Primary Direct Asset Impairment
    primary_asset_loss = asset_val * ef
    
    # 2. Business Interruption & Incident Response Costs
    downtime_loss = max(0.0, downtime_hours_estimate * hourly_outage_cost_inr)
    incident_response_cost = max(500000.0, asset_val * 0.05) # ~5% of asset value or min ₹5 Lakh
    total_primary_loss = primary_asset_loss + downtime_loss + incident_response_cost
    
    # 3. Secondary Regulatory Statutory Penalties
    penalties = compute_statutory_penalties(
        records_count=records_count,
        data_sensitivity=data_sensitivity,
        asset_type=asset_type
    )
    total_secondary_loss = penalties["total_regulatory_inr"]
    
    total_sle = total_primary_loss + total_secondary_loss
    
    return {
        "single_loss_expectancy_inr": total_sle,
        "primary_loss_inr": total_primary_loss,
        "secondary_regulatory_loss_inr": total_secondary_loss,
        "downtime_loss_inr": downtime_loss,
        "incident_response_cost_inr": incident_response_cost,
        "penalties_breakdown": penalties
    }

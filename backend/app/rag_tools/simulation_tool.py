import logging
from typing import Dict, Any, Optional
from sqlmodel import Session, select
from ..database import engine
from ..models import Asset, AssetControl, Job
from ..simulation.scenario_library import SCENARIO_TEMPLATES
from ..simulation.scenario_engine import run_scenario_simulation

logger = logging.getLogger("cyberrakshak.tools.simulation")

def run_whatif_scenario(scenario_name: str = "MFA_EVERYWHERE", org_id: Optional[str] = None) -> Dict[str, Any]:
    """
    CyRa Tool: Simulates a What-If security decision scenario with deep-copy immutability.
    STRICTLY READ-ONLY.
    """
    clean_scenario = scenario_name.strip().upper().replace(" ", "_").replace("-", "_")
    if clean_scenario not in SCENARIO_TEMPLATES:
        clean_scenario = "MFA_EVERYWHERE"

    with Session(engine) as session:
        asset = session.exec(select(Asset)).first()
        if not asset:
            asset_dict = {
                "name": "Production-Portal", "exposure": "Internet-facing", "criticality": "Tier-1",
                "asset_type": "Web Server", "business_value_inr": 15000000.0, "records_count": 10000, "data_sensitivity": "PII"
            }
            controls = [{"control_type": "MFA", "is_enforced": False, "effectiveness": 0.0}]
            vulns = [{"cvss_score": 9.8, "cve": "CVE-2024-3400", "has_exploit": True, "is_cisa_kev": True}]
        else:
            asset_dict = {
                "id": str(asset.id), "name": asset.name, "exposure": asset.exposure,
                "criticality": asset.criticality, "asset_type": asset.asset_type,
                "business_value_inr": asset.business_value_inr, "records_count": asset.records_count,
                "data_sensitivity": asset.data_sensitivity
            }
            ctrl_recs = session.exec(select(AssetControl).where(AssetControl.asset_id == asset.id)).all()
            controls = [{"control_type": c.control_type, "is_enforced": c.is_enforced, "effectiveness": c.effectiveness} for c in ctrl_recs]
            latest_job = session.exec(select(Job).order_by(Job.created_at.desc())).first()
            vulns = latest_job.normalized_report.get("vulnerabilities", []) if latest_job else []

        sim_res = run_scenario_simulation(
            baseline_asset=asset_dict,
            baseline_vulnerabilities=vulns,
            baseline_controls=controls,
            scenario_id=clean_scenario
        )

        return {
            "status": "success",
            "scenario": sim_res["scenario_name"],
            "baseline_eal_inr": sim_res["baseline"]["expected_annual_loss_inr"],
            "projected_eal_inr": sim_res["projected"]["expected_annual_loss_inr"],
            "eal_reduction_inr": sim_res["impact"]["eal_reduction_inr"],
            "risk_reduction_pct": sim_res["impact"]["risk_reduction_pct"],
            "implied_cost_inr": sim_res["impact"]["implied_cost_inr"],
            "projected_rosi": sim_res["impact"]["projected_rosi"]
        }

def query_compliance_posture(framework_name: Optional[str] = None, org_id: Optional[str] = None) -> Dict[str, Any]:
    """
    CyRa Tool: Queries statutory compliance scores and penalty exposures across frameworks.
    STRICTLY READ-ONLY.
    """
    with Session(engine) as session:
        ctrl_recs = session.exec(select(AssetControl)).all()
        controls = [{"control_type": c.control_type, "is_enforced": c.is_enforced, "effectiveness": c.effectiveness} for c in ctrl_recs]
        
        from ..compliance import evaluate_framework_compliance
        scores = evaluate_framework_compliance(active_controls=controls)
        return {
            "status": "success",
            "frameworks": scores,
            "summary": "Compliance scores calculated across DPDP 2023, SEBI CSCRF, RBI CSF, ISO 27001, NIST CSF, and CIS v8."
        }

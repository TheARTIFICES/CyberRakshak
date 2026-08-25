import logging
from typing import Dict, Any, Optional
from sqlmodel import Session, select
from ..database import engine
from ..models import MitigationAction
from ..risk.optimizer import optimize_security_investments

logger = logging.getLogger("cyberrakshak.tools.optimizer")

def solve_budget_allocation(budget_inr: float = 500000.0, org_id: Optional[str] = None) -> Dict[str, Any]:
    """
    CyRa Tool: Runs the PuLP Integer Linear Programming solver to compute optimal capital allocation.
    STRICTLY READ-ONLY.
    """
    sanitized_budget = max(100000.0, min(100000000000.0, float(budget_inr or 500000.0)))
    
    with Session(engine) as session:
        actions = session.exec(select(MitigationAction)).all()
        if not actions:
            # Baseline candidate actions
            action_dicts = [
                {"id": "act-1", "title": "Patch Critical RCE Vulnerability (CVE-2024-3400)", "action_type": "patch", "estimated_cost_inr": 150000.0, "estimated_reduction_inr": 1850000.0, "estimated_rosi": 11.33},
                {"id": "act-2", "title": "Enforce Hardware Token MFA on Privileged Gateways", "action_type": "control_deployment", "estimated_cost_inr": 250000.0, "estimated_reduction_inr": 2400000.0, "estimated_rosi": 8.60},
                {"id": "act-3", "title": "Deploy Micro-Segmentation on Database Tier", "action_type": "control_deployment", "estimated_cost_inr": 400000.0, "estimated_reduction_inr": 1900000.0, "estimated_rosi": 3.75},
                {"id": "act-4", "title": "Remediate SQL Injection on Customer Portal", "action_type": "patch", "estimated_cost_inr": 100000.0, "estimated_reduction_inr": 950000.0, "estimated_rosi": 8.50}
            ]
        else:
            action_dicts = [
                {
                    "id": str(a.id),
                    "title": a.title,
                    "action_type": a.action_type,
                    "cve_id": a.cve_id,
                    "estimated_cost_inr": a.estimated_cost_inr,
                    "estimated_reduction_inr": a.estimated_reduction_inr,
                    "estimated_rosi": a.estimated_rosi
                }
                for a in actions
            ]
        
        opt_res = optimize_security_investments(action_dicts, budget_inr=sanitized_budget)
        return {
            "status": "success",
            "requested_budget_inr": sanitized_budget,
            "allocated_spend_inr": opt_res["total_cost_inr"],
            "projected_loss_reduction_inr": opt_res["total_reduction_inr"],
            "overall_rosi": opt_res["overall_rosi"],
            "budget_utilized_pct": opt_res["budget_utilized_pct"],
            "recommended_actions_count": len(opt_res["selected_actions"]),
            "selected_actions": opt_res["selected_actions"][:5]
        }

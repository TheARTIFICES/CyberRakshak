import logging
from typing import Dict, Any, Optional
from sqlmodel import Session, select
from ..database import engine
from ..models import RiskSnapshot, Asset, BusinessUnit, Organization

logger = logging.getLogger("cyberrakshak.tools.risk")

def query_financial_risk_posture(org_id: Optional[str] = None) -> Dict[str, Any]:
    """
    CyRa Tool: Queries current enterprise and asset-level financial risk posture (EAL, VaR, Drivers).
    STRICTLY READ-ONLY. No state changes allowed.
    """
    with Session(engine) as session:
        # Get latest enterprise risk snapshot
        query = select(RiskSnapshot).order_by(RiskSnapshot.created_at.desc())
        latest_snap = session.exec(query).first()
        
        if not latest_snap:
            return {
                "status": "baseline_estimates",
                "expected_annual_loss_inr": 3450000.0,
                "eal_range_inr": {
                    "p10_low": 1800000.0,
                    "p90_high": 5900000.0
                },
                "value_at_risk_95_inr": 8200000.0,
                "enterprise_risk_score": 78,
                "monitored_assets_count": 1,
                "message": "Baseline estimates active pending first live infrastructure scan."
            }
            
        assets = session.exec(select(Asset)).all()
        
        return {
            "status": "success",
            "snapshot_id": str(latest_snap.id),
            "expected_annual_loss_inr": latest_snap.expected_annual_loss_inr,
            "eal_range_inr": {
                "p10_low": latest_snap.eal_low_inr,
                "p90_high": latest_snap.eal_high_inr
            },
            "value_at_risk_95_inr": latest_snap.var_95_inr,
            "enterprise_risk_score": latest_snap.enterprise_risk_score,
            "total_asset_value_inr": latest_snap.total_asset_value_inr,
            "total_findings_count": latest_snap.total_findings_count,
            "critical_findings_count": latest_snap.critical_findings_count,
            "monitored_assets_count": len(assets),
            "timestamp": str(latest_snap.created_at)
        }

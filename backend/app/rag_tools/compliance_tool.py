from typing import Dict, Any, Optional
from sqlmodel import Session, select
from ..database import engine
from ..models import AssetControl
from ..compliance import evaluate_framework_compliance

def query_compliance_posture(framework_name: Optional[str] = None, org_id: Optional[str] = None) -> Dict[str, Any]:
    """
    CyRa Tool: Queries statutory compliance scores and penalty exposures across frameworks.
    STRICTLY READ-ONLY.
    """
    with Session(engine) as session:
        ctrl_recs = session.exec(select(AssetControl)).all()
        controls = [{"control_type": c.control_type, "is_enforced": c.is_enforced, "effectiveness": c.effectiveness} for c in ctrl_recs]
        scores = evaluate_framework_compliance(active_controls=controls)
        return {
            "status": "success",
            "frameworks": scores,
            "summary": "Compliance scores evaluated across DPDP 2023, SEBI CSCRF, RBI CSF, ISO 27001, NIST CSF, and CIS v8."
        }

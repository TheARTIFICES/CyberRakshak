import os
import hmac
import hashlib
import json
import logging
from typing import Dict, Any, List, Optional
import uuid

logger = logging.getLogger("cyberrakshak.provenance")

MAX_TREE_DEPTH = 6 # Security limit: Org(1) -> BU(2) -> Asset(3) -> Finding(4) -> ControlGap(5) -> Leaf(6)
PROVENANCE_SECRET = os.environ.get("PROVENANCE_HMAC_KEY", "cyberrakshak_default_prov_hmac_secret_2026").encode("utf-8")

def compute_provenance_input_hash(data: Dict[str, Any]) -> str:
    """
    Computes a tamper-proof HMAC-SHA256 hash of the complete risk calculation input payload.
    Ensures mathematical reproducibility and prevents forgeable risk run records.
    """
    serialized = json.dumps(data, sort_keys=True, default=str).encode("utf-8")
    return hmac.new(PROVENANCE_SECRET, serialized, hashlib.sha256).hexdigest()

def build_provenance_tree(
    org_name: str,
    bu_name: str,
    asset_id: str,
    asset_name: str,
    findings: List[Dict[str, Any]],
    controls: List[Dict[str, Any]],
    total_eal_inr: float
) -> Dict[str, Any]:
    """
    Builds an audited hierarchical provenance tree with strict max depth bounds.
    """
    # Level 1: Organization
    tree = {
        "id": str(uuid.uuid4()),
        "level": "org",
        "label": org_name or "Enterprise Organization",
        "contribution_inr": total_eal_inr,
        "children": []
    }
    
    # Level 2: Business Unit
    bu_node = {
        "id": str(uuid.uuid4()),
        "level": "bu",
        "label": bu_name or "Core Operations",
        "contribution_inr": total_eal_inr,
        "children": []
    }
    tree["children"].append(bu_node)
    
    # Level 3: Asset
    asset_node = {
        "id": str(uuid.uuid4()),
        "level": "asset",
        "label": asset_name or f"Asset-{asset_id[:8]}",
        "asset_id": asset_id,
        "contribution_inr": total_eal_inr,
        "children": []
    }
    bu_node["children"].append(asset_node)
    
    # Level 4 & 5: Findings & Control Gaps
    for find in findings:
        cve = find.get("cve", find.get("cve_id", "VULN-GENERIC"))
        title = find.get("title", cve)
        find_loss = float(find.get("loss_contribution_inr", 0.0))
        
        find_node = {
            "id": str(uuid.uuid4()),
            "level": "finding",
            "label": f"{cve}: {title}" if cve else title,
            "cve_id": cve,
            "cvss_score": find.get("cvss_score"),
            "epss_score": find.get("epss_score"),
            "contribution_inr": find_loss,
            "children": []
        }
        
        # Level 5: Associated Control Gaps
        for ctrl in controls:
            if not ctrl.get("is_enforced", False):
                ctrl_type = ctrl.get("control_type", "General Control")
                ctrl_node = {
                    "id": str(uuid.uuid4()),
                    "level": "control_gap",
                    "label": f"Missing/Ineffective: {ctrl_type}",
                    "control_type": ctrl_type,
                    "contribution_inr": find_loss * 0.4 # Attribute 40% of finding loss to control gap
                }
                find_node["children"].append(ctrl_node)
                
        asset_node["children"].append(find_node)
        
    return tree

def flatten_provenance_drivers(
    tree: Dict[str, Any],
    snapshot_id: str,
    max_depth: int = MAX_TREE_DEPTH
) -> List[Dict[str, Any]]:
    """
    Iteratively flattens the hierarchical provenance tree into RiskDriver database records
    with a strict depth counter to prevent infinite recursion vulnerabilities.
    """
    records = []
    stack = [(tree, None, 1)] # (node, parent_id, current_depth)
    
    while stack:
        current_node, parent_id, depth = stack.pop()
        if depth > max_depth:
            logger.warning(f"Maximum provenance tree depth ({max_depth}) exceeded; pruning subtree.")
            continue
            
        driver_id = current_node.get("id", str(uuid.uuid4()))
        rec = {
            "id": uuid.UUID(driver_id) if isinstance(driver_id, str) else driver_id,
            "snapshot_id": uuid.UUID(snapshot_id) if isinstance(snapshot_id, str) else snapshot_id,
            "parent_driver_id": uuid.UUID(parent_id) if parent_id else None,
            "level": current_node.get("level", "finding"),
            "label": current_node.get("label", ""),
            "cve_id": current_node.get("cve_id"),
            "asset_id": uuid.UUID(current_node.get("asset_id")) if current_node.get("asset_id") else None,
            "contribution_inr": float(current_node.get("contribution_inr", 0.0)),
            "cvss_score": current_node.get("cvss_score"),
            "epss_score": current_node.get("epss_score")
        }
        records.append(rec)
        
        for child in current_node.get("children", []):
            stack.append((child, driver_id, depth + 1))
            
    return records

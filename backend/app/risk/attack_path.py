import networkx as nx
from typing import List, Dict, Any, Optional

def compute_attack_path_financial_exposure(
    paths: List[List[str]],
    node_metadata: Dict[str, Dict[str, Any]],
    edge_probabilities: Dict[str, float]
) -> List[Dict[str, Any]]:
    """
    Computes joint compromise probability and financial exposure for chained attack paths:
    P(Path) = Product(P(Hop_k))
    Exposure_Path = P(Path) * SLE_Terminal_Asset
    """
    ranked_paths = []
    
    for path in paths:
        if len(path) < 2:
            continue
            
        joint_prob = 1.0
        hop_details = []
        
        for i in range(len(path) - 1):
            src, dst = path[i], path[i+1]
            edge_key = f"{src}->{dst}"
            hop_prob = edge_probabilities.get(edge_key, 0.65) # 65% default hop transition probability
            joint_prob *= hop_prob
            hop_details.append({
                "from_node": src,
                "to_node": dst,
                "transition_probability": hop_prob
            })
            
        terminal_node = path[-1]
        term_meta = node_metadata.get(terminal_node, {})
        terminal_sle = float(term_meta.get("single_loss_expectancy_inr", 15000000.0))
        
        path_exposure = joint_prob * terminal_sle
        
        ranked_paths.append({
            "path_nodes": path,
            "hops_count": len(path) - 1,
            "joint_probability": min(1.0, max(0.0001, joint_prob)),
            "terminal_asset": terminal_node,
            "terminal_asset_value_inr": float(term_meta.get("business_value_inr", 15000000.0)),
            "terminal_sle_inr": terminal_sle,
            "chained_financial_exposure_inr": path_exposure,
            "hop_details": hop_details
        })
        
    # Rank by chained exposure descending
    ranked_paths.sort(key=lambda p: p["chained_financial_exposure_inr"], reverse=True)
    return ranked_paths

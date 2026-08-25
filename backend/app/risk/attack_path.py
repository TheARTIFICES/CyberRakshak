"""Multi-hop chained-compromise financial exposure.

Formula (CR_V1.0.pdf S10):
    P(Path) = PRODUCT(P(Hop_k)) for all hops k in the chain

Consumes the existing attack graph built by app/graph.py (NetworkX DiGraph,
currently used only for React-Flow visualization layout) and adds the two
things the visualization layer never needed: per-hop compromise
probability, and a centrality metric (betweenness, or a custom
"proximity to critical asset" score) that feeds risk/likelihood.py's
threat_event_frequency for high-centrality assets.

Status: SCAFFOLD. graph.py's node/edge structure is real and reusable —
do not rebuild the graph construction, only add probability/centrality on
top of it. Roadmap Phase 4.
"""

from __future__ import annotations

import networkx as nx


def hop_probability(graph: nx.DiGraph, source: str, target: str) -> float:
    """P(Hop) for one edge — derived from the target node's own
    vulnerability/likelihood factors (risk.likelihood.vulnerability_factor).
    """
    raise NotImplementedError("risk.attack_path.hop_probability: pending Roadmap Phase 4")


def path_probability(graph: nx.DiGraph, path: list[str]) -> float:
    """P(Path) = PRODUCT(P(Hop_k)) across the given node sequence."""
    raise NotImplementedError("risk.attack_path.path_probability: pending Roadmap Phase 4")


def centrality_scores(graph: nx.DiGraph) -> dict[str, float]:
    """Per-node centrality (e.g. nx.betweenness_centrality), normalized to
    [0, 1], intended to feed likelihood.py's threat_event_frequency as an
    "this asset sits on many attack paths" multiplier.
    """
    raise NotImplementedError("risk.attack_path.centrality_scores: pending Roadmap Phase 4")

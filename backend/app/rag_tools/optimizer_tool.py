"""Read-only tool binding: budget-constrained investment recommendations."""

from __future__ import annotations


def get_optimization_recommendation(org_id: str, budget_inr: float) -> dict:
    """Calls risk.optimizer.optimize. This is the direct answer to
    "where should we invest X" — never let the LLM answer this from RAG
    retrieval alone.
    """
    raise NotImplementedError("rag_tools.optimizer_tool.get_optimization_recommendation: pending Roadmap Phase 6")


def get_pareto_frontier(org_id: str, max_budget_inr: float) -> dict:
    raise NotImplementedError("rag_tools.optimizer_tool.get_pareto_frontier: pending Roadmap Phase 6")

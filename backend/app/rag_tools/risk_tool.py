"""Read-only tool binding: financial risk posture (EAL/VaR)."""

from __future__ import annotations


def get_eal(org_id: str, bu_id: str | None = None) -> dict:
    """Return current EAL (+ trend, once forecasting.py exists) for the
    given scope. Calls risk.engine, never re-derives EAL independently.
    """
    raise NotImplementedError("rag_tools.risk_tool.get_eal: pending Roadmap Phase 6")


def get_var(org_id: str, bu_id: str | None = None, percentile: int = 95) -> dict:
    raise NotImplementedError("rag_tools.risk_tool.get_var: pending Roadmap Phase 6")

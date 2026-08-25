"""Read-only tool binding: scenario simulation."""

from __future__ import annotations


def run_scenario(org_id: str, scenario_key: str, **params) -> dict:
    """Calls simulation.scenario_engine.run_scenario. "Read-only" here
    means it never persists the scenario result as a live RiskSnapshot —
    only api/simulation.py's explicit save endpoint does that.
    """
    raise NotImplementedError("rag_tools.simulation_tool.run_scenario: pending Roadmap Phase 6")

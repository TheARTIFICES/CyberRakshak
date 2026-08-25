"""Runs a named scenario as a deep-copy, immutable override of the current
risk state, then re-invokes risk.engine.compute_eal + risk.uncertainty.simulate
with the overridden parameters — never a parallel implementation.

"Deep-copy immutable" matters: a scenario run must not mutate the live
Asset/AssetControl/RiskSnapshot rows it reads. Baseline and Projected
RiskSnapshot-shaped results are returned side by side so the frontend's
before/after comparison is a direct diff, not a reconstruction.

Status: SCAFFOLD. Roadmap Phase 5.
"""

from __future__ import annotations

from dataclasses import dataclass, replace


@dataclass(frozen=True)
class ScenarioOverrides:
    """Parameters a scenario adjusts before re-running the engine.
    All fields optional; unset fields fall back to the live baseline value.
    """

    control_effectiveness_delta: dict[str, float] | None = None  # asset_id -> delta
    tef_multiplier: float | None = None
    remove_attack_graph_edges: list[tuple[str, str]] | None = None


@dataclass(frozen=True)
class ScenarioResult:
    scenario_id: str
    baseline_eal_inr: float
    projected_eal_inr: float
    delta_eal_inr: float
    baseline_var_99_inr: float
    projected_var_99_inr: float


def run_scenario(asset_id: str, overrides: ScenarioOverrides) -> ScenarioResult:
    raise NotImplementedError("simulation.scenario_engine.run_scenario: pending Roadmap Phase 5")

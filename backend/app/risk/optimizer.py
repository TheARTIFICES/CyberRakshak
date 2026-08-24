"""Budget-constrained mitigation selection — 0-1 integer program.

Objective (CR_V1.0.pdf S10):
    Maximize   SUM(delta_EAL_i * x_i)
    Subject to SUM(cost_i * x_i) <= Budget
               Dependency constraints (control B requires control A)
               Mandate constraints (compliance-forced controls: x_i = 1)
               x_i in {0, 1}

Also owns the Pareto frontier (sweep budget 0..max, record cumulative risk
reduction at each point) and the VaR99 tie-break rule: when two candidates
have comparable ROSI, prefer the one that reduces VaR99 (tail risk) more.

Status: SCAFFOLD. `pulp` is not yet a pinned dependency — add it to
requirements.txt when this module is implemented (Roadmap Phase 4). Do not
implement this as a greedy ranked list; it cannot express "control B only
helps once control A exists," which is the whole point of using a real
solver here instead of sorting by ROSI.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MitigationCandidate:
    action_id: str
    cost_inr: float
    estimated_reduction_inr: float
    estimated_rosi: float
    requires: list[str]  # other MitigationAction ids this depends on
    mandated: bool  # compliance-forced; must be selected


@dataclass(frozen=True)
class OptimizationResult:
    selected_action_ids: list[str]
    total_cost_inr: float
    total_reduction_inr: float


def optimize(candidates: list[MitigationCandidate], budget_inr: float) -> OptimizationResult:
    """Solve the 0-1 ILP for one budget point."""
    raise NotImplementedError("risk.optimizer.optimize: pending Roadmap Phase 4")


def pareto_frontier(
    candidates: list[MitigationCandidate], *, max_budget_inr: float, steps: int = 20
) -> list[OptimizationResult]:
    """Sweep budget from 0 to max_budget_inr, solving at each step.

    Answers the PS's "diminishing returns" requirement directly — do not
    ship this as a purely cosmetic curve fit over a single optimize() call.
    """
    raise NotImplementedError("risk.optimizer.pareto_frontier: pending Roadmap Phase 4")

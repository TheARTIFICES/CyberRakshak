"""Monte Carlo simulation over the FAIR point estimate.

Method (CR_V1.0.pdf S10): Compound Poisson process, N = 10,000 simulated
years, via NumPy — frequency (Poisson-distributed loss events per year) and
magnitude (per-event loss) are simulated together, which is the
textbook-correct way to model loss-event frequency x loss magnitude, unlike
a simpler normal-distribution approximation over the point estimate alone.

Output: EAL point estimate, 10th/90th percentile bounds, VaR at 95% and 99%.

Status: SCAFFOLD — numpy is already a pinned dependency (requirements.txt)
but is not yet used for this. Do not approximate with a normal distribution
as a shortcut; that is a materially different (and wrong) model for FAIR.
"""

from __future__ import annotations

from dataclasses import dataclass

N_SIMULATED_YEARS = 10_000


@dataclass(frozen=True)
class LossDistribution:
    eal_point_inr: float
    eal_p10_inr: float
    eal_p90_inr: float
    var_95_inr: float
    var_99_inr: float


def simulate(
    *, loss_event_frequency: float, single_loss_expectancy_inr: float, n_years: int = N_SIMULATED_YEARS
) -> LossDistribution:
    """Run the compound Poisson Monte Carlo and summarize the distribution.

    loss_event_frequency is the Poisson rate (lambda_LEF); each simulated
    event's magnitude should itself be drawn from a distribution centered
    on single_loss_expectancy_inr, not treated as a fixed constant per
    event — a fixed per-event loss collapses the "magnitude" half of the
    compound process and defeats the point of using Monte Carlo at all.
    """
    raise NotImplementedError("risk.uncertainty.simulate: pending Roadmap Phase 2")

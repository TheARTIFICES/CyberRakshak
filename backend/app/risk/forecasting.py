"""EAL trend projection and cost-of-delay estimation.

Trends RiskSnapshot history (once persisted by engine.py) into a 30/60/90-day
forward projection — linear regression or exponential smoothing is
sufficient per the audit's own assessment; this does not need to be a
sophisticated forecasting model to satisfy the PS's "continuous, not
point-in-time" requirement.

"Cost of delay" = the incremental EAL a delayed-remediation scenario
accrues per additional day — a thin derived metric over the same trend,
intended to be reused by simulation/scenario_library.py's "delayed
remediation" preset rather than recomputed independently.

Status: SCAFFOLD. Requires at least a few weeks of real RiskSnapshot
history to be meaningful — sequence after Roadmap Phase 2 is live in
production, not immediately after the schema lands.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class TrendPoint:
    as_of: datetime
    eal_inr: float


@dataclass(frozen=True)
class ForecastResult:
    projected_30d_inr: float
    projected_60d_inr: float
    projected_90d_inr: float
    trend_direction: str  # "increasing" | "decreasing" | "flat"


def forecast_eal(history: list[TrendPoint]) -> ForecastResult:
    raise NotImplementedError("risk.forecasting.forecast_eal: pending Roadmap Phase 2 (post-launch)")


def cost_of_delay_per_day(history: list[TrendPoint]) -> float:
    raise NotImplementedError("risk.forecasting.cost_of_delay_per_day: pending Roadmap Phase 2 (post-launch)")

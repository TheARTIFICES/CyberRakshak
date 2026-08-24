"""Single Loss Expectancy (SLE) — the financial-impact half of FAIR.

Formula (CR_V1.0.pdf S10):
    SLE = business_value_inr * exposure_factor

exposure_factor in [0, 1] is the fraction of an asset's business value
plausibly lost in one loss event, and is itself a function of asset
criticality, data sensitivity, and which controls (if any) contain the
event once it starts. This module owns that estimation.

Status: SCAFFOLD — signatures defined, math not implemented. Depends on
the Asset / AssetControl tables from Roadmap Phase 1 (organization +
persisted-asset schema) before it can run against real data.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ImpactEstimate:
    """Single Loss Expectancy for one asset, one loss event."""

    asset_id: str
    business_value_inr: float
    exposure_factor: float
    sle_inr: float


def exposure_factor(
    *,
    criticality: int,
    data_sensitivity: str,
    control_effectiveness: float,
) -> float:
    """Estimate the fraction of asset value lost in a single loss event.

    Args:
        criticality: Asset criticality, 0-100 (see Asset.criticality).
        data_sensitivity: e.g. "public", "internal", "confidential", "restricted".
        control_effectiveness: Combined containment-control effectiveness, 0-1,
            per CombinedControlEff = 1 - PRODUCT(1 - eff_i) (multiplicative on
            residual risk — see CR_V1.0.pdf S10; do not average or sum eff_i).

    Returns:
        A value in [0, 1].
    """
    raise NotImplementedError("risk.impact.exposure_factor: pending Roadmap Phase 2")


def single_loss_expectancy(
    *, business_value_inr: float, exposure_factor: float
) -> float:
    """SLE = business_value_inr * exposure_factor."""
    raise NotImplementedError("risk.impact.single_loss_expectancy: pending Roadmap Phase 2")

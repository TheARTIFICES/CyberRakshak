"""FAIR Loss Engine — orchestrates impact + likelihood into EAL.

Formula (CR_V1.0.pdf S10):
    EAL = lambda_LEF * SLE

This is the single entry point every other engine (optimizer.py,
simulation/scenario_engine.py, rag_tools/risk_tool.py) should call — per
the audit's explicit warning, the simulator must call this same function
with overridden parameters, never a parallel implementation, or the
simulator's numbers can silently disagree with the live dashboard's.

Status: SCAFFOLD. Wires impact.py + likelihood.py + attack_path.py once
those are implemented; writes a RiskSnapshot + provenance.py record once
Roadmap Phase 1's schema exists.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RiskComputationInput:
    asset_id: str
    business_value_inr: float
    criticality: int
    data_sensitivity: str
    control_effectiveness: float
    vulnerabilities: list[dict]  # normalized VulnerabilityMetadata rows


@dataclass(frozen=True)
class RiskComputationResult:
    asset_id: str
    expected_annual_loss_inr: float
    loss_event_frequency: float
    single_loss_expectancy_inr: float
    model_version: str
    input_hash: str  # set by provenance.py


def compute_eal(inputs: RiskComputationInput) -> RiskComputationResult:
    """Compute point-estimate EAL for one asset.

    Downstream of this call: uncertainty.py runs the Monte Carlo simulation
    around this point estimate to produce the 10th/90th percentile bounds
    and VaR figures that actually get persisted to RiskSnapshot.
    """
    raise NotImplementedError("risk.engine.compute_eal: pending Roadmap Phase 2")


def recompute_for_asset(asset_id: str) -> RiskComputationResult:
    """Full pipeline: load Asset + AssetControl + VulnerabilityMetadata,
    compute EAL, run uncertainty, write RiskSnapshot + RiskDriver +
    RiskModelRun. Intended trigger point: on Job completion (worker/tasks.py)
    and on-demand from api/risk.py.
    """
    raise NotImplementedError("risk.engine.recompute_for_asset: pending Roadmap Phase 2")

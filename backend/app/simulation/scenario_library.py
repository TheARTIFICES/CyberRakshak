"""Named scenario presets, each expressed as a ScenarioOverrides factory.

Standard catalog (CR_V1.0.pdf S6.6): MFA rollout, patch deployment,
network segmentation, additional monitoring, delayed remediation, new
ransomware campaign. Each preset should carry an implied cost pulled from
the MitigationAction catalog where applicable (e.g. "MFA rollout" has a
real estimated_cost_inr), not an arbitrary made-up number.

Status: SCAFFOLD. Roadmap Phase 5.
"""

from __future__ import annotations

from app.simulation.scenario_engine import ScenarioOverrides

SCENARIO_PRESETS: dict[str, str] = {
    "mfa_rollout": "Enforce MFA on all privileged accounts org-wide",
    "patch_deployment": "Deploy pending patches for all Critical/High CVEs",
    "network_segmentation": "Segment flat network into per-BU VLANs",
    "additional_monitoring": "Add EDR/logging coverage to currently-unmonitored assets",
    "delayed_remediation": "Model the cost of a 30/60/90-day remediation delay",
    "new_ransomware_campaign": "Model a new campaign targeting this org's known-exposed CVEs",
}


def build_overrides(scenario_key: str, **params) -> ScenarioOverrides:
    if scenario_key not in SCENARIO_PRESETS:
        raise ValueError(f"unknown scenario preset: {scenario_key!r}")
    raise NotImplementedError("simulation.scenario_library.build_overrides: pending Roadmap Phase 5")

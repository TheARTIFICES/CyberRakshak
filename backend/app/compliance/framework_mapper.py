"""Central compliance dispatcher — maps AssetControl records to each
framework's control catalog and produces a graded score + gap list.

Six frameworks in scope: ISO 27001 Annex A, NIST CSF 2.0, CIS Controls v8,
RBI Cyber Security Framework, SEBI CSCRF, DPDP Act 2023.

Critical modeling note (CR_V1.0.pdf S6.9): RBI CSF and SEBI CSCRF are
graded/tiered frameworks, not flat checklists. RBI requires board-approved
policy, an independent CISO reporting line, 24/7 SOC, and DAKSH incident
reporting. SEBI CSCRF is built on five resiliency goals (Anticipate,
Withstand, Contain, Recover, Evolve) mapped onto
Governance/Identify/Protect/Detect/Respond/Recover, tiered by
regulated-entity category. Do NOT implement either as
SUM(controls_met) / SUM(total_controls) — that model is specifically wrong
for these two frameworks and will read as shallow to anyone who has read
the actual circulars.

DPDP Act 2023 is handled separately (penalty exposure, not just a score) —
see risk/impact.py's regulatory-loss integration point once implemented;
DPDP's compliance-gap output should feed RiskSnapshot.regulatory_loss_inr
as a distinct line item, never blended into general SLE.

Status: SCAFFOLD. Framework-specific control catalogs are intentionally
not embedded in this scaffold — they should be data (a seeded
ComplianceFramework.tier_model JSON), not hardcoded Python, so updating a
catalog doesn't require a deploy. Roadmap Phase 7.
"""

from __future__ import annotations

from dataclasses import dataclass

SUPPORTED_FRAMEWORKS = ("ISO27001", "NIST_CSF", "CIS", "RBI", "SEBI", "DPDP")


@dataclass(frozen=True)
class ComplianceGap:
    control_id: str
    control_name: str
    status: str  # "met" | "partial" | "not_met"
    evidence_ref: str | None


@dataclass(frozen=True)
class ComplianceResult:
    framework: str
    score: float  # 0-100, graded per-framework — see module docstring
    gaps: list[ComplianceGap]


def score_framework(org_id: str, framework: str) -> ComplianceResult:
    if framework not in SUPPORTED_FRAMEWORKS:
        raise ValueError(f"unsupported framework: {framework!r}")
    raise NotImplementedError("compliance.framework_mapper.score_framework: pending Roadmap Phase 7")

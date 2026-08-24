"""Loss Event Frequency (lambda_LEF) — the probability half of FAIR.

Formula (CR_V1.0.pdf S10):
    lambda_LEF = TEF * Vuln * (1 - ControlEff)

    TEF        Threat Event Frequency — how often a threat actor attempts
               action against this asset per year.
    Vuln       Vulnerability/susceptibility factor — derived from CVSS,
               EPSS (see epss_client.py), and CISA KEV/exploit-availability
               flags on VulnerabilityMetadata.
    ControlEff Combined control effectiveness, 0-1, multiplicative across
               applicable AssetControl rows (see impact.py's docstring for
               the combination rule — do not re-derive it differently here).

Status: SCAFFOLD — signatures defined, math not implemented. EPSS wiring
(epss_client.py) should land alongside this module, not after — CVSS-only
likelihood is the exact "V2-REMOVE" gap flagged in the audit.
"""

from __future__ import annotations


def threat_event_frequency(*, asset_type: str, sector: str | None = None) -> float:
    """Estimate annual threat-event attempts against an asset.

    Baseline should come from published industry base rates (per the
    Appendix Q&A guidance in CR_V1.0.pdf — do not claim calibration against
    this org's own breach history), not from live telemetry that doesn't
    exist yet.
    """
    raise NotImplementedError("risk.likelihood.threat_event_frequency: pending Roadmap Phase 2")


def vulnerability_factor(*, cvss_score: float, epss_score: float | None, is_cisa_kev: bool, has_exploit: bool) -> float:
    """Combine CVSS + EPSS + exploit-availability signals into a 0-1 factor.

    epss_score may be None if the EPSS feed is unavailable — fall back to
    CVSS-only in that case (documented degraded mode), never raise.
    """
    raise NotImplementedError("risk.likelihood.vulnerability_factor: pending Roadmap Phase 2")


def loss_event_frequency(*, tef: float, vuln: float, control_eff: float) -> float:
    """lambda_LEF = TEF * Vuln * (1 - ControlEff)."""
    raise NotImplementedError("risk.likelihood.loss_event_frequency: pending Roadmap Phase 2")

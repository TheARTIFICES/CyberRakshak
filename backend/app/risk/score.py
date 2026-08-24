"""0-100 standardized Enterprise Risk Score for dashboard headline tiles.

A normalized, unitless companion to EAL/VaR — not a replacement for the
money figure (the audit's core "money-first" finding still applies: EAL/VaR
are the primary metric; this score is a secondary, at-a-glance summary,
the inverse of the current Frontend/src/components/dashboard/GlobalRiskScore.tsx,
which today is the *primary* metric with no monetary figure at all).

Status: SCAFFOLD. Depends on engine.py's EAL output existing first.
"""

from __future__ import annotations


def enterprise_risk_score(*, eal_inr: float, business_value_inr: float, var_99_inr: float) -> int:
    """Return an integer 0-100 score. Higher = more risk.

    Should be monotonic in EAL/business_value_inr (risk relative to what's
    at stake, not an absolute rupee figure) so it's comparable across
    assets of very different size.
    """
    raise NotImplementedError("risk.score.enterprise_risk_score: pending Roadmap Phase 2")

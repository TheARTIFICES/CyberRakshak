"""Acceptance tests for the FAIR risk engine (app/risk/) — written now as
the executable spec the Roadmap Phase 2 implementation must satisfy, all
skipped until that implementation lands. Un-skip and fill in each test as
its module stops raising NotImplementedError; do not delete these in the
meantime — they're the contract, not dead weight.
"""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.skip(reason="Pending Roadmap Phase 2 — app.risk is currently a scaffold")


def test_single_loss_expectancy_formula() -> None:
    """SLE = business_value_inr * exposure_factor (CR_V1.0.pdf S10)."""
    from app.risk.impact import single_loss_expectancy

    assert single_loss_expectancy(business_value_inr=1_00_00_000, exposure_factor=0.25) == 25_00_000


def test_loss_event_frequency_formula() -> None:
    """lambda_LEF = TEF * Vuln * (1 - ControlEff)."""
    from app.risk.likelihood import loss_event_frequency

    result = loss_event_frequency(tef=4.0, vuln=0.6, control_eff=0.5)
    assert result == pytest.approx(4.0 * 0.6 * 0.5)


def test_expected_annual_loss_formula() -> None:
    """EAL = lambda_LEF * SLE."""
    from app.risk.engine import compute_eal

    # A worked example belongs here once engine.py is implemented: known
    # TEF/Vuln/ControlEff/business_value inputs -> a hand-checked expected
    # EAL, so this test catches a formula regression, not just "runs
    # without crashing."
    raise NotImplementedError("fill in a worked example once app.risk.engine is implemented")


def test_control_effectiveness_combines_multiplicatively() -> None:
    """Two 50%-effective controls together leave 25% residual risk, not 0%
    (CombinedControlEff = 1 - PRODUCT(1 - eff_i)) — the exact modeling
    mistake CR_V1.0.pdf S10 flags as common and easily caught.
    """
    from app.risk.impact import exposure_factor

    raise NotImplementedError("assert multiplicative combination once impact.py is implemented")

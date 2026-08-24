"""Versioned, hashed audit trail for every computed risk figure.

Every EAL/VaR computation gets stamped with:
    risk_model_version    e.g. "v2.5.0" — the FAIR engine's own version
    cost_benchmark_version e.g. "IN-2026.1" — versioned independently of
                            risk_model_version, since a cost-assumption
                            change (e.g. updated breach-cost benchmarks)
                            doesn't imply a model-logic change and vice versa
    input_hash             keyed HMAC-SHA256 over the exact inputs used

This is what makes "how do I know this number isn't made up" answerable:
any RiskSnapshot traces to an exact, reproducible input set. The hash must
be written at computation time, not backfilled — provenance recorded after
the fact isn't provenance.

Status: SCAFFOLD. Depends on the RiskModelRun table (Roadmap Phase 1/2).
"""

from __future__ import annotations

import hmac
import hashlib
from dataclasses import dataclass

RISK_MODEL_VERSION = "v0.1.0-scaffold"
COST_BENCHMARK_VERSION = "IN-2026.1"


@dataclass(frozen=True)
class ProvenanceRecord:
    risk_model_version: str
    cost_benchmark_version: str
    input_hash: str


def hash_inputs(payload: dict, *, secret_key: bytes) -> str:
    """Keyed HMAC-SHA256 over a canonical (sorted-key) JSON encoding of
    payload. Keyed (vs. plain SHA256) so the hash can't be forged by
    someone who only has read access to a RiskSnapshot row — verifying
    requires the same server-side key used to produce it.
    """
    raise NotImplementedError("risk.provenance.hash_inputs: pending Roadmap Phase 2")


def record_computation(payload: dict, *, secret_key: bytes) -> ProvenanceRecord:
    raise NotImplementedError("risk.provenance.record_computation: pending Roadmap Phase 2")

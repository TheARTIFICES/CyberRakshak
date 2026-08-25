"""FIRST.org EPSS (Exploit Prediction Scoring System) client.

Public API, no auth required: https://api.first.org/data/v1/epss?cve=...
Returns a 0-1 probability that a CVE will be exploited in the wild in the
next 30 days — feeds risk.likelihood.vulnerability_factor alongside CVSS,
never as a CVSS replacement.

Status: SCAFFOLD. CR_V1.0.pdf S6.4 correctly calls this a small task once
the likelihood model it feeds exists — sequence it as part of Roadmap
Phase 2, not before (there's nothing to attach EPSS scores to yet). Must
degrade gracefully: if the feed is stale or rate-limited, callers fall back
to CVSS-only likelihood rather than failing the whole risk computation.
"""

from __future__ import annotations

import httpx

EPSS_API_URL = "https://api.first.org/data/v1/epss"


async def fetch_epss_score(cve_id: str, *, client: httpx.AsyncClient | None = None) -> float | None:
    """Fetch the current EPSS score for one CVE.

    Returns None (not an exception) on any failure — timeout, rate limit,
    unknown CVE — so callers can fall back to CVSS-only likelihood per the
    documented degraded mode (CR_V1.0.pdf Appendix Q&A item 5).
    """
    raise NotImplementedError("risk.epss_client.fetch_epss_score: pending Roadmap Phase 2")


async def sync_epss_scores(cve_ids: list[str]) -> dict[str, float]:
    """Batch-fetch and cache EPSS scores. Intended to run on the same
    Celery-beat cadence as the existing NVD/CISA/ExploitDB syncs
    (worker/celery_app.py) once implemented, writing to
    VulnerabilityMetadata.epss_score.
    """
    raise NotImplementedError("risk.epss_client.sync_epss_scores: pending Roadmap Phase 2")

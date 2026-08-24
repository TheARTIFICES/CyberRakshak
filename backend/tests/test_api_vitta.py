"""Integration smoke tests for the FastAPI application.

Deliberately small right now: the goal is a real, passing baseline the
Phase 0 security fixes (docs/audits/gap-audit.md — flipping AUTH_DISABLED,
adding RBAC) can be tested against as they land, not a comprehensive suite
written against a spec that hasn't been implemented yet. Extend this file
route-by-route as each api/*.py module is split out (see the repository
blueprint's Phase B).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_schema_is_valid(client: TestClient) -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "paths" in schema
    assert "/api/scan/start" in schema["paths"]


@pytest.mark.skip(
    reason=(
        "Pending Roadmap Phase 0 (docs/audits/gap-audit.md): AUTH_DISABLED "
        "currently defaults to True, so every route accepts unauthenticated "
        "requests via a synthetic admin session (app/auth.py). This test "
        "should assert that a request WITHOUT a bearer token is rejected "
        "(401) once that default is flipped and RBAC lands — do not enable "
        "it against today's behavior, that would just codify the gap."
    )
)
def test_protected_route_rejects_unauthenticated_request(client: TestClient) -> None:
    response = client.get("/api/scan/logs")
    assert response.status_code == 401

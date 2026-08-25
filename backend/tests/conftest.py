"""Shared pytest fixtures.

Note on scope: app/main.py's startup event connects to Redis and loads the
FAISS RAG index (see main.py's @app.on_event("startup")) — tests using the
`client` fixture below trigger that startup, so running this suite expects
the docker-compose stack (at minimum Redis) reachable, matching how the
rest of this project already assumes Postgres/RabbitMQ/Redis are up. This
is not yet a fully isolated/mocked test environment; making it one
(fixture-level fakes for Redis/RAG/DB) is a reasonable near-term follow-up,
not attempted here.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client

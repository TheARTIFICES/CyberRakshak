"""Okta Workforce Identity Cloud IAM connector.

Reads admin role assignments and factor (MFA) enrollment via the Okta API
(scopes: okta.users.read, okta.roles.read, okta.factors.read).

Status: SCAFFOLD. Roadmap Phase 3 — alternative to azure_ad.py; build
whichever the target demo org actually uses, not both.
"""

from __future__ import annotations

from app.connectors.base_connector import BaseConnector, NormalizedFinding


class OktaConnector(BaseConnector):
    name = "okta"

    def authenticate(self, encrypted_credentials: bytes) -> None:
        """Decrypt an org URL + API token credential set."""
        raise NotImplementedError("connectors.iam.okta.OktaConnector.authenticate: pending Roadmap Phase 3")

    def fetch(self) -> list[NormalizedFinding]:
        """Pull admin role assignments + factor enrollment, normalize into
        findings.
        """
        raise NotImplementedError("connectors.iam.okta.OktaConnector.fetch: pending Roadmap Phase 3")

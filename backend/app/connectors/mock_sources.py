"""Mocked SIEM (Splunk), EDR (CrowdStrike), and CSPM (Wiz) connectors.

Exist to prove the connector architecture accepts these source categories
without requiring live third-party tenants — per CR_V1.0.pdf S5, this is
an explicit, honest scoping decision for a hackathon timeline, not a
placeholder pretending to be a production integration. Any UI or report
surfacing data from these MUST label it as demo/mock data; never present
mock_sources.py output as live telemetry.

The real, non-mocked build target is connectors/iam/ (Azure AD / Okta) —
see base_connector.py's docstring for why IAM was chosen first.

Status: SCAFFOLD.
"""

from __future__ import annotations

from app.connectors.base_connector import BaseConnector, NormalizedFinding


class MockSplunkSIEMConnector(BaseConnector):
    name = "splunk_mock"

    def authenticate(self, encrypted_credentials: bytes) -> None:
        raise NotImplementedError("connectors.mock_sources.MockSplunkSIEMConnector: pending")

    def fetch(self) -> list[NormalizedFinding]:
        raise NotImplementedError("connectors.mock_sources.MockSplunkSIEMConnector: pending")


class MockCrowdStrikeEDRConnector(BaseConnector):
    name = "crowdstrike_mock"

    def authenticate(self, encrypted_credentials: bytes) -> None:
        raise NotImplementedError("connectors.mock_sources.MockCrowdStrikeEDRConnector: pending")

    def fetch(self) -> list[NormalizedFinding]:
        raise NotImplementedError("connectors.mock_sources.MockCrowdStrikeEDRConnector: pending")


class MockWizCSPMConnector(BaseConnector):
    name = "wiz_mock"

    def authenticate(self, encrypted_credentials: bytes) -> None:
        raise NotImplementedError("connectors.mock_sources.MockWizCSPMConnector: pending")

    def fetch(self) -> list[NormalizedFinding]:
        raise NotImplementedError("connectors.mock_sources.MockWizCSPMConnector: pending")

"""Azure Active Directory (Microsoft Entra ID) IAM connector.

Reads privileged role assignments and per-user MFA registration status via
the Microsoft Graph API (application permissions:
RoleManagement.Read.Directory, UserAuthenticationMethod.Read.All).

Status: SCAFFOLD. Roadmap Phase 3.
"""

from __future__ import annotations

from app.connectors.base_connector import BaseConnector, NormalizedFinding


class AzureADConnector(BaseConnector):
    name = "azure_ad"

    def authenticate(self, encrypted_credentials: bytes) -> None:
        """Decrypt a client_id/client_secret/tenant_id credential set and
        acquire an MSAL app-only token.
        """
        raise NotImplementedError("connectors.iam.azure_ad.AzureADConnector.authenticate: pending Roadmap Phase 3")

    def fetch(self) -> list[NormalizedFinding]:
        """Pull privileged role assignments + MFA registration status,
        normalize into findings (e.g. "user has Global Admin without MFA").
        """
        raise NotImplementedError("connectors.iam.azure_ad.AzureADConnector.fetch: pending Roadmap Phase 3")

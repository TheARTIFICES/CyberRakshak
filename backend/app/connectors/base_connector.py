"""Abstract connector interface every telemetry source implements.

Every connector's job is narrow: authenticate, pull data, map
source-specific fields onto the common finding schema, hand off to the
same parsers.py -> Asset/AssetControl upsert path everything else uses —
architecturally identical to how a scanner task in worker/tasks.py works,
just pointed at a SIEM/IAM/EDR/CSPM API instead of running a Docker
container.

Credentials are encrypted at rest via Fernet (symmetric, `cryptography`
package) — never store a connector's API key/secret in plaintext in the
database or in normalized_report JSON blobs. `cryptography` is not yet a
pinned dependency; add it in requirements.txt when this is implemented.

Status: SCAFFOLD. Roadmap Phase 3.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class NormalizedFinding:
    """The common schema every connector (and every scanner parser) must
    produce. Intentionally mirrors what app/parsers.py already emits —
    hardening that schema into something this strict is itself a
    prerequisite piece of work (see docs/audits/gap-audit.md, "components
    requiring refactor").
    """

    source: str  # e.g. "azure_ad", "nmap", "splunk_mock"
    title: str
    severity: str
    description: str
    asset_ref: str
    raw: dict


class BaseConnector(ABC):
    """Subclass per source. See connectors/iam/azure_ad.py for the first
    real implementation target.
    """

    name: str

    @abstractmethod
    def authenticate(self, encrypted_credentials: bytes) -> None:
        """Decrypt credentials (Fernet) and establish a session/token."""

    @abstractmethod
    def fetch(self) -> list[NormalizedFinding]:
        """Pull and normalize findings since the last sync."""


def encrypt_credentials(plaintext: dict, *, fernet_key: bytes) -> bytes:
    raise NotImplementedError("connectors.base_connector.encrypt_credentials: pending Roadmap Phase 3")


def decrypt_credentials(ciphertext: bytes, *, fernet_key: bytes) -> dict:
    raise NotImplementedError("connectors.base_connector.decrypt_credentials: pending Roadmap Phase 3")

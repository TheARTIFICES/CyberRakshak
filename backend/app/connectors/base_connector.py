import os
import abc
import logging
from typing import Dict, Any, List, Optional
from cryptography.fernet import Fernet

logger = logging.getLogger("cyberrakshak.connectors")

# Security Allowlist: Strictly allowed connector names
ALLOWED_CONNECTORS = {"azure_ad", "okta", "mock_siem", "mock_edr", "mock_cspm"}

# Fernet symmetric encryption key for credentials stored at rest
_DEFAULT_FERNET_KEY = Fernet.generate_key().decode("utf-8")
ENCRYPTION_KEY = os.environ.get("CONNECTOR_ENCRYPTION_KEY", _DEFAULT_FERNET_KEY).encode("utf-8")

def encrypt_credential(plain_text: str) -> str:
    """Encrypts credential secret at rest using Fernet."""
    f = Fernet(ENCRYPTION_KEY)
    return f.encrypt(plain_text.encode("utf-8")).decode("utf-8")

def decrypt_credential(cipher_text: str) -> str:
    """Decrypts credential secret in memory for live API queries."""
    f = Fernet(ENCRYPTION_KEY)
    return f.decrypt(cipher_text.encode("utf-8")).decode("utf-8")

class BaseConnector(abc.ABC):
    """
    Abstract Base Class for enterprise telemetry connector adapters.
    Normalizes external telemetry into the CyberRakshak finding and control schema.
    """
    def __init__(self, connector_type: str, config: Optional[Dict[str, Any]] = None):
        if connector_type not in ALLOWED_CONNECTORS:
            raise ValueError(f"Unauthorized connector type '{connector_type}'. Must be one of {ALLOWED_CONNECTORS}")
        self.connector_type = connector_type
        self.config = config or {}

    @abc.abstractmethod
    def fetch_telemetry(self, credentials: Optional[str] = None) -> Dict[str, Any]:
        """Fetches raw posture or log data from the external source."""
        pass

    @abc.abstractmethod
    def normalize_findings(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms external telemetry into standardized findings and control posture:
        Returns dict containing:
        - "asset_info": Dict
        - "controls_posture": List[Dict]
        - "findings": List[Dict]
        """
        pass

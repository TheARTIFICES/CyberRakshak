from typing import Dict, Type
from .base_connector import BaseConnector, ALLOWED_CONNECTORS, encrypt_credential, decrypt_credential
from .iam.azure_ad import AzureADConnector
from .iam.okta import OktaConnector
from .mock_sources import MockSIEMConnector, MockEDRConnector, MockCSPMConnector

# Static Connector Registry (No user-controlled dynamic module loading)
CONNECTOR_REGISTRY: Dict[str, Type[BaseConnector]] = {
    "azure_ad": AzureADConnector,
    "okta": OktaConnector,
    "mock_siem": MockSIEMConnector,
    "mock_edr": MockEDRConnector,
    "mock_cspm": MockCSPMConnector
}

def get_connector(connector_type: str, config: dict = None) -> BaseConnector:
    """Factory function retrieving a connector instance from the static registry."""
    if connector_type not in CONNECTOR_REGISTRY:
        raise ValueError(f"Unknown connector '{connector_type}'. Allowed: {list(CONNECTOR_REGISTRY.keys())}")
    connector_cls = CONNECTOR_REGISTRY[connector_type]
    return connector_cls(config or {})

__all__ = [
    "BaseConnector",
    "ALLOWED_CONNECTORS",
    "CONNECTOR_REGISTRY",
    "get_connector",
    "encrypt_credential",
    "decrypt_credential",
    "AzureADConnector",
    "OktaConnector",
    "MockSIEMConnector",
    "MockEDRConnector",
    "MockCSPMConnector"
]

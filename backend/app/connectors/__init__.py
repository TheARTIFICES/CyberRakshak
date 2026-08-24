"""Multi-source telemetry ingestion — the direct answer to SIH26105's
most literal, most-checked requirement (vuln mgmt + SIEM + IAM + EDR +
CSPM + asset inventory + threat intel).

Static connector factory registry: maps a connector name (e.g. "azure_ad",
"okta") to its implementation class. Existing scanners and threat-intel
sync jobs are untouched by this package — connectors are a parallel
ingestion path that normalizes into the same finding schema
app/parsers.py already produces, so the FAIR engine and attack graph
require zero changes to benefit from new sources.

Build-order note (CR_V1.0.pdf S5): one working connector is enough to
prove the architecture generalizes beyond scanners. iam/ is the
recommended first build (simplest, best-documented read API);
mock_sources.py exists so SIEM/EDR/CSPM can be demonstrated architecturally
without requiring live Splunk/CrowdStrike/Wiz tenants for a hackathon
build — do not present mock_sources.py output as live production data.

Status: SCAFFOLD. Roadmap Phase 3 (iam/), later for the mocked sources.
"""

from __future__ import annotations

CONNECTOR_REGISTRY: dict[str, str] = {
    # name -> dotted import path, populated as each connector is implemented
    # "azure_ad": "app.connectors.iam.azure_ad.AzureADConnector",
    # "okta": "app.connectors.iam.okta.OktaConnector",
}

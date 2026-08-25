from typing import Dict, Any, Optional
from .base_connector import BaseConnector

class MockSIEMConnector(BaseConnector):
    """SIEM Log Ingestion Adapter (Splunk / Elastic / Sentinel)."""
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("mock_siem", config)

    def fetch_telemetry(self, credentials: Optional[str] = None) -> Dict[str, Any]:
        return {
            "siem_engine": "Splunk Enterprise Security",
            "events_analyzed_24h": 4500000,
            "brute_force_attempts": 340,
            "suspicious_outbound_beacons": 2,
            "active_alert_rule_count": 85
        }

    def normalize_findings(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "source_type": "SIEM",
            "source_name": "Splunk Enterprise Security",
            "controls_posture": [
                {
                    "control_type": "SOC_24x7_Monitoring",
                    "is_enforced": True,
                    "effectiveness": 0.85,
                    "telemetry_source": "SIEM_Splunk"
                }
            ],
            "findings": [
                {
                    "title": "Repeated Kerberos Brute Force Pattern on Domain Controller",
                    "description": "SIEM correlation rule triggered: 340 failed authentication attempts from internal subnet.",
                    "severity": "medium",
                    "cvss_score": 6.2,
                    "solution": "Enable account lockout policies and review compromised workstation endpoints.",
                    "tool": "splunk_siem"
                }
            ],
            "raw_summary": raw_data
        }

class MockEDRConnector(BaseConnector):
    """EDR Agent Status Adapter (CrowdStrike Falcon / Microsoft Defender)."""
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("mock_edr", config)

    def fetch_telemetry(self, credentials: Optional[str] = None) -> Dict[str, Any]:
        return {
            "edr_platform": "CrowdStrike Falcon",
            "total_managed_endpoints": 480,
            "sensor_active_pct": 96.5,
            "unmanaged_assets_discovered": 8,
            "quarantined_threats_30d": 12
        }

    def normalize_findings(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        sensor_pct = float(raw_data.get("sensor_active_pct", 0.0)) / 100.0
        return {
            "source_type": "EDR",
            "source_name": "CrowdStrike Falcon",
            "controls_posture": [
                {
                    "control_type": "EDR",
                    "is_enforced": sensor_pct >= 0.90,
                    "effectiveness": sensor_pct,
                    "telemetry_source": "EDR_CrowdStrike"
                }
            ],
            "findings": [],
            "raw_summary": raw_data
        }

class MockCSPMConnector(BaseConnector):
    """CSPM Cloud Security Posture Adapter (AWS Security Hub / Wiz)."""
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("mock_cspm", config)

    def fetch_telemetry(self, credentials: Optional[str] = None) -> Dict[str, Any]:
        return {
            "cspm_engine": "AWS Security Hub",
            "cloud_accounts_monitored": 4,
            "public_s3_buckets": 1,
            "unrestricted_security_groups_port_22": 2,
            "cis_aws_benchmark_compliance_pct": 82.0
        }

    def normalize_findings(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "source_type": "CSPM",
            "source_name": "AWS Security Hub",
            "controls_posture": [
                {
                    "control_type": "Network_Segmentation",
                    "is_enforced": False,
                    "effectiveness": 0.50,
                    "telemetry_source": "CSPM_AWSSecHub"
                }
            ],
            "findings": [
                {
                    "title": "Publicly Accessible S3 Bucket with Customer Export Logs",
                    "description": "AWS S3 bucket 'ehr-export-backup-prod' has public read ACL enabled.",
                    "severity": "critical",
                    "cvss_score": 9.1,
                    "solution": "Enable S3 Block Public Access at the account and bucket level.",
                    "tool": "aws_security_hub"
                }
            ],
            "raw_summary": raw_data
        }

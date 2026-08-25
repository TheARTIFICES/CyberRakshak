from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime, timedelta
import uuid

def get_ist_time() -> datetime:
    return datetime.utcnow() + timedelta(hours=5, minutes=30)

# =========================================================================
# 1. ORGANIZATIONAL HIERARCHY & MULTI-TENANCY
# =========================================================================

class Organization(SQLModel, table=True):
    """Top-level enterprise tenant entity."""
    __tablename__ = "organizations"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    sector: str = Field(default="Banking & Financial Services") # BFSI, Healthcare, Defense, Critical Infra, IT
    regulatory_scope: List[str] = Field(default=["DPDP_2023", "RBI_CSF", "SEBI_CSCRF", "CERT_IN", "ISO_27001", "NIST_CSF"], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=get_ist_time)

class BusinessUnit(SQLModel, table=True):
    """Business unit / division under an enterprise organization."""
    __tablename__ = "business_units"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    name: str = Field(index=True)
    revenue_share: float = Field(default=0.25) # Share of enterprise revenue (0.0 to 1.0)
    criticality: str = Field(default="High") # Critical, High, Medium, Low
    created_at: datetime = Field(default_factory=get_ist_time)

# =========================================================================
# 2. ASSET INVENTORY & VALUATION
# =========================================================================

class Asset(SQLModel, table=True):
    """Core enterprise asset entity storing valuation, exposure, and data classification."""
    __tablename__ = "assets"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    bu_id: Optional[uuid.UUID] = Field(default=None, foreign_key="business_units.id", index=True)
    name: str = Field(index=True)
    ip_address: str = Field(index=True)
    hostname: Optional[str] = None
    asset_type: str = Field(default="Web Server") # Database, Web Server, Workstation, Domain Controller, Cloud Resource
    criticality: str = Field(default="Tier-2")    # Tier-1 (Crown Jewel), Tier-2 (High), Tier-3 (Medium), Tier-4 (Low)
    business_value_inr: float = Field(default=15000000.0) # Default ₹1.5 Cr asset valuation
    records_count: int = Field(default=0)         # Number of sensitive records held (PII / Financial / Health)
    data_sensitivity: str = Field(default="Internal") # PII, Financial, Health, Confidential, Public
    exposure: str = Field(default="Internal")     # Internet-facing, DMZ, Internal, Isolated
    owner: Optional[str] = None
    department: Optional[str] = None
    discovered_at: datetime = Field(default_factory=get_ist_time)
    last_seen: datetime = Field(default_factory=get_ist_time)

class AssetControl(SQLModel, table=True):
    """Tracks organizational control posture across endpoints and infrastructure."""
    __tablename__ = "asset_controls"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    asset_id: uuid.UUID = Field(foreign_key="assets.id", index=True)
    control_type: str                 # MFA, EDR, WAF, Backups, Network_Segmentation, PAM
    is_enforced: bool = Field(default=False)
    effectiveness: float = Field(default=0.0)        # 0.0 to 1.0
    last_evaluated: datetime = Field(default_factory=get_ist_time)
    telemetry_source: str = Field(default="manual")  # EDR_Agent, IAM_Sync, ScanHeuristic, Manual

# =========================================================================
# 3. AUTHENTICATION & RBAC
# =========================================================================

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id", index=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="analyst") # admin, analyst, ciso, auditor, cfo
    is_active: bool = Field(default=True)

# =========================================================================
# 4. SCANNING ENGINE & JOBS
# =========================================================================

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL_SUCCESS = "partial_success"

class Job(SQLModel, table=True):
    __tablename__ = "jobs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    target: str = Field(index=True)
    status: JobStatus = Field(default=JobStatus.PENDING)
    created_at: datetime = Field(default_factory=get_ist_time)
    
    # Scanner Configuration
    scanners_requested: List[str] = Field(default=[], sa_column=Column(JSON))
    tool_status: Dict[str, str] = Field(default={}, sa_column=Column(JSON))
    output_files: Dict[str, str] = Field(default={}, sa_column=Column(JSON))
    normalized_report: Dict = Field(default={}, sa_column=Column(JSON))

    # Notification Settings
    notify_email: bool = Field(default=False)
    email_recipients: List[str] = Field(default=[], sa_column=Column(JSON))

# =========================================================================
# 5. AUDIT LOGGING & NOTIFICATIONS
# =========================================================================

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id", index=True)
    timestamp: datetime = Field(default_factory=get_ist_time)
    event_type: str # SCAN_STARTED, SCAN_COMPLETED, REMEDIATION_APPROVED, COMPLIANCE_EXPORT
    details: Dict = Field(default={}, sa_column=Column(JSON))
    job_id: Optional[uuid.UUID] = Field(default=None, foreign_key="jobs.id")

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id", index=True)
    title: str
    message: str
    type: str = "info" # info, success, warning, error
    is_read: bool = Field(default=False)
    timestamp: datetime = Field(default_factory=get_ist_time)
    job_id: Optional[uuid.UUID] = None

# =========================================================================
# 6. THREAT KNOWLEDGE BASE
# =========================================================================

class VulnerabilityMetadata(SQLModel, table=True):
    """Permanent cache for CVE, EPSS, and threat enrichment data."""
    __tablename__ = "vulnerability_metadata"
    cve_id: str = Field(primary_key=True) 

    # NVD Data
    description: Optional[str] = None
    cvss_score: Optional[float] = None
    severity: Optional[str] = None
    vector_string: Optional[str] = None

    # EPSS (Exploit Prediction Scoring System)
    epss_score: Optional[float] = None # 0.0 to 1.0 from FIRST.org API
    epss_percentile: Optional[float] = None

    # Threat Intel (CISA KEV & ExploitDB)
    is_cisa_kev: bool = Field(default=False)
    has_exploit: bool = Field(default=False)
    exploit_ids: List[str] = Field(default=[], sa_column=Column(JSON))

    # AlienVault OTX
    otx_pulse_count: int = Field(default=0)
    otx_tags: List[str] = Field(default=[], sa_column=Column(JSON))
    otx_references: List[str] = Field(default=[], sa_column=Column(JSON))
    otx_last_synced: Optional[datetime] = None

    # Remediation Data
    remediation: Optional[str] = None
    remediation_source: Optional[str] = None 

    last_updated: datetime = Field(default_factory=get_ist_time)

# =========================================================================
# 7. FAIR RISK QUANTIFICATION & PROVENANCE
# =========================================================================

class RiskSnapshot(SQLModel, table=True):
    """Stores full enterprise, BU, and asset-level financial risk states over time."""
    __tablename__ = "risk_snapshots"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id", index=True)
    job_id: Optional[uuid.UUID] = Field(default=None, foreign_key="jobs.id", index=True)
    asset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="assets.id", index=True) # None = Enterprise-wide
    created_at: datetime = Field(default_factory=get_ist_time, index=True)
    
    # Financial Quantification (INR)
    expected_annual_loss_inr: float = Field(default=0.0)
    eal_low_inr: float = Field(default=0.0)          # 10th percentile (Vectorized Monte Carlo)
    eal_high_inr: float = Field(default=0.0)         # 90th percentile (Vectorized Monte Carlo)
    var_95_inr: float = Field(default=0.0)           # 95th percentile Value at Risk
    
    # Communication & Health Layer
    enterprise_risk_score: int = Field(default=100)  # Normalized 0–100 executive score
    confidence_note: str = Field(default="")         # Data confidence commentary
    
    total_asset_value_inr: float = Field(default=0.0)
    total_findings_count: int = Field(default=0)
    critical_findings_count: int = Field(default=0)

class RiskDriver(SQLModel, table=True):
    """Hierarchical provenance tree node (Org -> BU -> Asset -> Finding -> Control Gap)."""
    __tablename__ = "risk_drivers"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    snapshot_id: uuid.UUID = Field(foreign_key="risk_snapshots.id", index=True)
    parent_driver_id: Optional[uuid.UUID] = Field(default=None, foreign_key="risk_drivers.id")
    
    level: str                        # "org", "bu", "asset", "finding", "control_gap"
    label: str                        # e.g., "Web Server Cluster", "CVE-2024-3400", "Missing MFA"
    cve_id: Optional[str] = None
    asset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="assets.id", index=True)
    contribution_inr: float = Field(default=0.0)     # Loss contribution of this branch
    
    # Granular FAIR Factors
    cvss_score: Optional[float] = None
    epss_score: Optional[float] = None
    has_public_exploit: Optional[bool] = None
    is_cisa_kev: Optional[bool] = None
    asset_criticality: Optional[str] = None
    records_exposed: Optional[int] = None
    data_sensitivity: Optional[str] = None
    control_status: Optional[str] = None
    control_effectiveness: Optional[float] = None
    annual_likelihood: Optional[float] = None
    single_loss_expectancy_inr: Optional[float] = None

class RiskModelRun(SQLModel, table=True):
    """Governance ledger ensuring mathematical auditability and reproducibility."""
    __tablename__ = "risk_model_runs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    snapshot_id: uuid.UUID = Field(foreign_key="risk_snapshots.id")
    risk_model_version: str = Field(default="v2.5.0")
    cost_benchmark_version: str = Field(default="IN-2026.1")
    input_hash: str = Field(index=True) # HMAC-SHA256 of report + asset context + controls
    computed_at: datetime = Field(default_factory=get_ist_time)

# =========================================================================
# 8. CAPITAL ALLOCATION & CLOSED-LOOP REMEDIATION
# =========================================================================

class MitigationStatus(str, Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    REMEDIATED = "remediated"
    RESCANNED = "rescanned"
    VERIFIED = "verified"

LEGAL_STATUS_TRANSITIONS: Dict[str, List[str]] = {
    MitigationStatus.PROPOSED: [MitigationStatus.APPROVED],
    MitigationStatus.APPROVED: [MitigationStatus.IN_PROGRESS, MitigationStatus.REMEDIATED],
    MitigationStatus.IN_PROGRESS: [MitigationStatus.REMEDIATED],
    MitigationStatus.REMEDIATED: [MitigationStatus.RESCANNED],
    MitigationStatus.RESCANNED: [MitigationStatus.VERIFIED],
    MitigationStatus.VERIFIED: []
}

class MitigationAction(SQLModel, table=True):
    """Tracks recommended investment actions through the closed-loop lifecycle."""
    __tablename__ = "mitigation_actions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    asset_id: uuid.UUID = Field(foreign_key="assets.id", index=True)
    cve_id: Optional[str] = None
    title: str
    description: str
    action_type: str = Field(default="patch") # patch, config_change, control_deployment
    
    # Financial Estimates
    estimated_cost_inr: float = Field(default=0.0)
    estimated_reduction_inr: float = Field(default=0.0)
    estimated_rosi: float = Field(default=0.0) # (Reduction - Cost) / Cost
    
    # State Machine
    status: str = Field(default="proposed") # proposed, approved, in_progress, remediated, rescanned, verified
    baseline_snapshot_id: Optional[uuid.UUID] = Field(default=None, foreign_key="risk_snapshots.id")
    post_remediation_snapshot_id: Optional[uuid.UUID] = Field(default=None, foreign_key="risk_snapshots.id")
    measured_reduction_inr: Optional[float] = None
    actual_rosi: Optional[float] = None
    
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    remediated_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

# =========================================================================
# 9. COMPLIANCE FRAMEWORKS & REGULATORY SCORING
# =========================================================================

class ComplianceFramework(SQLModel, table=True):
    """Supported cybersecurity compliance framework definitions."""
    __tablename__ = "compliance_frameworks"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, unique=True) # ISO_27001, NIST_CSF, CIS_CONTROLS_V8, RBI_CSF, SEBI_CSCRF, DPDP_2023
    version: str = Field(default="2.0")
    tier_model: str = Field(default="flat") # flat, tiered
    description: str = Field(default="")
    statutory_penalty_cap_inr: float = Field(default=0.0) # E.g., ₹250 Cr for DPDP 2023

class ComplianceScore(SQLModel, table=True):
    """Calculated compliance posture and regulatory gap record."""
    __tablename__ = "compliance_scores"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    framework_id: uuid.UUID = Field(foreign_key="compliance_frameworks.id", index=True)
    score: float = Field(default=0.0) # 0.0 to 100.0%
    gap_count: int = Field(default=0)
    regulatory_penalty_exposure_inr: float = Field(default=0.0)
    gaps_summary: Dict = Field(default={}, sa_column=Column(JSON))
    computed_at: datetime = Field(default_factory=get_ist_time, index=True)

# =========================================================================
# 10. MULTI-SOURCE CONNECTOR CREDENTIALS & SIMULATION
# =========================================================================

class ConnectorCredential(SQLModel, table=True):
    """Encrypted connector credentials stored at rest via Fernet."""
    __tablename__ = "connector_credentials"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    connector_type: str = Field(index=True) # azure_ad, okta, mock_siem, mock_edr, mock_cspm
    encrypted_secret: str # Fernet ciphertext
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_ist_time)
    last_synced_at: Optional[datetime] = None

class SimulationResult(SQLModel, table=True):
    """Ephemeral records storing what-if scenario comparison results."""
    __tablename__ = "simulation_results"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id", index=True)
    scenario_type: str = Field(index=True) # MFA_EVERYWHERE, PATCH_CRITICALS, NETWORK_SEGMENTATION, DELAY_REMEDIATION
    scenario_params: Dict = Field(default={}, sa_column=Column(JSON))
    baseline_eal_inr: float
    projected_eal_inr: float
    eal_delta_inr: float
    baseline_var_95_inr: float
    projected_var_95_inr: float
    implied_cost_inr: float
    projected_rosi: float
    created_at: datetime = Field(default_factory=get_ist_time)

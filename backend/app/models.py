from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid

# --- AUTHENTICATION ---
class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="analyst") # admin, analyst, viewer
    is_active: bool = Field(default=True)

# --- SCANNING ENGINE ---
class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL_SUCCESS = "partial_success" 

class Job(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    target: str
    status: JobStatus = Field(default=JobStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Scanner Configuration
    scanners_requested: List[str] = Field(default=[], sa_column=Column(JSON))
    tool_status: Dict[str, str] = Field(default={}, sa_column=Column(JSON))
    output_files: Dict[str, str] = Field(default={}, sa_column=Column(JSON))
    normalized_report: Dict = Field(default={}, sa_column=Column(JSON))

    # Notification Settings
    notify_email: bool = Field(default=False)
    email_recipients: List[str] = Field(default=[], sa_column=Column(JSON))

# --- LOGGING & NOTIFICATIONS ---
class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str  
    details: Dict = Field(default={}, sa_column=Column(JSON))
    job_id: Optional[uuid.UUID] = Field(default=None, foreign_key="job.id")

class Notification(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    message: str
    type: str = "info" # info, success, error
    is_read: bool = Field(default=False)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    job_id: Optional[uuid.UUID] = None

# --- KNOWLEDGE BASE ---
class VulnerabilityMetadata(SQLModel, table=True):
    """Permanent cache for CVE and Remediation information."""
    cve_id: str = Field(primary_key=True) 

    # NVD Data
    description: Optional[str] = None
    cvss_score: Optional[float] = None
    severity: Optional[str] = None
    vector_string: Optional[str] = None

    # Threat Intel (CISA & ExploitDB - Already Stored Locally)
    is_cisa_kev: bool = Field(default=False)
    has_exploit: bool = Field(default=False)
    exploit_ids: List[str] = Field(default=[], sa_column=Column(JSON))

    # --- NEW: AlienVault OTX Data (Local Storage) ---
    otx_pulse_count: int = Field(default=0)
    otx_tags: List[str] = Field(default=[], sa_column=Column(JSON))
    otx_references: List[str] = Field(default=[], sa_column=Column(JSON))
    otx_last_synced: Optional[datetime] = None

    # Remediation Data
    remediation: Optional[str] = None
    remediation_source: Optional[str] = None 

    last_updated: datetime = Field(default_factory=datetime.utcnow)

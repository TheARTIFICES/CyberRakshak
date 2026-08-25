# CyberRakshak — Master System Documentation & Architectural Specification

> **Version**: 2.5.0 (Unified Centralized Architecture & Comprehensive Risk Quantification Specification)  
> **Classification**: Master Technical Reference & System Blueprint  
> **Status**: Production & Future-Proof Implementation Specification  
> **Jurisdiction / Regulatory Context**: Government of India / AICTE / CERT-In / RBI / SEBI / DPDP Act 2023  

---

## Table of Contents

1. [Executive Overview & Core Positioning](#1-executive-overview--core-positioning)
2. [Global Architecture & Infrastructure Topology](#2-global-architecture--infrastructure-topology)
3. [Network & Ingress Architecture (Nginx & Reverse Proxy)](#3-network--ingress-architecture-nginx--reverse-proxy)
4. [Database & Persistence Schema (Current & Planned Models)](#4-database--persistence-schema-current--planned-models)
5. [Telemetry Ingestion & Scanner Orchestration Engine](#5-telemetry-ingestion--scanner-orchestration-engine)
6. [Threat Intelligence & Normalization Pipeline](#6-threat-intelligence--normalization-pipeline)
7. [Deterministic FAIR Risk Quantification Engine](#7-deterministic-fair-risk-quantification-engine)
8. [Vectorized Monte Carlo Uncertainty & Loss Simulation](#8-vectorized-monte-carlo-uncertainty--loss-simulation)
9. [Indian Statutory Regulatory Penalty & Liability Framework](#9-indian-statutory-regulatory-penalty--liability-framework)
10. [Constrained Capital Allocation & Investment Optimizer (PuLP MILP)](#10-constrained-capital-allocation--investment-optimizer-pulp-milp)
11. [Attack-Path Financial Exposure & Graph Chaining Engine](#11-attack-path-financial-exposure--graph-chaining-engine)
12. [Closed-Loop Remediation & Empirical Verification Workflow](#12-closed-loop-remediation--empirical-verification-workflow)
13. [AI Assistant, Unified FAISS RAG & Remote GPU Brain (CyRa)](#13-ai-assistant-unified-faiss-rag--remote-gpu-brain-cyra)
14. [Comprehensive API Endpoint Catalog (Current & Planned)](#14-comprehensive-api-endpoint-catalog-current--planned)
15. [Frontend Architecture & UI/UX Experience](#15-frontend-architecture--uiux-experience)
16. [Security, Authentication & Audit Logging](#16-security-authentication--audit-logging)
17. [Configuration, Environment Variables & Deployment](#17-configuration-environment-variables--deployment)

---

## 1. Executive Overview & Core Positioning

**CyberRakshak** is a unified, explainable cyber-risk decision and capital allocation platform. It bridges the fundamental gap between low-level technical vulnerability telemetry and executive boardroom governance.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CORE PRODUCT LOOP                                      │
│                                                                                        │
│  Technical Telemetry (13 Scanners / EDR / IAM / CSPM / NVD / CISA KEV)                │
│       │                                                                                │
│       ▼                                                                                │
│  Deterministic FAIR Quantification Engine (Vectorized Monte Carlo)                     │
│       │                                                                                │
│       ├──► Enterprise Risk Score (0–100) & Financial Exposure (EAL Range + 95% VaR)   │
│       ├──► Hierarchical Risk Provenance Tree (Org → Asset → Finding → Control Gap)     │
│       └──► Risk Concentration (80/20 Pareto) & Chained Low-CVSS Attack Paths           │
│       │                                                                                │
│       ▼                                                                                │
│  Constrained Investment Optimizer (PuLP MILP + Efficient Frontier Spend Curve)         │
│       │                                                                                │
│       ▼                                                                                │
│  Closed-Loop Remediation: Approve → Remediate → Rescan → Measured Loss Reduction & ROSI│
│       │                                                                                │
│       ▼                                                                                │
│  AI Narration & NLQ Layer (CyRa / WhiteRabbitNeo-7B via Strict Schema Guardrails)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Architectural Boundary
* **The Risk Engine owns the numbers**: All calculations for **Expected Annual Loss (EAL)**, **Value at Risk (95% VaR)**, **Return on Security Investment (ROSI)**, and regulatory statutory liabilities are strictly deterministic, reproducible, and mathematically rigorous.
* **AI owns narration, exploration, and intent classification**: Generative AI (LLMs) is strictly barred from computing or altering monetary figures. AI verbalizes outputs produced by deterministic functions.

---

## 2. Global Architecture & Infrastructure Topology

CyberRakshak runs as a multi-container microservice system orchestrated via Docker Compose.

```
                                    ┌───────────────────────┐
                                    │    Host Port 8080     │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │   Nginx Reverse Proxy │
                                    │      (sih-nginx)      │
                                    └─────┬───────────┬─────┘
                                          │           │
                    / (HTTP/WS)           │           │ /api/ (REST/SSE)
         ┌────────────────────────────────┘           └──────────────────────────────┐
         ▼                                                                           ▼
┌───────────────────────────────┐                                       ┌───────────────────────────────┐
│       Frontend (Vite/React)   │                                       │     Backend API (FastAPI)     │
│       (sih-frontend:5173)     │                                       │      (sih-backend:8000)       │
└───────────────────────────────┘                                       └───┬───┬───┬───┬───┬───┬───┬───┘
                                                                            │   │   │   │   │   │   │   │
                     ┌──────────────────────────────────────────────────────┘   │   │   │   │   │   │   │
                     │                 ┌────────────────────────────────────────┘   │   │   │   │   │   │
                     │                 │                 ┌──────────────────────────┘   │   │   │   │   │
                     │                 │                 │                 ┌────────────┘   │   │   │   │
                     ▼                 ▼                 ▼                 ▼                │   │   │   │
           ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │   │   │   │
           │   PostgreSQL   │ │  RabbitMQ AMQP │ │  Redis Cache   │ │  sih-qdrant    │       │   │   │   │
           │  (sih-postgres)│ │ (sih-rabbitmq) │ │  (sih-redis)   │ │ (Deprecated/   │       │   │   │   │
           │   Port: 5433   │ │Port: 5672/15672│ │   Port: 6379   │ │  Scheduled Rm) │       │   │   │   │
           └────────────────┘ └────────┬───────┘ └────────────────┘ └────────────────┘       │   │   │   │
                                       │                                                    │   │   │   │
                                       ▼                                                    │   │   │   │
                             ┌───────────────────┐                                          │   │   │   │
                             │   Celery Worker   │◄─────────────────────────────────────────┘   │   │   │
                             │(sih-celery-worker)│                                              │   │   │
                             └─────────┬─────────┘                                              │   │   │
                                       │                                                        │   │   │
                    Docker-in-Docker   │ Mounts /var/run/docker.sock                            │   │   │
                                       ▼                                                        │   │   │
                  ┌──────────────────────────────────────────────┐                              │   │   │
                  │         Containerized Scanner Pool           │                              │   │   │
                  │  Nmap | Nuclei | Nikto | ZAP | Metasploit    │                              │   │   │
                  │  OpenVAS | Whois | WhatWeb | Dirsearch       │                              │   │   │
                  │  Wfuzz | Dalfox | Grype | Wappalyzer         │                              │   │   │
                  └──────────────────────────────────────────────┘                              │   │   │
                                                                                                │   │   │
                                                                    PyNgrok / HTTPS Tunnel      │   │   │
                                                                ┌───────────────────────────────┘   │   │
                                                                ▼                                       │
                                                    ┌──────────────────────────────┐                    │
                                                    │   Remote GPU AI Service      │                    │
                                                    │(Kaggle Brain / WhiteRabbit)  │                    │
                                                    │ nomic-embed-text-v1.5 (768d) │                    │
                                                    │ WhiteRabbitNeo-v3-7B (fp16)  │                    │
                                                    └──────────────────────────────┘                    │
                                                                                                        │
                                                    Active Production RAG Engine (RAM)                  │
                                                                ┌───────────────────────────────────────┘
                                                                ▼
                                                    ┌──────────────────────────────┐
                                                    │    Unified FAISS Store       │
                                                    │ cve_index.faiss (768d, ~3GB) │
                                                    │ metadata_shard.jsonl (~100k) │
                                                    └──────────────────────────────┘
```

### Container Registry & Service Roles

| Container Name | Service Role | Base Image / Build Context | Exposed Ports | Persistent Volumes | Active Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sih-nginx` | Main Ingress / SSL / Reverse Proxy | `nginx:latest` | `8080:80` | `nginx.conf` | **Active Production** |
| `sih-frontend` | React 19 SPA & 3D Three.js Engine | `./Frontend/Dockerfile` | `5173` | `node_modules` | **Active Production** |
| `sih-backend` | FastAPI Core Application & Risk Engine | `./backend/Dockerfile.api` | `8000` | `./backend:/app` | **Active Production** |
| `sih-celery-worker` | Async Scan Orchestrator & Worker | `./backend/Dockerfile.worker` | None | `/var/run/docker.sock`, `/outputs` | **Active Production** |
| `sih-postgres` | Relational Store (SQLModel) | `postgres:15` | `5433:5432` | `postgres_data` | **Active Production** |
| `sih-rabbitmq` | Message Broker & Task Queue | `rabbitmq:3-management` | `5672:5672`, `15672:15672` | Internal | **Active Production** |
| `sih-redis` | High-Speed Response Cache | `redis:7-alpine` | `6379:6379` | `redis_data` | **Active Production** |
| `sih-qdrant` | Vector Database (Legacy staging) | `qdrant/qdrant:latest` | `6333:6333` | `qdrant_data` | *Deprecated / Scheduled for Removal* |

> [!NOTE]
> **RAG Architecture Clarification**: The active production RAG engine operates entirely in-memory using a unified single-index FAISS store (`cve_index.faiss` + `metadata_shard.jsonl`) via `backend/app/rag.py`. `sih-qdrant` is a legacy staging container that is unused in runtime retrieval and is slated for removal in docker-compose cleanup.


---

## 3. Network & Ingress Architecture (Nginx & Reverse Proxy)

The Nginx reverse proxy routes traffic between the browser, the Vite SPA, and the FastAPI API server with streaming capabilities for AI token generation.

```nginx
events {
    worker_connections 1024;
}

http {
    resolver 127.0.0.11 valid=10s;

    server {
        listen 80;

        # Frontend SPA & Hot Reloading
        location / {
            set $frontend_host frontend;
            proxy_pass http://$frontend_host:5173;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Backend REST API & Server-Sent Events (SSE)
        location /api/ {
            set $backend_host backend;
            proxy_pass http://$backend_host:8000;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # Streaming Optimization for Real-time AI Token Generation
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
            chunked_transfer_encoding on; 
        }
    }
}
```

---

## 4. Database & Persistence Schema (Current & Planned Models)

The persistence layer is built on **SQLModel** (SQLAlchemy 2.0 + Pydantic core) running against PostgreSQL 15.

```mermaid
erDiagram
    Asset ||--o{ RiskSnapshot : tracks_risk
    Asset ||--o{ RiskDriver : contributes_to
    Asset ||--o{ MitigationAction : remediates
    Asset ||--o{ AssetControl : enforces
    User ||--o{ AuditLog : generates
    Job ||--o{ AuditLog : logs
    Job ||--o{ RiskSnapshot : generates
    RiskSnapshot ||--o{ RiskDriver : decomposes_into
    RiskSnapshot ||--o{ MitigationAction : baselines
    RiskSnapshot ||--o{ RiskModelRun : governed_by
    VulnerabilityMetadata ||--o{ RiskDriver : enriches
```

### 4.1 Complete Entity-Relationship Definitions

#### 0. Organization & Business Unit Multi-Tenancy Hierarchy

```python
class Organization(SQLModel, table=True):
    """Top-level enterprise tenant entity."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    sector: str = Field(default="Healthcare") # Healthcare, BFSI, Critical Infra, Defense
    annual_revenue_inr: float = Field(default=500000000.0) # Default ₹50 Cr
    created_at: datetime = Field(default_factory=get_ist_time)

class BusinessUnit(SQLModel, table=True):
    """Business unit entity under an organization."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organization.id", index=True)
    name: str = Field(index=True)
    criticality: str = Field(default="High") # Critical, High, Medium, Low
    revenue_share: float = Field(default=0.25) # 0.0 to 1.0 fraction of org revenue
    created_at: datetime = Field(default_factory=get_ist_time)
```

#### 1. Asset Inventory & Valuation (The Foundational Entity)

```python
class Asset(SQLModel, table=True):
    """Core enterprise asset entity storing valuation, exposure, and data classification."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    bu_id: Optional[uuid.UUID] = Field(default=None, foreign_key="businessunit.id", index=True)
    name: str = Field(index=True)
    ip_address: str = Field(index=True)
    hostname: Optional[str] = None
    asset_type: str = Field(default="Web Server") # "Database" | "Web Server" | "Workstation" | "Domain Controller" | "Cloud Resource"
    criticality: str = Field(default="Tier-2")    # "Tier-1" (Crown Jewel) | "Tier-2" (High) | "Tier-3" (Medium) | "Tier-4" (Low)
    business_value_inr: float = Field(default=15000000.0) # Default ₹1.5 Cr asset valuation
    records_count: int = Field(default=0)         # Number of sensitive records held (PII / Financial / Health)
    data_sensitivity: str = Field(default="Internal") # "PII" | "Financial" | "Health" | "Confidential" | "Public"
    exposure: str = Field(default="Internal")     # "Internet-facing" | "DMZ" | "Internal" | "Isolated"
    owner: Optional[str] = None
    department: Optional[str] = None
    discovered_at: datetime = Field(default_factory=get_ist_time)
    last_seen: datetime = Field(default_factory=get_ist_time)
```

#### 2. Core Authentication & Scans

```python
class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="analyst") # "admin" | "analyst" | "ciso" | "auditor"
    is_active: bool = Field(default=True)

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL_SUCCESS = "partial_success"

class Job(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    target: str = Field(index=True)
    status: JobStatus = Field(default=JobStatus.PENDING)
    created_at: datetime = Field(default_factory=get_ist_time)
    
    scanners_requested: List[str] = Field(default=[], sa_column=Column(JSON))
    tool_status: Dict[str, str] = Field(default={}, sa_column=Column(JSON))
    output_files: Dict[str, str] = Field(default={}, sa_column=Column(JSON))
    normalized_report: Dict = Field(default={}, sa_column=Column(JSON))
    
    notify_email: bool = Field(default=False)
    email_recipients: List[str] = Field(default=[], sa_column=Column(JSON))
```

#### 3. Threat Intelligence Knowledge Base

```python
class VulnerabilityMetadata(SQLModel, table=True):
    """Permanent cache for NVD, CISA KEV, ExploitDB, and AlienVault OTX data."""
    cve_id: str = Field(primary_key=True)
    description: Optional[str] = None
    cvss_score: Optional[float] = None
    severity: Optional[str] = None
    vector_string: Optional[str] = None
    
    is_cisa_kev: bool = Field(default=False)
    has_exploit: bool = Field(default=False)
    exploit_ids: List[str] = Field(default=[], sa_column=Column(JSON))
    
    otx_pulse_count: int = Field(default=0)
    otx_tags: List[str] = Field(default=[], sa_column=Column(JSON))
    otx_references: List[str] = Field(default=[], sa_column=Column(JSON))
    otx_last_synced: Optional[datetime] = None
    
    remediation: Optional[str] = None
    remediation_source: Optional[str] = None
    last_updated: datetime = Field(default_factory=get_ist_time)
```

#### 4. Risk Quantification & Provenance (FAIR Engine)

```python
class RiskSnapshot(SQLModel, table=True):
    """Stores full enterprise and asset-level financial risk states over time."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    job_id: Optional[uuid.UUID] = Field(default=None, foreign_key="job.id", index=True)
    asset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="asset.id", index=True) # None = Enterprise-wide
    created_at: datetime = Field(default_factory=get_ist_time, index=True)
    
    # Financial Quantification (INR)
    expected_annual_loss_inr: float = 0.0
    eal_low_inr: float = 0.0          # 10th percentile (Vectorized Monte Carlo)
    eal_high_inr: float = 0.0         # 90th percentile (Vectorized Monte Carlo)
    var_95_inr: float = 0.0           # 95th percentile Value at Risk
    
    # Communication Layer
    enterprise_risk_score: int = 100  # Normalized 0–100 executive score
    confidence_note: str = ""         # Data confidence commentary
    
    total_asset_value_inr: float = 0.0
    total_findings_count: int = 0
    critical_findings_count: int = 0

class RiskDriver(SQLModel, table=True):
    """Hierarchical provenance tree node (Org -> BU -> Asset -> Finding -> Control Gap)."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    snapshot_id: uuid.UUID = Field(foreign_key="risksnapshot.id", index=True)
    parent_driver_id: Optional[uuid.UUID] = Field(default=None, foreign_key="riskdriver.id")
    
    level: str                        # "org" | "bu" | "asset" | "finding" | "control_gap"
    label: str                        # e.g., "Web Server Cluster", "CVE-2024-3400", "Missing MFA"
    cve_id: Optional[str] = None
    asset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="asset.id", index=True)
    contribution_inr: float = 0.0     # Loss contribution of this branch
    
    # Granular FAIR Factors
    cvss_score: Optional[float] = None
    has_public_exploit: Optional[bool] = None
    is_cisa_kev: Optional[bool] = None
    asset_criticality: Optional[str] = None
    records_exposed: Optional[int] = None
    data_sensitivity: Optional[str] = None
    control_status: Optional[str] = None
    control_effectiveness: Optional[float] = None
    annual_likelihood: Optional[float] = None
    single_loss_expectancy_inr: Optional[float] = None
```

#### 5. Capital Allocation & Closed-Loop Remediation

```python
class MitigationAction(SQLModel, table=True):
    """Tracks recommended investment actions through the closed-loop lifecycle."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    asset_id: uuid.UUID = Field(foreign_key="asset.id", index=True)
    cve_id: Optional[str] = None
    title: str
    description: str
    action_type: str                  # "patch" | "config_change" | "control_deployment"
    
    # Financial Estimates
    estimated_cost_inr: float = 0.0
    estimated_reduction_inr: float = 0.0
    estimated_rosi: float = 0.0       # (Reduction - Cost) / Cost
    
    # State Machine (proposed -> approved -> in_progress -> remediated -> rescanned -> verified)
    status: str = Field(default="proposed")
    baseline_snapshot_id: Optional[uuid.UUID] = Field(default=None, foreign_key="risksnapshot.id")
    post_remediation_snapshot_id: Optional[uuid.UUID] = Field(default=None, foreign_key="risksnapshot.id")
    measured_reduction_inr: Optional[float] = None
    actual_rosi: Optional[float] = None
    
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    remediated_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

class AssetControl(SQLModel, table=True):
    """Tracks organizational control posture across endpoints and infrastructure."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    asset_id: uuid.UUID = Field(foreign_key="asset.id", index=True)
    control_type: str                 # "MFA" | "EDR" | "WAF" | "Backups" | "Network_Segmentation"
    is_enforced: bool = False
    effectiveness: float = 0.0        # 0.0 to 1.0
    last_evaluated: datetime = Field(default_factory=get_ist_time)
    telemetry_source: str = "manual"  # "EDR_Agent" | "IAM_Sync" | "ScanHeuristic"

class RiskModelRun(SQLModel, table=True):
    """Governance ledger ensuring mathematical auditability and reproducibility."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    snapshot_id: uuid.UUID = Field(foreign_key="risksnapshot.id")
    risk_model_version: str = "v2.5.0"
    cost_benchmark_version: str = "IN-2026.1"
    input_hash: str                   # HMAC-SHA256 of report + asset context + controls
    computed_at: datetime = Field(default_factory=get_ist_time)
```

#### 6. Statutory Compliance & Telemetry Connectors

```python
class ComplianceFramework(SQLModel, table=True):
    """Statutory cybersecurity regulatory framework definition."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(index=True, unique=True) # DPDP_2023, SEBI_CSCRF, RBI_CSF, ISO_27001, NIST_CSF, CIS_V8
    name: str
    regulatory_body: str
    statutory_max_fine_inr: float = 0.0
    description: Optional[str] = None

class ComplianceScore(SQLModel, table=True):
    """Framework compliance score snapshot."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organization.id", index=True)
    framework_id: uuid.UUID = Field(foreign_key="complianceframework.id", index=True)
    score: float = 0.0                # 0.0 to 100.0%
    passed_safeguards_count: int = 0
    total_safeguards_count: int = 0
    penalty_exposure_inr: float = 0.0
    calculated_at: datetime = Field(default_factory=get_ist_time)

class ConnectorCredential(SQLModel, table=True):
    """Fernet-encrypted multi-source telemetry adapter credentials."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: uuid.UUID = Field(foreign_key="organization.id", index=True)
    connector_name: str = Field(index=True) # azure_ad, okta, mock_siem, mock_edr, mock_cspm
    encrypted_credentials: str
    is_active: bool = Field(default=True)
    last_synced_at: Optional[datetime] = None

class SimulationResult(SQLModel, table=True):
    """Speculative what-if simulation run artifact."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    org_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organization.id")
    scenario_id: str = Field(index=True)
    baseline_eal_inr: float = 0.0
    projected_eal_inr: float = 0.0
    loss_reduction_inr: float = 0.0
    implied_cost_inr: float = 0.0
    projected_rosi: float = 0.0
    created_at: datetime = Field(default_factory=get_ist_time)
```

---

## 5. Telemetry Ingestion & Scanner Orchestration Engine

CyberRakshak incorporates 13 security scanning tools executed asynchronously in ephemeral Docker containers via Celery workers with Docker-in-Docker socket passthrough.

```
Celery Task (run_scan_task)
    │
    ├── 1. Host Discovery & OS Profiling ──► Nmap (-sV -O -A)
    ├── 2. Web Technology Fingerprinting ──► Wappalyzer & WhatWeb
    ├── 3. DNS & Domain Intelligence    ──► Whois
    ├── 4. Active Web Vulnerability     ──► Nuclei, Nikto, OWASP ZAP, Dalfox (XSS)
    ├── 5. Content & Directory Fuzzing  ──► Dirsearch & Wfuzz
    ├── 6. Network Infrastructure Audit ──► OpenVAS (GVM) & Metasploit Framework
    └── 7. Container & SBOM Security    ──► Grype
```

### Complete Tool Execution Configurations

```python
# Scanner Invocation Matrix
SCANNERS_SPEC = {
    "nmap": {
        "image": "instrumentisto/nmap",
        "command_template": "nmap -{speed} -oX /output/nmap.xml {scan_type} {ports} {target}",
        "parser": "parse_nmap"
    },
    "nuclei": {
        "image": "projectdiscovery/nuclei:latest",
        "command_template": "nuclei -u {target} -tags {tags} -jsonl -o /output/nuclei.jsonl",
        "parser": "parse_nuclei"
    },
    "nikto": {
        "image": "sullo/nikto:latest",
        "command_template": "nikto -h {target} -Format json -o /output/nikto.json",
        "parser": "parse_nikto"
    },
    "zap": {
        "image": "zaproxy/zap-stable",
        "command_template": "zap-baseline.py -t {target} -J /output/zap.json",
        "parser": "parse_zap"
    },
    "wappalyzer": {
        "image": "local/wappalyzer",
        "command_template": "node /app/src/drivers/npm/cli.js {target}",
        "parser": "parse_wappalyzer"
    },
    "whatweb": {
        "image": "local/whatweb",
        "command_template": "whatweb --log-json=/output/whatweb.json {target}",
        "parser": "parse_whatweb"
    },
    "dirsearch": {
        "image": "local/dirsearch",
        "command_template": "python3 dirsearch.py -u {target} -e {extensions} --format=json -o /output/dirsearch.json",
        "parser": "parse_dirsearch"
    },
    "wfuzz": {
        "image": "local/wfuzz",
        "command_template": "wfuzz -c -z file,/app/wordlist.txt --sc {show_codes} -f /output/wfuzz.json,json {target}",
        "parser": "parse_wfuzz"
    },
    "dalfox": {
        "image": "local/dalfox",
        "command_template": "dalfox url {target} --format json -o /output/dalfox.json",
        "parser": "parse_dalfox"
    },
    "whois": {
        "image": "local/whois",
        "command_template": "whois {target} > /output/whois.txt",
        "parser": "parse_whois"
    },
    "metasploit": {
        "image": "metasploitframework/metasploit-framework",
        "command_template": "msfconsole -q -x 'use {module}; set RHOSTS {target}; run; exit'",
        "parser": "parse_metasploit"
    },
    "openvas": {
        "image": "local/gvm-tools",
        "command_template": "gvm-script --gmp-username admin --gmp-password admin socket /app/scan.py {target}",
        "parser": "parse_openvas"
    },
    "grype": {
        "image": "anchore/grype:latest",
        "command_template": "grype {target} -o json > /output/grype.json",
        "parser": "parse_grype"
    }
}
```

### 5.1 Automated Asset Discovery & Post-Scan Upsert (`worker/tasks.py`)

To eliminate divergent asset data sources, `worker/tasks.py` executes an idempotent upsert into the persisted `Asset` table upon completion of any scan:

```python
def upsert_scanned_asset(session: Session, report: Dict[str, Any], target: str) -> Asset:
    """
    Idempotently discovers and persists assets from normalized scan telemetry.
    Ensures persistent valuation and metadata without overwriting manual tiering.
    """
    host_info = report.get("host_info", {})
    ip = host_info.get("ip") or target
    hostnames = host_info.get("hostnames", [])
    name = hostnames[0] if hostnames else ip
    
    # Check if asset already exists by IP or Name
    asset = session.exec(select(Asset).where(or_(Asset.ip_address == ip, Asset.name == name))).first()
    
    is_exposed = not is_private_ip(ip)
    exposure_val = "Internet-facing" if is_exposed else "Internal"
    
    ports = [p.get("port") for p in report.get("ports", [])]
    asset_type = "Web Server"
    criticality = "Tier-2"
    valuation = 15000000.0  # ₹1.5 Cr default
    
    if any(p in [5432, 3306, 1433, 1521, 27017] for p in ports):
        asset_type = "Database"
        criticality = "Tier-1"
        valuation = 50000000.0  # ₹5.0 Cr default
    elif any(p in [88, 389, 636] for p in ports):
        asset_type = "Domain Controller"
        criticality = "Tier-1"
        valuation = 75000000.0  # ₹7.5 Cr default

    if not asset:
        asset = Asset(
            name=name,
            ip_address=ip,
            hostname=hostnames[0] if hostnames else None,
            asset_type=asset_type,
            criticality=criticality,
            business_value_inr=valuation,
            exposure=exposure_val,
            discovered_at=get_ist_time(),
            last_seen=get_ist_time()
        )
        session.add(asset)
    else:
        # Update telemetry timestamps and exposure without overriding manual business value
        asset.last_seen = get_ist_time()
        asset.exposure = exposure_val
        session.add(asset)
        
    session.commit()
    session.refresh(asset)
    return asset
```

### 5.2 Multi-Source Telemetry Ingestion Connectors (`backend/app/connectors/`)

To fulfill SIH 26105 requirements for continuous holistic telemetry aggregation, CyberRakshak includes dedicated connectors for IAM, SIEM, EDR, and CSPM.

```
BaseConnector (Abstract Interface)
   │
   ├── IAM Connectors ────────► AzureADConnector (Entra ID OAuth2 / Microsoft Graph API)
   │                           └── OktaConnector (Okta Identity Cloud REST API v1)
   │
   └── Security Telemetry ────► MockSIEMConnector (Splunk / Elastic Log Ingestion)
                               ├── MockEDRConnector (CrowdStrike Falcon Sensor Coverage)
                               └── MockCSPMConnector (AWS Security Hub Cloud Misconfigurations)
```

* **Live & Dual-Mode Execution**:
  * `AzureADConnector`: Queries live Microsoft Graph API (`/v1.0/reports/credentialUserRegistrationDetails`) using client credentials when `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` are configured; falls back gracefully to demonstration baseline if running in offline sandbox environments.
  * `OktaConnector`: Calls Okta REST API (`/api/v1/users`) when `OKTA_DOMAIN` and `OKTA_API_TOKEN` are set.
* **Security & Credential Encryption**:
  * Stored connector secrets in `ConnectorCredential` are encrypted at rest using **Fernet Symmetric Encryption** (`cryptography.fernet.Fernet`).
  * Connectors are validated against a static allowlist `ALLOWED_CONNECTORS = {"azure_ad", "okta", "mock_siem", "mock_edr", "mock_cspm"}` to eliminate dynamic code execution vulnerabilities.

---

## 6. Threat Intelligence & Normalization Pipeline

After raw tool runs conclude, all data is standardized into the canonical `Job.normalized_report` schema.

```json
{
  "host_info": {
    "ip": "192.168.1.105",
    "hostnames": ["ehr-core.hospital.internal"],
    "os": "Linux Ubuntu 22.04",
    "type": "ipv4"
  },
  "ports": [
    {
      "port": 443,
      "protocol": "tcp",
      "service": "https",
      "product": "Apache httpd",
      "version": "2.4.49",
      "cve": "CVE-2021-41773"
    }
  ],
  "technologies": [
    { "name": "Apache", "version": "2.4.49", "categories": ["Web Server"] },
    { "name": "PHP", "version": "8.1.2", "categories": ["Programming Language"] },
    { "name": "PostgreSQL", "version": "14.2", "categories": ["Database"] }
  ],
  "vulnerabilities": [
    {
      "tool": "nuclei",
      "title": "Apache 2.4.49/2.4.50 Path Traversal / RCE",
      "severity": "critical",
      "cve": "CVE-2021-41773",
      "cvss_score": 9.8,
      "description": "Path traversal and remote code execution vulnerability in Apache HTTP Server 2.4.49.",
      "solution": "Upgrade Apache HTTP Server to version 2.4.51 or later.",
      "enrichment": {
        "cve_id": "CVE-2021-41773",
        "is_cisa_kev": true,
        "has_exploit": true,
        "exploit_ids": ["EDB-50383"],
        "otx_pulse_count": 142
      }
    }
  ]
}
```

---

## 7. Deterministic FAIR Risk Quantification Engine

CyberRakshak implements the **Factor Analysis of Information Risk (FAIR)** methodology to model annual financial loss.

$$\text{EAL} = \lambda_{\text{LEF}} \times \text{Single Loss Expectancy (SLE)}$$

Where:
$$\lambda_{\text{LEF}} = \text{TEF} \times \text{Vulnerability} \times (1 - \text{Control Effectiveness})$$

```
                                      FAIR FACTOR TAXONOMY
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
       Loss Event Frequency (LEF: Rate λ)                             Loss Magnitude (LM / SLE)
                 │                                                             │
        ┌────────┴────────┐                                           ┌────────┴────────┐
        ▼                 ▼                                           ▼                 ▼
   Threat Event     Vulnerability                                Primary Loss      Secondary Loss
  Frequency (TEF)   (Threat Cap vs                               (Downtime, IR)     (DPDP Fines,
 (Events/Yr: Rate λ)  Resistance)                                                   SEBI/RBI Fines)
```

### Deterministic Factor Derivation Rules

1. **Threat Event Frequency ($\text{TEF}$)** — Annual Intensity Rate ($\lambda_{\text{TEF}} \ge 0$):
   * Internet-facing perimeter assets: Base $\text{TEF} = 12.0\text{ events/year}$.
   * Internal DMZ assets: Base $\text{TEF} = 4.0\text{ events/year}$.
   * Isolated internal network assets: Base $\text{TEF} = 1.0\text{ events/year}$.
2. **Vulnerability Factor ($\text{Vuln}$)** — Conditional Probability of Compromise given Threat Event:
   $$\text{Vuln} = \min\left(1.0, \frac{\text{CVSS}}{10.0} \times w_{\text{exploit}} \times w_{\text{kev}}\right)$$
   * $w_{\text{exploit}} = 1.35$ if verified exploit exists in ExploitDB.
   * $w_{\text{kev}} = 1.70$ if cataloged in CISA Known Exploited Vulnerabilities.
3. **Control Effectiveness ($\text{ControlEff}$)** — Mitigation Factor $\in [0, 1]$:
   $$\text{ControlEff} = 1.0 - \prod_{c \in \text{Controls}} (1.0 - \text{eff}_c)$$
   * Enforced MFA on privileged accounts: $\text{eff} = 0.85$
   * Active Endpoint Detection & Response (EDR): $\text{eff} = 0.75$
   * Web Application Firewall (WAF) in blocking mode: $\text{eff} = 0.65$
   * Immutable Offline Backups: $\text{eff} = 0.90$ (mitigates secondary ransomware loss).
4. **Annual Breach Probability ($P_{\text{annual}}$)** — Bounded probability of $\ge 1$ breach event per year:
   $$P_{\text{annual}} = 1 - e^{-\lambda_{\text{LEF}}}$$

### Scenario-Only Threat-Maturation Hooks

`calculate_asset_fair_risk()` accepts two optional multipliers, both defaulting to `1.0` (no effect on the live scan pipeline): `tef_multiplier` scales $\text{TEF}$ directly, `vuln_severity_multiplier` scales each finding's CVSS before the Vulnerability Factor is computed (capped at 10.0). They exist solely for `simulation/scenario_engine.py`'s what-if scenarios that model threat-maturation or an active campaign without changing exposure or controls (e.g. `DELAY_REMEDIATION_30D`, `ACTIVE_RANSOMWARE_CAMPAIGN`) — the Scenario Simulator's baseline run always uses the defaults.

---

## 8. Vectorized Monte Carlo Uncertainty & Loss Simulation

Point estimates alone are insufficient for risk governance. To handle annual breach rates ($\lambda_{\text{LEF}} \ge 0$) rigorously without distribution boundary violations, CyberRakshak implements a **Compound Poisson Process** across $10,000$ simulation years using NumPy in `backend/app/risk/uncertainty.py`.

```
For each simulation year i in {1, ..., 10,000}:
  1. Sample number of successful breach events: K_i ~ Poisson(λ_LEF)
  2. If K_i > 0, sample K_i loss severities: L_ij ~ Lognormal(μ_SLE, σ_SLE)
  3. Annual Loss_i = Σ_{j=1}^{K_i} L_ij (or 0 if K_i == 0)
```

```python
import numpy as np
from typing import Tuple

def simulate_annual_loss(
    tef: float,
    vuln_factor: float,
    control_eff: float,
    point_sle: float,
    uncertainty_factor: float = 0.25,
    iterations: int = 10000
) -> Tuple[float, float, float, float]:
    """
    FAIR Compound Poisson Monte Carlo Simulation (Vectorized across N=10,000 simulation years).
    
    Parameters:
    - tef: Threat Event Frequency (annual rate lambda, e.g. 12.0 events/year)
    - vuln_factor: Vulnerability conditional probability (0.0 to 1.0)
    - control_eff: Combined active control resistance (0.0 to 1.0)
    - point_sle: Single Loss Expectancy (INR)
    - uncertainty_factor: Standard deviation ratio for lognormal severity dispersion
    - iterations: Number of Monte Carlo simulation years (default: 10,000)
    
    Returns:
    - (eal_point, eal_low_10th, eal_high_90th, var_95) in INR
    """
    lambda_lef = max(0.0, tef * vuln_factor * (1.0 - control_eff))
    if lambda_lef <= 0 or point_sle <= 0:
        return 0.0, 0.0, 0.0, 0.0

    # 1. Sample number of breach events per simulation year
    event_counts = np.random.poisson(lam=lambda_lef, size=iterations)
    total_events = int(np.sum(event_counts))
    
    if total_events == 0:
        return 0.0, 0.0, 0.0, 0.0

    # 2. Parameterize Lognormal distribution for Single Loss Expectancy (SLE)
    sigma_sle = np.sqrt(np.log(1.0 + (uncertainty_factor ** 2)))
    mu_sle = np.log(point_sle) - (0.5 * (sigma_sle ** 2))
    
    # 3. Sample loss magnitudes across all generated events
    event_losses = np.random.lognormal(mean=mu_sle, sigma=sigma_sle, size=total_events)

    # 4. Map event losses back to annual sum buckets
    annual_losses = np.zeros(iterations, dtype=np.float64)
    offsets = np.zeros(iterations + 1, dtype=int)
    offsets[1:] = np.cumsum(event_counts)
    
    for i in range(iterations):
        start, end = offsets[i], offsets[i + 1]
        if end > start:
            annual_losses[i] = np.sum(event_losses[start:end])

    eal_point = float(np.mean(annual_losses))
    eal_low = float(np.percentile(annual_losses, 10))
    eal_high = float(np.percentile(annual_losses, 90))
    var_95 = float(np.percentile(annual_losses, 95))

    return eal_point, eal_low, eal_high, var_95
```

---

## 9. Indian Statutory Regulatory Penalty & Liability Framework

The Single Loss Expectancy engine embeds Indian regulatory compliance structures:

```mermaid
flowchart LR
    Finding[Vulnerability Finding] --> AssetContext{Asset & Data Classification}
    
    AssetContext -->|PII / Health Records| DPDP[DPDP Act 2023: Up to ₹250 Cr]
    AssetContext -->|Trading & Brokerage Infra| SEBI[SEBI CSCRF: SLA Non-Compliance Fines]
    AssetContext -->|Banking & Payment Core| RBI[RBI CSF: Customer Compensation & Audits]
    AssetContext -->|Mandatory Cyber Incident| CERTIn[CERT-In: 6-Hour SLA Penalties]
    
    DPDP --> SLE[Single Loss Expectancy Total INR]
    SEBI --> SLE
    RBI --> SLE
    CERTIn --> SLE
```

### Statutory Penalty Schedules

| Regulatory Body | Act / Regulation | Violation Scenario | Statutory Penalty Schedule (INR) |
| :--- | :--- | :--- | :--- |
| **DPDP Board** | Digital Personal Data Protection Act 2023 | Failure to observe reasonable security safeguards to prevent personal data breach | Up to **₹250 Crore** (Tiered: ₹10,000 per exposed record up to ₹250 Cr cap) |
| **DPDP Board** | Digital Personal Data Protection Act 2023 | Failure to notify Board and affected users of data breach | Up to **₹200 Crore** |
| **SEBI** | Cybersecurity & Cyber Resilience Framework (CSCRF) | Critical vulnerability left unmitigated past mandatory 15-day SLA in Core Settlement Systems | **₹25 Lakh to ₹5 Crore** plus operational restriction |
| **RBI** | Cyber Security Framework for Banks | Unauthorized electronic transactions due to unpatched core banking infrastructure | Mandated full customer compensation + **₹1 Crore to ₹10 Crore** supervisory fine |
| **CERT-In** | Cyber Incident Directions (Sec 70B(7)) | Failure to report mandatory cyber incidents within the **6-hour statutory window** | Up to **₹1 Lakh fine + 1 Year Imprisonment** / Operational sanctions |

---

## 10. Constrained Capital Allocation & Investment Optimizer (PuLP MILP)

The investment optimizer (`backend/app/risk/optimizer.py`) implements Integer Linear Programming (MILP) to find the globally optimal set of security actions under strict budget and regulatory constraints.

> [!NOTE]
> **Dependency Requirement**: PuLP is required for the Integer Linear Programming (MILP) solver. Add `pulp>=2.8.0` to `backend/requirements.txt` prior to executing optimization routines.

$$\max \sum_{i=1}^{n} \Delta \text{EAL}_i \cdot x_i \quad \text{where } x_i \in \{0, 1\}$$

**Subject to:**
1. **Budget Cap**: $\sum_{i=1}^{n} \text{Cost}_i \cdot x_i \le \text{Budget}$
2. **Control Dependencies**: $x_{\text{PAM}} \le x_{\text{MFA}}$ (Control B requires Control A)
3. **Mandatory Regulatory Mandates**: $x_j = 1 \quad \forall j \in \text{MandatoryControls}$

```python
import pulp
from typing import List, Dict, Any, Tuple

def optimize_security_investments(
    actions: List[Dict[str, Any]],
    budget_inr: float,
    mandatory_control_ids: List[str] = None,
    dependencies: List[Tuple[str, str]] = None
) -> Dict[str, Any]:
    prob = pulp.LpProblem("CyberRakshak_Investment_Optimizer", pulp.LpMaximize)
    
    # Binary decision variables
    x = {a['id']: pulp.LpVariable(f"action_{a['id']}", cat='Binary') for a in actions}
    
    # Objective: Maximize total expected annual loss reduction (INR)
    prob += pulp.lpSum([a['estimated_reduction_inr'] * x[a['id']] for a in actions])
    
    # 1. Budget constraint
    prob += pulp.lpSum([a['estimated_cost_inr'] * x[a['id']] for a in actions]) <= budget_inr
    
    # 2. Mandatory controls
    if mandatory_control_ids:
        for m_id in mandatory_control_ids:
            if m_id in x:
                prob += x[m_id] == 1
                
    # 3. Control dependencies (x_dep <= x_pre)
    if dependencies:
        for dep_id, pre_id in dependencies:
            if dep_id in x and pre_id in x:
                prob += x[dep_id] <= x[pre_id]
                
    prob.solve(pulp.PULP_CBC_CMD(msg=False))
    
    selected = [a for a in actions if pulp.value(x[a['id']]) == 1]
    total_cost = sum(a['estimated_cost_inr'] for a in selected)
    total_reduction = sum(a['estimated_reduction_inr'] for a in selected)
    
    return {
        "selected_actions": selected,
        "total_cost_inr": total_cost,
        "total_reduction_inr": total_reduction,
        "overall_rosi": (total_reduction - total_cost) / max(1.0, total_cost)
    }
```

### Spend Curve Generation (Pareto Efficient Frontier)
`generate_spend_curve()` computes risk reduction across 10 discrete budget slices ($10\%, 20\%, \dots, 100\%$) to generate coordinates for the frontend Pareto chart, identifying the **Optimal Spend Zone (Knee Point / Maximum Marginal ROSI)**.

---

## 11. Attack-Path Financial Exposure & Graph Chaining Engine

Extending `backend/app/graph.py`, `backend/app/risk/attack_path.py` models how multiple moderate-severity vulnerabilities chain into a critical breach.

```
[ Internet-Facing Proxy ] ──(CVE-2023-XXXX: CVSS 5.3)──► [ DMZ Internal Node ]
                                                                 │
                                                    (Weak SSH Creds: CVSS 6.0)
                                                                 │
                                                                 ▼
[ Core DB: ₹5.0 Cr Asset ] ◄──(Privilege Escalation: CVSS 6.8)───┘
```

* **Joint Compromise Probability**:
  $$P(\text{Compromise}_{\text{Path}}) = \prod_{h \in \text{Hops}} P(\text{Hop}_h)$$
* **Path Financial Exposure**:
  $$\text{Exposure}_{\text{Path}} = P(\text{Compromise}_{\text{Path}}) \times \text{SLE}_{\text{Terminal Asset}}$$

---

## 12. Closed-Loop Remediation & Empirical Verification Workflow

CyberRakshak provides empirical proof of risk reduction by validating remediation outcomes against baseline scans.

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Security Analyst
    participant API as FastAPI Backend
    participant Worker as Celery Worker Task
    participant DB as PostgreSQL Store

    Analyst->>API: POST /api/investment/actions/{id}/approve
    API->>DB: Status -> "approved", baseline_snapshot_id recorded
    Analyst->>API: Mark status -> "remediated" (Patch applied)
    Analyst->>API: POST /api/scan/start (Trigger verification rescan)
    API->>Worker: Dispatch run_scan_task.delay()
    Worker->>Worker: Execute scanners & build normalized_report
    Worker->>DB: Check for actions where status == "remediated"
    Worker->>DB: Compute new RiskSnapshot (post_remediation_snapshot_id)
    Worker->>DB: measured_reduction_inr = baseline.eal - post.eal
    Worker->>DB: actual_rosi = (measured_reduction - cost) / cost
    Worker->>DB: Status -> "verified"
    Analyst->>API: GET /api/investment/actions/{id}/outcome
    API-->>Analyst: Return Estimated vs. Measured Loss Reduction & Real ROSI
```

---

## 13. AI Assistant, Unified FAISS RAG & Read-Only Tool-Calling Bridge (CyRa)

The AI layer (`backend/app/chat_assistant.py`, `backend/app/rag_tools/`, and `ai_service/kaggle_brain.py`) combines unified local vector similarity search with deterministic function tool calling and a dedicated remote offensive security LLM.

```
User Query ──► Intent Classification (intent_classifier.py)
                    │
                    ├── If Trivial / Meta ──► Instant Deterministic Response
                    │
                    ├── If Financial / What-If / Compliance Tool Intent
                    │       │
                    │       ▼
                    │   Strict Read-Only Tool Execution (backend/app/rag_tools/)
                    │   ├── query_financial_risk_posture (EAL, VaR, Drivers)
                    │   ├── solve_budget_allocation (PuLP MILP solver)
                    │   ├── run_whatif_scenario (Deep-copy simulation)
                    │   └── query_compliance_posture (DPDP/SEBI/RBI/ISO)
                    │       │
                    │       ▼
                    │   Inject Deterministic Results into LLM Context
                    │
                    └── Security Grounding & Narration
                            │
                            ├── 1. Query Embedding (Remote GPU /embed via nomic-embed-text-v1.5)
                            ├── 2. Vector Search (Local CPU Index: cve_index.faiss - 768d Cosine)
                            ├── 3. Document Deduplication & Token Budgeting (4000 token limit)
                            ├── 4. Structured Prompt Assembly (Tool Outputs + RAG Context)
                            └── 5. LLM Inference (WhiteRabbitNeo-v3-7B via PyNgrok SSE Stream)
```

> [!IMPORTANT]
> **Prompt Injection & Execution Whitelist**: AI tools are strictly read-only analytical queries guarded by `TOOL_CALL_WHITELIST = {"risk_tool", "optimizer_tool", "simulation_tool", "compliance_tool"}`. Under no circumstances can prompt injection trigger state modifications, approvals, or data deletion.

---

## 14. Comprehensive API Endpoint Catalog (Active Production Endpoints)

### 14.1 Authentication & System Health

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | System health check | No |
| `GET` | `/rag/stats` | Unified FAISS RAG index statistics | No |
| `POST` | `/api/auth/token` | OAuth2 Password Bearer login | No |

### 14.2 Enterprise Hierarchy & Asset Inventory

| Method | Endpoint | Description / Params | Response Model |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/org` | List enterprise organizations | `List[Organization]` |
| `POST`| `/api/org` | Register new organization tenant | `Organization` |
| `GET` | `/api/bu` | List business units | `List[BusinessUnit]` |
| `POST`| `/api/bu` | Register business unit | `BusinessUnit` |
| `GET` | `/api/assets` | Relational asset inventory | `List[AssetResponse]` |
| `PUT` | `/api/assets/{asset_id}` | Update valuation, exposure & records count | `AssetResponse` |

### 14.3 Scanning & Orchestration

| Method | Endpoint | Request Body / Params | Response Model |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/scan/start` | `ScanStartRequest` (target, scanners, configs, email) | `ScanStartResponse` |
| `GET` | `/api/scan/status/{job_id}` | `job_id`, `include_results: bool` | `ScanStatusResponse` |
| `GET` | `/api/scan/logs` | `limit: int`, `search: str` | `List[AuditLog]` |
| `GET` | `/api/scan/graph/{job_id}` | `job_id` | React Flow Graph JSON |
| `GET` | `/api/scan/report/{job_id}` | `job_id` | PDF File Stream |

### 14.4 Quantitative Risk & Capital Allocation (FAIR Engine)

| Method | Endpoint | Description | Query / Body Params | Response Structure |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/risk/exposure` | Returns EAL point, bounds, 95% VaR, and Risk Score | none (latest `RiskSnapshot`) | `{ expected_annual_loss_inr: float, eal_low_inr: float, eal_high_inr: float, var_95_inr: float, enterprise_risk_score: int, total_asset_value_inr: float, total_findings_count: int, critical_findings_count: int, monitored_assets_count: int, business_units_count: int, currency: "INR" }` |
| `GET` | `/api/risk/provenance/{snapshot_id}` | Hierarchical HMAC-SHA256 provenance tree | `snapshot_id: UUID` | `{ snapshot_id: UUID, provenance_tree: RiskDriverNode }` |
| `GET` | `/api/risk/attack-paths/{job_id}` | Multi-hop chained attack paths with joint exposure | `job_id: UUID` | `List[{ path_id: str, path: [], joint_probability: float, financial_exposure_inr: float }]` |
| `GET` | `/api/risk/forecast` | 30/60/90-day EAL projection & cost of delay assuming no remediation | none (last 10 `RiskSnapshot`s) | `{ current_eal_inr: float, trend_direction: "increasing"\|"decreasing"\|"stable", historical_delta_pct: float, monthly_growth_rate_pct: float, projections: { day_30_eal_inr, day_60_eal_inr, day_90_eal_inr }, cost_of_delay: { day_30_inr, day_60_inr, day_90_inr } }` |
| `POST`| `/api/investment/optimize` | Solves 0-1 PuLP MILP capital allocation | `{ budget_inr: float }` | `{ selected_actions: [], total_cost_inr: float, total_reduction_inr: float, overall_rosi: float }` |
| `GET` | `/api/investment/pareto` | 10-point Pareto Spend Curve with Knee-Point detection | `max_budget_inr?: float` | `{ curve_points: [], knee_point: {} }` |
| `POST`| `/api/investment/actions/{id}/approve` | State machine: proposed -> approved | `id: UUID` | `MitigationAction` |
| `POST`| `/api/investment/actions/{id}/remediate` | State machine: approved -> remediated | `id: UUID` | `MitigationAction` |
| `GET` | `/api/investment/actions/{id}/outcome` | Closed-loop verification comparison | `id: UUID` | `{ estimated_reduction_inr: float, measured_reduction_inr: float, actual_rosi: float }` |

### 14.5 Scenario Simulation & Statutory Compliance

| Method | Endpoint | Description | Request / Query | Response Model |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/simulation/scenarios` | Pre-packaged scenario library catalog | None | `List[ScenarioTemplate]` |
| `POST`| `/api/simulation/run` | Deep-copy speculative what-if execution | `{ scenario_id: str }` | `SimulationResult` |
| `GET` | `/api/compliance/scores` | 6 Framework compliance scores & DPDP penalties | None | `List[FrameworkScorecard]` |
| `GET` | `/api/compliance/export` | Formal executive Audit Evidence Pack (PDF) | None | Binary PDF Stream (`audit_evidence.pdf`) |
| `POST`| `/api/connectors/trigger/{name}` | Trigger IAM/SIEM/EDR/CSPM telemetry sync | `connector_name: str` | `ConnectorSyncResponse` |

### 14.6 AI Assistant & Streaming

| Method | Endpoint | Request Body | Response Model |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/message` | `ChatMessageRequest` (message, history, context_job_ids) | `ChatMessageResponse` |
| `POST` | `/api/chat/stream` | `ChatMessageRequest` | Server-Sent Events (SSE) Stream |

---

## 15. Frontend Architecture & UI/UX Experience

The frontend is a single-page application built on **React 19**, **Vite 7.2**, **Tailwind CSS 3.4**, and **Three.js / React Three Fiber**.

### Application Route Map

```
/ (Root)
│
├── Landing Layout (Public 3D Experience)
│   └── / ──────────────────► HomePage.tsx (3D Robot Hero, Particle Field, Showcase, Sovereignty)
│
└── App Layout (Enterprise Security & Governance Portal)
    ├── /dashboard ─────────► Dashboard.tsx (Executive Summary, EAL Trend & Cost of Inaction, Spend Curve, Risk & Asset Charts)
    ├── /board-portal ──────► BoardPortal.tsx (C-Suite Governance, BU Rollup, VaR & Evidence PDF)
    ├── /scenario-simulator ─► ScenarioSimulator.tsx (Interactive What-If Modeling Workbench — 5 catalog scenarios, before/after EAL & VaR)
    ├── /compliance-center ─► ComplianceCenter.tsx (6 Framework Scorecards, DPDP Fines & Audit PDF)
    ├── /investment-actions ─► InvestmentActionBoard.tsx (MILP-Funded Action Board — Pin/Approve/Remediate Lifecycle)
    ├── /scan-console ──────► ScanConsole.tsx (Live Multi-Scanner Orchestrator & Tool Statuses)
    ├── /vulnerabilities ───► Vulnerabilities.tsx (Filterable CVE Table, CVSS, Exploit Status)
    ├── /assets ────────────► Assets.tsx (Asset Inventory, Exposure, OS, Criticality Tiers)
    ├── /attack-path ───────► AttackPath.tsx (Interactive React Flow Topology & Chained Paths)
    ├── /threat-intel ──────► ThreatIntel.tsx (Live NVD, CISA KEV, ExploitDB Feed & Sync Triggers)
    ├── /reports ───────────► Reports.tsx (PDF Report Generation & Historic Scan Audits)
    ├── /remediation ───────► Remediation.tsx (Actionable CVE Fix Guides & Step-by-Step Patches)
    ├── /assistant ─────────► ChatAssistant.tsx (CyRa AI Chat with Streaming Markdown & Citations)
    ├── /audit-logs ────────► AuditLogs.tsx (Full Event Ledger & System Activity Timeline)
    ├── /settings ──────────► Settings.tsx (System Configurations & Risk Weight Sliders)
    ├── /profile ───────────► UserProfile.tsx (User Identity, Role Badges & Access Keys)
    └── /graph-snapshot/:jobId ► GraphSnapshot.tsx (Headless Render Target for Playwright)
```

### Reusable, Self-Contained Chart Components

Several money-first visualizations own their own data fetching, loading/error state, and card chrome, so they drop into any page with no props — currently used on `Dashboard.tsx`, intended for `BoardPortal.tsx` once Phase 1's org/BU scope filtering lands:

* **`components/risk/EALTrendChart.tsx`** — plots today's Expected Annual Loss (`GET /api/risk/exposure`) against the real 30/60/90-day projections (`GET /api/risk/forecast`), i.e. "cost of inaction if nothing is remediated." Deliberately does not render a historical time series, since no endpoint persists queryable past `RiskSnapshot`s.
* **`components/risk/SpendCurveChart.tsx`** — the MILP capital-allocation Pareto frontier (`GET /api/investment/pareto`) with knee-point (optimal spend) marker.

---

## 16. Security, Authentication & Audit Logging

### Authentication Flow
1. **Password Hashing**: Uses `bcrypt` (pinned to `3.2.2` / `passlib`) for password storage.
2. **JSON Web Tokens (JWT)**: Signs bearer tokens via `python-jose` with `HS256` symmetric signing and configurable expiry (default: 24 hours).
3. **Role-Based Access Control (RBAC)**: Supports `admin`, `analyst`, `ciso`, and `auditor` roles.
4. **Developer Mode**: Controlled via `AUTH_DISABLED=True` in `backend/app/config.py` for rapid local iteration.

### Audit Logging Engine
All security-relevant actions trigger structured `AuditLog` records in PostgreSQL:
* `SCAN_STARTED`: Target, scanner selection, and requesting user.
* `REMEDIATION_APPROVED`: Action ID, baseline EAL, and approving analyst.
* `THREAT_INTEL_SYNCED`: Data source (NVD/CISA/ExploitDB) and records added.

---

## 17. Configuration, Environment Variables & Deployment

### Python Backend Package Requirements (`backend/requirements.txt`)

```ini
# Web Framework & Caching
fastapi
uvicorn[standard]
fastapi-cache2[redis]
redis

# Task Queue & Async Workers
celery
eventlet
amqp

# Database & Modeling
sqlmodel
psycopg2-binary

# Mathematical Modeling & Optimization
numpy
scipy
pulp>=2.8.0        # Required for Constrained MILP Capital Allocation Optimizer
networkx           # Attack-graph topology generation

# Utilities & Networking
python-dotenv
pydantic-settings
requests
httpx
tldextract
fpdf2
matplotlib
playwright

# Security & JWT
passlib
bcrypt==3.2.2
python-jose[cryptography]
python-multipart

# Email Notifications
fastapi-mail

# RAG Vector Search
faiss-cpu          # Unified in-memory vector similarity index (cve_index.faiss)
```

### Backend `.env` Variable Reference

```ini
# --- CORE DATABASE & MESSAGE BROKER ---
DATABASE_URL=postgresql://postgres:mysecretpassword@postgres:5432/sih_db
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672//
REDIS_URL=redis://redis:6379

# --- LEGACY / DEPRECATED (Unused in runtime; slated for removal) ---
# QDRANT_URL=http://qdrant:6333

# --- REMOTE GPU AI BRAIN ---
AI_SERVICE_URL=https://your-kaggle-ngrok-tunnel.ngrok-free.app

# --- THREAT INTEL API KEYS ---
ALIENVAULT_API_KEY=f0bcbec1ee4ece0b15a4693950b2932a889fd45f37b3fbb9b0221f22bd8a7462

# --- EMAIL NOTIFICATIONS (SMTP) ---
MAIL_USERNAME=theartifices25@gmail.com
MAIL_PASSWORD=ibxv wxnw ctin jhbg
MAIL_FROM=theartifices25@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com

# --- SECURITY & JWT ---
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
AUTH_DISABLED=True

# --- STORAGE PATHS ---
RAG_STORAGE_PATH=rag_storage/
```

### Production Deployment Commands

```bash
# 1. Build and boot the entire microservice stack
docker compose up -d --build

# 2. Verify all service health checks
docker compose ps

# 3. Seed demo hospital environment with realistic cyber risk data
docker exec -it sih-backend python app/seed_hospital_demo.py

# 4. View real-time Celery scanner execution logs
docker logs -f sih-celery-worker
```

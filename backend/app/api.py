import uuid
import os
import ipaddress
from fastapi_cache.decorator import cache
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Query 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select, or_, col, text
from app.database import get_session
from app.models import Job, JobStatus, AuditLog, VulnerabilityMetadata, User, Notification
from app.worker.tasks import run_scan_task
from app.graph import build_attack_graph
from app.reporting import generate_pdf_report
from app.chat_assistant import chat_assistant_service
from app.auth import create_access_token, get_current_user, verify_password
from app.remediation import get_remediation
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union, Literal
import asyncio
from datetime import datetime
from app.utils.exploitdb import sync_exploitdb
from app.utils.cisa_sync import sync_cisa_kev


# --- FIX: Updated Import ---
from app.utils.nvd_sync import sync_nvd 

# === Configuration Models ===
class NmapConfig(BaseModel):
    ports: Optional[str] = None
    speed: Literal["T1", "T2", "T3", "T4", "T5"] = "T4"
    script: Optional[str] = None
    raw_args: Optional[List[str]] = None

class NucleiConfig(BaseModel):
    tags: str = "cve"
    severity: Optional[str] = None
    raw_args: Optional[List[str]] = None

class ZapConfig(BaseModel):
    mode: Literal["baseline", "full"] = "baseline"
    raw_args: Optional[List[str]] = None

class NiktoConfig(BaseModel):
    tuning: Optional[str] = None
    raw_args: Optional[List[str]] = None

class MetasploitConfig(BaseModel):
    modules: List[str] = ["auxiliary/scanner/http/http_version"]
    raw_args: Optional[List[str]] = None

class OpenVASConfig(BaseModel):
    profile: Literal["Full and fast", "Discovery"] = "Full and fast"
    raw_args: Optional[List[str]] = None

class WappalyzerConfig(BaseModel):
    enabled: bool = True

class ScannerConfig(BaseModel):
    enabled: bool = True
    params: Optional[Dict[str, Any]] = {}

class ScannerConfigs(BaseModel):
    nmap: Optional[NmapConfig] = NmapConfig()
    nuclei: Optional[NucleiConfig] = NucleiConfig()
    zap: Optional[ZapConfig] = ZapConfig()
    nikto: Optional[NiktoConfig] = NiktoConfig()
    metasploit: Optional[MetasploitConfig] = MetasploitConfig()
    openvas: Optional[OpenVASConfig] = OpenVASConfig()
    wappalyzer: Optional[WappalyzerConfig] = WappalyzerConfig()

class ScanStartRequest(BaseModel):
    target: str
    scanners: Optional[Union[List[str], Dict[str, ScannerConfig]]] = None
    config: Optional[ScannerConfigs] = ScannerConfigs()
    notify_email: bool = False
    email_recipients: List[str] = []

class ChatMessageRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class ChatMessageResponse(BaseModel):
    response: str

class ScanStartResponse(BaseModel):
    job_id: uuid.UUID
    status: JobStatus
    target: str
    scanners_requested: List[str]

class ScanStatusResponse(BaseModel):
    job_id: uuid.UUID
    status: JobStatus
    target: str
    created_at: str
    scanners_requested: Optional[List[str]]
    tool_status: Optional[Dict[str, str]] = None
    results: Optional[dict] = None

class DashboardStatsResponse(BaseModel):
    total_vulnerabilities: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    asset_criticality_score: int
    open_ports_detected: int
    unified_cyber_score: int
    total_assets: int
    internet_exposed: int
    high_risk_assets: int
    cloud_assets: int
    asset_distribution: Dict[str, int]

class AssetResponse(BaseModel):
    id: uuid.UUID
    name: str
    ip: str
    os: str
    exposure: str
    risk: str
    cloud: str
    discovered_by: str
    last_seen: str

class VulnerabilityResponse(BaseModel):
    id: uuid.UUID
    cve: str
    title: str
    description: Optional[str]
    severity: str
    cvss: float
    asset: str
    tool: str
    date: str

class JobHistoryResponse(BaseModel):
    job_id: uuid.UUID
    target: str
    status: JobStatus
    created_at: str
    scanners_used: List[str]

class ReportResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    date: str
    status: str

class ReportStatsResponse(BaseModel):
    total: int
    completed: int
    pending: int
    failed: int

class ThreatIntelSummaryResponse(BaseModel):
    total_cve_tracked: int
    cisa_kev_tracked: int
    exploits_available: int
    most_recent_sync: str

router = APIRouter(prefix="/api", tags=["Scans"])

# --- HELPER ---
def is_private_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False 

# --- AUTHENTICATION ENDPOINT ---
@router.post("/auth/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PROTECTED ROUTES ---

@router.post("/scan/start", response_model=ScanStartResponse)
def start_scan(
    request: ScanStartRequest, 
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    worker_config = {}
    
    selected_scanners = []
    if not request.scanners:
        selected_scanners = ["nmap", "nuclei", "nikto", "zap", "wappalyzer", "metasploit", "openvas"]
    elif isinstance(request.scanners, list):
        selected_scanners = request.scanners
    elif isinstance(request.scanners, dict):
        selected_scanners = [k for k, v in request.scanners.items() if v.enabled]
        for name, cfg in request.scanners.items():
            if cfg.enabled: worker_config[name] = cfg.params

    for name in selected_scanners:
        if name not in worker_config: worker_config[name] = {}
        if request.config:
            cfg_model = getattr(request.config, name, None)
            if cfg_model: worker_config[name].update(cfg_model.dict(exclude_none=True))

    new_job = Job(
        target=request.target, 
        status=JobStatus.PENDING,
        scanners_requested=selected_scanners,
        tool_status={name: "pending" for name in selected_scanners},
        notify_email=request.notify_email,
        email_recipients=request.email_recipients
    )
    session.add(new_job)
    session.commit()
    session.refresh(new_job)
    
    audit = AuditLog(event_type="SCAN_STARTED", details={"target": request.target, "scanners": selected_scanners, "user": user.username}, job_id=new_job.id)
    session.add(audit)
    session.commit()

    run_scan_task.delay(job_id=str(new_job.id), scanners=worker_config)
    
    return ScanStartResponse(
        job_id=new_job.id, status=new_job.status, target=new_job.target, scanners_requested=new_job.scanners_requested
    )

@router.get("/scan/status/{job_id}", response_model=ScanStatusResponse)
def get_scan_status(
    job_id: uuid.UUID, 
    include_results: bool = False, 
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    job = session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    
    return ScanStatusResponse(
        job_id=job.id, 
        status=job.status, 
        target=job.target, 
        created_at=str(job.created_at),
        scanners_requested=job.scanners_requested, 
        tool_status=job.tool_status, 
        results=job.normalized_report if include_results else None 
    )

@router.get("/scan/logs", tags=["Audit"])
def get_audit_logs(
    limit: int = 50,
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())
    
    if search:
        # Cast JSON details to string for searching
        query = query.where(or_(
            col(AuditLog.event_type).contains(search),
            col(AuditLog.details).cast(str).contains(search)
        ))
        
    return session.exec(query.limit(limit)).all()

@router.get("/scan/graph/{job_id}")
def get_scan_graph(
    job_id: uuid.UUID, 
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    job = session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    if not job.normalized_report: return {"nodes": [], "edges": []}
    return build_attack_graph(job.normalized_report)

# === CHAT ASSISTANT ENDPOINTS ===
@router.post("/chat/message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    user: User = Depends(get_current_user)
):
    response = await chat_assistant_service.get_response_async(request.message, request.history)
    return ChatMessageResponse(response=response)

@router.post("/chat/stream")
async def stream_chat_response(
    request: ChatMessageRequest,
    user: User = Depends(get_current_user)
):
    async def event_generator():
        async for chunk in chat_assistant_service.stream_response(request.message, request.history):
            yield chunk
            await asyncio.sleep(0.01)

    return StreamingResponse(event_generator(), media_type="text/plain")

# === DATA ENDPOINTS ===

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
@cache(expire=60)
def get_dashboard_stats(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    jobs = session.exec(select(Job).where(Job.status == JobStatus.COMPLETED)).all()
    total_vulns = 0; critical = 0; high = 0; medium = 0; low = 0; open_ports = 0
    unique_assets = {}
    dist = {"Web Servers": 0, "Database Servers": 0, "SSH/Infra": 0, "Workstations": 0, "Others": 0}

    for job in jobs:
        report = job.normalized_report or {}
        host_info = report.get("host_info", {})
        ip = host_info.get("ip") or job.target
        
        if ip not in unique_assets:
            unique_assets[ip] = {"risk": "Low", "exposed": False}
            ports = [p.get('port') for p in report.get("ports", [])]
            if any(p in [80, 443, 8080] for p in ports): dist["Web Servers"] += 1
            elif any(p in [5432, 3306] for p in ports): dist["Database Servers"] += 1
            elif any(p in [22] for p in ports): dist["SSH/Infra"] += 1
            else: dist["Others"] += 1

        if not is_private_ip(ip): unique_assets[ip]["exposed"] = True
        open_ports += len(report.get("ports", []))
        
        vulns = report.get("vulnerabilities", [])
        total_vulns += len(vulns)
        
        asset_risk = unique_assets[ip]["risk"]
        for v in vulns:
            sev = v.get("severity", "").lower()
            if sev == "critical": critical += 1; asset_risk = "Critical"
            elif sev == "high": high += 1; asset_risk = "High" if asset_risk != "Critical" else asset_risk
            elif sev == "medium": medium += 1
            else: low += 1
        unique_assets[ip]["risk"] = asset_risk

    unified_score = min(1000, (critical * 100) + (high * 20) + (medium * 5) + (total_vulns))
    
    return DashboardStatsResponse(
        total_vulnerabilities=total_vulns, critical_findings=critical, high_findings=high,
        medium_findings=medium, low_findings=low, asset_criticality_score=open_ports * 10,
        open_ports_detected=open_ports, unified_cyber_score=unified_score,
        total_assets=len(unique_assets), internet_exposed=sum(1 for a in unique_assets.values() if a["exposed"]),
        high_risk_assets=sum(1 for a in unique_assets.values() if a["risk"] in ["Critical", "High"]),
        cloud_assets=0, asset_distribution=dist
    )

@router.get("/assets", response_model=List[AssetResponse])
@cache(expire=60)
def get_assets(
    skip: int = 0, 
    limit: int = 100, 
    # New Filter Parameters
    risk: Optional[List[str]] = Query(None),
    exposure: Optional[List[str]] = Query(None),
    os_type: Optional[List[str]] = Query(None, alias="os"),
    cloud: Optional[List[str]] = Query(None),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    jobs = session.exec(select(Job).where(Job.status == JobStatus.COMPLETED).order_by(Job.created_at.desc())).all()
    assets_map = {} 

    for job in jobs:
        if not job.normalized_report: continue
        
        host_info = job.normalized_report.get("host_info", {})
        ip = host_info.get("ip") or job.target
        hostnames = host_info.get("hostnames", [])
        name = hostnames[0] if hostnames else ip
        
        vulns = job.normalized_report.get("vulnerabilities", [])
        asset_risk = "Low"
        for v in vulns:
            sev = v.get("severity", "").lower()
            if sev == "critical": asset_risk = "Critical"; break
            if sev == "high" and asset_risk != "Critical": asset_risk = "High"
            if sev == "medium" and asset_risk not in ["Critical", "High"]: asset_risk = "Medium"

        asset_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, name))
        
        # Determine Exposure
        is_exposed = not is_private_ip(ip)
        exposure_val = "Internet-facing" if is_exposed else "Internal"
        
        # Determine OS (simple heuristic)
        # In a real app, this would come from Nmap OS detection in the report
        os_val = "Unknown"
        if "linux" in str(job.normalized_report).lower(): os_val = "Linux"
        elif "windows" in str(job.normalized_report).lower(): os_val = "Windows"
        
        if asset_id not in assets_map:
            assets_map[asset_id] = AssetResponse(
                id=uuid.UUID(asset_id), name=name, ip=ip, os=os_val,
                exposure=exposure_val, risk=asset_risk, cloud="On-Prem",
                discovered_by="Scanner", last_seen=str(job.created_at)[:10]
            )

    # Convert to list for filtering
    all_assets = list(assets_map.values())
    filtered_assets = []

    # Apply Filters
    for asset in all_assets:
        # Risk Filter
        if risk and asset.risk not in risk:
            continue
        
        # Exposure Filter
        if exposure and asset.exposure not in exposure:
            continue
            
        # OS Filter (Partial Match)
        if os_type:
            # Check if any selected OS string is in the asset OS string
            if not any(o.lower() in asset.os.lower() for o in os_type):
                continue
        
        # Cloud Filter
        if cloud and asset.cloud not in cloud:
            continue
            
        filtered_assets.append(asset)

    return filtered_assets[skip : skip + limit]


@router.get("/vulnerabilities", response_model=List[VulnerabilityResponse])
@cache(expire=60)
def get_vulnerabilities(
    skip: int = 0, 
    limit: int = 100,
    # New Filters
    severity: Optional[List[str]] = Query(None),
    tool: Optional[List[str]] = Query(None),
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    jobs = session.exec(select(Job).where(Job.status == JobStatus.COMPLETED).order_by(Job.created_at.desc())).all()
    all_vulns = []
    
    for job in jobs:
        if not job.normalized_report: continue
        vulns = job.normalized_report.get("vulnerabilities", [])
        host_info = job.normalized_report.get("host_info", {})
        asset_name = host_info.get("hostnames", [None])[0] or host_info.get("ip") or job.target
        
        for v in vulns:
            # --- Extract Data ---
            cve = v.get("cve") or v.get("enrichment", {}).get("cve_id") or "N/A"
            title = v.get("title", "Unknown")
            tool_name = v.get("tool", "Unknown")
            sev = v.get("severity", "info").title()
            
            # --- APPLY FILTERS (Python side due to JSON storage) ---
            if severity and sev not in severity: continue
            if tool and tool_name not in tool: continue
            
            # Search Logic (Asset, Title, CVE)
            if search:
                search_lower = search.lower()
                if (search_lower not in asset_name.lower() and 
                    search_lower not in title.lower() and 
                    search_lower not in cve.lower()):
                    continue
            
            # --- Map Data ---
            cvss_raw = v.get("cvss_score") or v.get("enrichment", {}).get("nvd_data", {}).get("score")
            try: cvss = float(cvss_raw) if cvss_raw else 0.0
            except (ValueError, TypeError): cvss = 0.0

            description = v.get("description") or v.get("enrichment", {}).get("nvd_data", {}).get("description") or "No description."

            all_vulns.append(VulnerabilityResponse(
                id=uuid.uuid4(), cve=cve, title=title,
                description=description, severity=sev,
                cvss=cvss, asset=asset_name, tool=tool_name,
                date=str(job.created_at)[:10]
            ))

    return all_vulns[skip : skip + limit]

@router.get("/jobs", response_model=List[JobHistoryResponse])
def get_job_history(
    skip: int = 0, limit: int = 100, 
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    jobs = session.exec(select(Job).order_by(Job.created_at.desc()).offset(skip).limit(limit)).all()
    return [
        JobHistoryResponse(
            job_id=job.id, target=job.target, status=job.status,
            created_at=str(job.created_at), scanners_used=job.scanners_requested or []
        )
        for job in jobs
    ]

@router.get("/reports", response_model=List[ReportResponse])
def get_reports(
    skip: int = 0, limit: int = 100,
    # New Filters
    status_filter: Optional[List[str]] = Query(None, alias="status"),
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    query = select(Job).order_by(Job.created_at.desc())
    
    # Filter by Status (Completed, Failed, etc.)
    if status_filter:
        # Map frontend "Available" to backend "completed" if needed, or pass exact status
        # Assuming frontend passes "completed", "failed", etc.
        query = query.where(col(Job.status).in_(status_filter))
    
    # Search by Target
    if search:
        query = query.where(col(Job.target).contains(search))

    jobs = session.exec(query.offset(skip).limit(limit)).all()
    
    return [
        ReportResponse(
            id=job.id, name=f"Scan Report - {job.target}", type="Vulnerability Scan",
            date=str(job.created_at)[:10], status=job.status
        )
        for job in jobs
    ]

@router.get("/reports/stats", response_model=ReportStatsResponse)
def get_report_stats(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    total = session.exec(select(Job)).all()
    completed = [j for j in total if j.status == JobStatus.COMPLETED]
    pending = [j for j in total if j.status in [JobStatus.PENDING, JobStatus.RUNNING]]
    failed = [j for j in total if j.status in [JobStatus.FAILED, JobStatus.PARTIAL_SUCCESS]]
    
    return ReportStatsResponse(
        total=len(total), completed=len(completed),
        pending=len(pending), failed=len(failed)
    )

@router.get("/threat-intel/summary", response_model=ThreatIntelSummaryResponse)
def get_threat_intel_summary(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    total_cve = len(session.exec(select(VulnerabilityMetadata)).all())
    cisa_kev_count = len(session.exec(select(VulnerabilityMetadata).where(VulnerabilityMetadata.is_cisa_kev == True)).all())
    exploits_available = len(session.exec(select(VulnerabilityMetadata).where(VulnerabilityMetadata.has_exploit == True)).all())
    last_sync = session.exec(select(VulnerabilityMetadata.last_updated).order_by(VulnerabilityMetadata.last_updated.desc()).limit(1)).first()
    
    return ThreatIntelSummaryResponse(
        total_cve_tracked=total_cve, cisa_kev_tracked=cisa_kev_count,
        exploits_available=exploits_available,
        most_recent_sync=str(last_sync.strftime('%Y-%m-%d %H:%M')) if last_sync else "N/A"
    )

@router.post("/threat-intel/sync-exploitdb")
def trigger_exploitdb_sync(
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    """
    Triggers a background task to sync ExploitDB data.
    """
    background_tasks.add_task(sync_exploitdb)
    return {"status": "ExploitDB sync started in background"}

@router.get("/threat-intel/feed", response_model=List[VulnerabilityMetadata])
def get_threat_intel_feed(
    skip: int = 0, limit: int = 50,
    # New Filters
    severity: Optional[List[str]] = Query(None),
    exploit_status: Optional[str] = None, # "Exploit Available", "No Exploit", "All"
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    query = select(VulnerabilityMetadata).order_by(VulnerabilityMetadata.last_updated.desc())

    if severity:
        # Note: NVD severity is often UPPERCASE in DB
        upper_sev = [s.upper() for s in severity]
        query = query.where(col(VulnerabilityMetadata.severity).in_(upper_sev))

    if exploit_status:
        if exploit_status == "Exploit Available":
            query = query.where(VulnerabilityMetadata.has_exploit == True)
        elif exploit_status == "No Known Exploit":
            query = query.where(VulnerabilityMetadata.has_exploit == False)

    if search:
        # Search ID or Description
        query = query.where(or_(
            col(VulnerabilityMetadata.cve_id).contains(search.upper()),
            col(VulnerabilityMetadata.description).contains(search)
        ))

    return session.exec(query.offset(skip).limit(limit)).all()

@router.post("/threat-intel/sync-cisa")
def trigger_cisa_sync(
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    """
    Triggers a background task to sync CISA KEV data.
    """
    background_tasks.add_task(sync_cisa_kev)
    return {"status": "CISA KEV sync started in background"}

# --- FIX: Threat Intel Sync Trigger ---
@router.post("/threat-intel/sync")
def trigger_threat_intel_sync(
    background_tasks: BackgroundTasks,
    days: int = 30,
    user: User = Depends(get_current_user)
):
    """
    Triggers a background task to sync NVD data.
    """
    background_tasks.add_task(sync_nvd, days_back=days)
    return {"status": "Sync started in background", "days": days}

def remove_file(path: str):
    try: os.remove(path)
    except Exception as e: print(f"Error deleting file {path}: {e}")

@router.get("/scan/report/{job_id}")
def get_scan_report_pdf(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    job = session.get(Job, job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    if not job.normalized_report: raise HTTPException(status_code=400, detail="Scan not completed")

    filename = f"report_{job_id}.pdf"
    file_path = f"/tmp/{filename}"
    generate_pdf_report({
        "job_id": str(job.id), "target": job.target, "created_at": job.created_at, "results": job.normalized_report
    }, file_path)
    
    background_tasks.add_task(remove_file, file_path)
    return FileResponse(path=file_path, filename=filename, media_type='application/pdf')

@router.get("/remediation/{job_id}")
def get_remediation_plan(
    job_id: uuid.UUID, 
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    job = session.get(Job, job_id)
    if not job or not job.normalized_report:
        raise HTTPException(status_code=404, detail="Job or report not found")

    vulns = job.normalized_report.get("vulnerabilities", [])
    remediation_plan = []

    for v in vulns:
        # Skip Info/Low if you want to focus on real threats
        if v.get("severity", "").lower() == "info": continue

        fix = get_remediation(v)
        remediation_plan.append({
            "cve": v.get("cve") or v.get("enrichment", {}).get("cve_id") or "N/A",
            "title": v.get("title"),
            "severity": v.get("severity"),
            "asset": v.get("asset") or job.target,
            "action": fix["action"],
            "source": fix["source"]
        })
        
    # Sort by Severity (Critical first)
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    remediation_plan.sort(key=lambda x: severity_order.get(x["severity"].lower(), 4))

    return remediation_plan

@router.get("/notifications", response_model=List[Notification])
def get_notifications(limit: int = 20, session: Session = Depends(get_session)):
    # Simple fetch of latest notifications
    return session.exec(select(Notification).order_by(Notification.timestamp.desc()).limit(limit)).all()

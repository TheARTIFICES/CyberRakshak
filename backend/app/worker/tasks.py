import time
import uuid
import subprocess
import os
import json
import concurrent.futures
import urllib3
import asyncio
import re
from sqlmodel import Session
from app.worker.celery_app import celery_app
from app.database import engine
from app.models import Job, JobStatus, Notification
from typing import List, Dict, Any, Optional
from app.parsers import parse_nmap, parse_nuclei, parse_nikto, parse_zap, parse_wappalyzer, parse_metasploit, parse_openvas
from app.enrichment import get_cisa_kev_data, enrich_vulnerability
from app.utils.nvd_sync import sync_nvd
from app.utils.exploitdb import sync_exploitdb
from app.utils.cisa_sync import sync_cisa_kev
from app.utils.mailer import send_scan_email 
from app.reporting import generate_pdf_report
from app.graph import generate_graph_image

# Disable self-signed cert warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

INTERNAL_OUTPUTS_DIR = os.path.abspath("outputs")
os.makedirs(INTERNAL_OUTPUTS_DIR, exist_ok=True)
HOST_PROJECT_PATH = os.environ.get("HOST_PROJECT_PATH", os.path.abspath("."))
HOST_OUTPUTS_DIR = os.path.join(HOST_PROJECT_PATH, "outputs")

# --- HELPER: STATUS UPDATER ---
def update_tool_status(job_id: uuid.UUID, tool_name: str, status: str):
    """Updates the status of a single tool in the DB"""
    with Session(engine) as session:
        job = session.get(Job, job_id)
        if job:
            current_status = job.tool_status.copy()
            current_status[tool_name] = status
            job.tool_status = current_status
            session.add(job)
            session.commit()

# ... [KEEP Nmap, Nuclei, Nikto, Zap, Wappalyzer, Metasploit functions AS IS] ...

def run_nmap(target: str, host_dir: str, internal_dir: str, config: Dict[str, Any]) -> Optional[str]:
    print(f"Starting Nmap for {target}...")
    output_file = os.path.join(internal_dir, "nmap.xml")
    
    speed = config.get("speed", "T4")
    ports = config.get("ports")
    script = config.get("script")
    raw_args = config.get("raw_args")

    cmd = [
        "docker", "run", "--rm",
        "-v", f"{host_dir}:/output",
        "instrumentisto/nmap",
        "-sV", f"-{speed}", 
        "-oX", "/output/nmap.xml"
    ]
    
    if ports:
        if str(ports).startswith("top-"):
            cmd.extend(["--top-ports", ports.split("-")[1]])
        else:
            cmd.extend(["-p", ports])

    if script: cmd.extend(["--script", script])
    if raw_args: cmd.extend(raw_args)

    cmd.append(target)
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("Nmap completed.")
        return output_file
    except subprocess.CalledProcessError as e:
        print(f"Nmap Failed: {e.stderr}")
        return None

def run_nuclei(target: str, host_dir: str, internal_dir: str, config: Dict[str, Any]) -> Optional[str]:
    print(f"Starting Nuclei for {target}...")
    output_file = os.path.join(internal_dir, "nuclei.jsonl")
    
    tags = config.get("tags", "cve")
    severity = config.get("severity")
    raw_args = config.get("raw_args")

    cmd = [
        "docker", "run", "--rm",
        "-v", f"{host_dir}:/output",
        "projectdiscovery/nuclei",
        "-target", target,
        "-tags", tags, 
        "-jsonl", "-o", "/output/nuclei.jsonl"
    ]
    if severity: cmd.extend(["-severity", severity])
    if raw_args: cmd.extend(raw_args)

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("Nuclei completed.")
        return output_file
    except subprocess.CalledProcessError as e:
        print(f"Nuclei Failed: {e.stderr}")
        return None

def run_nikto(target: str, host_dir: str, internal_dir: str, config: Dict[str, Any]) -> Optional[str]:
    print(f"Starting Nikto for {target}...")
    output_file = os.path.join(internal_dir, "nikto.json")
    
    tuning = config.get("tuning", "4")
    raw_args = config.get("raw_args")
    
    cmd = [
        "docker", "run", "--rm",
        "--user", "root",
        "-v", f"{host_dir}:/output",
        "ghcr.io/sullo/nikto:latest",
        "-h", target,
        "-Format", "json",
        "-o", "/output/nikto.json",
        "-Tuning", tuning
    ]
    if raw_args: cmd.extend(raw_args)

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("Nikto completed.")
        return output_file
    except subprocess.CalledProcessError:
        if os.path.exists(output_file): return output_file
        return None

def run_zap(target: str, host_dir: str, internal_dir: str, config: Dict[str, Any]) -> Optional[str]:
    print(f"Starting ZAP for {target}...")
    output_file = os.path.join(internal_dir, "zap.json")
    target_url = target if target.startswith("http") else f"http://{target}"
    
    mode = config.get("mode", "baseline")
    script = "zap-full-scan.py" if mode == "full" else "zap-baseline.py"
    
    cmd = [
        "docker", "run", "--rm",
        "--user", "root",
        "-v", f"{host_dir}:/zap/wrk/:rw",
        "ghcr.io/zaproxy/zaproxy:stable",
        script,
        "-t", target_url,
        "-J", "zap.json"
    ]

    subprocess.run(cmd, check=False, capture_output=True, text=True)
    print("ZAP completed.")
    return output_file

def run_wappalyzer(target: str, host_dir: str, internal_dir: str, config: Dict[str, Any]) -> Optional[str]:
    print(f"Starting Wappalyzer for {target}...")
    output_file = os.path.join(internal_dir, "wappalyzer.json")
    target_url = target if target.startswith("http") else f"http://{target}"
    
    cmd = [ "docker", "run", "--rm", "local/wappalyzer", target_url ]
    result = subprocess.run(cmd, check=False, capture_output=True, text=True)
    try:
        json.loads(result.stdout)
        with open(output_file, 'w') as f: f.write(result.stdout)
        print("Wappalyzer completed.")
        return output_file
    except: return None

def run_metasploit(target: str, host_dir: str, internal_dir: str, config: Dict[str, Any]) -> Optional[str]:
    print(f"Starting Metasploit for {target}...")
    output_file = os.path.join(internal_dir, "metasploit.txt")
    
    modules = config.get("modules", ["auxiliary/scanner/http/http_version"])
    
    msf_commands = ""
    for mod in modules:
        msf_commands += f"use {mod}; set RHOSTS {target}; run; "
    msf_commands += "exit"

    cmd = [
        "docker", "run", "--rm",
        "metasploitframework/metasploit-framework",
        "./msfconsole", "-q", "-x", msf_commands 
    ]
    result = subprocess.run(cmd, check=False, capture_output=True, text=True)
    with open(output_file, 'w') as f: f.write(result.stdout)
    print("Metasploit completed.")
    return output_file

def run_openvas(target: str, host_dir: str, internal_dir: str, config: Dict[str, Any]) -> Optional[str]:
    print(f"Starting OpenVAS for {target}...")
    
    # Files
    final_output_file = os.path.join(internal_dir, "openvas.xml")
    container_output_filename = "openvas_results.xml"
    celery_output_path = os.path.join(internal_dir, container_output_filename)
    script_filename = "openvas_scan.gmp.py"
    
    profile = config.get("profile", "Full and fast")
    config_id = "daba56c8-73ec-11df-a475-002264764cea"
    if profile == "Discovery": config_id = "8715c877-47a0-471c-8f13-5266c9931727"
    
    gmp_script = f"""
import sys
import time
from gvm.connections import UnixSocketConnection
from gvm.protocols.gmp import Gmp
from gvm.transforms import EtreeTransform
from lxml import etree

try:
    connection = UnixSocketConnection(path='/run/gvmd/gvmd.sock', timeout=30)
    transform = EtreeTransform()

    with Gmp(connection, transform=transform) as gmp:
        gmp.authenticate('admin', 'admin')
        
        # Create Target
        response = gmp.create_target(name="Scan-{target}-" + str(time.time()), hosts=["{target}"], port_list_id="33d0cd82-57c6-11e1-8ed1-406186ea4fc5")
        target_id = response.get('id')
        if not target_id:
            print("Error: Failed to create target", file=sys.stderr)
            sys.exit(1)
        
        # Create Task
        response = gmp.create_task(name="Task-{target}", config_id="{config_id}", target_id=target_id, scanner_id="08b69003-5fc2-4037-a479-93b440211c73")
        task_id = response.get('id')
        if not task_id:
            print("Error: Failed to create task", file=sys.stderr)
            sys.exit(1)
        
        # Start Task
        gmp.start_task(task_id)
        
        # Poll Status
        while True:
            response = gmp.get_task(task_id)
            status_list = response.xpath('task/status/text()')
            if not status_list:
                print("Error: Failed to get status", file=sys.stderr)
                break
            status = status_list[0]
            if status == 'Done': break
            if status in ['Stopped', 'Interrupted', 'New']: 
                print(f"Scan stopped prematurely: {{status}}", file=sys.stderr)
                break
            time.sleep(15)
        
        # Get Report
        response = gmp.get_task(task_id)
        reports = response.xpath('task/last_report/report/@id')
        
        if not reports:
             print("Error: No report generated.", file=sys.stderr)
             sys.exit(1)
             
        report_id = reports[0]
        response = gmp.get_report(report_id, report_format_id="a994b278-1f62-11e1-96ac-406186ea4fc5")
        
        # --- KEY CHANGE: WRITE TO FILE DIRECTLY ---
        with open('/scan/{container_output_filename}', 'w') as f:
            f.write(etree.tostring(response, encoding='unicode'))

except Exception as e:
    print(f"GMP Script Error: {{e}}", file=sys.stderr)
    sys.exit(1)
"""
    script_path = os.path.join(internal_dir, script_filename)
    with open(script_path, 'w') as f: f.write(gmp_script)
    os.chmod(script_path, 0o644)

    cmd = [
        "docker", "run", "--rm", "--user", "1001",
        "-v", "greenbone-community-edition_gvmd_socket_vol:/run/gvmd",
        "-v", f"{host_dir}:/scan",
        "local/gvm-tools",
        "socket", "--socketpath", "/run/gvmd/gvmd.sock",
        f"/scan/{script_filename}"
    ]
    
    try:
        result = subprocess.run(cmd, check=False, capture_output=True, text=True)
        
        # Check if the file was created in the shared volume
        if os.path.exists(celery_output_path):
            os.rename(celery_output_path, final_output_file)
            print("OpenVAS scan complete. Report retrieved successfully.")
            return final_output_file
        else:
            print("OpenVAS Failed: No output file found.")
            print(f"STDERR: {result.stderr}")
            return None

    except Exception as e: 
        print(f"OpenVAS Execution Error: {e}")
        return None

def run_scanner_wrapper(scanner_func, job_id, tool_name, *args):
    try:
        update_tool_status(job_id, tool_name, "running")
        result = scanner_func(*args)
        if result:
            update_tool_status(job_id, tool_name, "completed")
            return result
        else:
            update_tool_status(job_id, tool_name, "failed")
            return None
    except Exception as e:
        print(f"Error in {tool_name}: {e}")
        update_tool_status(job_id, tool_name, "failed")
        return None

@celery_app.task(bind=True)
def run_scan_task(self, job_id: str, scanners: Dict[str, Any]):
    print(f"Task received for job_id: {job_id}. Scanners: {list(scanners.keys())}")
    
    with Session(engine) as session:
        job_uuid = uuid.UUID(job_id)
        job = session.get(Job, job_uuid)
        if not job: return
        
        initial_status = {name: "pending" for name in scanners.keys()}
        job.tool_status = initial_status
        job.status = JobStatus.RUNNING
        session.add(job)
        session.commit()

        output_paths: Dict[str, str] = {} 
        normalized_data = {"ports": [], "vulnerabilities": [], "technologies": []}
        vulnerabilities = []

        host_dir = os.path.join(HOST_OUTPUTS_DIR, job_id)
        internal_dir = os.path.join(INTERNAL_OUTPUTS_DIR, job_id)
        os.makedirs(internal_dir, exist_ok=True)

        scanner_map = {
            "nmap": run_nmap,
            "nuclei": run_nuclei,
            "nikto": run_nikto,
            "zap": run_zap,
            "wappalyzer": run_wappalyzer,
            "metasploit": run_metasploit,
            "openvas": run_openvas
        }

        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            future_to_scanner = {}
            for name, config in scanners.items():
                if name in scanner_map:
                    future = executor.submit(run_scanner_wrapper, scanner_map[name], job_uuid, name, job.target, host_dir, internal_dir, config)
                    future_to_scanner[future] = name
            
            for future in concurrent.futures.as_completed(future_to_scanner):
                name = future_to_scanner[future]
                try:
                    result_path = future.result()
                    if result_path: output_paths[name] = result_path
                except Exception as e: 
                    print(f"Scanner {name} exception: {e}")

        failed_tools = [n for n, s in job.tool_status.items() if s == "failed"]
        all_failed = len(failed_tools) == len(scanners)
        
        if "nmap" in output_paths:
            res = parse_nmap(output_paths["nmap"])
            normalized_data["host_info"] = res["host_info"]
            normalized_data["ports"].extend(res["open_ports"])
        if "nuclei" in output_paths: vulnerabilities.extend(parse_nuclei(output_paths["nuclei"]))
        if "nikto" in output_paths: vulnerabilities.extend(parse_nikto(output_paths["nikto"]))
        if "zap" in output_paths: vulnerabilities.extend(parse_zap(output_paths["zap"]))
        if "wappalyzer" in output_paths: normalized_data["technologies"] = parse_wappalyzer(output_paths["wappalyzer"])
        if "metasploit" in output_paths: vulnerabilities.extend(parse_metasploit(output_paths["metasploit"]))
        if "openvas" in output_paths: vulnerabilities.extend(parse_openvas(output_paths["openvas"]))

        cisa_cache = get_cisa_kev_data()
        enriched_vulns = [enrich_vulnerability(v, cisa_cache) for v in vulnerabilities]
        normalized_data["vulnerabilities"] = enriched_vulns

        job.status = JobStatus.FAILED if all_failed else (JobStatus.PARTIAL_SUCCESS if failed_tools else JobStatus.COMPLETED)
        job.output_files = output_paths
        job.normalized_report = normalized_data
        
        session.add(job)
        session.commit()
        session.refresh(job)
        
        # --- NOTIFICATIONS & EMAILS ---
        try:
            notif = Notification(
                title=f"Scan Finished: {job.target}",
                message=f"Scan completed with status: {job.status}. Found {len(vulnerabilities)} issues.",
                type="success" if job.status == JobStatus.COMPLETED else "error",
                job_id=job.id
            )
            session.add(notif)
            session.commit()

            if job.notify_email and job.email_recipients:
                print(f"Sending email to: {job.email_recipients}")
                
                pdf_path = os.path.join(internal_dir, f"report_{job_id}.pdf")
                generate_pdf_report({
                    "job_id": str(job.id), "target": job.target, "created_at": job.created_at, "results": normalized_data
                }, pdf_path)

                graph_path = os.path.join(internal_dir, f"graph_{job_id}.png")
                try:
                    generate_graph_image(str(job.id), graph_path)
                except Exception as e: 
                    print(f"Graph Gen Error: {e}")
                    graph_path = None

                attachments = [pdf_path]
                if graph_path and os.path.exists(graph_path):
                    attachments.append(graph_path)

                asyncio.run(send_scan_email(
                    recipients=job.email_recipients,
                    subject=f"CyberRakshak Scan Report: {job.target}",
                    body=f"Scan completed. Found {len(vulnerabilities)} vulnerabilities.\n\nSee attached report.",
                    attachments=attachments
                ))
        except Exception as e:
            print(f"Notification Error: {e}")
        
        return {"status": job.status, "files": output_paths}

@celery_app.task
def sync_threat_intel_task():
    print("--- Starting Scheduled NVD Sync ---")
    sync_nvd(days_back=2)
    print("--- Scheduled NVD Sync Completed ---")

@celery_app.task
def sync_exploitdb_task():
    sync_exploitdb()

@celery_app.task
def sync_cisa_task():
    sync_cisa_kev()

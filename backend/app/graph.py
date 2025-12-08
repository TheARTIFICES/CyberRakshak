import networkx as nx
from typing import Dict, Any
from playwright.sync_api import sync_playwright
import time

def build_attack_graph(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts a normalized scan report into a NetworkX graph JSON.
    Calculates layout positions for React Flow.
    """
    G = nx.DiGraph()
    
    # 1. Root Node: The Target Host
    host_info = report.get("host_info", {})
    ip = host_info.get("ip", "Target")
    hostnames = host_info.get("hostnames", [])
    label = hostnames[0] if hostnames else ip
    
    root_id = "root"
    G.add_node(
        root_id, 
        label=label, 
        node_type="Asset",
        ip=ip, 
        type="input", 
        style={"background": "#2563eb", "color": "white"}
    )

    # 2. Level 1: Ports
    for port in report.get("ports", []):
        port_id = f"port_{port['port']}"
        label = f"{port['port']}/{port['protocol']}"
        service = port.get('service', 'unknown')
        
        G.add_node(
            port_id, 
            label=label, 
            node_type="Service", 
            service=service, 
            type="default", 
            style={"background": "#16a34a", "color": "white"}
        )
        G.add_edge(root_id, port_id)
        
        if service and service != "unknown":
            service_id = f"service_{port['port']}"
            G.add_node(
                service_id, 
                label=service, 
                node_type="Technology", 
                type="default", 
                style={"background": "#0891b2", "color": "white"}
            )
            G.add_edge(port_id, service_id)

    # 3. Level 2: Technologies
    for tech in report.get("technologies", []):
        tech_name = tech.get('name')
        if not tech_name: continue
        
        tech_id = f"tech_{tech_name}"
        label = f"{tech_name} {tech.get('version', '')}".strip()
        
        G.add_node(
            tech_id, 
            label=label, 
            node_type="Technology", 
            type="default", 
            style={"background": "#9333ea", "color": "white"}
        )
        G.add_edge(root_id, tech_id)

    # 4. Level 3: Vulnerabilities
    for vuln in report.get("vulnerabilities", []):
        title = vuln.get('title', 'Unknown Finding')
        tool = vuln.get('tool', 'unk')
        
        # Create a unique ID for the node
        vuln_id = f"vuln_{tool}_{title[:10].replace(' ', '_')}_{id(vuln)}"
        
        severity = vuln.get('severity', 'info').lower()
        cve = vuln.get('cve') or vuln.get('enrichment', {}).get('cve_id') or "N/A"
        desc = vuln.get('description', 'No description available.')
        remediation = vuln.get('solution') or vuln.get('enrichment', {}).get('remediation') or "Check vendor for security updates."

        bg_color = "#94a3b8"
        if severity == "low": bg_color = "#facc15"
        if severity == "medium": bg_color = "#f97316"
        if severity == "high": bg_color = "#ef4444"
        if severity == "critical": bg_color = "#991b1b"

        # --- KEY UPDATE: Add all metadata here ---
        G.add_node(
            vuln_id, 
            label=title, 
            node_type="Vulnerability",
            severity=severity.title(),
            cve=cve,
            description=desc,
            remediation=remediation,
            tool=tool,
            type="output", 
            style={"background": bg_color, "color": "white"}
        )
        
        # Link logic (Connect vuln to specific port if known, else root)
        v_port = vuln.get('port')
        linked = False
        if v_port:
            try:
                clean_port = str(v_port).split("/")[0]
                port_node_id = f"port_{clean_port}"
                if G.has_node(port_node_id):
                    G.add_edge(port_node_id, vuln_id)
                    linked = True
            except: pass

        if not linked:
            G.add_edge(root_id, vuln_id)

    # --- LAYOUT CALCULATION ---
    pos = nx.spring_layout(G, scale=400, seed=42)
    
    output = {"nodes": [], "edges": []}
    
    for node_id in G.nodes:
        node_attrs = G.nodes[node_id]
        x, y = pos[node_id]
        
        # Pass all attributes into 'data' so frontend can access them (e.g. data.cve)
        data_payload = {k: v for k, v in node_attrs.items() if k not in ['type', 'style']}
        
        output["nodes"].append({
            "id": node_id,
            "data": data_payload,
            "position": { "x": x, "y": y },
            "type": node_attrs.get("type", "default"),
            "style": node_attrs.get("style", {})
        })
        
    for u, v in G.edges:
        output["edges"].append({
            "id": f"e_{u}_{v}",
            "source": u,
            "target": v,
            "animated": True,
            "style": { "stroke": "#b1b1b7" }
        })

    return output

# --- NEW: Playwright Image Generation (Kept as is) ---
def generate_graph_image(job_id: str, output_path: str):
    """
    Generates a PNG by visiting the Frontend's snapshot page.
    Requires 'playwright' installed and 'chromium' browser available in the worker container.
    """
    if not job_id: return None

    try:
        with sync_playwright() as p:
            # Launch browser (headless)
            browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
            page = browser.new_page()
            
            # Using internal docker network alias 'nginx' or 'frontend'
            url = f"http://nginx/graph-snapshot/{job_id}"
            print(f"Snapshotting graph from: {url}")
            
            page.goto(url)
            
            # Wait for nodes to render
            try:
                page.wait_for_selector(".react-flow__node", timeout=10000) 
                time.sleep(3) # Allow layout to stabilize
            except:
                print("Graph nodes did not appear (might be empty graph)")
            
            page.screenshot(path=output_path, full_page=True)
            browser.close()
            
        return output_path
    except Exception as e:
        print(f"Playwright Screenshot Failed: {e}")
        return None

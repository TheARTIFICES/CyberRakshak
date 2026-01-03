#!/usr/bin/env python3
# ============================================================
# NUCLEI RAG BUILDER — ALL TEMPLATES (STANDALONE, GPU-1)
# ============================================================

import os
import sys
import json
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

# ---------------------------
# Dependency bootstrap
# ---------------------------
def ensure(pkg):
    try:
        __import__(pkg)
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", pkg])

for p in [
    "pyyaml",
    "tqdm",
    "sentence_transformers",
    "faiss-cpu",
]:
    ensure(p)

import yaml
import faiss
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# ---------------------------
# Config
# ---------------------------
OUT_DIR = Path("rag_out_nuclei")
OUT_DIR.mkdir(exist_ok=True)

FAISS_OUT = OUT_DIR / "nuclei.index"
META_OUT  = OUT_DIR / "nuclei_metadata.json"

NUCLEI_REPO = "https://github.com/projectdiscovery/nuclei-templates"
EMBED_MODEL = "BAAI/bge-large-en-v1.5"
EMBED_DIM = 1024

# ---------------------------
# Helpers
# ---------------------------
def clone_nuclei_repo(dest: Path):
    if dest.exists():
        return
    subprocess.check_call([
        "git", "clone", "--depth", "1", NUCLEI_REPO, str(dest)
    ])

def extract_requests(tpl):
    reqs = tpl.get("requests", [])
    lines = []
    for r in reqs:
        if "method" in r:
            lines.append(f"{r['method']} {r.get('path', '')}")
    return "\n".join(lines)

def extract_matchers(tpl):
    matchers = tpl.get("matchers", [])
    lines = []
    for m in matchers:
        lines.append(json.dumps(m, ensure_ascii=False))
    return "\n".join(lines)

# ---------------------------
# Main
# ---------------------------
def main():
    print("🚀 Building Nuclei RAG (ALL templates, standalone)")

    # Force GPU-1 visibility (safe even if only one GPU exists)
    os.environ["CUDA_VISIBLE_DEVICES"] = "1"

    print("🔹 Loading embedding model on GPU-1…")
    embedder = SentenceTransformer(EMBED_MODEL, device="cuda")

    index = faiss.IndexFlatIP(EMBED_DIM)
    metadata = []

    with tempfile.TemporaryDirectory() as td:
        repo_path = Path(td) / "nuclei-templates"
        clone_nuclei_repo(repo_path)

        yaml_files = list(repo_path.rglob("*.yaml"))
        print(f"Found {len(yaml_files)} templates")

        for y in tqdm(yaml_files, desc="Processing templates"):
            try:
                tpl = yaml.safe_load(open(y, "r", encoding="utf-8"))
                if not isinstance(tpl, dict):
                    continue

                tpl_id = tpl.get("id", y.stem)
                info = tpl.get("info", {})
                name = info.get("name", tpl_id)
                severity = info.get("severity", "unknown")
                desc = info.get("description", "")

                # -------- VALIDATION --------
                validation_text = f"""TYPE: VALIDATION_TECHNIQUE
SOURCE: nuclei
TEMPLATE: {tpl_id}
SEVERITY: {severity}
PURPOSE: Detect vulnerability or misconfiguration
DESCRIPTION:
{desc}
REQUEST_LOGIC:
{extract_requests(tpl)}
MATCHERS:
{extract_matchers(tpl)}
"""

                vec = embedder.encode(
                    "query: " + validation_text,
                    normalize_embeddings=True
                )
                index.add(vec.reshape(1, -1))
                metadata.append({
                    "id": f"{tpl_id}-validation",
                    "type": "VALIDATION_TECHNIQUE",
                    "template": tpl_id,
                    "severity": severity,
                    "content": desc,
                    "source": "nuclei"
                })

                # -------- BYPASS --------
                bypass_text = f"""TYPE: BYPASS_TECHNIQUES
SOURCE: nuclei
TEMPLATE: {tpl_id}
DESCRIPTION:
Some templates include encoded paths, alternate routes, or
request variants to bypass filtering or normalization.
"""

                vec = embedder.encode(
                    "query: " + bypass_text,
                    normalize_embeddings=True
                )
                index.add(vec.reshape(1, -1))
                metadata.append({
                    "id": f"{tpl_id}-bypass",
                    "type": "BYPASS_TECHNIQUES",
                    "template": tpl_id,
                    "severity": severity,
                    "source": "nuclei"
                })

                # -------- TROUBLESHOOTING --------
                trouble_text = f"""TYPE: TROUBLESHOOTING
SOURCE: nuclei
TEMPLATE: {tpl_id}
FAILURE_MODES:
Template may fail due to version mismatch, missing prerequisites,
authentication requirements, or defensive controls.
"""

                vec = embedder.encode(
                    "query: " + trouble_text,
                    normalize_embeddings=True
                )
                index.add(vec.reshape(1, -1))
                metadata.append({
                    "id": f"{tpl_id}-troubleshooting",
                    "type": "TROUBLESHOOTING",
                    "template": tpl_id,
                    "severity": severity,
                    "source": "nuclei"
                })

            except Exception:
                continue

    faiss.write_index(index, str(FAISS_OUT))
    with open(META_OUT, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("✅ Nuclei RAG build complete")
    print(f"   Vectors  : {index.ntotal}")
    print(f"   Index    : {FAISS_OUT}")
    print(f"   Metadata : {META_OUT}")

if __name__ == "__main__":
    main()

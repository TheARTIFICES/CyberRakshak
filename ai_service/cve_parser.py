#!/usr/bin/env python3
# ============================================================
# CVE RAG BUILDER — cvelistV5 (ALL SEVERITIES, RELEASE-BASED)
# ============================================================

import os
import sys
import json
import zipfile
import shutil
import tempfile
import subprocess
from datetime import datetime
from pathlib import Path

# ---------------------------
# Dependency bootstrap
# ---------------------------
def ensure(pkg):
    try:
        __import__(pkg)
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", pkg])

for p in [
    "requests",
    "tqdm",
    "sentence_transformers",
    "faiss-cpu",
]:
    ensure(p)

import requests
from tqdm import tqdm
import faiss
from sentence_transformers import SentenceTransformer

# ---------------------------
# Config
# ---------------------------
GITHUB_API_RELEASES = "https://api.github.com/repos/CVEProject/cvelistV5/releases/latest"
OUT_DIR = Path("rag_out")
OUT_DIR.mkdir(exist_ok=True)

FAISS_OUT = OUT_DIR / "faiss.index"
META_OUT  = OUT_DIR / "metadata.json"

EMBED_MODEL = "BAAI/bge-large-en-v1.5"
EMBED_DIM = 1024

# ---------------------------
# Helpers
# ---------------------------
def download_latest_release(tmpdir: Path) -> Path:
    r = requests.get(GITHUB_API_RELEASES, timeout=30)
    r.raise_for_status()
    data = r.json()

    zip_url = data["zipball_url"]
    tag = data.get("tag_name", "unknown")

    zip_path = tmpdir / "release.zip"
    with requests.get(zip_url, stream=True, timeout=60) as resp:
        resp.raise_for_status()
        with open(zip_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

    return zip_path, tag

def extract_zip_recursive(zip_path: Path, dest: Path):
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(dest)

    # Handle nested .zip.zip (GitHub oddity)
    nested = list(dest.rglob("*.zip"))
    for nz in nested:
        sub = nz.parent / nz.stem
        with zipfile.ZipFile(nz, "r") as z:
            z.extractall(sub)

def iter_cve_jsons(root: Path):
    for p in root.rglob("*.json"):
        # Heuristic: CVE JSONs have "cveMetadata" or "containers"
        try:
            with open(p, "r", encoding="utf-8") as f:
                j = json.load(f)
            if "cveMetadata" in j or "containers" in j:
                yield p, j
        except Exception:
            continue

def safe_get_description(j):
    # cvelistV5 structure varies slightly
    try:
        descs = j["containers"]["cna"]["descriptions"]
        for d in descs:
            if d.get("lang") == "en":
                return d.get("value", "").strip()
    except Exception:
        pass
    return ""

def safe_get_cwe(j):
    try:
        probs = j["containers"]["cna"]["problemTypes"]
        for p in probs:
            for d in p.get("descriptions", []):
                if d.get("lang") == "en":
                    return d.get("description", "")
    except Exception:
        pass
    return ""

def safe_get_affected(j):
    products = []
    versions = []
    try:
        aff = j["containers"]["cna"]["affected"]
        for a in aff:
            if a.get("product"):
                products.append(a.get("product"))
            for v in a.get("versions", []):
                if v.get("version"):
                    versions.append(v.get("version"))
    except Exception:
        pass
    return list(set(products))[:3], list(set(versions))[:3]

# ---------------------------
# Main
# ---------------------------
def main():
    print("🚀 Building CVE RAG (ALL severities, release-based)")

    with tempfile.TemporaryDirectory() as td:
        td = Path(td)

        # 1) Download latest release
        zip_path, tag = download_latest_release(td)
        print(f"✔ Downloaded cvelistV5 release: {tag}")

        # 2) Extract (handle nested zips)
        extract_root = td / "extracted"
        extract_zip_recursive(zip_path, extract_root)

        # 3) Load embedding model
        print("🔹 Loading embedding model (CPU)…")
        embedder = SentenceTransformer(EMBED_MODEL, device="cuda:0")

        index = faiss.IndexFlatIP(EMBED_DIM)
        metadata = []

        # 4) Iterate CVEs
        cve_count = 0
        for path, j in tqdm(list(iter_cve_jsons(extract_root)), desc="Processing CVEs"):
            cve_id = j.get("cveMetadata", {}).get("cveId")
            if not cve_id:
                continue

            desc = safe_get_description(j)
            if not desc:
                continue

            products, versions = safe_get_affected(j)
            cwe = safe_get_cwe(j)

            # Build embedding text (INTENT-AWARE)
            embed_text = f"""TYPE: CVE_FACTS
CVE: {cve_id}
PRODUCT: {", ".join(products) if products else "Unknown"}
VERSION: {", ".join(versions) if versions else "Unknown"}
WEAKNESS: {cwe if cwe else "Unknown"}
DESCRIPTION:
{desc}
"""

            vec = embedder.encode(
                "query: " + embed_text,
                normalize_embeddings=True
            )

            index.add(vec.reshape(1, -1))

            metadata.append({
                "id": f"{cve_id}-facts",
                "type": "CVE_FACTS",
                "title": f"{cve_id} Facts",
                "cve": [cve_id],
                "product": products,
                "version": versions,
                "weakness": cwe, 
                "content": desc,
                "source": {
                    "dataset": "cvelistV5",
                    "release": tag,
                    "retrieved_at": datetime.utcnow().isoformat() + "Z"
                }
            })

            cve_count += 1

        # 5) Write outputs
        faiss.write_index(index, str(FAISS_OUT))
        with open(META_OUT, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        print("✅ Done")
        print(f"   CVEs indexed : {cve_count}")
        print(f"   FAISS index  : {FAISS_OUT}")
        print(f"   Metadata     : {META_OUT}")

if __name__ == "__main__":
    main()

import os
import re
import json
import subprocess
from tqdm import tqdm
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# ================= CONFIG =================
REPO_URL = "https://github.com/rapid7/metasploit-framework.git"
CLONE_DIR = "metasploit-framework"
OUTPUT_DIR = "rag_metasploit"
EMBED_MODEL_NAME = "BAAI/bge-large-en-v1.5"
BATCH_SIZE = 32
# ==========================================

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------- Clone repo ----------
if not os.path.exists(CLONE_DIR):
    print("📥 Cloning Metasploit Framework...")
    subprocess.run(["git", "clone", "--depth", "1", REPO_URL, CLONE_DIR], check=True)

MODULE_ROOT = os.path.join(CLONE_DIR, "modules", "exploits")

# ---------- Helpers ----------
def extract_field(pattern, text):
    m = re.search(pattern, text, re.MULTILINE)
    return m.group(1).strip() if m else None

def extract_array(pattern, text):
    m = re.search(pattern, text, re.MULTILINE)
    if not m:
        return []
    return [x.strip().strip("'\"") for x in m.group(1).split(",")]

# ---------- Parse modules ----------
documents = []

print("🔍 Parsing Metasploit exploit modules...")

for root, _, files in os.walk(MODULE_ROOT):
    for file in files:
        if not file.endswith(".rb"):
            continue

        path = os.path.join(root, file)

        try:
            data = open(path, "r", errors="ignore").read()
        except:
            continue

        name = extract_field(r"'Name'\s*=>\s*'([^']+)'", data)
        desc = extract_field(r"'Description'\s*=>\s*%q\{([^}]+)\}", data)
        rank = extract_field(r"'Rank'\s*=>\s*(\w+)", data)

        cves = extract_array(r"'CVE'\s*=>\s*\[([^\]]+)\]", data)
        platforms = extract_array(r"'Platform'\s*=>\s*\[([^\]]+)\]", data)

        if not name or not desc:
            continue

        documents.append({
            "source": "metasploit",
            "type": "exploit_module",
            "name": name,
            "path": path.replace(CLONE_DIR + "/", ""),
            "description": desc,
            "platforms": platforms,
            "cves": cves,
            "rank": rank or "unknown",
            "phase": "exploitation"
        })

print(f"✅ Parsed {len(documents)} Metasploit modules")

# ---------- Build embeddings ----------
print("🧠 Loading embedding model...")
model = SentenceTransformer(EMBED_MODEL_NAME, device="cuda")

texts = [
    f"{d['name']}. {d['description']} Platforms: {', '.join(d['platforms'])}. CVEs: {', '.join(d['cves'])}"
    for d in documents
]

embeddings = []

print("🔢 Generating embeddings...")
for i in tqdm(range(0, len(texts), BATCH_SIZE)):
    batch = texts[i:i+BATCH_SIZE]
    emb = model.encode(batch, normalize_embeddings=True)
    embeddings.append(emb)

embeddings = np.vstack(embeddings).astype("float32")

# ---------- FAISS ----------
index = faiss.IndexFlatIP(embeddings.shape[1])
index.add(embeddings)

faiss.write_index(index, os.path.join(OUTPUT_DIR, "faiss.index"))

with open(os.path.join(OUTPUT_DIR, "metadata.json"), "w") as f:
    json.dump(documents, f, indent=2)

print("🎉 Metasploit RAG build complete")
print(f"Vectors: {index.ntotal}")

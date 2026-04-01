import os
import re
import json
import subprocess
from tqdm import tqdm
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# ================= CONFIG =================
REPO_URL = "https://github.com/swisskyrepo/PayloadsAllTheThings.git"
CLONE_DIR = "PayloadsAllTheThings"
OUTPUT_DIR = "rag_payloads"
EMBED_MODEL = "BAAI/bge-large-en-v1.5"
BATCH_SIZE = 16

# Categories to ingest (safe + high value)
TARGET_DIRS = [
    "XSS Injection",
    "Command Injection",
    "SQL Injection",
    "Server Side Template Injection",
    "File Inclusion",
    "Upload Insecure Files",
    "XXE Injection",
    "Insecure Deserialization"
]
# =========================================

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------- Clone repo ----------
if not os.path.exists(CLONE_DIR):
    print("📥 Cloning PayloadsAllTheThings...")
    subprocess.run(["git", "clone", "--depth", "1", REPO_URL, CLONE_DIR], check=True)

# ---------- Helpers ----------
CODE_BLOCK = re.compile(r"```(?:bash|sh|sql|html|js|python)?\n(.*?)```", re.S)

def extract_payloads(md_text):
    payloads = []
    for match in CODE_BLOCK.findall(md_text):
        payload = match.strip()
        # Filter out huge blocks
        if 3 < len(payload) < 300:
            payloads.append(payload)
    return payloads

# ---------- Parse repo ----------
documents = []

print("🔍 Parsing PayloadsAllTheThings...")

for category in TARGET_DIRS:
    category_path = os.path.join(CLONE_DIR, category)
    if not os.path.isdir(category_path):
        continue

    for root, _, files in os.walk(category_path):
        for file in files:
            if not file.endswith(".md"):
                continue

            path = os.path.join(root, file)
            try:
                content = open(path, "r", encoding="utf-8", errors="ignore").read()
            except:
                continue

            payloads = extract_payloads(content)

            for payload in payloads:
                documents.append({
                    "source": "payloadsallthethings",
                    "kind": "payload_pattern",
                    "category": category.lower(),
                    "technique": os.path.basename(file).replace(".md", "").lower(),
                    "description": f"Payload pattern from {category}",
                    "payload": payload,
                    "encoding": "raw",
                    "use_case": category.lower(),
                    "phase": "exploitation",
                    "risk": "medium"
                })

print(f"✅ Extracted {len(documents)} payload patterns")

# ---------- Embedding ----------
print("🧠 Loading embedding model...")
model = SentenceTransformer(EMBED_MODEL, device="cuda")

texts = [
    f"[Payload] {d['category']} {d['technique']}: {d['description']} Payload: {d['payload']}"
    for d in documents
]

embeddings = []

print("🔢 Generating embeddings...")
for i in tqdm(range(0, len(texts), BATCH_SIZE)):
    batch = texts[i:i+BATCH_SIZE]
    emb = model.encode(batch, normalize_embeddings=True)
    embeddings.append(emb)

if not embeddings:
    raise RuntimeError("❌ No payloads embedded — check parsing logic")

embeddings = np.vstack(embeddings).astype("float32")

# ---------- FAISS ----------
index = faiss.IndexFlatIP(embeddings.shape[1])
index.add(embeddings)

faiss.write_index(index, os.path.join(OUTPUT_DIR, "faiss.index"))
with open(os.path.join(OUTPUT_DIR, "metadata.json"), "w") as f:
    json.dump(documents, f, indent=2)

print("🎉 PayloadsAllTheThings RAG build complete")
print(f"Vectors: {index.ntotal}")

import os
import yaml
import json
import subprocess
from tqdm import tqdm
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# ================= CONFIG =================
REPO_URL = "https://github.com/GTFOBins/GTFOBins.github.io.git"
CLONE_DIR = "GTFOBins"
OUTPUT_DIR = "rag_gtfobins"
EMBED_MODEL_NAME = "BAAI/bge-large-en-v1.5"
BATCH_SIZE = 32
# ==========================================

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------- Clone repo ----------
if not os.path.exists(CLONE_DIR):
    print("📥 Cloning GTFOBins...")
    subprocess.run(
        ["git", "clone", "--depth", "1", REPO_URL, CLONE_DIR],
        check=True
    )

BIN_DIR = os.path.join(CLONE_DIR, "_gtfobins")

# ---------- Parse GTFOBins ----------
documents = []

print("🔍 Parsing GTFOBins YAML frontmatter...")

for file in os.listdir(BIN_DIR):
    if not file.endswith(".md"):
        continue

    binary = file.replace(".md", "")
    path = os.path.join(BIN_DIR, file)

    try:
        content = open(path, "r", encoding="utf-8", errors="ignore").read()
    except:
        continue

    # GTFOBins frontmatter is YAML between ---
    if not content.startswith("---"):
        continue

    try:
        yaml_block = content.split("---")[1]
        data = yaml.safe_load(yaml_block)
    except Exception:
        continue

    functions = data.get("functions", {})
    if not isinstance(functions, dict):
        continue

    for context, entries in functions.items():
        for entry in entries:
            desc = entry.get("description", "").strip()
            cmd = entry.get("code", "").strip()

            if not cmd:
                continue

            documents.append({
                "source": "gtfobins",
                "type": "living_off_the_land",
                "binary": binary,
                "context": context,
                "capability": f"{context} command execution",
                "technique": "command execution",
                "description": desc or f"{binary} can be abused via {context}",
                "command": cmd,
                "requires": [context],
                "impact": "privilege escalation" if context in ["sudo", "suid"] else "command execution",
                "phase": "post-exploitation"
            })

print(f"✅ Parsed {len(documents)} GTFOBins entries")

if not documents:
    raise RuntimeError("❌ No GTFOBins entries parsed — parser failure")

# ---------- Build embeddings ----------
print("🧠 Loading embedding model...")
model = SentenceTransformer(EMBED_MODEL_NAME, device="cuda")

texts = [
    f"{d['binary']} {d['context']}. {d['description']} Command: {d['command']}"
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

print("🎉 GTFOBins RAG build complete")
print(f"Vectors: {index.ntotal}")

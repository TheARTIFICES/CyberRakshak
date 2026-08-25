import os
import json
import subprocess
from tqdm import tqdm
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# ================= CONFIG =================
REPO_URL = "https://github.com/carlospolop/PEASS-ng.git"
CLONE_DIR = "PEASS-ng"
OUTPUT_DIR = "rag_linpeas"
EMBED_MODEL = "BAAI/bge-large-en-v1.5"
BATCH_SIZE = 16
# =========================================

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------- Clone repo ----------
if not os.path.exists(CLONE_DIR):
    print("📥 Cloning PEASS-ng...")
    subprocess.run(["git", "clone", "--depth", "1", REPO_URL, CLONE_DIR], check=True)

# ---------- LinPEAS knowledge base ----------
LINPEAS_HINTS = [
    {
        "category": "sudo",
        "check": "Sudo without password",
        "description": "User can execute sudo commands without password, allowing root command execution.",
        "commands": ["sudo -l", "sudo /bin/bash"]
    },
    {
        "category": "suid",
        "check": "SUID binaries",
        "description": "SUID binaries may allow privilege escalation if misconfigured.",
        "commands": ["find / -perm -4000 -type f 2>/dev/null"]
    },
    {
        "category": "cron",
        "check": "Writable cron jobs",
        "description": "Writable cron jobs can be abused to execute commands as root.",
        "commands": ["crontab -l", "ls -la /etc/cron*"]
    },
    {
        "category": "capabilities",
        "check": "Linux capabilities",
        "description": "Capabilities assigned to binaries may allow privilege escalation.",
        "commands": ["getcap -r / 2>/dev/null"]
    },
    {
        "category": "path",
        "check": "PATH hijacking",
        "description": "Writable PATH directories may allow command hijacking.",
        "commands": ["echo $PATH", "ls -ld $(echo $PATH | tr ':' ' ')"]
    },
    {
        "category": "services",
        "check": "Writable systemd services",
        "description": "Writable service files may allow execution as root.",
        "commands": ["systemctl list-unit-files", "ls -la /etc/systemd/system"]
    },
    {
        "category": "files",
        "check": "Writable sensitive files",
        "description": "Writable sensitive files may allow privilege escalation.",
        "commands": ["find /etc -writable 2>/dev/null"]
    }
]

# ---------- Build documents ----------
documents = []

for item in LINPEAS_HINTS:
    documents.append({
        "source": "linpeas",
        "kind": "exploit_hint",
        "category": item["category"],
        "check_name": item["check"],
        "description": item["description"],
        "example_commands": item["commands"],
        "impact": "privilege escalation",
        "phase": "post-exploitation",
        "confidence": "high"
    })

print(f"✅ Prepared {len(documents)} LinPEAS exploit-hint entries")

# ---------- Embedding ----------
print("🧠 Loading embedding model...")
model = SentenceTransformer(EMBED_MODEL, device="cuda")

texts = [
    f"[LinPEAS] {d['check_name']} ({d['category']}): {d['description']} "
    f"Example commands: {' ; '.join(d['example_commands'])}"
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

print("🎉 Unified LinPEAS RAG build complete")
print(f"Vectors: {index.ntotal}")

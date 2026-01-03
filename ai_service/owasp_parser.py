import os
import json
import faiss
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# ==============================
# CONFIG
# ==============================
REPO_URL = "https://github.com/OWASP/CheatSheetSeries.git"
REPO_DIR = "CheatSheetSeries"
OUTPUT_DIR = "owasp_rag"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==============================
# CLONE REPO
# ==============================
if not os.path.exists(REPO_DIR):
    print("🔹 Cloning OWASP Cheat Sheet Series...")
    os.system(f"git clone --depth=1 {REPO_URL}")

# ==============================
# LOAD MODEL (GPU)
# ==============================
print("🔹 Loading embedding model on GPU...")
model = SentenceTransformer(
    "BAAI/bge-large-en-v1.5",
    device="cuda"
)
print("✅ Model ready")

# ==============================
# SELECT CHEAT SHEETS
# ==============================
TARGET_KEYWORDS = [
    "Authentication",
    "Session",
    "File",
    "Upload",
    "Traversal",
    "Injection",
    "SSRF",
    "XSS",
    "Access Control"
]

documents = []

base_path = os.path.join(REPO_DIR, "cheatsheets")

for file in tqdm(os.listdir(base_path)):
    if not file.endswith(".md"):
        continue

    if not any(k.lower() in file.lower() for k in TARGET_KEYWORDS):
        continue

    path = os.path.join(base_path, file)

    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    text = f"""
OWASP Cheat Sheet: {file.replace('.md','')}
Purpose: Secure coding and mitigation guidance.
Content Summary:
{content[:3000]}
"""

    documents.append({
        "source": "owasp_cheatsheet",
        "name": file.replace(".md", ""),
        "file": file,
        "text": text.strip()
    })

print(f"Selected {len(documents)} OWASP cheat sheets")

# ==============================
# EMBED
# ==============================
texts = ["query: " + d["text"] for d in documents]

embeddings = model.encode(
    texts,
    normalize_embeddings=True,
    show_progress_bar=True
)

dim = embeddings.shape[1]
index = faiss.IndexFlatIP(dim)
index.add(embeddings)

faiss.write_index(index, f"{OUTPUT_DIR}/faiss.index")

with open(f"{OUTPUT_DIR}/metadata.json", "w") as f:
    json.dump(documents, f, indent=2)

print("✅ OWASP RAG build complete")
print("Vectors:", index.ntotal)

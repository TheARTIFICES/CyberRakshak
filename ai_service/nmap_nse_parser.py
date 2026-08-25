import os
import json
import faiss
import re
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# ==============================
# CONFIG
# ==============================
NMAP_REPO = "https://github.com/nmap/nmap.git"
NMAP_DIR = "nmap"
SCRIPTS_DIR = f"{NMAP_DIR}/scripts"
OUTPUT_DIR = "nmap_rag"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Embedding model (same one used everywhere else)
model = SentenceTransformer(
    "BAAI/bge-large-en-v1.5",
    device="cpu"
)

# ==============================
# CLONE NMAP
# ==============================
if not os.path.exists(NMAP_DIR):
    os.system(f"git clone --depth=1 {NMAP_REPO}")

# ==============================
# PARSE NSE FILES
# ==============================
def parse_nse(file_path):
    with open(file_path, "r", errors="ignore") as f:
        content = f.read()

    name = os.path.basename(file_path).replace(".nse", "")

    desc = re.search(r"description\s*=\s*\[\[(.*?)\]\]", content, re.S)
    categories = re.search(r"categories\s*=\s*\{(.*?)\}", content, re.S)

    description = desc.group(1).strip() if desc else "No description"
    category = categories.group(1).strip() if categories else "unknown"

    usage = f"nmap --script {name} <target>"

    text = f"""
Nmap NSE Script: {name}
Category: {category}
Description: {description}
Usage: {usage}
"""

    return {
        "script": name,
        "category": category,
        "description": description,
        "usage": usage,
        "text": text.strip()
    }

# ==============================
# BUILD DATASET
# ==============================
documents = []

for file in tqdm(os.listdir(SCRIPTS_DIR)):
    if file.endswith(".nse"):
        try:
            doc = parse_nse(os.path.join(SCRIPTS_DIR, file))
            documents.append(doc)
        except Exception:
            pass

print(f"Parsed {len(documents)} NSE scripts")

# ==============================
# EMBED
# ==============================
texts = ["query: " + d["text"] for d in documents]
embeddings = model.encode(
    texts,
    normalize_embeddings=True,
    show_progress_bar=True
)

# ==============================
# BUILD FAISS
# ==============================
dim = embeddings.shape[1]
index = faiss.IndexFlatIP(dim)
index.add(embeddings)

faiss.write_index(index, f"{OUTPUT_DIR}/faiss.index")

with open(f"{OUTPUT_DIR}/metadata.json", "w") as f:
    json.dump(documents, f, indent=2)

print("✅ Nmap NSE RAG build complete")
print("Vectors:", index.ntotal)

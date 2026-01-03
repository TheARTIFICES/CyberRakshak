# ===============================
# MITRE ATT&CK RAG BUILDER
# ===============================

!pip install -q faiss-gpu sentence-transformers tqdm

import os, json
import faiss
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# -------------------------------
# Clone MITRE CTI
# -------------------------------
!git clone https://github.com/mitre/cti.git

ATTACK_PATH = "cti/enterprise-attack"

# -------------------------------
# Load embedding model (GPU)
# -------------------------------
model = SentenceTransformer(
    "BAAI/bge-large-en-v1.5",
    device="cuda"
)

DIM = 1024
index = faiss.IndexFlatIP(DIM)
metadata = []

# -------------------------------
# Helper: extract STIX objects
# -------------------------------
def load_objects(folder):
    objs = []
    for root, _, files in os.walk(folder):
        for f in files:
            if f.endswith(".json"):
                with open(os.path.join(root, f)) as jf:
                    data = json.load(jf)
                    objs.extend(data.get("objects", []))
    return objs

attack_patterns = load_objects(f"{ATTACK_PATH}/attack-pattern")
tactics = load_objects(f"{ATTACK_PATH}/tactic")

# -------------------------------
# Build tactic lookup
# -------------------------------
tactic_map = {
    t["id"]: t["name"]
    for t in tactics if t.get("type") == "x-mitre-tactic"
}

# -------------------------------
# Build embeddings
# -------------------------------
for ap in tqdm(attack_patterns):
    if ap.get("type") != "attack-pattern":
        continue

    tid = next(
        (r["external_id"] for r in ap.get("external_references", [])
         if "external_id" in r),
        None
    )

    tactics_used = []
    for phase in ap.get("kill_chain_phases", []):
        if phase.get("kill_chain_name") == "mitre-attack":
            tactics_used.append(phase.get("phase_name"))

    text = f"""
Technique ID: {tid}
Name: {ap.get('name')}
Tactic(s): {', '.join(tactics_used)}
Description: {ap.get('description', '')}
Platforms: {', '.join(ap.get('x_mitre_platforms', []))}
Detection: {ap.get('x_mitre_detection', '')}
Mitigations: {', '.join(ap.get('x_mitre_mitigations', []))}
""".strip()

    emb = model.encode(
        "passage: " + text,
        normalize_embeddings=True
    )

    index.add(emb.reshape(1, -1))
    metadata.append({
        "technique_id": tid,
        "name": ap.get("name"),
        "text": text
    })

# -------------------------------
# Save artifacts
# -------------------------------
faiss.write_index(index, "mitre_faiss.index")
with open("mitre_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("✅ MITRE ATT&CK RAG BUILD COMPLETE")
print("Vectors:", index.ntotal)

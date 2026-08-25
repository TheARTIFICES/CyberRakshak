import os
import json
import faiss
from sentence_transformers import SentenceTransformer

# ==============================
# CONFIG
# ==============================
OUTPUT_DIR = "http_headers_rag"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# CPU embedding (small dataset)
model = SentenceTransformer(
    "BAAI/bge-large-en-v1.5",
    device="cpu"
)

# ==============================
# DATASET (CURATED)
# ==============================
headers = [
    {
        "name": "Content-Security-Policy",
        "text": """
HTTP Header: Content-Security-Policy
Purpose: Prevent XSS and data injection attacks.
Common Misconfigurations: unsafe-inline, wildcard sources (*), missing object-src.
Detection: Response headers missing CSP or using weak directives.
Bypass Notes: JSONP endpoints, legacy browsers, misconfigured script-src.
Fix: Define strict script-src and object-src policies.
"""
    },
    {
        "name": "Strict-Transport-Security",
        "text": """
HTTP Header: Strict-Transport-Security
Purpose: Enforce HTTPS and prevent SSL stripping.
Common Misconfigurations: Low max-age, missing includeSubDomains.
Detection: HSTS missing in HTTPS responses.
Bypass Notes: First HTTP visit before HSTS cached.
Fix: Set long max-age and includeSubDomains.
"""
    },
    {
        "name": "X-Frame-Options",
        "text": """
HTTP Header: X-Frame-Options
Purpose: Prevent clickjacking attacks.
Common Misconfigurations: Missing or set to ALLOWALL.
Detection: Header missing or weak.
Bypass Notes: CSP frame-ancestors overrides.
Fix: Set DENY or SAMEORIGIN.
"""
    },
    {
        "name": "X-Content-Type-Options",
        "text": """
HTTP Header: X-Content-Type-Options
Purpose: Prevent MIME sniffing.
Detection: Header missing.
Fix: Set to nosniff.
"""
    },
    {
        "name": "Referrer-Policy",
        "text": """
HTTP Header: Referrer-Policy
Purpose: Control referrer information leakage.
Common Misconfigurations: unsafe-url.
Fix: Use strict-origin-when-cross-origin.
"""
    }
]

# ==============================
# EMBED
# ==============================
texts = ["query: " + h["text"] for h in headers]

embeddings = model.encode(
    texts,
    normalize_embeddings=True
)

dim = embeddings.shape[1]
index = faiss.IndexFlatIP(dim)
index.add(embeddings)

faiss.write_index(index, f"{OUTPUT_DIR}/faiss.index")

with open(f"{OUTPUT_DIR}/metadata.json", "w") as f:
    json.dump(headers, f, indent=2)

print("✅ HTTP Headers RAG complete")
print("Vectors:", index.ntotal)

# ============================================================
# CYBERRAKSHAK GPU AI MODULE
# - Embedding + Generation Service
# - RAG logic lives in backend
# ============================================================

import os
import sys
import gc
import subprocess
import time
import asyncio

# ============================================================
# HARD MEMORY RESET (GPU + CPU)
# ============================================================

print("🧹 Performing full memory cleanup (CPU + GPU)...")

# ───── CPU MEMORY RESET ─────

# Delete known heavy globals defensively
for name in list(globals().keys()):
    if any(k in name.lower() for k in [
        "model", "embed_model", "tokenizer", "pipe", "server"
    ]):
        try:
            del globals()[name]
        except:
            pass

# Force Python garbage collection
gc.collect()

# Attempt to trim malloc arenas (Linux/glibc only, safe no-op otherwise)
try:
    import ctypes
    libc = ctypes.CDLL("libc.so.6")
    libc.malloc_trim(0)
except Exception:
    pass

print("✅ CPU memory cleanup complete")

# ───── GPU MEMORY RESET ─────

try:
    import torch
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            torch.cuda.set_device(i)
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
        print("✅ GPU memory cleanup complete")
    else:
        print("ℹ️ No CUDA device detected")
except Exception as e:
    print("⚠️ GPU cleanup skipped:", e)

print("🧹 Memory reset finished\n")

# ============================================================
# DEPENDENCY ENSURE
# ============================================================

REQUIRED_PACKAGES = [
    "fastapi",
    "uvicorn",
    "nest-asyncio",
    "pyngrok",
    "torch",
    "transformers",
    "accelerate",
    "sentence-transformers",
    "bitsandbytes"  # Required for 4-bit quantization
]

def ensure(pkg):
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        print(f"📦 Installing missing package: {pkg}")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-U", pkg]
        )

for pkg in REQUIRED_PACKAGES:
    ensure(pkg)

# ============================================================
# IMPORTS (SAFE AFTER INSTALL)
# ============================================================

import torch
import nest_asyncio
nest_asyncio.apply()

from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from pyngrok import ngrok
import uvicorn

# ============================================================
# CONFIGURATION
# ============================================================

EMBED_MODEL_NAME = "BAAI/bge-large-en-v1.5"
LLM_MODEL_NAME   = "Qwen/Qwen2.5-14B-instruct"

EMBED_DEVICE = "cpu"   # stable + deterministic
DTYPE = torch.float16  # Required for T4 GPUs

# Minimal system prompt - Backend controls the actual persona via the user message content
# This just ensures the model follows instructions and stops cleanly
SYSTEM_PROMPT = """You are a helpful AI assistant. Follow the instructions provided in the user message precisely. Be concise, stop immediately after answering, and do not repeat yourself."""


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("🔹 Loading embedding model on CPU...")

embed_model = SentenceTransformer(
    EMBED_MODEL_NAME,
    device=EMBED_DEVICE
)

print("✅ Embedding model ready")

def embed_text(text: str):
    """
    MUST match FAISS build settings:
    - prefix with 'query:'
    - normalized embeddings
    - output dim = 1024
    
    NOTE: Backend already adds 'query: ' prefix, so we only add if missing
    to avoid double-prefixing which would break retrieval.
    """
    if not text.startswith("query:"):
        text = "query: " + text
    vec = embed_model.encode(
        text,
        normalize_embeddings=True
    )
    return vec.tolist()

# ============================================================
# LOAD LLM (AUTO GPU SHARDING)
# ============================================================

print("🔹 Loading LLM with 4-bit quantization...")

tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_NAME)

# 4-bit quantization config for T4 GPU (16GB)
quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

model = AutoModelForCausalLM.from_pretrained(
    LLM_MODEL_NAME,
    device_map="auto",
    quantization_config=quant_config,
    low_cpu_mem_usage=True
)

model.eval()

if hasattr(model, "hf_device_map"):
    print("🧠 LLM device map:")
    for k, v in model.hf_device_map.items():
        print(f"  {k} -> GPU {v}")

print("✅ LLM ready (4-bit quantized)")

def generate_text(prompt: str):
    # Wrap raw prompt in chat format for Qwen
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    # Apply chat template
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    # Tokenize and move to model's device (first layer's device for sharded models)
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=4096
    )
    
    # Move inputs to the device of the first model layer
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=2048,
            do_sample=False,
            use_cache=True
        )

    # DEBUG: print lengths
    input_length = inputs["input_ids"].shape[1]
    output_length = output[0].shape[0]
    print(f"DEBUG: Input tokens: {input_length}, Output tokens: {output_length}, New tokens: {output_length - input_length}")
    
    generated_tokens = output[0][input_length:]
    response = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    
    print(f"DEBUG: Response preview: {response[:200]}")

    # Only decode the NEW tokens (exclude input prompt)
    input_length = inputs["input_ids"].shape[1]
    generated_tokens = output[0][input_length:]
    
    return tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True
    )

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI()

@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "CyberRakshak GPU AI Module",
        "embedding_model": EMBED_MODEL_NAME,
        "llm_model": LLM_MODEL_NAME
    }

@app.post("/embed")
async def embed(payload: dict):
    text = payload.get("text", "").strip()
    if not text:
        return {"error": "text is required"}

    embedding = embed_text(text)

    return {
        "embedding": embedding,
        "dim": len(embedding)  # MUST be 1024
    }

@app.post("/generate")
async def generate(payload: dict):
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        return {"error": "prompt is required"}

    response = generate_text(prompt)

    return {
        "response": response
    }

# ============================================================
# NGROK + SERVER START
# ============================================================

def start_server():
    import threading
    
    try:
        from kaggle_secrets import UserSecretsClient
        NGROK_TOKEN = UserSecretsClient().get_secret("NGROK_TOKEN")
    except Exception:
        NGROK_TOKEN = os.getenv("NGROK_TOKEN")

    if not NGROK_TOKEN:
        NGROK_TOKEN = input("Enter ngrok token: ").strip()

    ngrok.set_auth_token(NGROK_TOKEN)

    for t in ngrok.get_tunnels():
        ngrok.disconnect(t.public_url)

    # Start uvicorn in a separate thread FIRST
    def run_server():
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give uvicorn a moment to start
    time.sleep(3)
    
    # Now connect ngrok
    url = ngrok.connect(8000)
    print("\n" + "="*50)
    print("🚀 AI MODULE LIVE AT:")
    print(url.public_url)
    print("="*50)
    print("➡️  Set AI_SERVICE_URL to this value in backend\n")
    
    return url.public_url

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("🚀 Starting CyberRakshak AI Module...")
    public_url = start_server()

    # Keep process alive
    print("✅ Server running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")


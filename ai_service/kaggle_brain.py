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
# CRITICAL: SET BEFORE TORCH IMPORT
# Prevents fragmentation-related OOM during model loading
# ============================================================

os.environ["PYTORCH_ALLOC_CONF"] = "expandable_segments:True"

# ============================================================
# HARD MEMORY RESET (GPU + CPU)
# ============================================================

print("🧹 Performing full memory cleanup (CPU + GPU)...")

# ───── CPU MEMORY RESET ─────

for name in list(globals().keys()):
    if any(k in name.lower() for k in [
        "model", "embed_model", "tokenizer", "pipe", "server"
    ]):
        try:
            del globals()[name]
        except:
            pass

gc.collect()

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
#
# IMPORTANT: transformers is pinned to 4.46.3.
# transformers 5.x rewrote the model loading pipeline
# (convert_and_load_state_dict_in_model) and broke max_memory
# enforcement during bitsandbytes fp16 staging — causing OOM
# on GPU 1 even with a 13GiB cap set. 4.46.3 is the last
# stable 4.x release where max_memory + bnb works correctly.
# ============================================================

print("📦 Pinning transformers to 4.46.3 (5.x breaks max_memory with bitsandbytes)...")
subprocess.check_call([
    sys.executable, "-m", "pip", "install",
    "transformers==4.46.3",
    "--quiet", "--force-reinstall", "--no-deps"
])
print("✅ transformers 4.46.3 installed")

REQUIRED_PACKAGES = [
    "fastapi",
    "uvicorn",
    "nest-asyncio",
    "pyngrok",
    "torch",
    "accelerate",
    "sentence-transformers",
    "bitsandbytes",
    "huggingface_hub"
]

def ensure(pkg):
    try:
        __import__(pkg.split("==")[0].replace("-", "_"))
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
from huggingface_hub import login
import uvicorn

# Confirm the transformers version actually loaded
import transformers
print(f"✅ transformers version: {transformers.__version__}")

# ============================================================
# HUGGING FACE LOGIN
# Required for gated models (e.g. WhiteRabbitNeo-v3-7B)
# Reads HF_TOKEN from Kaggle Secrets → env var fallback
# ============================================================

print("🔐 Logging in to Hugging Face...")

try:
    from kaggle_secrets import UserSecretsClient
    HF_TOKEN = UserSecretsClient().get_secret("HF_TOKEN")
except Exception:
    HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    HF_TOKEN = input("Enter Hugging Face token: ").strip()

login(token=HF_TOKEN)
print("✅ Hugging Face login successful")

# ============================================================
# CONFIGURATION
# ============================================================

EMBED_MODEL_NAME = "BAAI/bge-large-en-v1.5"
LLM_MODEL_NAME   = "WhiteRabbitNeo/WhiteRabbitNeo-v3-7B"

EMBED_DEVICE = "cpu"  # stable + deterministic

# 13GiB per GPU leaves ~3GB headroom for:
#   - CUDA context overhead (~1.5GB)
#   - fp16 staging buffer during bnb quantization
#   - KV cache during inference
# CPU acts as overflow for any layers that don't fit
MAX_MEMORY = {
    0: "13GiB",
    1: "13GiB",
    "cpu": "20GiB"
}

# Minimal system prompt — backend controls the actual persona via user message content
SYSTEM_PROMPT = """You are a helpful AI assistant. Follow the instructions provided in the user message precisely. Be concise, stop immediately after answering, and do not repeat yourself."""


# ============================================================
# SILENCE SPURIOUS LOAD WARNINGS
#
# BGE models emit an "embeddings.position_ids UNEXPECTED" entry
# in the BertModel LOAD REPORT. This is harmless — position_ids
# is a registered buffer in newer BERT but wasn't saved in older
# checkpoints. Suppressing at ERROR level keeps logs clean
# without hiding anything meaningful.
# ============================================================

import logging
logging.getLogger("transformers.modeling_utils").setLevel(logging.ERROR)

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
# LOAD LLM (FP16, BALANCED SHARDING)
# ============================================================

print("🔹 Loading LLM in fp16 precision...")

tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_NAME)

model = AutoModelForCausalLM.from_pretrained(
    LLM_MODEL_NAME,
    device_map="auto",
    max_memory=MAX_MEMORY,
    torch_dtype=torch.float16,
    low_cpu_mem_usage=True
)

model.eval()

if hasattr(model, "hf_device_map"):
    print("🧠 LLM device map:")
    for k, v in model.hf_device_map.items():
        print(f"  {k} -> {v}")

print("✅ LLM ready (fp16)")

# ============================================================
# GENERATION
# ============================================================

# WhiteRabbitNeo-v3-7B does not ship a chat_template in its
# tokenizer, so apply_chat_template() raises ValueError.
# The model uses a plain ### Instruction / ### Response format.
# System prompt is prepended before the instruction block.
def _build_prompt(system: str, user: str) -> str:
    return (
        f"{system}\n\n"
        f"### Instruction:\n{user}\n\n"
        f"### Response:\n"
    )

def generate_text(prompt: str):
    text = _build_prompt(SYSTEM_PROMPT, prompt)

    # Fix pad_token: WRN tokenizer has no pad token set, which causes
    # the "pad_token_id is None" warning and unstable generation.
    # Setting it to eos_token is the standard fix for decoder-only models.
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=4096
    )

    # Move inputs to the device of the first model layer
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Stop tokens: eos + the literal strings that mark a new prompt cycle.
    # Without these the model loops back into ### Instruction: endlessly.
    stop_strings = ["### Instruction:", "### Response:", "<|endoftext|>"]
    stop_ids = []
    for s in stop_strings:
        ids = tokenizer.encode(s, add_special_tokens=False)
        if ids:
            stop_ids.append(ids[0])  # stop on first token of each stop string
    stop_ids = list(set([tokenizer.eos_token_id] + stop_ids))

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=512,       # tightened: 2048 was letting loops run forever
            do_sample=False,
            use_cache=True,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=stop_ids,
            repetition_penalty=1.1,   # mild penalty to break repetitive loops
        )

    input_length  = inputs["input_ids"].shape[1]
    output_length = output[0].shape[0]
    print(f"DEBUG: Input tokens: {input_length}, Output tokens: {output_length}, New tokens: {output_length - input_length}")

    # Decode only the newly generated tokens (excludes the input prompt)
    generated_tokens = output[0][input_length:]
    response = tokenizer.decode(generated_tokens, skip_special_tokens=True)

    print(f"DEBUG: Response preview: {response[:200]}")

    return response

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
        "dim": len(embedding)   # MUST be 1024
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

    def run_server():
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    time.sleep(3)

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

    print("✅ Server running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
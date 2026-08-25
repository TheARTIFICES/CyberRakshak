# ============================================================
# CYBERRAKSHAK GPU AI MODULE
# - Embedding (nomic-embed-text-v1.5) + Generation (WhiteRabbitNeo-v3-7B)
# - Modern Hugging Face / Xet Accelerated Transfer
# - Resilient 4-Bit NF4 Quantization with FP16 Fallback
# - Runtime-Aware Dynamic Memory Budgeting
# - Pre-Flight Validation Tests & FastAPI / ngrok Serving
# ============================================================

import os
import sys
import gc
import shutil
import subprocess
import time
import importlib.metadata

# ============================================================
# STAGE 0: ENVIRONMENT CONFIGURATION BEFORE ANY ML IMPORTS
# - Prevents CUDA fragmentation-related OOM during model loading
# - Disables TensorFlow bindings in transformers/safetensors
# ============================================================

os.environ["PYTORCH_ALLOC_CONF"] = "expandable_segments:True"
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
os.environ["TRANSFORMERS_NO_TF"] = "1"

# Set persistent Hugging Face cache path on Kaggle
HF_CACHE_DIR = "/kaggle/working/huggingface"
os.environ["HF_HOME"] = HF_CACHE_DIR

# ============================================================
# STAGE 1: SAFE MEMORY & STATE RESET
# - Cleans previously allocated model instances without purging
#   the local Hugging Face cache or deleting library modules
# ============================================================

print("=" * 65)
print("🚀 CyberRakshak GPU AI Module — Initializing")
print("=" * 65)
print("🧹 Performing safe memory reset (GPU + CPU)...")

# Safely delete only known instance references
for var_name in ["model", "embed_model", "tokenizer", "pipe", "server", "quant_config"]:
    if var_name in globals():
        try:
            del globals()[var_name]
        except Exception:
            pass

gc.collect()

try:
    import ctypes
    libc = ctypes.CDLL("libc.so.6")
    libc.malloc_trim(0)
except Exception:
    pass

try:
    import torch
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            torch.cuda.set_device(i)
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
        print("✅ GPU memory cleanup complete")
    else:
        print("ℹ️ No active CUDA device found during initial sweep")
except Exception as e:
    print(f"⚠️ GPU memory cleanup skipped: {e}")

print("✅ Safe memory reset complete\n")

# ============================================================
# STAGE 2: MODERNIZE DEPENDENCIES
# - Uses coherent current compatible Hugging Face stack
# - Leverages pip dependency resolver without forced conflicting pins
# ============================================================

print("📦 Resolving and installing compatible AI stack...")
subprocess.check_call([
    sys.executable, "-m", "pip", "install",
    "--upgrade",
    "transformers",
    "huggingface_hub",
    "hf-xet",
    "accelerate",
    "bitsandbytes",
    "sentence-transformers",
    "fastapi",
    "uvicorn",
    "pyngrok",
    "--quiet"
])
print("✅ Package installation resolved successfully")

# ============================================================
# STAGE 3: SAFE IMPORTS AFTER INSTALLATION
# ============================================================

import torch
import asyncio
import logging
logging.getLogger("transformers.modeling_utils").setLevel(logging.ERROR)

from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from huggingface_hub import login, snapshot_download
from pyngrok import ngrok
import uvicorn


# Report exact loaded versions
print("\n📦 Loaded Dependency Versions:")
for pkg in [
    "transformers",
    "huggingface_hub",
    "tokenizers",
    "accelerate",
    "bitsandbytes",
    "hf-xet",
    "sentence-transformers"
]:
    try:
        ver = importlib.metadata.version(pkg)
    except Exception:
        ver = "not installed"
    print(f"  - {pkg:<22}: {ver}")

# ============================================================
# STAGE 4: SYSTEM & HARDWARE DIAGNOSTICS
# ============================================================

print("\n🖥️ System & Hardware Diagnostics:")
print(f"  - Python Version      : {sys.version.split()[0]}")
print(f"  - PyTorch Version     : {torch.__version__}")
print(f"  - CUDA Available      : {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"  - CUDA Version        : {torch.version.cuda}")
    print(f"  - GPU Count           : {torch.cuda.device_count()}")
    for i in range(torch.cuda.device_count()):
        props = torch.cuda.get_device_properties(i)
        vram_gib = props.total_memory / (1024 ** 3)
        print(f"    • GPU {i}: {props.name} ({vram_gib:.2f} GiB VRAM)")
else:
    print("  - CUDA Device         : None (Running on CPU)")

# System RAM Detection
try:
    mem_bytes = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
    total_ram_gb = mem_bytes / (1024 ** 3)
except Exception:
    total_ram_gb = 16.0
print(f"  - System RAM          : {total_ram_gb:.2f} GB")

# Disk Space Diagnostics
try:
    os.makedirs(HF_CACHE_DIR, exist_ok=True)
    disk_usage = shutil.disk_usage(HF_CACHE_DIR)
    free_disk_gb = disk_usage.free / (1024 ** 3)
    total_disk_gb = disk_usage.total / (1024 ** 3)
    print(f"  - Disk Storage        : {free_disk_gb:.2f} GB free / {total_disk_gb:.2f} GB total ({HF_CACHE_DIR})")
except Exception as e:
    print(f"  - Disk Storage        : {HF_CACHE_DIR} (Status unavailable: {e})")

# ============================================================
# STAGE 5: HUGGING FACE DOWNLOAD ACCELERATION CONFIGURATION
# - Modern Xet backend configuration
# - High-performance mode conditionally enabled based on RAM
# ============================================================

os.environ["HF_XET_NUM_CONCURRENT_RANGE_GETS"] = "32"

if total_ram_gb >= 20.0:
    os.environ["HF_XET_HIGH_PERFORMANCE"] = "1"
    xet_mode_str = f"High-Performance Mode ENABLED (32 concurrent range gets, System RAM: {total_ram_gb:.1f} GB)"
else:
    os.environ["HF_XET_HIGH_PERFORMANCE"] = "0"
    xet_mode_str = f"Standard Controlled Concurrency (32 concurrent range gets, RAM Budget: {total_ram_gb:.1f} GB)"

print(f"\n🚀 Hugging Face / Xet Configuration:")
print(f"  - Backend             : Modern Xet Storage Engine")
print(f"  - HF_HOME             : {os.environ.get('HF_HOME')}")
print(f"  - Concurrency         : {os.environ.get('HF_XET_NUM_CONCURRENT_RANGE_GETS')} range gets")
print(f"  - Performance Mode    : {xet_mode_str}")

# ============================================================
# STAGE 6: HUGGING FACE AUTHENTICATION
# ============================================================

print("\n🔐 Authenticating with Hugging Face...")
HF_TOKEN = None

try:
    from kaggle_secrets import UserSecretsClient
    HF_TOKEN = UserSecretsClient().get_secret("HF_TOKEN")
except Exception:
    HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    try:
        HF_TOKEN = input("Enter Hugging Face token: ").strip()
    except Exception:
        pass

if HF_TOKEN:
    login(token=HF_TOKEN)
    print("✅ Hugging Face authentication successful")
else:
    print("⚠️ No Hugging Face token provided. Gated repository downloads may fail.")

# ============================================================
# STAGE 7: MODEL CONSTANTS & EXPLICIT SNAPSHOT DOWNLOAD
# ============================================================

EMBED_MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
LLM_MODEL_NAME   = "WhiteRabbitNeo/WhiteRabbitNeo-v3-7B"
EMBED_DEVICE     = "cpu"

def get_directory_size_gb(directory_path: str) -> float:
    """Calculates total size in GB for a directory, resolving symlinks safely."""
    total_bytes = 0
    visited_inodes = set()
    for root, _, files in os.walk(directory_path):
        for f in files:
            fp = os.path.join(root, f)
            real_fp = os.path.realpath(fp)
            if os.path.exists(real_fp):
                try:
                    stat_info = os.stat(real_fp)
                    inode_key = (stat_info.st_dev, stat_info.st_ino)
                    if inode_key not in visited_inodes:
                        visited_inodes.add(inode_key)
                        total_bytes += stat_info.st_size
                except Exception:
                    total_bytes += os.path.getsize(real_fp)
    return total_bytes / (1024 ** 3)

print(f"\n📥 Preparing repository snapshot: {LLM_MODEL_NAME}")
model_path = None

# Check if model snapshot is already complete in local cache
try:
    model_path = snapshot_download(
        repo_id=LLM_MODEL_NAME,
        token=HF_TOKEN,
        local_files_only=True
    )
    print(f"✅ {LLM_MODEL_NAME} already cached; skipping download")
except Exception:
    print(f"🚀 Downloading {LLM_MODEL_NAME} via accelerated Xet backend...")
    start_time = time.time()
    start_str = time.strftime("%H:%M:%S", time.localtime(start_time))
    print(f"  - Download started   : {start_str}")
    
    model_path = snapshot_download(
        repo_id=LLM_MODEL_NAME,
        token=HF_TOKEN,
        resume_download=True,
    )
    
    end_time = time.time()
    end_str = time.strftime("%H:%M:%S", time.localtime(end_time))
    duration_min = (end_time - start_time) / 60.0
    print(f"  - Download completed : {end_str}")
    print(f"  - Download duration  : {duration_min:.2f} minutes")

dir_size_gb = get_directory_size_gb(model_path)
print(f"  - Repository Name    : {LLM_MODEL_NAME}")
print(f"  - Local Model Path   : {model_path}")
print(f"  - Model Cache Size   : {dir_size_gb:.2f} GB")
print(f"✅ Snapshot preparation complete")

# ============================================================
# STAGE 8: LOAD EMBEDDING MODEL
# ============================================================

print(f"\n🔹 Loading embedding model ({EMBED_MODEL_NAME}) on {EMBED_DEVICE}...")

embed_model = SentenceTransformer(
    EMBED_MODEL_NAME,
    device=EMBED_DEVICE,
    trust_remote_code=True
)

print("✅ Embedding model loaded successfully")

def embed_text(text: str):
    """
    Encodes text into a normalized 768-dimensional embedding.
    Ensures 'search_query: ' prefix is present without double-prefixing.
    """
    if not text.startswith("search_query:"):
        text = "search_query: " + text
    vec = embed_model.encode(
        text,
        normalize_embeddings=True
    )
    return vec.tolist()

# ============================================================
# STAGE 9: DYNAMIC MULTI-GPU MEMORY BUDGETING
# ============================================================

def build_max_memory_map() -> dict:
    if not torch.cuda.is_available():
        return {"cpu": "20GiB"}
    
    gpu_count = torch.cuda.device_count()
    max_memory = {}
    print(f"\n🖥️ Configuring memory map across {gpu_count} GPU(s):")
    for i in range(gpu_count):
        props = torch.cuda.get_device_properties(i)
        vram_gib = props.total_memory / (1024 ** 3)
        if gpu_count == 2:
            # Standard Kaggle 2xT4 (15.9GB each) allocation: 13GiB budget per GPU
            budget = "13GiB"
        else:
            # Single GPU / alternative setup: reserve ~2.5GB for CUDA context & KV cache
            budget_gb = max(1, int(vram_gib - 2.5))
            budget = f"{budget_gb}GiB"
        max_memory[i] = budget
        print(f"  - GPU {i} ({props.name}, {vram_gib:.2f} GiB total) -> Allocated Budget: {budget}")
        
    max_memory["cpu"] = "20GiB"
    return max_memory

MAX_MEMORY = build_max_memory_map()

# ============================================================
# STAGE 10: MODEL LOADING (4-BIT NF4 WITH FP16 FALLBACK)
# ============================================================

print(f"\n🔹 Loading tokenizer from local snapshot...")
tokenizer = AutoTokenizer.from_pretrained(model_path)
if tokenizer.pad_token_id is None:
    tokenizer.pad_token_id = tokenizer.eos_token_id

model = None
load_mode = "unknown"

# Attempt 4-bit NF4 Quantization if CUDA is available
if torch.cuda.is_available():
    try:
        print("🔹 Attempting to load LLM with 4-bit NF4 quantization...")
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            device_map="auto",
            max_memory=MAX_MEMORY,
            quantization_config=quant_config,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
        )
        load_mode = "4-bit NF4"
        print("✅ LLM loaded successfully (4-bit NF4)")
    except Exception as e:
        print(f"⚠️ 4-bit NF4 loading unsupported or failed ({e}).")
        print("🔄 Falling back to FP16 precision...")
        if "model" in globals():
            del model
        gc.collect()
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()

# Fallback to FP16 loading
if model is None:
    print("🔹 Loading LLM in FP16 precision...")
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        device_map="auto",
        max_memory=MAX_MEMORY,
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True,
    )
    load_mode = "FP16 fallback"
    print("✅ LLM loaded successfully (FP16 fallback)")

model.eval()

# Post-load diagnostics
print("\n🧠 Model Load Diagnostics:")
print(f"  - Model Load Status   : Success")
print(f"  - Active Precision    : {load_mode}")
try:
    param_dtype = next(model.parameters()).dtype
    print(f"  - Parameter Dtype     : {param_dtype}")
except Exception:
    pass

if hasattr(model, "hf_device_map"):
    print("  - Device Map Layout   :")
    for k, v in model.hf_device_map.items():
        print(f"    • {k:<25} -> {v}")

if torch.cuda.is_available():
    print("  - GPU Memory Usage    :")
    for i in range(torch.cuda.device_count()):
        alloc_mb = torch.cuda.memory_allocated(i) / (1024 ** 2)
        res_mb = torch.cuda.memory_reserved(i) / (1024 ** 2)
        print(f"    • GPU {i}: {alloc_mb:.1f} MB allocated / {res_mb:.1f} MB reserved")

# ============================================================
# STAGE 11: TEXT GENERATION LOGIC
# ============================================================

SYSTEM_PROMPT = """You are a helpful AI assistant. Follow the instructions provided in the user message precisely. Be concise, stop immediately after answering, and do not repeat yourself."""

def _build_prompt(system: str, user: str) -> str:
    return (
        f"{system}\n\n"
        f"### Instruction:\n{user}\n\n"
        f"### Response:\n"
    )

def generate_text(prompt: str) -> str:
    text = _build_prompt(SYSTEM_PROMPT, prompt)

    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=4096
    )

    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Stop tokens: EOS and delimiter markers to prevent loop back into prompts
    stop_strings = ["### Instruction:", "### Response:", "<|endoftext|>", "<|im_end|>"]
    stop_ids = []
    for s in stop_strings:
        ids = tokenizer.encode(s, add_special_tokens=False)
        if ids:
            stop_ids.append(ids[0])
    stop_ids = list(set([tokenizer.eos_token_id] + [sid for sid in stop_ids if sid is not None]))

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=512,
            do_sample=False,
            use_cache=True,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=stop_ids,
            repetition_penalty=1.1,
        )

    input_length = inputs["input_ids"].shape[1]
    generated_tokens = output[0][input_length:]
    response = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

    return response

# ============================================================
# STAGE 12: PRE-FLIGHT VALIDATION TESTS
# ============================================================

print("\n🧪 Running Pre-Flight Validation Tests...")

# 1. Embedding Test
try:
    print("🔹 Testing embedding inference...")
    sample_emb = embed_text("test cybersecurity query")
    if len(sample_emb) != 768:
        raise ValueError(f"Expected 768 dimensions, received {len(sample_emb)}")
    print(f"✅ Embedding test passed (dim={len(sample_emb)})")
except Exception as e:
    print(f"❌ Embedding test FAILED: {e}")
    sys.exit(1)

# 2. Generation Test
try:
    print("🔹 Testing WhiteRabbitNeo generation inference...")
    test_query = "Explain what phishing is in one sentence."
    sample_output = generate_text(test_query)
    if not sample_output:
        raise ValueError("Inference returned empty text")
    print(f"  - Sample Prompt       : {test_query}")
    print(f"  - Sample Response     : {sample_output[:120]}...")
    print("✅ WhiteRabbitNeo inference test passed")
except Exception as e:
    print(f"❌ WhiteRabbitNeo generation FAILED: {e}")
    sys.exit(1)

print("✅ All pre-flight tests passed successfully!\n")

# ============================================================
# STAGE 13: FASTAPI APPLICATION
# ============================================================

app = FastAPI(title="CyberRakshak GPU AI Module")

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
        "dim": len(embedding)
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
# STAGE 14: NGROK TUNNEL & SERVER LIFECYCLE
# ============================================================

def start_server():
    import threading
    import urllib.request
    import urllib.error

    try:
        from kaggle_secrets import UserSecretsClient
        NGROK_TOKEN = UserSecretsClient().get_secret("NGROK_TOKEN")
    except Exception:
        NGROK_TOKEN = os.getenv("NGROK_TOKEN")

    if not NGROK_TOKEN:
        try:
            NGROK_TOKEN = input("Enter ngrok token: ").strip()
        except Exception:
            pass

    if NGROK_TOKEN:
        ngrok.set_auth_token(NGROK_TOKEN)

    # Disconnect existing tunnels
    try:
        for t in ngrok.get_tunnels():
            ngrok.disconnect(t.public_url)
    except Exception:
        pass

    def run_server():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            config = uvicorn.Config(
                app=app,
                host="0.0.0.0",
                port=8000,
                log_level="info"
            )
            server = uvicorn.Server(config)
            loop.run_until_complete(server.serve())
        except Exception as e:
            print(f"❌ Server thread error: {e}")

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Verify local server is actively accepting requests on 127.0.0.1:8000
    print("⏳ Waiting for local FastAPI server to bind to 127.0.0.1:8000...")
    local_ready = False
    for attempt in range(20):
        time.sleep(0.5)
        try:
            req = urllib.request.Request("http://127.0.0.1:8000/")
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status == 200:
                    local_ready = True
                    break
        except Exception:
            continue

    if not local_ready:
        print("❌ Error: Local FastAPI server failed to start on 127.0.0.1:8000")
    else:
        print("✅ Local FastAPI server verified active on 127.0.0.1:8000")

    public_url = "http://localhost:8000"
    if NGROK_TOKEN and local_ready:
        try:
            # IMPORTANT: Bind explicitly to 127.0.0.1:8000 to prevent ngrok from
            # resolving to IPv6 [::1]:8000 (which causes ERR_NGROK_8012 connection refused on Kaggle)
            tunnel = ngrok.connect(addr="127.0.0.1:8000", proto="http")
            public_url = tunnel.public_url

            # Verify public ngrok tunnel
            req = urllib.request.Request(
                f"{public_url.rstrip('/')}/",
                headers={"ngrok-skip-browser-warning": "true"}
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status == 200:
                        print("✅ End-to-end public ngrok tunnel verified successfully")
            except Exception as pe:
                print(f"⚠️ Public tunnel probe warning: {pe}")

        except Exception as e:
            print(f"⚠️ Ngrok tunnel creation failed: {e}")

    print("\n" + "=" * 60)
    print("🌐 CyberRakshak AI Module Live")
    print(f"🚀 Public URL: {public_url}")
    print("=" * 60)
    print("➡️  Set AI_SERVICE_URL to this value in backend environment\n")

    return public_url

# ============================================================
# MAIN ENTRYPOINT
# ============================================================

if __name__ == "__main__":
    public_url = start_server()
    print("✅ Server active and serving requests. Keep this notebook cell running!")
    print("⚠️ (Stopping or interrupting this cell will terminate the AI module)")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down CyberRakshak AI Module...")
# ==========================================
# CYBERRAKSHAK AI BRAIN (GOOGLE COLAB SCRIPT)
# ==========================================
# Instructions:
# 1. Open Google Colab (https://colab.research.google.com)
# 2. Upload this script or copy-paste the content below.
# 3. Add your NGROK_TOKEN to the Colab Secrets (Key icon on left sidebar).
# 4. Run the cell to start the AI API.
# ==========================================

# ============================================================
# OFFENSIVE PENTEST COPILOT AI — FINAL MVP MODULE
# ============================================================

# 1. Install / Update dependencies
!pip install -q -U transformers bitsandbytes accelerate fastapi uvicorn pyngrok nest-asyncio

import torch
import gc
import json
import os
import uuid
import nest_asyncio

from fastapi import FastAPI
import uvicorn
from pyngrok import ngrok
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    pipeline,
    BitsAndBytesConfig
)

# ============================================================
# SECURE NGROK TOKEN HANDLING
# ============================================================
NGROK_TOKEN = None

try:
    from google.colab import userdata
    secret = userdata.get("NGROK_TOKEN")
    if isinstance(secret, dict):
        NGROK_TOKEN = secret.get("NGROK_TOKEN")
    else:
        NGROK_TOKEN = secret
except Exception:
    NGROK_TOKEN = os.getenv("NGROK_TOKEN")

if not NGROK_TOKEN:
    NGROK_TOKEN = input("Enter Ngrok Authtoken: ").strip()

# ============================================================
# GPU MEMORY CLEANUP
# ============================================================
for obj in ["model", "tokenizer", "pipe"]:
    if obj in locals():
        del locals()[obj]

gc.collect()
with torch.no_grad():
    torch.cuda.empty_cache()

print("✅ GPU memory cleared")

# ============================================================
# MODEL CONFIGURATION (QWEN 7B — 4BIT NF4)
# ============================================================
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    device_map="auto",
    quantization_config=quant_config
)

pipe = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer
)

print("✅ Model loaded")

# ============================================================
# ENFORCEMENT HELPERS
# ============================================================
def should_force_command_mode(context, access_level):
    evidence = context.get("evidence_state", {})
    return (
        not evidence.get("initial_access_confirmed", False)
        or access_level == "none"
    )

def normalize_confidence(value):
    return value if value in ["Low", "Medium", "High"] else "Low"

def sanitize_vulnerabilities(vulns):
    clean = []
    for v in vulns:
        if not isinstance(v, dict):
            continue
        if not v.get("name") or not v.get("command_or_code"):
            continue
        v["confidence"] = normalize_confidence(v.get("confidence"))
        clean.append(v)
    return clean

def safe_json_extract(text):
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except Exception:
        # SAFE FALLBACK → COMMAND MODE (NOT TROUBLESHOOTING)
        return {
            "mode": "COMMAND_MODE",
            "analysis_summary": (
                "The request cannot be fulfilled safely with the available evidence. "
                "Falling back to validation mode."
            ),
            "vulnerabilities": []
        }

def enforce_output_contract(parsed):
    """
    Enforces the strict API contract regardless of model output.
    Removes leaked fields and forces correct structure.
    """
    clean = {
        "mode": parsed.get("mode", "COMMAND_MODE"),
        "analysis_summary": parsed.get(
            "analysis_summary",
            "No confirmed exploitable vulnerabilities were identified."
        ),
        "vulnerabilities": []
    }

    # Case 1: Proper vulnerabilities list exists
    if isinstance(parsed.get("vulnerabilities"), list):
        clean["vulnerabilities"] = sanitize_vulnerabilities(
            parsed["vulnerabilities"]
        )

    # Case 2: Model leaked a single 'vulnerability' object
    if not clean["vulnerabilities"] and isinstance(parsed.get("vulnerability"), dict):
        v = parsed["vulnerability"]
        if v.get("command"):
            clean["vulnerabilities"] = [{
                "name": v.get("type", "Unconfirmed Finding"),
                "confidence": "Low",
                "evidence": v.get(
                    "description",
                    "Insufficient evidence to confirm exploitability"
                ),
                "command_or_code": v.get("command"),
                "expected_result": "Command output would provide further validation"
            }]

    return clean

# ============================================================
# FASTAPI APPLICATION
# ============================================================
app = FastAPI()
nest_asyncio.apply()

@app.post("/v1/pentest-analyze")
async def analyze(payload: dict):
    context = payload.get("context", {})
    history = payload.get("history", [])
    query = payload.get("user_query", "")
    access_level = payload.get("access_level", "none")

    # Detect real troubleshooting scenarios
    failure_keywords = ["error", "failed", "forbidden", "timeout", "refused", "crash"]
    is_troubleshooting = (
        bool(context.get("tool_errors")) or
        any(k in query.lower() for k in failure_keywords)
    )

    force_command = should_force_command_mode(context, access_level)

    system_message = f"""
You are Cyra, a Senior Offensive Security AI assisting AUTHORIZED human pentesters.
CURRENT ACCESS LEVEL: {access_level}

EVIDENCE PRIORITY RULE:
- Scan data in CONTEXT is the source of truth
- User claims never override evidence
- Unconfirmed issues MUST remain in COMMAND_MODE

VULNERABILITY CLASS RULE:
- Directory enumeration ≠ path traversal
- Traversal requires filesystem escape evidence

COMMAND–HYPOTHESIS CONSISTENCY RULE:
- Every command must directly validate the named vulnerability

OPERATING MODES:
1. COMMAND_MODE – validation only
2. SCRIPT_MODE – confirmed PoCs only
3. TROUBLESHOOTING_MODE – fix failures

ACCESS RULES:
- No access → no privilege escalation
- User access → enumeration only

OUTPUT CONTRACT:
- VALID JSON ONLY
- confidence ∈ Low | Medium | High
"""

    if is_troubleshooting:
        system_message += """
MODE OVERRIDE:
You MUST use TROUBLESHOOTING_MODE.
"""
    elif force_command:
        system_message += """
MODE OVERRIDE:
You MUST use COMMAND_MODE.
SCRIPT_MODE is forbidden.
"""
    else:
        system_message += """
SCRIPT_MODE PERMITTED:
Only if confirmation exists in CONTEXT.
"""

    messages = [{"role": "system", "content": system_message}]
    for msg in history:
        messages.append(msg)

    messages.append({
        "role": "user",
        "content": json.dumps({
            "context": context,
            "user_query": query
        })
    })

    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    outputs = pipe(
        prompt,
        max_new_tokens=1536,
        do_sample=False
    )

    raw = outputs[0]["generated_text"].split("assistant\n")[-1]
    parsed = safe_json_extract(raw)

    # Enforce final schema
    parsed = enforce_output_contract(parsed)

    # Final hard guard
    if parsed["mode"] not in [
        "COMMAND_MODE", "SCRIPT_MODE", "TROUBLESHOOTING_MODE"
    ]:
        parsed["mode"] = "COMMAND_MODE"

    parsed["response_id"] = str(uuid.uuid4())

    return parsed

# ============================================================
# START SERVER + NGROK
# ============================================================
ngrok.set_auth_token(NGROK_TOKEN)

for t in ngrok.get_tunnels():
    ngrok.disconnect(t.public_url)

public_url = ngrok.connect(8000)
print(f"\n🚀 AI MODULE LIVE AT:\n{public_url.public_url}\n")
print("➡️  Use this URL in your frontend / server")

config = uvicorn.Config(app, host="0.0.0.0", port=8000, loop="asyncio")
server = uvicorn.Server(config)
await server.serve()


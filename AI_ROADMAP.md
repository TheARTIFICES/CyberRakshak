# CyberRakshak Vitta — AI Roadmap (CyRa)

Companion to `PRODUCT_ROADMAP.md` §G. This is the detailed breakdown for the AI/RAG/agent surface — CyRa, the platform's conversational advisor.

## Current architecture (verified, not assumed)

```
User message
   -> intent_classifier.py (regex-based: technical / financial_risk / optimization / simulation / compliance)
   -> chat_assistant.py
        -> if financial/optimization/simulation/compliance intent:
              execute_whitelisted_tool(tool_name, **hardcoded_params)   [rag_tools/]
              -> real backend call (risk_tool -> risk/engine.py, optimizer_tool -> risk/optimizer.py, etc.)
              -> tool result JSON injected into prompt context
        -> FAISS retrieval over technical corpus (CVE/NVD, MITRE, exploit DBs, OWASP)
        -> WhiteRabbitNeo-v3-7B (remote Kaggle GPU, via ngrok) narrates the combined context
   -> StreamingResponse (media_type="text/plain" — chunked, not true SSE)
```

This is a real, working retrieval-augmented, tool-calling pipeline — not a mock. The gaps below are specific and bounded, not architectural.

---

## 1. Copilot Roadmap (end-user-facing chat quality)

| Item | Status | Work required | Priority | Effort |
|---|---|---|---|---|
| Grounded technical Q&A (CVE lookup, MITRE mapping, exploit context) | **Complete.** | — | — | — |
| Financial Q&A ("what's our EAL", "what's our compliance score") | **Complete**, tool-calling fires correctly on the right intent. | — | — | — |
| Financial Q&A with a **user-specified number** ("where should I invest ₹1 crore") | **Broken today** — the optimizer tool call is hardcoded to ₹500,000 regardless of what the user asks. | NLU parameter extraction (see §2). | **P0** | M |
| Citation rendering | Retrieval happens; the frontend renders plain Markdown with no distinct citation UI. | Parse `[Source: X]`-style inline citations (already in the prompt instructions) into a linked source list or footnote component. | P1 | S |
| Tool-call transparency | Tool calls happen server-side; nothing in the response payload or UI shows the user *that* a tool was called. | Add a `tool_calls: []` field to the chat response (empty for pure retrieval, populated with `{tool, params, result_summary}` for computed answers); render as a collapsible trace in the frontend. | **P0** | S–M (backend) + S (frontend, tracked in Frontend Roadmap) |
| Response latency / streaming feel | Chat "streams" via chunked replay of an already-complete response, not token-by-token generation. | Lower priority than the above — this is UX polish, not a correctness or grading-criterion issue. Revisit only if time remains after P0/P1 items. | P2 | M |

## 2. Tool-Calling Roadmap

The mechanism is built; what's missing is turning free-text into the right function arguments.

| Item | Status | Work required | Priority | Effort |
|---|---|---|---|---|
| Tool registry + whitelist enforcement (`rag_tools/__init__.py`) | **Complete.** Read-only allowlist correctly gates dispatch. | — | — | — |
| Four tool bindings (`risk_tool`, `optimizer_tool`, `simulation_tool`, `compliance_tool`) | **Complete**, each calls the real backend engine. | — | — | — |
| **Parameter extraction from natural language** | **Missing — this is the single highest-priority AI item on the entire roadmap.** | Given the model already in use (WhiteRabbitNeo-v3-7B) is capable of structured extraction, the pragmatic path is a lightweight two-pass approach: (1) intent classifier fires as today, (2) a small, targeted extraction step — either a regex/heuristic pass for currency figures (₹1 crore, ₹50 lakh, 5000000) and named scenarios/frameworks, or a second short LLM call constrained to return JSON matching the tool's parameter schema. Do not over-engineer this into a general function-calling framework — four tools, four parameter shapes, a bounded extraction task each. | **P0** | M |
| Error handling when a tool call fails | Partial — `chat_assistant.py` catches exceptions per-intent and logs, but doesn't clearly tell the user the number is unavailable vs. wrong. | Add an explicit "I couldn't compute that right now" fallback message distinct from a fabricated-sounding answer. | P1 | S |
| New tool: attack-path financial query | Not built — `risk_tool.py` covers EAL/VaR but not "which attack path is riskiest." | Add a fifth tool wrapping `GET /risk/attack-paths/{job_id}` if time allows; not required for MVP since the data is already reachable via the dashboard. | P2 | S |

## 3. Agent Architecture Roadmap

"Agent" here means: does CyRa ever take more than one tool-calling step, or chain reasoning across turns? Today it does not — each user message triggers at most one tool call per detected intent, in a single pass.

| Item | Status | Work required | Priority | Effort |
|---|---|---|---|---|
| Single-step tool dispatch | **Complete** (this is the current, correct-for-scope architecture). | — | — | — |
| Multi-step reasoning (e.g. "check compliance, then simulate the fix, then tell me the cost") | **Not built.** | **Explicitly out of scope for SIH finals.** This is a genuine agent-loop capability (plan → call → observe → call again) that adds real complexity and failure surface for a demo timeline. Do not build this unless the four P0 items above are done with time to spare. | P3 (deferred) | XL |
| Conversation memory across turns for tool context | Unverified — `history` is passed in `ChatMessageRequest` but unclear whether tool-calling considers prior turns' extracted parameters. | Low priority; a single-turn "what's our EAL" → "now optimize for ₹50L" two-message pattern is a reasonable stretch goal only after §2's extraction work lands. | P2 | M |

## 4. RAG Roadmap

| Item | Status | Work required | Priority | Effort |
|---|---|---|---|---|
| FAISS retrieval over technical corpus | **Complete**, contingent on the index being materialized in the actual demo/deploy environment (unresolved Git-LFS caveat from the prior audit). | **Verify this specifically before finals** — load the app in the environment that will actually be judged and confirm `rag.is_available()` returns true and returns non-trivial results. This is a five-minute check with a potentially demo-ending consequence if skipped. | **P0** | S (verification) |
| Compliance/DPDP corpus content | Unconfirmed whether the RAG corpus includes framework/regulatory text (as distinct from the framework_mapper's control catalogs, which are structured data, not prose). | Not required — compliance questions route to the compliance tool (structured, correct data), not to retrieval. Do not spend time adding compliance prose to the RAG corpus; it would be redundant with the tool-calling path and risks the model answering from stale retrieved text instead of the live scorer. | P3 | — |
| Qdrant durable store | **Still an open decision** (ADR 0001, unresolved). | Do not resolve this before finals unless FAISS retrieval is confirmed broken in the deploy environment — Qdrant adoption is infrastructure work with no direct SIH grading impact. | P3 | — |

## 5. Executive Assistant Roadmap

This is a *framing* of the existing copilot for a CFO/board persona, not a separate system.

| Item | Status | Work required | Priority | Effort |
|---|---|---|---|---|
| Financial Q&A already works for a technical persona | **Complete** (shared with §1). | — | — | — |
| Executive-appropriate response tone/depth | Unverified whether the system prompt differentiates response style by asking user's role. | If time allows, pass the logged-in user's role into the prompt so a `cfo`/`board_viewer` gets a narrative-first answer (lead with the number and recommendation) vs. an `analyst` getting technical detail first. | P2 | S |
| Embedding the copilot in Board Portal | Not built — chat is currently only reachable from `/assistant`. | The sidebar already links to chat from every role; no structural change needed. Confirm the Board Portal page includes a visible "Ask CyRa" entry point once built. | P2 | S |

## 6. Autonomous Risk Analyst Roadmap

The only genuinely **new capability** on this entire roadmap — nothing today proactively analyzes risk without a user or a scan triggering it.

| Item | Status | Work required | Priority | Effort |
|---|---|---|---|---|
| Reactive computation (scan completes → risk recomputed) | **Complete** — this already satisfies "continuous, not point-in-time" for the PS's core requirement. | — | — | — |
| Proactive/scheduled analysis (e.g. a nightly job that checks EAL trend, flags emerging risk drivers, and drafts a recommendation without being asked) | **Not built at all.** | **Explicitly recommended as deferred for SIH finals.** The reactive pipeline already satisfies the "continuous" grading criterion; a scheduled autonomous job adds real infrastructure (a new Celery-beat task, a notification/alerting surface, and a UI to surface its output) for a capability the PS does not explicitly require beyond what forecasting already provides. If pursued post-finals: a Celery-beat job re-running `forecasting.py`'s projection daily, comparing against the prior day, and writing a `Notification` when EAL crosses a threshold — reusing existing infrastructure rather than building new. | **P3 (deferred)** | XL |

---

## Priority summary for AI work specifically

**Must do (P0):** NLU parameter extraction for tool-calling (§2); tool-call trace visibility (§1/§2); RAG index availability verification in the demo environment (§4). **Should do (P1):** citation rendering, tool-failure messaging. **Explicitly deferred (P3):** multi-step agent reasoning, autonomous analyst, Qdrant migration, compliance-corpus RAG expansion.

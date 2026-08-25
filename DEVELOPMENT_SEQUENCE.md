# CyberRakshak Vitta — Development Sequence

The execution order, built directly from `FEATURE_DEPENDENCY_MAP.md`. Phases are sequenced by dependency, not by calendar week — compress or stretch based on actual team size. Where a phase lists multiple streams, they're parallelizable across engineers; where it says "blocks," treat it as a hard gate.

Effort notation carried over from `PRODUCT_ROADMAP.md`: S ≈ 0.5–1 day, M ≈ 1–3 days, L ≈ 3–5 days, XL ≈ 5+ days, per engineer.

---

## Phase 0 — Zero-dependency wins (start immediately, any team size)

Nothing here blocks or is blocked by anything else. If you have four engineers, start all four in parallel on day one.

**Status: frontend/backend engineering complete.** Only the two non-code items remain.

| Task | Effort | Owner stream | Status |
|---|---|---|---|
| Scenario Simulator UI (`ScenarioSimulator.tsx`) | M | Frontend | ✅ Done — live against `GET /simulation/scenarios` + `POST /simulation/run`, all 5 catalog scenarios (commit `d1431ab`) |
| Compliance Center UI (`ComplianceCenter.tsx`) | M | Frontend | ✅ Done — live against `GET /compliance/scores` + `GET /compliance/export` (commit `7207b90`) |
| Investment Action Board UI | M | Frontend | ✅ Done — live against `/investment/optimize`, `/investment/pareto`, and the approve/remediate/outcome lifecycle (commit `7d1e0c8`) |
| `EALTrendChart` component | S | Frontend | ✅ Done — live against `GET /risk/forecast` + `GET /risk/exposure`, integrated into Dashboard (commit `d1431ab`) |
| Begin sourcing a test Azure AD or Okta tenant | — (external lead time) | Anyone — start this today regardless of who does the connector work later, since tenant provisioning can take days | ⏳ Not started — external/ops task, outside engineering scope |
| RAG index availability check in the actual demo environment | S | Backend/DevOps | ⚠️ Checked, found broken — `backend/rag_storage/cve_index.faiss` fails to load (`Index type ... not recognized`); chat assistant runs without retrieval context. Needs a re-export of the index file. |

**Exit criteria:** three of four placeholder screens are live against real data; the fourth (Board Portal) is blocked on Phase 1. **Met** — all three (Scenario Simulator, Compliance Center, Investment Action Board) are live; Board Portal remains correctly blocked on Phase 1's org/BU scope filtering.

**Engineering bonus found and fixed while building the Scenario Simulator:** `calculate_asset_fair_risk()` was missing the `tef_multiplier`/`vuln_multiplier` hooks that the `DELAY_REMEDIATION_30D` and `ACTIVE_RANSOMWARE_CAMPAIGN` scenario templates referenced, so both silently no-op'd (the "cost of delay" scenario was showing a *decrease* in EAL). Fixed in `backend/app/risk/engine.py` + `backend/app/simulation/scenario_engine.py`, verified against the live API and the full pytest suite (commit `d1431ab`).

---

## Phase 1 — Critical-path unblockers (do these before anything downstream)

| Task | Effort | Blocks |
|---|---|---|
| Org/BU scope filtering on `GET /risk/exposure`, `GET /risk/forecast` | M | Board Portal, BU comparison chart |
| Auth default flip (`AUTH_DISABLED=False`) + move `SECRET_KEY` to env-only + rotate | S | Login flow, RBAC, any judge-facing deployment |
| NLU parameter extraction for tool-calling (§`AI_ROADMAP.md` §2) | M | Correct copilot financial answers, tool-call trace UI's usefulness |

**Sequencing note:** these three are independent of *each other* — assign to three different engineers if available, or do them in this listed order if solo, since scope-filtering unblocks the largest single downstream item (Board Portal).

**Exit criteria:** `/risk/exposure?scope=bu&scope_id=X` returns correctly filtered data; the API rejects unauthenticated requests; asking the copilot "optimize for ₹75 lakh" produces a result computed against ₹75L, not the old hardcoded ₹5L.

---

## Phase 2 — Board Portal and AI trust surface

Now unblocked by Phase 1.

| Task | Effort | Depends on |
|---|---|---|
| Board Portal UI (`BoardPortal.tsx`) | L | Phase 1 scope filtering |
| Tool-call trace UI (backend: add `tool_calls` field to chat response; frontend: collapsible panel) | S–M | Phase 1 NLU extraction (the trace is much more meaningful once it reflects real extracted parameters) |
| Minimal login flow + route guards | M | Phase 1 auth fix |
| Live connector trigger against the test IAM tenant sourced in Phase 0 | S (if tenant ready) | Phase 0 tenant sourcing |

**Exit criteria:** a judge can open Board Portal and see a real, org/BU-scoped EAL trend; the copilot's chat UI visibly shows what it called and computed; a login screen exists; at least one real connector sync has been run against a live IAM tenant at least once (does not need to be repeatable live in the demo — a screenshot/log of it having worked is acceptable evidence, per the PS's own "prove the architecture accepts these sources" framing).

---

## Phase 3 — Money-first polish and remaining visualizations

| Task | Effort | Depends on |
|---|---|---|
| Dashboard reframe (EAL/VaR as headline, severity counts demoted) | S–M | `EALTrendChart` (Phase 0) |
| Attack Path financial exposure overlay | M | none blocking (backend already live) — sequenced here purely for team bandwidth, can move earlier if capacity allows |
| `ComplianceRadar` component wired into Compliance Center | S | Compliance Center UI (Phase 0) |
| Connector management UI (list/connect/sync in Settings) | M | Phase 2 connector trigger proven working |
| RBAC enforcement on mutation endpoints | M | Phase 2 login flow |

**Exit criteria:** every screen a judge might click leads with a rupee figure, not a severity label or a raw count — this is the literal, named grading criterion, and by the end of this phase it's true everywhere, not just on the one chart that shipped early.

---

## Phase 4 — Hardening pass (do this before finals, not during)

Not new features — verification and cleanup of everything above.

- Full click-through of every page as each of the seven target roles (or as many as got built in Phase 2/3) to catch broken states.
- Confirm the RAG index, the Kaggle GPU tunnel, and the demo environment's database are all in a known-good state — rehearse the actual demo script end-to-end at least once on the real deploy target, not localhost.
- Confirm the closed-loop demo moment (start a scan → watch EAL update on Dashboard/Board Portal) works live, since it's the single strongest piece of evidence in the whole submission.
- Spot-check that no screen still shows a hardcoded/sample fallback value in a way that could be mistaken for live data (e.g. `/risk/exposure`'s current hardcoded baseline when no `RiskSnapshot` exists yet — confirm the demo org has real scan history before finals so this path is never hit live).

---

## Deferred entirely — do not schedule unless Phases 0–4 finish early

Multi-step agent reasoning, autonomous risk analyst, SIEM/EDR/CSPM connectors beyond mocks, `VaRDistribution` histogram (pending a scope-check on data availability), board/executive PDF report variants, true SSE streaming, Qdrant migration, org/BU-scoped audit trail, mobile responsiveness. If time genuinely remains after Phase 4's hardening pass, pull from this list in the order given — it's already roughly priority-ordered from `MVP_CHECKLIST.md`'s P2/P3 sections.

---

## One-page summary for stand-ups

**Phase 0 (parallel, start now):** 3 placeholder screens + EAL chart + tenant sourcing. ✅ Engineering done — tenant sourcing and RAG index re-export are the only open items, both non-code.
**Phase 1 (critical path, do first regardless of team size):** scope filtering, auth fix, NLU extraction.
**Phase 2 (now unblocked):** Board Portal, tool-call trace, login, live connector proof.
**Phase 3 (polish):** dashboard reframe, attack-path overlay, compliance radar, connector UI, RBAC.
**Phase 4 (before finals, not during):** full rehearsal and hardening — no new features.

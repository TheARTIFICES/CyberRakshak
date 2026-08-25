# CyberRakshak Vitta — Product Roadmap

**Role:** Master feature catalog for SIH26105 (*AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform*), assessed against the current `tanishaq` branch state.
**Not a re-audit.** This document takes the repository as given — the FAIR engine, compliance mapper, connectors, simulation engine, tool-calling layer, and frontend foundations described as "already in place" are treated as the starting point, not re-verified from zero.

## How to read this document

Every feature below carries the same seven fields: **Status** (what exists today, verified against the running code, not a spec), **Missing Work** (the literal gap between today and demo-ready), **Priority** (P0 = blocks SIH finals, P1 = strongly reinforces the grading criteria, P2 = valuable polish, P3 = explicitly defer), **Dependencies**, **Effort** (S ≈ 0.5–1 day, M ≈ 1–3 days, L ≈ 3–5 days, XL ≈ 5+ days, for one engineer), **SIH Impact** (which grading-logic criterion it satisfies — see CR_V1.0.pdf §2), **Demo Impact** (how much it changes what a judge sees live).

Companion documents: `FRONTEND_ROADMAP.md` (page/viz-level detail), `AI_ROADMAP.md` (copilot/agent detail), `MVP_CHECKLIST.md` (the filtered must-ship list), `FEATURE_DEPENDENCY_MAP.md`, `DEVELOPMENT_SEQUENCE.md`.

---

## A. FAIR Financial Risk Quantification (EAL / VaR / SLE / LEF)

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Core EAL/SLE/LEF computation (`risk/impact.py`, `risk/likelihood.py`, `risk/engine.py`) | **Complete.** Real, working formulas; statutory DPDP/SEBI/RBI/CERT-In penalty tables folded into SLE. | Nothing functional. Consider separating regulatory penalty from general SLE as its own `RiskSnapshot` line item per the original design note (currently blended in `impact.py`) for auditability. | P2 | — | S | Monetary output (grading criterion 1) | Medium — judges see the number, not the mechanism |
| Monte Carlo uncertainty (`risk/uncertainty.py`) | **Complete.** Produces `eal_low_inr`, `eal_high_inr`, `var_95_inr` on every snapshot. | Nothing functional. | P2 | — | — | Monetary output | Low — invisible unless surfaced in UI (see VaR chart, §Frontend) |
| Closed-loop trigger (scan completion → `calculate_asset_fair_risk` → persisted `RiskSnapshot`/`RiskDriver`/`RiskModelRun`) | **Complete.** Verified in `worker/tasks.py`: every finished scan writes a real, hashed snapshot. | Nothing functional. This is the single strongest asset in the whole submission — the demo's "how do I know this number is real" answer already works end-to-end. | P0 | — | — | Continuous, not point-in-time (grading criterion 2) | **Critical** — this is the live-number-changing demo moment |
| Org/BU-scoped exposure (`GET /risk/exposure`) | **Partial.** Endpoint returns one global snapshot with a hardcoded fallback (`₹34.5L`) when no scan has run yet; not filterable by `org_id`/`bu_id`. | Add `scope`/`scope_id` query params; filter `RiskSnapshot` by the owning asset's `bu_id`; remove the hardcoded fallback in favor of an honest empty state. | **P0** | Asset↔BusinessUnit linkage already in schema | M | Monetary output at org/BU level (explicit PS requirement) | High — blocks Board Portal entirely |
| Risk forecasting (`risk/forecasting.py`, `GET /risk/forecast`) | **Complete (backend).** Real 30/60/90-day projection with a maturation growth-rate model and cost-of-delay. | Nothing functional. Needs a frontend trend chart (see Frontend Roadmap). | P1 | — | — | Continuous risk (criterion 2) | High once charted — "cost of waiting" is a strong exec talking point |
| Enterprise Risk Score (`risk/score.py`) | **Complete.** 0–100 normalized score. | Confirm it's positioned as *secondary* to EAL/VaR in the UI, not the headline (see Dashboard reframe). | P1 | — | — | Supports criterion 1 if not allowed to dominate it | Medium |

## B. Attack Path Analysis

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Multi-hop chained exposure (`risk/attack_path.py`, `P(Path) = Π P(Hop_k)`, `GET /risk/attack-paths/{job_id}`) | **Complete (backend).** Real joint-probability and financial exposure computation over chained compromise paths. | Nothing functional. | P1 | Attack graph (existing, `graph.py`) | — | Differentiator — few competing teams will have this | Medium |
| Frontend financial overlay on `AttackPath.tsx` | **Missing.** Existing page renders the technical React-Flow graph only; no ₹ exposure per path/node. | Call `/risk/attack-paths/{job_id}`; color/label nodes or paths by financial exposure, not just severity. | P1 | Above | M | Monetary output (criterion 1) applied to the platform's own differentiator | **High** — turns an existing "cool graph" into a financial argument |

## C. Investment Optimization

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| MILP budget optimizer (`risk/optimizer.py`, `POST /investment/optimize`) | **Complete.** Real PuLP 0-1 ILP with budget/dependency/mandate constraints. | Nothing functional. | P0 | — | — | Budget-constrained optimization (criterion 4) | High |
| Pareto/spend-curve frontier (`generate_spend_curve`, `GET /investment/pareto`) + **`SpendCurveChart.tsx`** | **Complete, just shipped.** Real MILP sweep, wired end-to-end to a production chart on the Dashboard with knee-point marking, budget presets, loading/error states. | Nothing functional for the chart itself. Consider moving it to a dedicated Investment Optimizer page (see Frontend Roadmap) rather than leaving it as a Dashboard subsection only. | P0 | Optimizer | — | Diminishing-returns curve (criterion 4, named explicitly in the PS) | **Critical** — this is the PS's most literal, most-checked visual requirement, and it's done |
| Ranked recommendation / Action Board UI | **Missing.** Backend has `POST /investment/actions/{id}/approve`, `/remediate`, `GET /investment/actions/{id}/outcome` — a full proposed→approved→implemented→verified lifecycle — but no frontend screen lists candidates or exposes these actions. | Build a table view: ranked `MitigationAction` candidates (cost, reduction, ROSI) with approve/reject buttons calling the existing endpoints. | **P0** | Optimizer, MitigationAction data (auto-generated per scan) | M | Budget-constrained optimization + closed-loop governance | **High** — without this, judges can't see the recommendation-to-action workflow that's the PS's core ask |
| Closed-loop verification (estimated vs. measured reduction) | **Backend scaffolded via `/outcome` endpoint**, unverified whether `measured_reduction_inr` is ever populated by a rescan comparison. | Confirm/build the rescan-triggered comparison; surface the delta in the Action Board. | P2 | Action Board UI above | M | "Measurable reduction… through targeted remediation" (PS Expected Outcomes) | Medium |

## D. Compliance & Framework Mapping

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Framework mapper (`compliance/framework_mapper.py`) — ISO 27001, NIST CSF 2.0, CIS v8, RBI CSF, SEBI CSCRF, DPDP 2023 | **Complete (backend).** Real, honestly-scoped control catalogs (4–6 key controls each) across all six named frameworks; RBI/SEBI framed by their actual named requirements, not a flat percentage. | Nothing functional. | P0 | — | — | Framework mapping (criterion 5) | High |
| Compliance scoring/export API (`GET /compliance/scores`, `GET /compliance/export`) | **Complete (backend).** | Confirm export actually produces a downloadable evidence artifact, not just JSON. | P1 | Framework mapper | S | Audit-ready evidence (criterion 5) | Medium |
| **`ComplianceCenter.tsx`** | **Placeholder only.** Routed, styled, zero API calls — confirmed via direct inspection. | Wire to `/compliance/scores`; render the six framework scorecards + gap list + export button. This is a real build, not a stub fix. | **P0** | Scoring API | M | Framework mapping *with UI evidence* (criterion 5 explicitly wants this to be a screen, not a checkbox) | **Critical** — currently the single most visible gap between "backend claims" and "what a judge can click on" |

## E. Board Portal & Business-Unit Risk Management

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Organization/BusinessUnit data model + `/org`, `/bu` CRUD | **Complete.** Real tables, real endpoints. | Nothing functional. | P0 | — | — | Org/BU-level risk (explicit PS ask) | Low alone |
| Org/BU-scoped risk exposure | **Missing** (see item in §A) | Same item as §A — scope filtering on `/risk/exposure`, `/risk/forecast`. | P0 | §A | M | Org/BU-level risk | High |
| **`BoardPortal.tsx`** | **Placeholder only.** Routed, zero API calls. | Build: org→BU rollup table, EAL/VaR trend per BU, cross-BU comparison, read-only (no drill-down to raw findings per the original design intent). | **P0** | Scoped risk exposure above | L | Org/BU-level risk + "trustworthy number for the board, not a vuln count" (Product Identity target user: Board/Audit Committee) | **Critical** — this is the screen that answers "can a non-technical board member use this" |
| Org/BU-scoped audit trail | **Missing.** `AuditLog` exists but has no `org_id`/`bu_id` scoping. | Add scope columns or a join path; filter audit export by BU. | P2 | AuditLog (exists) | S | Governance/traceability | Low |

## F. Scenario Simulation

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Scenario engine + library (`simulation/scenario_engine.py`, `scenario_library.py`, `POST /simulation/run`, `GET /simulation/scenarios`) | **Complete (backend).** Real what-if presets (MFA rollout, patch deployment, segmentation, delayed remediation, new campaign), reusing the same FAIR engine with parameter overrides — by construction, cannot disagree with the live dashboard. | Nothing functional. | P0 | FAIR engine (§A) | — | AI decision support / scenario simulation (explicit PS ask, Key Component 2) | High once demoed |
| **`ScenarioSimulator.tsx`** | **Placeholder only.** Routed, zero API calls. | Build: scenario picker → `POST /simulation/run` → side-by-side baseline vs. projected EAL/VaR comparison, delta chart. | **P0** | Scenario engine | M | AI decision support (Key Component 2) | **Critical** — per the original design notes, this is "genuinely cheap once the engine exists, and disproportionately impressive live." It's cheap now; it just isn't built. |

## G. AI Copilot, RAG & Tool-Calling

*Full breakdown in `AI_ROADMAP.md`. Summary rows only here.*

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Retrieval (FAISS, technical corpus) | **Complete**, contingent on the index being materialized in the deploy environment (Git-LFS caveat from prior audit, unresolved). | Verify index is present/loadable in the actual demo environment before finals. | P0 | — | S (verification only) | AI-powered platform (whole PS framing) | High if broken, invisible if working |
| Intent classification (technical/financial/optimization/simulation/compliance) | **Complete.** Real regex-based classifier with dedicated branches for all four financial intent types. | Nothing functional. | P0 | — | — | — | — |
| Tool-calling dispatch (`rag_tools/`, wired into `chat_assistant.py`) | **Complete, but parameters are hardcoded**, not extracted from the user's message (fixed ₹5L budget, fixed "MFA_EVERYWHERE" scenario regardless of what's asked). | Add NLU-based parameter extraction (budget figures, scenario names, framework names, org/BU names) before calling the tool. | **P0** | Tool-calling dispatch (exists) | M | "Where should we invest ₹1 crore" answered *correctly*, not just answered | **Critical** — this is literally the PS's headline financial-advisor use case, and it currently ignores the user's actual number |
| Tool-call trace UI | **Missing.** Chat renders plain narrated text; user cannot see which tool was called or with what result. | Add a collapsible trace panel showing tool name + structured result, per the original design principle ("a trust feature, don't hide it"). | P1 | Frontend chat component | S–M | Trust/traceability | Medium–High |
| True token-level streaming | **Still not implemented** — confirmed `media_type="text/plain"` unchanged; likely still chunked-replay rather than real SSE. | Verify actual generator behavior; if still buffer-then-chunk, implement real incremental streaming from the LLM. | P2 | — | M | Polish, not a grading criterion directly | Medium (perceived responsiveness) |
| Autonomous risk analyst | **Not built at all (0%).** No scheduled/proactive analysis exists beyond the reactive post-scan trigger. | New capability — see `AI_ROADMAP.md` for design. | P2 | Forecasting, RAG, tool-calling | L–XL | Predictive analytics (PS Key Component 2) | High if built, but highest-risk/most-speculative item on this roadmap |

## H. Multi-Source Telemetry (SIEM / IAM / EDR / CSPM)

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Connector architecture (`connectors/base_connector.py`, `POST /connectors/trigger/{name}`) | **Complete.** Real abstract interface, Fernet-ready credential handling. | Nothing functional. | P0 | — | — | Multi-source correlation (criterion 3) | Medium |
| IAM connectors (Azure AD, Okta) | **Complete, real code.** Genuine `httpx` calls to Microsoft Graph and Okta APIs — not mocked. **Untested against a live tenant** (expected; no test tenant available). | Get a test Azure AD or Okta tenant (free tier exists for both) and run one real `/connectors/trigger/azure_ad` call before finals — this is the PS's most literal, most-checked requirement, and it needs to actually fire once. | **P0** | Test tenant (external dependency, not code) | S (if tenant available), M (if provisioning one) | Multi-source correlation (criterion 3) — this is the requirement CR_V1.0.pdf calls "the item most likely to cost points if skipped" | **Critical** |
| SIEM/EDR/CSPM connectors (mocked) | **Deliberately mocked** (`connectors/mock_sources.py`), matching the original scoped decision — one working category proves the architecture generalizes. | None required. Do not present mock output as live in the demo; label it explicitly if shown at all. | P3 | — | — | — | Low — explicitly out of scope per the PS's own "you do not need all four live" allowance |
| Connector management UI | **Missing.** No frontend screen to configure credentials or trigger a connector. | Minimal settings-page addition: connector list, "connect" button, last-sync status. | P1 | IAM connector working end-to-end | M | Supports criterion 3's visibility | Medium |

## I. Executive & Audit Reporting

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Audit evidence report (`reports/audit_evidence_report.py`) | **Complete.** Real PDF export with provenance hash traceability. | Nothing functional. | P1 | Provenance (§A) | — | Audit-ready evidence (criterion 5) | Medium |
| Board report / Executive report variants | **Not built.** Only the audit-evidence variant and the original technical report (`reporting.py`) exist. | Build `reports/board_report.py`, `reports/executive_report.py` — thin variants over existing PDF infrastructure, different audience framing (money-first, no raw findings). | P2 | Board Portal data (§E) | M | Reinforces criterion 1/5 for a board audience | Medium |
| `Reports.tsx` frontend | **Complete for technical reports.** No UI to generate/download board or executive variants once built. | Add a report-type selector once the backend variants exist. | P2 | Board/exec report backend | S | — | Low |

## J. Security & Platform Hardening (cross-cutting, not a PS grading criterion but a finals-blocking risk)

| Feature | Status | Missing Work | Priority | Dependencies | Effort | SIH Impact | Demo Impact |
|---|---|---|---|---|---|---|---|
| Auth enforcement | **`AUTH_DISABLED = True`** is still the default; `SECRET_KEY` is still hardcoded in `config.py`. Confirmed unchanged by the FAIR engine work. | Flip the default; move `SECRET_KEY` to env-only; rotate it. | **P0** | — | S | Not a grading criterion, but a live, unauthenticated API is a credibility risk if a judge inspects the deployment | Low visually, high risk if noticed |
| RBAC enforcement | **Zero enforcement anywhere** — `User.role` exists, nothing checks it. | Minimum viable: gate mutation endpoints (`/investment/actions/*/approve`, `/org`, `/bu` POST) by role. | P1 | Auth enforcement above | M | — | Low |
| Login/session frontend | **Missing entirely** — no login page, no token storage, no route guards. | Build a minimal login flow; without it, RBAC has nothing to authenticate against on the client. | P1 | Auth enforcement | M | — | Medium — judges may ask "who's logged in as what" |

---

## Already-complete, high-confidence assets (lead with these in the pitch)

Real FAIR computation with closed-loop scan-triggered snapshots and hashed provenance; MILP investment optimizer with a shipped, working Pareto-frontier chart; six-framework compliance mapper; scenario simulation engine reusing the live FAIR engine by construction; real (not mocked) IAM connector code; tool-calling wired into the chat assistant for four financial intent types; org/BU data model; 12-scanner orchestration; RAG retrieval over a technical corpus; audit-evidence PDF export with provenance traceability.

## Deferred by design, not by neglect

SIEM/EDR/CSPM connectors beyond mocks (PS explicitly allows this); board/executive report PDF variants beyond audit-evidence (nice-to-have, not graded directly); autonomous/proactive risk analyst (speculative, highest effort-to-certainty ratio on this list); true token-level SSE streaming (polish, not scored); measured-vs-estimated closed-loop verification UI (depends on Action Board shipping first).

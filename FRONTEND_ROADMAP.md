# CyberRakshak Vitta — Frontend Roadmap

Companion to `PRODUCT_ROADMAP.md`. This document is scoped to pages, visualizations, dashboards, and workflows only. Backend readiness for each is summarized but detailed in the product roadmap.

**Stack confirmed in place:** React 19, TypeScript, Vite, Tailwind, `recharts` (confirmed working via `SpendCurveChart`), React Flow (attack graph), Three.js/R3F (landing page). No new library needs to be introduced for anything below — every visualization required can be built with `recharts`.

---

## 1. Pages — full inventory

| Page | Route | Status | What's missing |
|---|---|---|---|
| `HomePage.tsx` | `/` | **Complete.** 3D landing, hero, sections. | — |
| `Dashboard.tsx` | `/dashboard` | **Partial.** Real KPI cards + `SpendCurveChart` now wired. **Still severity/count-first**, not money-first — `GlobalRiskScore` (0–1000 ordinal) and vulnerability counts remain the visual headline; EAL/VaR are not the primary metric anywhere on this page. | Reframe: EAL (with trend arrow) becomes the hero KPI card; existing severity counts demote to a secondary row. See §3. |
| `ScanConsole.tsx` | `/scan-console` | **Complete.** | — |
| `Vulnerabilities.tsx` | `/vulnerabilities` | **Complete.** | Optional: add an EPSS column now that `VulnerabilityMetadata.epss_score` exists in the schema — confirm it's populated before wiring. |
| `Assets.tsx` | `/assets` | **Complete** for the existing scan-derived view. | Confirm it reads from the real `Asset`/`AssetControl` tables (now that they exist) rather than the older per-request JSON derivation — verify before assuming. |
| `AttackPath.tsx` | `/attack-path` | **Partial.** Technical graph renders; no financial exposure overlay. | Call `GET /risk/attack-paths/{job_id}`; add ₹-exposure labeling per path/node. |
| `ThreatIntel.tsx` | `/threat-intel` | **Complete.** | — |
| `Reports.tsx` | `/reports` | **Complete** for technical + audit-evidence reports. | Add report-type selector once board/executive variants exist (backend, deferred). |
| `Remediation.tsx` | `/remediation` | **Complete.** | — |
| `ChatAssistant.tsx` | `/assistant` | **Partial.** Real streaming chat UI; no tool-call trace visibility, no citation rendering component. | See `AI_ROADMAP.md`. |
| `Settings.tsx` | `/settings` | **Complete** for existing tabs. | Add a connector-management tab (§4) once IAM connector is demo-verified. |
| `UserProfile.tsx` | `/profile` | **Complete.** | — |
| `AuditLogs.tsx` | `/audit-logs` | **Complete.** | — |
| `GraphSnapshot.tsx` | `/graph-snapshot/:jobId` | **Complete.** | — |
| **`BoardPortal.tsx`** | `/board-portal` | **Placeholder only — zero API calls.** | **Full build required.** See §2. |
| **`ScenarioSimulator.tsx`** | `/scenario-simulator` | **Placeholder only — zero API calls.** | **Full build required.** See §2. |
| **`ComplianceCenter.tsx`** | `/compliance-center` | **Placeholder only — zero API calls.** | **Full build required.** See §2. |
| Login / auth | *(no route exists)* | **Missing entirely.** | New page. See §5. |

**Net new pages required: 0.** Every route the product needs already exists and is wired into the router — the three placeholders just need their bodies built, and one new login page is needed. This is a materially smaller frontend lift than a from-scratch build.

---

## 2. The three placeholder pages — build specifications

These are the highest-leverage frontend work items: the backend for all three is fully live; the UI is a static "pending" card.

### `BoardPortal.tsx`
- **Consumes:** `GET /org`, `GET /bu`, `GET /risk/exposure?scope=bu&scope_id=...` (once scope filtering ships — blocking dependency, see `FEATURE_DEPENDENCY_MAP.md`).
- **Layout:** Org selector → BU comparison table (EAL, VaR95, trend arrow per BU) → a `recharts` bar or grouped-bar chart ranking BUs by EAL → six-framework compliance mini-scorecard (reuse the Compliance Center's data, don't re-fetch separately).
- **Explicit non-goal:** no drill-down to raw findings — this screen is for a board member or CFO, not an analyst. Keep it read-only.
- **Effort:** L (3–5 days), most of it in the BU-comparison chart and getting the empty/loading states right for an org with no scan history yet.

### `ScenarioSimulator.tsx`
- **Consumes:** `GET /simulation/scenarios` (populate the picker), `POST /simulation/run` (execute).
- **Layout:** Scenario picker (cards, one per preset: MFA rollout, patch deployment, segmentation, delayed remediation, new campaign) → parameter inputs where relevant (e.g. delay days) → "Run Simulation" → side-by-side baseline vs. projected panel (reuse `SpendCurveChart`'s card/chip visual language: compact ₹ stat tiles + a before/after delta chart).
- **Effort:** M (1–3 days) — the backend already returns baseline/projected EAL/VaR in a `RiskSnapshot`-compatible shape per the engine's design; this is largely a rendering task.

### `ComplianceCenter.tsx`
- **Consumes:** `GET /compliance/scores`, `GET /compliance/export`.
- **Layout:** Six framework scorecards (ISO 27001, NIST CSF, CIS v8, RBI CSF, SEBI CSCRF, DPDP) — graded score + gap list per framework, not a flat percentage grid (matches the backend's own framing). Evidence export button wired to the real export endpoint.
- **Effort:** M (1–3 days).

---

## 3. Dashboard reframe (money-first)

The single highest-SIH-impact frontend change, and the cheapest: no new data, no new endpoint — this is pure UI reorganization.

- **Current:** headline row is `Total Vulnerabilities`, `Critical Findings`, `High Findings`, `Asset Criticality Score`, `Open Ports Detected`, `Global Risk Score` (0–1000 ordinal).
- **Target:** headline card becomes EAL (with a trend arrow, once `risk/forecasting.py`'s output is wired in), a VaR95 gauge alongside it, then the existing severity counts demoted to a secondary row. `SpendCurveChart` and the new `AttackPath` financial overlay reinforce the same money-first framing elsewhere on the page.
- **Effort:** S (0.5–1 day) for the reorder/relabel; M if the EAL trend arrow requires a new small `EALTrendChart` component (recommended — see §4).

---

## 4. New visualization components required

| Component | Purpose | Data source | Status | Effort |
|---|---|---|---|---|
| `SpendCurveChart.tsx` | Investment vs. risk-reduction Pareto frontier | `/investment/pareto` | **Shipped.** | — |
| `EALTrendChart` | 30/60/90-day risk trajectory, line chart with a "cost of delay" annotation | `/risk/forecast` | **Missing.** | S |
| `VaRDistribution` | Histogram of Monte Carlo outcomes with VaR95/VaR99 percentile markers | Needs a new distribution-returning field or endpoint — `risk/uncertainty.py` computes the distribution internally but only persists point summaries today; confirm before committing to this scope. | **Missing, scope-check needed.** | M |
| `ComplianceRadar` | Six-axis spider chart, one axis per framework score | `/compliance/scores` | **Missing.** | S |
| `AttackPathExposure` overlay | ₹-exposure labeling on existing React Flow graph | `/risk/attack-paths/{job_id}` | **Missing.** | M |
| BU comparison chart (Board Portal) | Ranked bar chart of EAL by business unit | `/risk/exposure?scope=bu` | **Missing**, blocked on scope filtering | M |
| Tool-call trace panel | Collapsible "what did the AI call" panel in chat | Chat response payload (needs a `tool_calls` field added to the response — confirm current shape) | **Missing.** | S–M |

---

## 5. Workflows required

| Workflow | Status | Missing steps |
|---|---|---|
| Scan → risk recompute → dashboard update | **Complete end-to-end.** Verified: scan completion triggers real FAIR computation and persistence. | None — this is the demo's strongest moment already. |
| Investment recommendation → approval → remediation → verification | **Backend endpoints exist; no frontend workflow.** | Build the Action Board (see `PRODUCT_ROADMAP.md` §C) — table + approve/reject buttons + status badges (`proposed → approved → implemented → verified`). |
| Scenario what-if → compare → (optionally) convert to a real MitigationAction | **Backend run exists; frontend missing entirely.** | Build `ScenarioSimulator.tsx` (§2). A "convert to action" button is a nice-to-have stretch, not required for MVP. |
| Login → role-based routing → scoped data | **Entirely missing**, frontend and backend both. | See `PRODUCT_ROADMAP.md` §J. Minimum viable: a login form, token storage, and route guards that redirect unauthenticated users — role-based *content* gating (hiding Board Portal from an analyst) is P2, not blocking. |
| Connector configuration → trigger → ingested findings | **Backend trigger endpoint exists; no configuration UI.** | Minimal Settings-tab addition: list connectors, a "Connect" button that stores encrypted credentials, a "Sync now" button. |
| Compliance evidence export → download | **Backend export endpoint exists; no frontend trigger outside a built Compliance Center.** | Ships as part of `ComplianceCenter.tsx` (§2). |

---

## 6. Explicitly not required for SIH finals

A full role-based UI gating system (show/hide menu items by role) — a login flow that authenticates is P1, but hiding screens per role is P2/P3 given time constraints. A settings-driven theme system, i18n, or any multi-language support. Mobile-responsive layout beyond what Tailwind gives for free — this is a desktop demo tool for security/finance professionals, not a mobile app.

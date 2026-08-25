# CyberRakshak Vitta — MVP Checklist for SIH 2026 Finals

Filtered view of `PRODUCT_ROADMAP.md` / `FRONTEND_ROADMAP.md` / `AI_ROADMAP.md`. Everything here is scoped against the grading logic in CR_V1.0.pdf §2: (1) monetary not categorical output, (2) continuous not point-in-time, (3) multi-source correlation, (4) budget-constrained optimization, (5) framework mapping with audit evidence.

Checkbox convention: `[x]` = already true today, verified against running code. `[ ]` = work required. Items are grouped by mandatory/should/defer, not by feature area — this is a build-order-adjacent priority list, not a catalog (see `DEVELOPMENT_SEQUENCE.md` for actual sequencing).

## Mandatory for finals (P0) — the demo does not work without these

- [x] Scan completion triggers real, hashed FAIR risk computation (`RiskSnapshot`/`RiskDriver`/`RiskModelRun`) — **already true, the strongest asset in the submission**
- [x] MILP investment optimizer produces real budget-constrained recommendations
- [x] Pareto/spend-curve chart shipped and wired to live data
- [x] Six-framework compliance mapper returns real, honestly-scoped scores
- [x] Scenario simulation engine reuses the live FAIR engine (no parallel calculation path)
- [x] At least one real (non-mocked) telemetry connector exists in code (IAM: Azure AD, Okta)
- [ ] **Org/BU-scoped risk exposure** — `/risk/exposure` and `/risk/forecast` must accept `scope`/`scope_id` and filter accordingly
- [ ] **Board Portal built and wired** — currently a static placeholder; this is the screen that proves org/BU-level risk management to a judge
- [ ] **Scenario Simulator built and wired** — currently a static placeholder; backend has been ready and unused
- [ ] **Compliance Center built and wired** — currently a static placeholder; backend has been ready and unused
- [ ] **Investment Action Board built** — ranked recommendations + approve/reject workflow; backend endpoints exist, no frontend consumes them
- [ ] **Tool-calling parameter extraction** — the copilot currently ignores the user's actual stated budget/scenario/framework and answers against hardcoded defaults; this must be fixed before any live financial-advisor demo
- [ ] **At least one live connector trigger against a real IAM tenant** (Azure AD or Okta test tenant) — proves multi-source correlation isn't just unexercised code
- [ ] **RAG index confirmed loaded in the actual demo environment** — five-minute check, demo-ending if skipped
- [ ] **`AUTH_DISABLED` flipped to `False` and `SECRET_KEY` moved to env-only** before any judge-facing deployment — currently the API is unauthenticated by default
- [ ] **Dashboard reframed money-first** — EAL/VaR as the headline, not severity counts — this is the PS's single most explicit, most literal grading requirement and today's Dashboard doesn't lead with it

## Should do if time allows (P1) — meaningfully strengthens the pitch

- [ ] Attack Path financial exposure overlay (backend ready, frontend not wired)
- [ ] `EALTrendChart` and `ComplianceRadar` components (data already available via `/risk/forecast` and `/compliance/scores`)
- [ ] Tool-call trace UI in chat (backend needs a `tool_calls` field added to the response; frontend renders it)
- [ ] Minimal login flow + route guards (no RBAC content-gating required yet, just authentication)
- [ ] Connector management UI (list/connect/sync — currently no way to configure a connector from the frontend)
- [ ] RBAC enforcement on mutation endpoints (`/investment/actions/*/approve`, `/org`, `/bu` writes)
- [ ] Closed-loop verification surfaced in UI (`measured_reduction_inr` vs. `estimated_reduction_inr`)

## Explicitly defer past finals (P2/P3) — do not spend time here before the above is done

- [ ] `VaRDistribution` histogram (needs a scope-check on whether the distribution data is even persisted today — don't start until confirmed)
- [ ] Board/executive PDF report variants beyond the existing audit-evidence export
- [ ] SIEM/EDR/CSPM connectors beyond the existing honest mocks — the PS explicitly does not require all four live
- [ ] Multi-step agent reasoning / autonomous risk analyst — genuinely new capability, highest effort-to-certainty ratio on the whole roadmap
- [ ] True token-level SSE streaming (current chunked-replay streaming reads fine in a demo; this is invisible polish)
- [ ] Qdrant migration — infrastructure decision with no direct grading impact
- [ ] Org/BU-scoped audit trail
- [ ] Role-based UI content gating (hiding menu items per role) — login/auth (P1) is required, hiding screens is not
- [ ] Mobile responsiveness, i18n, theming beyond what already exists

## Already complete — do not rebuild, do not re-scaffold

FAIR engine (`risk/impact.py`, `likelihood.py`, `engine.py`, `uncertainty.py`), attack-path chaining (`risk/attack_path.py`), forecasting (`risk/forecasting.py`), provenance (`risk/provenance.py`), MILP optimizer + Pareto sweep (`risk/optimizer.py`), compliance mapper (`compliance/framework_mapper.py`), scenario engine (`simulation/`), tool-calling dispatch (`rag_tools/`, wired into `chat_assistant.py`), Azure AD/Okta connector code, `Organization`/`BusinessUnit`/`Asset`/`AssetControl` schema, 12-scanner orchestration, RAG retrieval pipeline, `SpendCurveChart.tsx`, all analyst-console pages, the 3D landing page.

## One-sentence test for any new work request between now and finals

**"Does this close a placeholder screen, fix a hardcoded value a judge could catch live, or satisfy one of the five named grading criteria — or is it something else?"** If it's something else, it belongs in the deferred list above, not in this sprint.

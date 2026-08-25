# CyberRakshak Vitta — Technical Documentation

This is the deep reference for engineers working in this codebase. `README.md` is the front door; this document is what you read before implementing a module. Everything here describes the **implemented repository structure as of this reorganization** — where something is planned rather than built, it's labeled SCAFFOLD and points to the roadmap phase that implements it. See [`docs/audits/gap-audit.md`](docs/audits/gap-audit.md) for the evidence trail behind every status label in this document.

---

## 1. Repository structure

```
CyberRakshak/
├── .github/
│   ├── CODEOWNERS
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docker-compose.yml
├── nginx/nginx.conf
│
├── Frontend/
│   └── src/
│       ├── pages/                 17 routed screens — see S5
│       ├── components/
│       │   ├── hero/ landing/ sections/      Public landing page (3D robot, particle field)
│       │   ├── dashboard/ scan/ attack/ vuln/ assets/ intel/ reports/ settings/ chat/  Operational console
│       │   ├── layout/            Sidebar, Topbar
│       │   └── ui/
│       ├── layouts/               AppLayout (operational), LandingLayout (public)
│       ├── router/AppRouter.tsx
│       └── services/               api.ts, chatAssistant.ts
│
├── backend/
│   ├── main.py                    FastAPI entrypoint, CORS, startup (Redis + RAG index load)
│   ├── requirements.txt
│   ├── Dockerfile.api / Dockerfile.worker / Dockerfile.{scanner tools}
│   ├── create_admin.py / reset_system.py / update_db.py / worker_prestart.py
│   ├── app/
│   │   ├── api.py                 All REST routes (single router, see S4)
│   │   ├── auth.py                JWT issuance/verification
│   │   ├── config.py              Settings (env-driven, see S7 for the security caveat)
│   │   ├── database.py            SQLModel engine/session
│   │   ├── models.py              SQLModel schema (see S3)
│   │   ├── parsers.py             13 scanner-output parsers → normalized finding dicts
│   │   ├── enrichment.py          CISA KEV / NVD / ExploitDB / OTX enrichment
│   │   ├── graph.py               NetworkX attack-graph builder (visualization layer)
│   │   ├── reporting.py           Technical PDF report generator (fpdf2 + matplotlib)
│   │   ├── remediation.py         Remediation-step extraction
│   │   ├── rag.py                 FAISS retrieval engine
│   │   ├── rag_logger.py          RAG query/response logging
│   │   ├── intent_classifier.py   Deterministic (regex) intent tagging
│   │   ├── chat_assistant.py      Prompt assembly, token budgeting, streaming response
│   │   ├── seed_hospital_demo.py  Demo data seeder
│   │   ├── utils/                 External API clients: nvd_sync, cisa_sync, exploitdb,
│   │   │                          alienvault, ai_client (Kaggle GPU), mailer, context_builder
│   │   ├── worker/                celery_app.py, tasks.py (scanner orchestration, DooD)
│   │   │
│   │   ├── risk/                  SCAFFOLD — FAIR engine, see S8
│   │   ├── compliance/            SCAFFOLD — framework mapper, see S9
│   │   ├── connectors/            SCAFFOLD — telemetry ingestion, see S10
│   │   ├── simulation/            SCAFFOLD — scenario engine, see S11
│   │   ├── rag_tools/             SCAFFOLD — LLM tool-calling, see S12
│   │   └── reports/                SCAFFOLD — audience-split reporting
│   ├── tests/
│   │   ├── conftest.py            TestClient fixture
│   │   ├── test_api_vitta.py      Real smoke tests (health check, OpenAPI schema)
│   │   └── test_risk_engine.py    Skipped acceptance tests for app/risk/ (the implementation spec)
│   ├── openvas/docker-compose.yml Dedicated OpenVAS service
│   └── rag_storage/               FAISS index + metadata (see S13 caveat)
│
├── ai_service/                    Offline RAG corpus builders (13 parsers) + kaggle_brain.py
│                                  (remote GPU inference server — hosted outside the Docker network)
│
└── docs/
    ├── architecture/              Source specification documents (see docs/architecture/README.md)
    ├── audits/gap-audit.md        Authoritative current-state document
    └── adr/                       Architecture decision records
```

## 2. Design principle governing every SCAFFOLD module

Every new package added in this reorganization (`risk/`, `compliance/`, `connectors/`, `simulation/`, `rag_tools/`, `reports/`) exists as a real, importable Python module with a defined interface — type-hinted function signatures and docstrings citing the formula or spec section it implements — but with `NotImplementedError` bodies rather than fabricated logic. This is a deliberate choice: two prior internal documents described these exact modules as already built, and that gap between claim and reality is what the whole audit trail in `docs/audits/` exists to correct. Do not "helpfully" fill in a plausible-looking implementation without doing the actual design work the docstring points to — that would repeat the same mistake in code instead of in a spec document.

## 3. Data model

Implemented tables (`backend/app/models.py`):

| Table | Key fields |
|---|---|
| `User` | `id`, `username`, `hashed_password`, `role` (free-text: `admin`/`analyst`; RBAC enforcement not yet built) |
| `Job` | `id`, `target`, `status`, `scanners_requested`, `tool_status`, `normalized_report` (JSON) |
| `AuditLog` | `id`, `timestamp`, `event_type`, `details`, `job_id` |
| `Notification` | `id`, `title`, `message`, `type`, `is_read` |
| `VulnerabilityMetadata` | `cve_id` (PK), `cvss_score`, `severity`, `is_cisa_kev`, `has_exploit`, OTX fields |

Not yet created — required by Roadmap Phase 1 before `risk/`, `compliance/`, `connectors/` can run against real data: `Organization`, `BusinessUnit`, `Asset`, `AssetControl`, `RiskSnapshot`, `RiskDriver`, `RiskModelRun`, `MitigationAction`, `ComplianceFramework`, `ComplianceScore`. "Assets" today are recomputed per-request from `Job.normalized_report` JSON blobs (`api.py`) rather than being persisted rows — this is the specific thing Phase 1 replaces.

## 4. API surface

`backend/app/api.py` exposes 24 routes today, grouped: auth (1), scan orchestration (5), chat (2), dashboard/data (7), threat-intel (5), remediation/notifications (2), plus 2 health routes mounted directly in `main.py`. There are currently no risk, compliance, simulation, or org endpoints — those get added under `api.py` (or a split `api/` package, see the note below) as each backend module in S8–S12 is implemented, following the grouping already sketched in `docs/architecture/` (`/api/org/*`, `/api/eal`, `/api/var`, `/api/simulation/*`, `/api/compliance/*`, `/api/optimization/*`, `/api/connectors/*`).

**Deliberately deferred in this reorganization:** splitting `api.py` (874 lines) and `models.py` into per-domain packages (`api/scans.py`, `api/risk.py`, etc.) was evaluated and left for a dedicated follow-up PR rather than done in the same pass as everything else here — it's a mechanical but real-risk change to a currently-working, zero-test-coverage route file, and bundling it with a dozen other changes increases the odds of a silent breakage. `backend/tests/test_api_vitta.py` exists now specifically so that split has a regression net when it happens.

## 5. Frontend routes

| Route | Page | Status |
|---|---|---|
| `/` | `HomePage` (3D landing) | Implemented |
| `/dashboard` | `Dashboard` | Implemented (severity-first KPIs — money-first rework is Roadmap Phase 8) |
| `/scan-console`, `/vulnerabilities`, `/assets`, `/attack-path`, `/threat-intel`, `/reports`, `/remediation`, `/assistant`, `/audit-logs`, `/settings`, `/profile` | Analyst console | Implemented |
| `/board-portal` | `BoardPortal` | Scaffolded — placeholder screen, no live data |
| `/simulator` | `ScenarioSimulator` | Scaffolded |
| `/compliance` | `ComplianceCenter` | Scaffolded |
| `/graph-snapshot/:jobId` | `GraphSnapshot` | Implemented (headless render target for PDF export) |

No login route exists yet — every route above is reachable without authentication on the frontend, matching the backend's `AUTH_DISABLED=True` default. Building a real auth flow is Roadmap Phase 8, and should land alongside (not after) the backend's Phase 0 auth fixes.

## 6. Async / scanning tier

Celery + RabbitMQ orchestrate scan jobs; the worker (`backend/app/worker/tasks.py`) shells out to Docker (Docker-out-of-Docker, socket-mounted) to run each scanner in its own ephemeral container. 12 of 13 planned scanners are wired into the dispatch map: Nmap, Nuclei, Nikto, ZAP, Wappalyzer, WhatWeb, Whois, Dirsearch, Wfuzz, Dalfox, Metasploit, OpenVAS. Grype has a Dockerfile, an API config model, and a parser, but is excluded from the dispatch map — restoring or removing it is an open Phase 0 decision (`docs/audits/gap-audit.md`).

## 7. Security posture — read before deploying anywhere shared

- `AUTH_DISABLED=True` is the default in `backend/app/config.py`; every request is treated as an authenticated admin session until this is flipped.
- Default secrets (`SECRET_KEY`, a mail app password, a threat-intel API key) are hardcoded in `config.py` rather than required from the environment.
- No route in `api.py` performs authorization beyond authentication — a `role` field exists on `User` but nothing checks it.
- OpenVAS/GVM credentials are hardcoded `admin`/`admin` in `worker/tasks.py`.
- See `SECURITY.md` for the reporting process and `docs/audits/gap-audit.md` Roadmap Phase 0 for the fix plan.

## 8. FAIR risk engine (`backend/app/risk/`)

| Module | Purpose | Formula / method |
|---|---|---|
| `impact.py` | Single Loss Expectancy | `SLE = business_value_inr × exposure_factor` |
| `likelihood.py` | Loss Event Frequency | `λ_LEF = TEF × Vuln × (1 − ControlEff)` |
| `engine.py` | Orchestrator | `EAL = λ_LEF × SLE` — single entry point every other engine must call |
| `uncertainty.py` | Monte Carlo | Compound Poisson process, N = 10,000 simulated years → EAL point estimate, 10th/90th percentile bounds, VaR95/VaR99 |
| `optimizer.py` | Budget-constrained selection | 0-1 integer program: maximize `Σ(ΔEAL_i × x_i)` subject to budget/dependency/mandate constraints; Pareto frontier |
| `attack_path.py` | Chained-compromise exposure | `P(Path) = Π P(Hop_k)`; centrality feeding likelihood |
| `epss_client.py` | Exploit prediction | FIRST.org EPSS public API, degrades to CVSS-only on failure |
| `forecasting.py` | Trend projection | 30/60/90-day EAL trajectory from `RiskSnapshot` history |
| `provenance.py` | Audit trail | Keyed HMAC-SHA256 over exact computation inputs, versioned independently for model logic vs. cost benchmarks |
| `score.py` | Dashboard summary | 0-100 normalized score, secondary to the EAL/VaR money figure, never the primary metric |

**Control-effectiveness combination rule** (governs `impact.py`/`likelihood.py`): multiple `AssetControl` rows on one asset combine **multiplicatively** on residual risk — `CombinedControlEff = 1 − Π(1 − eff_i)`. Two 50%-effective controls together leave 25% residual risk, not 0%. Implementing this as a sum or average is a modeling error, not a style choice.

Implementation order: `impact.py` → `likelihood.py` (+ `epss_client.py`) → `engine.py` → `uncertainty.py` → `provenance.py`, then `attack_path.py` and `optimizer.py` once the point-estimate engine is stable. `forecasting.py` and `score.py` are downstream and only meaningful once real `RiskSnapshot` history exists.

## 9. Compliance engine (`backend/app/compliance/`)

Single dispatcher (`framework_mapper.py`) over six frameworks: ISO 27001 Annex A, NIST CSF 2.0, CIS Controls v8, RBI Cyber Security Framework, SEBI CSCRF, DPDP Act 2023. RBI and SEBI must be modeled as graded/tiered — see the module docstring for the specific control requirements (board-approved policy, DAKSH reporting, the five SEBI resiliency goals) that make a flat pass/fail percentage wrong for these two. DPDP compliance gaps feed a penalty-exposure figure into `RiskSnapshot.regulatory_loss_inr` as a separate line item via `risk/impact.py`'s integration point, not blended into general loss.

## 10. Telemetry connectors (`backend/app/connectors/`)

`base_connector.py` defines the abstract interface (`authenticate` + `fetch`, Fernet-encrypted credentials at rest) every source implements, normalizing into the same `NormalizedFinding` schema the existing scanner parsers produce — the FAIR engine and attack graph need zero changes to consume a new source. `iam/{azure_ad,okta}.py` are the recommended first real build (simplest, best-documented read API). `mock_sources.py` provides honestly-labeled mock SIEM/EDR/CSPM connectors so the architecture can be demonstrated without live third-party tenants — never present their output as production data.

## 11. Scenario simulation (`backend/app/simulation/`)

`scenario_engine.py` runs a named scenario as a deep-copy, immutable parameter override, then re-invokes `risk.engine.compute_eal` + `risk.uncertainty.simulate` — never a parallel calculation path, which is what guarantees the simulator's numbers can't disagree with the live dashboard's. `scenario_library.py` holds the named presets from the PS (MFA rollout, patch deployment, segmentation, added monitoring, delayed remediation, new campaign).

## 12. AI tool-calling (`backend/app/rag_tools/`)

Strictly read-only by construction: `ALLOWED_TOOLS` in `rag_tools/__init__.py` is the enforced allowlist `execute_tool_call` checks before dispatching anything an LLM requests. Once `intent_classifier.py` gains a financial/what-if branch (Roadmap Phase 6), a query like "where should we invest ₹1 crore" routes here instead of to text retrieval — `risk_tool.py`, `optimizer_tool.py`, `simulation_tool.py`, `compliance_tool.py` each wrap one read-only call into the corresponding engine.

## 13. Known data caveats

- `backend/rag_storage/*.faiss` / `*.jsonl` are large (multi-hundred-MB) Git-LFS-pointer files in some checkouts — verify they're materialized before assuming RAG retrieval works; see `docs/adr/0001-qdrant-adoption.md` for the longer-term storage decision.
- The offline corpus builders in `ai_service/` and the runtime retrieval engine (`backend/app/rag.py`) have historically used different embedding models — confirm both sides agree before rebuilding the index.

## 14. Roadmap

See [`docs/audits/gap-audit.md`](docs/audits/gap-audit.md) for the full phase-by-phase roadmap, dependency graph, and rationale for the ordering.

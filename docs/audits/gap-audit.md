# CyberRakshak Vitta — Gap Audit

Repository-verified (not documentation-verified) audit of the codebase against the SIH26105 target. Conducted by direct inspection of `main` and every remote branch — not from architecture diagrams or prior specs, which is the exact distinction this document exists to preserve. Superseded findings from earlier internal specs are noted inline where relevant.

## Headline finding

Two internal specification documents (a context doc and a "Master Technical Reference" PDF) described a mature FAIR risk engine, MILP optimizer, Monte Carlo simulator, compliance mapper, and multi-tenant org hierarchy as already built. None of it existed anywhere in the repository, on any branch, at the time of this audit. What's real: a working vulnerability-scanning platform (12 of 13 scanners genuinely integrated), a functioning attack-graph visualization, live threat-intel sync (NVD/CISA KEV/ExploitDB/OTX), and a FAISS-backed RAG chatbot — a solid V1 for a vuln-scanning product, and zero code toward the money-first FAIR/compliance/optimization platform SIH26105 requires.

This repository has since been reorganized to scaffold the missing structure honestly: new packages exist with defined interfaces and `NotImplementedError` bodies, not fabricated logic. See "Module status" below for what's real vs. scaffolded as of this reorganization.

## Security posture (fix before any public demo)

- `AUTH_DISABLED=True` ships as the default (`backend/app/config.py`) — the API is unauthenticated out of the box.
- `SECRET_KEY`, a mail app password, and a threat-intel API key are hardcoded defaults in `config.py`, not sourced from environment only.
- Zero RBAC enforcement anywhere despite a `role` field on `User` — every protected route only authenticates, never authorizes.
- OpenVAS/GVM credentials are hardcoded `admin`/`admin` in a dynamically generated script (`backend/app/worker/tasks.py`).
- CORS mixes a wildcard origin with `allow_credentials=True`.

## Module status

| Layer | Module | Status |
|---|---|---|
| Scanning | 12 of 13 scanner integrations (`worker/tasks.py`) | Implemented |
| Scanning | Grype | Dead — Dockerfile/config/parser exist, excluded from dispatch |
| Attack graph | Visualization (`app/graph.py`, React Flow) | Implemented |
| Attack graph | Multi-hop chaining, centrality (`app/risk/attack_path.py`) | Scaffolded |
| Threat intel | NVD/CISA KEV/ExploitDB/OTX sync | Implemented |
| Data | `User`, `Job`, `AuditLog`, `Notification`, `VulnerabilityMetadata` | Implemented |
| Data | `Asset`, `AssetControl`, `Organization`, `BusinessUnit`, `RiskSnapshot`, `RiskDriver`, `RiskModelRun`, `MitigationAction`, `ComplianceFramework`, `ComplianceScore` | Not yet created — Roadmap Phase 1 |
| Risk engine | `app/risk/*` (impact, likelihood, engine, uncertainty, optimizer, attack_path, epss_client, forecasting, provenance, score) | Scaffolded (interfaces + docstrings only) |
| Compliance | `app/compliance/framework_mapper.py` | Scaffolded |
| Connectors | `app/connectors/iam/{azure_ad,okta}.py`, `mock_sources.py` | Scaffolded |
| Simulation | `app/simulation/*` | Scaffolded |
| AI tool-calling | `app/rag_tools/*` | Scaffolded |
| AI RAG | `app/rag.py` retrieval | Implemented, but shipped index is an unmaterialized Git-LFS pointer in some checkouts — verify before relying on it |
| AI RAG | Qdrant durable store | Provisioned in `docker-compose.yml`, zero application code references it — orphaned, needs an explicit adopt-or-remove decision |
| AI chat | Streaming | Implemented as chunked replay of a completed response, not true token-level SSE |
| Frontend | Analyst console (scan, vulns, assets, attack path, threat intel, reports, audit logs) | Implemented |
| Frontend | 3D landing page, hero, portal navigation | Implemented (merged from `origin/tanishaq`) |
| Frontend | Board Portal, Scenario Simulator, Compliance Center | Scaffolded (placeholder screens, routed, no live data) |
| Frontend | Auth flow (login page, session, route guards) | Not implemented |
| Reporting | Technical PDF reports (`app/reporting.py`) | Implemented |
| Reporting | `app/reports/audit_evidence_report.py` (board/exec/audit split) | Scaffolded |

## Roadmap

Ordered by dependency, not by interest. Each backend scaffold module's docstring cites the phase that implements it — keep that cross-reference in sync as phases land.

- **Phase 0 — Stabilize.** Flip `AUTH_DISABLED` default, move secrets to env-only, rotate exposed credentials. Decide Qdrant (adopt for real or remove the service). Decide Grype (restore to dispatch or remove the Dockerfile/config). Materialize the FAISS index.
- **Phase 1 — Data foundation.** `Organization`, `BusinessUnit`, real persisted `Asset`/`AssetControl` (replacing today's per-request JSON derivation), full role enum + `org_id` on `User`. Harden `app/parsers.py`'s output into one strict finding schema.
- **Phase 2 — FAIR risk engine.** `risk/impact.py` → `risk/engine.py` → `risk/uncertainty.py` → `risk/provenance.py`, with `risk/epss_client.py` wired in as soon as the likelihood function exists. `/api/eal`, `/api/var` endpoints.
- **Phase 3 — IAM connector.** `connectors/iam/{azure_ad,okta}.py`. Only depends on Phase 1's schema hardening — can run in parallel with Phase 2.
- **Phase 4 — Attack-path analytics + optimizer.** `risk/attack_path.py` chaining/centrality; `risk/optimizer.py` MILP + Pareto frontier; `MitigationAction` table.
- **Phase 5 — Scenario simulation.** `simulation/scenario_engine.py` + `scenario_library.py`, thin wrapper over Phase 2/4.
- **Phase 6 — AI tool-calling.** `rag_tools/*`; extend `intent_classifier.py` with a financial/what-if branch; real SSE streaming; citation/tool-call-trace UI.
- **Phase 7 — Compliance engine.** `compliance/framework_mapper.py` (graded RBI/SEBI, not flat checklists), DPDP + penalty estimator feeding `RiskSnapshot.regulatory_loss_inr`. `reports/audit_evidence_report.py`.
- **Phase 8 — Frontend build-out.** Real login/auth flow; money-first Executive Dashboard rework; live data for Board Portal, Scenario Simulator, Compliance Center; `EALTrendChart`/`VaRDistribution`/`ParetoFrontier`/`ComplianceRadar` chart components.
- **Phase 9 — Governance polish.** Org/BU-scoped audit trail; board/exec/audit-evidence report splits; auditor evidence export.

## Full findings

The complete evidence-based audit (file:line citations, endpoint-by-endpoint reality checks, corrected reuse-percentage matrix) lives in the two published audit artifacts referenced from the project's working history. This file is the condensed, repository-resident version those artifacts point back to.

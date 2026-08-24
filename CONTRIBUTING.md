# Contributing to CyberRakshak Vitta

Thanks for working on this. This guide covers repository conventions specific to this project — for general open-source etiquette, see `CODE_OF_CONDUCT.md`.

## Before you start

1. Read `docs/audits/gap-audit.md` — it's the authoritative account of what's actually implemented vs. scaffolded. Don't build on top of a module described in `docs/architecture/` without checking here first; those specs describe intent, not current state.
2. Check `docs/adr/` for open architecture decisions that might affect your change.
3. If you're implementing a scaffolded module (anything under `backend/app/risk/`, `compliance/`, `connectors/`, `simulation/`, or `rag_tools/`), read that module's docstring first — it cites the governing formula/spec section and the roadmap phase it belongs to.

## Repository structure

See `DOCUMENTATION.md` for the full architecture reference. Quick orientation:

- `Frontend/` — React 19 + TypeScript + Vite SPA.
- `backend/app/` — FastAPI application. Domain packages (`risk/`, `compliance/`, `connectors/`, `simulation/`, `rag_tools/`, `reports/`, `worker/`) group by concern; each has a module-level docstring explaining its status.
- `ai_service/` — offline corpus builders + the remote Kaggle GPU inference server, run separately from the main Docker Compose stack.
- `docs/` — architecture specs, audits, and decision records.

## Module boundaries — please respect these

- **`risk/` is the single source of truth for FAIR computation.** `simulation/` and `rag_tools/risk_tool.py` must call into `risk/engine.py`, never re-derive EAL/VaR independently — a parallel implementation is how the simulator's numbers end up disagreeing with the live dashboard's.
- **`rag_tools/` is strictly read-only** — `ALLOWED_TOOLS` in `backend/app/rag_tools/__init__.py` is the enforced allowlist. A tool that writes or mutates state does not belong in this package.
- **Connectors normalize into the same finding schema `app/parsers.py` produces** — don't invent a second finding shape; harden the existing one if it's missing a field you need.

## Adding a new backend module

Only create a new package/directory when you're about to put real content in it — see the repository blueprint's rule: a folder should exist because a roadmap phase is starting, not speculatively. When you do create one, add a module or package docstring stating its purpose and current status (Implemented / Scaffolded / Blocked-on-X), matching the style already used throughout `backend/app/`.

## Testing

- `backend/tests/` — run with `pytest` from `backend/`. Tests marked `@pytest.mark.skip` against a scaffolded module are the acceptance spec for that module — un-skip and fill them in as you implement, don't delete them.
- No frontend test suite exists yet; if you add one, wire it into `.github/workflows/`.

## Commit and PR conventions

- Prefer small, reviewable PRs scoped to one module boundary.
- If your change flips a module from "Scaffolded" to "Implemented," update its status in `docs/audits/gap-audit.md`'s module table in the same PR.
- Security-relevant changes (auth, RBAC, secrets handling) should call out what they change explicitly in the PR description — see `SECURITY.md`.

# Security Policy

CyberRakshak Vitta is a cybersecurity platform; we take vulnerability reports in our own code at least as seriously as the vulnerabilities it scans for.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.** Instead, email the maintainers (see repository owners) with:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, or a proof-of-concept if you have one.
- The affected component (frontend, backend API, worker, AI service, or infrastructure/Docker config).

We aim to acknowledge reports within 5 business days and will keep you updated as we investigate and remediate.

## Scope notes specific to this project

- The current default configuration ships with `AUTH_DISABLED=True` in the backend (`backend/app/config.py`) and hardcoded default secrets — see `docs/audits/gap-audit.md` for the full list. **Do not deploy this configuration to any environment reachable outside a local development machine** until Roadmap Phase 0 (stabilization) is complete.
- Scanner containers run with Docker-out-of-Docker access and no resource isolation flags — treat the scan-target input as untrusted and do not point this platform at infrastructure you don't control.

## Supported versions

This project is under active pre-release development; only the `main` branch is supported.

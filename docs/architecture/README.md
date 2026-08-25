# Architecture documents

This folder is where the project's specification documents live so they're versioned with the code instead of only existing in chat history or a team drive.

| File | Purpose | Status |
|---|---|---|
| `CR_Context.md` | Original V1→V2 pivot context document (product vision, "confirmed" module list) | Add here — content currently lives only in team chat history; several of its "V1 confirmed" claims are contradicted by `../audits/gap-audit.md`, kept for historical context, not as a current-state source |
| `CR_V1.0.pdf` (or a `.md` transcript) | "Master Technical Reference" — the 13-diagram target architecture, data model, API surface, and formula reference | Add here — same caveat: its `[CONFIRMED]` tags describe the *intended* system, verified against real code in `../audits/gap-audit.md` |
| `../audits/gap-audit.md` | The authoritative current-state document | Current |

**Reading order for a new contributor:** start with `../audits/gap-audit.md` (what's real today), then `CR_V1.0.pdf` sections 6–10 (the target architecture those gaps are being closed against). Treat the two source specs as intent, not inventory — that distinction is the reason this audit trail exists.

## Decision records

`../adr/` holds dated, numbered decisions on the open questions the specs above left unresolved (vector-store strategy, which telemetry connector to build first, etc.) — see `../adr/0001-qdrant-adoption.md` for the first one.

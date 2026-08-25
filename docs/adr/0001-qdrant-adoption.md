# ADR 0001: Qdrant's role in the RAG stack

**Status:** Open — decision needed before Roadmap Phase 6 (AI tool-calling).

## Context

`docker-compose.yml` runs a Qdrant service, and the backend's environment even declares `QDRANT_URL` and waits on Qdrant at boot (`depends_on`). No application code anywhere reads that variable or imports a Qdrant client — `qdrant-client` isn't a dependency. The original architecture spec (`../architecture/CR_V1.0.pdf`, S6.7) calls for a hybrid store: Qdrant as the durable source of truth, FAISS as an in-memory hot cache synced from it.

## Options

1. **Adopt.** Implement `app/rag/qdrant_sync.py`, add `qdrant-client` to `requirements.txt`, make Qdrant the write path and FAISS a read-through cache rebuilt from it.
2. **Remove.** Drop the `qdrant` service, its volume, and the backend's `QDRANT_URL`/`depends_on` entries. Keep FAISS as the only store, with the index rebuilt from the offline corpus builders (`ai_service/`) and shipped as a build artifact rather than a committed file.

## What this decision should weigh

- Option 1 buys index durability across restarts without a full corpus rebuild, and horizontal scalability if the RAG tier ever needs more than one backend replica.
- Option 2 is less infrastructure to operate and matches the project's actual current scale (single backend instance, index rebuildable from source parsers in `ai_service/`).
- Either way, the currently-committed `backend/rag_storage/*.faiss`/`*.jsonl` files being multi-hundred-MB Git-LFS pointers should be revisited — build artifacts this large don't belong in the application source tree regardless of which option is chosen.

## Decision

_Not yet made. Record it here (with date and owner) once Phase 6 planning starts._

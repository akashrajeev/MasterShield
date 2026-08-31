# Data Source of Truth

`data/attacks/attacks.json` is the canonical 120-scenario attack catalog used by the FastAPI backend and the integrated frontend.

The submission tree intentionally contains no second TypeScript attack catalog or client-side simulation engine. Keeping one canonical catalog prevents stale IDs, conflicting attack counts, and misleading benchmark claims.

All transaction and entity datasets in this project are synthetic defensive research data.

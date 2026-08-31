# Data Source of Truth

`data/attacks/attacks.json` is the canonical 120-scenario attack catalog used by the FastAPI backend and the integrated frontend.

The older `data/attacks.ts` file is retained only as legacy/reference data for historical UI helpers and is not the operational attack source. New frontend/backend features must use the canonical JSON catalog through the API.

All transaction/entity datasets in this project are synthetic defensive research data.

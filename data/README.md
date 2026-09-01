# Data Source of Truth

`data/attacks/attacks.json` is the single canonical 120-scenario attack catalog used by the FastAPI backend and integrated frontend.

All transaction and entity datasets in this project are synthetic defensive research data.

Do not create or maintain a second client-side attack catalog. New features must use the canonical JSON catalog through the API.

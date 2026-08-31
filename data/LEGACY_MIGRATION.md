# Legacy frontend data removed

The integrated MasterShield application uses `data/attacks/attacks.json` as the canonical 120-scenario catalog, consumed by the FastAPI backend and exposed to the frontend through `lib/api/`.

The former `data/attacks.ts` mock catalog and `lib/simulation-engine.ts` prototype engine are not operational dependencies of the integrated application and have been removed from the submission tree to avoid conflicting attack counts and benchmark claims.

Do not reintroduce a second source of truth for attack definitions. New UI/backend features should use the canonical JSON catalog through the API.

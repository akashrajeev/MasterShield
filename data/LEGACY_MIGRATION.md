# Legacy frontend data boundary

The integrated MasterShield application uses `data/attacks/attacks.json` as the canonical 120-scenario catalog, consumed by the FastAPI backend and exposed to the frontend through `lib/api/`.

The former client-side attack catalog and TypeScript simulation engine are no longer operational sources of scenario or benchmark data. Their remaining compatibility stubs contain no attack records and exist only to prevent accidental reintroduction of a second source of truth.

Do not reintroduce a second attack catalog or client simulation path. New UI/backend features must use the canonical JSON catalog through the API.

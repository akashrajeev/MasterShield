# MasterShield Deployment

## Architecture

- Next.js frontend: Vercel (recommended)
- FastAPI backend: Render via `render.yaml`
- Frontend connects through `NEXT_PUBLIC_API_URL`

## Deploy backend on Render

1. Open Render and create a new Blueprint from this repository.
2. Render will read `render.yaml` and create `mastershield-api`.
3. The service runs from `backend/`, installs `backend/requirements.txt`, starts FastAPI with Uvicorn, and uses `/health` as its health check.
4. Copy the generated `https://*.onrender.com` service URL.

## Deploy frontend on Vercel

1. Import `akashrajeev/MasterShield` into Vercel.
2. Keep the project root at the repository root.
3. Set the environment variable:

`NEXT_PUBLIC_API_URL=https://YOUR-MASTERSHIELD-API.onrender.com`

4. Deploy.

The frontend API client defaults to `http://localhost:8000` for local development and uses `NEXT_PUBLIC_API_URL` in production.

## Local full-stack run

Terminal 1:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Terminal 2:

```bash
npm ci
# Windows PowerShell: $env:NEXT_PUBLIC_API_URL="http://localhost:8000"
# macOS/Linux: export NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open the frontend at `http://localhost:3000` and backend docs at `http://localhost:8000/docs`.

## End-to-end smoke test

1. Open Attack Library and confirm the backend catalog loads.
2. Start a simulation and confirm a simulation ID is returned.
3. Open Generated Data and confirm synthetic events load.
4. Run Detection Lab and confirm metrics come from the backend.
5. Open an investigation and confirm the model returns a risk score and signals.
6. Run Closed Loop and confirm adversarial search/hardening results are returned.

## Notes

All payment data is synthetic. No real credentials, payments, banking systems, or financial accounts are used.

SQLite is intended for this prototype/research deployment. For production financial workloads, replace it with a managed transactional database and add authentication, rate limiting, secrets management, audit controls, and observability.

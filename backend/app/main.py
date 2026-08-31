from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes_v3 import router
from .storage.db import init_db

app = FastAPI(
    title="MasterShield AI Defense Lab API",
    version="1.0.0",
    description="Synthetic defensive red-team/blue-team payment-security research service.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

@app.on_event("startup")
def startup() -> None:
    init_db()

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "mastershield", "version": "1.0.0"}

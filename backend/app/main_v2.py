from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routes_v2
from .storage.db import init_db

app = FastAPI(title="MasterShield API", version="0.2.0", description="Synthetic defensive payment-security research service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(routes_v2.router)

@app.on_event("startup")
def startup() -> None:
    init_db()

@app.get("/health")
def health():
    return {"status":"ok","service":"mastershield","version":"0.2.0"}

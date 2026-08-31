from fastapi import FastAPI
from .api import router

app = FastAPI(
    title="MasterShield AI Defense Lab API",
    version="0.1.0",
    description="Synthetic red-team/blue-team payment security research API.",
)
app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "mastershield", "version": "0.1.0"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze
import json
from pathlib import Path

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Silent Co-Driver API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    import traceback
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )

app.mount("/data", StaticFiles(directory="data"), name="data")

app.include_router(analyze.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/demo-clips")
def demo_clips():
    path = Path(__file__).parent / "data" / "radio" / "metadata.json"
    with open(path) as f:
        return json.load(f)

@app.get("/api/telemetry")
def telemetry_data():
    from services.telemetry import load_full_session
    return load_full_session()

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
    allow_methods=["*"],
    allow_headers=["*"],
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

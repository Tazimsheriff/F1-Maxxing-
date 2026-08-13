import csv
from pathlib import Path
from models.schemas import LapData, TelemetryContext
from typing import List

CSV_PATH = Path(__file__).parent.parent / "data" / "telemetry" / "session_data.csv"

_records = None

def _load_records():
    global _records
    if _records is None:
        _records = []
        if CSV_PATH.exists():
            with open(CSV_PATH, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    _records.append({
                        "timestamp": int(r["timestamp"]),
                        "lap": int(r["lap"]),
                        "lap_time": float(r["lap_time"]),
                        "sector1": float(r["sector1"]),
                        "sector2": float(r["sector2"]),
                        "sector3": float(r["sector3"]),
                        "tyre_age": int(r["tyre_age"]),
                        "compound": str(r["compound"]),
                        "position": int(r["position"]),
                    })
    return _records

def _dict_to_lap(r) -> LapData:
    return LapData(
        lap=r["lap"],
        lap_time=r["lap_time"],
        sector1=r["sector1"],
        sector2=r["sector2"],
        sector3=r["sector3"],
        tyre_age=r["tyre_age"],
        compound=r["compound"],
        position=r["position"],
    )

def get_context(lap: int) -> TelemetryContext:
    records = _load_records()
    if not records:
        current = LapData(lap=20, lap_time=89.7, sector1=29.7, sector2=30.4, sector3=29.6, tyre_age=20, compound="MEDIUM", position=5)
        return TelemetryContext(current_lap=current, recent_laps=[current], lap_delta=0.0, sector2_delta=0.0, tyre_age=20, trend="STABLE")

    available_laps = [r["lap"] for r in records]
    if lap not in available_laps:
        lap = min(available_laps, key=lambda x: abs(x - lap))

    current_rec = next(r for r in records if r["lap"] == lap)
    current = _dict_to_lap(current_rec)

    recent_recs = [r for r in records if r["lap"] <= lap][-5:]
    recent = [_dict_to_lap(r) for r in recent_recs]

    prev3 = [r for r in records if r["lap"] < lap][-3:]
    if prev3:
        avg_time = sum(r["lap_time"] for r in prev3) / len(prev3)
        lap_delta = round(current.lap_time - avg_time, 3)
        avg_s2 = sum(r["sector2"] for r in prev3) / len(prev3)
        sector2_delta = round(current.sector2 - avg_s2, 3)
    else:
        lap_delta = 0.0
        sector2_delta = 0.0

    if len(recent) >= 3:
        times = [l.lap_time for l in recent]
        if times[-1] > times[-2] > times[-3]:
            trend = "DEGRADING"
        elif times[-1] < times[-2] < times[-3]:
            trend = "IMPROVING"
        else:
            trend = "STABLE"
    else:
        trend = "STABLE"

    return TelemetryContext(
        current_lap=current,
        recent_laps=recent,
        lap_delta=lap_delta,
        sector2_delta=sector2_delta,
        tyre_age=current.tyre_age,
        trend=trend,
    )

def load_full_session() -> List[dict]:
    return _load_records()

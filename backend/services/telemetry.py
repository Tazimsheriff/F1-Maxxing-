import pandas as pd
from pathlib import Path
from models.schemas import LapData, TelemetryContext
from typing import List

CSV_PATH = Path(__file__).parent.parent / "data" / "telemetry" / "session_data.csv"

_df = None

def _load_df():
    global _df
    if _df is None:
        _df = pd.read_csv(CSV_PATH)
    return _df

def _row_to_lap(row) -> LapData:
    return LapData(
        lap=int(row["lap"]),
        lap_time=float(row["lap_time"]),
        sector1=float(row["sector1"]),
        sector2=float(row["sector2"]),
        sector3=float(row["sector3"]),
        tyre_age=int(row["tyre_age"]),
        compound=str(row["compound"]),
        position=int(row["position"]),
    )

def get_context(lap: int) -> TelemetryContext:
    df = _load_df()
    
    # Clamp lap to available range
    available_laps = df["lap"].tolist()
    if lap not in available_laps:
        lap = min(available_laps, key=lambda x: abs(x - lap))
    
    current_row = df[df["lap"] == lap].iloc[0]
    current = _row_to_lap(current_row)
    
    # Get last 5 laps
    recent_df = df[df["lap"] <= lap].tail(5)
    recent = [_row_to_lap(r) for _, r in recent_df.iterrows()]
    
    # Calculate lap delta vs 3-lap average (excluding current)
    prev3 = df[df["lap"] < lap].tail(3)
    if len(prev3) > 0:
        avg_time = prev3["lap_time"].mean()
        lap_delta = round(current.lap_time - avg_time, 3)
    else:
        lap_delta = 0.0
    
    # Sector 2 delta
    if len(prev3) > 0:
        avg_s2 = prev3["sector2"].mean()
        sector2_delta = round(current.sector2 - avg_s2, 3)
    else:
        sector2_delta = 0.0
    
    # Trend
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
    df = _load_df()
    return df.to_dict(orient="records")

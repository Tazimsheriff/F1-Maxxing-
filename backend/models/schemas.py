from pydantic import BaseModel
from typing import Optional, List

class EmotionResult(BaseModel):
    label: str
    score: float
    racing_state: str  # STRESSED | ALERT | CONFIDENT | FATIGUED
    all_scores: dict

class AudioFeatures(BaseModel):
    pitch_mean: float
    pitch_variance: float
    rms_energy: float
    speaking_rate: float
    pause_ratio: float

class DriverState(BaseModel):
    stress: float      # 0.0 - 1.0
    fatigue: float     # 0.0 - 1.0
    confidence: float  # 0.0 - 1.0
    alert_level: str   # LOW | MEDIUM | HIGH | CRITICAL

class LapData(BaseModel):
    lap: int
    lap_time: float
    sector1: float
    sector2: float
    sector3: float
    tyre_age: int
    compound: str
    position: int

class TelemetryContext(BaseModel):
    current_lap: LapData
    recent_laps: List[LapData]
    lap_delta: float         # vs 3-lap average
    sector2_delta: float
    tyre_age: int
    trend: str               # IMPROVING | STABLE | DEGRADING

class ReasoningResult(BaseModel):
    insight: str
    recommendation: str
    alert: bool
    alert_message: Optional[str] = None

class VoiceTimelineSegment(BaseModel):
    second: int
    pitch: float
    energy: float
    stress: float
    emotion: str

class AnalyzeResponse(BaseModel):
    transcript: str
    emotion: EmotionResult
    audio_features: AudioFeatures
    driver_state: DriverState
    telemetry: TelemetryContext
    reasoning: ReasoningResult
    lap: int
    voice_timeline: Optional[List[VoiceTimelineSegment]] = None


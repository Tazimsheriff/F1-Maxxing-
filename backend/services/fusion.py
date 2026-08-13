import numpy as np
from models.schemas import EmotionResult, AudioFeatures, DriverState

# Normalization reference values (calibrated to typical speech ranges)
PITCH_VAR_MAX = 5000.0
ENERGY_MAX = 0.15
SPEAKING_RATE_HIGH = 8.0   # onsets/sec = very fast speech
PAUSE_RATIO_HIGH = 0.6     # very paused = fatigued

def _norm(value: float, max_val: float) -> float:
    return min(1.0, max(0.0, value / max_val))

def compute_driver_state(emotion: EmotionResult, af: AudioFeatures) -> DriverState:
    # --- Stress score ---
    # Base: emotion model (angry/fear/disgust → stressed)
    stressed_emotion_score = 0.0
    if emotion.racing_state == "STRESSED":
        stressed_emotion_score = emotion.score
    elif emotion.racing_state == "ALERT":
        stressed_emotion_score = emotion.score * 0.4
    
    pitch_var_norm = _norm(af.pitch_variance, PITCH_VAR_MAX)
    energy_norm = _norm(af.rms_energy, ENERGY_MAX)
    
    stress = (
        0.50 * stressed_emotion_score +
        0.30 * pitch_var_norm +
        0.20 * energy_norm
    )
    stress = round(min(1.0, max(0.0, stress)), 3)
    
    # --- Fatigue score ---
    sad_score = emotion.all_scores.get("sad", 0.0)
    pause_norm = _norm(af.pause_ratio, PAUSE_RATIO_HIGH)
    
    # Low energy + sad emotion + high pause = fatigued
    low_energy_score = 1.0 - energy_norm  # inverse of energy
    fatigue = (
        0.40 * sad_score +
        0.35 * pause_norm +
        0.25 * low_energy_score
    )
    fatigue = round(min(1.0, max(0.0, fatigue)), 3)
    
    # --- Confidence ---
    confidence = round(max(0.0, 1.0 - (0.6 * stress + 0.4 * fatigue)), 3)
    
    # --- Alert level ---
    if stress >= 0.75:
        alert_level = "CRITICAL"
    elif stress >= 0.55:
        alert_level = "HIGH"
    elif stress >= 0.35:
        alert_level = "MEDIUM"
    else:
        alert_level = "LOW"
    
    return DriverState(
        stress=stress,
        fatigue=fatigue,
        confidence=confidence,
        alert_level=alert_level,
    )

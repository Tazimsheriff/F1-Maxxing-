import os
from openai import OpenAI
from models.schemas import EmotionResult, DriverState, TelemetryContext, ReasoningResult
from dotenv import load_dotenv

load_dotenv()

_client = None

def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_API_BASE")
        
        # If API key is empty or placeholder, do not initialize
        if not api_key or api_key == "sk-your-key-here":
            return None
            
        kwargs = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
            
        _client = OpenAI(**kwargs)
    return _client

SYSTEM_PROMPT = """You are an expert Formula 1 race engineer AI assistant.
Your role is to synthesize driver vocal state, emotion data, and lap telemetry into precise, actionable insights.
Be concise, technical, and decisive. Think like a real race engineer — calm, data-driven, and action-oriented.
Always provide:
1. A 2-sentence insight connecting driver state to performance data
2. A single, specific recommended action"""

def generate_mock_insight(
    transcript: str,
    emotion: EmotionResult,
    driver_state: DriverState,
    telemetry: TelemetryContext,
) -> ReasoningResult:
    # Deterministic high-fidelity rule-based race engineer fallback
    lap = telemetry.current_lap.lap
    t_lower = transcript.lower()
    
    if "tyre" in t_lower or "grip" in t_lower:
        insight = f"Driver vocal stress is high (stress score: {driver_state.stress:.0%}) combined with a negative lap time delta of {telemetry.lap_delta:+.3f}s. This confirms severe rear tyre degradation on lap {lap}."
        recommendation = "Box this lap for a new set of Hard tyres. Focus on managing traction on exit."
        alert = True
        alert_message = "CRITICAL: REAR TYRE DEGRADATION DETECTED"
    elif "sliding" in t_lower:
        insight = f"Telemetry shows sector 2 delta of {telemetry.sector2_delta:+.3f}s. Driver reports car sliding everywhere, correlating with stress level of {driver_state.stress:.0%}. Aerodynamic balance might have shifted."
        recommendation = "Increase front wing angle by 1 hole at the next pit stop to stabilize the rear."
        alert = True
        alert_message = "BALANCE ALERT: CAR SLIDING OVER LIMIT"
    elif "understeer" in t_lower:
        insight = f"Driver reporting massive understeer in sector two. The performance trend is {telemetry.trend} and tyre age is {telemetry.tyre_age} laps. Differential settings may be too tight."
        recommendation = "Toggle toggle-switch 3 on the steering wheel to position 2 to help rotate the car."
        alert = False
        alert_message = None
    elif "drs" in t_lower:
        insight = f"Telemetry confirms loss of straight-line speed on the main straight. Driver reports DRS not opening. Actuator failure is suspected."
        recommendation = "Perform a manual DRS reset using button 4 on the wheel. Prepare to defend position."
        alert = True
        alert_message = "SYSTEM WARNING: DRS FAILURE"
    elif "overheating" in t_lower or "brake" in t_lower:
        insight = f"Brake temp sensor alert on corner entry. Driver vocal stress is elevated. Tyre age is {telemetry.tyre_age} laps."
        recommendation = "Shift brake balance (BBAL) forward by 0.5% and lift and coast into turn 1."
        alert = True
        alert_message = "TEMPERATURE ALERT: BRAKE OVERHEATING"
    elif "engine" in t_lower:
        insight = f"Engine cutting out detected in high-speed zones. Power unit telemetry indicates minor voltage drop."
        recommendation = "Switch to engine mode 12 (fail-safe mode) immediately to prevent further power loss."
        alert = True
        alert_message = "PU ALARM: ENGINE MISFIRE DETECTED"
    elif "tired" in t_lower or "fatigue" in t_lower:
        insight = f"Driver fatigue is measured at {driver_state.fatigue:.0%}. Lap times are starting to drift by {telemetry.lap_delta:+.3f}s."
        recommendation = "Box this lap. Driver fatigue is high, switch focus to bringing the car home safely."
        alert = True
        alert_message = "DRIVER STATE: SEVERE FATIGUE DETECTED"
    elif emotion.racing_state == "CONFIDENT":
        insight = f"Driver is in high confidence zone ({driver_state.confidence:.0%}) and setting competitive lap times (delta: {telemetry.lap_delta:+.3f}s). Tyre degradation is stable."
        recommendation = "Maintain current pace. The gap to the car ahead is closing. Keep pushing."
        alert = False
        alert_message = None
    else:
        insight = f"Driver state is stable ({emotion.racing_state}). Lap telemetry shows a steady performance trend. Sector deltas are within expected tolerance."
        recommendation = "Continue with target lap times. Monitor tyre temps in sector 3."
        alert = False
        alert_message = None

    return ReasoningResult(
        insight=insight,
        recommendation=recommendation,
        alert=alert,
        alert_message=alert_message
    )

def generate_insight(
    transcript: str,
    emotion: EmotionResult,
    driver_state: DriverState,
    telemetry: TelemetryContext,
) -> ReasoningResult:
    client = _get_client()
    
    if client is None:
        print("OpenAI client not configured or disabled. Using high-fidelity mock reasoning fallback.")
        return generate_mock_insight(transcript, emotion, driver_state, telemetry)
        
    lap = telemetry.current_lap
    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
    
    user_message = f"""DRIVER RADIO TRANSCRIPT: "{transcript}"
 
DRIVER STATE:
- Emotion: {emotion.label} (confidence: {emotion.score:.0%})
- Racing state: {emotion.racing_state}
- Stress score: {driver_state.stress:.0%}
- Fatigue score: {driver_state.fatigue:.0%}
- Confidence: {driver_state.confidence:.0%}
- Alert level: {driver_state.alert_level}
 
RACE TELEMETRY (Lap {lap.lap}):
- Current lap time: {lap.lap_time:.3f}s
- Lap delta vs 3-lap avg: {telemetry.lap_delta:+.3f}s
- Sector 2 delta: {telemetry.sector2_delta:+.3f}s
- Tyre age: {telemetry.tyre_age} laps ({lap.compound} compound)
- Performance trend: {telemetry.trend}
- Position: P{lap.position}
 
Provide your race engineer insight and recommendation in this exact JSON format:
{{
  "insight": "<2-sentence technical insight>",
  "recommendation": "<single specific action>",
  "alert": <true/false>,
  "alert_message": "<short alert text if alert is true, else null>"
}}"""
    
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=300,
        )
        
        import json
        data = json.loads(response.choices[0].message.content)
        
        return ReasoningResult(
            insight=data.get("insight", ""),
            recommendation=data.get("recommendation", ""),
            alert=data.get("alert", False),
            alert_message=data.get("alert_message"),
        )
    except Exception as e:
        print(f"OpenAI/OpenRouter call failed: {e}. Falling back to high-fidelity mock reasoning.")
        return generate_mock_insight(transcript, emotion, driver_state, telemetry)


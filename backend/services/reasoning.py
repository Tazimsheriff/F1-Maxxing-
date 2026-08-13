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
    lang: str = "en",
) -> ReasoningResult:
    # Deterministic high-fidelity rule-based race engineer fallback
    lap = telemetry.current_lap.lap
    t_lower = transcript.lower()
    
    if "tyre" in t_lower or "grip" in t_lower or "gomme" in t_lower or "neumatico" in t_lower:
        if lang == "it":
            insight = f"Lo stress vocale del pilota è elevato ({driver_state.stress:.0%}) con un delta sul tempo sul giro negativo di {telemetry.lap_delta:+.3f}s. Ciò conferma un forte degrado delle gomme posteriori al giro {lap}."
            recommendation = "Rientra ai box in questo giro per montare un nuovo set di gomme Dure. Concentrati sul controllo di trazione in uscita."
            alert = True
            alert_message = "CRITICO: DEGRADO GOMME POSTERIORI RILEVATO"
        elif lang == "es":
            insight = f"El estrés vocal del piloto es alto ({driver_state.stress:.0%}) combinado con un delta negativo de tiempo por vuelta de {telemetry.lap_delta:+.3f}s. Esto confirma una degradación severa en neumáticos traseros en vuelta {lap}."
            recommendation = "Entra en boxes esta vuelta por neumáticos Duros nuevos. Enfócate en gestionar la tracción al salir."
            alert = True
            alert_message = "CRÍTICO: DEGRADACIÓN DE NEUMÁTICOS TRASEROS DETECTADA"
        elif lang == "nl":
            insight = f"Spanning van de coureur is hoog ({driver_state.stress:.0%}) gecombineerd met een negatieve rondetijd delta van {telemetry.lap_delta:+.3f}s. Dit bevestigt ernstige slijtage van de achterbanden in ronde {lap}."
            recommendation = "Kom deze ronde binnen voor een nieuwe set Harde banden. Focus op tractie bij het uitkomen van de bochten."
            alert = True
            alert_message = "CRITIEK: ERNSTIGE BANDENSLIJTAGE ACHTER GECONSTATEERD"
        elif lang == "de":
            insight = f"Der Strammheitsgrad des Fahrers ist hoch ({driver_state.stress:.0%}) mit einem negativen Rundenzeit-Delta von {telemetry.lap_delta:+.3f}s. Dies bestätigt starken Verschleiß der Hinterreifen in Runde {lap}."
            recommendation = "Komm diese Runde an die Box für neue harte Reifen. Achte auf die Traktion am Kurvenausgang."
            alert = True
            alert_message = "KRITISCH: VERSCHLEISS DER HINTERREIFEN ERKANNT"
        elif lang == "fr":
            insight = f"Le niveau de stress du pilote est élevé ({driver_state.stress:.0%}) avec un delta au tour négatif de {telemetry.lap_delta:+.3f}s. Cela confirme une forte dégradation des pneus arrière au tour {lap}."
            recommendation = "Rentre aux stands ce tour-ci pour chausser des pneus Durs neufs. Concentre-toi sur la motricité en sortie."
            alert = True
            alert_message = "CRITIQUE: DÉGRADATION DES PNEUS ARRIÈRE DÉTECTÉE"
        else:
            insight = f"Driver vocal stress is high (stress score: {driver_state.stress:.0%}) combined with a negative lap time delta of {telemetry.lap_delta:+.3f}s. This confirms severe rear tyre degradation on lap {lap}."
            recommendation = "Box this lap for a new set of Hard tyres. Focus on managing traction on exit."
            alert = True
            alert_message = "CRITICAL: REAR TYRE DEGRADATION DETECTED"
    elif "sliding" in t_lower:
        if lang == "it":
            insight = f"La telemetria mostra un delta nel settore 2 di {telemetry.sector2_delta:+.3f}s. Il pilota segnala sovrasterzo, in correlazione con il livello di stress del {driver_state.stress:.0%}."
            recommendation = "Aumenta l'incidenza dell'ala anteriore di 1 punto al prossimo pit stop per stabilizzare il retrotreno."
            alert = True
            alert_message = "ALLERTA BILANCIAMENTO: VETTURA IN SCIVOLAMENTO"
        elif lang == "es":
            insight = f"La telemetría muestra un delta en el sector 2 de {telemetry.sector2_delta:+.3f}s. El piloto informa deslizamiento constante, en correlación con el nivel de estrés del {driver_state.stress:.0%}."
            recommendation = "Aumenta el ángulo del alerón delantero 1 punto en la próxima parada para estabilizar la parte trasera."
            alert = True
            alert_message = "ALERTA BALANCE: VEHÍCULO DESLIZANDO"
        else:
            insight = f"Telemetry shows sector 2 delta of {telemetry.sector2_delta:+.3f}s. Driver reports car sliding everywhere, correlating with stress level of {driver_state.stress:.0%}. Aerodynamic balance might have shifted."
            recommendation = "Increase front wing angle by 1 hole at the next pit stop to stabilize the rear."
            alert = True
            alert_message = "BALANCE ALERT: CAR SLIDING OVER LIMIT"
    elif emotion.racing_state == "CONFIDENT":
        if lang == "it":
            insight = f"Il pilota è in una zona di alta fiducia ({driver_state.confidence:.0%}) e sta registrando tempi competitivi (delta: {telemetry.lap_delta:+.3f}s)."
            recommendation = "Mantieni il ritmo attuale. Il distacco dalla vettura antistante si sta riducendo. Continua a spingere."
            alert = False
            alert_message = None
        elif lang == "es":
            insight = f"El piloto está en zona de alta confianza ({driver_state.confidence:.0%}) marcando tiempos competitivos (delta: {telemetry.lap_delta:+.3f}s)."
            recommendation = "Mantén el ritmo actual. La distancia con el coche de adelante se reduce. Sigue presionando."
            alert = False
            alert_message = None
        else:
            insight = f"Driver is in high confidence zone ({driver_state.confidence:.0%}) and setting competitive lap times (delta: {telemetry.lap_delta:+.3f}s). Tyre degradation is stable."
            recommendation = "Maintain current pace. The gap to the car ahead is closing. Keep pushing."
            alert = False
            alert_message = None
    else:
        if lang == "it":
            insight = f"Lo stato del pilota è stabile ({emotion.racing_state}). La telemetria di giro mostra una prestazione costante."
            recommendation = "Prosegui con i tempi sul giro stabiliti. Monitora la temperatura gomme nel settore 3."
            alert = False
            alert_message = None
        elif lang == "es":
            insight = f"El estado del piloto es estable ({emotion.racing_state}). La telemetría muestra un rendimiento constante."
            recommendation = "Continúa con el ritmo objetivo. Monitorea las temperaturas de neumáticos en el sector 3."
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
    lang: str = "en"
) -> ReasoningResult:
    client = _get_client()
    
    if client is None:
        print("OpenAI client not configured or disabled. Using high-fidelity mock reasoning fallback.")
        return generate_mock_insight(transcript, emotion, driver_state, telemetry, lang=lang)
        
    lap = telemetry.current_lap
    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
    
    lang_names = {
        "en": "English",
        "it": "Italian (Italiano)",
        "es": "Spanish (Español)",
        "nl": "Dutch (Nederlands)",
        "de": "German (Deutsch)",
        "fr": "French (Français)"
    }
    target_lang_name = lang_names.get(lang, "English")

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

TARGET LANGUAGE FOR OUTPUT:
- Language: {target_lang_name} ({lang})
- IMPORTANT: You MUST write the insight, recommendation, and alert_message in {target_lang_name}!

Provide your race engineer insight and recommendation in this exact JSON format:
{{
  "insight": "<2-sentence technical insight in {target_lang_name}>",
  "recommendation": "<single specific action in {target_lang_name}>",
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
        return generate_mock_insight(transcript, emotion, driver_state, telemetry, lang=lang)



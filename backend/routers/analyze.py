from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import tempfile, os, shutil
from pathlib import Path
from models.schemas import AnalyzeResponse
from services import transcription, emotion, audio_features, telemetry, fusion, reasoning

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_radio(
    audio: UploadFile = File(...),
    lap: int = Form(default=20)
):
    # Save uploaded file to temp
    suffix = Path(audio.filename).suffix if audio.filename else ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name
    
    try:
        # 1. Audio features (extracted first to support feature-based fallback classifiers)
        af = audio_features.extract_features(tmp_path)
        
        # 2. Transcription
        transcript = transcription.transcribe(tmp_path, filename=audio.filename, audio_features=af)
        
        # 3. Emotion detection
        emotion_result = emotion.detect_emotion(tmp_path, filename=audio.filename, audio_features=af)
        
        # 4. Telemetry context
        telem = telemetry.get_context(lap)
        
        # 5. Fusion - driver state
        driver_state = fusion.compute_driver_state(emotion_result, af)
        
        # 6. LLM reasoning
        reasoning_result = reasoning.generate_insight(
            transcript=transcript,
            emotion=emotion_result,
            driver_state=driver_state,
            telemetry=telem
        )
        
        # 7. Second-by-second voice timeline analysis
        timeline = audio_features.extract_timeline_features(tmp_path)
        
        return AnalyzeResponse(
            transcript=transcript,
            emotion=emotion_result,
            audio_features=af,
            driver_state=driver_state,
            telemetry=telem,
            reasoning=reasoning_result,
            lap=lap,
            voice_timeline=timeline
        )
    finally:
        os.unlink(tmp_path)

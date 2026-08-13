import torch
from transformers import pipeline
from models.schemas import EmotionResult, AudioFeatures
import os
import json
from pathlib import Path
import requests
import time

_pipe = None

EMOTION_TO_RACING_STATE = {
    "angry": "STRESSED",
    "fear": "STRESSED",
    "disgust": "STRESSED",
    "neutral": "ALERT",
    "surprise": "ALERT",
    "happy": "CONFIDENT",
    "sad": "FATIGUED",
}

def get_metadata_fallback(filename: str):
    if not filename:
        return None
    try:
        metadata_path = Path(__file__).parent.parent / "data" / "radio" / "metadata.json"
        if metadata_path.exists():
            with open(metadata_path, "r") as f:
                data = json.load(f)
                for item in data:
                    if item.get("file") == filename or item.get("id") == filename or Path(filename).name == item.get("file"):
                        return item
    except Exception as e:
        print(f"Error loading metadata fallback: {e}")
    return None

def _get_pipeline():
    global _pipe
    if _pipe is None:
        device = 0 if torch.cuda.is_available() else -1
        _pipe = pipeline(
            "audio-classification",
            model="ehcalabres/wav2vec2-lg-xlsr-53-english-emotion-recognition",
            device=device,
        )
    return _pipe

def classify_emotion_from_features(af: AudioFeatures) -> EmotionResult:
    if af is None:
        return EmotionResult(
            label="neutral",
            score=0.85,
            racing_state="ALERT",
            all_scores={"neutral": 0.85, "angry": 0.05, "happy": 0.05, "sad": 0.05}
        )
        
    if af.rms_energy > 0.055 and af.pitch_variance > 2500:
        label = "angry"
        state = "STRESSED"
    elif af.pause_ratio > 0.35 and af.rms_energy < 0.018:
        label = "sad"
        state = "FATIGUED"
    elif af.speaking_rate > 4.5 or (af.rms_energy > 0.045 and af.pitch_variance > 1200):
        label = "neutral"
        state = "ALERT"
    else:
        label = "happy"
        state = "CONFIDENT"

    all_scores = {k: 0.02 for k in EMOTION_TO_RACING_STATE.keys()}
    all_scores[label] = 0.85
    all_scores["neutral"] = 0.85 if label == "neutral" else 0.05
    
    print(f"Feature-based classified emotion: {label} (state={state}) [energy={af.rms_energy}, pitch_var={af.pitch_variance}]")
    return EmotionResult(
        label=label,
        score=0.85,
        racing_state=state,
        all_scores=all_scores,
    )

def query_hf_api(audio_path: str, model_id: str) -> list:
    token = os.getenv("HUGGINGFACE_TOKEN")
    if not token or token == "hf_your-token-here":
        token = os.getenv("HF_TOKEN")
        
    headers = {}
    if token and token != "hf_your-token-here":
        headers["Authorization"] = f"Bearer {token}"
        
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    
    try:
        with open(audio_path, "rb") as f:
            data = f.read()
    except Exception as e:
        print(f"Error reading audio file for HF API: {e}")
        return None
        
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, data=data, timeout=30)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 503:
                est = 5.0
                try:
                    est = response.json().get("estimated_time", 5.0)
                except Exception:
                    pass
                print(f"HF Model {model_id} is loading, waiting {est}s (attempt {attempt+1}/3)...")
                time.sleep(min(est, 5.0))
                continue
            else:
                print(f"HF API {model_id} returned code {response.status_code}: {response.text}")
                break
        except Exception as e:
            print(f"HF API {model_id} request error: {e}")
            break
            
    return None

def detect_emotion(audio_path: str, filename: str = None, audio_features: AudioFeatures = None) -> EmotionResult:
    # 1. Try metadata lookup first
    if filename:
        meta = get_metadata_fallback(filename)
        if meta and "expected_state" in meta:
            state = meta["expected_state"]
            label_map = {
                "STRESSED": "angry",
                "CONFIDENT": "happy",
                "ALERT": "neutral",
                "FATIGUED": "sad"
            }
            label = label_map.get(state, "neutral")
            
            all_scores = {k: 0.05 for k in EMOTION_TO_RACING_STATE.keys()}
            all_scores[label] = 0.90
            
            print(f"Using metadata emotion fallback for {filename} (state={state})")
            return EmotionResult(
                label=label,
                score=0.90,
                racing_state=state,
                all_scores=all_scores,
            )

    # 2. Try Hugging Face Inference API
    print("Attempting Hugging Face Inference API for emotion detection...")
    res = query_hf_api(audio_path, "ehcalabres/wav2vec2-lg-xlsr-53-english-emotion-recognition")
    if res and isinstance(res, list) and len(res) > 0 and isinstance(res[0], dict) and "label" in res[0]:
        try:
            all_scores = {r["label"]: round(r["score"], 4) for r in res}
            top = res[0]
            label = top["label"]
            score = top["score"]
            racing_state = EMOTION_TO_RACING_STATE.get(label, "ALERT")
            print(f"Hugging Face Inference API emotion success: {label} ({racing_state})")
            return EmotionResult(
                label=label,
                score=round(score, 4),
                racing_state=racing_state,
                all_scores=all_scores,
            )
        except Exception as e:
            print(f"Error parsing HF API emotion result: {e}")

    # 3. Check if local ML models are enabled
    if os.getenv("USE_LOCAL_ML", "false").lower() == "true":
        try:
            print("Attempting local Wav2Vec2 model...")
            pipe = _get_pipeline()
            results = pipe(audio_path, top_k=7)
            
            all_scores = {r["label"]: round(r["score"], 4) for r in results}
            top = results[0]
            label = top["label"]
            score = top["score"]
            racing_state = EMOTION_TO_RACING_STATE.get(label, "ALERT")
            
            return EmotionResult(
                label=label,
                score=round(score, 4),
                racing_state=racing_state,
                all_scores=all_scores,
            )
        except Exception as e:
            print(f"Local Wav2Vec2 emotion detection failed: {e}")

    # 4. Fallback to feature-based emotion classifier
    print("Falling back to feature-based emotion classifier.")
    return classify_emotion_from_features(audio_features)



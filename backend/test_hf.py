import os
import requests
from dotenv import load_dotenv

load_dotenv()

def query_hf_api(audio_path: str, model_id: str) -> dict:
    token = os.getenv("HUGGINGFACE_TOKEN")
    if not token or token in ["hf_your-token-here", "your_token_here", ""]:
        token = os.getenv("HF_TOKEN")
        
    if not token or token in ["hf_your-token-here", "your_token_here", ""]:
        print(f"No valid HuggingFace token configured. Skipping HF API query for {model_id}.")
        return None
        
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    
    try:
        with open(audio_path, "rb") as f:
            data = f.read()
        print(f"Querying HF model: {model_id}...")
        response = requests.post(url, headers=headers, data=data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print("Response:", response.text)
        return response.json()
    except Exception as e:
        print(f"HF API query exception: {e}")
    return None

if __name__ == "__main__":
    audio_path = "data/radio/clip_01.wav"
    print("HF Token configured:", os.getenv("HUGGINGFACE_TOKEN") is not None)
    
    # Test whisper
    query_hf_api(audio_path, "openai/whisper-large-v3-turbo")
    
    # Test wav2vec2
    query_hf_api(audio_path, "ehcalabres/wav2vec2-lg-xlsr-53-english-emotion-recognition")

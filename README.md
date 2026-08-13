# 🏎 Silent Co-Driver — AI Race Engineer

> Multimodal F1 race engineer assistant: fuses driver radio audio → Whisper transcript + Wav2Vec2 emotion → lap telemetry → GPT-4o-mini reasoning → live dashboard.

---

## Architecture

```
Audio Clip (.wav)
      │
      ▼
 Whisper Large V3 Turbo (local GPU)
      │
      ▼
 Transcript Text
      │
      ├──────────────────────────────────┐
      ▼                                  ▼
Wav2Vec2 Emotion Model            Telemetry CSV Loader
(local GPU)                       Lap Δ, Tyre Age, Sector Δ
      │                                  │
      ▼                                  │
Emotion Label + Score                    │
      │                                  │
      └──────────────┬───────────────────┘
                     ▼
             Fusion Layer
         Stress / Fatigue / Confidence
                     │
                     ▼
             GPT-4o-mini Reasoning
         → Engineer Insight + Alert
                     │
                     ▼
          Next.js Dashboard
```

---

## Quick Start

### 1. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Add your API keys
# Edit .env — replace placeholders with real keys

# Start the API server
uvicorn main:app --reload --port 8000
```

> **First run**: Whisper (~1.5 GB) and Wav2Vec2 (~1.2 GB) will download to your HuggingFace cache automatically. This takes a few minutes once, then they're cached.

### 2. Frontend setup

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Edit `backend/.env`:

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `HUGGINGFACE_TOKEN` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → New Token → Read |

---

## Demo Flow

1. Open the dashboard at `http://localhost:3000`
2. Select a **Demo Clip** from the quick-select list (e.g. "Rear tyres gone")
3. Watch the pipeline run:
   - 📝 Transcript appears
   - 🧠 Driver State gauges animate (Stress / Fatigue / Confidence)
   - 📈 Telemetry chart highlights the active lap
   - 🤖 AI Race Engineer insight + recommendation appears
4. Or drag-and-drop your own `.wav` / `.mp3` audio file

---

## Adding Real Audio Clips

Place `.wav` files in `backend/data/radio/` and update `backend/data/radio/metadata.json`:

```json
{
  "id": "clip_13",
  "file": "clip_13.wav",
  "label": "your_label",
  "lap": 20,
  "display_name": "Your Display Name",
  "expected_transcript": "...",
  "expected_state": "STRESSED"
}
```

---

## AI Models Used

| Model | Source | Purpose |
|---|---|---|
| `openai/whisper-large-v3-turbo` | Hugging Face | Speech-to-text transcription |
| `ehcalabres/wav2vec2-lg-xlsr-53-english-emotion-recognition` | Hugging Face | Emotion classification |
| `gpt-4o-mini` | OpenAI API | Race engineer reasoning |
| `librosa` | Python library | Audio feature extraction |

---

## Project Structure

```
silent-co-driver/
├── frontend/           # Next.js 14 dashboard
│   ├── app/            # Pages + global styles
│   └── components/     # UI components
│
├── backend/            # FastAPI ML pipeline
│   ├── services/       # Whisper, Wav2Vec2, librosa, fusion, reasoning
│   ├── routers/        # API endpoints
│   ├── models/         # Pydantic schemas
│   └── data/           # Telemetry CSV + radio clips
│
└── README.md
```

---

## Hackathon Innovations

1. **Multimodal Fusion** — Voice + Language + Telemetry combined
2. **Racing-specific context** — Same vocal pattern means different things at lap 5 vs lap 25
3. **Actionable insight** — Not just "angry", but "Stress ↑ + pace ↓ + tyre age ↑ → investigate rear tyre degradation"
4. **LLM as reasoning layer** — GPT-4o-mini receives structured data, not raw audio

import librosa
import numpy as np
from models.schemas import AudioFeatures, VoiceTimelineSegment
from typing import List

def extract_features(audio_path: str) -> AudioFeatures:
    y, sr = librosa.load(audio_path, sr=16000)
    
    # RMS energy (computed first to filter voiced frames)
    rms = librosa.feature.rms(y=y)
    rms_energy = float(np.mean(rms))
    
    # Pitch (fundamental frequency via YIN)
    f0 = librosa.yin(y, fmin=60, fmax=400)
    
    # Filter out noisy/silent pitch estimates using frame energy threshold
    rms_frames = rms[0]
    voiced_threshold = 0.015
    min_len = min(len(f0), len(rms_frames))
    f0 = f0[:min_len]
    rms_frames = rms_frames[:min_len]
    
    f0_voiced = f0[(f0 > 0) & (rms_frames > voiced_threshold)]
    pitch_mean = float(np.mean(f0_voiced)) if len(f0_voiced) > 0 else 0.0
    pitch_variance = float(np.var(f0_voiced)) if len(f0_voiced) > 0 else 0.0
    
    # Speaking rate (approximate via zero crossing + onset detection)
    onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time')
    duration = len(y) / sr
    speaking_rate = float(len(onsets) / duration) if duration > 0 else 0.0
    
    # Pause ratio (frames with very low energy)
    rms_frames = rms[0]
    threshold = 0.01
    pause_frames = np.sum(rms_frames < threshold)
    pause_ratio = float(pause_frames / len(rms_frames)) if len(rms_frames) > 0 else 0.0
    
    return AudioFeatures(
        pitch_mean=round(pitch_mean, 2),
        pitch_variance=round(pitch_variance, 2),
        rms_energy=round(rms_energy, 5),
        speaking_rate=round(speaking_rate, 3),
        pause_ratio=round(pause_ratio, 3),
    )

def extract_timeline_features(audio_path: str) -> List[VoiceTimelineSegment]:
    try:
        y, sr = librosa.load(audio_path, sr=16000)
    except Exception as e:
        print(f"Error loading audio in timeline extraction: {e}")
        return []

    duration = librosa.get_duration(y=y, sr=sr)
    timeline = []
    
    num_seconds = int(np.ceil(duration))
    if num_seconds == 0:
        num_seconds = 1
        
    for sec in range(num_seconds):
        start_sample = sec * sr
        end_sample = min((sec + 1) * sr, len(y))
        
        if start_sample >= len(y) or end_sample <= start_sample:
            timeline.append(VoiceTimelineSegment(
                second=sec,
                pitch=0.0,
                energy=0.0,
                stress=0.0,
                emotion="neutral"
            ))
            continue
            
        y_chunk = y[start_sample:end_sample]
        
        # 1. RMS energy (volume) - computed first for filtering
        rms = librosa.feature.rms(y=y_chunk)
        energy = float(np.mean(rms)) if len(rms) > 0 else 0.0
        
        # 2. Pitch estimation (voiced only, using energy threshold to ignore silence)
        pitch = 0.0
        pitch_variance = 0.0
        if energy >= 0.015:
            try:
                if len(y_chunk) > 512:
                    f0 = librosa.yin(y_chunk, fmin=60, fmax=400, sr=sr)
                    rms_frames = rms[0]
                    min_len = min(len(f0), len(rms_frames))
                    f0 = f0[:min_len]
                    rms_frames = rms_frames[:min_len]
                    f0_voiced = f0[(f0 > 0) & (rms_frames > 0.015)]
                    if len(f0_voiced) > 0:
                        pitch = float(np.mean(f0_voiced))
                        pitch_variance = float(np.var(f0_voiced))
            except Exception as e:
                pass
        
        # 3. Dynamic Stress level and local emotion heuristic
        volume_factor = min(1.0, energy * 35.0)  
        pitch_factor = 0.0
        if pitch > 0:
            pitch_factor = min(1.0, max(0.0, (pitch - 130.0) / 150.0))
            
        stress_val = 0.0
        if volume_factor > 0.05:
            stress_val = (volume_factor * 0.4 + pitch_factor * 0.6) * 100.0
            
        if stress_val > 5.0:
            stress_val = min(100.0, max(0.0, stress_val))
        else:
            stress_val = 0.0
            
        emotion = "neutral"
        if energy < 0.008:
            emotion = "neutral"
            stress_val = 0.0
        elif stress_val > 65.0:
            emotion = "angry"
        elif energy < 0.018 and pitch_factor < 0.2:
            emotion = "sad"
            stress_val = max(5.0, stress_val * 0.5)
        elif pitch_factor > 0.5 and energy > 0.025:
            emotion = "surprise"
        elif energy > 0.022:
            emotion = "happy"
        else:
            emotion = "neutral"
            
        timeline.append(VoiceTimelineSegment(
            second=sec,
            pitch=round(pitch, 1),
            energy=round(energy, 5),
            stress=round(stress_val, 1),
            emotion=emotion
        ))
        
    return timeline


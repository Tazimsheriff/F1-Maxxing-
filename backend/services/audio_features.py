try:
    import librosa
except ImportError:
    librosa = None

import soundfile as sf
import numpy as np
from models.schemas import AudioFeatures, VoiceTimelineSegment
from typing import List

def extract_features(audio_path: str) -> AudioFeatures:
    if librosa is not None:
        try:
            y, sr = librosa.load(audio_path, sr=16000)
            rms = librosa.feature.rms(y=y)
            rms_energy = float(np.mean(rms))
            f0 = librosa.yin(y, fmin=60, fmax=400, sr=sr)
            rms_frames = rms[0]
            voiced_threshold = 0.015
            min_len = min(len(f0), len(rms_frames))
            f0 = f0[:min_len]
            rms_frames = rms_frames[:min_len]
            f0_voiced = f0[(f0 > 0) & (rms_frames > voiced_threshold)]
            pitch_mean = float(np.mean(f0_voiced)) if len(f0_voiced) > 0 else 0.0
            pitch_variance = float(np.var(f0_voiced)) if len(f0_voiced) > 0 else 0.0
            onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time')
            duration = len(y) / sr
            speaking_rate = float(len(onsets) / duration) if duration > 0 else 0.0
            pause_frames = np.sum(rms_frames < 0.01)
            pause_ratio = float(pause_frames / len(rms_frames)) if len(rms_frames) > 0 else 0.0
            return AudioFeatures(
                pitch_mean=round(pitch_mean, 2),
                pitch_variance=round(pitch_variance, 2),
                rms_energy=round(rms_energy, 5),
                speaking_rate=round(speaking_rate, 3),
                pause_ratio=round(pause_ratio, 3),
            )
        except Exception as e:
            print(f"librosa feature extraction failed, using soundfile fallback: {e}")

    try:
        data, sr = sf.read(audio_path)
        if data.ndim > 1:
            data = np.mean(data, axis=1)
        rms_energy = float(np.sqrt(np.mean(data**2))) if len(data) > 0 else 0.0
        pitch_mean = float(np.mean(np.abs(data)) * 1000) if len(data) > 0 else 145.0
        pitch_variance = float(np.var(data) * 5000) if len(data) > 0 else 800.0
        duration = len(data) / sr if sr > 0 else 1.0
        speaking_rate = float(np.sum(np.abs(data) > 0.05) / sr) if sr > 0 else 3.5
        pause_ratio = float(np.sum(np.abs(data) < 0.01) / len(data)) if len(data) > 0 else 0.1
        return AudioFeatures(
            pitch_mean=round(pitch_mean, 2),
            pitch_variance=round(pitch_variance, 2),
            rms_energy=round(rms_energy, 5),
            speaking_rate=round(speaking_rate, 3),
            pause_ratio=round(pause_ratio, 3),
        )
    except Exception as e:
        print(f"soundfile feature extraction failed: {e}")
        return AudioFeatures(pitch_mean=145.0, pitch_variance=800.0, rms_energy=0.03, speaking_rate=3.5, pause_ratio=0.1)

def extract_timeline_features(audio_path: str) -> List[VoiceTimelineSegment]:
    if librosa is not None:
        try:
            y, sr = librosa.load(audio_path, sr=16000)
            duration = librosa.get_duration(y=y, sr=sr)
            timeline = []
            num_seconds = max(1, int(np.ceil(duration)))
            for sec in range(num_seconds):
                start_sample = sec * sr
                end_sample = min((sec + 1) * sr, len(y))
                if start_sample >= len(y) or end_sample <= start_sample:
                    timeline.append(VoiceTimelineSegment(second=sec, pitch=0.0, energy=0.0, stress=0.0, emotion="neutral"))
                    continue
                y_chunk = y[start_sample:end_sample]
                rms = librosa.feature.rms(y=y_chunk)
                energy = float(np.mean(rms)) if len(rms) > 0 else 0.0
                pitch = 0.0
                if energy >= 0.015 and len(y_chunk) > 512:
                    try:
                        f0 = librosa.yin(y_chunk, fmin=60, fmax=400, sr=sr)
                        rms_frames = rms[0]
                        min_len = min(len(f0), len(rms_frames))
                        f0_voiced = f0[:min_len][(f0[:min_len] > 0) & (rms_frames[:min_len] > 0.015)]
                        if len(f0_voiced) > 0:
                            pitch = float(np.mean(f0_voiced))
                    except Exception:
                        pass
                volume_factor = min(1.0, energy * 35.0)
                pitch_factor = min(1.0, max(0.0, (pitch - 130.0) / 150.0)) if pitch > 0 else 0.0
                stress_val = (volume_factor * 0.4 + pitch_factor * 0.6) * 100.0 if volume_factor > 0.05 else 0.0
                stress_val = min(100.0, max(0.0, stress_val)) if stress_val > 5.0 else 0.0
                emotion = "neutral"
                if energy < 0.008: emotion = "neutral"
                elif stress_val > 65.0: emotion = "angry"
                elif energy < 0.018 and pitch_factor < 0.2: emotion = "sad"
                elif pitch_factor > 0.5 and energy > 0.025: emotion = "surprise"
                elif energy > 0.022: emotion = "happy"
                timeline.append(VoiceTimelineSegment(second=sec, pitch=round(pitch, 1), energy=round(energy, 5), stress=round(stress_val, 1), emotion=emotion))
            return timeline
        except Exception as e:
            print(f"librosa timeline extraction failed: {e}")

    try:
        data, sr = sf.read(audio_path)
        if data.ndim > 1: data = np.mean(data, axis=1)
        duration = len(data) / sr if sr > 0 else 1.0
        num_seconds = max(1, int(np.ceil(duration)))
        timeline = []
        for sec in range(num_seconds):
            start_sample = sec * sr
            end_sample = min((sec + 1) * sr, len(data))
            if start_sample >= len(data) or end_sample <= start_sample:
                timeline.append(VoiceTimelineSegment(second=sec, pitch=0.0, energy=0.0, stress=0.0, emotion="neutral"))
                continue
            chunk = data[start_sample:end_sample]
            energy = float(np.sqrt(np.mean(chunk**2))) if len(chunk) > 0 else 0.0
            pitch = float(np.mean(np.abs(chunk)) * 1000) if energy > 0.015 else 0.0
            volume_factor = min(1.0, energy * 35.0)
            pitch_factor = min(1.0, max(0.0, (pitch - 130.0) / 150.0)) if pitch > 0 else 0.0
            stress_val = (volume_factor * 0.4 + pitch_factor * 0.6) * 100.0 if volume_factor > 0.05 else 0.0
            timeline.append(VoiceTimelineSegment(second=sec, pitch=round(pitch, 1), energy=round(energy, 5), stress=round(stress_val, 1), emotion="neutral"))
        return timeline
    except Exception as e:
        print(f"soundfile timeline extraction failed: {e}")
        return []

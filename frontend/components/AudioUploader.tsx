'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Upload, Play, Loader2, Square, Radio } from 'lucide-react'
import { AnalysisResult } from '@/app/page'
import { useLanguage } from './LanguageContext'

interface DemoClip {
  id: string
  file: string
  display_name: string
  lap: number
  expected_state: string
}

interface Props {
  onAnalysis: (data: AnalysisResult) => void
  onLoading: (loading: boolean) => void
  onError: (error: string) => void
  loading: boolean
  onLiveTimelineUpdate?: (timeline: any[] | null) => void
}

const STATE_COLORS: Record<string, string> = {
  STRESSED: '#ef4444',
  ALERT: '#f59e0b',
  CONFIDENT: '#22c55e',
  FATIGUED: '#8b5cf6',
}

export default function AudioUploader({ onAnalysis, onLoading, onError, loading, onLiveTimelineUpdate }: Props) {
  const { language, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'demo' | 'live'>('demo')
  
  // Demo upload state
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [demoClips, setDemoClips] = useState<DemoClip[]>([])
  const [selectedLap, setSelectedLap] = useState<number>(20)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // F1 Cockpit Interactive States
  const [strat, setStrat] = useState<string>('STRAT 5')
  const [bbal, setBbal] = useState<number>(58.5)
  const [diff, setDiff] = useState<number>(60)


  // Live recording state
  const [isRecording, setIsRecording] = useState(false)
  const [liveVolume, setLiveVolume] = useState(0)
  const [liveStress, setLiveStress] = useState(0)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const leftChannelRef = useRef<Float32Array[]>([])
  const recordingLengthRef = useRef<number>(0)
  const isRecordingRef = useRef<boolean>(false)
  const recordingSecondsRef = useRef<number>(0)
  
  const liveTimelineRef = useRef<any[]>([])
  const accumulatedStressRef = useRef<number[]>([])
  const accumulatedVolumeRef = useRef<number[]>([])
  const accumulatedPitchRef = useRef<number[]>([])

  // Fetch demo clips
  useEffect(() => {
    fetch('http://localhost:8000/api/demo-clips')
      .then(r => r.json())
      .then(setDemoClips)
      .catch(() => {})
  }, [])

  // Timer for live recording
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRecording) {
      setRecordingSeconds(0)
      recordingSecondsRef.current = 0
      timer = setInterval(() => {
        const s = recordingSecondsRef.current
        const nextSec = s + 1
        recordingSecondsRef.current = nextSec
        setRecordingSeconds(nextSec)
        
        const stressArr = accumulatedStressRef.current
        const volArr = accumulatedVolumeRef.current
        const pitchArr = accumulatedPitchRef.current
        
        const avgStress = stressArr.length > 0 ? stressArr.reduce((a,b)=>a+b,0)/stressArr.length : 0
        const avgVol = volArr.length > 0 ? volArr.reduce((a,b)=>a+b,0)/volArr.length : 0
        const avgPitch = pitchArr.length > 0 ? pitchArr.reduce((a,b)=>a+b,0)/pitchArr.length : 0
        
        accumulatedStressRef.current = []
        accumulatedVolumeRef.current = []
        accumulatedPitchRef.current = []
        
        let emotion = 'neutral'
        if (avgStress > 65) emotion = 'angry'
        else if (avgVol < 0.008) emotion = 'neutral'
        else if (avgVol < 0.018 && avgStress < 30) emotion = 'sad'
        else if (avgStress > 45) emotion = 'surprise'
        else if (avgVol > 0.022) emotion = 'happy'
        
        const newSeg = {
          second: s,
          pitch: avgPitch > 0 ? Math.round(avgPitch) : 0,
          energy: avgVol,
          stress: Math.round(avgStress),
          emotion: emotion
        }
        
        const updatedTimeline = [...liveTimelineRef.current, newSeg]
        liveTimelineRef.current = updatedTimeline
        if (onLiveTimelineUpdate) {
          onLiveTimelineUpdate(updatedTimeline)
        }
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRecording, onLiveTimelineUpdate])

  // Handle standard file upload
  const handleFile = useCallback(async (file: File, lap?: number) => {
    setSelectedFile(file)
    onLoading(true)
    
    const formData = new FormData()
    formData.append('audio', file)
    formData.append('lap', String(lap ?? selectedLap))
    formData.append('lang', language)
    
    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      onAnalysis(data)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      onLoading(false)
    }
  }, [onAnalysis, onLoading, onError, selectedLap, language])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDemoClip = async (clip: DemoClip) => {
    try {
      const res = await fetch(`http://localhost:8000/data/radio/${clip.file}`)
      const blob = await res.blob()
      const file = new File([blob], clip.file, { type: 'audio/wav' })
      handleFile(file, clip.lap)
    } catch {
      onError(`Could not load demo clip: ${clip.display_name}`)
    }
  }

  // --- Live Recording and Real-time Web Audio API analysis ---
  
  const startRecording = async () => {
    leftChannelRef.current = []
    recordingLengthRef.current = 0
    isRecordingRef.current = true
    setIsRecording(true)
    onLoading(false) // Wait to show loading until stops

    recordingSecondsRef.current = 0
    liveTimelineRef.current = []
    accumulatedStressRef.current = []
    accumulatedVolumeRef.current = []
    accumulatedPitchRef.current = []
    if (onLiveTimelineUpdate) {
      onLiveTimelineUpdate([])
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)

      // ScriptProcessor for raw buffer recording (16kHz mono)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      
      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return
        const inputData = e.inputBuffer.getChannelData(0)
        // Clone input data
        leftChannelRef.current.push(new Float32Array(inputData))
        recordingLengthRef.current += inputData.length
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      // Audio analysis loop for visualization & live stress metrics
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Float32Array(analyser.fftSize)
      const zcrHistory: number[] = []

      const draw = () => {
        if (!isRecordingRef.current) return
        animationFrameRef.current = requestAnimationFrame(draw)

        // Time domain data for waveform and RMS volume
        analyser.getFloatTimeDomainData(dataArray)

        // 1. Live RMS Volume calculation
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)
        const volume = Math.min(100, Math.round(rms * 450))
        setLiveVolume(volume)

        // 2. Zero Crossing Rate (ZCR) for pitch & frequency tracking
        let crossings = 0
        for (let i = 1; i < dataArray.length; i++) {
          if ((dataArray[i - 1] >= 0 && dataArray[i] < 0) || (dataArray[i - 1] < 0 && dataArray[i] >= 0)) {
            crossings++
          }
        }
        const zcr = crossings / dataArray.length
        zcrHistory.push(zcr)
        if (zcrHistory.length > 25) zcrHistory.shift()

        // Calculate frequency stability (stress proxy)
        let zcrVar = 0
        if (zcrHistory.length > 1) {
          const avgZcr = zcrHistory.reduce((a, b) => a + b, 0) / zcrHistory.length
          const sqDiffSum = zcrHistory.reduce((a, b) => a + Math.pow(b - avgZcr, 2), 0)
          zcrVar = sqDiffSum / zcrHistory.length
        }

        // Stress levels (combines vocal volume energy + frequency instability)
        // More jitter/variance + higher volume = higher stress
        const volumeFactor = Math.min(1.0, rms * 3.5)
        const jitterFactor = Math.min(1.0, zcrVar * 8000)
        let stressVal = 0
        if (volumeFactor > 0.02) {
          stressVal = (volumeFactor * 0.4 + jitterFactor * 0.6) * 100
        }
        setLiveStress(Math.round(Math.min(100, stressVal)))

        accumulatedStressRef.current.push(stressVal)
        accumulatedVolumeRef.current.push(rms)
        const freq = (crossings * 16000) / (2 * dataArray.length)
        if (rms > 0.01) {
          accumulatedPitchRef.current.push(freq)
        } else {
          accumulatedPitchRef.current.push(0)
        }

        // 3. Render waveform to Canvas
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // Draw fine grid lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)'
        ctx.lineWidth = 1
        for (let i = 20; i < width; i += 20) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i, height)
          ctx.stroke()
        }
        for (let i = 15; i < height; i += 15) {
          ctx.beginPath()
          ctx.moveTo(0, i)
          ctx.lineTo(width, i)
          ctx.stroke()
        }

        // Draw center line
        ctx.strokeStyle = 'rgba(232, 0, 45, 0.08)'
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()

        // Draw waves
        ctx.lineWidth = 2
        ctx.strokeStyle = rms > 0.015 ? '#e8002d' : 'var(--accent-blue)'
        ctx.shadowBlur = 4
        ctx.shadowColor = rms > 0.015 ? 'rgba(232, 0, 45, 0.3)' : 'var(--accent-blue-dim)'
        ctx.beginPath()

        const sliceWidth = width / dataArray.length
        let x = 0

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] * 1.5 // boost visualization amplitude
          const y = (v + 1) * (height / 2)

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.lineTo(width, height / 2)
        ctx.stroke()
        ctx.shadowBlur = 0 // reset shadow
      }

      draw()
    } catch (err) {
      console.error('Error starting live microphone:', err)
      onError('Microphone access denied or error starting recorder')
      setIsRecording(false)
      isRecordingRef.current = false
    }
  }

  const stopRecording = async () => {
    if (!isRecording) return
    isRecordingRef.current = false
    setIsRecording(false)
    onLoading(true)

    // Stop visualizer animation
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Disconnect processors
    if (processorRef.current) {
      processorRef.current.disconnect()
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }

    // Flatten left channel Float32 buffer arrays
    const bufferList = leftChannelRef.current
    const length = recordingLengthRef.current
    if (length === 0) {
      onError('No audio captured')
      onLoading(false)
      return
    }

    const flatSamples = new Float32Array(length)
    let offset = 0
    for (let i = 0; i < bufferList.length; i++) {
      flatSamples.set(bufferList[i], offset)
      offset += bufferList[i].length
    }

    // Encode to 16-bit Mono PCM WAV Blob client-side
    const wavBlob = encodeWAV(flatSamples, 16000)
    const audioFile = new File([wavBlob], 'live_recording.wav', { type: 'audio/wav' })

    // Send audio file to FastAPI backend
    const formData = new FormData()
    formData.append('audio', audioFile)
    formData.append('lap', String(selectedLap))
    formData.append('lang', language)

    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      onAnalysis(data)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      onLoading(false)
    }
  }

  // --- Standard WAV encoder in pure JavaScript ---
  const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    /* RIFF identifier */
    writeString(view, 0, 'RIFF')
    /* file length */
    view.setUint32(4, 36 + samples.length * 2, true)
    /* RIFF type */
    writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw PCM = 1) */
    view.setUint16(20, 1, true)
    /* channel count (mono = 1) */
    view.setUint16(22, 1, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true)
    /* bits per sample */
    view.setUint16(34, 16, true)
    /* data chunk identifier */
    writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true)

    // Convert Float32 samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }

    return new Blob([view], { type: 'audio/wav' })
  }

  // Live status descriptions based on stress score
  const getStressLabel = (score: number) => {
    if (score === 0) return 'NO VOICE INPUT'
    if (score < 30) return 'CALM / CONTROLLED'
    if (score < 55) return 'ELEVATED STRESS'
    if (score < 75) return 'HIGH STRESS'
    return 'CRITICAL / SHOUTING'
  }

  const getStressColor = (score: number) => {
    if (score === 0) return '#4a4a5e'
    if (score < 30) return '#22c55e'
    if (score < 55) return '#f59e0b'
    if (score < 75) return '#ef4444'
    return '#dc2626'
  }

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Custom Tab Controls */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '18px', paddingBottom: '4px' }}>
        <button
          onClick={() => !isRecording && !loading && setActiveTab('demo')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            color: activeTab === 'demo' ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: isRecording || loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: activeTab === 'demo' ? '2px solid #e8002d' : '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          📁 F1 Demo Clips
        </button>
        <button
          onClick={() => !loading && setActiveTab('live')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            color: activeTab === 'live' ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: activeTab === 'live' ? '2px solid #e8002d' : '2px solid transparent',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Radio size={14} color={isRecording ? '#e8002d' : activeTab === 'live' ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ animation: isRecording ? 'pulse-glow 1s infinite alternate' : 'none' }} />
          Talk Live (Mic)
        </button>
      </div>

      {activeTab === 'demo' ? (
        // --- DEMO CLIPS TAB PANEL ---
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="label-tag" style={{ marginBottom: '12px' }}>🎙 Driver Radio File Input</div>
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !loading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#e8002d' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '24px 20px',
              textAlign: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              background: dragOver ? 'var(--accent-red-dim)' : 'var(--bg-card-hover)',
              marginBottom: '16px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader2 size={28} color="#e8002d" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Analysing driver radio...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Upload size={24} color={selectedFile ? '#e8002d' : 'var(--text-muted)'} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {selectedFile ? selectedFile.name : 'Drop audio file or click to upload'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WAV, MP3, M4A supported</p>
              </div>
            )}
          </div>

          {/* Lap selector */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="label-tag">Lap context</span>
            <input
              type="number"
              value={selectedLap}
              min={1} max={35}
              onChange={(e) => setSelectedLap(Number(e.target.value))}
              disabled={loading}
              style={{
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '4px 10px',
                width: '64px',
                fontSize: '14px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'default',
              }}
            />
          </div>

          {/* Demo Clips List */}
          {demoClips.length > 0 && (
            <div>
              <div className="label-tag" style={{ marginBottom: '10px' }}>Quick Demo Clips</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                {demoClips.map((clip) => (
                  <button
                    key={clip.id}
                    onClick={() => handleDemoClip(clip)}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      color: 'var(--text-primary)',
                      opacity: loading ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Play size={12} color="#e8002d" />
                      <span style={{ fontSize: '13px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 500 }}>{clip.display_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>LAP {clip.lap}</span>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: STATE_COLORS[clip.expected_state] || '#8b8b9e'
                      }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // --- LIVE TALK MIC TAB PANEL ---
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="label-tag">🎤 Live Team Radio Transmission</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-tag">Lap context</span>
              <input
                type="number"
                value={selectedLap}
                min={1} max={35}
                onChange={(e) => setSelectedLap(Number(e.target.value))}
                disabled={isRecording || loading}
                style={{
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  width: '64px',
                  fontSize: '14px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  cursor: isRecording || loading ? 'not-allowed' : 'default',
                }}
              />
            </div>
          </div>

          {/* Visualizer Canvas */}
          <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <canvas
              ref={canvasRef}
              width={500}
              height={110}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            {!isRecording && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.85)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {loading ? 'Analyzing transmission...' : 'Ready for live voice input'}
                </p>
              </div>
            )}
            {isRecording && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(232,0,45,0.1)', border: '1px solid #e8002d', borderRadius: '4px', padding: '3px 8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e8002d', animation: 'pulse-glow 0.8s infinite alternate' }} />
                <span style={{ fontSize: '10px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#e8002d', letterSpacing: '0.5px' }}>LIVE REC {recordingSeconds}s</span>
              </div>
            )}
          </div>

          {/* Live Analysis Dashboard Meter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>LIVE VOCAL STRESS</span>
              <span style={{ fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', color: getStressColor(liveStress), fontWeight: 700 }}>
                {getStressLabel(liveStress)} {liveStress > 0 && `(${liveStress}%)`}
              </span>
            </div>
            
            {/* Stress Level Meter */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  width: `${liveStress}%`,
                  height: '100%',
                  background: getStressColor(liveStress),
                  transition: 'width 0.1s ease',
                  borderRadius: '4px',
                  boxShadow: `0 0 10px ${getStressColor(liveStress)}`
                }}
              />
            </div>

            {/* Input Volume indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-muted)', fontWeight: 600 }}>MIC INPUT ENERGY</span>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {[...Array(10)].map((_, i) => {
                  const active = liveVolume > i * 10
                  let barColor = '#16a34a'
                  if (i > 5) barColor = '#d97706'
                  if (i > 8) barColor = '#dc2626'
                  return (
                    <div
                      key={i}
                      style={{
                        width: '4px',
                        height: '10px',
                        borderRadius: '1px',
                        background: active ? barColor : 'rgba(0,0,0,0.05)',
                        transition: 'background 0.05s ease'
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
            {loading ? (
              <button
                disabled
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 28px',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '30px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '1px',
                  cursor: 'not-allowed',
                  textTransform: 'uppercase'
                }}
              >
                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing Radio...
              </button>
            ) : isRecording ? (
              <button
                onClick={stopRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 28px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '30px',
                  color: '#fff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                  textTransform: 'uppercase',
                  animation: 'pulse-red 1.5s infinite'
                }}
              >
                <Square size={16} fill="#fff" />
                End Transmission
              </button>
            ) : (
              <button
                onClick={startRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 28px',
                  background: '#e8002d',
                  border: 'none',
                  borderRadius: '30px',
                  color: '#fff',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(232, 0, 45, 0.3)',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff1a43'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e8002d'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Mic size={16} />
                Start Live Transmission
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cockpit Steering Wheel Dials Control Board */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}>
        {/* ENGINE MODE DIAL */}
        <div style={{
          background: 'rgba(0,0,0,0.015)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ fontSize: '8px', fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>STRAT MODE</span>
          <button
            onClick={() => {
              const strats = ['STRAT 1', 'STRAT 3', 'STRAT 5', 'STRAT 8', 'STRAT 12'];
              const idx = strats.indexOf(strat);
              setStrat(strats[(idx + 1) % strats.length]);
            }}
            style={{
              background: '#e8002d',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(232,0,45,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Share Tech Mono", monospace',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {strat.replace('STRAT ', '')}
          </button>
          <span style={{ fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{strat}</span>
        </div>

        {/* BRAKE BALANCE TOGGLE */}
        <div style={{
          background: 'rgba(0,0,0,0.015)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ fontSize: '8px', fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>BBAL ADJUST</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <button
              onClick={() => setBbal(prev => Math.max(50.0, Number((prev - 0.5).toFixed(1))))}
              style={{
                background: '#121216',
                border: 'none',
                color: '#fff',
                width: '18px',
                height: '18px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >-</button>
            <span style={{ fontSize: '12px', fontFamily: '"Share Tech Mono", monospace', fontWeight: 700, color: '#16a34a', minWidth: '40px' }}>
              {bbal.toFixed(1)}%
            </span>
            <button
              onClick={() => setBbal(prev => Math.min(65.0, Number((prev + 0.5).toFixed(1))))}
              style={{
                background: '#121216',
                border: 'none',
                color: '#fff',
                width: '18px',
                height: '18px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >+</button>
          </div>
          <span style={{ fontSize: '9px', fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-muted)', marginTop: '2px' }}>FRONT / REAR</span>
        </div>

        {/* DIFFERENTIAL ROTARY DIAL */}
        <div style={{
          background: 'rgba(0,0,0,0.015)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span style={{ fontSize: '8px', fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>DIFF ENTRY</span>
          <button
            onClick={() => {
              const diffs = [50, 55, 60, 65, 70];
              const idx = diffs.indexOf(diff);
              setDiff(diffs[(idx + 1) % diffs.length]);
            }}
            style={{
              background: '#0088cc',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,136,204,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Share Tech Mono", monospace',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {diff}
          </button>
          <span style={{ fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{diff}% ACTIVE</span>
        </div>
      </div>
    </div>
  )
}

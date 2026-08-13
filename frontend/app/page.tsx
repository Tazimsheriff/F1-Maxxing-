'use client'

import { useState, useCallback } from 'react'
import AudioUploader from '@/components/AudioUploader'
import DriverStateCard from '@/components/DriverStateCard'
import TelemetryChart from '@/components/TelemetryChart'
import InsightPanel from '@/components/InsightPanel'
import AlertBanner from '@/components/AlertBanner'
import TranscriptPanel from '@/components/TranscriptPanel'
import Header from '@/components/Header'
import VoiceTimelineChart from '@/components/VoiceTimelineChart'
import F1CarViewer3D from '@/components/F1CarViewer3D'

export interface AnalysisResult {
  transcript: string
  emotion: {
    label: string
    score: number
    racing_state: string
    all_scores: Record<string, number>
  }
  audio_features: {
    pitch_mean: number
    pitch_variance: number
    rms_energy: number
    speaking_rate: number
    pause_ratio: number
  }
  driver_state: {
    stress: number
    fatigue: number
    confidence: number
    alert_level: string
  }
  telemetry: {
    current_lap: {
      lap: number
      lap_time: number
      sector1: number
      sector2: number
      sector3: number
      tyre_age: number
      compound: string
      position: number
    }
    recent_laps: Array<{
      lap: number
      lap_time: number
      sector1: number
      sector2: number
      sector3: number
      tyre_age: number
      compound: string
      position: number
    }>
    lap_delta: number
    sector2_delta: number
    tyre_age: number
    trend: string
  }
  reasoning: {
    insight: string
    recommendation: string
    alert: boolean
    alert_message: string | null
  }
  lap: number
  voice_timeline?: Array<{
    second: number
    pitch: number
    energy: number
    stress: number
    emotion: string
  }>
}

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveTimeline, setLiveTimeline] = useState<any[] | null>(null)

  const handleAnalysis = useCallback((data: AnalysisResult) => {
    setResult(data)
    setLiveTimeline(null)
    setError(null)
  }, [])

  const handleLoading = useCallback((isLoading: boolean) => {
    setLoading(isLoading)
    if (isLoading) {
      setResult(null)
      setLiveTimeline(null)
      setError(null)
    }
  }, [])

  const handleError = useCallback((err: string) => {
    setError(err)
    setLoading(false)
  }, [])

  const handleLiveTimelineUpdate = useCallback((timeline: any[] | null) => {
    setLiveTimeline(timeline)
  }, [])

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '0 0 40px' }}>
      <Header />

      {result?.reasoning.alert && (
        <AlertBanner message={result.reasoning.alert_message || 'Critical driver alert detected'} level={result.driver_state.alert_level} />
      )}

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px' }}>
        {/* 3D F1 Car Telemetry Matrix */}
        <div style={{ marginBottom: '24px' }}>
          <F1CarViewer3D result={result} loading={loading} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Transmission Input & AI Reasoning */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <AudioUploader
              onAnalysis={handleAnalysis}
              onLoading={handleLoading}
              onError={handleError}
              loading={loading}
              onLiveTimelineUpdate={handleLiveTimelineUpdate}
            />
            
            {(result || loading) && (
              <TranscriptPanel result={result} loading={loading} />
            )}
            
            {(result || loading) && (
              <InsightPanel result={result} loading={loading} />
            )}
            
            {error && (
              <div className="card" style={{ padding: '20px', borderColor: 'rgba(232,0,45,0.3)', background: 'rgba(232,0,45,0.05)' }}>
                <p style={{ color: '#e8002d', fontSize: '14px' }}>⚠ {error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Visual Telemetry & Analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DriverStateCard result={result} loading={loading} />
            
            {(result || liveTimeline || loading) && (
              <VoiceTimelineChart timeline={result?.voice_timeline || (liveTimeline ?? undefined)} loading={loading} />
            )}
            
            <TelemetryChart
              activeLap={result?.lap}
              activeMood={result?.emotion.racing_state === 'STRESSED' ? 'Stressed' : result?.emotion.racing_state === 'FATIGUED' ? 'Tired' : result?.emotion.racing_state ? 'Calm' : undefined}
              activeStress={result?.driver_state.stress}
              lapDelta={result?.telemetry.lap_delta}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

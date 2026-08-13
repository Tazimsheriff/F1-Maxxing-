'use client'

import { AnalysisResult } from '@/app/page'
import { useLanguage } from './LanguageContext'

interface Props {
  result: AnalysisResult | null
  loading: boolean
}

function GaugeBar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span className="label-tag">{label}</span>
        <span className="metric-value" style={{ fontSize: '24px', color }}>{pct}%</span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
    </div>
  )
}

function getStressColor(value: number): string {
  if (value >= 0.75) return '#dc2626'
  if (value >= 0.55) return '#ef4444'
  if (value >= 0.35) return '#f59e0b'
  return '#22c55e'
}

const ALERT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  LOW: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', label: '● LOW' },
  MEDIUM: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '● MEDIUM' },
  HIGH: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '▲ HIGH' },
  CRITICAL: { bg: 'rgba(220,38,38,0.15)', color: '#dc2626', label: '⚠ CRITICAL' },
}

const RACING_STATE_DISPLAY: Record<string, { emoji: string; label: string; color: string }> = {
  STRESSED: { emoji: '😤', label: 'STRESSED', color: '#ef4444' },
  ALERT: { emoji: '👁', label: 'ALERT', color: '#f59e0b' },
  CONFIDENT: { emoji: '💪', label: 'CONFIDENT', color: '#22c55e' },
  FATIGUED: { emoji: '😴', label: 'FATIGUED', color: '#8b5cf6' },
}

const MOOD_DISPLAY: Record<string, { emoji: string; label: string; color: string; desc: string }> = {
  STRESSED: { emoji: '😤', label: 'Stressed', color: '#ef4444', desc: 'Driver vocal tone indicates high stress. Pace at risk.' },
  ALERT: { emoji: '👁', label: 'Calm', color: '#22c55e', desc: 'Driver is calm and focused. Telemetry is stable.' },
  CONFIDENT: { emoji: '💪', label: 'Calm', color: '#22c55e', desc: 'Driver tone is confident. Excellent vehicle feel.' },
  FATIGUED: { emoji: '😴', label: 'Tired', color: '#8b5cf6', desc: 'Driver vocal signs of fatigue detected. Watch reaction times.' },
}

export default function DriverStateCard({ result, loading }: Props) {
  const { t } = useLanguage()
  const ds = result?.driver_state
  const emotion = result?.emotion
  const alertStyle = ds ? ALERT_STYLES[ds.alert_level] : ALERT_STYLES.LOW
  const racingState = emotion ? RACING_STATE_DISPLAY[emotion.racing_state] : null
  const moodInfo = emotion ? MOOD_DISPLAY[emotion.racing_state] : null

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <span className="label-tag">🧠 {t('driverState.title')}</span>
        {ds && (
          <div style={{
            background: alertStyle.bg,
            color: alertStyle.color,
            fontSize: '10px',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            letterSpacing: '1.5px',
            padding: '4px 10px',
            borderRadius: '20px',
            border: `1px solid ${alertStyle.color}40`,
            animation: ds.alert_level === 'CRITICAL' ? 'pulse-red 2s ease infinite' : 'none',
          }}>
            {alertStyle.label}
          </div>
        )}
      </div>

      {/* F1 Steering Wheel Cockpit LCD Screen */}
      <div className="carbon-dark animate-fade-in" style={{
        padding: '16px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        fontFamily: '"Share Tech Mono", monospace',
        border: '2px solid #2a2a35',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 4px 10px rgba(0,0,0,0.15)',
      }}>
        <div style={{ background: '#09090c', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #1f1f2a' }}>
          <div style={{ fontSize: '8px', color: '#8b8b9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('driverState.gear')}</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: ds ? '#ef4444' : '#00ff66', textShadow: ds ? '0 0 8px rgba(239,68,68,0.6)' : '0 0 8px rgba(0,255,102,0.6)' }}>
            {ds ? '8' : 'N'}
          </div>
        </div>
        <div style={{ background: '#09090c', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #1f1f2a' }}>
          <div style={{ fontSize: '8px', color: '#8b8b9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('driverState.speed')}</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', textShadow: '0 0 5px rgba(255,255,255,0.4)', marginTop: '4px' }}>
            {ds ? '312' : '0'}<span style={{ fontSize: '10px', color: '#8b8b9e', marginLeft: '1px' }}>kmh</span>
          </div>
        </div>
        <div style={{ background: '#09090c', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #1f1f2a' }}>
          <div style={{ fontSize: '8px', color: '#8b8b9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('driverState.lap')}</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00d2ff', textShadow: '0 0 5px rgba(0,210,255,0.4)', marginTop: '4px' }}>
            {result?.lap ? result.lap : '--'}
          </div>
        </div>
        <div style={{ background: '#09090c', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #1f1f2a' }}>
          <div style={{ fontSize: '8px', color: '#8b8b9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('driverState.delta')}</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f59e0b', textShadow: '0 0 5px rgba(245,158,11,0.4)', marginTop: '5px' }}>
            {ds ? '+0.142' : '0.000'}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {['STRESS', 'FATIGUE', 'CONFIDENCE'].map(label => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="label-tag">{label}</span>
                <div style={{ width: '40px', height: '16px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)', animation: 'shimmer 1.5s infinite' }} />
                </div>
              </div>
              <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px' }} />
            </div>
          ))}
        </div>
      )}

      {ds && !loading && (
        <div className="animate-fade-in">
          {/* Prominent Mood Badge */}
          {moodInfo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: `${moodInfo.color}10`,
              border: `1px solid ${moodInfo.color}30`,
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <span style={{ fontSize: '24px' }}>{moodInfo.emoji}</span>
              <div style={{ flex: 1 }}>
                <div className="label-tag" style={{ color: 'var(--text-secondary)', fontSize: '9px', marginBottom: '2px' }}>VOCAL MOOD STATE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '18px', color: moodInfo.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {moodInfo.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>({emotion?.racing_state})</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>{moodInfo.desc}</div>
              </div>
            </div>
          )}

          <GaugeBar value={ds.stress} label={t('driverState.stressLevel')} color={getStressColor(ds.stress)} />
          <GaugeBar value={ds.fatigue} label={t('driverState.fatigue')} color={ds.fatigue > 0.6 ? '#8b5cf6' : '#d97706'} />
          <GaugeBar value={ds.confidence} label={t('driverState.confidence')} color={ds.confidence > 0.6 ? '#16a34a' : '#d97706'} />
        </div>
      )}

      {!ds && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎙</div>
          <p style={{ fontSize: '13px' }}>Upload or select a radio clip to analyse driver state</p>
        </div>
      )}
    </div>
  )
}

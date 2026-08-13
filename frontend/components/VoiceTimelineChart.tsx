'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface TimelineSegment {
  second: number
  pitch: number
  energy: number
  stress: number
  emotion: string
}

interface Props {
  timeline?: TimelineSegment[]
  loading: boolean
}

const EMOTION_EMOJIS: Record<string, string> = {
  angry: '😤',
  sad: '😢',
  happy: '😊',
  surprise: '😲',
  neutral: '😐',
}

const EMOTION_COLORS: Record<string, string> = {
  angry: '#ef4444',
  sad: '#8b5cf6',
  happy: '#22c55e',
  surprise: '#00d2ff',
  neutral: '#8b8b9e',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as TimelineSegment
  if (!d) return null
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
        TIME: {d.second}s
      </p>
      <p style={{ color: '#ef4444', fontWeight: 600 }}>
        Stress: <span style={{ color: 'var(--text-primary)' }}>{d.stress.toFixed(0)}%</span>
      </p>
      <p style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
        Pitch: <span style={{ color: 'var(--text-primary)' }}>{d.pitch > 0 ? `${d.pitch.toFixed(0)} Hz` : 'Unvoiced'}</span>
      </p>
      <p style={{ color: 'var(--text-muted)' }}>
        Volume Energy: <span style={{ color: 'var(--text-primary)' }}>{(d.energy * 100).toFixed(2)}%</span>
      </p>
      <p style={{ color: EMOTION_COLORS[d.emotion] || 'var(--text-primary)', marginTop: '4px', fontWeight: 700 }}>
        Emotion: {EMOTION_EMOJIS[d.emotion] || '😐'} {d.emotion.toUpperCase()}
      </p>
    </div>
  )
}

export default function VoiceTimelineChart({ timeline, loading }: Props) {
  if (loading) {
    return (
      <div className="card" style={{ padding: '24px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <span className="label-tag" style={{ alignSelf: 'flex-start', marginBottom: '20px' }}>🎙 Vocal Timeline Analytics</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: '#e8002d', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>Analyzing voice timeline data...</p>
        </div>
      </div>
    )
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        <span className="label-tag" style={{ alignSelf: 'flex-start', marginBottom: '20px' }}>🎙 Vocal Timeline Analytics</span>
        <div style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📊</span>
          Vocal timeline details will render here after audio analysis
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span className="label-tag">🎙 Vocal Timeline Analytics (Second-by-Second)</span>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.entries(EMOTION_COLORS).map(([emo, color]) => (
            <div key={emo} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px' }}>{EMOTION_EMOJIS[emo]}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', fontWeight: 600 }}>{emo}</span>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e8002d" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#e8002d" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis
            dataKey="second"
            stroke="var(--text-muted)"
            tick={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fill: 'var(--text-secondary)' }}
            label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            yAxisId="left"
            stroke="#e8002d"
            tick={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fill: '#dc2626' }}
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--accent-blue)"
            tick={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fill: 'var(--accent-blue)' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="stress"
            stroke="#e8002d"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#stressGrad)"
            name="Stress"
            dot={(props: any) => {
              const d = props.payload as TimelineSegment
              const color = EMOTION_COLORS[d.emotion] || '#e8002d'
              return <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={color} stroke={color} />
            }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="pitch"
            stroke="var(--accent-blue)"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#pitchGrad)"
            name="Pitch"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

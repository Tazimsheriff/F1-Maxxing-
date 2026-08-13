'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface LapRecord {
  timestamp: number
  lap: number
  lap_time: number
  sector1: number
  sector2: number
  sector3: number
  tyre_age: number
  compound: string
  position: number
}

interface Props {
  activeLap?: number
  activeMood?: 'Stressed' | 'Tired' | 'Calm'
  activeStress?: number
  lapDelta?: number
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#ef4444',
  MEDIUM: '#f59e0b',
  HARD: '#e5e7eb',
}

const MOOD_COLORS: Record<string, string> = {
  Stressed: '#ef4444',
  Tired: '#8b5cf6',
  Calm: '#22c55e',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as LapRecord
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
      <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>LAP {d.lap}</p>
      <p style={{ color: 'var(--text-secondary)' }}>Time: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.lap_time.toFixed(3)}s</span></p>
      <p style={{ color: 'var(--text-secondary)' }}>S1: {d.sector1.toFixed(1)} · S2: {d.sector2.toFixed(1)} · S3: {d.sector3.toFixed(1)}</p>
      <p style={{ color: COMPOUND_COLORS[d.compound] || 'var(--text-primary)' }}>{d.compound} (age: {d.tyre_age} laps)</p>
      <p style={{ color: 'var(--text-secondary)' }}>Position: P{d.position}</p>
    </div>
  )
}

export default function TelemetryChart({ activeLap, activeMood, activeStress, lapDelta }: Props) {
  const [data, setData] = useState<LapRecord[]>([])

  useEffect(() => {
    fetch('http://localhost:8000/api/telemetry')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span className="label-tag">📈 Lap Performance</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['SOFT', 'MEDIUM', 'HARD'].map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', background: COMPOUND_COLORS[c], borderRadius: '1px' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading telemetry...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="lap"
              stroke="var(--text-muted)"
              tick={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fill: 'var(--text-secondary)' }}
              label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fill: 'var(--text-secondary)' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeLap && (
              <ReferenceLine
                x={activeLap}
                stroke={activeMood ? MOOD_COLORS[activeMood] : '#e8002d'}
                strokeDasharray="4 2"
                strokeWidth={1.5}
                label={{
                  value: `L${activeLap} (${activeMood || 'Active'})`,
                  fill: activeMood ? MOOD_COLORS[activeMood] : '#e8002d',
                  fontSize: 10,
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  position: 'top',
                  offset: 8
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="lap_time"
              stroke="var(--accent-blue)"
              strokeWidth={2}
              dot={(props: any) => {
                const d = props.payload as LapRecord
                const isActive = d.lap === activeLap
                let baseColor = COMPOUND_COLORS[d.compound] || 'var(--accent-blue)'
                
                if (isActive && activeMood) {
                  const moodColor = MOOD_COLORS[activeMood]
                  return (
                    <g key={props.key}>
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={7}
                        fill="none"
                        stroke={moodColor}
                        strokeWidth={2}
                        opacity={0.8}
                        style={{
                          transformOrigin: `${props.cx}px ${props.cy}px`,
                          animation: 'pulse-glow 1.5s infinite alternate'
                        }}
                      />
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={moodColor}
                        stroke="var(--bg-card)"
                        strokeWidth={1}
                      />
                    </g>
                  )
                }
                
                return (
                  <circle
                    key={props.key}
                    cx={props.cx}
                    cy={props.cy}
                    r={3}
                    fill={baseColor}
                    stroke={baseColor}
                  />
                )
              }}
              activeDot={{ r: 5, fill: '#e8002d', stroke: 'var(--bg-card)', strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {activeLap && activeMood && (
        <div className="animate-fade-in" style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div>
            <div className="label-tag" style={{ color: 'var(--text-secondary)', fontSize: '9px', marginBottom: '4px' }}>Performance Correlation Analysis</div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              On <strong>Lap {activeLap}</strong>, the driver expressed a <span style={{ color: MOOD_COLORS[activeMood], fontWeight: 700 }}>{activeMood}</span> mood state 
              {activeStress !== undefined && ` (vocal stress: ${Math.round(activeStress * 100)}%)`}.
            </p>
          </div>
          <div style={{
            textAlign: 'right',
            minWidth: '120px',
            paddingLeft: '16px',
            borderLeft: '1px solid var(--border)'
          }}>
            <div className="label-tag" style={{ fontSize: '8px', color: 'var(--text-muted)', marginBottom: '2px' }}>Lap Delta vs Avg</div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '20px',
              color: lapDelta !== undefined && lapDelta > 0 ? '#ef4444' : '#16a34a'
            }}>
              {lapDelta !== undefined ? `${lapDelta > 0 ? '+' : ''}${lapDelta.toFixed(3)}s` : '0.000s'}
            </div>
            <span style={{ fontSize: '10px', color: lapDelta !== undefined && lapDelta > 0 ? '#ef4444' : '#16a34a', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
              {lapDelta !== undefined && lapDelta > 0 ? '🏎 SLOWER LAP' : '⚡ FASTER LAP'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

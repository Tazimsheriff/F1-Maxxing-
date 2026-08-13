'use client'

import { AnalysisResult } from '@/app/page'

interface Props {
  result: AnalysisResult | null
  loading: boolean
}

export default function InsightPanel({ result, loading }: Props) {
  const r = result?.reasoning

  return (
    <div className="card" style={{
      padding: '24px',
      borderColor: r?.alert ? 'rgba(232,0,45,0.2)' : 'rgba(255,255,255,0.08)',
      background: r?.alert ? 'rgba(232,0,45,0.03)' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '18px' }}>🤖</span>
        <span className="label-tag">AI Race Engineer Insight</span>
        <div style={{ flex: 1 }} />
        {result && (
          <div style={{
            fontSize: '10px',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
            letterSpacing: '1px',
            color: '#4a4a5e',
          }}>GPT-4o-mini · Whisper · Wav2Vec2</div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 0.7, 0.5].map((opacity, i) => (
            <div key={i} style={{
              height: '14px',
              background: `rgba(255,255,255,${opacity * 0.05})`,
              borderRadius: '4px',
              position: 'relative', overflow: 'hidden',
              width: `${[100, 80, 60][i]}%`
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                animation: 'shimmer 1.5s infinite',
              }} />
            </div>
          ))}
        </div>
      ) : r ? (
        <div className="animate-fade-in">
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#c8c8d8', marginBottom: '16px' }}>
            {r.insight}
          </p>
          <div style={{
            padding: '14px 16px',
            background: 'rgba(0,210,255,0.06)',
            border: '1px solid rgba(0,210,255,0.15)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <span style={{ color: '#00d2ff', fontSize: '14px', flexShrink: 0 }}>→</span>
            <p style={{ fontSize: '14px', color: '#00d2ff', lineHeight: 1.5 }}>{r.recommendation}</p>
          </div>

          {/* Telemetry summary row */}
          {result && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Lap Delta', value: `${result.telemetry.lap_delta > 0 ? '+' : ''}${result.telemetry.lap_delta.toFixed(3)}s`, color: result.telemetry.lap_delta > 0.3 ? '#ef4444' : '#8b8b9e' },
                { label: 'S2 Delta', value: `${result.telemetry.sector2_delta > 0 ? '+' : ''}${result.telemetry.sector2_delta.toFixed(3)}s`, color: result.telemetry.sector2_delta > 0.2 ? '#f59e0b' : '#8b8b9e' },
                { label: 'Tyre Age', value: `${result.telemetry.tyre_age} laps`, color: result.telemetry.tyre_age > 20 ? '#ef4444' : '#8b8b9e' },
                { label: 'Trend', value: result.telemetry.trend, color: result.telemetry.trend === 'DEGRADING' ? '#ef4444' : result.telemetry.trend === 'IMPROVING' ? '#22c55e' : '#f59e0b' },
                { label: 'Position', value: `P${result.telemetry.current_lap.position}`, color: '#8b8b9e' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="label-tag" style={{ marginBottom: '3px' }}>{label}</div>
                  <div className="metric-value" style={{ fontSize: '16px', color }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#4a4a5e' }}>
          <p style={{ fontSize: '13px' }}>AI insight will appear after analysis</p>
        </div>
      )}
    </div>
  )
}

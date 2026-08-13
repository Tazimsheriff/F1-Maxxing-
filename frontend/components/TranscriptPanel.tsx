'use client'

import { AnalysisResult } from '@/app/page'

interface Props {
  result: AnalysisResult | null
  loading: boolean
}

export default function TranscriptPanel({ result, loading }: Props) {
  return (
    <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(232,0,45,0.1)',
          border: '1px solid rgba(232,0,45,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px'
        }}>🎙</div>
        <span className="label-tag">Transcript</span>
      </div>

      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#e8002d',
                animation: `pulse-glow 1.2s ease ${i * 0.2}s infinite`,
              }} />
            ))}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '6px' }}>Transcribing...</span>
          </div>
        ) : result ? (
          <p style={{
            fontSize: '16px',
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            animation: 'typewriter 0.4s ease forwards',
          }}>
            &ldquo;{result.transcript}&rdquo;
          </p>
        ) : null}
      </div>

      {result && (
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div className="label-tag">Lap</div>
          <div className="metric-value" style={{ fontSize: '28px', color: 'var(--text-primary)', lineHeight: 1.1 }}>{result.lap}</div>
        </div>
      )}
    </div>
  )
}

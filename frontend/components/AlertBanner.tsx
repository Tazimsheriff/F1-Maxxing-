'use client'

import { useEffect, useState } from 'react'

interface Props {
  message: string
  level: string
}

export default function AlertBanner({ message, level }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [message])

  if (!visible) return null

  const isCritical = level === 'CRITICAL'

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      background: isCritical ? 'rgba(220,38,38,0.95)' : 'rgba(239,68,68,0.9)',
      borderRadius: '8px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(220,38,38,0.4)',
      animation: 'fadeIn 0.3s ease forwards',
      maxWidth: '600px',
      width: '90%',
    }}>
      <span style={{ fontSize: '18px' }}>{isCritical ? '🚨' : '⚠️'}</span>
      <p style={{ fontSize: '13px', color: '#fff', fontWeight: 500, flex: 1 }}>{message}</p>
      <button
        onClick={() => setVisible(false)}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
      >×</button>
    </div>
  )
}

'use client'

import { useLanguage } from './LanguageContext'
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n'
import { Globe } from 'lucide-react'

export default function Header() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      marginBottom: '28px',
      position: 'relative',
    }}>
      {/* F1 Steering Wheel Shift Lights Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '6px',
        padding: '8px 0',
        background: '#121216',
        borderBottom: '2px solid #2a2a35',
        margin: '0 -24px 18px',
      }}>
        {[...Array(15)].map((_, i) => {
          let activeClass = '';
          let defaultBg = '#1e1e24';
          
          if (i < 5) {
            activeClass = 'led-active-green';
            defaultBg = '#14532d';
          } else if (i < 10) {
            activeClass = 'led-active-yellow';
            defaultBg = '#713f12';
          } else if (i < 13) {
            activeClass = 'led-active-red';
            defaultBg = '#7f1d1d';
          } else {
            activeClass = 'led-active-blue';
            defaultBg = '#0c4a6e';
          }
          
          return (
            <div
              key={i}
              className={activeClass}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: defaultBg,
                transition: 'all 0.1s ease',
              }}
            />
          )
        })}
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* F1 carbon checker flag-style accent */}
          <div style={{ display: 'flex', gap: '3px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                width: '4px',
                height: i % 2 === 0 ? '28px' : '20px',
                background: i % 2 === 0 ? '#e8002d' : 'var(--border)',
                borderRadius: '2px',
              }} />
            ))}
          </div>
          <div>
            <h1 style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}>{t('header.title')}</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: '3px', fontFamily: 'Rajdhani, sans-serif' }}>{t('header.subtitle')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Language Selector Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '4px 12px',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Globe size={14} style={{ color: '#e8002d' }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'Rajdhani, sans-serif',
                cursor: 'pointer'
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} style={{ background: '#121216', color: '#ffffff' }}>
                  {lang.flag} {lang.name} ({lang.team})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-glow 2s ease infinite' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>{t('header.status')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

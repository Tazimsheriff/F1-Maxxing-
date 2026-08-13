'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { SupportedLanguage, TRANSLATIONS } from '@/lib/i18n'

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (path: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (path: string) => path
})

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en')

  useEffect(() => {
    const saved = localStorage.getItem('f1_maxxing_lang') as SupportedLanguage
    if (saved && TRANSLATIONS[saved]) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
    localStorage.setItem('f1_maxxing_lang', lang)
  }

  // Nested translation helper: t('header.title')
  const t = (path: string): string => {
    const keys = path.split('.')
    let current: any = TRANSLATIONS[language] || TRANSLATIONS['en']

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key]
      } else {
        // Fallback to English
        let fallback: any = TRANSLATIONS['en']
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk]
          } else {
            return path
          }
        }
        return typeof fallback === 'string' ? fallback : path
      }
    }

    return typeof current === 'string' ? current : path
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type Language = 'en' | 'pt'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
}

const STORAGE_KEY = 'aniannoth-language'

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'pt' ? 'pt' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  function setLanguage(next: Language) {
    setLanguageState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}

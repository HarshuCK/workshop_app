import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { translations } from './translations'
import type { Translations } from './translations'

export type Lang = 'en' | 'mr'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function resolve(dict: Translations, key: string): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return key
    node = node[part]
  }
  if (typeof node === 'string') return node
  return key
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('workshopLanguage') : null) as Lang | null
  const [lang, setLangState] = useState<Lang>(stored === 'mr' ? 'mr' : 'en')

  const setLang = (l: Lang) => {
    setLangState(l)
    if (typeof localStorage !== 'undefined') localStorage.setItem('workshopLanguage', l)
  }

  const dict: Translations = translations[lang]

  const t = (key: string): string => resolve(dict, key)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}

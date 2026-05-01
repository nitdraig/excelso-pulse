"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { getMessages } from "@/lib/i18n/messages"
import type { Locale } from "@/lib/i18n/types"
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/types"
import { getByPath, interpolate } from "@/lib/i18n/translate"
import { Toaster } from "@/components/ui/toaster"

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, vars?: Record<string, string | number | boolean>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
      if (stored === "en" || stored === "es") {
        setLocaleState(stored)
      } else {
        const nav = navigator.language.toLowerCase()
        setLocaleState(nav.startsWith("es") ? "es" : "en")
      }
    } catch {
      /* ignore */
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next
    }
  }, [])

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
    }
  }, [locale])

  const t = useCallback(
    (path: string, vars?: Record<string, string | number | boolean>) => {
      const dict = getMessages(locale)
      const raw = getByPath(dict, path)
      if (typeof raw !== "string") return path
      return interpolate(raw, vars)
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
      <Toaster />
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider")
  }
  return ctx
}

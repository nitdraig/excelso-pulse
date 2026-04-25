"use client"

import { useState, useEffect } from "react"
import { LogOut, RefreshCw, Radio } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { signOut } from "next-auth/react"
import { useTranslation } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function CommandHeader() {
  const { t, locale } = useTranslation()
  const [time, setTime] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [isSyncing, setIsSyncing] = useState(false)

  const localeTag = locale === "es" ? "es-ES" : "en-US"

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString(localeTag, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      )
      setDate(
        now.toLocaleDateString(localeTag, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [localeTag])

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 2000)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md supports-backdrop-filter:bg-card/70">
      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandMark size={40} alt={t("brand.logoAlt")} />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {t("header.title")}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">{t("header.subtitle")}</p>
          </div>
        </div>

        <div className="hidden items-center gap-4 sm:flex md:gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="h-4 w-4 shrink-0 animate-pulse text-primary" />
            <span className="text-xs uppercase tracking-wider">{t("header.live")}</span>
          </div>

          <div className="text-right">
            <div className="font-mono text-lg font-semibold tabular-nums text-foreground sm:text-xl">
              {time}
            </div>
            <div className="text-xs text-muted-foreground">{date}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-1.5 px-2 sm:gap-2 sm:px-3"
          >
            {isSyncing ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden md:inline">{t("header.syncGlobal")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-muted-foreground sm:gap-2 sm:px-3"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">{t("header.signOut")}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

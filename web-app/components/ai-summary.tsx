"use client"

import { useState, useEffect } from "react"
import { Bot, Volume2 } from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import { Card, CardContent } from "@/components/ui/card"
import { SoundWave } from "./sound-wave"

interface AISummaryProps {
  summary: string
}

export function AISummary({ summary }: AISummaryProps) {
  const { t } = useTranslation()
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    let index = 0
    setDisplayedText("")
    setIsTyping(true)

    const interval = setInterval(() => {
      if (index < summary.length) {
        setDisplayedText(summary.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 15)

    return () => clearInterval(interval)
  }, [summary])

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/20 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 sm:h-12 sm:w-12">
            <Bot className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-3 sm:gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                {t("aiSummary.title")}
              </h2>
              {isTyping && <SoundWave />}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  <span>{t("aiSummary.speaking")}</span>
                </div>
              )}
            </div>
            <p className="text-foreground leading-relaxed text-balance">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

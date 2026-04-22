"use client"

import { useState, useEffect } from "react"
import { Bot, Volume2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SoundWave } from "./sound-wave"

interface AISummaryProps {
  summary: string
}

export function AISummary({ summary }: AISummaryProps) {
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
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                AI Executive Summary
              </h2>
              {isTyping && <SoundWave />}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  <span>Speaking...</span>
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

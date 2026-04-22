"use client"

import { useState, useEffect } from "react"
import { LogOut, RefreshCw, Radio, Terminal } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function CommandHeader() {
  const [time, setTime] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      )
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 2000)
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Excelso Command Center
            </h1>
            <p className="text-xs text-muted-foreground">AI-Driven Project Management Hub</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs uppercase tracking-wider">Live</span>
          </div>

          <div className="text-right">
            <div className="text-xl font-mono font-semibold text-foreground tabular-nums">
              {time}
            </div>
            <div className="text-xs text-muted-foreground">{date}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Sync Global</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

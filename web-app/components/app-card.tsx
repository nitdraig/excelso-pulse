"use client"

import {
  Database,
  Cloud,
  Cpu,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ExternalLink,
} from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PulsePresentationBadge } from "./pulse-presentation-badge"
import { AppPulse } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AppCardProps {
  app: AppPulse
  onClick: () => void
}

const TrendIcon = ({ trend }: { trend?: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="w-3 h-3 text-emerald-400" />
  if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-400" />
  return <Minus className="w-3 h-3 text-muted-foreground" />
}

function dbStatusTone(
  s: AppPulse["infrastructure"]["db_status"],
  app: Pick<AppPulse, "readiness" | "user_impact">,
): "ok" | "warn" | "err" | "muted" {
  if (app.readiness === "starting" && app.user_impact === "none" && s === "degraded") {
    return "muted"
  }
  if (s === "connected") return "ok"
  if (s === "degraded") return "warn"
  if (s === "disconnected") return "err"
  return "muted"
}

function databaseDisplayName(db: AppPulse["infrastructure"]["database"]) {
  if (db === "mongodb") return "MongoDB"
  if (db === "postgres") return "PostgreSQL"
  return null
}

function dbStatusLabel(app: AppPulse, t: (path: string) => string): string {
  if (app.readiness === "starting" && app.user_impact === "none" && app.infrastructure.db_status === "degraded") {
    return t("appCard.dbConnecting")
  }
  if (app.infrastructure.db_status === "unknown") return t("appCard.dbNotReported")
  const key = app.infrastructure.db_status
  return t(`appCard.dbStatus.${key}`)
}

export function AppCard({ app, onClick }: AppCardProps) {
  const { t, locale } = useTranslation()
  const localeTag = locale === "es" ? "es-ES" : "en-US"

  const latencyColor =
    app.metrics.latency_ms < 100
      ? "text-emerald-400"
      : app.metrics.latency_ms < 200
        ? "text-amber-400"
        : "text-red-400"

  const presentationBorder =
    app.user_impact === "outage" || app.status === "unavailable"
      ? "border-red-500/30"
      : app.user_impact === "limited"
        ? "border-amber-500/30"
        : app.readiness === "starting" && app.user_impact === "none"
          ? "border-sky-500/25"
          : undefined

  return (
    <Card
      className={cn(
        "cursor-pointer border border-transparent transition-colors duration-200",
        "hover:border-primary/35 hover:bg-muted/40 dark:hover:border-primary/45 dark:hover:bg-muted/55",
        "group relative overflow-hidden",
        presentationBorder,
        !presentationBorder && app.status === "unavailable" && "border-border/80 opacity-90",
      )}
      onClick={onClick}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-primary/10" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary text-2xl">
              {app.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">{app.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{app.description}</p>
              {app.appUrl ? (
                <a
                  href={app.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t("appCard.appFront")}</span>
                </a>
              ) : null}
            </div>
          </div>
          <PulsePresentationBadge
            readiness={app.readiness}
            user_impact={app.user_impact}
            technicalStatus={app.status}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("appCard.latency")}</p>
              <p className={cn("text-sm font-mono font-semibold", latencyColor)}>
                {app.metrics.latency_ms}ms
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <Database className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                {databaseDisplayName(app.infrastructure.database) ?? t("appCard.dbOriginLabel")}
              </p>
              <p
                className={cn(
                  "text-sm font-medium capitalize",
                  dbStatusTone(app.infrastructure.db_status, app) === "ok"
                    ? "text-emerald-400"
                    : dbStatusTone(app.infrastructure.db_status, app) === "warn"
                      ? "text-amber-400"
                      : dbStatusTone(app.infrastructure.db_status, app) === "err"
                        ? "text-red-400"
                        : "text-muted-foreground",
                )}
              >
                {dbStatusLabel(app, t)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("appCard.kpis")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {app.kpis.map((kpi, index) => (
              <div key={index} className="text-center p-2 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-semibold text-foreground">{kpi.value}</span>
                  <TrendIcon trend={kpi.trend} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mr-auto">{t("appCard.infrastructure")}</p>
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded",
              app.infrastructure.vercel ? "bg-primary/10" : "bg-secondary",
            )}
            title={t("appCard.titleVercel")}
          >
            <Cloud
              className={cn(
                "w-3.5 h-3.5",
                app.infrastructure.vercel ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded",
              app.infrastructure.ai_api ? "bg-primary/10" : "bg-secondary",
            )}
            title={t("appCard.titleAi")}
          >
            <Cpu
              className={cn(
                "w-3.5 h-3.5",
                app.infrastructure.ai_api ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded",
              app.infrastructure.db_status === "connected" ? "bg-primary/10" : "bg-secondary",
            )}
            title={t("appCard.titleDatabase")}
          >
            <Database
              className={cn(
                "w-3.5 h-3.5",
                dbStatusTone(app.infrastructure.db_status, app) === "ok"
                  ? "text-primary"
                  : dbStatusTone(app.infrastructure.db_status, app) === "warn"
                    ? "text-amber-400"
                    : dbStatusTone(app.infrastructure.db_status, app) === "err"
                      ? "text-red-400"
                      : "text-muted-foreground",
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">v{app.pulse_version}</span>
          <span className="truncate text-right" title={app.pulsePolledAt ?? app.last_updated}>
            {t("appCard.lastProbe", {
              time: new Date(app.pulsePolledAt ?? app.last_updated).toLocaleTimeString(
                localeTag,
                { hour: "2-digit", minute: "2-digit" },
              ),
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

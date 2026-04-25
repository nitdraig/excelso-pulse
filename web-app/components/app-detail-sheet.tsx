"use client"

import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PulsePresentationBadge } from "./pulse-presentation-badge"
import { AppPulse, PulseLog } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AppDetailSheetProps {
  app: AppPulse | null
  open: boolean
  onClose: () => void
  /** Clave usada en la API (`slug` u ObjectId legado). */
  onRequestEdit?: (routeKey: string) => void
  onRequestDelete?: (routeKey: string, name: string) => void
}

const LogIcon = ({ type }: { type: PulseLog["type"] }) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-400" />
    default:
      return <Info className="w-4 h-4 text-primary" />
  }
}

export function AppDetailSheet({
  app,
  open,
  onClose,
  onRequestEdit,
  onRequestDelete,
}: AppDetailSheetProps) {
  const { t, locale } = useTranslation()
  const localeTag = locale === "es" ? "es-ES" : "en-US"

  if (!app) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full pb-[env(safe-area-inset-bottom)] sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary text-3xl">
                {app.icon}
              </div>
              <div>
                <SheetTitle className="text-xl">{app.name}</SheetTitle>
                <SheetDescription>{app.description}</SheetDescription>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PulsePresentationBadge
              readiness={app.readiness}
              user_impact={app.user_impact}
              technicalStatus={app.status}
            />
            <span className="text-xs text-muted-foreground inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono">v{app.pulse_version}</span>
              <span className="hidden sm:inline text-border">|</span>
              <span title={t("sheet.technicalNote")}>
                {t("sheet.technicalPulse")}:{" "}
                <span className="font-mono text-foreground/80">{app.status}</span>
              </span>
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-6 pr-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
                {t("sheet.aiAnalysis")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/50 p-4 rounded-lg border border-border">
                {app.ai_context}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sheet.technicalMetrics")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">{t("sheet.latency")}</p>
                  <p className="text-lg font-mono font-semibold text-foreground">
                    {app.metrics.latency_ms}
                    <span className="text-sm text-muted-foreground ml-1">ms</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">{t("sheet.uptime")}</p>
                  <p className="text-lg font-mono font-semibold text-foreground">
                    {app.metrics.uptime_percent}
                    <span className="text-sm text-muted-foreground ml-1">%</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">{t("sheet.requests24h")}</p>
                  <p className="text-lg font-mono font-semibold text-foreground">
                    {(app.metrics.requests_24h / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">{t("sheet.errorRate")}</p>
                  <p
                    className={cn(
                      "text-lg font-mono font-semibold",
                      app.metrics.error_rate < 0.1
                        ? "text-emerald-400"
                        : app.metrics.error_rate < 1
                          ? "text-amber-400"
                          : "text-red-400",
                    )}
                  >
                    {app.metrics.error_rate}%
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sheet.recentActivity")}
              </h3>
              <div className="space-y-2">
                {app.logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    <LogIcon type={log.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.event}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString(localeTag, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              {onRequestEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => onRequestEdit(app.id)}
                >
                  <Pencil className="w-4 h-4" />
                  {t("sheet.editSource")}
                </Button>
              ) : null}
              {onRequestDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => onRequestDelete(app.id, app.name)}
                >
                  <Trash2 className="w-4 h-4" />
                  {t("sheet.deleteSource")}
                </Button>
              ) : null}
              {app.appUrl ? (
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <a href={app.appUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    {t("sheet.openApp")}
                  </a>
                </Button>
              ) : (
                <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {t("sheet.noAppUrl")}
                </p>
              )}
              <Button variant="outline" className="w-full justify-start gap-2">
                <AlertCircle className="w-4 h-4" />
                {t("sheet.viewFullLogs")}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

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
import { useMemo } from "react"
import { useTranslation } from "@/components/i18n-provider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PulsePresentationBadge } from "./pulse-presentation-badge"
import { AppPulse, PulseLog } from "@/lib/types"
import { pulseUserFacingContext } from "@/lib/pulse/user-facing-context"
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
      return <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
    case "error":
      return <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
    default:
      return <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
}

const sectionTitle = "text-xs font-semibold uppercase tracking-wider text-muted-foreground"

const sheetActionClass =
  "w-full justify-start gap-2 border-border/80 bg-card/40 hover:bg-muted/60 focus-visible:ring-1 focus-visible:ring-border focus-visible:ring-offset-0"

function looksLikeShortSlug(text: string): boolean {
  const t = text.trim()
  return t.length > 0 && t.length <= 48 && /^[\w.-]+$/.test(t)
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

  const analysisBlock = useMemo(() => {
    if (!app) return { body: "", isBrief: false }
    const raw = pulseUserFacingContext(app, t)
    const brief =
      !app.pulseFetchError && raw.trim().length > 0 && looksLikeShortSlug(raw)
    if (brief) {
      return {
        body: t("sheet.aiContextBrief", { tag: raw.trim() }),
        isBrief: true,
      }
    }
    if (!raw.trim()) {
      return { body: t("sheet.aiContextEmpty"), isBrief: false }
    }
    return { body: raw, isBrief: false }
  }, [app, t])

  if (!app) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        className={cn(
          "flex h-full max-h-dvh w-full flex-col gap-0 border-l p-0 shadow-xl sm:max-w-lg",
          "data-[state=open]:slide-in-from-right",
        )}
      >
        <div className="shrink-0 space-y-4 border-b border-border/80 bg-card/30 px-6 pb-4 pt-10 pr-14">
          <SheetHeader className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-3xl shadow-inner">
                {app.icon}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <SheetTitle className="text-xl font-semibold tracking-tight text-foreground">
                  {app.name}
                </SheetTitle>
                <SheetDescription className="text-sm leading-snug text-muted-foreground line-clamp-3">
                  {app.description || "\u00a0"}
                </SheetDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PulsePresentationBadge
                readiness={app.readiness}
                user_impact={app.user_impact}
                technicalStatus={app.status}
              />
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground/90">
                  v{app.pulse_version}
                </span>
                <span className="hidden sm:inline text-border">·</span>
                <span title={t("sheet.technicalNote")}>
                  {t("sheet.technicalPulse")}{" "}
                  <span className="font-mono text-foreground/85">{app.status}</span>
                </span>
              </span>
            </div>
          </SheetHeader>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
            "px-6 py-5",
            "pb-[calc(1.25rem+env(safe-area-inset-bottom)+4.5rem)] lg:pb-8",
          )}
        >
          <div className="mx-auto max-w-prose space-y-8">
            <section className="space-y-3">
              <h3 className={sectionTitle}>{t("sheet.aiAnalysis")}</h3>
              <div
                className={cn(
                  "rounded-xl border border-border/80 bg-muted/25 px-4 py-3.5 text-sm leading-relaxed text-foreground shadow-sm",
                  analysisBlock.isBrief && "border-dashed border-amber-500/25 bg-amber-500/5",
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word">{analysisBlock.body}</p>
              </div>
            </section>

            <Separator className="bg-border/60" />

            <section className="space-y-3">
              <h3 className={sectionTitle}>{t("sheet.technicalMetrics")}</h3>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {(
                  [
                    ["latency", app.metrics.latency_ms, "ms", t("sheet.latency")],
                    ["uptime", app.metrics.uptime_percent, "%", t("sheet.uptime")],
                    [
                      "req",
                      `${(app.metrics.requests_24h / 1000).toFixed(1)}K`,
                      "",
                      t("sheet.requests24h"),
                    ],
                    [
                      "err",
                      `${app.metrics.error_rate}%`,
                      "",
                      t("sheet.errorRate"),
                      app.metrics.error_rate < 0.1
                        ? "text-emerald-500"
                        : app.metrics.error_rate < 1
                          ? "text-amber-500"
                          : "text-red-500",
                    ],
                  ] as const
                ).map(([key, value, suffix, label, colorClass]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border/70 bg-card/50 p-3.5 shadow-sm"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-lg font-semibold tabular-nums text-foreground",
                        colorClass,
                      )}
                    >
                      {value}
                      {suffix ? (
                        <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <Separator className="bg-border/60" />

            <section className="space-y-3">
              <h3 className={sectionTitle}>{t("sheet.recentActivity")}</h3>
              <ul className="space-y-2">
                {app.logs.map((log, index) => (
                  <li
                    key={`${log.timestamp}-${index}`}
                    className="flex gap-3 rounded-xl border border-border/70 bg-card/40 p-3.5"
                  >
                    <LogIcon type={log.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-foreground wrap-break-word">
                        {log.event}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString(localeTag, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <Separator className="bg-border/60" />

            <div className="flex flex-col gap-2 pb-2">
              {onRequestEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  className={sheetActionClass}
                  onClick={() => onRequestEdit(app.id)}
                >
                  <Pencil className="h-4 w-4" />
                  {t("sheet.editSource")}
                </Button>
              ) : null}
              {onRequestDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    sheetActionClass,
                    "text-destructive hover:bg-destructive/10 hover:text-destructive",
                  )}
                  onClick={() => onRequestDelete(app.id, app.name)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("sheet.deleteSource")}
                </Button>
              ) : null}
              {app.appUrl ? (
                <Button variant="outline" className={sheetActionClass} asChild>
                  <a href={app.appUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {t("sheet.openApp")}
                  </a>
                </Button>
              ) : (
                <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  {t("sheet.noAppUrl")}
                </p>
              )}
              <Button type="button" variant="outline" className={sheetActionClass}>
                <AlertCircle className="h-4 w-4" />
                {t("sheet.viewFullLogs")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

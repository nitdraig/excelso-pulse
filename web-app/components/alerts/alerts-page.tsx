"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { AppSubHeader } from "@/components/app-sub-header"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { useTranslation } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { PROJECT_ALERT_RULE_TYPES } from "@/lib/alerts/project-alert-rules"
import type { AppPulse } from "@/lib/types"

type AlertRow = {
  id: string
  projectSlug: string
  projectName: string
  label: string
  ruleType: string
  threshold: number | null
  enabled: boolean
}

export function AlertsPage() {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<AppPulse[]>([])
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [projectSlug, setProjectSlug] = useState("")
  const [label, setLabel] = useState("")
  const [ruleType, setRuleType] = useState<(typeof PROJECT_ALERT_RULE_TYPES)[number]>("latency_above")
  const [threshold, setThreshold] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const needsThreshold = ruleType === "latency_above" || ruleType === "error_rate_above"

  const loadAll = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [pr, ar] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/alerts", { cache: "no-store" }),
      ])
      const pj = (await pr.json()) as { projects?: AppPulse[]; error?: string }
      const al = (await ar.json()) as { alerts?: AlertRow[]; error?: string }
      if (!pr.ok) {
        setError(pj.error ?? t("alertsPage.loadError"))
        return
      }
      if (!ar.ok) {
        setError(al.error ?? t("alertsPage.loadError"))
        return
      }
      const list = pj.projects ?? []
      setProjects(list)
      setAlerts(al.alerts ?? [])
      setProjectSlug((prev) => prev || list[0]?.id || "")
    } catch {
      setError(t("accountPage.networkError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  const refreshAlertsOnly = useCallback(async () => {
    try {
      const ar = await fetch("/api/alerts", { cache: "no-store" })
      const al = (await ar.json()) as { alerts?: AlertRow[] }
      if (ar.ok) setAlerts(al.alerts ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const ruleLabels = useMemo(
    () => ({
      latency_above: t("alertsPage.ruleTypes.latency_above"),
      error_rate_above: t("alertsPage.ruleTypes.error_rate_above"),
      readiness_not_ready: t("alertsPage.ruleTypes.readiness_not_ready"),
      user_impact_limited: t("alertsPage.ruleTypes.user_impact_limited"),
      user_impact_outage: t("alertsPage.ruleTypes.user_impact_outage"),
    }),
    [t],
  )

  async function createAlert(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      const th = needsThreshold ? Number(threshold) : undefined
      const body: Record<string, unknown> = {
        projectSlug,
        label: label.trim(),
        ruleType,
        enabled: true,
      }
      if (needsThreshold) body.threshold = Number.isFinite(th) ? th : null

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        setCreateError(data.error ?? t("alertsPage.createError"))
        return
      }
      setLabel("")
      setThreshold("")
      await refreshAlertsOnly()
    } catch {
      setCreateError(t("accountPage.networkError"))
    } finally {
      setCreating(false)
    }
  }

  async function toggleEnabled(row: AlertRow, enabled: boolean) {
    try {
      const res = await fetch(`/api/alerts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) return
      setAlerts((prev) => prev.map((a) => (a.id === row.id ? { ...a, enabled } : a)))
    } catch {
      /* ignore */
    }
  }

  async function removeAlert(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" })
      if (!res.ok) return
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppSubHeader active="alerts" />
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("authPages.loading")}</span>
        </div>
        <MobileTabBar />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppSubHeader active="alerts" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-4 py-8 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:py-10 lg:pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("alertsPage.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("alertsPage.subtitle")}</p>
        </div>

        {error ? (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => void loadAll()}>
              {t("dashboard.retry")}
            </Button>
          </div>
        ) : null}

        <form onSubmit={createAlert} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("alertsPage.newAlert")}</h2>
          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("alertsPage.noProjects")}</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="proj">{t("alertsPage.project")}</Label>
                <select
                  id="proj"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={projectSlug}
                  onChange={(e) => setProjectSlug(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lbl">{t("alertsPage.label")}</Label>
                <Input
                  id="lbl"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t("alertsPage.labelPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt">{t("alertsPage.ruleType")}</Label>
                <select
                  id="rt"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={ruleType}
                  onChange={(e) =>
                    setRuleType(e.target.value as (typeof PROJECT_ALERT_RULE_TYPES)[number])
                  }
                >
                  {PROJECT_ALERT_RULE_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {ruleLabels[rt] ?? rt}
                    </option>
                  ))}
                </select>
              </div>
              {needsThreshold ? (
                <div className="space-y-2">
                  <Label htmlFor="thr">
                    {ruleType === "latency_above"
                      ? t("alertsPage.thresholdMs")
                      : t("alertsPage.thresholdPercent")}
                  </Label>
                  <Input
                    id="thr"
                    type="number"
                    min={0}
                    step={ruleType === "error_rate_above" ? 0.1 : 1}
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    required
                  />
                </div>
              ) : null}
              <Button type="submit" disabled={creating || !label.trim()}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("alertsPage.creating")}
                  </>
                ) : (
                  t("alertsPage.create")
                )}
              </Button>
            </>
          )}
        </form>

        <Separator />

        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t("alertsPage.yourAlerts")}</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("alertsPage.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">{a.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.projectName} · {ruleLabels[a.ruleType] ?? a.ruleType}
                      {a.threshold != null ? ` · ${a.threshold}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={a.enabled}
                        onCheckedChange={(v) => void toggleEnabled(a, v)}
                        aria-label={t("alertsPage.toggle")}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void removeAlert(a.id)}
                      aria-label={t("alertsPage.remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <MobileTabBar />
    </div>
  )
}

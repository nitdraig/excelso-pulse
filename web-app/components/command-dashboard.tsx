"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, FolderPlus, Loader2, RefreshCw } from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import { CommandHeader } from "./command-header"
import { CommandSidebar } from "./command-sidebar"
import { AISummary } from "./ai-summary"
import { AppCard } from "./app-card"
import { AppDetailSheet } from "./app-detail-sheet"
import { MobileTabBar } from "./mobile-tab-bar"
import { CreateProjectDialog } from "./projects/create-project-dialog"
import { DeleteProjectDialog } from "./projects/delete-project-dialog"
import { EditProjectDialog } from "./projects/edit-project-dialog"
import { Button } from "@/components/ui/button"
import { buildPortfolioSummary } from "@/lib/i18n/portfolio-summary"
import type { AppPulse } from "@/lib/types"

export function CommandDashboard() {
  const { t, locale } = useTranslation()
  const [apps, setApps] = useState<AppPulse[]>([])
  const [pulseMeta, setPulseMeta] = useState<{
    roundDurationMs?: number
    fromCache?: boolean
  }>({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [detailApp, setDetailApp] = useState<AppPulse | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [editRouteKey, setEditRouteKey] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    key: string
    name: string
  } | null>(null)

  const loadPortfolio = useCallback(async () => {
    setFetchError(null)
    setLoading(true)
    try {
      const fetchOnce = async () => {
        const res = await fetch("/api/portfolio", { cache: "no-store" })
        const data = (await res.json()) as {
          apps?: AppPulse[]
          error?: string
          roundDurationMs?: number
          fromCache?: boolean
        }
        return { res, data }
      }

      let attempt = 0

      while (attempt < 4) {
        const { res, data } = await fetchOnce()

        if (res.status === 401) {
          window.location.href = "/login?callbackUrl=%2Fdashboard"
          return
        }

        if (!res.ok) {
          setFetchError(data.error ?? t("dashboard.loadError"))
          setApps([])
          setPulseMeta({})
          return
        }

        const nextApps = data.apps ?? []
        setApps(nextApps)
        setPulseMeta({
          roundDurationMs: data.roundDurationMs,
          fromCache: data.fromCache,
        })

        const needsWarmupRetry =
          attempt < 3 &&
          nextApps.some((a) => a.readiness === "starting" && a.user_impact === "none")
        if (!needsWarmupRetry) {
          break
        }

        const delayMs = attempt === 0 ? 1600 : attempt === 1 ? 2200 : 2600
        await new Promise((r) => setTimeout(r, delayMs))
        attempt += 1
      }
    } catch {
      setFetchError(t("dashboard.networkError"))
      setApps([])
      setPulseMeta({})
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadPortfolio()
  }, [loadPortfolio])

  const summary = useMemo(
    () => buildPortfolioSummary(locale, apps, pulseMeta),
    [locale, apps, pulseMeta],
  )

  const filteredApps = selectedAppId
    ? apps.filter((app) => app.id === selectedAppId)
    : apps

  const handleAppClick = (app: AppPulse) => {
    setDetailApp(app)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setDetailApp(null)
  }

  const handlePortfolioMutate = useCallback(() => {
    setSelectedAppId(null)
    setDetailApp(null)
    setIsSheetOpen(false)
    void loadPortfolio()
  }, [loadPortfolio])

  const selectedName = apps.find((a) => a.id === selectedAppId)?.name ?? t("dashboard.projectFallback")

  return (
    <div className="flex h-dvh max-h-dvh flex-col bg-background lg:flex-row">
      <CommandSidebar
        apps={apps}
        selectedApp={selectedAppId}
        onSelectApp={(id) => setSelectedAppId(id || null)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <CommandHeader />

        <main className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:space-y-6 sm:px-4 sm:py-5 lg:space-y-6 lg:px-6 lg:py-6 lg:pb-6">
          <AISummary summary={summary} />

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                {selectedAppId
                  ? `${selectedName} — ${t("dashboard.projectView")}`
                  : t("dashboard.pulseSources")}
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 text-xs text-muted-foreground sm:flex-wrap sm:overflow-visible sm:text-sm">
                  <span className="flex shrink-0 items-center gap-1.5" title={t("dashboard.tooltipReady")}>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    {apps.filter((a) => a.user_impact === "none" && a.readiness === "ready").length}{" "}
                    {t("dashboard.countReady")}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5" title={t("dashboard.tooltipStarting")}>
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-sky-400" />
                    {apps.filter((a) => a.readiness === "starting" && a.user_impact === "none").length}{" "}
                    {t("dashboard.countStarting")}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5" title={t("dashboard.tooltipLimited")}>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                    {apps.filter((a) => a.user_impact === "limited").length} {t("dashboard.countLimited")}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5" title={t("dashboard.tooltipOutage")}>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                    {apps.filter((a) => a.user_impact === "outage").length} {t("dashboard.countOutage")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void loadPortfolio()}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">{t("dashboard.refresh")}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="inline-flex gap-2 lg:hidden"
                    onClick={() => setCreateOpen(true)}
                    aria-label={t("projects.newSource")}
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span className="max-w-36 truncate sm:max-w-none">{t("projects.newSource")}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="hidden gap-2 lg:inline-flex"
                    onClick={() => setCreateOpen(true)}
                  >
                    <FolderPlus className="h-4 w-4" />
                    {t("projects.newSource")}
                  </Button>
                  <CreateProjectDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSuccess={handlePortfolioMutate}
                  />
                </div>
              </div>
            </div>

            {fetchError ? (
              <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {fetchError}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadPortfolio()}>
                  {t("dashboard.retry")}
                </Button>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground sm:py-16">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t("dashboard.loadingPortfolio")}</span>
              </div>
            ) : fetchError ? null : filteredApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground sm:px-6 sm:py-12">
                {t("dashboard.emptyState")}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredApps.map((app) => (
                  <AppCard key={app.id} app={app} onClick={() => handleAppClick(app)} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileTabBar />

      <AppDetailSheet
        app={detailApp}
        open={isSheetOpen}
        onClose={handleCloseSheet}
        onRequestEdit={(key) => {
          setEditRouteKey(key)
          handleCloseSheet()
        }}
        onRequestDelete={(key, name) => {
          setDeleteTarget({ key, name })
          handleCloseSheet()
        }}
      />

      <EditProjectDialog
        apiPathKey={editRouteKey}
        open={editRouteKey !== null}
        onOpenChange={(next) => {
          if (!next) setEditRouteKey(null)
        }}
        onSuccess={handlePortfolioMutate}
      />

      <DeleteProjectDialog
        apiPathKey={deleteTarget?.key ?? null}
        projectName={deleteTarget?.name ?? null}
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null)
        }}
        onSuccess={handlePortfolioMutate}
      />
    </div>
  )
}

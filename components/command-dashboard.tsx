"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { CommandHeader } from "./command-header"
import { CommandSidebar } from "./command-sidebar"
import { AISummary } from "./ai-summary"
import { AppCard } from "./app-card"
import { AppDetailSheet } from "./app-detail-sheet"
import { CreateProjectDialog } from "./projects/create-project-dialog"
import { DeleteProjectDialog } from "./projects/delete-project-dialog"
import { EditProjectDialog } from "./projects/edit-project-dialog"
import { Button } from "@/components/ui/button"
import type { AppPulse } from "@/lib/types"

function portfolioSummary(apps: AppPulse[], meta?: { roundDurationMs?: number; fromCache?: boolean }): string {
  if (apps.length === 0) {
    return "Registra orígenes pulse (slug, URL `/internal/pulse` y nombre de variable del Bearer en el servidor). El panel solo llama a tus backends desde el agregador autenticado; los tokens no salen al navegador."
  }
  const operational = apps.filter((a) => a.status === "operational").length
  const unavailable = apps.filter((a) => a.status === "unavailable").length
  const extra =
    meta?.roundDurationMs != null
      ? ` Última ronda agregada en ~${meta.roundDurationMs} ms${meta.fromCache ? " (caché)" : ""}.`
      : ""
  return `Portfolio: ${apps.length} origen(es); ${operational} OK, ${unavailable} no disponibles u offline.${extra}`
}

export function CommandDashboard() {
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
  const [deleteTarget, setDeleteTarget] = useState<{
    key: string
    name: string
  } | null>(null)

  const loadPortfolio = useCallback(async () => {
    setFetchError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      const data = (await res.json()) as {
        apps?: AppPulse[]
        error?: string
        roundDurationMs?: number
        fromCache?: boolean
      }
      if (!res.ok) {
        setFetchError(data.error ?? "No se pudo cargar el portfolio.")
        setApps([])
        setPulseMeta({})
        return
      }
      setApps(data.apps ?? [])
      setPulseMeta({
        roundDurationMs: data.roundDurationMs,
        fromCache: data.fromCache,
      })
    } catch {
      setFetchError("Error de red al cargar el portfolio.")
      setApps([])
      setPulseMeta({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPortfolio()
  }, [loadPortfolio])

  const summary = useMemo(
    () => portfolioSummary(apps, pulseMeta),
    [apps, pulseMeta],
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

  return (
    <div className="flex h-screen bg-background">
      <CommandSidebar
        apps={apps}
        selectedApp={selectedAppId}
        onSelectApp={(id) => setSelectedAppId(id || null)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <CommandHeader />

        <main className="flex-1 overflow-auto p-4 lg:p-6 space-y-6">
          <AISummary summary={summary} />

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedAppId
                  ? `${apps.find((a) => a.id === selectedAppId)?.name ?? "Proyecto"} — vista`
                  : "Orígenes pulse"}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {apps.filter((a) => a.status === "operational").length} OK
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {apps.filter((a) => a.status === "degraded").length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    {apps.filter((a) => a.status === "down").length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    {apps.filter((a) => a.status === "unavailable").length} n/d
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
                    Actualizar
                  </Button>
                  <CreateProjectDialog onSuccess={handlePortfolioMutate} />
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
                  Reintentar
                </Button>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Agregando pulse…</span>
              </div>
            ) : fetchError ? null : filteredApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                No hay orígenes registrados. Pulsa «Nuevo proyecto» y define slug, URL pulse y la variable de entorno del Bearer en el servidor.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredApps.map((app) => (
                  <AppCard key={app.id} app={app} onClick={() => handleAppClick(app)} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

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

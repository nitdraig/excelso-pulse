"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type RegistryProject = {
  slug: string
  name: string
  description: string
  icon: string
  appUrl: string
  pulseUrl: string
  hasBearer: boolean
}

type EditProjectDialogProps = {
  apiPathKey: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditProjectDialog({
  apiPathKey,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) {
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("📦")
  const [appUrl, setAppUrl] = useState("")
  const [pulseUrl, setPulseUrl] = useState("")
  const [bearerToken, setBearerToken] = useState("")
  const [clearToken, setClearToken] = useState(false)
  const [hadBearer, setHadBearer] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !apiPathKey) return
    let cancelled = false
    setLoadError(null)
    setSaveError(null)
    setLoading(true)
    setClearToken(false)
    setBearerToken("")
    void (async () => {
      try {
        const res = await fetch(
          `/api/projects/${encodeURIComponent(apiPathKey)}`,
          { cache: "no-store" },
        )
        const data = (await res.json()) as {
          project?: RegistryProject
          error?: string
        }
        if (!res.ok || !data.project) {
          if (!cancelled) setLoadError(data.error ?? "No se pudo cargar el origen.")
          return
        }
        if (cancelled) return
        const p = data.project
        setSlug(p.slug)
        setName(p.name)
        setDescription(p.description)
        setIcon(p.icon || "📦")
        setAppUrl(p.appUrl ?? "")
        setPulseUrl(p.pulseUrl)
        setHadBearer(p.hasBearer)
      } catch {
        if (!cancelled) setLoadError("Error de red.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, apiPathKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiPathKey) return
    setSaveError(null)
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || "📦",
        appUrl: appUrl.trim(),
        pulseUrl: pulseUrl.trim(),
      }
      if (clearToken) {
        body.clearBearer = true
      } else {
        const t = bearerToken.trim()
        if (t.length >= 8) {
          body.bearerToken = t
        }
      }

      const res = await fetch(`/api/projects/${encodeURIComponent(apiPathKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setSaveError(data.error ?? "No se pudo guardar.")
        return
      }
      onOpenChange(false)
      onSuccess?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar origen pulse
          </DialogTitle>
          <DialogDescription>
            El token se guarda <strong>cifrado</strong>; aquí solo puedes sustituirlo o borrarlo. No se muestra el
            valor actual.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando…
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/30 px-3 py-2">
              Token en servidor:{" "}
              <span className="font-medium text-foreground">
                {hadBearer ? "configurado (oculto)" : "no configurado"}
              </span>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="edit-slug">Slug (appId)</Label>
                <Input
                  id="edit-slug"
                  required
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  disabled={saving}
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="edit-name">Nombre visible</Label>
                <Input
                  id="edit-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-app-url">URL de la app (front)</Label>
              <Input
                id="edit-app-url"
                type="url"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                disabled={saving}
                placeholder="https://app.ejemplo.com"
              />
              <p className="text-[11px] text-muted-foreground">Opcional. Vacía para quitar el enlace.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pulse-url">URL pulse (backend)</Label>
              <Input
                id="edit-pulse-url"
                type="url"
                required
                value={pulseUrl}
                onChange={(e) => setPulseUrl(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bearer">Nuevo token Bearer (opcional)</Label>
              <Input
                id="edit-bearer"
                type="password"
                autoComplete="new-password"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                disabled={saving || clearToken}
                placeholder="Dejar vacío para no cambiar"
              />
              <p className="text-[11px] text-muted-foreground">
                Mínimo 8 caracteres si lo cambias. Sustituye el token anterior cifrado.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-clear-bearer"
                checked={clearToken}
                onCheckedChange={(v) => setClearToken(v === true)}
                disabled={saving}
              />
              <Label htmlFor="edit-clear-bearer" className="text-sm font-normal cursor-pointer">
                Eliminar token guardado (el agregador dejará de autenticarse hasta que configures uno nuevo)
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Descripción</Label>
              <Textarea
                id="edit-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icono (emoji)</Label>
              <Input
                id="edit-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                disabled={saving}
                maxLength={8}
                className="font-mono"
              />
            </div>
            {saveError ? (
              <p className="text-sm text-destructive" role="alert">
                {saveError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

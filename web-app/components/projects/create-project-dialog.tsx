"use client"

import { useState } from "react"
import { FolderPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type CreateProjectDialogProps = {
  onSuccess?: () => void
}

export function CreateProjectDialog({ onSuccess }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("📦")
  const [appUrl, setAppUrl] = useState("")
  const [pulseUrl, setPulseUrl] = useState("")
  const [bearerToken, setBearerToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          description: description.trim(),
          icon: icon.trim() || "📦",
          appUrl: appUrl.trim(),
          pulseUrl: pulseUrl.trim(),
          bearerToken: bearerToken.trim(),
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el origen.")
        return
      }
      setOpen(false)
      setSlug("")
      setName("")
      setDescription("")
      setIcon("📦")
      setAppUrl("")
      setPulseUrl("")
      setBearerToken("")
      onSuccess?.()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 shrink-0">
          <FolderPlus className="h-4 w-4" />
          Nuevo origen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar origen pulse</DialogTitle>
          <DialogDescription>
            El token se <strong>cifra</strong> en el servidor antes de guardarse. En el navegador no se vuelve a
            mostrar. Requiere <code className="text-xs">PULSE_SECRETS_MASTER_KEY</code> en el despliegue de Pulse.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="proj-slug">Slug (appId)</Label>
              <Input
                id="proj-slug"
                required
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                disabled={pending}
                placeholder="fuddy"
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground leading-snug">
                Debe coincidir con el identificador que uses al agregar; minúsculas y guiones.
              </p>
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="proj-name">Nombre visible</Label>
              <Input
                id="proj-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                placeholder="Fuddy"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-app-url">URL de la app (front)</Label>
            <Input
              id="proj-app-url"
              type="url"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              disabled={pending}
              placeholder="https://app.fuddy.example.com"
            />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Opcional. Enlace público que verás en el panel.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-pulse-url">URL pulse del backend</Label>
            <Input
              id="proj-pulse-url"
              type="url"
              required
              value={pulseUrl}
              onChange={(e) => setPulseUrl(e.target.value)}
              disabled={pending}
              placeholder="https://api-fuddy.example.com/internal/pulse"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-bearer">Token Bearer (backend)</Label>
            <Input
              id="proj-bearer"
              type="password"
              required
              autoComplete="new-password"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              disabled={pending}
              placeholder="••••••••"
            />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Mínimo 8 caracteres. Solo el agregador lo usa al llamar al pulse; se guarda cifrado (AES-256-GCM).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Descripción</Label>
            <Textarea
              id="proj-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              placeholder="Qué producto o API representa este origen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-icon">Icono (emoji)</Label>
            <Input
              id="proj-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              disabled={pending}
              maxLength={8}
              className="font-mono"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar origen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

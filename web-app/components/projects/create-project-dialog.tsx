"use client"

import { useState } from "react"
import { FolderPlus, Loader2 } from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
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
import { ensureHttpsUrl } from "@/lib/url"

type CreateProjectDialogProps = {
  onSuccess?: () => void
  /** Modo controlado (barra móvil + escritorio). Si se omite `onOpenChange`, el diálogo gestiona su propio estado y muestra el trigger por defecto. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateProjectDialog({
  onSuccess,
  open: controlledOpen,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { t } = useTranslation()
  const isControlled = onOpenChange != null
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? (controlledOpen ?? false) : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

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
          appUrl: ensureHttpsUrl(appUrl),
          pulseUrl: ensureHttpsUrl(pulseUrl),
          bearerToken: bearerToken.trim(),
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? t("projects.createError"))
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
      {!isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2 shrink-0">
            <FolderPlus className="h-4 w-4" />
            {t("projects.newSource")}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[min(90vh,720px)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("projects.createTitle")}</DialogTitle>
          <DialogDescription>{t("projects.createDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="proj-slug">{t("projects.slugLabel")}</Label>
              <Input
                id="proj-slug"
                required
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                disabled={pending}
                placeholder="my-api"
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground leading-snug">{t("projects.slugHint")}</p>
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="proj-name">{t("projects.nameLabel")}</Label>
              <Input
                id="proj-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                placeholder="My product"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-app-url">{t("projects.appUrlLabel")}</Label>
            <Input
              id="proj-app-url"
              type="url"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              onBlur={() => setAppUrl((u) => ensureHttpsUrl(u))}
              disabled={pending}
              placeholder="https://app.example.com"
            />
            <p className="text-[11px] text-muted-foreground leading-snug">{t("projects.appUrlHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-pulse-url">{t("projects.pulseUrlLabel")}</Label>
            <Input
              id="proj-pulse-url"
              type="url"
              required
              value={pulseUrl}
              onChange={(e) => setPulseUrl(e.target.value)}
              onBlur={() => setPulseUrl((u) => ensureHttpsUrl(u))}
              disabled={pending}
              placeholder="https://api.example.com/internal/pulse"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-bearer">{t("projects.bearerLabel")}</Label>
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
            <p className="text-[11px] text-muted-foreground leading-snug">{t("projects.bearerHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">{t("projects.descriptionLabel")}</Label>
            <Textarea
              id="proj-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              placeholder={t("projects.descriptionPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-icon">{t("projects.iconLabel")}</Label>
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit" disabled={pending} className="w-full gap-2 sm:w-auto">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("projects.saving")}
                </>
              ) : (
                t("projects.saveSource")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

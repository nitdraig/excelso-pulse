"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, Loader2 } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { useTranslation } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const { t, locale } = useTranslation()
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDevResetUrl(null)
    setCopied(false)
    setPending(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": document.documentElement.lang || "es",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), locale }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        debugResetUrl?: string
      }
      if (!res.ok) {
        setError(data.error ?? t("forgotPassword.error"))
        return
      }
      if (typeof data.debugResetUrl === "string" && data.debugResetUrl.length > 0) {
        setDevResetUrl(data.debugResetUrl)
      }
      setDone(true)
    } catch {
      setError(t("forgotPassword.networkError"))
    } finally {
      setPending(false)
    }
  }

  async function copyDevLink() {
    if (!devResetUrl) return
    try {
      await navigator.clipboard.writeText(devResetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-lg backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex justify-center">
          <BrandMark size={56} alt={t("brand.logoAlt")} />
        </div>
        <div>
          <CardTitle className="text-xl tracking-tight">{t("forgotPassword.title")}</CardTitle>
          <CardDescription className="text-balance pt-1">{t("forgotPassword.subtitle")}</CardDescription>
        </div>
      </CardHeader>

      {done ? (
        <CardContent className="space-y-4 px-6 pb-2">
          <p className="text-center text-sm text-muted-foreground">{t("forgotPassword.sent")}</p>
          <p className="text-center text-xs text-muted-foreground">{t("forgotPassword.sentHint")}</p>
          {devResetUrl ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                {t("forgotPassword.devLinkTitle")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t("forgotPassword.devLinkHelp")}</p>
              <div className="mt-3 flex gap-2">
                <Input readOnly value={devResetUrl} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => void copyDevLink()}
                  aria-label={t("forgotPassword.devLinkCopy")}
                  title={t("forgotPassword.devLinkCopy")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {copied ? t("forgotPassword.devLinkCopied") : "\u00a0"}
              </p>
            </div>
          ) : null}
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                className="bg-background/50"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full gap-2" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("forgotPassword.submitting")}
                </>
              ) : (
                t("forgotPassword.submit")
              )}
            </Button>
          </CardFooter>
        </form>
      )}

      <CardFooter className="flex-col border-t border-border/60 pt-4">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/login">{t("forgotPassword.backToLogin")}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

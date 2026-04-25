"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
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
import { PasswordInput } from "@/components/auth/password-input"
import { SKIPY_WEB } from "@/lib/ecosystem-urls"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ResetPasswordForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t("resetPassword.mismatch"))
      return
    }
    if (!token) {
      setError(t("resetPassword.missingToken"))
      return
    }
    setPending(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? t("resetPassword.error"))
        return
      }
      router.push("/login?reset=1")
      router.refresh()
    } catch {
      setError(t("resetPassword.networkError"))
    } finally {
      setPending(false)
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-lg backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex justify-center">
            <BrandMark size={56} alt={t("brand.logoAlt")} />
          </div>
          <CardTitle className="text-xl tracking-tight">{t("resetPassword.invalidLinkTitle")}</CardTitle>
          <CardDescription>{t("resetPassword.invalidLinkBody")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/forgot-password">{t("resetPassword.requestNew")}</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-lg backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex justify-center">
          <BrandMark size={56} alt={t("brand.logoAlt")} />
        </div>
        <div>
          <CardTitle className="text-xl tracking-tight">{t("resetPassword.title")}</CardTitle>
          <CardDescription className="text-balance pt-1">{t("resetPassword.subtitle")}</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np">{t("resetPassword.newPassword")}</Label>
            <PasswordInput
              id="np"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="npc">{t("resetPassword.confirm")}</Label>
            <PasswordInput
              id="npc"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={pending}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              <a
                href={SKIPY_WEB}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {t("authPages.skipyPasswordLink")} ↗
              </a>
              <span className="mx-1.5 text-border">—</span>
              <span>{t("authPages.skipyPasswordHint")}</span>
            </p>
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
                {t("resetPassword.submitting")}
              </>
            ) : (
              t("resetPassword.submit")
            )}
          </Button>
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/login">{t("forgotPassword.backToLogin")}</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { useTranslation } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/auth/password-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const registeredOk = searchParams.get("registered") === "1"
  const resetOk = searchParams.get("reset") === "1"
  const rawCallback = searchParams.get("callbackUrl")
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      })
      if (res?.error) {
        setError(t("login.wrongCredentials"))
        return
      }
      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-lg backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex justify-center">
          <BrandMark size={56} alt={t("brand.logoAlt")} />
        </div>
        <div>
          <CardTitle className="text-xl tracking-tight">{t("login.title")}</CardTitle>
          <CardDescription className="text-balance pt-1">{t("login.subtitle")}</CardDescription>
        </div>
      </CardHeader>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              className="bg-background/50"
            />
          </div>
          {registeredOk ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {t("login.registered")}
            </p>
          ) : null}
          {resetOk ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {t("login.passwordResetDone")}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex-col gap-3 sm:flex-col">
          <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("login.submitting")}
              </>
            ) : (
              t("login.submit")
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              {t("login.createAccount")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

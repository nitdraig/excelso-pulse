"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { useTranslation } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/auth/password-input"
import { SKIPY_WEB } from "@/lib/ecosystem-urls"
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

export function RegisterForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? t("register.error"))
        return
      }
      router.push("/login?registered=1")
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
          <CardTitle className="text-xl tracking-tight">{t("register.title")}</CardTitle>
          <CardDescription className="text-balance pt-1">{t("register.subtitle")}</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("register.name")}</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("register.email")}</Label>
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
            <Label htmlFor="password">{t("register.password")}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <CardFooter className="flex-col gap-3 sm:flex-col">
          <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("register.submitting")}
              </>
            ) : (
              t("register.submit")
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t("register.hasAccount")}{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              {t("register.signIn")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

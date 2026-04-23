"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Terminal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const registeredOk = searchParams.get("registered") === "1"
  const rawCallback = searchParams.get("callbackUrl")
  const callbackUrl =
    rawCallback &&
    rawCallback.startsWith("/") &&
    !rawCallback.startsWith("//")
      ? rawCallback
      : "/"

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
        setError("Correo o contraseña incorrectos.")
        return
      }
      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/80 shadow-lg backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <Terminal className="h-7 w-7 text-primary" />
        </div>
        <div>
          <CardTitle className="text-xl tracking-tight">Excelso Pulse</CardTitle>
          <CardDescription className="text-balance pt-1">
            Accede con tu cuenta de Excelso Pulse.
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
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
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
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
              Cuenta creada. Inicia sesión con tu correo y contraseña.
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
                Entrando…
              </>
            ) : (
              "Entrar al panel"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            ¿Sin cuenta?{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Crear cuenta
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Acceso | Excelso Pulse",
  description: "Inicia sesión en el panel de comando",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Cargando…</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}

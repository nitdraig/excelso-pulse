import type { Metadata } from "next"
import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Registro | Excelso Pulse",
  description: "Crea tu cuenta en Excelso Pulse",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Cargando…</div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  )
}

import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthLoadingFallback } from "@/components/auth/auth-loading-fallback"
import { LoginForm } from "@/components/auth/login-form"
import { LanguageSwitcher } from "@/components/language-switcher"

export const metadata: Metadata = {
  title: "Acceso | Excelso Pulse",
  description: "Inicia sesión en Excelso Pulse, el centro de comando del ecosistema Excelso.",
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Suspense fallback={<AuthLoadingFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

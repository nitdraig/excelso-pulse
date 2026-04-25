import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthLoadingFallback } from "@/components/auth/auth-loading-fallback"
import { RegisterForm } from "@/components/auth/register-form"
import { LanguageSwitcher } from "@/components/language-switcher"

export const metadata: Metadata = {
  title: "Registro | Excelso Pulse",
  description: "Crea tu cuenta en Excelso Pulse, el centro de comando del ecosistema Excelso.",
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Suspense fallback={<AuthLoadingFallback />}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}

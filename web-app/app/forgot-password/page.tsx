import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { LanguageSwitcher } from "@/components/language-switcher"

export const metadata: Metadata = {
  title: "Recuperar contraseña | Excelso Pulse",
  description: "Solicita un enlace para restablecer tu contraseña de Excelso Pulse.",
}

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <ForgotPasswordForm />
    </div>
  )
}

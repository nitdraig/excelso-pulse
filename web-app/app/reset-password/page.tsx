import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthLoadingFallback } from "@/components/auth/auth-loading-fallback"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { LanguageSwitcher } from "@/components/language-switcher"

export const metadata: Metadata = {
  title: "Nueva contraseña | Excelso Pulse",
  description: "Define una nueva contraseña para tu cuenta Excelso Pulse.",
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Suspense fallback={<AuthLoadingFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

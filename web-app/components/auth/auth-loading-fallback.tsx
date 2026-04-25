"use client"

import { useTranslation } from "@/components/i18n-provider"

export function AuthLoadingFallback() {
  const { t } = useTranslation()
  return <div className="text-sm text-muted-foreground">{t("authPages.loading")}</div>
}

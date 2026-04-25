"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Bell, UserRound } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { useTranslation } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"

type NavKey = "dashboard" | "alerts" | "account"

export function AppSubHeader({ active }: { active: NavKey }) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const dashActive =
    active === "dashboard" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  const alertsActive = active === "alerts" || pathname.startsWith("/alerts")
  const accountActive = active === "account" || pathname.startsWith("/account")

  const linkClass = (isActive: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    )

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md supports-backdrop-filter:bg-card/80">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/dashboard" className="shrink-0">
            <BrandMark size={36} alt={t("brand.logoAlt")} />
          </Link>
          <nav className="flex min-w-0 flex-wrap items-center gap-1" aria-label={t("appNav.section")}>
            <Link href="/dashboard" className={linkClass(dashActive)}>
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{t("appNav.dashboard")}</span>
              </span>
            </Link>
            <Link href="/alerts" className={linkClass(alertsActive)}>
              <span className="inline-flex items-center gap-1.5">
                <Bell className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{t("sidebar.alerts")}</span>
              </span>
            </Link>
            <Link href="/account" className={linkClass(accountActive)}>
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{t("sidebar.account")}</span>
              </span>
            </Link>
          </nav>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  )
}

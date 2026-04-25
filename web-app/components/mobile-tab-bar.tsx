"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { BookOpen, LayoutGrid, UserRound } from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

/**
 * Navegación inferior (móvil): Apps y Cuenta requieren sesión o llevan a login;
 * Docs es público.
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { status } = useSession()
  const guest = status === "unauthenticated"

  const appsHref = guest
    ? `/login?callbackUrl=${encodeURIComponent("/dashboard")}`
    : "/dashboard"
  const profileHref = guest
    ? `/login?callbackUrl=${encodeURIComponent("/account")}`
    : "/account"
  const docsHref = "/docs"

  const appsActive = !guest && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
  const profileActive = pathname === "/account" || pathname.startsWith("/account/")
  const docsActive = pathname === "/docs" || pathname.startsWith("/docs/")

  const itemClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-card/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md supports-backdrop-filter:bg-card/85 lg:hidden"
      aria-label={t("mobileNav.primary")}
    >
      <Link href={appsHref} className={itemClass(appsActive)} prefetch={!guest}>
        <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden />
        <span className="truncate">{t("mobileNav.apps")}</span>
      </Link>
      <Link href={profileHref} className={itemClass(profileActive)} prefetch={!guest}>
        <UserRound className="h-5 w-5 shrink-0" aria-hidden />
        <span className="truncate">{t("mobileNav.account")}</span>
      </Link>
      <Link href={docsHref} className={itemClass(docsActive)} prefetch>
        <BookOpen className="h-5 w-5 shrink-0" aria-hidden />
        <span className="truncate">{t("mobileNav.docs")}</span>
      </Link>
    </nav>
  )
}

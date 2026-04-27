"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, LayoutGrid, Lock, Sparkles } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { useTranslation } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"

export function LandingView() {
  const { t } = useTranslation()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]" />

      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark size={44} alt={t("brand.logoAlt")} />
            <span className="text-lg font-semibold tracking-tight">{t("header.title")}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs">{t("landing.navDocs")}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">{t("landing.navLogin")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{t("landing.navRegister")}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("landing.badge")}
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t("landing.headline")}
          </h1>
          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            {t("landing.subhead")}
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/register">
                {t("landing.ctaPrimary")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">{t("landing.ctaSecondary")}</Link>
            </Button>
          </div>
        </div>

        <ul className="mx-auto mt-20 grid max-w-3xl gap-4 sm:grid-cols-3">
          <li className="rounded-2xl border border-border bg-card/60 p-5 text-left shadow-sm backdrop-blur-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-semibold text-foreground">{t("landing.card1Title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("landing.card1Body")}</p>
          </li>
          <li className="rounded-2xl border border-border bg-card/60 p-5 text-left shadow-sm backdrop-blur-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-semibold text-foreground">{t("landing.card2Title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("landing.card2Body")}</p>
          </li>
          <li className="rounded-2xl border border-border bg-card/60 p-5 text-left shadow-sm backdrop-blur-sm sm:col-span-1">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-semibold text-foreground">{t("landing.card3Title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("landing.card3Body")}</p>
          </li>
        </ul>
      </main>

      <footer className="relative z-10 border-t border-border/60 bg-muted/20 py-8 text-center text-xs text-muted-foreground">
        <p>{t("landing.footer")}</p>
        <span className="text-xs text-muted-foreground my-4">Powered by <Link href="https://excelso.xyz" className="text-primary hover:underline">Excelso</Link></span>
      </footer>
    </div>
  )
}

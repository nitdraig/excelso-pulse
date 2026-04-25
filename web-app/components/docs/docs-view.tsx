"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Activity,
  BookOpen,
  ChevronRight,
  Database,
  FileJson2,
  LayoutGrid,
  ListTree,
  Shield,
  Sparkles,
} from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { useTranslation } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SKIPY_API, SKIPY_CLI_NPM, SKIPY_WEB } from "@/lib/ecosystem-urls"
import { cn } from "@/lib/utils"

const REPO_DOCS_BASE =
  "https://github.com/nitdraig/excelso-pulse/tree/main/web-app/docs"
const REPO_AGGREGATOR_DOC =
  "https://github.com/nitdraig/excelso-pulse/blob/main/web-app/docs/pulse-aggregator.md"
const REPO_PULSE_CONTRACT_DOC =
  "https://github.com/nitdraig/excelso-pulse/blob/main/web-app/docs/health-business-pulse.md"

type SectionId = "overview" | "dashboard" | "sources" | "ecosystem" | "roadmap"

function DocHeading({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
        className,
      )}
    >
      <span className="mr-3 inline-block h-7 w-1 rounded-full bg-primary align-middle sm:h-8" aria-hidden />
      {title}
    </h2>
  )
}

function DocCard({
  id,
  children,
  className,
}: {
  id?: SectionId
  children: React.ReactNode
  className?: string
}) {
  return (
    <article
      id={id}
      className={cn(
        "scroll-mt-28 rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10 sm:p-8",
        className,
      )}
    >
      {children}
    </article>
  )
}

export function DocsView() {
  const { t } = useTranslation()
  const { status } = useSession()
  const authed = status === "authenticated"

  const toc: { id: SectionId; label: string }[] = [
    { id: "overview", label: t("docsPage.overviewTitle") },
    { id: "dashboard", label: t("docsPage.appsTitle") },
    { id: "sources", label: t("docsPage.sourcesTitle") },
    { id: "ecosystem", label: t("docsPage.ecosystemTitle") },
    { id: "roadmap", label: t("docsPage.moreTitle") },
  ]

  const dashboardHref = authed ? "/dashboard" : "/login?callbackUrl=%2Fdashboard"

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-xl py-0.5 text-foreground transition-opacity hover:opacity-90"
          >
            <BrandMark size={40} alt={t("brand.logoAlt")} />
            <div className="min-w-0 text-left">
              <span className="block truncate text-sm font-semibold tracking-tight sm:text-base">
                {t("header.title")}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">{t("docsPage.badge")}</span>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/">{t("docsPage.ctaHome")}</Link>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="relative border-b border-border/60 bg-linear-to-b from-primary/[0.07] via-transparent to-transparent">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {t("docsPage.badge")}
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
              {t("docsPage.title")}
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("docsPage.subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 shadow-md" asChild>
                <Link href={dashboardHref}>
                  {t("docsPage.ctaOpenDashboard")}
                  <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
                </Link>
              </Button>
              {!authed ? (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/register">{t("docsPage.ctaCreateAccount")}</Link>
                </Button>
              ) : null}
            </div>
            <p className="mt-6 font-mono text-xs text-muted-foreground sm:text-sm">{t("docsPage.stackLine")}</p>
          </div>

          <ul className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
            <li className="rounded-xl border border-border/80 bg-card/60 p-5 text-left shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <FileJson2 className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-foreground">{t("docsPage.feature1Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("docsPage.feature1Body")}</p>
            </li>
            <li className="rounded-xl border border-border/80 bg-card/60 p-5 text-left shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-foreground">{t("docsPage.feature2Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("docsPage.feature2Body")}</p>
            </li>
            <li className="rounded-xl border border-border/80 bg-card/60 p-5 text-left shadow-sm sm:col-span-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Activity className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-foreground">{t("docsPage.feature3Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("docsPage.feature3Body")}</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:px-6 lg:flex-row lg:gap-12 lg:px-8 lg:pb-12">
        <aside className="hidden shrink-0 lg:block lg:w-52 xl:w-56">
          <div className="sticky top-24 space-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ListTree className="h-3.5 w-3.5" aria-hidden />
              {t("docsPage.tocTitle")}
            </p>
            <nav aria-label={t("docsPage.tocTitle")} className="space-y-1 border-l border-border/80 pl-3">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <Separator className="opacity-60" />
            <p className="text-xs leading-relaxed text-muted-foreground">{t("docsPage.footerNote")}</p>
            <div className="flex flex-col gap-2">
              <a
                href={REPO_AGGREGATOR_DOC}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("docsPage.moreLinkAggregator")} ↗
              </a>
              <a
                href={REPO_PULSE_CONTRACT_DOC}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("docsPage.moreLinkContract")} ↗
              </a>
              <a
                href={SKIPY_WEB}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Skipy ({t("docsPage.ecosystemWeb")}) ↗
              </a>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-10 lg:max-w-3xl">
          <nav
            className="rounded-xl border border-dashed border-border bg-muted/25 p-4 lg:hidden"
            aria-label={t("docsPage.tocTitle")}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("docsPage.tocTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {toc.map((item) => (
                <Button key={item.id} variant="secondary" size="sm" className="h-8 text-xs" asChild>
                  <a href={`#${item.id}`}>{item.label}</a>
                </Button>
              ))}
            </div>
          </nav>

          <DocCard id="overview">
            <DocHeading title={t("docsPage.overviewTitle")} className="mb-6" />
            <div className="mb-6 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("docsPage.endpointCaption")}
              </p>
              <code className="mt-1 block font-mono text-sm text-foreground">{t("docsPage.endpointPath")}</code>
            </div>
            <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              <p>{t("docsPage.overviewP1")}</p>
              <p>{t("docsPage.overviewP2")}</p>
            </div>
          </DocCard>

          <DocCard id="dashboard">
            <DocHeading title={t("docsPage.appsTitle")} className="mb-6" />
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/15 bg-primary/6 p-4">
              <LayoutGrid className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground/90">{t("docsPage.appsP1")}</p>
            </div>
          </DocCard>

          <DocCard id="sources">
            <DocHeading title={t("docsPage.sourcesTitle")} className="mb-6" />
            <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              <p>{t("docsPage.sourcesP1")}</p>
              <p className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <Database className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <span>{t("docsPage.sourcesP2")}</span>
              </p>
            </div>
          </DocCard>

          <DocCard id="ecosystem" className="border-primary/15 bg-linear-to-br from-primary/5 to-transparent">
            <DocHeading title={t("docsPage.ecosystemTitle")} className="mb-6" />
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/15 bg-primary/6 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground/90">{t("docsPage.ecosystemP1")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <a href={SKIPY_WEB} target="_blank" rel="noopener noreferrer">
                  {t("docsPage.ecosystemWeb")}
                  <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                </a>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <a href={SKIPY_API} target="_blank" rel="noopener noreferrer">
                  {t("docsPage.ecosystemApi")}
                  <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                </a>
              </Button>
              <Button variant="secondary" size="sm" className="justify-start gap-2" asChild>
                <a href={SKIPY_CLI_NPM} target="_blank" rel="noopener noreferrer">
                  {t("docsPage.ecosystemCli")}
                  <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                </a>
              </Button>
            </div>
          </DocCard>

          <DocCard id="roadmap" className="border-primary/20 bg-linear-to-br from-primary/6 to-transparent">
            <DocHeading title={t("docsPage.moreTitle")} className="mb-6" />
            <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">{t("docsPage.moreP1")}</p>
            <Separator className="my-6" />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <a href={REPO_AGGREGATOR_DOC} target="_blank" rel="noopener noreferrer">
                  {t("docsPage.moreLinkAggregator")}
                  <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                </a>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                <a href={REPO_PULSE_CONTRACT_DOC} target="_blank" rel="noopener noreferrer">
                  {t("docsPage.moreLinkContract")}
                  <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                </a>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <a href={REPO_DOCS_BASE} target="_blank" rel="noopener noreferrer">
                  {t("docsPage.moreDocsFolder")} ↗
                </a>
              </Button>
            </div>
          </DocCard>
        </div>
      </div>

      <MobileTabBar />
    </div>
  )
}

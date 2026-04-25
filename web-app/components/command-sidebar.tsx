"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Bell, ChevronLeft, UserRound } from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PulsePresentationBadge } from "./pulse-presentation-badge"
import { AppPulse } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CommandSidebarProps {
  apps: AppPulse[]
  selectedApp: string | null
  onSelectApp: (id: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function CommandSidebar({
  apps,
  selectedApp,
  onSelectApp,
  isCollapsed,
  onToggleCollapse,
}: CommandSidebarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-sidebar-foreground">{t("sidebar.portfolio")}</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-sidebar-foreground"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
          />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
              !selectedApp && "bg-sidebar-accent",
            )}
            onClick={() => onSelectApp("")}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{t("sidebar.allApps")}</span>}
          </Button>

          <Separator className="my-3 bg-sidebar-border" />

          {apps.map((app) => (
            <Button
              key={app.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
                selectedApp === app.id && "bg-sidebar-accent",
              )}
              onClick={() => onSelectApp(app.id)}
            >
              <span className="text-lg shrink-0">{app.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{app.name}</span>
                  <PulsePresentationBadge
                    readiness={app.readiness}
                    user_impact={app.user_impact}
                    technicalStatus={app.status}
                    showLabel={false}
                  />
                </>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="space-y-1 border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
            pathname.startsWith("/alerts") && "bg-sidebar-accent",
          )}
          asChild
        >
          <Link href="/alerts" title={t("sidebar.alertsHint")}>
            <Bell className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{t("sidebar.alerts")}</span>}
          </Link>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
            pathname.startsWith("/account") && "bg-sidebar-accent",
          )}
          asChild
        >
          <Link href="/account" title={t("sidebar.accountHint")}>
            <UserRound className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{t("sidebar.account")}</span>}
          </Link>
        </Button>
      </div>
    </aside>
  )
}

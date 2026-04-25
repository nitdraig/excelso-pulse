"use client"

import { useTranslation } from "@/components/i18n-provider"
import { AppStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: AppStatus
  showLabel?: boolean
}

const statusClassNames: Record<
  AppStatus,
  { className: string; dotClassName: string }
> = {
  operational: {
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dotClassName: "bg-emerald-400",
  },
  degraded: {
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dotClassName: "bg-amber-400",
  },
  down: {
    className: "bg-red-500/10 text-red-400 border-red-500/30",
    dotClassName: "bg-red-400",
  },
  unavailable: {
    className: "bg-muted text-muted-foreground border-border",
    dotClassName: "bg-muted-foreground",
  },
}

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const { t } = useTranslation()
  const styles = statusClassNames[status]
  const label = t(`status.${status}`)

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        styles.className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", styles.dotClassName)} />
      {showLabel && <span>{label}</span>}
    </div>
  )
}

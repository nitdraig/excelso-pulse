import { AppStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: AppStatus
  showLabel?: boolean
}

const statusConfig = {
  operational: {
    label: "Operational",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dotClassName: "bg-emerald-400",
  },
  degraded: {
    label: "Degraded",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dotClassName: "bg-amber-400",
  },
  down: {
    label: "Down",
    className: "bg-red-500/10 text-red-400 border-red-500/30",
    dotClassName: "bg-red-400",
  },
  unavailable: {
    label: "No disponible",
    className: "bg-muted text-muted-foreground border-border",
    dotClassName: "bg-muted-foreground",
  },
}

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.dotClassName)} />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}

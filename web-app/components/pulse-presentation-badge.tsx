"use client"

import type { AppStatus, PulseReadiness, PulseUserImpact } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface PulsePresentationBadgeProps {
  readiness: PulseReadiness
  user_impact: PulseUserImpact
  /** Estado técnico del contrato (tooltip / accesibilidad). */
  technicalStatus?: AppStatus
  showLabel?: boolean
}

const presentationConfig: Record<
  PulseUserImpact,
  Record<PulseReadiness, { label: string; className: string; dotClassName: string }>
> = {
  none: {
    starting: {
      label: "Iniciando",
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/25",
      dotClassName: "bg-sky-400 animate-pulse",
    },
    ready: {
      label: "Operativo",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotClassName: "bg-emerald-400",
    },
  },
  limited: {
    starting: {
      label: "Rendimiento limitado",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dotClassName: "bg-amber-400 animate-pulse",
    },
    ready: {
      label: "Rendimiento limitado",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dotClassName: "bg-amber-400",
    },
  },
  outage: {
    starting: {
      label: "No disponible",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
      dotClassName: "bg-red-400",
    },
    ready: {
      label: "No disponible",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
      dotClassName: "bg-red-400",
    },
  },
}

export function PulsePresentationBadge({
  readiness,
  user_impact,
  technicalStatus,
  showLabel = true,
}: PulsePresentationBadgeProps) {
  const cfg = presentationConfig[user_impact][readiness]
  const title =
    technicalStatus != null
      ? `Estado técnico del origen: ${technicalStatus}. Presentación: ${cfg.label}.`
      : undefined

  return (
    <div
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        cfg.className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dotClassName)} />
      {showLabel ? <span>{cfg.label}</span> : null}
    </div>
  )
}

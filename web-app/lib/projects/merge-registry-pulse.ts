import type { AppPulse } from "@/lib/types";
import { defaultInfra } from "@/lib/pulse/normalize";
import type { PulseSummaryEntry } from "@/lib/pulse/types";
import { resolvePulsePresentation } from "@/lib/pulse/derive-presentation";

export type ProjectRegistryLean = {
  _id: { toString(): string };
  slug?: string;
  name: string;
  description?: string;
  icon?: string;
  /** URL pública del front (solo UI). */
  appUrl?: string;
  pulseUrl?: string;
  bearerEnc?: string;
  secretEnvKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function registryId(doc: ProjectRegistryLean): string {
  if (doc.slug && doc.slug.length > 0) return doc.slug;
  return doc._id.toString();
}

function entryByAppId(
  entries: PulseSummaryEntry[],
  appId: string,
): PulseSummaryEntry | undefined {
  return entries.find((e) => e.appId === appId);
}

function withAppUrl(doc: ProjectRegistryLean, pulse: AppPulse): AppPulse {
  const u = doc.appUrl?.trim();
  return u ? { ...pulse, appUrl: u } : pulse;
}

function hasBearerConfigured(doc: ProjectRegistryLean): boolean {
  const enc = doc.bearerEnc?.trim();
  if (enc && enc.length > 0) return true;
  const env = doc.secretEnvKey?.trim();
  return !!(env && env.length > 0);
}

/**
 * Combina el registro Mongo (nombre, slug, URL de origen) con la lectura agregada del pulse.
 */
export function mergeRegistryWithPulseEntries(
  projects: ProjectRegistryLean[],
  entries: PulseSummaryEntry[],
): AppPulse[] {
  return projects.map((doc) => {
    const id = registryId(doc);
    const live = entryByAppId(entries, id);
    const created = doc.createdAt ?? new Date();
    const updated = doc.updatedAt ?? new Date();

    if (!doc.pulseUrl || !hasBearerConfigured(doc)) {
      const now = new Date().toISOString();
      const pres = resolvePulsePresentation(
        "unavailable",
        null,
        undefined,
        undefined,
      );
      const pulse: AppPulse = {
        id,
        name: doc.name,
        description: doc.description ?? "",
        icon: doc.icon ?? "📦",
        status: "unavailable",
        readiness: pres.readiness,
        user_impact: pres.user_impact,
        pulse_version: "?",
        metrics: {
          latency_ms: 0,
          uptime_percent: 0,
          requests_24h: 0,
          error_rate: 0,
        },
        kpis: [],
        infrastructure: defaultInfra(),
        ai_context:
          "Completa la URL pulse del backend y un token Bearer (guardado cifrado) o la variable de entorno legada para que el agregador pueda autenticarse.",
        logs: [
          {
            timestamp: now,
            event: "Origen pulse incompleto en el registro",
            type: "warning",
          },
        ],
        last_updated: updated.toISOString(),
      };
      return withAppUrl(doc, pulse);
    }

    if (!live) {
      const now = new Date().toISOString();
      const pres = resolvePulsePresentation(
        "unavailable",
        null,
        undefined,
        undefined,
      );
      const pulse: AppPulse = {
        id,
        name: doc.name,
        description: doc.description ?? "",
        icon: doc.icon ?? "📦",
        status: "unavailable",
        readiness: pres.readiness,
        user_impact: pres.user_impact,
        pulse_version: "?",
        metrics: {
          latency_ms: 0,
          uptime_percent: 0,
          requests_24h: 0,
          error_rate: 0,
        },
        kpis: [],
        infrastructure: defaultInfra(),
        ai_context:
          "No hay entrada agregada para este slug (revisa PULSE_SOURCES o que la ronda no haya excluido el origen).",
        logs: [
          {
            timestamp: now,
            event: "Sin datos agregados para este proyecto",
            type: "warning",
          },
        ],
        last_updated: updated.toISOString(),
      };
      return withAppUrl(doc, pulse);
    }

    const pulse: AppPulse = {
      id,
      name: doc.name || live.name || id,
      description: doc.description ?? live.description ?? "",
      icon: doc.icon ?? live.icon ?? "📦",
      status: live.status,
      readiness: live.readiness,
      user_impact: live.user_impact,
      pulse_version: live.pulse_version,
      metrics: live.metrics,
      kpis: live.kpis,
      infrastructure: live.infrastructure,
      ai_context: live.ai_context,
      pulseFetchError: live.error,
      logs: live.logs.length
        ? live.logs
        : (() => {
            const healthy =
              live.status === "operational" &&
              live.readiness === "ready" &&
              live.user_impact === "none"
            return [
              {
                timestamp: live.fetchedAt,
                event: healthy
                  ? "Pulse snapshot received."
                  : "Pulse snapshot received; check readiness, impact, or backend payload.",
                type: healthy ? ("success" as const) : ("warning" as const),
              },
            ]
          })(),
      last_updated: live.last_updated,
    };
    return withAppUrl(doc, pulse);
  });
}

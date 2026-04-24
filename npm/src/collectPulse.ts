import { derivePulsePresentation } from "./derivePulsePresentation";
import { derivePulseStatus } from "./derivePulseStatus";
import { getDefaultPulseProbes } from "./getDefaultPulseProbes";
import type {
  InfrastructureItem,
  PulsePayload,
  PulseProbe,
} from "./types";
import { withTimeout } from "./withTimeout";

const readPositiveInt = (value: number | undefined, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;

export interface CollectPulseOptions {
  probes?: PulseProbe[];
  /** Si no se pasan `probes`, se usa esta fábrica; si tampoco existe, se usan los probes por defecto (Mongo). */
  getProbes?: () => PulseProbe[];
  productName?: string;
  environment?: string;
  aiContext?: string;
  businessMetricsJson?: string;
  probeTimeoutMs?: number;
  collectionTimeoutMs?: number;
}

function parseBusinessMetrics(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* omitir */
  }
  return {};
}

async function runSingleProbe(
  probe: PulseProbe,
  timeoutMs: number,
  signal: AbortSignal
): Promise<InfrastructureItem> {
  const started = Date.now();
  try {
    const result = await withTimeout(probe.check(), timeoutMs, signal);
    return {
      id: probe.id,
      name: probe.name,
      kind: probe.kind,
      status: result.status,
      latency_ms: result.latency_ms ?? Date.now() - started,
      detail: result.detail,
    };
  } catch (err: unknown) {
    const aborted =
      err instanceof DOMException && err.name === "AbortError";
    const detail = aborted ? "aborted" : "timeout_or_error";
    return {
      id: probe.id,
      name: probe.name,
      kind: probe.kind,
      status: "unknown",
      latency_ms: Date.now() - started,
      detail,
    };
  }
}

const DEFAULT_PRODUCT = "app";

/**
 * Construye el payload del Pulse (usable desde Express, Next.js Route Handler, etc.).
 */
export async function collectPulse(
  options?: CollectPulseOptions
): Promise<PulsePayload> {
  const collectionStarted = Date.now();
  const probes =
    options?.probes ?? options?.getProbes?.() ?? getDefaultPulseProbes();
  const probeTimeout = readPositiveInt(options?.probeTimeoutMs, 150);
  const collectionTimeout = Math.max(
    readPositiveInt(options?.collectionTimeoutMs, 300),
    probeTimeout + 50
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), collectionTimeout);

  try {
    const infrastructure = await Promise.all(
      probes.map((p) => runSingleProbe(p, probeTimeout, controller.signal))
    );
    const status = derivePulseStatus(infrastructure);
    const { readiness, user_impact } = derivePulsePresentation(status, infrastructure);
    const mem = process.memoryUsage();

    return {
      pulse_version: "1",
      status,
      readiness,
      user_impact,
      context: {
        product_name: options?.productName ?? DEFAULT_PRODUCT,
        environment: options?.environment ?? process.env.NODE_ENV ?? "development",
        generated_at: new Date().toISOString(),
        collection_duration_ms: Date.now() - collectionStarted,
      },
      ai_context: options?.aiContext ?? "",
      metrics: {
        technical: {
          uptime_s: Math.round(process.uptime() * 10) / 10,
          node_version: process.version,
          memory: {
            heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
            heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
            external_mb: Math.round(mem.external / 1024 / 1024),
          },
        },
        business: parseBusinessMetrics(options?.businessMetricsJson),
      },
      infrastructure,
    };
  } finally {
    clearTimeout(timer);
  }
}

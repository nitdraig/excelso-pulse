import { Router } from "express";
import rateLimit from "express-rate-limit";
import { collectPulse, type CollectPulseOptions } from "../collectPulse";
import { createPulseBearerAuthMiddleware } from "../middleware/createBearerAuthMiddleware";
import type { PulsePayload } from "../types";
import { asyncHandler } from "./asyncHandler";

export interface CreatePulseExpressRouterOptions extends CollectPulseOptions {
  /**
   * Token de servicio. Si falta o está vacío, se devuelve `null` (no montar rutas).
   */
  bearerToken: string | undefined;
  /**
   * Si se define (p. ej. `x-monitoring-token`), el mismo `bearerToken` se acepta también por esa cabecera,
   * además de `Authorization: Bearer`. La validación ocurre antes de `collectPulse` / probes.
   */
  monitoringTokenHeaderName?: string;
  /** Ruta HTTP relativa al router montado (p. ej. `"pulse"` → `GET .../pulse`). */
  relativePath?: string;
  /** Por defecto 60 req / minuto por IP. Pasa `false` para desactivar. */
  rateLimit?:
    | false
    | {
        windowMs: number;
        max: number;
      };
  /** Tras un pulse exitoso (útil para logs). */
  onCollected?: (payload: PulsePayload) => void;
}

/**
 * Router Express con `GET /<relativePath>` protegido por Bearer.
 * Monta con `app.use("/internal", router)` para obtener `/internal/pulse`.
 */
export function createPulseExpressRouter(
  opts: CreatePulseExpressRouterOptions
): Router | null {
  const token = opts.bearerToken?.trim();
  if (!token?.length) {
    return null;
  }

  const router = Router();
  const relativePath = (opts.relativePath ?? "pulse").replace(/^\//, "");

  if (opts.rateLimit !== false) {
    const rl = opts.rateLimit ?? {
      windowMs: 60 * 1000,
      max: 60,
    };
    router.use(
      rateLimit({
        windowMs: rl.windowMs,
        max: rl.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "too_many_pulse_requests" },
      })
    );
  }

  const auth = createPulseBearerAuthMiddleware(token, {
    alternateHeaderName: opts.monitoringTokenHeaderName,
  });

  const collectOpts: CollectPulseOptions = {
    probes: opts.probes,
    getProbes: opts.getProbes,
    productName: opts.productName,
    environment: opts.environment,
    aiContext: opts.aiContext,
    businessMetricsJson: opts.businessMetricsJson,
    probeTimeoutMs: opts.probeTimeoutMs,
    collectionTimeoutMs: opts.collectionTimeoutMs,
  };

  router.get(
    `/${relativePath}`,
    auth,
    asyncHandler(async (_req, res) => {
      const payload = await collectPulse(collectOpts);
      opts.onCollected?.(payload);
      res.status(200).json(payload);
    })
  );

  return router;
}

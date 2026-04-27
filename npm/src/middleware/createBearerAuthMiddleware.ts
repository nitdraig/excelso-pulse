import type { Request, Response, NextFunction, RequestHandler } from "express";
import { timingSafeEqualToken } from "../secureBearerCompare";

export interface PulseServiceAuthMiddlewareOptions {
  /**
   * Mismo valor que `expectedToken`, aceptado por esta cabecera además de `Authorization: Bearer`.
   * `req.get` resuelve el nombre sin distinguir mayúsculas (p. ej. `x-monitoring-token`).
   */
  alternateHeaderName?: string;
}

/**
 * Middleware que valida el token **antes** de que la ruta ejecute lógica pesada (p. ej. probes).
 * Por defecto: `Authorization: Bearer <token>`. Opcionalmente también una cabecera alternativa
 * con el mismo secreto (útil para webhooks o proxies que no envían Bearer).
 */
export function createPulseBearerAuthMiddleware(
  expectedToken: string,
  options?: PulseServiceAuthMiddlewareOptions
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!expectedToken.length) {
      res.status(503).json({ error: "pulse_not_configured" });
      return;
    }

    const auth = req.get("authorization");
    if (auth?.toLowerCase().startsWith("bearer ")) {
      const bearer = auth.slice(7).trim();
      if (bearer.length && timingSafeEqualToken(bearer, expectedToken)) {
        next();
        return;
      }
    }

    const alt = options?.alternateHeaderName?.trim();
    if (alt?.length) {
      const headerVal = req.get(alt)?.trim();
      if (headerVal?.length && timingSafeEqualToken(headerVal, expectedToken)) {
        next();
        return;
      }
    }

    res.status(401).json({ error: "unauthorized" });
  };
}

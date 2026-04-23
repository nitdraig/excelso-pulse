import type { Request, Response, NextFunction, RequestHandler } from "express";
import { timingSafeEqualToken } from "../secureBearerCompare";

/**
 * Middleware que exige `Authorization: Bearer <token>` igual a `expectedToken`.
 */
export function createPulseBearerAuthMiddleware(
  expectedToken: string
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!expectedToken.length) {
      res.status(503).json({ error: "pulse_not_configured" });
      return;
    }

    const auth = req.get("authorization");
    if (!auth?.toLowerCase().startsWith("bearer ")) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const token = auth.slice(7).trim();
    if (!token.length || !timingSafeEqualToken(token, expectedToken)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    next();
  };
}

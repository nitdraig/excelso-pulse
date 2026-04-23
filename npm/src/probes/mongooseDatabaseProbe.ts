import mongoose from "mongoose";
import type { PulseProbe, PulseProbeCheckResult } from "../types";

const RS_DISCONNECTED = 0;
const RS_CONNECTED = 1;
const RS_CONNECTING = 2;
const RS_DISCONNECTING = 3;

async function pingDb(db: NonNullable<typeof mongoose.connection.db>) {
  await db.admin().command({ ping: 1 });
}

export function createMongooseDatabaseProbe(): PulseProbe {
  return {
    id: "mongodb",
    name: "MongoDB",
    kind: "database",
    async check(): Promise<PulseProbeCheckResult> {
      const started = Date.now();
      const rs = mongoose.connection.readyState;
      const db = mongoose.connection.db;

      if (rs === RS_CONNECTING) {
        return {
          status: "degraded",
          latency_ms: Date.now() - started,
          detail: "connecting",
        };
      }
      if (rs === RS_DISCONNECTING) {
        return {
          status: "degraded",
          latency_ms: Date.now() - started,
          detail: "disconnecting",
        };
      }
      if (rs !== RS_CONNECTED || !db) {
        return {
          status: "down",
          latency_ms: Date.now() - started,
          detail: "not_connected",
        };
      }

      try {
        await pingDb(db);
        return {
          status: "up",
          latency_ms: Date.now() - started,
        };
      } catch {
        try {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 75);
          });
          if (mongoose.connection.readyState !== RS_CONNECTED) {
            return {
              status: "down",
              latency_ms: Date.now() - started,
              detail: "ping_failed",
            };
          }
          await pingDb(mongoose.connection.db!);
          return {
            status: "up",
            latency_ms: Date.now() - started,
            detail: "recovered_after_retry",
          };
        } catch {
          return {
            status: "down",
            latency_ms: Date.now() - started,
            detail: "ping_failed",
          };
        }
      }
    },
  };
}

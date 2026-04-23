import type { PulseProbe } from "./types";
import { createMongooseDatabaseProbe } from "./probes/mongooseDatabaseProbe";

export function getDefaultPulseProbes(): PulseProbe[] {
  return [createMongooseDatabaseProbe()];
}

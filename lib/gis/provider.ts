/** Server-only: selects the GIS provider from GIS_MODE (default mock). */
import { createLiveProvider } from "./client";
import { mockProvider } from "./mock";
import type { GisProvider } from "./types";

export function gisMode(env: NodeJS.ProcessEnv = process.env): "live" | "mock" {
  return env.GIS_MODE?.trim().toLowerCase() === "live" ? "live" : "mock";
}

export function getProvider(env: NodeJS.ProcessEnv = process.env): GisProvider {
  return gisMode(env) === "live" ? createLiveProvider() : mockProvider;
}

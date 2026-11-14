import type { ApiErrorCode, HazardKind, HazardStatus, NearbyResource } from "../contracts";

/** Normalized GIS lookup result produced by either the mock or the live provider. */
export interface GisLookup {
  matched: string;
  lat: number;
  lon: number;
  score?: number;
  zoningCode: string | null;
  zoningRaw?: Record<string, unknown>;
  hazards: { kind: HazardKind; status: HazardStatus; detail?: string }[];
  nearby: NearbyResource[];
  warnings: string[];
}

export interface GisProvider {
  readonly dataSource: "live" | "mock";
  /** Resolve an address to a full lookup. Throws GisError for expected failures. */
  lookup(address: string): Promise<GisLookup>;
}

export class GisError extends Error {
  readonly code: ApiErrorCode;
  readonly candidates?: string[];
  constructor(code: ApiErrorCode, message: string, candidates?: string[]) {
    super(message);
    this.name = "GisError";
    this.code = code;
    this.candidates = candidates;
  }
}

export const HAZARD_KINDS: readonly HazardKind[] = ["wildfire", "flood", "seismic", "dam_inundation"];

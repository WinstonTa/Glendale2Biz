/**
 * Glendale2Biz shared contracts — owned by the architect.
 * Frontend and backend both code against these types. Do not edit without
 * announcing the change to every agent (see MASTER_INSTRUCTIONS.md §6).
 *
 * Module map (implementations owned by backend-dev):
 *   import { BUSINESS_TYPES, getBusinessType, matchBusinessType, buildRoadmap, t } from "@/lib/rules";
 *   import { DEMO_ADDRESSES } from "@/lib/gis/demo";   // client-safe
 *   POST /api/site-check   body: SiteCheckRequest  →  SiteCheckResponse | ApiError
 */

export type Locale = "en" | "es" | "hy";
export const LOCALES: readonly Locale[] = ["en", "es", "hy"] as const;
export type LocalizedText = { en: string; es: string; hy: string };

// ---------- Business intake ----------

export type BusinessCategory =
  | "food"
  | "retail"
  | "personal_care"
  | "fitness"
  | "auto"
  | "services"
  | "childcare"
  | "home_based"
  | "tech";

export interface BusinessType {
  /** stable id, e.g. "cafe", "salon", "auto_repair", "software_startup" */
  id: string;
  category: BusinessCategory;
  name: LocalizedText;
  /** one-line description shown on the card */
  blurb: LocalizedText;
  /** emoji used as the card icon */
  icon: string;
  /** lowercase keywords for free-text matching (EN + ES + HY where practical) */
  keywords: string[];
  flags: {
    food: boolean;
    alcohol: boolean;
    healthPermit: boolean;
    homeBasedOk: boolean;
    sellsGoods: boolean;
    tech: boolean;
  };
}

export type LocationMode = "address" | "home" | "undecided";

// ---------- Site check (GIS) ----------

export interface SiteCheckRequest {
  address: string;
  businessTypeId: string;
  locale: Locale;
}

export type VerdictStatus = "allowed" | "conditional" | "not_allowed" | "unknown";
export type HazardKind = "wildfire" | "flood" | "seismic" | "dam_inundation";
export type HazardStatus = "in_zone" | "not_in_zone" | "unavailable";
export type ResourceKind =
  | "schools"
  | "parks"
  | "bus_stops"
  | "police_stations"
  | "fire_stations"
  | "libraries"
  | "hospitals";

export interface Verdict {
  status: VerdictStatus;
  summary: LocalizedText;
  notes: LocalizedText[];
}

export interface Hazard {
  kind: HazardKind;
  status: HazardStatus;
  label: LocalizedText;
  /** raw zone detail from the source, e.g. "Very High" or "Zone AE" */
  detail?: string;
}

export interface NearbyResource {
  kind: ResourceKind;
  name: string;
  address?: string;
  /** straight-line distance in meters */
  distanceM: number;
}

export interface SiteCheckResponse {
  address: { input: string; matched: string; lat: number; lon: number; score?: number };
  zoning: { code: string | null; name: LocalizedText | null; raw?: Record<string, unknown> };
  verdict: Verdict;
  hazards: Hazard[];
  nearby: NearbyResource[];
  meta: {
    /** "mock" MUST be shown in the UI as a visible "Demo data" badge */
    dataSource: "live" | "mock";
    fetchedAt: string;
    warnings: string[];
  };
}

export type ApiErrorCode =
  | "ADDRESS_NOT_FOUND"
  | "OUTSIDE_GLENDALE"
  | "AMBIGUOUS_ADDRESS"
  | "GIS_UNAVAILABLE"
  | "BAD_REQUEST";

export interface ApiError {
  error: { code: ApiErrorCode; message: string; candidates?: string[] };
}

// ---------- Roadmap ----------

export type RoadmapPhase = "plan" | "register" | "permit" | "open";
export const ROADMAP_PHASES: readonly RoadmapPhase[] = ["plan", "register", "permit", "open"] as const;

export interface RoadmapStep {
  id: string;
  phase: RoadmapPhase;
  /** global sort order across all phases */
  order: number;
  title: LocalizedText;
  description: LocalizedText;
  /** why this step applies to this founder */
  appliesBecause: LocalizedText;
  agency: string;
  /** official source URL — required, https */
  url: string;
  costEstimate?: string;
  timeEstimate?: string;
  required: boolean;
  /** false ⇒ UI shows "confirm with agency" */
  verified: boolean;
}

export interface RoadmapInput {
  businessTypeId: string;
  locationMode: LocationMode;
  site?: SiteCheckResponse | null;
}

export interface Roadmap {
  steps: RoadmapStep[];
  generatedAt: string;
}

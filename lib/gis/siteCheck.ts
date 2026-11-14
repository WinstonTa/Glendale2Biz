import { z } from "zod";
import type { ApiError, ApiErrorCode, Hazard, LocalizedText, SiteCheckResponse } from "../contracts";
import { LOCALES } from "../contracts";
import { getBusinessType } from "../rules/businessTypes";
import { evaluateZoning, zoneName } from "../rules/zoning";
import { L } from "../rules/text";
import { GisError, HAZARD_KINDS, type GisProvider } from "./types";

export const SiteCheckRequestSchema = z.object({
  address: z.string().trim().min(1).max(200),
  businessTypeId: z.string().min(1).max(64),
  locale: z.enum(LOCALES as unknown as ["en", "es", "hy"]),
});

export const HAZARD_LABELS: Record<Hazard["kind"], LocalizedText> = {
  wildfire: L("Wildfire hazard zone", "Zona de riesgo de incendio forestal", "Անտառային հրդեհի վտանգի գոտի"),
  flood: L("Flood zone", "Zona de inundación", "Ջրհեղեղի գոտի"),
  seismic: L("Earthquake fault / liquefaction zone", "Zona de falla sísmica / licuefacción", "Երկրաշարժի խզվածքի / հողի հեղուկացման գոտի"),
  dam_inundation: L("Dam inundation area", "Zona de inundación por presa", "Ամբարտակի ողողման գոտի"),
};

const STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  ADDRESS_NOT_FOUND: 404,
  OUTSIDE_GLENDALE: 422,
  AMBIGUOUS_ADDRESS: 409,
  GIS_UNAVAILABLE: 503,
};

export interface SiteCheckDeps {
  provider: GisProvider;
  now?: () => Date;
}

export interface HandlerResult {
  status: number;
  body: SiteCheckResponse | ApiError;
}

export function apiError(code: ApiErrorCode, message: string, candidates?: string[]): HandlerResult {
  const error: ApiError["error"] = { code, message };
  if (candidates?.length) error.candidates = candidates;
  return { status: STATUS[code], body: { error } };
}

/**
 * Pure site-check handler: validate → provider.lookup → rules. No env access, no globals.
 * The route wires `provider` from GIS_MODE. Tests pass `mockProvider` or a stub.
 */
export async function handleSiteCheck(body: unknown, deps: SiteCheckDeps): Promise<HandlerResult> {
  const parsed = SiteCheckRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => i.path.join(".") || "body"))].join(", ");
    return apiError("BAD_REQUEST", `Invalid request: check ${fields}.`);
  }
  const { address, businessTypeId } = parsed.data;
  const business = getBusinessType(businessTypeId);
  if (!business) return apiError("BAD_REQUEST", `Unknown businessTypeId "${businessTypeId}".`);

  let lookup;
  try {
    lookup = await deps.provider.lookup(address);
  } catch (e) {
    if (e instanceof GisError) return apiError(e.code, e.message, e.candidates);
    return apiError("GIS_UNAVAILABLE", "Glendale GIS service is unavailable right now. Please try again.");
  }

  const byKind = new Map(lookup.hazards.map((h) => [h.kind, h]));
  const hazards: Hazard[] = HAZARD_KINDS.map((kind) => {
    const h = byKind.get(kind);
    const out: Hazard = { kind, status: h?.status ?? "unavailable", label: HAZARD_LABELS[kind] };
    if (h?.detail) out.detail = h.detail;
    return out;
  });

  const now = deps.now?.() ?? new Date();
  const response: SiteCheckResponse = {
    address: { input: address, matched: lookup.matched, lat: lookup.lat, lon: lookup.lon, score: lookup.score },
    zoning: {
      code: lookup.zoningCode,
      name: zoneName(lookup.zoningCode),
      raw: lookup.zoningRaw,
    },
    verdict: evaluateZoning(lookup.zoningCode, business),
    hazards,
    nearby: [...lookup.nearby].sort((a, b) => a.distanceM - b.distanceM),
    meta: {
      dataSource: deps.provider.dataSource,
      fetchedAt: now.toISOString(),
      warnings: lookup.warnings,
    },
  };
  // A known code we have no rule for still needs a name for the UI.
  if (response.zoning.code && !response.zoning.name) {
    const c = response.zoning.code;
    response.zoning.name = L(`Zone ${c}`, `Zona ${c}`, `Գոտի ${c}`);
  }
  return { status: 200, body: response };
}

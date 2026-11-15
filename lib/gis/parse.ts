/**
 * Tolerant parsers for Glendale GIS MCP tool results.
 * The exact result shapes are not confirmed yet, so every parser probes several plausible layouts.
 * Pure functions — unit-testable without network.
 */
import type { HazardKind, HazardStatus, NearbyResource, ResourceKind } from "../contracts";
import { HAZARD_KINDS } from "./types";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Case-insensitive key lookup over a list of candidate names. */
export function pick(o: Obj | undefined, ...keys: string[]): unknown {
  if (!o) return undefined;
  const lower = new Map(Object.keys(o).map((k) => [k.toLowerCase(), k]));
  for (const k of keys) {
    const real = lower.get(k.toLowerCase());
    if (real !== undefined && o[real] !== undefined && o[real] !== null) return o[real];
  }
  return undefined;
}

/** A tool returned isError. `body` is the parsed JSON error, e.g. {"error": "...", "candidates": [...]}. */
export class ToolError extends Error {
  readonly body: unknown;
  constructor(message: string, body: unknown) {
    super(message);
    this.name = "ToolError";
    this.body = body;
  }
}

/** MCP CallToolResult → JSON payload. Prefers structuredContent, else JSON in the first text block. */
export function toolPayload(result: unknown): unknown {
  if (!isObj(result)) return result;
  const content = Array.isArray(result.content) ? (result.content as Obj[]) : [];
  const text = content.find((c) => isObj(c) && c.type === "text" && typeof c.text === "string")?.text as string | undefined;
  if (result.isError) {
    let body: unknown = result.structuredContent ?? text;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { /* keep text */ }
    }
    const msg = isObj(body) && typeof body.error === "string" ? body.error : (text ?? "unknown error");
    throw new ToolError(`GIS tool error: ${msg.slice(0, 300)}`, body);
  }
  if (result.structuredContent !== undefined && result.structuredContent !== null) {
    const sc = result.structuredContent;
    // Some servers wrap the payload as { result: ... }
    if (isObj(sc) && Object.keys(sc).length === 1 && "result" in sc) return sc.result;
    return sc;
  }
  if (text !== undefined) {
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }
  return result;
}

const LIST_KEYS = ["results", "candidates", "matches", "features", "records", "rows", "items", "data", "addresses"];

/** Find the main list of records in a payload. */
export function recordsOf(payload: unknown): Obj[] {
  if (Array.isArray(payload)) return payload.filter(isObj).map(flattenFeature);
  if (!isObj(payload)) return [];
  for (const k of LIST_KEYS) {
    const v = pick(payload, k);
    if (Array.isArray(v)) return v.filter(isObj).map(flattenFeature);
    if (isObj(v)) {
      const inner = recordsOf(v);
      if (inner.length) return inner;
    }
  }
  return [flattenFeature(payload)];
}

/** GeoJSON / Esri feature → flat attributes (keeps geometry under `__geometry`). */
function flattenFeature(f: Obj): Obj {
  const attrs = pick(f, "attributes", "properties");
  if (!isObj(attrs)) return f;
  const top: Obj = {};
  for (const [k, v] of Object.entries(f)) if (!/^(attributes|properties|geometry|ref)$/i.test(k)) top[k] = v;
  // top-level fields (e.g. name / address / distance_m added by the server) win over raw attributes
  return { ...attrs, ...top, __geometry: pick(f, "geometry", "location") };
}

export function coordsOf(o: Obj): { lat: number; lon: number } | null {
  const loc = pick(o, "location", "geometry", "__geometry", "point", "coords", "coordinates", "latlon");
  const sources: Obj[] = [o];
  if (isObj(loc)) sources.push(loc);
  for (const s of sources) {
    const lat = num(pick(s, "lat", "latitude", "y"));
    const lon = num(pick(s, "lon", "lng", "long", "longitude", "x"));
    if (lat !== undefined && lon !== undefined) return { lat, lon };
    const c = pick(s, "coordinates");
    if (Array.isArray(c) && c.length >= 2 && num(c[0]) !== undefined && num(c[1]) !== undefined) {
      return { lat: num(c[1])!, lon: num(c[0])! }; // GeoJSON [lon, lat]
    }
  }
  if (Array.isArray(loc) && loc.length >= 2 && num(loc[0]) !== undefined) return { lat: num(loc[1])!, lon: num(loc[0])! };
  return null;
}

export interface GeocodeCandidate {
  matched: string;
  lat: number;
  lon: number;
  score?: number;
  city?: string;
  inCity?: boolean;
  /** Esri match type, e.g. "PointAddress", "StreetAddress", "StreetName" (street only, no house number) */
  matchType?: string;
}

export function parseGeocode(payload: unknown, input: string): GeocodeCandidate[] {
  const out: GeocodeCandidate[] = [];
  for (const r of recordsOf(payload)) {
    const c = coordsOf(r);
    if (!c) continue;
    const inCityRaw = pick(r, "in_glendale", "inGlendale", "within_city", "in_city", "inside_city", "is_glendale");
    out.push({
      ...c,
      matched:
        str(pick(r, "matched", "matched_address", "matchedAddress", "match_addr", "formatted_address", "address", "label", "full_address", "name")) ??
        input,
      score: num(pick(r, "score", "confidence", "match_score")),
      city: str(pick(r, "city", "municipality", "place", "jurisdiction")),
      inCity: typeof inCityRaw === "boolean" ? inCityRaw : undefined,
      matchType: str(pick(r, "match_type", "matchType", "addr_type", "Addr_type")),
    });
  }
  out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return out;
}

/** Rough Glendale city bounding box (generous). */
export const GLENDALE_BBOX = { minLat: 34.10, maxLat: 34.28, minLon: -118.34, maxLon: -118.17 };
export function inGlendaleBBox(lat: number, lon: number): boolean {
  const b = GLENDALE_BBOX;
  return lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon;
}

const ZONE_KEYS = [
  "zone_distr", // live Glendale field (verified 2026-11-14), e.g. "DSP/CC", "C3 III PPD", "IMU R"
  "zone", "zoning", "zone_code", "zonecode", "zoning_code", "zoningcode", "zone_class", "zoneclass",
  "zone_name", "zoning_district", "district", "zone_", "zn", "zoning_designation", "code",
];

export function parseZoning(payload: unknown): { code: string | null; raw?: Record<string, unknown> } {
  const recs = recordsOf(payload);
  const rec = recs.find((r) => Object.keys(r).length > 0);
  if (!rec) return { code: null };
  // raw = the source attributes only (live: features[0].attributes)
  const feats = isObj(payload) ? pick(payload, "features") : undefined;
  const firstAttrs = Array.isArray(feats) && isObj(feats[0]) ? pick(feats[0] as Obj, "attributes", "properties") : undefined;
  const raw: Record<string, unknown> = isObj(firstAttrs) ? { ...firstAttrs } : { ...rec };
  delete raw.__geometry;
  let code = str(pick(rec, ...ZONE_KEYS));
  if (!code) {
    // last resort: any short string field whose key mentions "zon"
    const k = Object.keys(rec).find((key) => /zon/i.test(key) && typeof rec[key] === "string" && (rec[key] as string).length <= 24);
    code = k ? str(rec[k]) : undefined;
  }
  return { code: code ?? null, raw };
}

const HAZARD_RES: Record<HazardKind, RegExp> = {
  dam_inundation: /dam|inundation/i,
  wildfire: /wildfire|fire_?hazard|vhfhsz|fhsz|\bfire\b|fire_?zone|fire_?severity/i,
  flood: /flood|fema|sfha/i,
  seismic: /seism|fault|liquef|landslide|earthquake|alquist/i,
};

function hazardKindOf(label: string): HazardKind | null {
  if (/station/i.test(label)) return null;
  for (const k of ["dam_inundation", "wildfire", "flood", "seismic"] as HazardKind[]) if (HAZARD_RES[k].test(label)) return k;
  return null;
}

function interpret(v: unknown): { status: HazardStatus; detail?: string } {
  if (typeof v === "boolean") return { status: v ? "in_zone" : "not_in_zone" };
  if (typeof v === "string") {
    if (/^(no|none|false|not[\s_]in|outside|n\/a|minimal)/i.test(v) || /zone x\b/i.test(v)) return { status: "not_in_zone", detail: v };
    return { status: "in_zone", detail: v };
  }
  if (Array.isArray(v)) return v.length ? { status: "in_zone", detail: detailOf(v[0]) } : { status: "not_in_zone" };
  if (isObj(v)) {
    const flag = pick(v, "in_zone", "inZone", "intersects", "within", "hit", "inside", "is_in_zone", "present", "found", "affected", "value");
    const detail = detailOf(v);
    if (typeof flag === "boolean") return { status: flag ? "in_zone" : "not_in_zone", detail };
    if (typeof flag === "string") return interpret(flag);
    const count = num(pick(v, "count", "matches", "num_features", "feature_count"));
    if (count !== undefined) return { status: count > 0 ? "in_zone" : "not_in_zone", detail };
    const st = str(pick(v, "status"));
    if (st) return /not|no|outside|clear/i.test(st) ? { status: "not_in_zone", detail } : { status: "in_zone", detail };
    const feats = pick(v, "features", "records", "results", "zones");
    if (Array.isArray(feats)) return feats.length ? { status: "in_zone", detail: detail ?? detailOf(feats[0]) } : { status: "not_in_zone" };
  }
  return { status: "unavailable" };
}

function detailOf(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (!isObj(v)) return undefined;
  const flat = flattenFeature(v);
  const d = pick(flat, "detail", "zone", "fld_zone", "hazard_class", "haz_class", "severity", "class", "category", "label", "name", "description");
  return typeof d === "string" || typeof d === "number" ? String(d) : undefined;
}

const LIVE_HAZARD_LAYERS: Record<string, HazardKind> = {
  wildfire: "wildfire",
  flood: "flood",
  fault: "seismic",
  liquefaction: "seismic",
  landslide: "seismic",
  dam_inundation: "dam_inundation",
  // debris_flow (USGS post-fire) has no HazardKind in the contract; ignored.
};
const SEISMIC_LABEL: Record<string, string> = {
  fault: "Earthquake fault zone",
  liquefaction: "Liquefaction zone",
  landslide: "Earthquake-induced landslide zone",
};

/**
 * Live shape (verified 2026-11-14): { wildfire: {status, class_field, matches:[{attributes}]}, flood, fault,
 * liquefaction, landslide, dam_inundation, debris_flow }. status is in_zone | not_in_zone | unavailable.
 * Flood: FEMA returns status "in_zone" for every mapped polygon, including Zone X (minimal hazard).
 * We report flood in_zone only for a Special Flood Hazard Area (SFHA_TF = "T", or zone A or V).
 */
function parseLiveHazards(payload: Obj): { kind: HazardKind; status: HazardStatus; detail?: string }[] | null {
  const layers = Object.entries(payload).filter(
    ([k, v]) => k in LIVE_HAZARD_LAYERS && isObj(v) && typeof (v as Obj).status === "string",
  ) as [string, Obj][];
  if (!layers.length) return null;
  const rank = (x: HazardStatus) => (x === "in_zone" ? 2 : x === "not_in_zone" ? 1 : 0);
  const found = new Map<HazardKind, { status: HazardStatus; detail?: string }>();
  for (const [layer, v] of layers) {
    const kind = LIVE_HAZARD_LAYERS[layer];
    let status: HazardStatus =
      v.status === "in_zone" ? "in_zone" : v.status === "not_in_zone" ? "not_in_zone" : "unavailable";
    const m0 = Array.isArray(v.matches) && isObj(v.matches[0]) ? (pick(v.matches[0] as Obj, "attributes") as Obj | undefined) : undefined;
    let detail: string | undefined;
    if (kind === "flood" && m0) {
      const zone = str(pick(m0, "FLD_ZONE"));
      const sub = str(pick(m0, "ZONE_SUBTY"));
      const sfha = str(pick(m0, "SFHA_TF"));
      detail = zone ? `Zone ${zone}${sub ? ` (${sub.toLowerCase()})` : ""}` : undefined;
      if (status === "in_zone" && !(sfha === "T" || /^[AV]/i.test(zone ?? ""))) status = "not_in_zone";
    } else if (kind === "wildfire" && m0) {
      const cf = str(v.class_field) ?? "FHSZ_Description";
      const cls = pick(m0, cf);
      if (cls != null) detail = String(cls);
    } else if (kind === "seismic" && status === "in_zone") {
      detail = SEISMIC_LABEL[layer];
    }
    const prev = found.get(kind);
    if (!prev || rank(status) > rank(prev.status)) found.set(kind, { status, ...(detail ? { detail } : {}) });
    else if (status === "in_zone" && prev.status === "in_zone" && detail) {
      prev.detail = prev.detail ? `${prev.detail}; ${detail}` : detail;
    }
  }
  return HAZARD_KINDS.map((kind) => ({ kind, status: "unavailable" as HazardStatus, ...found.get(kind) }));
}

export function parseHazards(payload: unknown): { kind: HazardKind; status: HazardStatus; detail?: string }[] {
  if (isObj(payload)) {
    const live = parseLiveHazards(payload);
    if (live) return live;
  }
  const found = new Map<HazardKind, { status: HazardStatus; detail?: string }>();
  const consider = (label: string, v: unknown) => {
    const kind = hazardKindOf(label);
    if (!kind) return;
    const r = interpret(v);
    if (r.status === "unavailable") return;
    // Several sub-layers can map to one kind (fault + liquefaction ⇒ seismic): any in_zone wins.
    const prev = found.get(kind);
    if (!prev || (prev.status === "not_in_zone" && r.status === "in_zone")) found.set(kind, r);
  };
  const root = isObj(payload) && isObj(pick(payload, "hazards")) ? (pick(payload, "hazards") as Obj) : payload;
  if (isObj(root)) for (const [k, v] of Object.entries(root)) if (!Array.isArray(v) || k !== "hazards") consider(k, v);
  const list = Array.isArray(root) ? root : isObj(payload) ? pick(payload, "hazards", "results", "layers", "items") : undefined;
  if (Array.isArray(list)) {
    for (const item of list) {
      if (!isObj(item)) continue;
      const label = [pick(item, "kind", "type", "hazard", "layer", "dataset", "name", "id")].map((x) => (x == null ? "" : String(x))).join(" ");
      consider(label, item);
    }
  }
  return HAZARD_KINDS.map((kind) => ({ kind, status: "unavailable" as HazardStatus, ...found.get(kind) }));
}

const KIND_ALIASES: Record<ResourceKind, RegExp> = {
  schools: /school/i,
  parks: /park/i,
  bus_stops: /bus|transit|stop/i,
  police_stations: /police/i,
  fire_stations: /fire/i,
  libraries: /librar/i,
  hospitals: /hospital|medical/i,
};
function resourceKindOf(label: string): ResourceKind | null {
  for (const k of Object.keys(KIND_ALIASES) as ResourceKind[]) if (KIND_ALIASES[k].test(label)) return k;
  return null;
}

export function haversineM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toResource(item: Obj, kind: ResourceKind, origin: { lat: number; lon: number }): NearbyResource | null {
  const flat = flattenFeature(item);
  const name = str(pick(flat, "name", "title", "label", "facility", "facility_name", "school_name", "park_name", "stop_name", "station_name", "description"));
  if (!name) return null;
  let d = num(pick(flat, "distance_m", "distanceM", "distance_meters", "meters", "dist_m", "distance"));
  if (d === undefined) {
    const km = num(pick(flat, "distance_km", "km"));
    if (km !== undefined) d = km * 1000;
    const mi = num(pick(flat, "distance_mi", "miles"));
    if (d === undefined && mi !== undefined) d = mi * 1609.34;
  }
  if (d === undefined) {
    const c = coordsOf(flat);
    if (c) d = haversineM(origin, c);
  }
  const address = str(pick(flat, "address", "addr", "street_address", "location_address", "full_address"));
  return { kind, name, ...(address ? { address } : {}), distanceM: Math.round(d ?? 0) };
}

/** "GLENDALE HERITAGE GARDEN" to "Glendale Heritage Garden" (only for ALL-CAPS names). */
export function titleCaseIfShouting(s: string): string {
  if (s !== s.toUpperCase() || !/[A-Z]/.test(s)) return s;
  return s.toLowerCase().replace(/(^|[\s\-/(&.])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase());
}

function tidy(r: NearbyResource): NearbyResource {
  let name = r.name;
  let address = r.address;
  // Beeline stops: name is just "SB Glendale"; the address carries the cross street ("SB Glendale NS Broadway").
  if (r.kind === "bus_stops" && address) {
    name = address;
    address = undefined;
  }
  const out: NearbyResource = { kind: r.kind, name: titleCaseIfShouting(name), distanceM: r.distanceM };
  if (address) out.address = titleCaseIfShouting(address);
  return out;
}

export function parseNearby(payload: unknown, origin: { lat: number; lon: number }): NearbyResource[] {
  // Live shape (verified 2026-11-14): { groups: [{ kind, status, results: [{ name, address, distance_m, attributes }] }] }
  const groups = isObj(payload) ? pick(payload, "groups") : undefined;
  if (Array.isArray(groups)) {
    const grouped: NearbyResource[] = [];
    for (const g of groups) {
      if (!isObj(g) || !Array.isArray(g.results)) continue;
      const kind = resourceKindOf(String(g.kind ?? g.title ?? ""));
      if (!kind) continue;
      for (const it of g.results) if (isObj(it)) { const r = toResource(it, kind, origin); if (r) grouped.push(tidy(r)); }
    }
    return grouped.sort((a, b) => a.distanceM - b.distanceM);
  }
  const out: NearbyResource[] = [];
  const root = isObj(payload) ? (pick(payload, "results", "resources", "nearest", "data") ?? payload) : payload;
  if (isObj(root)) {
    // { schools: [...], parks: [...] }
    for (const [k, v] of Object.entries(root)) {
      const kind = resourceKindOf(k);
      if (!kind) continue;
      const items = Array.isArray(v) ? v : isObj(v) ? recordsOf(v) : [];
      for (const it of items) if (isObj(it)) { const r = toResource(it, kind, origin); if (r) out.push(r); }
    }
  }
  if (!out.length) {
    for (const it of recordsOf(root)) {
      const label = String(pick(it, "kind", "type", "category", "dataset", "layer", "resource_type") ?? "");
      const kind = resourceKindOf(label);
      if (!kind) continue;
      const r = toResource(it, kind, origin);
      if (r) out.push(r);
    }
  }
  return out.sort((a, b) => a.distanceM - b.distanceM);
}

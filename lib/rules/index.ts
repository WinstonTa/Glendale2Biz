/**
 * Public rules API (client-safe: pure TypeScript, no network, no secrets).
 *   import { BUSINESS_TYPES, getBusinessType, matchBusinessType, buildRoadmap, t } from "@/lib/rules";
 */
export { BUSINESS_TYPES, getBusinessType, matchBusinessType } from "./businessTypes";
export { buildRoadmap, SOURCES } from "./roadmap";
export { t, L } from "./text";
export { evaluateZoning, zoneFamily, zoneName, normalizeZoneCode, DISCLAIMER, ZONE_MATRIX, ZONE_NAMES } from "./zoning";
export type { ZoneFamily } from "./zoning";

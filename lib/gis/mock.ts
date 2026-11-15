import broadway from "./fixtures/613-e-broadway.json";
import sanFernando from "./fixtures/4500-san-fernando-rd.json";
import cleveland from "./fixtures/1200-cleveland-rd.json";
import honolulu from "./fixtures/2900-honolulu-ave.json";
import type { HazardKind, HazardStatus, ResourceKind } from "../contracts";
import { GisError, type GisLookup, type GisProvider } from "./types";

interface Fixture {
  aliases: string[];
  street: string;
  matched: string;
  lat: number;
  lon: number;
  score?: number;
  zoning: { code: string | null; raw?: Record<string, unknown> };
  hazards: { kind: string; status: string; detail?: string }[];
  nearby: { kind: string; name: string; address?: string; distanceM: number }[];
}

export const FIXTURES: readonly Fixture[] = [broadway, sanFernando, cleveland, honolulu] as Fixture[];

const OTHER_CITIES = [
  "los angeles", "burbank", "pasadena", "la canada", "la cañada", "flintridge", "eagle rock",
  "san fernando", "new york", "san francisco", "san diego", "anaheim", "santa monica", "long beach", "hollywood",
];

/** Lowercase, strip punctuation, abbreviate common street words. */
export function normalizeAddress(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\beast\b/g, "e")
    .replace(/\bwest\b/g, "w")
    .replace(/\bnorth\b/g, "n")
    .replace(/\bsouth\b/g, "s")
    .replace(/\broad\b/g, "rd")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\s+/g, " ")
    .trim();
}

function toLookup(f: Fixture, warnings: string[]): GisLookup {
  return {
    matched: f.matched,
    lat: f.lat,
    lon: f.lon,
    score: f.score,
    zoningCode: f.zoning.code,
    zoningRaw: f.zoning.raw,
    hazards: f.hazards.map((h) => ({ kind: h.kind as HazardKind, status: h.status as HazardStatus, detail: h.detail })),
    nearby: f.nearby.map((n) => ({ kind: n.kind as ResourceKind, name: n.name, address: n.address, distanceM: n.distanceM })),
    warnings,
  };
}

/** Pure mock resolution (exported for tests). */
export function mockLookup(address: string): GisLookup {
  const a = normalizeAddress(address);
  const zip = a.match(/\b(\d{5})(?:-\d{4})?\s*$/)?.[1];
  // Street name for "san fernando rd" contains a city name; check cities only outside the street part.
  const cityPart = a.replace(/\bsan fernando rd\b/g, "");
  if ((zip && !zip.startsWith("912")) || OTHER_CITIES.some((c) => new RegExp(`\\b${c}\\b`).test(cityPart))) {
    throw new GisError("OUTSIDE_GLENDALE", "That address appears to be outside the City of Glendale.");
  }
  if (!/^\d{1,6}[a-z]?\s+\S+/.test(a) || !/[a-z]{2,}/.test(a)) {
    throw new GisError(
      "ADDRESS_NOT_FOUND",
      "We couldn't find that address. Try a street number and street name, e.g. 613 E Broadway.",
      FIXTURES.map((f) => f.matched),
    );
  }
  const exact = FIXTURES.find((f) => f.aliases.some((al) => a === al || a.startsWith(`${al} `)));
  if (exact) return toLookup(exact, []);

  // Honest demo mode: never answer a non-demo address with another address's data.
  throw new GisError(
    "AMBIGUOUS_ADDRESS",
    "Demo mode only covers these demo addresses. Pick one, or turn on live GIS lookups.",
    FIXTURES.map((f) => f.matched),
  );
}

export const mockProvider: GisProvider = {
  dataSource: "mock",
  async lookup(address: string) {
    return mockLookup(address);
  },
};

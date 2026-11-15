/**
 * Live Glendale GIS MCP client. SERVER-ONLY: reads GLENDALE_GIS_MCP_KEY. Never import from client components.
 * Never log or return the key.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ResourceKind } from "../contracts";
import { inGlendaleBBox, parseGeocode, parseHazards, parseNearby, parseZoning, toolPayload, ToolError, type GeocodeCandidate } from "./parse";
import { GisError, type GisLookup, type GisProvider } from "./types";

const TOOL_TIMEOUT_MS = 8000;
const NEARBY_KINDS: ResourceKind[] = ["schools", "parks", "bus_stops", "police_stations", "fire_stations", "libraries"];

export interface McpConfig {
  url: string;
  key: string;
}

export function readMcpConfig(env: NodeJS.ProcessEnv = process.env): McpConfig | null {
  const url = env.GLENDALE_GIS_MCP_URL?.trim();
  const key = env.GLENDALE_GIS_MCP_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

/** Minimal tool-calling surface so the live provider can be tested with a stub. */
export interface ToolCaller {
  call(name: string, args: Record<string, unknown>): Promise<unknown>;
  close(): Promise<void>;
}

export async function connectMcp(cfg: McpConfig): Promise<ToolCaller> {
  const client = new Client({ name: "glendale2biz", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(cfg.url), {
    requestInit: { headers: { Authorization: `Bearer ${cfg.key}` } },
  });
  await withTimeout(client.connect(transport), TOOL_TIMEOUT_MS, "connect");
  return {
    async call(name, args) {
      const res = await client.callTool({ name, arguments: args }, undefined, { timeout: TOOL_TIMEOUT_MS });
      return toolPayload(res);
    },
    async close() {
      await client.close().catch(() => undefined);
    },
  };
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`GIS ${what} timed out after ${ms} ms`)), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/** Safe error text: never includes the key (we never put it in messages, but scrub defensively). */
function errText(e: unknown, key?: string): string {
  let s = e instanceof Error ? e.message : String(e);
  if (key) s = s.split(key).join("***");
  return s.slice(0, 200);
}

/** Live lookup given a connected ToolCaller (pure w.r.t. env; testable with a stub). */
export async function liveLookup(tools: ToolCaller, address: string): Promise<GisLookup> {
  const warnings: string[] = [];

  // Live shapes (verified 2026-11-14):
  //   matched:   { status: "matched", location: { lat, lon, in_city, matched_address, score }, candidates: [...] }
  //   ambiguous: { status: "ambiguous", location: null, candidates: [{ address, match_type: "StreetName", ... }], notes }
  //   not found: isError, { error: "No address in Glendale matched.", suggestions }
  //   outside:   isError, { error: "The address is outside the Glendale city limits. ...", candidates: [...] }
  let geo: unknown;
  try {
    geo = await tools.call("geocode_address", { address });
  } catch (e) {
    const msg = errText(e);
    if (/outside|not in glendale|city limits|out of (bounds|area)/i.test(msg)) {
      throw new GisError("OUTSIDE_GLENDALE", "That address appears to be outside the City of Glendale.");
    }
    if (/unavailable|timed? ?out|timeout|upstream|rate limit|internal/i.test(msg) || !(e instanceof ToolError)) {
      throw new GisError("GIS_UNAVAILABLE", "Glendale GIS geocoder is unavailable right now.");
    }
    throw new GisError("ADDRESS_NOT_FOUND", "We couldn't find that address in Glendale. Include the house number and street, e.g. 613 E Broadway.");
  }

  const geoObj = (typeof geo === "object" && geo !== null ? geo : {}) as Record<string, unknown>;
  const status = typeof geoObj.status === "string" ? geoObj.status.toLowerCase() : undefined;
  const cands = parseGeocode(geoObj.candidates ?? geo, address);
  let pickedFromAmbiguous: GeocodeCandidate | undefined;
  if (status === "ambiguous" || status === "multiple") {
    // The geocoder also knows Burbank and La Crescenta and flags some of them in_city: true,
    // so keep only real Glendale house-number matches.
    const glendale = cands.filter(
      (c) => c.inCity !== false && /,\s*GLENDALE\b/i.test(c.matched) && !/street\s*name/i.test(c.matchType ?? "") && /^\d/.test(c.matched),
    );
    const distinct = [...new Map(glendale.map((c) => [c.matched, c])).values()];
    if (distinct.length === 1) {
      pickedFromAmbiguous = distinct[0];
      warnings.push(`Address matched more than one place; using the only Glendale match: ${distinct[0].matched}.`);
    } else {
      const streetOnly = distinct.length === 0;
      throw new GisError(
        "AMBIGUOUS_ADDRESS",
        streetOnly
          ? "Only the street matched. Add the house number, e.g. 613 E Broadway."
          : "That address matches several places. Pick one.",
        distinct.map((c) => c.matched).slice(0, 5), // never offer street-only chips: they'd come back ambiguous again
      );
    }
  }
  if (status && status !== "matched" && /not|no_?match|none/.test(status)) {
    throw new GisError("ADDRESS_NOT_FOUND", "We couldn't find that address in Glendale.");
  }
  // Prefer the server's chosen location; fall back to the best candidate.
  const loc = parseGeocode(geoObj.location ? [geoObj.location] : [], address)[0];
  const best = pickedFromAmbiguous ?? loc ?? cands[0];
  if (!best) throw new GisError("ADDRESS_NOT_FOUND", "We couldn't find that address in Glendale.");
  if (best.score !== undefined && best.score < 60) {
    throw new GisError("ADDRESS_NOT_FOUND", "We couldn't find a confident match for that address.", cands.slice(0, 3).map((c) => c.matched));
  }
  const cityLooksWrong = best.city !== undefined && !/glendale/i.test(best.city);
  if (best.inCity === false || cityLooksWrong || (best.inCity !== true && !inGlendaleBBox(best.lat, best.lon))) {
    throw new GisError("OUTSIDE_GLENDALE", "That address appears to be outside the City of Glendale.");
  }

  const location = { lat: best.lat, lon: best.lon };
  const [zoningR, hazardsR, nearbyR] = await Promise.allSettled([
    tools.call("query_dataset", { dataset: "zoning", near: { ...location, radius_m: 0 } }),
    tools.call("hazards_at_location", { location }),
    tools.call("nearest_resources", { location, kinds: NEARBY_KINDS, limit: 2 }),
  ]);

  let zoning: { code: string | null; raw?: Record<string, unknown> } = { code: null };
  if (zoningR.status === "fulfilled") {
    zoning = parseZoning(zoningR.value);
    if (!zoning.code) warnings.push("Zoning: no zone code found in GIS response for this parcel.");
  } else {
    warnings.push(`Zoning lookup failed: ${errText(zoningR.reason)}`);
  }

  let hazards = parseHazards(undefined);
  if (hazardsR.status === "fulfilled") hazards = parseHazards(hazardsR.value);
  else warnings.push(`Hazard lookup failed: ${errText(hazardsR.reason)}`);

  let nearby: GisLookup["nearby"] = [];
  if (nearbyR.status === "fulfilled") nearby = parseNearby(nearbyR.value, location);
  else warnings.push(`Nearby resources lookup failed: ${errText(nearbyR.reason)}`);

  if (zoningR.status === "rejected" && hazardsR.status === "rejected" && nearbyR.status === "rejected") {
    throw new GisError("GIS_UNAVAILABLE", "Glendale GIS data services are unavailable right now.");
  }

  return {
    matched: best.matched,
    lat: best.lat,
    lon: best.lon,
    score: best.score,
    zoningCode: zoning.code,
    zoningRaw: zoning.raw,
    hazards,
    nearby,
    warnings,
  };
}

/** Live provider: one MCP session per request (serverless-friendly). No mock fallback. */
export function createLiveProvider(cfg: McpConfig | null = readMcpConfig()): GisProvider {
  return {
    dataSource: "live",
    async lookup(address: string) {
      if (!cfg) throw new GisError("GIS_UNAVAILABLE", "Live GIS is not configured on the server.");
      let tools: ToolCaller;
      try {
        tools = await connectMcp(cfg);
      } catch (e) {
        console.error("[gis] MCP connect failed:", errText(e, cfg.key));
        throw new GisError("GIS_UNAVAILABLE", "Couldn't reach the Glendale GIS service.");
      }
      try {
        return await liveLookup(tools, address);
      } catch (e) {
        if (e instanceof GisError) throw e;
        console.error("[gis] live lookup failed:", errText(e, cfg.key));
        throw new GisError("GIS_UNAVAILABLE", "Glendale GIS service error.");
      } finally {
        await tools.close();
      }
    },
  };
}

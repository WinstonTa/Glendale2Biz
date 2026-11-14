/**
 * Live Glendale GIS MCP client. SERVER-ONLY: reads GLENDALE_GIS_MCP_KEY. Never import from client components.
 * Never log or return the key.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ResourceKind } from "../contracts";
import { inGlendaleBBox, parseGeocode, parseHazards, parseNearby, parseZoning, toolPayload } from "./parse";
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

  let geo: unknown;
  try {
    geo = await tools.call("geocode_address", { address });
  } catch (e) {
    const msg = errText(e);
    if (/not\s*found|no (match|result|candidate)/i.test(msg)) {
      throw new GisError("ADDRESS_NOT_FOUND", "We couldn't find that address in Glendale.");
    }
    if (/outside|not in glendale|out of (bounds|area)/i.test(msg)) {
      throw new GisError("OUTSIDE_GLENDALE", "That address appears to be outside the City of Glendale.");
    }
    throw new GisError("GIS_UNAVAILABLE", "Glendale GIS geocoder is unavailable right now.");
  }

  const cands = parseGeocode(geo, address);
  if (!cands.length) throw new GisError("ADDRESS_NOT_FOUND", "We couldn't find that address in Glendale.");
  const best = cands[0];
  if (best.score !== undefined && best.score < 60) {
    throw new GisError("ADDRESS_NOT_FOUND", "We couldn't find a confident match for that address.", cands.slice(0, 3).map((c) => c.matched));
  }
  const distinct = [...new Set(cands.map((c) => c.matched))];
  if (best.score !== undefined && best.score < 80 && distinct.length > 1) {
    throw new GisError("AMBIGUOUS_ADDRESS", "That address matches several places. Pick one.", distinct.slice(0, 5));
  }
  const cityLooksWrong = best.city !== undefined && !/glendale/i.test(best.city);
  if (best.inCity === false || cityLooksWrong || !inGlendaleBBox(best.lat, best.lon)) {
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

#!/usr/bin/env node
/**
 * Live GIS MCP probe — prints tool list + raw result shapes so lib/gis/parse.ts can be checked.
 *   node lib/gis/scripts/probe.mjs ["613 E Broadway, Glendale, CA"]
 * Reads GLENDALE_GIS_MCP_URL / GLENDALE_GIS_MCP_KEY from the environment or .env.local.
 * NEVER prints the key.
 */
import { readFileSync, existsSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.GLENDALE_GIS_MCP_URL;
const key = process.env.GLENDALE_GIS_MCP_KEY;
if (!url || !key) {
  console.error("Missing GLENDALE_GIS_MCP_URL or GLENDALE_GIS_MCP_KEY");
  process.exit(1);
}
const scrub = (s) => String(s).split(key).join("***");
const show = (label, v) => console.log(`\n=== ${label} ===\n${scrub(JSON.stringify(v, null, 2)).slice(0, 4000)}`);

const address = process.argv[2] ?? "613 E Broadway, Glendale, CA 91206";
const client = new Client({ name: "glendale2biz-probe", version: "0.1.0" });
const transport = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: { headers: { Authorization: `Bearer ${key}` } },
});

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  show("tools", tools.map((t) => ({ name: t.name, description: t.description?.slice(0, 200), inputSchema: t.inputSchema })));

  const call = async (name, args) => {
    try {
      const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 15000 });
      show(`${name}(${JSON.stringify(args)})`, r);
      return r;
    } catch (e) {
      show(`${name} ERROR`, scrub(e?.message ?? e));
      return null;
    }
  };

  if (tools.some((t) => t.name === "describe_dataset")) await call("describe_dataset", { dataset: "zoning" });
  const geo = await call("geocode_address", { address });
  let lat = 34.1466, lon = -118.2475;
  try {
    const txt = geo?.structuredContent ?? JSON.parse(geo?.content?.find((c) => c.type === "text")?.text ?? "{}");
    const s = JSON.stringify(txt);
    const la = s.match(/"(?:lat|latitude|y)"\s*:\s*(-?\d+\.\d+)/i);
    const lo = s.match(/"(?:lon|lng|longitude|x)"\s*:\s*(-?\d+\.\d+)/i);
    if (la && lo) { lat = Number(la[1]); lon = Number(lo[1]); }
  } catch {}
  console.log(`\nusing location ${lat}, ${lon}`);
  await call("query_dataset", { dataset: "zoning", near: { lat, lon, radius_m: 0 } });
  await call("hazards_at_location", { location: { lat, lon } });
  await call("nearest_resources", { location: { lat, lon }, kinds: ["schools", "parks", "bus_stops", "police_stations", "fire_stations", "libraries"], limit: 2 });
} catch (e) {
  console.error("probe failed:", scrub(e?.message ?? e));
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
}

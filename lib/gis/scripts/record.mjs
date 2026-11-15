#!/usr/bin/env node
/**
 * Records live Glendale GIS MCP results as offline parser fixtures (lib/gis/fixtures/live/*.json).
 *   node lib/gis/scripts/record.mjs "613 E Broadway, Glendale, CA 91206" ["..."]
 *   node lib/gis/scripts/record.mjs --meta <outDir>   # dumps list_datasets / guides for reading
 * Reads GLENDALE_GIS_MCP_URL / GLENDALE_GIS_MCP_KEY from env or .env.local. NEVER writes or prints the key.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
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
const KINDS = ["schools", "parks", "bus_stops", "police_stations", "fire_stations", "libraries"];

const client = new Client({ name: "glendale2biz-record", version: "0.1.0" });
const t0 = Date.now();
await client.connect(
  new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: { Authorization: `Bearer ${key}` } } }),
);
console.log(`connect ${Date.now() - t0} ms`);

async function call(name, args) {
  const t = Date.now();
  try {
    const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 20000 });
    const ms = Date.now() - t;
    console.log(`${name} ${ms} ms${r.isError ? " (isError)" : ""}`);
    return { tool: name, args, ms, result: JSON.parse(scrub(JSON.stringify(r))) };
  } catch (e) {
    console.log(`${name} FAILED ${Date.now() - t} ms: ${scrub(e?.message ?? e)}`);
    return { tool: name, args, ms: Date.now() - t, error: scrub(e?.message ?? e) };
  }
}

const args = process.argv.slice(2);
try {
  if (args[0] === "--zones") {
    // Distinct ZONE_DISTR → ZONE_DESC values across the whole zoning dataset.
    const seen = new Map();
    for (let offset = 0; offset < 5000; offset += 100) {
      const r = await call("query_dataset", { dataset: "zoning", fields: ["ZONE_DISTR", "ZONE_DESC"], limit: 100, offset });
      const feats = r.result?.structuredContent?.features ?? [];
      for (const f of feats) seen.set(f.attributes.ZONE_DISTR, f.attributes.ZONE_DESC);
      if (r.result?.structuredContent?.next_offset == null) break;
    }
    console.log(JSON.stringify([...seen.entries()].sort(), null, 0));
  } else if (args[0] === "--meta") {
    const out = args[1];
    mkdirSync(out, { recursive: true });
    const items = [
      ["list_datasets", {}],
      ["read_guide", { topic: "about" }],
      ["read_guide", { topic: "snapshot_data" }],
      ["describe_dataset", { dataset: "zoning" }],
    ];
    const { tools } = await client.listTools();
    writeFileSync(`${out}/tools.json`, JSON.stringify(tools, null, 2));
    for (const [n, a] of items) writeFileSync(`${out}/${n}-${a.topic ?? a.dataset ?? ""}.json`, JSON.stringify(await call(n, a), null, 2));
  } else {
    const dir = "lib/gis/fixtures/live";
    mkdirSync(dir, { recursive: true });
    for (const address of args) {
      const slug = address.toLowerCase().split(",")[0].replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const geo = await call("geocode_address", { address });
      const rec = { recordedAt: new Date().toISOString(), address, calls: [geo] };
      const sc = geo.result?.structuredContent;
      const loc = sc?.location;
      if (loc && typeof loc.lat === "number") {
        const location = { lat: loc.lat, lon: loc.lon };
        rec.calls.push(await call("query_dataset", { dataset: "zoning", near: { ...location, radius_m: 0 } }));
        rec.calls.push(await call("hazards_at_location", { location }));
        rec.calls.push(await call("nearest_resources", { location, kinds: KINDS, limit: 2 }));
      }
      writeFileSync(`${dir}/${slug}.json`, JSON.stringify(rec, null, 2) + "\n");
      console.log(`wrote ${dir}/${slug}.json`);
    }
  }
} finally {
  await client.close().catch(() => {});
}

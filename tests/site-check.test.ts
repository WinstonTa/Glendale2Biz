/**
 * POST /api/site-check in mock mode (owned by backend-dev).
 * Exercises the Next.js route handler directly with a Web Request — no server, no network, no secrets.
 * If backend exports a pure handler from lib/gis, add a second suite against it; the route is the contract.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  LOCALES,
  type ApiError,
  type ApiErrorCode,
  type LocalizedText,
  type SiteCheckResponse,
} from "@/lib/contracts";
import { BUSINESS_TYPES } from "@/lib/rules";

const VERDICTS = ["allowed", "conditional", "not_allowed", "unknown"];
const HAZARD_KINDS = ["wildfire", "flood", "seismic", "dam_inundation"];
const HAZARD_STATUSES = ["in_zone", "not_in_zone", "unavailable"];
const RESOURCE_KINDS = ["schools", "parks", "bus_stops", "police_stations", "fire_stations", "libraries", "hospitals"];
const ERROR_CODES: ApiErrorCode[] = ["ADDRESS_NOT_FOUND", "OUTSIDE_GLENDALE", "AMBIGUOUS_ADDRESS", "GIS_UNAVAILABLE", "BAD_REQUEST"];

type PostFn = (req: Request) => Promise<Response> | Response;
let POST: PostFn;
let demoAddresses: string[] = ["613 E Broadway"];
const savedEnv = { mode: process.env.GIS_MODE, key: process.env.GLENDALE_GIS_MCP_KEY };

beforeAll(async () => {
  process.env.GIS_MODE = "mock";
  delete process.env.GLENDALE_GIS_MCP_KEY;
  // Guarantee no network: any fetch in mock mode is a bug.
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("network access attempted in mock mode");
  }));
  const route = await import("@/app/api/site-check/route");
  POST = route.POST as PostFn;
  try {
    const demo = (await import("@/lib/gis/demo")) as { DEMO_ADDRESSES?: unknown };
    const list = demo.DEMO_ADDRESSES;
    if (Array.isArray(list) && list.length) {
      demoAddresses = list.map((a) => (typeof a === "string" ? a : (a as { address: string }).address));
    }
  } catch {
    // lib/gis/demo not present — fall back to the one address fixed by MASTER_INSTRUCTIONS §7.
  }
});

afterAll(() => {
  vi.unstubAllGlobals();
  process.env.GIS_MODE = savedEnv.mode;
  if (savedEnv.key !== undefined) process.env.GLENDALE_GIS_MCP_KEY = savedEnv.key;
});

function req(body: unknown, raw = false): Request {
  return new Request("http://localhost/api/site-check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function expectLocalized(text: LocalizedText | null | undefined, where: string) {
  expect(text, `${where} missing`).toBeTruthy();
  for (const loc of LOCALES) expect((text as LocalizedText)[loc]?.trim().length, `${where}.${loc}`).toBeGreaterThan(0);
}

function expectApiError(json: unknown, code?: ApiErrorCode) {
  const e = (json as ApiError).error;
  expect(e, "body is not an ApiError").toBeTruthy();
  expect(ERROR_CODES).toContain(e.code);
  if (code) expect(e.code).toBe(code);
  expect(typeof e.message).toBe("string");
  expect(e.message.length).toBeGreaterThan(0);
}

describe("POST /api/site-check — mock mode, valid requests", () => {
  it("613 E Broadway returns a full SiteCheckResponse labeled mock", async () => {
    const res = await POST(req({ address: "613 E Broadway", businessTypeId: BUSINESS_TYPES[0].id, locale: "en" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as SiteCheckResponse;

    expect(body.meta.dataSource).toBe("mock");
    expect(Number.isNaN(Date.parse(body.meta.fetchedAt))).toBe(false);
    expect(Array.isArray(body.meta.warnings)).toBe(true);

    expect(body.address.input).toBe("613 E Broadway");
    expect(body.address.matched.length).toBeGreaterThan(0);
    expect(typeof body.address.lat).toBe("number");
    expect(typeof body.address.lon).toBe("number");
    // roughly Glendale, CA
    expect(body.address.lat).toBeGreaterThan(34.1);
    expect(body.address.lat).toBeLessThan(34.3);
    expect(body.address.lon).toBeGreaterThan(-118.35);
    expect(body.address.lon).toBeLessThan(-118.15);

    expect(VERDICTS).toContain(body.verdict.status);
    expectLocalized(body.verdict.summary, "verdict.summary");
    for (const [i, n] of body.verdict.notes.entries()) expectLocalized(n, `verdict.notes[${i}]`);
    if (body.zoning.code === null) expect(body.verdict.status).toBe("unknown");
    else expectLocalized(body.zoning.name, "zoning.name");

    for (const h of body.hazards) {
      expect(HAZARD_KINDS).toContain(h.kind);
      expect(HAZARD_STATUSES).toContain(h.status);
      expectLocalized(h.label, `hazard ${h.kind}.label`);
    }
    for (const n of body.nearby) {
      expect(RESOURCE_KINDS).toContain(n.kind);
      expect(n.name.length).toBeGreaterThan(0);
      expect(n.distanceM).toBeGreaterThanOrEqual(0);
    }
  });

  it("every demo address answers 200 mock for every business type", async () => {
    for (const address of demoAddresses) {
      for (const b of BUSINESS_TYPES) {
        const res = await POST(req({ address, businessTypeId: b.id, locale: "es" }));
        expect(res.status, `${address} / ${b.id}`).toBe(200);
        const body = (await res.json()) as SiteCheckResponse;
        expect(body.meta.dataSource).toBe("mock");
        expect(VERDICTS).toContain(body.verdict.status);
      }
    }
  });

  it("works in all three locales", async () => {
    for (const locale of LOCALES) {
      const res = await POST(req({ address: "613 E Broadway", businessTypeId: BUSINESS_TYPES[0].id, locale }));
      expect(res.status, locale).toBe(200);
    }
  });

  it("never calls the network in mock mode", () => {
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("POST /api/site-check — invalid requests → 400 BAD_REQUEST", () => {
  const good = () => ({ address: "613 E Broadway", businessTypeId: BUSINESS_TYPES[0].id, locale: "en" });

  const cases: [string, unknown, boolean?][] = [
    ["non-JSON body", "{not json", true],
    ["empty object", {}],
    ["array body", []],
    ["missing address", { ...good(), address: undefined }],
    ["empty address", { ...good(), address: "" }],
    ["whitespace address", { ...good(), address: "   " }],
    ["non-string address", { ...good(), address: 613 }],
    ["missing businessTypeId", { ...good(), businessTypeId: undefined }],
    ["unknown businessTypeId", { ...good(), businessTypeId: "not_a_type" }],
    ["bad locale", { ...good(), locale: "fr" }],
  ];

  it.each(cases)("%s", async (_label, body, raw) => {
    const res = await POST(req(body, raw));
    expect(res.status).toBe(400);
    expectApiError(await res.json(), "BAD_REQUEST");
  });
});

describe("POST /api/site-check — unknown addresses in mock mode", () => {
  it("gibberish address returns a 4xx ApiError, not City Hall data", async () => {
    const res = await POST(req({ address: "asdf qwer zxcv 99999", businessTypeId: BUSINESS_TYPES[0].id, locale: "en" }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expectApiError(await res.json());
  });
});

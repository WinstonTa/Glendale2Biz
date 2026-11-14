/**
 * Pure site-check handler (lib/gis/siteCheck.ts → handleSiteCheck) with the mock provider and stub providers.
 * No env, no network, no Next runtime.
 */
import { describe, expect, it } from "vitest";
import { LOCALES, type ApiError, type ApiErrorCode, type SiteCheckResponse } from "@/lib/contracts";
import { handleSiteCheck } from "@/lib/gis/siteCheck";
import { mockProvider } from "@/lib/gis/mock";
import { GisError, type GisProvider } from "@/lib/gis/types";
import { DEMO_ADDRESSES } from "@/lib/gis/demo";
import { BUSINESS_TYPES } from "@/lib/rules";

const ok = (address = "613 E Broadway") => ({ address, businessTypeId: "cafe", locale: "en" });
const FIXED = new Date("2026-11-14T23:00:00.000Z");

function throwing(err: unknown): GisProvider {
  return { dataSource: "live", lookup: async () => Promise.reject(err) };
}

describe("handleSiteCheck + mockProvider", () => {
  it("613 E Broadway → 200, dataSource mock, all four hazard kinds, nearby sorted", async () => {
    const r = await handleSiteCheck(ok(), { provider: mockProvider, now: () => FIXED });
    expect(r.status).toBe(200);
    const b = r.body as SiteCheckResponse;
    expect(b.meta.dataSource).toBe("mock");
    expect(b.meta.fetchedAt).toBe(FIXED.toISOString());
    expect(b.hazards.map((h) => h.kind).sort()).toEqual(["dam_inundation", "flood", "seismic", "wildfire"]);
    for (let i = 1; i < b.nearby.length; i++) expect(b.nearby[i].distanceM).toBeGreaterThanOrEqual(b.nearby[i - 1].distanceM);
    expect(b.zoning.code).toBeTruthy();
    for (const l of LOCALES) expect(b.zoning.name?.[l]?.length).toBeGreaterThan(0);
  });

  it("each demo address returns its expected verdict for its example business type", async () => {
    for (const d of DEMO_ADDRESSES) {
      const r = await handleSiteCheck(
        { address: d.address, businessTypeId: d.exampleBusinessTypeId, locale: "hy" },
        { provider: mockProvider },
      );
      expect(r.status, d.id).toBe(200);
      const b = r.body as SiteCheckResponse;
      expect(b.zoning.code, d.id).toBe(d.zoneCode);
      expect(b.verdict.status, d.id).toBe(d.expectedVerdict);
      expect(b.meta.warnings, `${d.id} exact demo match should have no fallback warning`).toEqual([]);
    }
  });

  it("short forms of demo addresses resolve exactly (no fallback warning)", async () => {
    for (const a of ["613 E Broadway", "613 East Broadway", "613 e broadway, glendale"]) {
      const r = await handleSiteCheck(ok(a), { provider: mockProvider });
      expect(r.status, a).toBe(200);
      expect((r.body as SiteCheckResponse).meta.warnings, a).toEqual([]);
    }
  });

  it("non-demo Glendale-looking address in mock mode is flagged with a warning (never silently presented)", async () => {
    const r = await handleSiteCheck(ok("500 N Brand Blvd"), { provider: mockProvider });
    if (r.status === 200) {
      const b = r.body as SiteCheckResponse;
      expect(b.meta.dataSource).toBe("mock");
      expect(b.meta.warnings.length, "fallback demo data without a warning").toBeGreaterThan(0);
    } else {
      expect(r.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("gibberish → ADDRESS_NOT_FOUND 404", async () => {
    const r = await handleSiteCheck(ok("asdf qwer"), { provider: mockProvider });
    expect(r.status).toBe(404);
    expect((r.body as ApiError).error.code).toBe("ADDRESS_NOT_FOUND");
  });

  it.each(["123 Main St, Burbank, CA 91502", "100 W 1st St, Los Angeles, CA 90012", "1 Main St 10001"])(
    "outside Glendale (%s) → OUTSIDE_GLENDALE",
    async (a) => {
      const r = await handleSiteCheck(ok(a), { provider: mockProvider });
      expect((r.body as ApiError).error?.code).toBe("OUTSIDE_GLENDALE");
      expect(r.status).toBeGreaterThanOrEqual(400);
      expect(r.status).toBeLessThan(500);
    },
  );

  it("San Fernando Rd demo address is NOT misread as the city of San Fernando", async () => {
    const r = await handleSiteCheck(ok("4500 San Fernando Rd, Glendale, CA 91204"), { provider: mockProvider });
    expect(r.status).toBe(200);
  });

  it("every business type works at every demo address", async () => {
    for (const d of DEMO_ADDRESSES) {
      for (const bt of BUSINESS_TYPES) {
        const r = await handleSiteCheck({ address: d.address, businessTypeId: bt.id, locale: "es" }, { provider: mockProvider });
        expect(r.status, `${d.id}/${bt.id}`).toBe(200);
      }
    }
  });
});

describe("handleSiteCheck validation → 400 BAD_REQUEST", () => {
  it.each<[string, unknown]>([
    ["null", null],
    ["string", "613 E Broadway"],
    ["empty object", {}],
    ["empty address", { ...ok(), address: "" }],
    ["whitespace address", { ...ok(), address: "   " }],
    ["numeric address", { ...ok(), address: 613 }],
    ["overlong address", { ...ok(), address: "1".repeat(500) }],
    ["unknown businessTypeId", { ...ok(), businessTypeId: "nope" }],
    ["bad locale", { ...ok(), locale: "fr" }],
  ])("%s", async (_l, body) => {
    const r = await handleSiteCheck(body, { provider: mockProvider });
    expect(r.status).toBe(400);
    const e = (r.body as ApiError).error;
    expect(e.code).toBe("BAD_REQUEST");
    expect(e.message.length).toBeGreaterThan(0);
  });
});

describe("handleSiteCheck provider errors map to ApiError codes", () => {
  const cases: [ApiErrorCode, number][] = [
    ["ADDRESS_NOT_FOUND", 404],
    ["OUTSIDE_GLENDALE", 422],
    ["AMBIGUOUS_ADDRESS", 409],
    ["GIS_UNAVAILABLE", 503],
  ];
  it.each(cases)("GisError %s → %i", async (code, status) => {
    const r = await handleSiteCheck(ok(), { provider: throwing(new GisError(code, "x", code === "AMBIGUOUS_ADDRESS" ? ["A", "B"] : undefined)) });
    expect(r.status).toBe(status);
    expect((r.body as ApiError).error.code).toBe(code);
    if (code === "AMBIGUOUS_ADDRESS") expect((r.body as ApiError).error.candidates).toEqual(["A", "B"]);
  });

  it("unexpected provider exception → 503 GIS_UNAVAILABLE without leaking the error message", async () => {
    const r = await handleSiteCheck(ok(), { provider: throwing(new Error("Bearer sk-secret-123 rejected")) });
    expect(r.status).toBe(503);
    const e = (r.body as ApiError).error;
    expect(e.code).toBe("GIS_UNAVAILABLE");
    expect(e.message).not.toContain("sk-secret");
  });

  it("live provider result is labeled live", async () => {
    const provider: GisProvider = {
      dataSource: "live",
      lookup: async () => ({ matched: "X", lat: 34.15, lon: -118.25, zoningCode: "C3", hazards: [], nearby: [], warnings: [] }),
    };
    const r = await handleSiteCheck(ok(), { provider });
    expect((r.body as SiteCheckResponse).meta.dataSource).toBe("live");
    // missing hazards are reported as unavailable, not silently dropped
    expect((r.body as SiteCheckResponse).hazards.every((h) => h.status === "unavailable")).toBe(true);
  });
});

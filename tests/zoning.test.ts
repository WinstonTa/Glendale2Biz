/**
 * Zoning verdict rules (lib/rules/zoning.ts, re-exported from @/lib/rules) + demo addresses (lib/gis/demo.ts).
 * MASTER_INSTRUCTIONS §7: unknown zone ⇒ "unknown", never a guess; every verdict carries guidance disclaimer.
 */
import { describe, expect, it } from "vitest";
import { LOCALES, type BusinessType, type LocalizedText } from "@/lib/contracts";
import { BUSINESS_TYPES, DISCLAIMER, evaluateZoning, getBusinessType, normalizeZoneCode, zoneFamily, zoneName } from "@/lib/rules";
import { DEMO_ADDRESSES } from "@/lib/gis/demo";

const VERDICTS = ["allowed", "conditional", "not_allowed", "unknown"];
const KNOWN_CODES = ["R1", "R1R", "ROS", "R-1650", "R3", "C1", "C2", "C3", "CR", "CO", "CA", "DSP", "SFMU", "IMU", "IMU-R", "IND", "M1", "PS"];

function expectLocalized(text: LocalizedText | null | undefined, where: string) {
  expect(text, `${where} missing`).toBeTruthy();
  for (const loc of LOCALES) expect((text as LocalizedText)[loc]?.trim().length, `${where}.${loc}`).toBeGreaterThan(0);
}

describe("zone code normalization", () => {
  it("normalizes case, whitespace, height districts and overlays", () => {
    expect(normalizeZoneCode(" c3 ")).toBe("C3");
    expect(normalizeZoneCode("C3-II")).toBe("C3");
    expect(normalizeZoneCode("C2 (PD)")).toBe("C2");
    expect(normalizeZoneCode("")).toBeNull();
    expect(normalizeZoneCode(null)).toBeNull();
  });

  it.each(KNOWN_CODES)("known code %s maps to a family with a localized name", (code) => {
    expect(zoneFamily(code), code).not.toBeNull();
    expectLocalized(zoneName(code), `zoneName(${code})`);
  });
});

describe("evaluateZoning", () => {
  it.each(["XYZ", "Q9", "not a zone"])("unknown code %s ⇒ unknown for every type", (code) => {
    for (const b of BUSINESS_TYPES) expect(evaluateZoning(code, b).status, b.id).toBe("unknown");
  });

  it("null / empty code ⇒ unknown", () => {
    for (const b of BUSINESS_TYPES) {
      expect(evaluateZoning(null, b).status).toBe("unknown");
      expect(evaluateZoning("", b).status).toBe("unknown");
    }
  });

  it("every type × known code returns a valid verdict with localized summary + notes; disclaimer is NOT in notes (UI owns it, fd57817)", () => {
    for (const code of [...KNOWN_CODES, "XYZ", null]) {
      for (const b of BUSINESS_TYPES) {
        const v = evaluateZoning(code, b);
        expect(VERDICTS).toContain(v.status);
        expectLocalized(v.summary, `${b.id}@${code}.summary`);
        v.notes.forEach((n, i) => expectLocalized(n, `${b.id}@${code}.notes[${i}]`));
        expect(v.notes, `${b.id}@${code} still carries the disclaimer (UI renders it; would show twice)`).not.toContainEqual(DISCLAIMER);
        expect(v.notes.some((n) => n.en.trim() === DISCLAIMER.en.trim()), `${b.id}@${code} disclaimer text in notes`).toBe(false);
      }
    }
  });

  it("exported DISCLAIMER text matches MASTER_INSTRUCTIONS §7", () => {
    expect(DISCLAIMER.en).toBe(
      "This is general guidance, not legal advice. Confirm with the City of Glendale Planning Division before signing a lease.",
    );
    expectLocalized(DISCLAIMER, "DISCLAIMER");
  });

  it("home-capable types are not flatly not_allowed in a residential zone", () => {
    for (const b of BUSINESS_TYPES.filter((x) => x.flags.homeBasedOk)) {
      expect(evaluateZoning("R1", b).status, b.id).not.toBe("not_allowed");
    }
  });

  it("storefront food (non-home) is not allowed in R1", () => {
    const food = BUSINESS_TYPES.filter((b) => b.category === "food" && !b.flags.homeBasedOk);
    expect(food.length).toBeGreaterThan(0);
    for (const b of food) expect(evaluateZoning("R1", b).status, b.id).toBe("not_allowed");
  });

  it("alcohol types are never plain 'allowed' (needs use permit + ABC)", () => {
    for (const b of BUSINESS_TYPES.filter((x) => x.flags.alcohol)) {
      for (const code of KNOWN_CODES) expect(evaluateZoning(code, b).status, `${b.id}@${code}`).not.toBe("allowed");
    }
  });
});

describe("DEMO_ADDRESSES (client-safe demo list)", () => {
  it("has 3 addresses including 613 E Broadway, covering allowed / conditional / not_allowed", () => {
    expect(DEMO_ADDRESSES.length).toBeGreaterThanOrEqual(3);
    expect(DEMO_ADDRESSES.some((d) => /613 E Broadway/i.test(d.address))).toBe(true);
    const verdicts = new Set(DEMO_ADDRESSES.map((d) => d.expectedVerdict));
    for (const v of ["allowed", "conditional", "not_allowed"]) expect(verdicts.has(v as never), v).toBe(true);
  });

  it("each demo's expectedVerdict agrees with evaluateZoning(zoneCode, exampleBusinessType)", () => {
    for (const d of DEMO_ADDRESSES) {
      const b = getBusinessType(d.exampleBusinessTypeId) as BusinessType | undefined;
      expect(b, `${d.id}: unknown exampleBusinessTypeId ${d.exampleBusinessTypeId}`).toBeTruthy();
      expect(evaluateZoning(d.zoneCode, b!).status, d.id).toBe(d.expectedVerdict);
    }
  });

  it("labels are localized", () => {
    for (const d of DEMO_ADDRESSES) expectLocalized(d.label, `${d.id}.label`);
  });
});

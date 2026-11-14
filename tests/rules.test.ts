/**
 * Contract-driven tests for @/lib/rules (owned by backend-dev).
 * Seam per docs/phases/PHASE_1_MVP.md: BUSINESS_TYPES, getBusinessType, matchBusinessType, buildRoadmap, t.
 * Pure: no network, no secrets.
 */
import { describe, expect, it } from "vitest";
import {
  LOCALES,
  ROADMAP_PHASES,
  type BusinessType,
  type LocalizedText,
  type RoadmapInput,
  type RoadmapStep,
  type SiteCheckResponse,
  type VerdictStatus,
} from "@/lib/contracts";
import * as rules from "@/lib/rules";

const { BUSINESS_TYPES, matchBusinessType, buildRoadmap, t } = rules;

// ---------- helpers ----------

function expectLocalized(text: LocalizedText | null | undefined, where: string) {
  expect(text, `${where} is missing`).toBeTruthy();
  for (const loc of LOCALES) {
    const v = (text as LocalizedText)[loc];
    expect(typeof v, `${where}.${loc} is not a string`).toBe("string");
    expect(v.trim().length, `${where}.${loc} is empty`).toBeGreaterThan(0);
  }
}

function stepText(s: RoadmapStep): string {
  // agency included so e.g. a Cottage Food registration with "LA County Public Health" counts as a health step
  return `${s.id} ${s.title.en} ${s.description.en} ${s.agency}`.toLowerCase();
}

const OFFICIAL_HOST = /(^|\.)[a-z0-9-]+\.gov$/;
const HEALTH_RE = /health/;
const HOME_OCC_RE = /home[\s_-]?occupation/;
const CUP_RE = /conditional[\s_-]?use|\bcup\b/;
const ENTITY_EIN_RE = /\bein\b|employer identification|entity|llc|incorporat/;

function hasStep(steps: RoadmapStep[], re: RegExp) {
  return steps.some((s) => re.test(stepText(s)));
}

function fakeSite(status: VerdictStatus, code: string | null = "C3"): SiteCheckResponse {
  const lt = (s: string): LocalizedText => ({ en: s, es: s, hy: s });
  return {
    address: { input: "613 E Broadway", matched: "613 E BROADWAY, GLENDALE, CA 91206", lat: 34.1468, lon: -118.2479 },
    zoning: { code, name: code ? lt(`Zone ${code}`) : null },
    verdict: { status, summary: lt(`verdict ${status}`), notes: [] },
    hazards: [],
    nearby: [],
    meta: { dataSource: "mock", fetchedAt: new Date(0).toISOString(), warnings: [] },
  };
}

function isFood(b: BusinessType) {
  return b.category === "food" || b.flags.food;
}

const LOCATION_INPUTS: { label: string; mk: (id: string) => RoadmapInput }[] = [
  { label: "home", mk: (id) => ({ businessTypeId: id, locationMode: "home" }) },
  { label: "undecided", mk: (id) => ({ businessTypeId: id, locationMode: "undecided" }) },
  { label: "address/allowed", mk: (id) => ({ businessTypeId: id, locationMode: "address", site: fakeSite("allowed") }) },
  { label: "address/conditional", mk: (id) => ({ businessTypeId: id, locationMode: "address", site: fakeSite("conditional") }) },
  { label: "address/not_allowed", mk: (id) => ({ businessTypeId: id, locationMode: "address", site: fakeSite("not_allowed", "R1") }) },
  { label: "address/unknown", mk: (id) => ({ businessTypeId: id, locationMode: "address", site: fakeSite("unknown", null) }) },
];

// ---------- exports ----------

describe("@/lib/rules exports (integration seam)", () => {
  it("exports the agreed functions", () => {
    expect(Array.isArray(BUSINESS_TYPES)).toBe(true);
    expect(typeof matchBusinessType).toBe("function");
    expect(typeof buildRoadmap).toBe("function");
    expect(typeof t).toBe("function");
    expect(typeof (rules as Record<string, unknown>).getBusinessType).toBe("function");
  });
});

// ---------- BUSINESS_TYPES ----------

describe("BUSINESS_TYPES", () => {
  it("has at least 4 types (seam minimum; MVP target ~14)", () => {
    expect(BUSINESS_TYPES.length).toBeGreaterThanOrEqual(4);
  });

  it("has unique ids", () => {
    const ids = BUSINESS_TYPES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every type has non-empty name and blurb in en/es/hy", () => {
    for (const b of BUSINESS_TYPES) {
      expectLocalized(b.name, `${b.id}.name`);
      expectLocalized(b.blurb, `${b.id}.blurb`);
    }
  });

  it("every type has an icon, lowercase keywords, and all six boolean flags", () => {
    const flagKeys = ["food", "alcohol", "healthPermit", "homeBasedOk", "sellsGoods", "tech"] as const;
    for (const b of BUSINESS_TYPES) {
      expect(b.icon?.length, `${b.id}.icon`).toBeGreaterThan(0);
      expect(b.keywords.length, `${b.id}.keywords`).toBeGreaterThan(0);
      for (const k of b.keywords) expect(k, `${b.id} keyword "${k}" not lowercase`).toBe(k.toLowerCase());
      for (const f of flagKeys) expect(typeof b.flags?.[f], `${b.id}.flags.${f}`).toBe("boolean");
    }
  });

  it("includes at least one food, one personal_care and one tech type", () => {
    expect(BUSINESS_TYPES.some(isFood)).toBe(true);
    expect(BUSINESS_TYPES.some((b) => b.category === "personal_care")).toBe(true);
    expect(BUSINESS_TYPES.some((b) => b.category === "tech" || b.flags.tech)).toBe(true);
  });

  it("getBusinessType(id) returns the matching type and undefined/null for unknown ids", () => {
    const getBusinessType = (rules as unknown as { getBusinessType: (id: string) => BusinessType | undefined | null })
      .getBusinessType;
    for (const b of BUSINESS_TYPES) expect(getBusinessType(b.id)?.id).toBe(b.id);
    expect(getBusinessType("definitely_not_a_type") ?? null).toBeNull();
  });
});

// ---------- t ----------

describe("t(text, locale)", () => {
  it("returns the string for each locale", () => {
    const text = { en: "Hello", es: "Hola", hy: "Բարեւ" };
    expect(t(text, "en")).toBe("Hello");
    expect(t(text, "es")).toBe("Hola");
    expect(t(text, "hy")).toBe("Բարեւ");
  });
});

// ---------- matchBusinessType ----------

describe("matchBusinessType", () => {
  it.each(["boba", "coffee", "café", "cafe", "boba shop", "Coffee"])("'%s' → a food type first", (q) => {
    const res = matchBusinessType(q);
    expect(res.length, `no match for "${q}"`).toBeGreaterThan(0);
    expect(isFood(res[0]), `top match for "${q}" was ${res[0]?.id}`).toBe(true);
  });

  it.each(["salon", "peluquería", "hair salon", "Salon"])("'%s' → a personal_care type first", (q) => {
    const res = matchBusinessType(q);
    expect(res.length, `no match for "${q}"`).toBeGreaterThan(0);
    expect(res[0].category, `top match for "${q}" was ${res[0]?.id}`).toBe("personal_care");
  });

  it("returns an empty array (not a throw) for empty / gibberish input", () => {
    expect(() => matchBusinessType("")).not.toThrow();
    expect(Array.isArray(matchBusinessType(""))).toBe(true);
    expect(matchBusinessType("zzqxv qwpl")).toEqual([]);
  });

  it("only returns members of BUSINESS_TYPES", () => {
    const ids = new Set(BUSINESS_TYPES.map((b) => b.id));
    for (const r of matchBusinessType("coffee")) expect(ids.has(r.id)).toBe(true);
  });
});

// ---------- buildRoadmap: invariants for every type × location mode ----------

describe("buildRoadmap invariants (every business type × location mode)", () => {
  const phases = new Set<string>(ROADMAP_PHASES);

  for (const b of BUSINESS_TYPES) {
    for (const { label, mk } of LOCATION_INPUTS) {
      it(`${b.id} / ${label}`, () => {
        const rm = buildRoadmap(mk(b.id));
        expect(rm.steps.length).toBeGreaterThan(0);
        expect(Number.isNaN(Date.parse(rm.generatedAt)), "generatedAt not ISO").toBe(false);

        const ids = rm.steps.map((s) => s.id);
        expect(new Set(ids).size, "duplicate step ids").toBe(ids.length);

        for (let i = 1; i < rm.steps.length; i++) {
          expect(rm.steps[i].order, `steps not sorted by order at index ${i}`).toBeGreaterThanOrEqual(rm.steps[i - 1].order);
        }

        // phases should also be non-decreasing in plan → register → permit → open order
        const phaseIdx = rm.steps.map((s) => ROADMAP_PHASES.indexOf(s.phase));
        for (let i = 1; i < phaseIdx.length; i++) {
          expect(phaseIdx[i], `phase order regresses at step ${rm.steps[i].id}`).toBeGreaterThanOrEqual(phaseIdx[i - 1]);
        }

        for (const s of rm.steps) {
          expect(phases.has(s.phase), `${s.id}.phase "${s.phase}"`).toBe(true);
          expect(s.url, `${s.id}.url`).toMatch(/^https:\/\/[^\s/]+\.[^\s]+/);
          // §7: official sources only (city / county / state / federal). Non-.gov needs an explicit allowlist entry.
          const host = new URL(s.url).hostname;
          expect(OFFICIAL_HOST.test(host), `${s.id}.url host "${host}" is not an official .gov domain`).toBe(true);
          expect(s.agency?.trim().length, `${s.id}.agency`).toBeGreaterThan(0);
          expect(typeof s.required).toBe("boolean");
          expect(typeof s.verified).toBe("boolean");
          expectLocalized(s.title, `${s.id}.title`);
          expectLocalized(s.description, `${s.id}.description`);
          expectLocalized(s.appliesBecause, `${s.id}.appliesBecause`);
        }
      });
    }
  }

  it("is deterministic (same input → same step ids in same order)", () => {
    for (const b of BUSINESS_TYPES) {
      const a = buildRoadmap({ businessTypeId: b.id, locationMode: "undecided" }).steps.map((s) => s.id);
      const c = buildRoadmap({ businessTypeId: b.id, locationMode: "undecided" }).steps.map((s) => s.id);
      expect(c).toEqual(a);
    }
  });
});

// ---------- buildRoadmap: conditional steps ----------

describe("buildRoadmap conditional steps", () => {
  it("every health-permit / food type includes a health-permit step", () => {
    const foodTypes = BUSINESS_TYPES.filter((b) => b.flags.healthPermit || isFood(b));
    expect(foodTypes.length).toBeGreaterThan(0);
    for (const b of foodTypes) {
      const rm = buildRoadmap({ businessTypeId: b.id, locationMode: "address", site: fakeSite("allowed") });
      expect(hasStep(rm.steps, HEALTH_RE), `${b.id} has no health-permit step`).toBe(true);
    }
  });

  it("non-food, no-health-permit types do NOT get a health-permit step", () => {
    const others = BUSINESS_TYPES.filter((b) => !b.flags.healthPermit && !isFood(b) && b.category !== "personal_care" && b.category !== "childcare");
    for (const b of others) {
      const rm = buildRoadmap({ businessTypeId: b.id, locationMode: "undecided" });
      expect(hasStep(rm.steps, HEALTH_RE), `${b.id} unexpectedly has a health step`).toBe(false);
    }
  });

  it("home mode includes a home-occupation step (home-based-ok types)", () => {
    const homeTypes = BUSINESS_TYPES.filter((b) => b.flags.homeBasedOk);
    expect(homeTypes.length).toBeGreaterThan(0);
    for (const b of homeTypes) {
      const rm = buildRoadmap({ businessTypeId: b.id, locationMode: "home" });
      expect(hasStep(rm.steps, HOME_OCC_RE), `${b.id} home mode has no home-occupation step`).toBe(true);
    }
  });

  it("address mode with an allowed site does NOT include a home-occupation step", () => {
    for (const b of BUSINESS_TYPES) {
      const rm = buildRoadmap({ businessTypeId: b.id, locationMode: "address", site: fakeSite("allowed") });
      expect(hasStep(rm.steps, HOME_OCC_RE), `${b.id} address mode has a home-occupation step`).toBe(false);
    }
  });

  it("a conditional-verdict site includes a conditional-use-permit step", () => {
    for (const b of BUSINESS_TYPES) {
      const rm = buildRoadmap({ businessTypeId: b.id, locationMode: "address", site: fakeSite("conditional") });
      expect(hasStep(rm.steps, CUP_RE), `${b.id} conditional site has no CUP step`).toBe(true);
    }
  });

  it("an allowed-verdict site does NOT include a conditional-use-permit step", () => {
    for (const b of BUSINESS_TYPES) {
      const rm = buildRoadmap({ businessTypeId: b.id, locationMode: "address", site: fakeSite("allowed") });
      expect(hasStep(rm.steps, CUP_RE), `${b.id} allowed site has a CUP step`).toBe(false);
    }
  });

  it("tech type includes an entity / EIN step", () => {
    const techTypes = BUSINESS_TYPES.filter((b) => b.category === "tech" || b.flags.tech);
    expect(techTypes.length).toBeGreaterThan(0);
    for (const b of techTypes) {
      const rm = buildRoadmap({ businessTypeId: b.id, locationMode: "home" });
      expect(hasStep(rm.steps, ENTITY_EIN_RE), `${b.id} has no entity/EIN step`).toBe(true);
    }
  });
});

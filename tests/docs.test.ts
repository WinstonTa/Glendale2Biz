/**
 * Phase 3 document prep (lib/docs, owned by frontend-dev). Pure templates: DocInput → GeneratedDoc.
 * Checks: all 3 locales non-empty everywhere, not-legal-advice banner, official https (.gov) links, deterministic.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { LOCALES, type LocalizedText, type SiteCheckResponse } from "@/lib/contracts";
import {
  DOC_BANNER,
  FBN_URL,
  GLENDALE_PLANNING_URL,
  docToText,
  generateDocuments,
  type DocFormInput,
  type DocInput,
  type GeneratedDoc,
} from "@/lib/docs";
import { BUSINESS_TYPES, buildRoadmap } from "@/lib/rules";
import { handleSiteCheck } from "@/lib/gis/siteCheck";
import { mockProvider } from "@/lib/gis/mock";
import { DEMO_ADDRESSES } from "@/lib/gis/demo";

const TODAY = "2026-11-14";
const OFFICIAL_HOST = /(^|\.)[a-z0-9-]+\.gov$/;

const FULL_FORM: DocFormInput = {
  businessName: "Jewel City Boba",
  ownerNames: "Ani Petrosyan, Luis Gómez",
  structure: "llc",
  startDate: "2026-12-01",
  email: "owner@example.com",
  phone: "818-555-0100",
  mailingAddress: "123 Example St, Glendale, CA 91205",
};
const EMPTY_FORM: DocFormInput = { businessName: "", ownerNames: "", structure: "sole_proprietor", startDate: "", email: "", phone: "", mailingAddress: "" };

const sites: Record<string, SiteCheckResponse> = {};

beforeAll(async () => {
  for (const d of DEMO_ADDRESSES) {
    const r = await handleSiteCheck({ address: d.address, businessTypeId: d.exampleBusinessTypeId, locale: "en" }, { provider: mockProvider });
    sites[d.id] = r.body as SiteCheckResponse;
  }
});

function inputs(): { label: string; input: DocInput }[] {
  const out: { label: string; input: DocInput }[] = [];
  for (const b of BUSINESS_TYPES) {
    for (const [fname, form] of [["full", FULL_FORM], ["empty", EMPTY_FORM]] as const) {
      out.push({
        label: `${b.id}/home/${fname}`,
        input: { form, businessTypeId: b.id, locationMode: "home", roadmap: buildRoadmap({ businessTypeId: b.id, locationMode: "home" }), today: TODAY },
      });
      out.push({
        label: `${b.id}/undecided/${fname}`,
        input: { form, businessTypeId: b.id, locationMode: "undecided", site: null, roadmap: null, today: TODAY },
      });
      for (const [id, site] of Object.entries(sites)) {
        out.push({
          label: `${b.id}/address:${id}/${fname}`,
          input: {
            form,
            businessTypeId: b.id,
            locationMode: "address",
            site,
            roadmap: buildRoadmap({ businessTypeId: b.id, locationMode: "address", site }),
            today: TODAY,
          },
        });
      }
    }
  }
  return out;
}

function expectLocalized(t: LocalizedText | undefined, where: string) {
  expect(t, `${where} missing`).toBeTruthy();
  for (const l of LOCALES) {
    expect(typeof t![l], `${where}.${l}`).toBe("string");
    expect(t![l].trim().length, `${where}.${l} empty`).toBeGreaterThan(0);
  }
}

function walk(doc: GeneratedDoc, where: string) {
  expectLocalized(doc.title, `${where}.title`);
  expectLocalized(doc.subtitle, `${where}.subtitle`);
  expect(doc.sections.length, `${where} has no sections`).toBeGreaterThan(0);
  doc.sections.forEach((s, i) => {
    const w = `${where}.sections[${i}]`;
    expectLocalized(s.heading, `${w}.heading`);
    s.fields?.forEach((f, j) => {
      expectLocalized(f.label, `${w}.fields[${j}].label`);
      expectLocalized(f.value, `${w}.fields[${j}].value`);
    });
    s.paragraphs?.forEach((p, j) => expectLocalized(p, `${w}.paragraphs[${j}]`));
    s.bullets?.forEach((p, j) => expectLocalized(p, `${w}.bullets[${j}]`));
    s.checklist?.forEach((p, j) => expectLocalized(p, `${w}.checklist[${j}]`));
    s.links?.forEach((l, j) => {
      expectLocalized(l.label, `${w}.links[${j}].label`);
      expect(l.url, `${w}.links[${j}].url`).toMatch(/^https:\/\//);
      const host = new URL(l.url).hostname;
      expect(OFFICIAL_HOST.test(host), `${w}.links[${j}] host "${host}" not .gov`).toBe(true);
    });
  });
}

const allLinks = (d: GeneratedDoc) => d.sections.flatMap((s) => s.links ?? []).map((l) => l.url);

describe("lib/docs exports", () => {
  it("official URLs are https on .gov hosts", () => {
    for (const u of [FBN_URL, GLENDALE_PLANNING_URL]) {
      expect(u).toMatch(/^https:\/\//);
      expect(OFFICIAL_HOST.test(new URL(u).hostname), u).toBe(true);
    }
  });

  it("DOC_BANNER says not legal advice / not an official form, in all 3 locales", () => {
    expectLocalized(DOC_BANNER, "DOC_BANNER");
    expect(DOC_BANNER.en).toMatch(/not legal advice/i);
    expect(DOC_BANNER.en).toMatch(/not an official form/i);
    expect(DOC_BANNER.es).toMatch(/no es asesor[ií]a legal/i);
    expect(DOC_BANNER.hy).toMatch(/իրավաբանական/);
  });
});

describe("generateDocuments — every business type × location × full/empty form", () => {
  it("returns the 3 docs (zoning_inquiry, fbn, launch_summary) with all text non-empty in en/es/hy and only official https links", () => {
    for (const { label, input } of inputs()) {
      const docs = generateDocuments(input);
      expect(docs.map((d) => d.id), label).toEqual(["zoning_inquiry", "fbn", "launch_summary"]);
      for (const d of docs) walk(d, `${label}:${d.id}`);
    }
  });

  it("FBN worksheet links the LA County FBN page; zoning inquiry links Glendale Planning", () => {
    for (const { label, input } of inputs()) {
      const [zoning, fbn] = generateDocuments(input);
      expect(allLinks(fbn), label).toContain(FBN_URL);
      expect(allLinks(zoning), label).toContain(GLENDALE_PLANNING_URL);
    }
  });

  it("is deterministic for a fixed `today`", () => {
    const input = inputs()[0].input;
    expect(generateDocuments(input)).toEqual(generateDocuments(input));
  });

  it("puts the founder's business name into the FBN worksheet", () => {
    const input: DocInput = { form: FULL_FORM, businessTypeId: "cafe", locationMode: "home", today: TODAY };
    const fbn = generateDocuments(input)[1];
    expect(JSON.stringify(fbn)).toContain("Jewel City Boba");
  });

  it("empty form fields are flagged missing with a localized placeholder (not English in es/hy)", () => {
    const input: DocInput = { form: EMPTY_FORM, businessTypeId: "cafe", locationMode: "home", today: TODAY };
    const fields = generateDocuments(input).flatMap((d) => d.sections.flatMap((s) => s.fields ?? []));
    const missing = fields.filter((f) => f.missing);
    expect(missing.length).toBeGreaterThan(0);
    for (const f of missing) {
      expect(f.value.es).not.toBe(f.value.en);
      expect(f.value.hy).not.toBe(f.value.en);
    }
  });
});

describe("docToText (Copy text)", () => {
  it("includes the not-legal-advice banner and the title in every locale", () => {
    const input: DocInput = {
      form: FULL_FORM,
      businessTypeId: "cafe",
      locationMode: "address",
      site: Object.values(sites)[0],
      roadmap: buildRoadmap({ businessTypeId: "cafe", locationMode: "address", site: Object.values(sites)[0] }),
      today: TODAY,
    };
    for (const d of generateDocuments(input)) {
      for (const l of LOCALES) {
        const txt = docToText(d, l);
        expect(txt, `${d.id}/${l} banner`).toContain(DOC_BANNER[l]);
        expect(txt, `${d.id}/${l} title`).toContain(d.title[l].toUpperCase());
        for (const u of allLinks(d)) expect(txt, `${d.id}/${l} link`).toContain(u);
      }
    }
  });
});

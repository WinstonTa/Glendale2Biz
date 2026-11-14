/**
 * UI dictionary checks for lib/i18n (owned by frontend-dev).
 * Imports the plain dictionaries (not the React provider) so this runs in node.
 */
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { es } from "@/lib/i18n/es";
import { hy } from "@/lib/i18n/hy";

type Tree = { [k: string]: string | Tree };

function flatten(obj: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

const FLAT = { en: flatten(en as Tree), es: flatten(es as Tree), hy: flatten(hy as Tree) };
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe("i18n dictionaries", () => {
  it("es and hy have exactly the same keys as en", () => {
    const keys = Object.keys(FLAT.en).sort();
    expect(Object.keys(FLAT.es).sort()).toEqual(keys);
    expect(Object.keys(FLAT.hy).sort()).toEqual(keys);
  });

  it("no empty strings in any locale", () => {
    for (const [loc, flat] of Object.entries(FLAT)) {
      for (const [k, v] of Object.entries(flat)) expect(v.trim().length, `${loc}.${k} is empty`).toBeGreaterThan(0);
    }
  });

  it("placeholders like {n} / {done} are preserved in every translation", () => {
    for (const [k, v] of Object.entries(FLAT.en)) {
      expect(placeholders(FLAT.es[k] ?? ""), `es.${k}`).toEqual(placeholders(v));
      expect(placeholders(FLAT.hy[k] ?? ""), `hy.${k}`).toEqual(placeholders(v));
    }
  });

  it("Armenian strings actually contain Armenian script (not English copies)", () => {
    const armenian = /[԰-֏]/;
    const copied = Object.entries(FLAT.hy).filter(([k, v]) => v === FLAT.en[k] && /[a-z]{4,}/i.test(v));
    // Brand names / codes may legitimately match; flag anything else.
    expect(copied.map(([k]) => k), "hy strings identical to English").toEqual([]);
    expect(Object.values(FLAT.hy).filter((v) => armenian.test(v)).length).toBeGreaterThan(Object.keys(FLAT.hy).length * 0.8);
  });

  it("has a localized message for every ApiErrorCode", () => {
    for (const code of ["ADDRESS_NOT_FOUND", "OUTSIDE_GLENDALE", "AMBIGUOUS_ADDRESS", "GIS_UNAVAILABLE", "BAD_REQUEST"]) {
      for (const loc of ["en", "es", "hy"] as const) expect(FLAT[loc][`errors.${code}`], `${loc}.errors.${code}`).toBeTruthy();
    }
  });

  it("English verdict disclaimer matches MASTER_INSTRUCTIONS §7 wording", () => {
    expect(en.disclaimer).toBe(
      "This is general guidance, not legal advice. Confirm with the City of Glendale Planning Division before signing a lease.",
    );
  });

  it("has a 'Demo data' label and a translation-in-review footer note in every locale", () => {
    for (const loc of ["en", "es", "hy"] as const) {
      expect(FLAT[loc].demoData, `${loc}.demoData`).toBeTruthy();
      expect(FLAT[loc].footerTranslation, `${loc}.footerTranslation`).toBeTruthy();
    }
  });
});

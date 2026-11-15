/**
 * Demo addresses served by mock mode (GIS_MODE=mock). Client-safe: no secrets, no server imports.
 * `fixture` = file name in lib/gis/fixtures/. Expected verdicts are for the example business type.
 */
export interface DemoAddress {
  id: string;
  address: string;
  label: { en: string; es: string; hy: string };
  /** raw ZONE_DISTR in the mock fixture (mirrors live GIS, recorded 2026-11-14) */
  zoneCode: string;
  /** a business type id that demonstrates this address well */
  exampleBusinessTypeId: string;
  expectedVerdict: "allowed" | "conditional" | "not_allowed";
  fixture: string;
}

export const DEMO_ADDRESSES: readonly DemoAddress[] = [
  {
    id: "city_hall",
    address: "613 E Broadway, Glendale, CA 91206",
    label: { en: "Downtown (City Hall)", es: "Centro (Ayuntamiento)", hy: "Կենտրոն (Քաղաքապետարան)" },
    zoneCode: "DSP/CC",
    exampleBusinessTypeId: "cafe",
    expectedVerdict: "allowed",
    fixture: "613-e-broadway.json",
  },
  {
    id: "san_fernando",
    address: "4500 San Fernando Rd, Glendale, CA 91204",
    label: { en: "San Fernando Rd (mixed use)", es: "San Fernando Rd (uso mixto)", hy: "Սան Ֆերնանդո Ռդ (խառը նշանակության)" },
    zoneCode: "IMU R",
    exampleBusinessTypeId: "cafe",
    expectedVerdict: "conditional",
    fixture: "4500-san-fernando-rd.json",
  },
  {
    id: "residential",
    address: "1200 Cleveland Rd, Glendale, CA 91202",
    label: { en: "Residential street", es: "Calle residencial", hy: "Բնակելի փողոց" },
    zoneCode: "R1 I",
    exampleBusinessTypeId: "cafe",
    expectedVerdict: "not_allowed",
    fixture: "1200-cleveland-rd.json",
  },
] as const;

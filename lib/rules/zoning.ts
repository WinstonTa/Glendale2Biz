import type { BusinessCategory, BusinessType, LocalizedText, Verdict, VerdictStatus } from "../contracts";
import { L } from "./text";

/**
 * Glendale zoning guidance table.
 * Zone families are based on Glendale Municipal Code Title 30 zone names.
 * TODO(live): confirm exact codes/field values returned by the GIS `zoning` dataset.
 * This is GUIDANCE, never a ruling. Unknown code ⇒ "unknown".
 */
export type ZoneFamily =
  | "residential"
  | "C1"
  | "C2"
  | "C3"
  | "CR"
  | "CO"
  | "CA"
  | "DSP"
  | "SFMU"
  | "IMU"
  | "IMU_R"
  | "IND"
  | "public";

const A: VerdictStatus = "allowed";
const C: VerdictStatus = "conditional";
const N: VerdictStatus = "not_allowed";

type Row = Record<BusinessCategory, VerdictStatus>;
//                       food retail pcare fit  auto svc  child home tech
const row = (food: VerdictStatus, retail: VerdictStatus, personal_care: VerdictStatus, fitness: VerdictStatus, auto: VerdictStatus, services: VerdictStatus, childcare: VerdictStatus, home_based: VerdictStatus, tech: VerdictStatus): Row => ({
  food, retail, personal_care, fitness, auto, services, childcare, home_based, tech,
});

export const ZONE_MATRIX: Record<ZoneFamily, Row> = {
  //               food retail pcare fit auto svc child home tech
  residential: row(N, N, N, N, N, N, C, A, C),
  C1: row(A, A, A, C, N, A, C, A, A),
  C2: row(A, A, A, A, C, A, C, A, A),
  C3: row(A, A, A, A, A, A, C, A, A),
  CR: row(A, A, A, A, C, A, C, A, A),
  CO: row(C, C, C, C, N, A, C, A, A),
  CA: row(C, A, C, C, A, C, N, A, C),
  DSP: row(A, A, A, A, N, A, C, A, A),
  SFMU: row(A, A, A, C, C, A, C, A, A),
  IMU: row(C, A, A, C, A, A, C, A, A),
  IMU_R: row(C, A, A, C, C, A, C, A, A),
  IND: row(C, C, N, C, A, C, N, C, A),
  public: row(N, N, N, N, N, N, N, N, N),
};

export const ZONE_NAMES: Record<ZoneFamily, LocalizedText> = {
  residential: L("Residential", "Residencial", "Բնակելի"),
  C1: L("Neighborhood Commercial", "Comercial de vecindario", "Թաղային առևտրային"),
  C2: L("Community Commercial", "Comercial comunitario", "Համայնքային առևտրային"),
  C3: L("Commercial Service", "Comercial de servicios", "Առևտրային սպասարկման"),
  CR: L("Commercial Regional", "Comercial regional", "Տարածաշրջանային առևտրային"),
  CO: L("Commercial Office", "Comercial de oficinas", "Գրասենյակային առևտրային"),
  CA: L("Commercial Auto", "Comercial automotriz", "Ավտոմոբիլային առևտրային"),
  DSP: L("Downtown Specific Plan", "Plan Específico del Centro", "Կենտրոնի հատուկ պլան"),
  SFMU: L("San Fernando Road Corridor Mixed Use", "Uso mixto del corredor San Fernando Road", "Սան Ֆերնանդո Ռոուդ միջանցքի խառը նշանակության"),
  IMU: L("Industrial/Commercial Mixed Use", "Uso mixto industrial/comercial", "Արդյունաբերական/առևտրային խառը նշանակության"),
  IMU_R: L("Industrial/Commercial–Residential Mixed Use", "Uso mixto industrial/comercial–residencial", "Արդյունաբերական/առևտրային–բնակելի խառը նշանակության"),
  IND: L("Industrial", "Industrial", "Արդյունաբերական"),
  public: L("Public / Open Space", "Público / Espacio abierto", "Հանրային / Բաց տարածք"),
};

const RESIDENTIAL_NAMES: Record<string, LocalizedText> = {
  ROS: L("Residential Open Space", "Residencial de espacio abierto", "Բնակելի բաց տարածք"),
  R1R: L("Restricted Residential (single-family)", "Residencial restringido (unifamiliar)", "Սահմանափակ բնակելի (առանձնատներ)"),
  R1: L("Low Density Residential (single-family)", "Residencial de baja densidad (unifamiliar)", "Ցածր խտության բնակելի (առանձնատներ)"),
};

/** Normalize a raw code: uppercase, trim, drop height-district / overlay suffixes like "-II" or " (PD)". */
export function normalizeZoneCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).toUpperCase().trim();
  s = s.replace(/\s*\(.*?\)\s*/g, "").replace(/\s+/g, "");
  s = s.replace(/-(I{1,3}|IV)$/, ""); // height districts
  return s || null;
}

export function zoneFamily(rawCode: string | null | undefined): ZoneFamily | null {
  const c = normalizeZoneCode(rawCode);
  if (!c) return null;
  if (c === "ROS" || /^R1R?$/.test(c) || /^R-?\d{3,4}$/.test(c) || /^R[2-4]$/.test(c)) return "residential";
  if (c.startsWith("DSP") || c === "DTSP") return "DSP";
  if (c === "IMU-R" || c === "IMUR") return "IMU_R";
  if (c === "IMU") return "IMU";
  if (c.startsWith("SFMU")) return "SFMU";
  if (c === "IND" || c === "M1" || c === "M2" || c === "M3") return "IND";
  if (c === "C1" || c === "C2" || c === "C3" || c === "CR" || c === "CO" || c === "CA") return c;
  if (c === "PS" || c === "SR" || c === "P" || c === "OS") return "public";
  return null;
}

export function zoneName(rawCode: string | null | undefined): LocalizedText | null {
  const c = normalizeZoneCode(rawCode);
  const fam = zoneFamily(rawCode);
  if (!c || !fam) return null;
  if (fam === "residential") {
    if (RESIDENTIAL_NAMES[c]) return RESIDENTIAL_NAMES[c];
    return L(`Multi-family Residential (${c})`, `Residencial multifamiliar (${c})`, `Բազմաբնակարան բնակելի (${c})`);
  }
  return ZONE_NAMES[fam];
}

const RANK: Record<VerdictStatus, number> = { allowed: 0, conditional: 1, unknown: 2, not_allowed: 3 };
const worst = (a: VerdictStatus, b: VerdictStatus) => (RANK[b] > RANK[a] ? b : a);

export const DISCLAIMER: LocalizedText = L(
  "This is general guidance, not legal advice. Confirm with the City of Glendale Planning Division before signing a lease.",
  "Esto es orientación general, no asesoría legal. Confirme con la División de Planificación de la Ciudad de Glendale antes de firmar un contrato de arrendamiento.",
  "Սա ընդհանուր ուղղորդում է, ոչ թե իրավաբանական խորհրդատվություն։ Նախքան վարձակալության պայմանագիր ստորագրելը՝ հաստատեք Գլենդեյլ քաղաքի Պլանավորման բաժնում։",
);

/** "an auto repair shop", "an e-commerce shop", "a cafe" (lowercased name with the right article). */
export function aOrAn(name: string): string {
  const n = name.toLowerCase();
  return `${/^[aeiou]/.test(n) ? "an" : "a"} ${n}`;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Pure verdict for a business type at a zone code.
 * The UI renders DISCLAIMER itself, so it is NOT included in `notes`.
 */
export function evaluateZoning(rawCode: string | null | undefined, b: BusinessType): Verdict {
  const fam = zoneFamily(rawCode);
  const code = normalizeZoneCode(rawCode) ?? "?";
  const notes: LocalizedText[] = [];

  if (!fam) {
    return {
      status: "unknown",
      summary: L(
        `We don't have a rule for zone “${code}” yet — ask Glendale Planning whether ${aOrAn(b.name.en)} is allowed here.`,
        `Aún no tenemos una regla para la zona “${code}”. Pregunte a Planificación de Glendale si se permite un negocio “${b.name.es}” aquí.`,
        `«${code}» գոտու համար դեռ կանոն չունենք․ հարցրեք Գլենդեյլի Պլանավորման բաժնին՝ արդյոք այստեղ թույլատրվում է «${b.name.hy}»։`,
      ),
      notes: [],
    };
  }

  let status = ZONE_MATRIX[fam][b.category];
  // Home-capable businesses in a residential zone ⇒ home occupation.
  if (fam === "residential" && b.flags.homeBasedOk && status === "not_allowed") status = "conditional";
  if (fam === "residential" && b.flags.homeBasedOk) {
    notes.push(
      L(
        "In a residential zone this works only as a home occupation at your own residence: limited customer visits, no exterior signs, limited employees.",
        "En zona residencial solo funciona como ocupación en el hogar en su propia residencia: visitas limitadas de clientes, sin letreros exteriores, empleados limitados.",
        "Բնակելի գոտում սա հնարավոր է միայն որպես տնային գործունեություն ձեր սեփական բնակարանում․ հաճախորդների սահմանափակ այցեր, առանց արտաքին ցուցանակի, սահմանափակ աշխատողներ։",
      ),
    );
  }
  if (fam === "residential" && b.category === "childcare") {
    notes.push(
      L(
        "State law allows licensed family child care homes in residences; a child care center needs a commercial site or a use permit.",
        "La ley estatal permite hogares de cuidado infantil familiar con licencia en residencias; un centro de cuidado infantil necesita un local comercial o un permiso de uso.",
        "Նահանգային օրենքը թույլ է տալիս լիցենզավորված ընտանեկան խնամքի տներ բնակարաններում․ խնամքի կենտրոնին անհրաժեշտ է առևտրային տարածք կամ օգտագործման թույլտվություն։",
      ),
    );
  }
  if (b.flags.alcohol && status !== "not_allowed") {
    status = worst(status, "conditional");
    notes.push(
      L(
        "Alcohol sales usually need a City use permit in addition to a state ABC license.",
        "La venta de alcohol suele requerir un permiso de uso de la Ciudad además de la licencia estatal del ABC.",
        "Ալկոհոլի վաճառքը սովորաբար պահանջում է Քաղաքի օգտագործման թույլտվություն՝ բացի նահանգային ABC լիցենզիայից։",
      ),
    );
  }
  if (status === "conditional" && !(fam === "residential" && b.flags.homeBasedOk)) {
    notes.push(
      L(
        "“Conditional” means you will likely need a Conditional Use Permit (or similar discretionary approval), which can take months and may require a public hearing.",
        "“Condicional” significa que probablemente necesitará un Permiso de Uso Condicional (u otra aprobación discrecional), que puede tardar meses y requerir audiencia pública.",
        "«Պայմանական» նշանակում է, որ հավանաբար ձեզ անհրաժեշտ կլինի պայմանական օգտագործման թույլտվություն (CUP), որը կարող է ամիսներ տևել և պահանջել հանրային լսում։",
      ),
    );
  }
  if (fam === "DSP") {
    notes.push(
      L(
        "Downtown Specific Plan sub-districts have their own rules (ground-floor uses, design review).",
        "Las subzonas del Plan Específico del Centro tienen sus propias reglas (usos en planta baja, revisión de diseño).",
        "Կենտրոնի հատուկ պլանի ենթագոտիներն ունեն իրենց կանոնները (առաջին հարկի օգտագործում, դիզայնի վերանայում)։",
      ),
    );
  }

  const zn = zoneName(rawCode)!;
  const summary: Record<VerdictStatus, LocalizedText> = {
    allowed: L(
      `${cap(aOrAn(b.name.en))} is likely allowed in ${zn.en} (${code}).`,
      `Un negocio “${b.name.es}” probablemente está permitido en ${zn.es} (${code}).`,
      `«${b.name.hy}», հավանաբար, թույլատրված է «${zn.hy}» գոտում (${code})։`,
    ),
    conditional: L(
      `${cap(aOrAn(b.name.en))} may be allowed in ${zn.en} (${code}), but likely only with a special permit.`,
      `Un negocio “${b.name.es}” podría permitirse en ${zn.es} (${code}), pero probablemente solo con un permiso especial.`,
      `«${b.name.hy}» կարող է թույլատրվել «${zn.hy}» գոտում (${code}), բայց հավանաբար միայն հատուկ թույլտվությամբ։`,
    ),
    not_allowed: L(
      `${cap(aOrAn(b.name.en))} is likely not allowed in ${zn.en} (${code}).`,
      `Un negocio “${b.name.es}” probablemente no está permitido en ${zn.es} (${code}).`,
      `«${b.name.hy}», հավանաբար, թույլատրված չէ «${zn.hy}» գոտում (${code})։`,
    ),
    unknown: L(
      `We couldn't determine whether ${aOrAn(b.name.en)} is allowed in zone ${code}.`,
      `No pudimos determinar si un negocio “${b.name.es}” está permitido en la zona ${code}.`,
      `Չկարողացանք որոշել՝ արդյոք «${b.name.hy}» թույլատրված է ${code} գոտում։`,
    ),
  };
  return { status, summary: summary[status], notes };
}

import type { BusinessCategory, BusinessType, LocalizedText, Verdict, VerdictStatus } from "../contracts";
import { L } from "./text";

/**
 * Glendale zoning guidance table.
 * Live-verified 2026-11-14 against the GIS `zoning` dataset (field ZONE_DISTR, e.g. "DSP/CC", "C3 III PPD",
 * "R 1250 PS", "IMU R", "R1 I HD"). Every distinct ZONE_DISTR value in the dataset maps to a family below.
 * Suffix tokens (I–IV height/FAR district, HD, H, P, PS, PPD, PRD, ASOZ) don't change the use family.
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
  | "CH"
  | "CE"
  | "CPD"
  | "MS"
  | "TOD"
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
  CH: row(C, C, C, C, N, C, C, A, C),
  CE: row(N, C, N, C, N, C, N, A, N),
  CPD: row(C, C, C, C, C, C, C, A, C),
  MS: row(C, C, C, C, N, A, C, A, A),
  TOD: row(A, A, A, A, N, A, C, A, A),
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
  CR: L("Commercial Retail", "Comercial minorista", "Մանրածախ առևտրային"),
  CO: L("Commercial Office", "Comercial de oficinas", "Գրասենյակային առևտրային"),
  CA: L("Commercial Auto", "Comercial automotriz", "Ավտոմոբիլային առևտրային"),
  CH: L("Commercial Hillside", "Comercial de ladera", "Լանջային առևտրային"),
  CE: L("Commercial Equestrian Services", "Comercial de servicios ecuestres", "Ձիասպորտի ծառայությունների առևտրային"),
  CPD: L("Commercial Planned Development", "Desarrollo comercial planificado", "Պլանավորված առևտրային կառուցապատում"),
  MS: L("Medical Services", "Servicios médicos", "Բժշկական ծառայություններ"),
  TOD: L("Transit Oriented District", "Distrito orientado al transporte público", "Հասարակական տրանսպորտին կողմնորոշված թաղամաս"),
  DSP: L("Downtown Specific Plan", "Plan Específico del Centro", "Կենտրոնի հատուկ պլան"),
  SFMU: L("San Fernando Road Commercial/Residential Mixed Use", "Uso mixto comercial/residencial de San Fernando Road", "Սան Ֆերնանդո Ռոուդի առևտրային/բնակելի խառը նշանակության"),
  IMU: L("Industrial Mixed Use", "Uso mixto industrial", "Արդյունաբերական խառը նշանակության"),
  IMU_R: L("Industrial/Commercial–Residential Mixed Use", "Uso mixto industrial/comercial–residencial", "Արդյունաբերական/առևտրային–բնակելի խառը նշանակության"),
  IND: L("Industrial", "Industrial", "Արդյունաբերական"),
  public: L("Public / Open Space", "Público / Espacio abierto", "Հանրային / Բաց տարածք"),
};

const RESIDENTIAL_NAMES: Record<string, LocalizedText> = {
  ROS: L("Residential Open Space", "Residencial de espacio abierto", "Բնակելի բաց տարածք"),
  R1R: L("Restricted Single-Family Residential", "Residencial unifamiliar restringido", "Սահմանափակ առանձնատնային բնակելի"),
  R1: L("Low Density Single-Family Residential", "Residencial unifamiliar de baja densidad", "Ցածր խտության առանձնատնային բնակելի"),
  "R-3050": L("Moderate Density Residential", "Residencial de densidad moderada", "Չափավոր խտության բնակելի"),
  "R-2250": L("Medium Density Residential", "Residencial de densidad media", "Միջին խտության բնակելի"),
  "R-1650": L("Medium-High Density Residential", "Residencial de densidad media-alta", "Միջին-բարձր խտության բնակելի"),
  "R-1250": L("High Density Residential", "Residencial de alta densidad", "Բարձր խտության բնակելի"),
};

const PUBLIC_NAMES: Record<string, LocalizedText> = {
  SR: L("Special Recreation", "Recreación especial", "Հատուկ հանգստի գոտի"),
  CEM: L("Cemetery", "Cementerio", "Գերեզմանատուն"),
  T: L("Transportation", "Transporte", "Տրանսպորտ"),
};

/** Downtown Specific Plan sub-districts seen in live data (ZONE_DISTR "DSP/<sub>"). */
const DSP_SUBDISTRICTS: Record<string, LocalizedText> = {
  CC: L("Civic Center", "Centro Cívico", "Քաղաքացիական կենտրոն"),
  BC: L("Broadway Center", "Centro Broadway", "Բրոդվեյ կենտրոն"),
  EB: L("East Broadway", "East Broadway", "Արևելյան Բրոդվեյ"),
  GAT: L("Gateway", "Gateway (entrada)", "Գեյթուեյ (մուտք)"),
  GAL: L("Galleria", "Galleria", "Գալերիա"),
  AE: L("Art & Entertainment", "Arte y entretenimiento", "Արվեստ և ժամանց"),
  AT: L("Alex Theatre", "Alex Theatre", "Ալեքս թատրոն"),
  MO: L("Mid-Orange", "Mid-Orange", "Միդ-Օրանջ"),
  OC: L("Orange Central", "Orange Central", "Օրանջ Սենթրալ"),
  TCSP: L("Town Center", "Centro urbano", "Քաղաքային կենտրոն"),
  TD: L("Transitional District", "Distrito de transición", "Անցումային թաղամաս"),
};

/**
 * Normalize a raw ZONE_DISTR to its base code: uppercase, drop "(…)", drop height/FAR and overlay
 * suffix tokens (they don't change the use family). Examples: "C3 III PPD"→"C3", "R 1250 PS"→"R-1250",
 * "IMU R"→"IMU-R", "R1 I HD"→"R1", "DSP/CC"→"DSP/CC", "DSP/GAL ASOZ"→"DSP/GAL", "C3-II"→"C3".
 */
export function normalizeZoneCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).toUpperCase().replace(/\(.*?\)/g, " ").trim();
  if (!s) return null;
  const tokens = s.split(/\s+/);
  let base: string;
  if (tokens[0] === "R" && /^\d{3,4}$/.test(tokens[1] ?? "")) base = `R-${tokens[1]}`;
  else if (tokens[0] === "IMU" && tokens[1] === "R") base = "IMU-R";
  else base = tokens[0];
  base = base.replace(/-(I{1,3}|IV)$/, "");
  return base || null;
}

export function zoneFamily(rawCode: string | null | undefined): ZoneFamily | null {
  const c = normalizeZoneCode(rawCode);
  if (!c) return null;
  if (c === "ROS" || /^R1R?$/.test(c) || /^R-?\d{3,4}$/.test(c) || /^R[2-4]$/.test(c)) return "residential";
  if (c === "DSP" || c.startsWith("DSP/") || c === "DTSP") return "DSP";
  if (c === "IMU-R" || c === "IMUR") return "IMU_R";
  if (c === "IMU") return "IMU";
  if (c.startsWith("SFMU")) return "SFMU";
  if (c === "IND" || c === "M1" || c === "M2" || c === "M3") return "IND";
  if (["C1", "C2", "C3", "CR", "CO", "CA", "CH", "CE", "CPD", "MS", "TOD"].includes(c)) return c as ZoneFamily;
  if (c === "PS" || c === "SR" || c === "P" || c === "OS" || c === "CEM" || c === "T") return "public";
  return null;
}

export function zoneName(rawCode: string | null | undefined): LocalizedText | null {
  const c = normalizeZoneCode(rawCode);
  const fam = zoneFamily(rawCode);
  if (!c || !fam) return null;
  if (fam === "residential") {
    const key = /^R\d{4}$/.test(c) ? `R-${c.slice(1)}` : c;
    return (
      RESIDENTIAL_NAMES[key] ??
      L(`Multi-family Residential (${c})`, `Residencial multifamiliar (${c})`, `Բազմաբնակարան բնակելի (${c})`)
    );
  }
  if (fam === "public" && PUBLIC_NAMES[c]) return PUBLIC_NAMES[c];
  if (fam === "DSP") {
    const sub = DSP_SUBDISTRICTS[c.split("/")[1] ?? ""];
    const d = ZONE_NAMES.DSP;
    if (sub) return L(`${d.en} – ${sub.en}`, `${d.es} – ${sub.es}`, `${d.hy} – ${sub.hy}`);
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
  const code = normalizeZoneCode(rawCode);
  const notes: LocalizedText[] = [];

  if (!fam && !code) {
    return {
      status: "unknown",
      summary: L(
        `We couldn't find zoning for this address — ask Glendale Planning whether ${aOrAn(b.name.en)} is allowed here.`,
        `No encontramos la zonificación de esta dirección. Pregunte a Planificación de Glendale si se permite un negocio “${b.name.es}” aquí.`,
        `Այս հասցեի գոտիավորումը չգտանք․ հարցրեք Գլենդեյլի Պլանավորման բաժնին՝ արդյոք այստեղ թույլատրվում է «${b.name.hy}»։`,
      ),
      notes: [],
    };
  }

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

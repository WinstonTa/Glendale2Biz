/**
 * Display-time localization helpers for strings the contract keeps as plain English
 * (RoadmapStep.costEstimate / timeEstimate / agency, Hazard.detail). Client-safe, pure.
 * Every helper falls back to the English input when it has no translation.
 */
import type { Locale, LocalizedText, RoadmapInput, SiteCheckResponse, VerdictStatus } from "../contracts";
import { BUSINESS_TYPES } from "./businessTypes";
import { buildRoadmap } from "./roadmap";
import { L, t } from "./text";

// ---------------- estimates ----------------

const ESTIMATE_TEXT: Record<string, LocalizedText> = {
  Free: L("Free", "Gratis", "Անվճար"),
  "Same day": L("Same day", "El mismo día", "Նույն օրը"),
  "$100–$500 + registered agent": L("$100–$500 + registered agent", "$100–$500 + agente registrado", "$100–$500 + գրանցված գործակալ"),
  "$0 (sole prop) · ~$70+ (LLC) + $800/yr CA franchise tax": L(
    "$0 (sole prop) · ~$70+ (LLC) + $800/yr CA franchise tax",
    "$0 (empresa individual) · ~$70+ (LLC) + $800/año de impuesto de franquicia de CA",
    "$0 (անհատ ձեռնարկատեր) · ~$70+ (ՍՊԸ) + $800/տարի Կալիֆոռնիայի ֆրանշիզային հարկ",
  ),
  "~$26 filing + newspaper publication": L("~$26 filing + newspaper publication", "~$26 de registro + publicación en periódico", "~$26 գրանցում + հրապարակում թերթում"),
  "1 day + 4 weeks publication": L("1 day + 4 weeks publication", "1 día + 4 semanas de publicación", "1 օր + 4 շաբաթ հրապարակում"),
  "Free (security deposit may apply)": L("Free (security deposit may apply)", "Gratis (puede requerirse un depósito de garantía)", "Անվճար (կարող է պահանջվել երաշխիքային ավանդ)"),
  "Within 30 days of stock grant": L("Within 30 days of stock grant", "Dentro de 30 días de la emisión de acciones", "Բաժնետոմսերի տրամադրումից 30 օրվա ընթացքում"),
  "Several thousand dollars (confirm current fee schedule)": L(
    "Several thousand dollars (confirm current fee schedule)",
    "Varios miles de dólares (confirme las tarifas vigentes)",
    "Մի քանի հազար դոլար (ճշտեք գործող վճարները)",
  ),
  "Plan check ~$1,000+; annual permit ~$500–$1,500": L(
    "Plan check ~$1,000+; annual permit ~$500–$1,500",
    "Revisión de planos ~$1,000+; permiso anual ~$500–$1,500",
    "Նախագծի ստուգում ~$1,000+; տարեկան թույլտվություն ~$500–$1,500",
  ),
  "~$300–$15,000+ depending on license type": L("~$300–$15,000+ depending on license type", "~$300–$15,000+ según el tipo de licencia", "~$300–$15,000+՝ կախված լիցենզիայի տեսակից"),
  "~$100–$1,000+ depending on capacity": L("~$100–$1,000+ depending on capacity", "~$100–$1,000+ según la capacidad", "~$100–$1,000+՝ կախված տարողությունից"),
  "Varies with project value": L("Varies with project value", "Varía según el valor del proyecto", "Կախված է նախագծի արժեքից"),
};

const UNIT_WORDS: Record<"es" | "hy", [RegExp, string][]> = {
  es: [[/\bdays\b/g, "días"], [/\bday\b/g, "día"], [/\bweeks\b/g, "semanas"], [/\bweek\b/g, "semana"], [/\bmonths\b/g, "meses"], [/\bmonth\b/g, "mes"], [/\/yr\b/g, "/año"]],
  hy: [[/\bdays?\b/g, "օր"], [/\bweeks?\b/g, "շաբաթ"], [/\bmonths?\b/g, "ամիս"], [/\/yr\b/g, "/տարի"]],
};

/** Translate an English estimate string ("1–3 weeks", "~$100–$300/yr", "Free", …). Unknown phrases are returned unchanged. */
export function localizeEstimateText(english: string | undefined, locale: Locale): string | undefined {
  if (english === undefined || locale === "en") return english;
  const exact = ESTIMATE_TEXT[english];
  if (exact) return t(exact, locale);
  let out = english;
  for (const [re, rep] of UNIT_WORDS[locale]) out = out.replace(re, rep);
  // Only trust the pattern pass if no English words are left (e.g. "~$50–$150", "2–6 weeks").
  const residue = out.replace(/(días|día|semanas|semana|meses|mes|año)/g, "");
  return /[A-Za-z]{2,}/.test(residue) ? english : out;
}

let STEP_ESTIMATES: Map<string, { cost?: string; time?: string }> | null = null;

/** English estimates per step id, collected once from buildRoadmap over every business type and location case. */
function stepEstimates(): Map<string, { cost?: string; time?: string }> {
  if (STEP_ESTIMATES) return STEP_ESTIMATES;
  const map = new Map<string, { cost?: string; time?: string }>();
  const site = (status: VerdictStatus): SiteCheckResponse => ({
    address: { input: "", matched: "", lat: 0, lon: 0 },
    zoning: { code: null, name: null },
    verdict: { status, summary: L("", "", ""), notes: [] },
    hazards: [],
    nearby: [],
    meta: { dataSource: "mock", fetchedAt: "1970-01-01T00:00:00.000Z", warnings: [] },
  });
  for (const b of BUSINESS_TYPES) {
    const inputs: RoadmapInput[] = [
      { businessTypeId: b.id, locationMode: "home" },
      { businessTypeId: b.id, locationMode: "undecided" },
      { businessTypeId: b.id, locationMode: "address", site: site("conditional") },
      { businessTypeId: b.id, locationMode: "address", site: site("not_allowed") },
    ];
    for (const input of inputs) {
      for (const s of buildRoadmap(input, new Date(0)).steps) {
        if (!map.has(s.id)) map.set(s.id, { cost: s.costEstimate, time: s.timeEstimate });
      }
    }
  }
  STEP_ESTIMATES = map;
  return map;
}

/**
 * Localized cost/time estimate for a roadmap step id. Returns undefined when the step has no estimate.
 * Falls back to the English string. Pass `english` (the step's own value) to be safe against drift.
 */
export function localizeEstimate(stepId: string, kind: "cost" | "time", locale: Locale, english?: string): string | undefined {
  const en = english ?? stepEstimates().get(stepId)?.[kind];
  return localizeEstimateText(en, locale);
}

// ---------------- agencies ----------------

const AGENCY_TEXT: Record<string, LocalizedText> = {
  "U.S. Small Business Administration": L("U.S. Small Business Administration", "Administración de Pequeños Negocios de EE. UU. (SBA)", "ԱՄՆ Փոքր բիզնեսի վարչություն (SBA)"),
  "City of Glendale — Planning Division": L("City of Glendale — Planning Division", "Ciudad de Glendale — División de Planificación", "Գլենդեյլ քաղաք — Պլանավորման բաժին"),
  "City of Glendale — Building & Safety": L("City of Glendale — Building & Safety", "Ciudad de Glendale — Construcción y Seguridad", "Գլենդեյլ քաղաք — Շինարարության և անվտանգության բաժին"),
  "City of Glendale — Finance (Business License)": L("City of Glendale — Finance (Business License)", "Ciudad de Glendale — Finanzas (Licencias comerciales)", "Գլենդեյլ քաղաք — Ֆինանսական բաժին (բիզնես լիցենզիաներ)"),
  "Glendale Fire Department — Fire Prevention": L("Glendale Fire Department — Fire Prevention", "Departamento de Bomberos de Glendale — Prevención de Incendios", "Գլենդեյլի հրշեջ ծառայություն — Հրդեհների կանխարգելում"),
  "City of Glendale — Economic Development": L("City of Glendale — Economic Development", "Ciudad de Glendale — Desarrollo Económico", "Գլենդեյլ քաղաք — Տնտեսական զարգացում"),
  "California Secretary of State (bizfile Online)": L("California Secretary of State (bizfile Online)", "Secretario de Estado de California (bizfile Online)", "Կալիֆոռնիայի պետքարտուղար (bizfile Online)"),
  "Delaware Division of Corporations": L("Delaware Division of Corporations", "División de Corporaciones de Delaware", "Delaware Division of Corporations (Դելավերի կորպորացիաների բաժին)"),
  "Internal Revenue Service (IRS)": L("Internal Revenue Service (IRS)", "Servicio de Impuestos Internos (IRS)", "ԱՄՆ Ներքին եկամուտների ծառայություն (IRS)"),
  "LA County Registrar-Recorder/County Clerk": L("LA County Registrar-Recorder/County Clerk", "Registrador-Grabador/Secretario del Condado de LA", "LA County Registrar-Recorder/County Clerk (ԼԱ շրջանի գրանցման գրասենյակ)"),
  "California Department of Tax and Fee Administration (CDTFA)": L("California Department of Tax and Fee Administration (CDTFA)", "Departamento de Administración de Impuestos y Tarifas de California (CDTFA)", "Կալիֆոռնիայի հարկերի և վճարների վարչություն (CDTFA)"),
  "California Employment Development Department (EDD)": L("California Employment Development Department (EDD)", "Departamento de Desarrollo del Empleo de California (EDD)", "Կալիֆոռնիայի զբաղվածության զարգացման դեպարտամենտ (EDD)"),
  "LA County Public Health — Environmental Health": L("LA County Public Health — Environmental Health", "Salud Pública del Condado de LA — Salud Ambiental", "ԼԱ շրջանի հանրային առողջապահություն — Շրջակա միջավայրի առողջություն"),
  "California Department of Alcoholic Beverage Control (ABC)": L("California Department of Alcoholic Beverage Control (ABC)", "Departamento de Control de Bebidas Alcohólicas de California (ABC)", "Կալիֆոռնիայի ալկոհոլային խմիչքների վերահսկողության դեպարտամենտ (ABC)"),
  "California Board of Barbering and Cosmetology": L("California Board of Barbering and Cosmetology", "Junta de Barbería y Cosmetología de California", "Կալիֆոռնիայի վարսավիրության և կոսմետոլոգիայի խորհուրդ"),
  "California Bureau of Automotive Repair (BAR)": L("California Bureau of Automotive Repair (BAR)", "Oficina de Reparación Automotriz de California (BAR)", "Կալիֆոռնիայի ավտովերանորոգման բյուրո (BAR)"),
  "California Department of Social Services — Community Care Licensing": L(
    "California Department of Social Services — Community Care Licensing",
    "Departamento de Servicios Sociales de California — Licencias de Cuidado Comunitario",
    "Կալիֆոռնիայի սոցիալական ծառայությունների դեպարտամենտ — Համայնքային խնամքի լիցենզավորում",
  ),
};

/** Localized agency name for RoadmapStep.agency. Falls back to the English name. */
export function localizeAgency(agency: string, locale: Locale): string {
  const hit = AGENCY_TEXT[agency];
  return hit ? t(hit, locale) : agency;
}

// ---------------- hazard details ----------------

const HAZARD_DETAIL_TEXT: Record<string, LocalizedText> = {
  // CAL FIRE FHSZ classes
  NonWildland: L("Non-wildland (no mapped fire zone)", "No forestal (sin zona de incendio asignada)", "Ոչ անտառային (առանց քարտեզագրված հրդեհային գոտու)"),
  Moderate: L("Moderate", "Moderado", "Չափավոր"),
  High: L("High", "Alto", "Բարձր"),
  "Very High": L("Very High", "Muy alto", "Շատ բարձր"),
  // CGS seismic layers
  "Earthquake fault zone": L("Earthquake fault zone", "Zona de falla sísmica", "Երկրաշարժի խզվածքի գոտի"),
  "Liquefaction zone": L("Liquefaction zone", "Zona de licuefacción", "Հողի հեղուկացման գոտի"),
  "Earthquake-induced landslide zone": L("Earthquake-induced landslide zone", "Zona de deslizamiento por sismo", "Երկրաշարժից առաջացած սողանքի գոտի"),
};

const FLOOD_SUBTYPE: Record<string, LocalizedText> = {
  "area of minimal flood hazard": L("area of minimal flood hazard", "área de riesgo mínimo de inundación", "ջրհեղեղի նվազագույն վտանգի տարածք"),
  "0.2 pct annual chance flood hazard": L("0.2% annual chance flood hazard", "riesgo de inundación con 0.2% de probabilidad anual", "ջրհեղեղի 0.2% տարեկան հավանականությամբ վտանգ"),
  floodway: L("floodway", "cauce de inundación", "ջրհեղեղի հուն"),
};

function localizeOneDetail(d: string, locale: Locale): string {
  const hit = HAZARD_DETAIL_TEXT[d];
  if (hit) return t(hit, locale);
  const m = d.match(/^Zone (\S+)(?: \((.+)\))?$/);
  if (m) {
    const zoneWord = locale === "es" ? "Zona" : locale === "hy" ? "Գոտի" : "Zone";
    const sub = m[2] ? FLOOD_SUBTYPE[m[2].toLowerCase()] : undefined;
    const subText = m[2] ? (sub ? t(sub, locale) : m[2]) : undefined;
    return `${zoneWord} ${m[1]}${subText ? ` (${subText})` : ""}`;
  }
  return d;
}

/** Localize Hazard.detail ("Very High", "Zone X (area of minimal flood hazard)", "Liquefaction zone; …"). Unknown parts stay English. */
export function localizeHazardDetail(detail: string | undefined, locale: Locale): string | undefined {
  if (detail === undefined) return undefined;
  return detail
    .split("; ")
    .map((p) => localizeOneDetail(p, locale))
    .join("; ");
}

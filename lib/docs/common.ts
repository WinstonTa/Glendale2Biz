import type { Locale, LocalizedText, VerdictStatus } from "@/lib/contracts";
import { getBusinessType } from "@/lib/rules";
import type { BusinessStructure, DocInput } from "./types";

export const L = (en: string, es: string, hy: string): LocalizedText => ({ en, es, hy });
/** same raw value in every language (names, addresses, codes) */
export const same = (v: string): LocalizedText => ({ en: v, es: v, hy: v });

export const DOC_BANNER = L(
  "Draft for your preparation only. Not legal advice and not an official form. Review with the agency or a licensed professional before filing.",
  "Borrador solo para su preparación. No es asesoría legal ni un formulario oficial. Revíselo con la agencia o con un profesional autorizado antes de presentarlo.",
  "Սևագիր՝ միայն ձեր նախապատրաստման համար։ Սա իրավաբանական խորհուրդ կամ պաշտոնական ձև չէ։ Ներկայացնելուց առաջ վերանայեք գերատեսչության կամ լիցենզավորված մասնագետի հետ։",
);

export const TO_FILL = L("[to fill in]", "[por completar]", "[լրացնել]");

export const STRUCTURE_LABEL: Record<BusinessStructure, LocalizedText> = {
  sole_proprietor: L("Individual (sole proprietor)", "Individual (empresa unipersonal)", "Անհատ (անհատ ձեռնարկատեր)"),
  partnership: L("General partnership", "Sociedad colectiva", "Լիակատար ընկերակցություն"),
  llc: L("Limited liability company (LLC)", "Compañía de responsabilidad limitada (LLC)", "Սահմանափակ պատասխանատվությամբ ընկերություն (LLC)"),
  corporation: L("Corporation", "Corporación", "Կորպորացիա"),
};

export const VERDICT_LABEL: Record<VerdictStatus, LocalizedText> = {
  allowed: L("Likely allowed", "Probablemente permitido", "Հավանաբար թույլատրված է"),
  conditional: L("Allowed with a permit (e.g. a CUP)", "Permitido con un permiso (p. ej. un CUP)", "Թույլատրված է թույլտվությամբ (օր.՝ CUP)"),
  not_allowed: L("Likely not allowed", "Probablemente no permitido", "Հավանաբար թույլատրված չէ"),
  unknown: L("Could not be determined", "No se pudo determinar", "Հնարավոր չեղավ որոշել"),
};

/** value or a localized "[to fill in]" placeholder */
export function valueOr(v: string): { value: LocalizedText; missing?: boolean } {
  return v.trim() ? { value: same(v.trim()) } : { value: TO_FILL, missing: true };
}

export function businessName(input: DocInput): LocalizedText {
  const b = getBusinessType(input.businessTypeId);
  return b ? b.name : same(input.businessTypeId);
}

/** Address of the business: matched site address, else what the founder typed. */
export function businessAddress(input: DocInput): string {
  if (input.locationMode === "address" && input.site) return input.site.address.matched;
  return input.form.mailingAddress.trim();
}

export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  const tag = locale === "hy" ? "hy-AM" : locale === "es" ? "es-US" : "en-US";
  try {
    return new Intl.DateTimeFormat(tag, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

export function localizedDate(iso: string): LocalizedText {
  return { en: formatDate(iso, "en"), es: formatDate(iso, "es"), hy: formatDate(iso, "hy") };
}

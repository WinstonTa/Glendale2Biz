import type { Locale, LocalizedText } from "../contracts";

/** Build a LocalizedText from three strings (en, es, hy). */
export function L(en: string, es: string, hy: string): LocalizedText {
  return { en, es, hy };
}

/** Pick the string for a locale; falls back to English if the locale string is empty. */
export function t(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] || text.en;
}

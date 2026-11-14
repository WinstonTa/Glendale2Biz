/**
 * Document prep (Phase 3, LegalTech). Pure functions: input → { title, sections } with LocalizedText.
 * No network, no storage. Client-safe.
 */
import type { Locale } from "@/lib/contracts";
import type { DocInput, GeneratedDoc } from "./types";
import { buildFbnWorksheet } from "./fbn";
import { buildZoningInquiry } from "./zoningInquiry";
import { buildLaunchSummary } from "./launchSummary";
import { DOC_BANNER } from "./common";

export * from "./types";
export { DOC_BANNER, STRUCTURE_LABEL, VERDICT_LABEL } from "./common";
export { buildFbnWorksheet, FBN_URL } from "./fbn";
export { buildZoningInquiry, GLENDALE_PLANNING_URL } from "./zoningInquiry";
export { buildLaunchSummary } from "./launchSummary";

/** All three documents, in display order. The zoning inquiry only makes sense with a site or home address, but is always generated (with placeholders). */
export function generateDocuments(input: DocInput): GeneratedDoc[] {
  return [buildZoningInquiry(input), buildFbnWorksheet(input), buildLaunchSummary(input)];
}

/** Plain-text rendering for "Copy text". */
export function docToText(doc: GeneratedDoc, locale: Locale): string {
  const tx = (t: { en: string; es: string; hy: string }) => t[locale] || t.en;
  const out: string[] = [tx(doc.title).toUpperCase(), tx(doc.subtitle), "", `⚠ ${tx(DOC_BANNER)}`, ""];
  for (const s of doc.sections) {
    out.push(tx(s.heading), "-".repeat(Math.min(40, tx(s.heading).length)));
    for (const f of s.fields ?? []) out.push(`${tx(f.label)}: ${tx(f.value)}`);
    for (const p of s.paragraphs ?? []) out.push(tx(p), "");
    for (const b of s.bullets ?? []) out.push(`• ${tx(b)}`);
    for (const c of s.checklist ?? []) out.push(`[ ] ${tx(c)}`);
    for (const l of s.links ?? []) out.push(`${tx(l.label)}: ${l.url}`);
    out.push("");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

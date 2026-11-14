import type { LocalizedText, LocationMode, Roadmap, SiteCheckResponse } from "@/lib/contracts";

export type BusinessStructure = "sole_proprietor" | "partnership" | "llc" | "corporation";

/** What the founder typed into the "Prepare my documents" form. */
export interface DocFormInput {
  businessName: string;
  ownerNames: string;
  structure: BusinessStructure;
  /** yyyy-mm-dd or "" */
  startDate: string;
  email: string;
  phone: string;
  /** used when there is no site check (home-based or not decided) */
  mailingAddress: string;
}

/** Everything a document template needs. Pure data; no network. */
export interface DocInput {
  form: DocFormInput;
  businessTypeId: string;
  locationMode: LocationMode;
  site?: SiteCheckResponse | null;
  roadmap?: Roadmap | null;
  /** ISO date used for "prepared on"; pass a fixed value in tests */
  today: string;
}

export interface DocField {
  label: LocalizedText;
  value: LocalizedText;
  /** true when the founder still has to fill this in */
  missing?: boolean;
}

export interface DocSection {
  heading: LocalizedText;
  fields?: DocField[];
  paragraphs?: LocalizedText[];
  bullets?: LocalizedText[];
  checklist?: LocalizedText[];
  links?: { label: LocalizedText; url: string }[];
}

export type DocId = "fbn" | "zoning_inquiry" | "launch_summary";

export interface GeneratedDoc {
  id: DocId;
  title: LocalizedText;
  subtitle: LocalizedText;
  sections: DocSection[];
}

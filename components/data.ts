// Single seam for backend modules used by the UI.
export { BUSINESS_TYPES, getBusinessType, matchBusinessType, buildRoadmap } from "@/lib/rules";
import { DEMO_ADDRESSES as RAW_DEMO } from "@/lib/gis/demo";
import type { LocalizedText } from "@/lib/contracts";

export interface DemoAddress {
  address: string;
  label?: LocalizedText | string;
}

/** Normalize DEMO_ADDRESSES whether backend ships strings or objects. */
export const DEMO_ADDRESSES: DemoAddress[] = (RAW_DEMO as readonly unknown[]).map((a) =>
  typeof a === "string" ? { address: a } : (a as DemoAddress),
);

// Single seam for backend modules used by the UI. Swap stubs → real imports here only.
export { BUSINESS_TYPES, getBusinessType, matchBusinessType, buildRoadmap } from "./_stubs";
import { DEMO_ADDRESSES as RAW_DEMO } from "./_stubs";
import type { LocalizedText } from "@/lib/contracts";

export interface DemoAddress {
  address: string;
  label?: LocalizedText | string;
}

/** Normalize DEMO_ADDRESSES whether backend ships strings or objects. */
export const DEMO_ADDRESSES: DemoAddress[] = (RAW_DEMO as unknown[]).map((a) =>
  typeof a === "string" ? { address: a } : (a as DemoAddress),
);

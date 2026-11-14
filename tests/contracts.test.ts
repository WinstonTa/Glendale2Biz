import { describe, expect, it } from "vitest";
import { LOCALES, ROADMAP_PHASES } from "@/lib/contracts";

describe("contracts", () => {
  it("exposes the three locales", () => {
    expect([...LOCALES]).toEqual(["en", "es", "hy"]);
  });
  it("exposes the four roadmap phases in order", () => {
    expect([...ROADMAP_PHASES]).toEqual(["plan", "register", "permit", "open"]);
  });
});

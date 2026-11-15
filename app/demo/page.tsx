import type { Metadata } from "next";
import { Wizard } from "@/components/Wizard";

export const metadata: Metadata = {
  title: "Glendale2Biz — Demo",
  description: "Check a Glendale address for your business idea and get your launch roadmap.",
};

export default function DemoPage() {
  return <Wizard />;
}

import type { Metadata } from "next";
import "./globals.css";

// Scaffold by architect — frontend-dev owns this file from here on.
export const metadata: Metadata = {
  title: "Glendale2Biz",
  description: "From idea to open doors: check your Glendale address and get your launch roadmap.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

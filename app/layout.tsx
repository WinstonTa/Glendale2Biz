import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans, Noto_Sans_Armenian } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--nf-display", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], variable: "--nf-body", display: "swap" });
const armenian = Noto_Sans_Armenian({ subsets: ["armenian"], variable: "--nf-armenian", display: "swap" });

export const metadata: Metadata = {
  title: "Glendale2Biz",
  description: "From idea to open doors: check your Glendale address and get your launch roadmap.",
};

const LANG_BOOT = `try{var l=localStorage.getItem("g2b.locale");if(l==="es"||l==="hy")document.documentElement.lang=l}catch(e){}`;

export const viewport: Viewport = { themeColor: "#0d4f40" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${armenian.variable}`}
    >
      <head>
        {/* set <html lang> from the saved locale before paint */}
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
      </head>
      <body>
        <LocaleProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}

"use client";

import { LOCALES } from "@/lib/contracts";
import { LOCALE_SHORT, DICTS, useT } from "@/lib/i18n";

export function Gem({ className = "" }: { className?: string }) {
  // faceted jewel mark
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <polygon points="8,4 24,4 30,12 16,29 2,12" fill="var(--color-jade)" />
      <polygon points="8,4 24,4 20,12 12,12" fill="var(--color-jade-bright)" />
      <polygon points="2,12 12,12 16,29" fill="var(--color-jade-deep)" />
      <polygon points="30,12 20,12 16,29" fill="var(--color-sapphire)" />
      <polygon points="12,12 20,12 16,29" fill="var(--color-jade)" />
    </svg>
  );
}

export function SiteHeader() {
  const { locale, setLocale, d } = useT();
  return (
    <header className="site-header no-print">
      <a href="#main" className="skip-link">
        {d.skipToContent}
      </a>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2 rounded-md" aria-label="Glendale2Biz">
          <Gem className="h-8 w-8 shrink-0" />
          <span className="wordmark">
            Glendale<span className="wordmark-two">2</span>Biz
          </span>
        </a>
        <div role="group" aria-label={d.switcherLabel} className="lang-switch">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={locale === l}
              title={DICTS[l].langName}
              onClick={() => setLocale(l)}
              className="lang-btn"
            >
              {LOCALE_SHORT[l]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { d } = useT();
  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-5xl space-y-1 px-4 py-6 text-sm sm:px-6">
        <p>{d.footerLegal}</p>
        <p>{d.footerTranslation}</p>
        <p className="opacity-75">{d.footerData}</p>
      </div>
    </footer>
  );
}

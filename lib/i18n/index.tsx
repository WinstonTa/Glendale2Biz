"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale, LocalizedText } from "@/lib/contracts";
import { en, type Dict } from "./en";
import { es } from "./es";
import { hy } from "./hy";

export const DICTS: Record<Locale, Dict> = { en, es, hy };
export const LOCALE_SHORT: Record<Locale, string> = { en: "EN", es: "ES", hy: "ՀԱՅ" };
const STORAGE_KEY = "g2b.locale";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  d: Dict;
  /** localize backend LocalizedText, falling back to English */
  lt: (text: LocalizedText | null | undefined) => string;
  /** fill "{name}" placeholders */
  fmt: (s: string, vars: Record<string, string | number>) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "es" || v === "hy";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      setLocale,
      d: DICTS[locale],
      lt: (text) => (text ? text[locale] || text.en : ""),
      fmt: (s, vars) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")),
    }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): LocaleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useT must be used inside <LocaleProvider>");
  return c;
}

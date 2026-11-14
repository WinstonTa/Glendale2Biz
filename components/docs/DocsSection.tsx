"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { LocationMode, Roadmap, SiteCheckResponse } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import {
  DOC_BANNER,
  VERDICT_LABEL,
  docToText,
  generateDocuments,
  type BusinessStructure,
  type DocFormInput,
  type DocId,
  type GeneratedDoc,
} from "@/lib/docs";
import { getBusinessType } from "../data";

const STORAGE_KEY = "g2b.docs.form";
const STRUCTURES: BusinessStructure[] = ["sole_proprietor", "partnership", "llc", "corporation"];
const EMPTY: DocFormInput = {
  businessName: "",
  ownerNames: "",
  structure: "sole_proprietor",
  startDate: "",
  email: "",
  phone: "",
  mailingAddress: "",
};

function loadForm(): DocFormInput {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const v = JSON.parse(raw) as Partial<DocFormInput>;
    const out = { ...EMPTY };
    for (const k of Object.keys(EMPTY) as (keyof DocFormInput)[]) {
      if (typeof v[k] === "string") (out[k] as string) = v[k] as string;
    }
    if (!STRUCTURES.includes(out.structure)) out.structure = "sole_proprietor";
    return out;
  } catch {
    return EMPTY;
  }
}

function TextField({
  label,
  hint,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const hintId = useId();
  return (
    <div>
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        type={type}
        className="field mt-1"
        value={value}
        autoComplete={autoComplete}
        aria-describedby={hint ? hintId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DocPage({ doc }: { doc: GeneratedDoc }) {
  const { d, lt } = useT();
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const { locale } = useT();

  useEffect(() => setCopyState("idle"), [doc.id, locale]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(docToText(doc, locale));
      setCopyState("ok");
    } catch {
      setCopyState("fail");
    }
  }

  function printDoc() {
    const root = document.documentElement;
    root.dataset.print = "doc";
    const reset = () => {
      delete root.dataset.print;
      window.removeEventListener("afterprint", reset);
    };
    window.addEventListener("afterprint", reset);
    window.print();
  }

  const hasMissing = doc.sections.some((s) => s.fields?.some((f) => f.missing));

  return (
    <article className="doc-page print-plain rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-8" aria-labelledby={`doc-${doc.id}`}>
      <div className="no-print mb-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={printDoc}>
          <span aria-hidden="true">🖨️</span>
          {d.docs.print}
        </button>
        <button type="button" className="btn btn-ghost" onClick={copy}>
          {copyState === "ok" ? d.docs.copied : d.docs.copy}
        </button>
        <span className="sr-only" aria-live="polite">
          {copyState === "ok" ? d.docs.copied : copyState === "fail" ? d.docs.copyFailed : ""}
        </span>
        {copyState === "fail" ? <p className="w-full text-sm font-semibold text-ruby">{d.docs.copyFailed}</p> : null}
      </div>

      <p className="rounded-lg border-2 border-topaz bg-topaz-wash px-3 py-2 text-sm font-semibold text-topaz-deep" role="note">
        <span aria-hidden="true">⚠ </span>
        {lt(DOC_BANNER)}
      </p>

      <header className="mt-5 border-b-2 border-jade-deep pb-3">
        <h3 id={`doc-${doc.id}`} className="text-2xl font-extrabold text-jade-deep sm:text-3xl">
          {lt(doc.title)}
        </h3>
        <p className="mt-1 text-ink-soft">{lt(doc.subtitle)}</p>
      </header>

      {hasMissing ? <p className="no-print mt-3 text-sm text-ink-soft">{d.docs.toFillNote}</p> : null}

      <div className="mt-4 space-y-6">
        {doc.sections.map((s, i) => (
          <section key={i} className="roadmap-step">
            <h4 className="text-lg font-bold text-sapphire-deep">{lt(s.heading)}</h4>
            {s.fields?.length ? (
              <dl className="mt-2 divide-y divide-line border-y border-line">
                {s.fields.map((f, j) => (
                  <div key={j} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                    <dt className="text-sm font-semibold text-ink-soft">{lt(f.label)}</dt>
                    <dd className={f.missing ? "rounded bg-topaz-wash px-1 font-semibold text-topaz-deep" : "font-medium"}>
                      {lt(f.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {s.paragraphs?.map((p, j) => (
              <p key={j} className="mt-2">
                {lt(p)}
              </p>
            ))}
            {s.bullets?.length ? (
              <ol className="mt-2 list-decimal space-y-1.5 pl-6">
                {s.bullets.map((b, j) => (
                  <li key={j}>{lt(b)}</li>
                ))}
              </ol>
            ) : null}
            {s.checklist?.length ? (
              <ul className="mt-2 space-y-1.5">
                {s.checklist.map((c, j) => (
                  <li key={j} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1 inline-block h-4 w-4 shrink-0 rounded-sm border-2 border-jade-deep" />
                    <span>{lt(c)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {s.links?.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                data-print-url
                className="mt-2 inline-flex items-center gap-1 font-bold text-sapphire underline decoration-2 underline-offset-4"
              >
                {lt(l.label)}
                <span aria-hidden="true">↗</span>
                <span className="sr-only">{d.opensNewTab}</span>
              </a>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

export function DocsSection({
  businessTypeId,
  locationMode,
  site,
  roadmap,
}: {
  businessTypeId: string;
  locationMode: LocationMode;
  site: SiteCheckResponse | null;
  roadmap: Roadmap | null;
}) {
  const { d, lt } = useT();
  const [form, setForm] = useState<DocFormInput>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<DocId>("zoning_inquiry");

  useEffect(() => {
    setForm(loadForm());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* storage unavailable */
    }
  }, [form, loaded]);

  const set = <K extends keyof DocFormInput>(k: K) => (v: DocFormInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const docs = useMemo(
    () => generateDocuments({ form, businessTypeId, locationMode, site, roadmap, today }),
    [form, businessTypeId, locationMode, site, roadmap, today],
  );
  const doc = docs.find((x) => x.id === active) ?? docs[0];
  const business = getBusinessType(businessTypeId);
  const hasSite = locationMode === "address" && !!site;

  return (
    <section id="documents" aria-labelledby="docs-title" className="docs-section scroll-mt-20 space-y-5">
      <div className="no-print">
        <h2 id="docs-title" className="text-3xl font-extrabold text-jade-deep">
          {d.docs.title}
        </h2>
        <p className="mt-1 max-w-[65ch] text-ink-soft">{d.docs.help}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <form className="no-print space-y-4 self-start rounded-2xl border border-line bg-card p-5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <p className="text-sm font-semibold text-ink-soft">{d.docs.prefilled}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5 text-sm">
              {business ? (
                <li className="rounded-full bg-jade-wash px-2.5 py-1 font-semibold text-jade-deep">
                  <span aria-hidden="true">{business.icon} </span>
                  {lt(business.name)}
                </li>
              ) : null}
              {hasSite && site ? (
                <>
                  <li className="rounded-full bg-jade-wash px-2.5 py-1 font-semibold text-jade-deep">{site.address.matched}</li>
                  {site.zoning.code ? (
                    <li className="rounded-full bg-sapphire px-2.5 py-1 font-semibold text-white">{site.zoning.code}</li>
                  ) : null}
                  <li className="rounded-full bg-paper-deep px-2.5 py-1 font-semibold">{lt(VERDICT_LABEL[site.verdict.status])}</li>
                </>
              ) : null}
            </ul>
          </div>

          <TextField label={d.docs.businessName} hint={d.docs.businessNameHint} value={form.businessName} onChange={set("businessName")} autoComplete="organization" />
          <TextField label={d.docs.owners} hint={d.docs.ownersHint} value={form.ownerNames} onChange={set("ownerNames")} autoComplete="name" />

          <fieldset>
            <legend className="font-semibold">{d.docs.structure}</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {STRUCTURES.map((s) => (
                <label
                  key={s}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] px-3 py-2 text-sm font-semibold ${form.structure === s ? "border-jade bg-jade-wash" : "border-line bg-card"}`}
                >
                  <input
                    type="radio"
                    name="structure"
                    value={s}
                    checked={form.structure === s}
                    onChange={() => set("structure")(s)}
                    className="accent-[var(--color-jade)]"
                  />
                  {d.docs.structures[s]}
                </label>
              ))}
            </div>
          </fieldset>

          {!hasSite ? (
            <TextField label={d.docs.address} hint={d.docs.addressHint} value={form.mailingAddress} onChange={set("mailingAddress")} autoComplete="street-address" />
          ) : null}
          <TextField label={d.docs.startDate} type="date" value={form.startDate} onChange={set("startDate")} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <TextField label={d.docs.email} type="email" value={form.email} onChange={set("email")} autoComplete="email" />
            <TextField label={d.docs.phone} type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm text-ink-soft">
            <span>
              <span aria-hidden="true">🔒 </span>
              {d.docs.savedLocally}
            </span>
            <button type="button" className="font-semibold text-sapphire underline underline-offset-4" onClick={() => setForm(EMPTY)}>
              {d.docs.clear}
            </button>
          </div>
        </form>

        <div className="min-w-0 space-y-4">
          <div role="group" aria-label={d.docs.chooseDoc} className="no-print flex flex-wrap gap-2">
            {docs.map((x) => (
              <button key={x.id} type="button" className="chip" aria-pressed={active === x.id} onClick={() => setActive(x.id)}>
                {lt(x.title)}
              </button>
            ))}
          </div>
          <DocPage doc={doc} />
        </div>
      </div>
    </section>
  );
}

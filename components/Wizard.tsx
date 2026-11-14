"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiError, ApiErrorCode, LocationMode, SiteCheckResponse } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import { BusinessPicker } from "./BusinessPicker";
import { LocationStep } from "./LocationStep";
import { SiteResults, type SiteState } from "./Results";
import { RoadmapView } from "./RoadmapView";
import { DocsSection } from "./docs/DocsSection";
import { buildRoadmap, getBusinessType } from "./data";

type Step = 1 | 2 | 3;
const KNOWN_CODES: ApiErrorCode[] = ["ADDRESS_NOT_FOUND", "OUTSIDE_GLENDALE", "AMBIGUOUS_ADDRESS", "GIS_UNAVAILABLE", "BAD_REQUEST"];

function Facets() {
  return (
    <svg viewBox="0 0 200 200" className="hero-facets" aria-hidden="true">
      <polygon points="50,15 150,15 190,75 100,190 10,75" fill="none" stroke="#fff" strokeWidth="2" />
      <polyline points="10,75 190,75" fill="none" stroke="#fff" strokeWidth="2" />
      <polyline points="50,15 75,75 100,190 125,75 150,15" fill="none" stroke="#fff" strokeWidth="2" />
      <polyline points="75,75 100,15 125,75" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function Wizard() {
  const { d, locale, lt, fmt } = useT();
  const [step, setStep] = useState<Step>(1);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [mode, setMode] = useState<LocationMode>("address");
  const [address, setAddress] = useState("");
  const [showRequired, setShowRequired] = useState(false);
  const [site, setSite] = useState<SiteState>({ status: "idle" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reqSeq = useRef(0);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const business = businessId ? getBusinessType(businessId) : undefined;

  async function runCheck(addr: string) {
    const seq = ++reqSeq.current;
    setSite({ status: "loading" });
    try {
      const res = await fetch("/api/site-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: addr, businessTypeId: businessId, locale }),
      });
      const json = (await res.json().catch(() => null)) as SiteCheckResponse | ApiError | null;
      if (seq !== reqSeq.current) return;
      if (res.ok && json && "verdict" in json) {
        setSite({ status: "ok", data: json });
      } else {
        const err = json && "error" in json ? json.error : null;
        const code = err && KNOWN_CODES.includes(err.code) ? err.code : res.status >= 500 ? "GIS_UNAVAILABLE" : "NETWORK";
        setSite({ status: "error", code, candidates: err?.candidates });
      }
    } catch {
      if (seq === reqSeq.current) setSite({ status: "error", code: "NETWORK" });
    }
  }

  function submitLocation(m: LocationMode, addr: string) {
    if (m === "address") {
      if (!addr.trim()) {
        setShowRequired(true);
        return;
      }
      setShowRequired(false);
      setMode("address");
      setAddress(addr);
      setStep(3);
      void runCheck(addr.trim());
    } else {
      setShowRequired(false);
      setMode(m);
      reqSeq.current++;
      setSite({ status: "idle" });
      setStep(3);
    }
  }

  const siteData = site.status === "ok" ? site.data : null;
  const roadmap = useMemo(() => {
    if (!businessId || step !== 3) return null;
    if (mode === "address" && site.status !== "ok") return null;
    try {
      return buildRoadmap({ businessTypeId: businessId, locationMode: mode, site: siteData });
    } catch {
      return null;
    }
  }, [businessId, mode, site.status, siteData, step]);

  const stepTitles = [d.steps.business, d.steps.location, d.steps.results];
  const heading = step === 1 ? d.pickTitle : step === 2 ? d.whereTitle : d.steps.results;

  return (
    <>
      {step === 1 ? (
        <section className="hero no-print">
          <Facets />
          <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
            <p className="font-semibold text-topaz">{d.tagline}</p>
            <h1 className="mt-2 max-w-[18ch] text-4xl font-extrabold sm:text-6xl">{d.heroTitle}</h1>
            <p className="mt-4 max-w-[60ch] text-lg text-white/85">{d.heroBody}</p>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <nav aria-label={fmt(d.stepOf, { n: step })} className="no-print">
          <ol className="stepper flex items-center gap-2 text-sm font-semibold">
            {stepTitles.map((title, i) => {
              const n = (i + 1) as Step;
              const state = n === step ? "current" : n < step ? "done" : "todo";
              const canGo = n < step;
              const content = (
                <>
                  <span className="stepper-dot inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper-deep font-display">
                    {state === "done" ? "✓" : n}
                  </span>
                  <span className={state === "todo" ? "text-ink-soft" : ""}>{title}</span>
                </>
              );
              return (
                <li key={n} data-state={state} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
                  {canGo ? (
                    <button type="button" className="flex items-center gap-2 rounded-full pr-2" onClick={() => setStep(n)}>
                      {content}
                    </button>
                  ) : (
                    <span className="flex items-center gap-2">{content}</span>
                  )}
                  {n < 3 ? <span className="h-px w-5 bg-line sm:w-10" aria-hidden="true" /> : null}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-6">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className={`text-3xl font-extrabold outline-none sm:text-4xl ${step === 3 ? "sr-only" : ""}`}
          >
            {heading}
          </h2>
          {step === 1 ? <p className="mt-1 text-ink-soft">{d.pickHelp}</p> : null}
          {step === 2 && business ? (
            <p className="mt-1 text-ink-soft">
              <span aria-hidden="true">{business.icon} </span>
              {lt(business.name)}
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          {step === 1 ? (
            <>
              <BusinessPicker value={businessId} onChange={setBusinessId} />
              <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
                <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={!businessId} onClick={() => setStep(2)}>
                  {d.continue}
                </button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <LocationStep
                mode={mode}
                address={address}
                onMode={setMode}
                onAddress={setAddress}
                onSubmit={submitLocation}
                showRequired={showRequired}
              />
              <button type="button" className="btn btn-ghost mt-6" onClick={() => setStep(1)}>
                {d.back}
              </button>
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-10">
              <div className="no-print-doc flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="text-sm font-semibold text-ink-soft">{d.resultsFor}</p>
                  <p className="font-display text-xl font-extrabold [overflow-wrap:anywhere] sm:text-2xl">
                    {business ? (
                      <>
                        <span aria-hidden="true">{business.icon} </span>
                        {lt(business.name)}
                      </>
                    ) : null}
                    {mode === "address" && address ? <span className="text-ink-soft"> / {address}</span> : null}
                  </p>
                </div>
                <div className="no-print flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                    {d.editLocation}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      reqSeq.current++;
                      setSite({ status: "idle" });
                      setAddress("");
                      setMode("address");
                      setStep(1);
                    }}
                  >
                    {d.changeAnswers}
                  </button>
                </div>
              </div>

              <div className="no-print-doc">
              {mode === "address" ? (
                <SiteResults
                  state={site}
                  onRetry={() => void runCheck(address.trim())}
                  onEditLocation={() => setStep(2)}
                  onPickCandidate={(c) => {
                    setAddress(c);
                    void runCheck(c);
                  }}
                />
              ) : (
                <p className="rounded-2xl border border-sapphire bg-sapphire-wash p-4 font-medium text-sapphire-deep">
                  {mode === "home" ? d.homeModeNote : d.undecidedNote}
                </p>
              )}
              </div>

              {roadmap ? (
                <div className="no-print-doc">
                  <RoadmapView roadmap={roadmap} storageKey={`g2b.roadmap.${businessId}.${mode}`} />
                </div>
              ) : null}

              {roadmap && businessId ? (
                <DocsSection businessTypeId={businessId} locationMode={mode} site={siteData} roadmap={roadmap} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

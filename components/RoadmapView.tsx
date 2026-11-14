"use client";

import { useEffect, useMemo, useState } from "react";
import { ROADMAP_PHASES, type Roadmap } from "@/lib/contracts";
import { useT } from "@/lib/i18n";

const PHASE_COLOR: Record<string, string> = {
  plan: "var(--color-sapphire)",
  register: "var(--color-jade)",
  permit: "var(--color-topaz)",
  open: "var(--color-ruby)",
};

export function RoadmapView({ roadmap, storageKey }: { roadmap: Roadmap; storageKey: string }) {
  const { d, lt, fmt } = useT();
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setDone(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setDone(new Set());
    }
  }, [storageKey]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  const steps = useMemo(() => [...roadmap.steps].sort((a, b) => a.order - b.order), [roadmap]);
  const total = steps.length;
  const doneCount = steps.filter((s) => done.has(s.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <section aria-labelledby="roadmap-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="roadmap-title" className="text-3xl font-extrabold text-jade-deep">
            {d.roadmapTitle}
          </h2>
          <p className="text-ink-soft no-print">{d.roadmapHelp}</p>
        </div>
        <button type="button" className="btn btn-ghost no-print" onClick={() => window.print()}>
          <span aria-hidden="true">🖨️</span>
          {d.print}
        </button>
      </div>

      <div>
        <div
          className="h-3 overflow-hidden rounded-full bg-paper-deep"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={doneCount}
          aria-label={fmt(d.progress, { done: doneCount, total })}
        >
          <div className="h-full rounded-full bg-jade transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-sm font-semibold text-ink-soft" aria-live="polite">
          {fmt(d.progress, { done: doneCount, total })}
        </p>
      </div>

      {total === 0 ? <p className="text-ink-soft">{d.roadmapEmpty}</p> : null}

      <ol className="space-y-8">
        {ROADMAP_PHASES.map((phase, pi) => {
          const items = steps.filter((s) => s.phase === phase);
          if (!items.length) return null;
          const color = PHASE_COLOR[phase];
          return (
            <li key={phase}>
              <h3 className="mb-3 flex items-center gap-3 text-xl font-extrabold">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full font-display text-white"
                  style={{ background: color, color: phase === "permit" ? "var(--color-ink)" : "#fff" }}
                  aria-hidden="true"
                >
                  {pi + 1}
                </span>
                {d.phase[phase]}
              </h3>
              <ul className="ml-4 space-y-3 border-l-[3px] pl-6" style={{ borderColor: color }}>
                {items.map((s) => {
                  const isDone = done.has(s.id);
                  const cbId = `step-${s.id}`;
                  return (
                    <li
                      key={s.id}
                      className={`roadmap-step print-plain relative rounded-2xl border bg-card p-4 ${isDone ? "border-jade-bright opacity-80" : "border-line"}`}
                    >
                      <span
                        className="absolute -left-[2.15rem] top-5 h-3.5 w-3.5 rotate-45 border-2 border-card"
                        style={{ background: isDone ? "var(--color-jade)" : color }}
                        aria-hidden="true"
                      />
                      <div className="flex items-start gap-3">
                        <input
                          id={cbId}
                          type="checkbox"
                          className="mt-1.5 h-5 w-5 shrink-0 accent-[var(--color-jade)]"
                          checked={isDone}
                          onChange={() => toggle(s.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <label htmlFor={cbId} className={`block text-lg font-bold leading-snug ${isDone ? "line-through decoration-2" : ""}`}>
                            {lt(s.title)}
                          </label>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {!s.verified ? (
                              <span className="rounded-full border border-topaz bg-topaz-wash px-2 py-0.5 text-xs font-bold text-topaz-deep">
                                {d.confirmWithAgency}
                              </span>
                            ) : null}
                            {!s.required ? (
                              <span className="rounded-full bg-slate-wash px-2 py-0.5 text-xs font-bold text-slate-j">{d.optional}</span>
                            ) : null}
                          </div>
                          <p className="mt-2">{lt(s.description)}</p>
                          <p className="mt-2 rounded-lg bg-sapphire-wash px-3 py-2 text-sm text-sapphire-deep">
                            <strong>{d.whyApplies}:</strong> {lt(s.appliesBecause)}
                          </p>
                          <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                            <div>
                              <dt className="inline font-semibold text-ink-soft">{d.agency}: </dt>
                              <dd className="inline">{s.agency}</dd>
                            </div>
                            {s.costEstimate ? (
                              <div>
                                <dt className="inline font-semibold text-ink-soft">{d.cost}: </dt>
                                <dd className="inline">{s.costEstimate}</dd>
                              </div>
                            ) : null}
                            {s.timeEstimate ? (
                              <div>
                                <dt className="inline font-semibold text-ink-soft">{d.time}: </dt>
                                <dd className="inline">{s.timeEstimate}</dd>
                              </div>
                            ) : null}
                          </dl>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-print-url
                            className="mt-3 inline-flex items-center gap-1 rounded font-bold text-sapphire underline decoration-2 underline-offset-4 hover:text-sapphire-deep"
                          >
                            {d.officialLink}
                            <span aria-hidden="true">↗</span>
                            <span className="sr-only">{d.opensNewTab}</span>
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

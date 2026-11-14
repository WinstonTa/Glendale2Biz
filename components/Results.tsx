"use client";

import dynamic from "next/dynamic";
import type { ApiErrorCode, HazardStatus, SiteCheckResponse, VerdictStatus } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import { DISCLAIMER } from "@/lib/rules";

const SiteMap = dynamic(() => import("./SiteMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});

export type SiteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: SiteCheckResponse }
  | { status: "error"; code: ApiErrorCode | "NETWORK"; candidates?: string[] };

const VERDICT_STYLE: Record<VerdictStatus, { fg: string; wash: string; deep: string; glyph: string }> = {
  allowed: { fg: "var(--color-jade)", wash: "var(--color-jade-wash)", deep: "var(--color-jade-deep)", glyph: "✓" },
  conditional: { fg: "var(--color-topaz)", wash: "var(--color-topaz-wash)", deep: "var(--color-topaz-deep)", glyph: "!" },
  not_allowed: { fg: "var(--color-ruby)", wash: "var(--color-ruby-wash)", deep: "var(--color-ruby-deep)", glyph: "✕" },
  unknown: { fg: "var(--color-slate-j)", wash: "var(--color-slate-wash)", deep: "var(--color-ink)", glyph: "?" },
};

const HAZARD_STYLE: Record<HazardStatus, string> = {
  in_zone: "bg-topaz-wash text-topaz-deep border-topaz",
  not_in_zone: "bg-jade-wash text-jade-deep border-jade-bright",
  unavailable: "bg-slate-wash text-slate-j border-line",
};

function formatDistance(m: number): string {
  const mi = m / 1609.344;
  return mi < 0.1 ? `${Math.round(m * 3.28084)} ft` : `${mi.toFixed(mi < 1 ? 2 : 1)} mi`;
}

export function VerdictGem({ status }: { status: VerdictStatus }) {
  const s = VERDICT_STYLE[status];
  return (
    <svg viewBox="0 0 64 64" className="verdict-gem h-20 w-20 shrink-0" aria-hidden="true">
      <polygon points="16,6 48,6 60,24 32,60 4,24" fill={s.fg} />
      <polygon points="16,6 48,6 40,24 24,24" fill="#fff" opacity="0.28" />
      <polygon points="4,24 24,24 32,60" fill="#000" opacity="0.14" />
      <polygon points="60,24 40,24 32,60" fill="#000" opacity="0.24" />
      <text x="32" y="38" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily="system-ui">
        {s.glyph}
      </text>
    </svg>
  );
}

export function DataBadge({ source }: { source: "live" | "mock" }) {
  const { d } = useT();
  if (source === "mock") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-topaz-deep bg-topaz-wash px-3 py-1 text-sm font-bold text-topaz-deep"
        title={d.demoDataHelp}
      >
        <span aria-hidden="true">◆</span>
        {d.demoData}
        <span className="sr-only">: {d.demoDataHelp}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-jade-wash px-3 py-1 text-sm font-semibold text-jade-deep">
      <span aria-hidden="true">●</span>
      {d.liveData}
    </span>
  );
}

export function SiteResults({
  state,
  onRetry,
  onPickCandidate,
  onEditLocation,
}: {
  state: SiteState;
  onRetry: () => void;
  onPickCandidate: (address: string) => void;
  onEditLocation: () => void;
}) {
  const { d, lt } = useT();

  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-4">
        <p className="font-semibold text-ink-soft">{d.checking}</p>
        <div className="skeleton h-36" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    const msg = d.errors[state.code] ?? d.errors.NETWORK;
    return (
      <div role="alert" className="rounded-2xl border-2 border-ruby bg-ruby-wash p-5 text-ruby-deep">
        <p className="font-semibold">{msg}</p>
        {state.candidates?.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {state.candidates.map((c) => (
              <li key={c}>
                <button type="button" className="chip text-ink" onClick={() => onPickCandidate(c)}>
                  <span aria-hidden="true">📍</span>
                  {c}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {state.code === "GIS_UNAVAILABLE" || state.code === "NETWORK" ? (
            <button type="button" className="btn btn-ghost bg-card" onClick={onRetry}>
              {d.retry}
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost bg-card" onClick={onEditLocation}>
            {d.editLocation}
          </button>
        </div>
      </div>
    );
  }

  const r = state.data;
  const v = VERDICT_STYLE[r.verdict.status];
  // the disclaimer is always shown below; drop it if the API also sent it as a note
  const notes = r.verdict.notes.filter((n) => n.en.trim() !== DISCLAIMER.en.trim());

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <DataBadge source={r.meta.dataSource} />
      </div>

      {/* Verdict */}
      <section
        aria-labelledby="verdict-title"
        className="print-plain rounded-3xl border-2 p-5 sm:p-6"
        style={{ borderColor: v.fg, background: v.wash }}
      >
        <div className="flex items-start gap-4">
          <VerdictGem status={r.verdict.status} />
          <div className="min-w-0">
            <h3 id="verdict-title" className="text-3xl font-extrabold sm:text-4xl" style={{ color: v.deep }}>
              {d.verdict[r.verdict.status]}
            </h3>
            <p className="mt-2 text-lg">{lt(r.verdict.summary)}</p>
          </div>
        </div>
        {notes.length ? (
          <ul className="mt-4 list-disc space-y-1 pl-5">
            {notes.map((n, i) => (
              <li key={i}>{lt(n)}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 border-t border-black/10 pt-3 text-sm font-medium">
          {d.disclaimer}
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Address + zoning */}
        <section className="print-plain space-y-4 rounded-2xl border border-line bg-card p-5">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-semibold text-ink-soft">{d.matchedAddress}</dt>
              <dd className="text-lg font-bold">{r.address.matched}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-ink-soft">{d.zoning}</dt>
              <dd className="flex flex-wrap items-baseline gap-2">
                {r.zoning.code ? (
                  <span className="rounded-md bg-sapphire px-2 py-0.5 font-display text-lg font-bold text-white">
                    {r.zoning.code}
                  </span>
                ) : null}
                <span className="font-semibold">{r.zoning.name ? lt(r.zoning.name) : d.zoneUnknown}</span>
              </dd>
            </div>
          </dl>
          <div className="no-print h-56 overflow-hidden rounded-2xl border border-line" role="region" aria-label={d.mapLabel}>
            <SiteMap lat={r.address.lat} lon={r.address.lon} label={r.address.matched} />
          </div>
        </section>

        {/* Hazards + nearby */}
        <section className="print-plain space-y-5 rounded-2xl border border-line bg-card p-5">
          <div>
            <h3 className="text-lg font-bold text-jade-deep">{d.hazardsTitle}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {r.hazards.map((h) => (
                <li
                  key={h.kind}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${HAZARD_STYLE[h.status]}`}
                >
                  <span aria-hidden="true">{h.status === "in_zone" ? "▲" : h.status === "not_in_zone" ? "✓" : "–"}</span>
                  {lt(h.label)}: {d.hazard[h.status]}
                  {h.detail && h.status === "in_zone" ? <span className="font-normal">({h.detail})</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-jade-deep">{d.nearbyTitle}</h3>
            {r.nearby.length ? (
              <ul className="mt-2 divide-y divide-line">
                {[...r.nearby]
                  .sort((a, b) => a.distanceM - b.distanceM)
                  .map((n, i) => (
                    <li key={`${n.kind}-${n.name}-${i}`} className="flex items-baseline justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug">{n.name}</span>
                        <span className="block text-sm text-ink-soft">{d.resource[n.kind] ?? n.kind}</span>
                      </span>
                      <span className="shrink-0 font-display font-bold text-sapphire">{formatDistance(n.distanceM)}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-2 text-ink-soft">{d.nearbyEmpty}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

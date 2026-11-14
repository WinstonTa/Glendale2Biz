"use client";

import { useId } from "react";
import type { LocationMode } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import { DEMO_ADDRESSES } from "./data";

export function LocationStep({
  mode,
  address,
  onMode,
  onAddress,
  onSubmit,
  showRequired,
}: {
  mode: LocationMode;
  address: string;
  onMode: (m: LocationMode) => void;
  onAddress: (a: string) => void;
  onSubmit: (mode: LocationMode, address: string) => void;
  showRequired: boolean;
}) {
  const { d, lt } = useT();
  const inputId = useId();
  const errId = useId();

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(mode, address);
      }}
    >
      <div className="rounded-2xl border border-line bg-card p-4">
        <label htmlFor={inputId} className="block font-semibold">
          {d.addressLabel}
        </label>
        <p className="text-sm text-ink-soft">{d.whereHelp}</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            type="text"
            inputMode="text"
            autoComplete="street-address"
            className="field"
            value={address}
            placeholder={d.addressPlaceholder}
            aria-invalid={showRequired || undefined}
            aria-describedby={showRequired ? errId : undefined}
            onChange={(e) => {
              onAddress(e.target.value);
              onMode("address");
            }}
          />
          <button type="submit" className="btn btn-primary shrink-0">
            {mode === "address" ? d.checkSite : d.buildPlan}
          </button>
        </div>
        {showRequired ? (
          <p id={errId} role="alert" className="mt-2 text-sm font-semibold text-ruby">
            {d.addressRequired}
          </p>
        ) : null}

        {DEMO_ADDRESSES.length ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-ink-soft">{d.tryDemo}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {DEMO_ADDRESSES.map((a) => (
                <li key={a.address}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      onAddress(a.address);
                      onMode("address");
                      onSubmit("address", a.address);
                    }}
                  >
                    <span aria-hidden="true">📍</span>
                    {a.address}
                    {a.label ? (
                      <span className="font-normal text-ink-soft">
                        ({typeof a.label === "string" ? a.label : lt(a.label)})
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-3 text-lg font-bold text-jade-deep">{d.orLabel}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              { m: "home" as const, icon: "🏠", title: d.modeHome, help: d.modeHomeHelp },
              { m: "undecided" as const, icon: "🧭", title: d.modeUndecided, help: d.modeUndecidedHelp },
            ]
          ).map((o) => (
            <button
              key={o.m}
              type="button"
              className="biz-card mode-card"
              aria-pressed={mode === o.m}
              onClick={() => {
                onMode(o.m);
                onSubmit(o.m, "");
              }}
            >
              <span className="text-3xl leading-none" aria-hidden="true">
                {o.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{o.title}</span>
                <span className="block text-sm text-ink-soft">{o.help}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}

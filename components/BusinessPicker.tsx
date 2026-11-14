"use client";

import { useId, useMemo, useState } from "react";
import type { BusinessType } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import { BUSINESS_TYPES, matchBusinessType } from "./data";

export function BusinessPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { d, lt } = useT();
  const [idea, setIdea] = useState("");
  const inputId = useId();
  const hintId = useId();

  const matches = useMemo(() => {
    if (idea.trim().length < 3) return new Set<string>();
    return new Set(matchBusinessType(idea).map((b) => b.id));
  }, [idea]);

  const groups: { key: string; title: string; items: BusinessType[] }[] = [
    { key: "store", title: d.groupStorefront, items: BUSINESS_TYPES.filter((b) => b.category !== "tech" && !b.flags.tech) },
    { key: "tech", title: d.groupTech, items: BUSINESS_TYPES.filter((b) => b.category === "tech" || b.flags.tech) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-card p-4">
        <label htmlFor={inputId} className="block font-semibold">
          {d.describeLabel}
        </label>
        <input
          id={inputId}
          type="text"
          className="field mt-2"
          value={idea}
          placeholder={d.describePlaceholder}
          aria-describedby={hintId}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const first = matchBusinessType(idea)[0];
              if (first) onChange(first.id);
            }
          }}
        />
        <p id={hintId} className="mt-2 text-sm text-ink-soft" aria-live="polite">
          {idea.trim().length >= 3 ? (matches.size ? d.describeMatches : d.describeNoMatch) : " "}
        </p>
      </div>

      {groups.map((g) =>
        g.items.length ? (
          <section key={g.key} aria-labelledby={`grp-${g.key}`}>
            <h3 id={`grp-${g.key}`} className="mb-3 text-lg font-bold text-jade-deep">
              {g.title}
            </h3>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.items.map((b) => {
                const isSel = value === b.id;
                const isMatch = matches.has(b.id);
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      className="biz-card"
                      aria-pressed={isSel}
                      data-match={isMatch && !isSel ? "true" : undefined}
                      onClick={() => onChange(b.id)}
                    >
                      <span className="text-3xl leading-none" aria-hidden="true">
                        {b.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold leading-snug">{lt(b.name)}</span>
                        <span className="block text-sm text-ink-soft">{lt(b.blurb)}</span>
                      </span>
                      {isSel ? (
                        <span className="rounded-full bg-jade px-2 py-0.5 text-xs font-bold text-white">{d.selected}</span>
                      ) : isMatch ? (
                        <span className="rounded-full bg-topaz px-2 py-0.5 text-xs font-bold text-ink">{d.match}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}

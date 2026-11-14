# Glendale2Biz — QA Report

Rounds are appended newest first. Severity: **P0** breaks the demo · **P1** visible bug · **P2** polish.

---

## Round 1b — 2026-11-14 ~16:00 PT (reviewed through `c494457`)

Commands were run on a clean `git archive` snapshot of `c494457`. Per the architect, `npm run build` was **not run**, because the shared `.next` folder would collide with the dev server.

| Command | Result |
| --- | --- |
| `npm test` | **PASS**: 7 files, **213 / 213** |
| `npm run typecheck` | **PASS** |

**Test changes**
- `tests/zoning.test.ts`: now asserts the disclaimer is **not** in `verdict.notes`, because the UI owns it after `fd57817`.
- `tests/site-check-handler.test.ts`: a non-demo address in mock mode now gives **409 `AMBIGUOUS_ADDRESS`** with every demo address as a candidate (`06c7cc9`), and each candidate resolves to 200 when resubmitted.
- New `tests/docs.test.ts` for `lib/docs`, covering every business type × home/undecided/3 demo sites × full/empty form:
  - `generateDocuments` returns zoning_inquiry, fbn and launch_summary;
  - every title, subtitle, heading, field, paragraph, bullet, checklist item and link label is non-empty in en/es/hy;
  - every link is `https` on a `.gov` host;
  - FBN links `FBN_URL` and the zoning inquiry links `GLENDALE_PLANNING_URL`;
  - `DOC_BANNER` says not legal advice / not an official form in all locales, and `docToText` includes it;
  - output is deterministic;
  - empty fields are flagged `missing` with localized placeholders.

**Round-1 bug status.** Fixes are pushed for all of these, but none is browser-verified yet. That comes in round 2.
- **P1-1:** `06c7cc9` (mock returns candidates) and `ebcfbfd` (warnings disclosure in the UI). Backend behavior is covered by tests.
- **P2-1:** `fd57817` and `3d76b9d`. The backend half is covered by tests.
- **P2-2:** `fd57817` (a/an).
- **P2-4:** `4aadf28` (docs sync).
- **P2-5:** `ebcfbfd` (early `html lang`).
- **Still open:** P2-3 (historical commit subjects, won't fix) and P2-6 (qa-owned config warning, cosmetic).

---

## Round 1 — 2026-11-14 ~15:50 PT (Phase 1, reviewed through `621d914`)

### Gate results (clean `git archive HEAD` snapshot at `621d914`, sharing the repo's `node_modules`, so other agents' uncommitted work is left out)

| Command | Result |
| --- | --- |
| `npm run build` | **PASS**: compiled, types valid. Routes: `/` static (24.7 kB), `/api/site-check` dynamic |
| `npm test` (`vitest run`) | **PASS**: 6 files, **204 / 204** tests |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** |
| `grep GLENDALE_GIS_MCP\|glendale-gis-mcp .next/static` | **0 hits**: no GIS URL or key name in the client bundle |

Earlier in the round, at `a1d5561` (before backend pushed `lib/gis` and the route): build passed, but `npm test` failed (1 test plus 2 suites that could not load) and `tsc` failed. That was expected while the modules were missing, and both cleared at `621d914`.

### Test suites added (qa-owned)
- `vitest.config.ts`: node environment, `@/` alias to the repo root, `tests/**/*.test.ts`, `GIS_MODE=mock`.
- `tests/contracts.test.ts`: `LOCALES` and `ROADMAP_PHASES`.
- `tests/rules.test.ts`:
  - `BUSINESS_TYPES`: unique ids; name and blurb non-empty in en/es/hy; lowercase keywords; all 6 flags present.
  - `getBusinessType`, `t`.
  - `matchBusinessType`: boba, coffee, café, cafe, salon and peluquería; gibberish returns `[]`.
  - `buildRoadmap`, for every type × 6 location inputs:
    - steps sorted by `order` and phases non-decreasing;
    - unique ids; valid phase; agency set;
    - **`https://` URL on a `.gov` host**;
    - title, description and appliesBecause non-empty in all 3 locales;
    - deterministic.
  - Conditional steps:
    - health permit for food types, and none for non-food types;
    - home-occupation step in home mode, and none for an allowed address;
    - CUP step for a conditional verdict, and none for an allowed one;
    - entity/EIN step for tech.
- `tests/zoning.test.ts`:
  - code normalization;
  - known codes map to a family and a localized name;
  - **unknown or null code gives `unknown`**;
  - every verdict carries `DISCLAIMER`, with the exact §7 text;
  - R1 rules: home-capable types are not `not_allowed`, storefront food is;
  - alcohol is never plain `allowed`;
  - `DEMO_ADDRESSES` cover allowed, conditional and not_allowed, and agree with `evaluateZoning`.
- `tests/site-check-handler.test.ts` (pure `handleSiteCheck` + `mockProvider` + stub providers):
  - demo addresses and their expected verdicts;
  - alias forms of the demo addresses;
  - fallback warning;
  - gibberish gives 404 `ADDRESS_NOT_FOUND`;
  - Burbank, LA and non-912 ZIPs give `OUTSIDE_GLENDALE`;
  - "San Fernando Rd" is not read as the city;
  - 9 invalid bodies give 400 `BAD_REQUEST`;
  - provider `GisError` codes map to 404/422/409/503;
  - unexpected errors give 503 without leaking the message;
  - live results are labeled `live`;
  - missing hazards are reported as `unavailable`.
- `tests/site-check.test.ts`: the real `POST` from `app/api/site-check/route.ts`, called with a Web `Request`, `GIS_MODE=mock`, and `fetch` stubbed to throw:
  - 613 E Broadway returns 200 with the full response shape;
  - `meta.dataSource === "mock"`;
  - every demo address × every type;
  - all 3 locales;
  - no network calls;
  - 10 invalid bodies (including non-JSON) give 400 `BAD_REQUEST`.
- `tests/i18n.test.ts`:
  - en/es/hy have the same keys and no empty strings;
  - `{placeholders}` are kept;
  - hy text is really Armenian script;
  - every `ApiErrorCode` has a message;
  - the disclaimer matches §7;
  - `demoData` and `footerTranslation` exist in every locale.

### Bugs

**P0:** none open.

**P1-1: Mock fallback for non-demo addresses is not visibly explained (data honesty, MASTER §4)**
- Where:
  - `lib/gis/mock.ts:77-81` returns City Hall (or same-street) fixture data for any plausible non-demo address, with only an English string in `meta.warnings`;
  - `components/*` never read `meta.warnings` (`grep -rn warnings components/` finds nothing).
- Repro: mock mode → business "cafe" → address `500 N Brand Blvd` → submit.
- Expected: the user sees that this is substitute demo data for a different address, in their language. Alternatively, mock returns `ADDRESS_NOT_FOUND` with the demo addresses as `candidates`.
- Actual: the "Demo data" badge shows, but the "Matched address" is 613 E Broadway, the verdict is for DSP, and the warning that explains it is never shown.
- Owners:
  - frontend: render `meta.warnings`, or a localized "showing demo address instead" note whenever `meta.warnings.length > 0`;
  - backend: optionally return a warning code the UI can localize.

**P2-1: Duplicate disclaimer on the verdict card**
- Where: `lib/rules/zoning.ts:131,184` adds `DISCLAIMER` to `verdict.notes`, and `components/Results.tsx:157` also renders `d.disclaimer`, so the text shows twice.
- Status: the frontend fix that filters it out of the notes is **in the working tree, not on `main`**. Re-check next round.

**P2-2: Article grammar in English verdict summaries**
- Where: `lib/rules/zoning.ts` (the summary templates at line 187), template `` `A ${b.name.en.toLowerCase()} …` ``.
- Actual: "A auto repair shop is likely allowed…" and "A e-commerce shop…".
- Expected: "An auto repair shop…". Use a/an by first letter, or rephrase as "This business type…".

**P2-3: Commit-subject format (historical)**
- `fd65c45 llm instructions` and `bcf397f losf links` predate the sprint and do not match `type/topic: description`.
- Do not rewrite history. FYI only.

**P2-4: Contract docs drift (docs only, no code impact)**
- `MASTER_INSTRUCTIONS.md` §6 summary leaves out `BusinessType.blurb`, which `lib/contracts.ts` has.
- The `lib/contracts.ts` header module map leaves out `getBusinessType`, which `PHASE_1_MVP.md` and `lib/rules/index.ts` export.
- Architect to sync.

**P2-5: English-only metadata**
- Where: `app/layout.tsx`. `metadata.title` and `metadata.description` are English only, and the server-rendered `<html lang="en">` is corrected to the saved locale only after hydration, through an effect in `lib/i18n/index.tsx`.
- Acceptable for the MVP. Noted for completeness.

**P2-6 (qa-owned): vitest config warning**
- `vitest.config.ts` prints a Vite notice: "ESM syntax in a file loaded as CommonJS".
- Cosmetic. Tests run fine.

**Fixed during this round**
- `matchBusinessType("peluquería")` returned `[]` at `ba9fce2`. Backend added the keyword in `621d914`, and the test now passes.

### Commit review (all of `main`)

| SHA | Subject OK | Paths within owner | Notes |
| --- | --- | --- | --- |
| fd65c45, bcf397f | no (pre-sprint) | owner | see P2-3 |
| ff594e7 docs/master-instructions | yes | architect | `.gitignore` excludes `.env*` except `.env.example` |
| 58380fe chore/scaffold | yes | architect | `.env.example` has variable names, an empty key and the public MCP URL. No secrets |
| 76437d8 feat/contracts | yes | architect | matches §6 apart from P2-4 |
| 0bcc701 docs/phase-1 | yes | architect | |
| ced0ae7 uiux/jewel-theme | yes | frontend (`app/`, `components/`, `lib/i18n`) | Noto Sans Armenian loaded and in the font stacks. `:lang(hy)` styles. Dictionaries typed `Dict`. Footer has the "translations in review" line. No hard-coded English in JSX |
| 2b0c2da feat/founder-flow | yes | frontend | Mock `DataBadge` shown when `dataSource === "mock"`. Disclaimer always rendered. External links use `rel="noopener noreferrer"`. Only literal: the OSM attribution. Was on local stubs |
| ba9fce2 feat/rules | yes | backend | 15 types. Every roadmap URL is `https` on a `.gov` host, and unconfirmed deep links have `ok:false`, so `verified:false`. Unknown zone gives `unknown` |
| c258d1d feat/rules-wiring | yes | frontend | swapped to the real `@/lib/rules` and `@/lib/gis/demo`, stubs removed |
| 621d914 feat/site-check | yes | backend | Server-only `client.ts`, with the key redacted from logs (`errText`). Provider defaults to mock. Pure handler. Fixtures README marks the data as illustrative |
| 9cb3e4d … a1d5561 test/* | yes | qa | |

- No `.env*` other than `.env.example` has ever been committed. A grep of `git log -p` found no key or token values.
- All commits share one git author identity, so ownership was checked by path only.

### Not run and why
- **Browser smoke test** (3 demo addresses × 3 types × 3 languages, 375 px width, Armenian glyphs, print view, error paths): not run this round. It is round 2, once the UI is on the real API.
- **Live GIS mode:** not run. The owner has not supplied the key, and tests must not use the network.
- **Official URL reachability:** not checked over HTTP. Tests only check `https` and a `.gov` host. 11 of the 22 `SOURCES` are `ok:false`, so the UI shows "confirm with agency" for those.
- **Zoning matrix accuracy** against Glendale Municipal Code Title 30: not verified. `zoning.ts:7` has a `TODO(live)`. Demo fixture zones are illustrative per the fixtures README.

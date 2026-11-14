# Glendale2Biz — Master Instructions

> **Single source of truth** for everyone building Glendale2Biz: the human owner, the master architect (lead Claude session), and the three subagents (`frontend-dev`, `backend-dev`, `qa-reviewer`).
> Read this file in full before touching code. Phase-specific detail lives in [`docs/phases/`](docs/phases/); this file links to each phase doc as it is written.

**Event:** Jewel City Hacks 6.0 · **Hard deadline:** Saturday 2026-11-14, **6:00 PM PT** (submissions close) · **Code freeze:** 5:30 PM PT

---

## 1. Product in one paragraph

**Glendale2Biz takes a Glendale, CA founder from "I have an idea" to "I know exactly what to do to open my doors".** A founder picks what kind of business they want (boba shop, salon, auto repair, home bakery, software startup…) and enters a Glendale address. Glendale2Biz looks the address up in official City of Glendale GIS data, tells them whether their business is likely allowed in that zone, shows the site's hazard zones and what is nearby, and generates a personalized, ordered launch roadmap (entity, EIN, fictitious business name, city license/permits, seller's permit, health permit…) with agencies, links, costs and timelines. The whole experience works in **English, Español, and Հայերեն (Armenian)** — Glendale has one of the largest Armenian communities outside Armenia and a large Latino community.

**Focus split:** 80% brick-and-mortar / service ("mom-and-pop") businesses, 20% tech/software startups (nice-to-have).

## 2. How we are judged (drives every priority call)

| Criterion | Weight | What it means for us |
| --- | --- | --- |
| Technical Execution | **40%** | The live demo must work, every click. Real GIS data, deployed on Vercel, no dead buttons. A clearly labeled demo/mock fallback so the pitch never dies on a network error. |
| Social/Local Impact | 20% | Glendale-specific data, trilingual (EN/ES/HY), aimed at immigrant and family-run businesses. |
| Presentation | 15% | Polished, distinctive visual design; a crisp 3-step story (Idea → Site → Roadmap). |
| Feasibility | 15% | Built on official city data + official agency links; clear path to City of Glendale partnership. |
| Creativity | 10% | "Can I open *this* business at *this* address?" answered instantly, in your own language. |

**Prize tracks we target:** Grand Champion, Best Software Hack, **Best LegalTech** (via Phase 3 document prep, sponsored by the Law Office Study Foundation), **Best ElevenLabs** (stretch — needs an ElevenLabs key; see §10).

## 3. Scope

### MVP (must ship) — "Steps 1–3"
1. **Business intake** — pick a business type from ~14 cards (or type a description that keyword-matches to a type). Language switcher always visible.
2. **Site check** — enter a Glendale address (or "home-based" / "no location yet") →
   - geocoded, matched address + map pin
   - **zoning code** at that parcel + plain-language zone name
   - **verdict** for that business type: `allowed` · `conditional` (needs a permit such as a CUP) · `not_allowed` · `unknown` — always with "confirm with Glendale Planning" guidance
   - **location report**: hazard zones (wildfire, flood, seismic, dam inundation) and nearby resources (schools, parks, bus stops, police/fire)
3. **Personalized launch roadmap** — ordered steps grouped into phases (Plan → Register → Permit → Open), each with agency, official link, estimated cost and time, and *why this step applies to you*. Checkable (progress saved in `localStorage`), printable.

### Stretch, in priority order
1. **Phase 3 — Document prep (LegalTech prize):** pre-filled drafts (e.g., LA County Fictitious Business Name statement worksheet, a one-page business summary, a checklist PDF) from the founder's answers. Clear "not legal advice" notice.
2. **Tech-startup track polish** (entity choice CA vs. Delaware, 83(b) reminder, home-occupation rules, local startup resources).
3. **Voice guide (ElevenLabs prize)** — reads the verdict + roadmap aloud in EN/ES/HY. Needs `ELEVENLABS_API_KEY`.
4. Address autocomplete, shareable result link, more business types.

### Explicit non-goals (today)
User accounts, databases, payments, LLM calls (**we have no Anthropic key — everything is rules + templates**), filing anything with a real agency.

## 4. Architecture

```
Browser (Next.js App Router, React, Tailwind)
   │  POST /api/site-check  { address, businessTypeId, locale }
   ▼
Next.js Route Handler (server-only, Node runtime, on Vercel)
   │  lib/gis/client.ts ── MCP client (Streamable HTTP, Bearer key from env)
   ▼
Hosted Glendale GIS MCP  (geocode_address, query_dataset[zoning], hazards_at_location, nearest_resources)

Pure, shared TypeScript (no network):  lib/rules/*  → zoning verdicts + roadmap builder
Localized content:                      { en, es, hy } objects inside lib/rules data + lib/i18n UI dictionaries
```

- **One deployable:** a single Next.js app on Vercel. No separate Python service. The GIS MCP secret lives **only** on the server (route handler) — never shipped to the browser.
- **Live vs. mock:** `GIS_MODE=live|mock`. Mock mode serves fixtures from `lib/gis/fixtures/` for 3 demo addresses. Every response carries `meta.dataSource: "live" | "mock"` and the UI shows a visible "Demo data" badge whenever it is mock. **Never present mock data as live.**
- **Roadmap is a pure function** `buildRoadmap(input)` that runs on the client — no API needed, instant and testable.

### Tech choices (locked)
- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS
- `@modelcontextprotocol/sdk` (Node client, `StreamableHTTPClientTransport`)
- Map: `leaflet` + `react-leaflet` with OpenStreetMap tiles (client-only dynamic import)
- Fonts: a display font + `Noto Sans Armenian` (Armenian glyph coverage is mandatory) via `next/font/google`
- Tests: `vitest` for rules/contracts/API; manual browser smoke checks by QA
- Package manager: **npm** (one lockfile, `package-lock.json`)

## 5. Repository layout & file ownership

Ownership is **exclusive**: only the owner edits those paths. Need a change elsewhere? Ask the owner (via the architect).

| Path | Owner | Notes |
| --- | --- | --- |
| `MASTER_INSTRUCTIONS.md`, `docs/**`, `CLAUDE.md`, `.claude/agents/**` | **architect** | |
| `lib/contracts.ts` | **architect** | Shared types. Changes announced to all agents. |
| `package.json`, `package-lock.json`, configs (`next.config.*`, `tsconfig.json`, `tailwind`/`postcss`, `.gitignore`, `.env.example`) | **architect** | Agents request dependencies; architect installs, to avoid lockfile conflicts. |
| `app/api/**`, `lib/gis/**`, `lib/rules/**` | **backend-dev** | Includes all roadmap/zoning *content* data (with `{en,es,hy}` text). |
| `app/**` (except `app/api`), `components/**`, `lib/i18n/**`, `public/**`, `app/globals.css` | **frontend-dev** | UI strings live in `lib/i18n/{en,es,hy}.ts`. |
| `lib/docs/**`, `components/docs/**` | **frontend-dev** | Phase 3 document prep (templates + UI). |
| `tests/**`, `vitest.config.ts`, `docs/qa/**` | **qa-reviewer** | Reviews everyone's diffs; files bug reports to the architect. |

## 6. Shared contracts (`lib/contracts.ts`)

The architect writes this file first; both devs code against it. Summary:

```ts
export type Locale = "en" | "es" | "hy";
export type LocalizedText = { en: string; es: string; hy: string };

export type BusinessCategory = "food" | "retail" | "personal_care" | "fitness" | "auto" | "services" | "childcare" | "home_based" | "tech";
export interface BusinessType {
  id: string;                 // e.g. "cafe", "salon", "auto_repair", "software_startup"
  category: BusinessCategory;
  name: LocalizedText;
  blurb: LocalizedText;       // one-line card description
  icon: string;               // emoji or icon key
  keywords: string[];         // for free-text matching, lowercase, include es/hy words where easy
  flags: { food: boolean; alcohol: boolean; healthPermit: boolean; homeBasedOk: boolean; sellsGoods: boolean; tech: boolean };
}

export interface SiteCheckRequest { address: string; businessTypeId: string; locale: Locale }

export type VerdictStatus = "allowed" | "conditional" | "not_allowed" | "unknown";
export type HazardKind = "wildfire" | "flood" | "seismic" | "dam_inundation";
export type HazardStatus = "in_zone" | "not_in_zone" | "unavailable";
export type ResourceKind = "schools" | "parks" | "bus_stops" | "police_stations" | "fire_stations" | "libraries" | "hospitals";

export interface SiteCheckResponse {
  address: { input: string; matched: string; lat: number; lon: number; score?: number };
  zoning: { code: string | null; name: LocalizedText | null; raw?: Record<string, unknown> };
  verdict: { status: VerdictStatus; summary: LocalizedText; notes: LocalizedText[] };
  hazards: { kind: HazardKind; status: HazardStatus; label: LocalizedText; detail?: string }[];
  nearby: { kind: ResourceKind; name: string; address?: string; distanceM: number }[];
  meta: { dataSource: "live" | "mock"; fetchedAt: string; warnings: string[] };
}
export interface ApiError { error: { code: "ADDRESS_NOT_FOUND" | "OUTSIDE_GLENDALE" | "AMBIGUOUS_ADDRESS" | "GIS_UNAVAILABLE" | "BAD_REQUEST"; message: string; candidates?: string[] } }

export type RoadmapPhase = "plan" | "register" | "permit" | "open";
export interface RoadmapStep {
  id: string; phase: RoadmapPhase; order: number;
  title: LocalizedText; description: LocalizedText; appliesBecause: LocalizedText;
  agency: string; url: string;               // official source — required
  costEstimate?: string; timeEstimate?: string;
  required: boolean;
  verified: boolean;                          // false ⇒ UI shows "confirm with agency"
}
export interface RoadmapInput { businessTypeId: string; site?: SiteCheckResponse | null; locationMode: "address" | "home" | "undecided" }
export interface Roadmap { steps: RoadmapStep[]; generatedAt: string }
```

**Endpoint:** `POST /api/site-check` → `200 SiteCheckResponse` | `4xx/5xx ApiError`.
**Rules API (backend exports from `@/lib/rules`, frontend imports):** `BUSINESS_TYPES: BusinessType[]`, `getBusinessType(id: string): BusinessType | undefined`, `matchBusinessType(text: string): BusinessType[]`, `buildRoadmap(input: RoadmapInput): Roadmap`, `t(text: LocalizedText, locale: Locale): string`.

## 7. Content & accuracy rules (legal-safety matters — this is a LegalTech-prize product)

- Every roadmap step **must** link to an official source (city, county, state, or federal `.gov`/agency page). No invented URLs — if unsure, link the agency's main page and set `verified: false`.
- Zoning verdicts are **guidance**, never a ruling. Every verdict screen shows: *"This is general guidance, not legal advice. Confirm with the City of Glendale Planning Division before signing a lease."*
- Unknown zone code ⇒ verdict `unknown`, never a guess.
- Spanish and Armenian are machine-authored today: mark with a small "translation in review" note in the footer. Don't claim native-speaker review.
- Glendale demo addresses: **613 E Broadway** (City Hall, downtown), plus two the backend picks to show `conditional` and `not_allowed`/residential outcomes.

## 8. Git workflow (owner-authorized override of the playbook)

The owner **explicitly authorized direct-to-`main`** for this sprint. Everything else in [`instructions/GITHUB_SNAPSHOT_COMMIT_PLAYBOOK_V2.md`](instructions/GITHUB_SNAPSHOT_COMMIT_PLAYBOOK_V2.md) still applies:

- Small, frequent commits; **push right after each commit**. Subject format **exactly** `feat|docs|cicd|test|uiux|chore/<topic>: <description>` (lowercase, hyphenated topic).
- We share **one working tree**. So:
  - **Never** `git add .` / `git add -A` / `git commit -a`. Commit only your own paths: `git add <paths> && git commit -m "…" -- <paths>`.
  - Before pushing: `git pull --rebase origin main` then `git push origin main`. If you hit `index.lock`, wait a few seconds and retry — another agent is committing.
  - Never force-push, never rewrite history, never `git reset --hard`, never `git stash` (it would grab other agents' work), never `git checkout -- <file>` on files you don't own.
- **Shared `.next` folder:** agents check with `npm run typecheck` and `npm test`. Only the architect (or QA when asked) runs `npm run build`, because builds and `next dev` overwrite each other's `.next`.
- `git pull --rebase` fails while others have unstaged edits. Since everyone commits into the same local repo, just commit your paths and `git push origin main`; if the push is rejected, retry after a few seconds.
- Never commit secrets. `.env.local` is gitignored; `.env.example` lists variable names only.
- Report truthfully: say "not tested" when it wasn't. Build passing ≠ feature working.

## 9. Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `GIS_MODE` | server | `live` or `mock` (default `mock` until the key is in place) |
| `GLENDALE_GIS_MCP_URL` | server | `https://glendale-gis-mcp-1053589358088.us-west2.run.app/mcp` |
| `GLENDALE_GIS_MCP_KEY` | server, **secret** | Bearer key — the owner puts it in `.env.local` locally and in Vercel project settings. Agents never print, log, or commit it. |
| `ELEVENLABS_API_KEY` | server, secret (stretch) | Voice guide |

## 10. Team, timeline & handoffs

**Roles**
- **Architect (lead session):** contracts, scaffolding, dependency installs, integration, Vercel deploy, unblocking, final call on scope cuts.
- **frontend-dev:** all UI/UX, i18n strings, map, roadmap UI, print view, visual polish. Builds against mock data first.
- **backend-dev:** MCP client, `/api/site-check`, zoning rules, business types, roadmap content in 3 languages, fixtures.
- **qa-reviewer:** vitest suites for rules + API, reviews each pushed commit against this doc, production-build checks, browser smoke tests, trilingual rendering check, bug reports.

**Timeline (PT)**

| Time | Milestone |
| --- | --- |
| 3:00–3:20 | Phase 0 done: this doc reviewed by owner; architect scaffolds app + `lib/contracts.ts` + deps; push |
| 3:20–4:30 | **Phase 1 — MVP build in parallel.** FE on mocks, BE on rules + MCP client (mock mode), QA writes tests against contracts |
| ~4:00 | Owner adds `GLENDALE_GIS_MCP_KEY` to `.env.local`; BE verifies live mode |
| 4:30–4:50 | **Phase 2 — Integration + first Vercel deploy** (owner sets env vars in Vercel) |
| 4:50–5:30 | **Phase 3 — Stretch:** doc prep (LegalTech) → tech track → voice; polish; QA regression |
| 5:30 | **Code freeze.** Only fixes for broken demo paths after this. |
| 5:30–6:00 | **Phase 4 — Submission:** README, Devpost write-up, demo script/video (architect drafts, owner records + submits) |

**Status vocabulary** (use in every report): designed · implemented · pushed · deployed · tested live.

**Handoff format** (each agent's final message): commits (SHA + subject), what works, what was tested and how, what is mocked, open bugs, next safe step.

## 11. Phase documents

| Phase | Doc | Status |
| --- | --- | --- |
| 0 — Ideation & scope | [docs/phases/PHASE_0_IDEATION.md](docs/phases/PHASE_0_IDEATION.md) | ✅ done |
| 1 — MVP build | `docs/phases/PHASE_1_MVP.md` | to be written at kickoff |
| 2 — Integration & deploy | `docs/phases/PHASE_2_DEPLOY.md` | — |
| 3 — Stretch (doc prep, tech track, voice) | `docs/phases/PHASE_3_STRETCH.md` | — |
| 4 — Submission | `docs/phases/PHASE_4_SUBMISSION.md` | — |

# Phase 1 — MVP build (≈3:20–4:30 PM PT)

**Goal:** the full Idea → Site → Roadmap flow works on localhost in all three languages, in mock mode, with live GIS mode implemented and ready for the owner's key.

## Starting point (architect, pushed)
- Next.js 15 + React 19 + TypeScript strict + Tailwind v4 (`@import "tailwindcss"` in `app/globals.css`, no tailwind config file).
- Installed: `@modelcontextprotocol/sdk`, `zod`, `leaflet`, `react-leaflet@5`, `@types/leaflet`, `vitest`.
- `lib/contracts.ts` — the shared types. Import as `@/lib/contracts`. Path alias `@/*` → repo root.
- `npm run dev` · `npm run build` · `npm run typecheck` · `npm test`.

## Integration seam (agree on this, don't drift)
- Backend exports from **`@/lib/rules`** (an `index.ts`): `BUSINESS_TYPES`, `getBusinessType(id)`, `matchBusinessType(text)`, `buildRoadmap(input)`, `t(text, locale)`.
- **backend-dev pushes a first `lib/rules/index.ts` with real signatures and at least 4 business types within ~15 minutes**, so frontend can switch from local stubs to the real module early.
- `POST /api/site-check` per contracts. In mock mode it must answer for `613 E Broadway` and the two other fixture addresses, which backend lists in `lib/gis/fixtures/README.md` (or as an exported `DEMO_ADDRESSES` from `@/lib/gis/demo` — **client-safe module, no secrets, no server imports**).

## Acceptance criteria (QA checks these)
1. Choosing a business type, entering `613 E Broadway`, and submitting shows: matched address, map pin, zoning code + name, a verdict with disclaimer, hazards, nearby list, and a roadmap.
2. Switching EN / ES / HY re-renders all UI and content text; Armenian renders with a proper font; `<html lang>` updates.
3. Mock responses show the "Demo data" badge.
4. Home-based and "not decided" paths skip the address and still produce a roadmap.
5. Error paths (empty, gibberish, outside Glendale) show friendly localized messages, never a crash.
6. `npm run build` passes; `npm test` passes.

## Per-agent kickoff
- **backend-dev:** rules index first (seam above) → fixtures + mock `/api/site-check` → full business catalog + zoning table + roadmap content → live MCP client (stop and report when ready for the key).
- **frontend-dev:** theme + layout + i18n plumbing → intake step → location step → results + map → roadmap UI + print. Use local stubs only until `@/lib/rules` lands.
- **qa-reviewer:** `vitest.config.ts` + test scaffolding against contracts → tests for rules as they land → API handler tests in mock mode → first review round of pushed commits → `docs/qa/QA_REPORT.md`.

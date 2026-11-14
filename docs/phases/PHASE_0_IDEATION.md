# Phase 0 — Ideation & Scope (decision record)

**Date:** 2026-11-14 · **Participants:** owner + architect · **Status:** complete, pending owner review of `MASTER_INSTRUCTIONS.md`

## Inputs reviewed
- `instructions/GITHUB_SNAPSHOT_COMMIT_PLAYBOOK_V2.md` — commit convention, ownership, truthful verification.
- `instructions/jewel-city-hacks-6.0-resources.md`:
  - **Glendale GIS MCP** (HackerFund) — 12 read-only tools: `geocode_address`, `query_dataset` (zoning, parcels, ZIP, neighborhoods…), `hazards_at_location`, `wildfire_zone`, `flood_zone`, `seismic_zones`, `dam_inundation`, `debris_flow`, `nearest_resources`, `list_datasets`, `describe_dataset`, `read_guide`. Hosted at Cloud Run (Streamable HTTP, Bearer key, 120 req/min) or local via `uvx`.
  - **Law Office Study Foundation** — CA nonprofit for access to justice; names "document preparation and workflow automation" as a focus → LegalTech prize angle.
  - **Companion app** — sponsors include City of Glendale, Vercel, ElevenLabs, Google for Startups, Hacker Fund, LOSF. Submissions close 6:00 PM PT.
  - Devpost page blocked automated fetch; owner supplied judging criteria and prizes (below).

## Judging & prizes (from owner)
Technical Execution 40 · Social/Local Impact 20 · Presentation 15 · Feasibility 15 · Creativity 10.
Prizes: Grand Champion, Best Hardware, Best Software, Top 5 Hackers, **Best LegalTech (LOSF)**, **Best ElevenLabs**.

## Decisions
| # | Decision | Why |
| --- | --- | --- |
| D1 | MVP = intake → site check (zoning verdict + hazards + nearby) → personalized roadmap | Owner-approved; demoable end to end in 3 hours |
| D2 | Languages: English, Spanish, Armenian from day one | Local impact (20%); Glendale demographics |
| D3 | No LLM — rules + templates | No Anthropic key; also makes output deterministic and testable |
| D4 | Single Next.js app on Vercel; call the **hosted** GIS MCP from a server route with the owner's Bearer key | Avoids running Python on Vercel; secret stays server-side |
| D5 | `GIS_MODE=mock` fixtures until the key is supplied; mock is always labeled | Unblocks parallel work; protects the live demo; honesty rule |
| D6 | 80% brick-and-mortar/service, 20% tech startups | Owner direction |
| D7 | Direct-to-`main`, small commits, path-scoped staging | Owner-authorized override for the sprint |
| D8 | Stretch order: doc prep (LegalTech) → tech track → ElevenLabs voice | Prize value vs. effort; voice needs a key we don't have yet |
| D9 | Team: architect + `frontend-dev`, `backend-dev`, `qa-reviewer` subagents | Owner direction |

## Open items
- Owner to provide `GLENDALE_GIS_MCP_KEY` via `.env.local` when backend is ready to test live (~4:00 PM).
- ElevenLabs key: needed only if we reach the voice stretch.
- Devpost submission requirements (video? repo link?) — confirm before 5:30 PM.

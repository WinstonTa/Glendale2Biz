# Glendale2Biz — from idea to open doors

**Glendale2Biz helps aspiring small-business owners in Glendale, California answer the first question every founder has: "Can I open *this* business at *this* address — and what do I do next?"** In English, Español, and Հայերեն.

Built at **Jewel City Hacks 6.0** (2026-11-14). **Live:** https://glendale2biz.vercel.app/

## What it does

1. **Pick your business.** Choose from 16 business types (cafés, salons, auto repair, daycare, home bakeries, software startups…) or describe your idea in your own words.
2. **Check your site.** Enter a Glendale address. Glendale2Biz looks it up in City of Glendale GIS data (via the [Glendale GIS MCP](https://github.com/HackerFund/GlendaleGisMcp)) and shows:
   - the **zoning** at that address and a plain-language **verdict** for your business: likely allowed, needs a conditional use permit, likely not allowed, or unknown
   - **hazard zones** (wildfire, flood, seismic, dam inundation) that affect insurance and build-out
   - **what's nearby**: schools, parks, bus stops, police and fire stations
3. **Get your launch roadmap.** A personalized, ordered checklist (Plan → Register → Permit → Open) built from your business type and site: entity, EIN, fictitious business name, city permits, seller's permit, health permit, ABC license, home occupation, state licensing boards. Each step lists the agency, an official link, the estimated cost and time, and *why it applies to you*. Progress is saved in your browser, and the roadmap is printable.
4. **Prepare your documents.** Pre-filled drafts that you take to the agency yourself:
   - a pre-lease zoning inquiry to Glendale Planning
   - an LA County Fictitious Business Name worksheet
   - a one-page launch summary

Home-based founders, and founders without a location yet, skip the site check and still get a roadmap.

> Glendale2Biz gives general guidance, not legal advice. Zoning verdicts are not official determinations. Always confirm with the City of Glendale Planning Division before signing a lease. Spanish and Armenian translations are machine-authored and awaiting native-speaker review.

## Why Glendale

Glendale's small businesses are family-run, immigrant-founded, and multilingual. Glendale has one of the largest Armenian communities outside Armenia, plus a large Latino community. The information founders need is spread across city, county, state, and federal websites, mostly in English. Glendale2Biz puts it in one place, in their language, specific to their address.

## Tech

- **Next.js 15** (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4, deployed on **Vercel**
- **Glendale GIS MCP** called server-side over MCP Streamable HTTP (`@modelcontextprotocol/sdk`). The key stays on the server.
- **Deterministic rules engine** (no LLM): a zoning matrix (zone family × business category), conditional roadmap steps, and trilingual content (`lib/rules`)
- **Document templates** as pure functions (`lib/docs`)
- **Leaflet** + OpenStreetMap map
- **Vitest**: 200+ tests covering rules, zoning, the site-check handler, i18n parity, and document templates

```
Browser ──POST /api/site-check──▶ Next.js route (Node) ──MCP──▶ Glendale GIS MCP
   │                                   geocode → zoning + hazards + nearby (parallel)
   └── buildRoadmap() / generateDocuments() run client-side (pure functions)
```

## Run locally

```bash
npm install
cp .env.example .env.local    # GIS_MODE=mock works without any key
npm run dev                   # http://localhost:3000
npm test
```

| Variable | Purpose |
| --- | --- |
| `GIS_MODE` | `mock` (labeled demo fixtures; no key needed) or `live` |
| `GLENDALE_GIS_MCP_URL` | Hosted Glendale GIS MCP endpoint |
| `GLENDALE_GIS_MCP_KEY` | Bearer key for the hosted MCP (secret; never commit) |

In mock mode, the app serves three demo addresses (613 E Broadway, 4500 San Fernando Rd, 1200 Cleveland Rd), and every result shows a **Demo data** badge.

## How we built it

One human owner plus four AI agents: an architect, a frontend dev, a backend dev, and a QA reviewer. They worked from a shared contract ([`lib/contracts.ts`](lib/contracts.ts)) and a [master plan](MASTER_INSTRUCTIONS.md), each owned separate files, and pushed small commits straight to `main`. Phase records are in [`docs/phases/`](docs/phases/), and QA rounds are in [`docs/qa/QA_REPORT.md`](docs/qa/QA_REPORT.md).

## Roadmap after the hackathon

- Validate the zoning matrix against Glendale Municipal Code Title 30 with City Planning staff
- Native-speaker review of Spanish and Armenian, and add Korean, Tagalog, and Farsi
- Address autocomplete, parcel details, and shareable result links
- Voice guide (ElevenLabs) for founders who prefer to listen
- Partner with the City of Glendale, the Law Office Study Foundation, and local SBDCs to keep the content current

## License

TBD.

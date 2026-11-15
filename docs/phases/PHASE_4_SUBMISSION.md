# Phase 4 — Submission kit

**Code freeze: 4:18 PM PT, commit `895664e`.** Production at https://glendale2biz.vercel.app/ runs live City of Glendale GIS and was smoke-tested by QA (round 2, `docs/qa/QA_REPORT.md`). After the freeze, only demo-breaking fixes go in.

Every claim below was checked against production at freeze time.

**Links for Devpost**
- Demo: https://glendale2biz.vercel.app/
- Code: https://github.com/WinstonTa/Glendale2Biz

## Devpost fields

**Name:** Glendale2Biz

**Tagline (≤ 60 chars):** Can I open my business here? Ask in your language.

**Inspiration**
Opening a small business in Glendale means piecing together zoning maps, city permits, county filings, state licenses, and federal tax IDs, mostly in English, across a dozen websites. Many of Glendale's founders are immigrant families, and Glendale has one of the largest Armenian communities in the world outside Armenia. Too many sign a lease before learning that their business isn't allowed there. We wanted one place that answers "Can I open *this* business at *this* address, and what do I do next?", in English, Spanish, and Armenian.

**What it does**
Pick a business type (or describe your idea) and enter a Glendale address. Glendale2Biz pulls the zoning, hazard zones, and nearby resources for that address from City of Glendale GIS data through the Glendale GIS MCP. It gives a plain-language verdict: likely allowed, needs a conditional use permit, or likely not allowed. Then it builds a personalized launch roadmap from Plan → Register → Permit → Open, with official links, costs, timelines, and *why each step applies to you*. Finally, it drafts the paperwork the founder takes to each agency: a pre-lease zoning inquiry to Glendale Planning, an LA County Fictitious Business Name worksheet, and a one-page launch summary. Everything works in English, Español, and Հայերեն.

**How we built it**
Next.js 15 + TypeScript on Vercel. A server-side route calls the hosted Glendale GIS MCP over MCP Streamable HTTP, geocoding first and then fetching zoning, hazards, and nearby resources in parallel. A deterministic rules engine turns the zone code and business type into a verdict and a roadmap. We paged all 2,426 zoning features in the city's dataset and mapped every distinct zone code to a rule family, so any code we don't recognize returns "unknown" instead of a guess. Document drafts come from pure template functions. 213 Vitest tests cover rules, i18n parity, the API handler (replaying recorded live GIS sessions offline), and the templates. One human and four AI agents (architect, frontend, backend, QA) built it in parallel against a shared typed contract, with QA reviewing every commit.

**Challenges**
- Turning raw GIS responses into a trustworthy answer without overclaiming. Unknown zones say "unknown", every step links to an official source, and unconfirmed sources are flagged "confirm with agency".
- Writing full content in three languages, two of them non-Latin script, in a few hours.
- Coordinating four parallel agents in one repository on one branch without stepping on each other.

**Accomplishments**
- A real address-to-roadmap flow on real city data, in three languages, in one afternoon.
- Data honesty built in: demo data is always labeled, and legal guidance is always caveated.
- A LegalTech angle that prevents the costliest small-business mistake: signing a lease in the wrong zone.

**What we learned**
Small businesses don't need more information. They need the *right* information for *their* address, in *their* language, in order.

**What's next**
Validate the zoning matrix with the City of Glendale Planning Division. Have native speakers review the Spanish and Armenian. Add Korean, Tagalog, and Farsi. Add a voice guide. Partner with the City, the Law Office Study Foundation, and local SBDCs so the content stays current.

**Built with:** nextjs, react, typescript, tailwindcss, vercel, model-context-protocol, glendale-gis-mcp, arcgis, leaflet, openstreetmap, vitest, zod

**Prize tracks to select:** Best Software Hack, Best LegalTech Project (plus Grand Champion consideration)

## 2-minute demo script

1. **Hook (15 s):** "Every year, Glendale founders sign leases for spaces where their business isn't even allowed. Glendale2Biz answers that question in 10 seconds, in their language."
2. **Switch to Հայերեն (10 s)**, then back to English. Point out that the whole app is trilingual.
3. **Type "boba tea shop", then 613 E Broadway (30 s):** point to the "Live City of Glendale GIS" badge, the verdict, the Downtown Specific Plan zone, the map and nearby.
4. **Same shop at 1200 Cleveland Rd (10 s):** residential, likely not allowed, and the roadmap adapts.
5. **2900 Honolulu Ave (10 s):** a Very High wildfire zone and a liquefaction zone, which matter for insurance and build-out.
6. **Roadmap (20 s):** phases, "why this applies to you", official links, checkboxes, print.
7. **Documents (20 s):** the pre-lease zoning inquiry, pre-filled and ready to send. "This is the legal-tech piece: it stops the most expensive mistake before it happens."
8. **Close (5 s):** "Built on City of Glendale GIS data via MCP. Glendale2Biz: from idea to open doors."

## Submission checklist
- [x] Production URL loads; the demo path works (QA round 2, Chromium desktop and 375 px). Not yet tried on a real phone; do that once yourself.
- [ ] Repo is public (or judges have access): https://github.com/WinstonTa/Glendale2Biz
- [ ] Before demoing, clear localStorage or use a private window, so saved checkboxes and the language choice start fresh
- [ ] Demo video recorded (if Devpost requires one) and uploaded
- [ ] Screenshots: landing, verdict, roadmap, document, and Armenian view
- [ ] Every claim in the write-up matches what is deployed (live vs. mock)
- [ ] Submitted before 6:00 PM PT

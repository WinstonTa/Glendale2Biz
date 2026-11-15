# Phase 3 — Stretch: document prep & localization (record)

**Status:** document prep done · voice skipped (no ElevenLabs key)

## Document prep — LegalTech track (frontend-dev: `a82b096`, `ba68826`, `e78a3db`, `d271723`)
- Pure templates in `lib/docs/` (`generateDocuments`, `docToText`, `DOC_BANNER`), with UI in `components/docs/DocsSection.tsx`.
- **Zoning pre-lease inquiry** to the Glendale Planning Division. It cites the GIS preliminary check and asks five questions: permitted use, CUP or discretionary review, parking and change of use, overlays and signage, and limits on hours or occupancy. Home mode adds a question about the Home Occupation Permit.
- **LA County FBN worksheet**: 7 pre-filled fields, then filing, publication (4 weeks within 30 days), proof of publication and 5-year refiling. Links to lavote.gov.
- **One-page launch summary**: business, location, verdict and data source, the hazard zones the site is in, and the required steps by phase.
- Each document is in EN/ES/HY and carries a "not legal advice / not an official form" banner. Missing fields are highlighted. Print and Copy work. The form stays in localStorage only.
- Tests: `tests/docs.test.ts` (qa-reviewer, `c494457`).

## Localization of backend strings (backend-dev `a0c6d33`, architect `dcf8cf4`)
- `localizeEstimate`, `localizeAgency` and `localizeHazardDetail` in `@/lib/rules`, wired into the roadmap, the hazard chips and the launch summary. Verified in the browser in Spanish.

## Fourth demo address (`4444e57`)
- 2900 Honolulu Ave (Montrose), zone C1, with a Very High wildfire zone and a liquefaction zone. It shows off the hazard report.

## Skipped
- ElevenLabs voice guide: the owner may not get a key, and the app is complete without it (see MASTER_INSTRUCTIONS §3).

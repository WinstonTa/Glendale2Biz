## Inspiration
Opening a small business in Glendale means piecing together zoning maps, city permits, county filings, state licenses, and federal tax IDs across a dozen websites, mostly in English. Too many founders, many of them immigrant families in one of the largest Armenian communities outside Armenia, sign a lease before learning their business isn't even allowed there. We wanted one place that answers "Can I open *this* business at *this* address, and what do I do next?" in the founder's own language.

## What it does
Pick a business type (or just describe it, like "boba tea shop") and enter a Glendale address. Glendale2Biz pulls live City of Glendale GIS data to show the zoning, a plain-language verdict (likely allowed, needs a conditional use permit, or likely not allowed), hazard zones, and what's nearby. It then builds a personalized launch roadmap and pre-fills key paperwork, including a pre-lease zoning inquiry to Glendale Planning and an LA County Fictitious Business Name worksheet, all in English, Español, and Հայերեն.

## How we built it
We built a Next.js 15 + TypeScript app on Vercel. A server-side route calls the hosted Glendale GIS MCP over the Model Context Protocol, then a deterministic rules engine turns the zone code and business type into a verdict, a roadmap, and document drafts. One human and four AI agents (architect, frontend, backend, and QA) built it in parallel against a shared typed contract, backed by 213 automated tests.

## Challenges we ran into
The hardest part was giving trustworthy legal-adjacent answers without overclaiming. So unknown zones say "unknown", every step links to an official source, and every verdict carries a "not legal advice" notice. Mapping all 2,426 of the city's zoning areas to real rules, and writing full content in three languages (two of them non-Latin), in a single afternoon was a sprint.

## Accomplishments that we're proud of
A real address-to-roadmap flow running on live city data, fully trilingual, built and deployed in one day. We're especially proud of the pre-lease zoning inquiry, which helps founders avoid the most expensive small-business mistake before they sign anything.

## What we learned
Small business owners don't need more information. They need the *right* information for *their* address, in *their* language, in the right order. We also learned how far careful contracts and honest data labeling can take a fast-moving team.

## What's next for Glendale2Biz
We want to validate the zoning rules with the City of Glendale Planning Division, get native-speaker review of the Spanish and Armenian, and add languages like Korean, Tagalog, and Farsi. Longer term, we plan to partner with the City, the Law Office Study Foundation, and local small business development centers to keep content current and to expand to neighboring cities.

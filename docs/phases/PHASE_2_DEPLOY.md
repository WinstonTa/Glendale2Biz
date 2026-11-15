# Phase 2 — Live GIS integration & deploy (record)

**Status:** done · production: https://glendale2biz.vercel.app/ (auto-deploys from `main`)

## Live GIS (backend-dev, `a835acb`, `6bbf62d`)
- Hosted Glendale GIS MCP over Streamable HTTP with a Bearer key (server-only). One MCP session per request: geocode first, then zoning, hazards and nearby in parallel. A request takes about 150–500 ms locally and about 0.9 s on Vercel from a cold start.
- Real response shapes are encoded in `lib/gis/parse.ts`. Zone field `ZONE_DISTR`. All 2,426 zoning features were paged, and every distinct code maps to a family in `lib/rules/zoning.ts`; unrecognized codes return `unknown`.
- Flood correction: FEMA Zone X counts as `not_in_zone`. Only SFHA, A or V zones count as `in_zone`.
- Recorded sessions in `lib/gis/fixtures/live/` (no key) plus `lib/gis/replay.ts` let tests run offline. Mock fixtures were regenerated from live data, so mock mode mirrors production.

## Verified
| Check | Result | How |
| --- | --- | --- |
| Live route via `next dev` (2900 Honolulu Ave, cafe) | 200, `live`, C1, allowed, wildfire + seismic in zone, 11 nearby | architect, browser |
| Full UI flow in live mode | "Live City of Glendale GIS" badge, verdict, map, hazards | architect, browser |
| Production `/api/site-check` (613 E Broadway) | 200, `dataSource: live`, 0.88 s | architect, curl |
| Production bundle has the latest commits | Montrose demo, ES agency names and doc prep present | architect, JS grep |
| Production build of HEAD | pass | architect, clean snapshot |

## Vercel
- The project was imported by the owner in the dashboard. The Vercel connector lacked permission to create projects or list deployments (403).
- Env: `GIS_MODE=live`, `GLENDALE_GIS_MCP_URL`, `GLENDALE_GIS_MCP_KEY` (sensitive; set by the owner).

## Not done
- No ElevenLabs voice (no key). The product does not depend on it.

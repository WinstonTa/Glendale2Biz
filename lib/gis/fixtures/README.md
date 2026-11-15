# Mock GIS fixtures (GIS_MODE=mock)

Demo data only. Every response built from these files has `meta.dataSource: "mock"`, and the UI must show the "Demo data" badge.

The three fixtures **mirror real live GIS responses** recorded 2026-11-14 (see `live/`), so mock and live agree for the demo addresses.

| Address | Zone | Example (cafe) |
| --- | --- | --- |
| 613 E Broadway, Glendale, CA 91206 (City Hall) | DSP/CC | allowed |
| 4500 San Fernando Rd, Glendale, CA 91204 | IMU R | conditional |
| 1200 Cleveland Rd, Glendale, CA 91202 | R1 I | not_allowed |

The same list is exported, client-safe, as `DEMO_ADDRESSES` from `@/lib/gis/demo`.

Mock matching: a street-number + street-name match picks a fixture. A ZIP outside 912xx, or another city name, returns `OUTSIDE_GLENDALE`.
Text with no street number returns `ADDRESS_NOT_FOUND`. Any other plausible address returns `AMBIGUOUS_ADDRESS` (HTTP 409) with `candidates` = the three demo addresses. Mock mode never answers a non-demo address with another address's data.

## `live/` — recorded live MCP sessions (offline parser tests)

Recorded with `node lib/gis/scripts/record.mjs "<address>" ...` (key never written). Each file is
`{ recordedAt, address, calls: [{ tool, args, ms, result }] }` where `result` is the raw MCP `CallToolResult`.
Replay offline with `replayCaller(rec)` from `lib/gis/replay.ts` + `liveLookup()` from `lib/gis/client.ts`.

| File | Expected result |
| --- | --- |
| 613-e-broadway | 200, zone `DSP/CC` |
| 4500-san-fernando-rd | 200, zone `IMU R` (cafe: conditional) |
| 1200-cleveland-rd | 200, zone `R1 I` (cafe: not_allowed) |
| 500-n-brand-blvd | 200, zone `DSP/GAT` |
| 100-w-broadway | 200, zone `DSP/BC` |
| 1100-n-brand-blvd | 200, zone `C3 III`, dam_inundation in_zone |
| 2900-honolulu-ave | 200, zone `C1`, wildfire in_zone (Very High), seismic in_zone (liquefaction) |
| 275-e-olive-ave (Burbank) | OUTSIDE_GLENDALE |
| asdf-qwer-zxcv | ADDRESS_NOT_FOUND |
| broadway (street only) | AMBIGUOUS_ADDRESS, no candidates |

Flood: FEMA marks every mapped polygon `in_zone`, including Zone X (minimal hazard). We report flood `in_zone`
only for a Special Flood Hazard Area (`SFHA_TF = "T"` or zone A*/V*), otherwise `not_in_zone` with the zone in `detail`.

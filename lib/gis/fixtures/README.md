# Mock GIS fixtures (GIS_MODE=mock)

Demo data only. Every response built from these files has `meta.dataSource: "mock"`, and the UI must show the "Demo data" badge.

| Address | Zone | Example (cafe) |
| --- | --- | --- |
| 613 E Broadway, Glendale, CA 91206 (City Hall) | DSP | allowed |
| 4500 San Fernando Rd, Glendale, CA 91204 | IMU | conditional |
| 1200 Cleveland Rd, Glendale, CA 91202 | R1 | not_allowed |

Coordinates are approximate. Zones, hazards and some nearby names are illustrative ("(demo)"), not official data.
The same list is exported, client-safe, as `DEMO_ADDRESSES` from `@/lib/gis/demo`.

Mock matching: a street-number + street-name match picks a fixture. A ZIP outside 912xx, or another city name, returns `OUTSIDE_GLENDALE`.
Text with no street number returns `ADDRESS_NOT_FOUND`. Any other plausible address falls back to the fixture on the same street (or City Hall), with a warning in `meta.warnings`.

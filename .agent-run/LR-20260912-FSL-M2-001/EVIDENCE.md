# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M2-001`
- Revision: `1`
- Snapshot SHA-256: `9C7B4E5CB255D9EE3BCA68E86E9C50B20272DD94B29A3B671AD481D52B3F7999`

## Wave 0 — Fresh preflight / M1 closeout

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Fresh `origin/main` | `a7a9cbb7af2386b6b0b5266ea390568a8b537d69` | PASS |
| Starting branch/worktree | `feat/m1-engine-baseline @ cdacd6c...`, clean | PASS |
| M2 branch | `feat/m2-weather-foundation` created from and tracking exact `origin/main` | PASS |
| Legacy HTML | 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` | PASS |
| Legacy handover | 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` | PASS |
| `.gitattributes` | Both immutable originals remain path-specific `-text -whitespace` | PASS |
| M1 Golden | 2 files / 15 tests and source-derived fixture check pass | PASS |
| M1 closeout | Reviewed head `cdacd6c...`; PR #2 squash merge `a7a9cbb...` | PASS |
| M2 Task Packet | public-safe LF snapshot digest above | PASS |

### Authoritative specifications checked before implementation

- EnergyPlus 26.1 Auxiliary Programs / EPW data dictionary: eight header lines; Hour 1–24; Minute 1–60; GHI/DNI/DHI in Wh/m2 for the minutes preceding the indicated time; radiation missing sentinel 9999; sub-hour records declared by DATA PERIODS.
- NOAA/GML Solar Calculation Details and Solar Position Calculator: Meeus-based calculations, local-time/offset inputs, azimuth clockwise from north, elevation above horizon, and documented approximation/refraction limits.

URLs and access date will be recorded in `docs/WEATHER_FOUNDATION.md`.

## Public repository boundary

- M2 snapshot contains no user-specific project root.
- No external EPW file has been committed.
- No `main`, Vercel, Production, Ready, merge, permission, visibility, secret, force-push, rebase, branch deletion, release, or M3 mutation occurred.

## Wave 1 — Canonical weather contract

Performed: `2026-09-12` (Asia/Tokyo)

- Added Pure TypeScript contracts for `WeatherDataset`, `WeatherLocation`, `WeatherInterval`, `WeatherSourceProvenance`, and `WeatherParseIssue`.
- Radiation properties encode `Wh/m2 interval` in their names and allow explicit `null` for missing required values.
- EPW interval-end and midpoint Local Standard Time are separate immutable values.
- Pure Gregorian helpers normalize date boundaries and sub-hour fractional midpoints without `Date`, UTC conversion, DST, or host-timezone input.
- Five focused time-contract tests pass; full suite is 3 files / 20 tests.
- TypeScript no-emit check and authored-file whitespace check pass.

## Wave 2 — EPW parser

Performed: `2026-09-12` (Asia/Tokyo)

- Added a string-in/string-domain parser with no filesystem, process, UI, DOM, or browser APIs.
- Enforces the eight ordered EPW headers, parses LOCATION and one DATA PERIOD, and validates that records/hour is a positive divisor of 60.
- Maps fields 14–16 (one-based) to GHI, DNI, and DHI interval energy.
- Missing/non-numeric/`>=9999` and negative required radiation become `null` plus line/field-scoped errors; no zero substitution occurs.
- Synthetic hourly and quarter-hour fixtures verify interval end/midpoint semantics.
- Generated in-memory ordinary/leap datasets parse exactly 8,760 and 8,784 intervals and retain February 29.
- Malformed row, missing radiation, negative radiation, unsupported records/hour, and inconsistent minute cases are exercised.
- Full suite: 4 files / 28 tests pass. TypeScript no-emit and whitespace checks pass.

## Wave 3 — Solar position v1

Performed: `2026-09-12` (Asia/Tokyo)

- Implemented the documented NOAA fractional-year equation-of-time/declination method using calendar date, local standard time, latitude, east-positive longitude, and UTC offset.
- Core calculation uses no `Date`, DST, host clock, or host timezone.
- Returned identity is `noaa-fractional-year-v1`; geometric and NOAA-refraction-adjusted elevations are kept separate.
- Independent expected values were transcribed from NOAA/GML's old Solar Position Calculator for Tokyo (35°42' N, 139°46' E, UTC+9): equinox 09:00/12:00/15:00, summer noon, and winter noon.
- Numeric references are rounded by NOAA to 0.01°; tests use a 0.5° bound appropriate to the simplified method. Night and east/west tendency checks are separate.
- Full suite: 5 files / 35 tests pass. TypeScript no-emit and whitespace checks pass.

## Wave 4 — Weather irradiance foundation

Performed: `2026-09-12` (Asia/Tokyo)

- Added weather-v1 beam incidence on an explicitly north-zero/clockwise vertical facade.
- Added separate DNI beam, isotropic DHI sky, and GHI × ground reflectance × 0.5 interval-energy components.
- Added a weather-v1-only 20-strip 2D horizontal-overhang path; no legacy solar or `legacySkyFactor` is imported.
- D=0 produces exact with/without-overhang equivalence. A high-sun/deep-overhang case proves direct shading.
- Interval gain converts EPW Wh/m2 interval to kWh using area and SHGC exactly once; no duration multiplier exists.
- Four quarter-hour records manually converge to 0.015 kWh for the DHI-only accounting component.
- Simulation aggregates 12 months plus configurable annual/cooling/heating definitions and retains dataset ID/source provenance.
- Strict simulation rejects any error-bearing dataset before calculation.
- Browser/framework boundary now recursively scans both `src/engine` and `src/weather`, including Node built-ins and File API.
- Full suite: 6 files / 41 tests pass. TypeScript no-emit and whitespace checks pass.

## Wave 5 — Validation

Performed: `2026-09-12` (Asia/Tokyo)

### Synthetic and M1 regression

- Added the padded `1/ 1` DATA PERIODS date form observed in the official distribution; parser test coverage now includes it.
- Synthetic automated suite after this addition: 6 files / 42 tests.
- `npm run golden:check`: PASS against immutable HTML hash `EF896E0D...D4CB5`.
- Legacy HTML: 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`.
- Legacy handover: 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4`.

### Real EPW local smoke — PASS

- Distribution: EnergyPlus weather S3, `JPN_Tokyo.Hyakuri.477150_IWEC.zip`.
- Retrieved: `2026-09-12`.
- ZIP SHA-256: `65F7DFC78762753A8CCCA36F47C76F37397237247DC755E46D648A8D0505BF69`.
- EPW SHA-256: `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`.
- LOCATION: Tokyo Hyakuri / JPN / WMO 477150 / 36.18 N / 140.42 E / UTC+9 / 35 m.
- Parser: 8,760 records, `full-year-8760`, zero parse issues, zero missing required solar values.
- Radiation sums: GHI 1,306,833; DNI 935,343; DHI 736,369 Wh/m2.
- Weather-v1 simulation completed with no NaN/Infinity and retained dataset ID/source provenance.
- License: bundled ASHRAE IWEC license restricts copying/transfer and third-party distribution. Raw ZIP/EPW/license remain only under ignored `.local-validation/`; committed to repository: no.

### Legacy-v01 versus weather-v1

Common geometry: H 2.4 m, D 1.6 m, O 0.3 m, W 6 m, south facade, SHGC 1, ground reflectance 0.2. Weather-v1 uses the Tokyo Hyakuri location; legacy-v01 retains its own 35.2° clear-sky baseline inputs.

| Model/period | With overhang [kWh] | Without [kWh] | Reduction |
| --- | ---: | ---: | ---: |
| legacy-v01 annual | 14,486.66 | 25,890.12 | 44.05% |
| weather-v1 annual | 8,388.95 | 13,604.20 | 38.34% |
| legacy-v01 cooling | 4,254.15 | 10,115.80 | 57.95% |
| weather-v1 cooling | 3,398.52 | 6,111.48 | 44.39% |
| legacy-v01 heating | 10,232.51 | 15,774.32 | 35.13% |
| weather-v1 heating | 4,990.43 | 7,492.72 | 33.40% |

The difference is expected evidence of replacing the legacy clear-sky source with a real-weather input; it is not external validation of either absolute result.

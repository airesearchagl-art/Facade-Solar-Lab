# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M2-001`
- Revision: `1`
- Snapshot SHA-256: `D528CD2A4923B29356E36D538893E7DEC78ABB9FFF5ADAFF386425667437370F`

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

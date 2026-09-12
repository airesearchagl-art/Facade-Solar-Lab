# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M3-001`
- Revision: `1`
- Snapshot SHA-256: `AFF8B77962787C01B61FE059353FE33B7B3FC9971A1BD126313A1547660DDACB`

## Wave 0 — Fresh preflight / M2 closeout

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Fresh `origin/main` | `c3f314134137da9b35b4cde53320a610bba15f72` | PASS |
| Starting branch/worktree | `feat/m2-weather-foundation @ 406a896...`, clean | PASS |
| Target branch | absent locally/remotely, then created from exact `origin/main` | PASS |
| Legacy HTML | 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` | PASS |
| Legacy handover | 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` | PASS |
| M1 Golden | hash-guarded fixture check | PASS |
| M2 regression | 6 files / 47 tests; typecheck | PASS |
| M2 closeout | reviewed head `406a896...`; PR #3 squash merge `c3f3141...` | PASS |
| M3 Task Packet | public-safe LF snapshot; digest above | PASS |

### Snapshot normalization boundary

Only the Human-provided absolute project-root string was replaced with `${PROJECT_ROOT}`, and line endings were normalized to LF with a final LF. No Task Packet semantics were changed. The committed snapshot is immutable after this checkpoint.

### Repository boundary

- No `main`, Ready, merge, Vercel, Production, Release, permission, visibility, secret, Notion, Vault, or M4 mutation occurred.
- No external EPW, ZIP, or license file was added.

## Wave 1 — Geometry contract

Performed: `2026-09-12` (Asia/Tokyo)

- Added metre-based rectangular opening and horizontal overhang contracts without redundant height/area storage.
- Opening height/area and opening/overhang edges are derived; full-height and waist-wall openings use the same type.
- Invalid width, head/sill order, depth, extension, elevation, and non-finite values are rejected rather than clamped.
- Facade azimuth is north-zero/clockwise and normalized only after finite validation.
- Derived facade-local sun vector uses `x=-cos(e)sin(S-A)`, `y=cos(e)cos(S-A)`, `z=sin(e)` from the declared front-view basis.
- Focused result: 1 file / 5 tests; typecheck and whitespace check PASS.

## Wave 2 — Polygon primitives

Performed: `2026-09-12` (Asia/Tokyo)

- Defined one `GEOMETRY_EPSILON = 1e-9` for clipping, duplicate, and zero-area boundaries.
- Implemented finite-point validation, adjacent/closing vertex deduplication, shoelace polygon area, and Sutherland–Hodgman clipping against an axis-aligned opening rectangle.
- P1–P6 cover area, partial/full/empty intersection, edge-touch zero area, and numerical duplicate vertices.
- Focused result: 2 files / 11 tests; typecheck and whitespace check PASS.

## Wave 3 — Finite direct shadow

Performed: `2026-09-12` (Asia/Tokyo)

- Projects each finite overhang front-edge endpoint to wall `y=0` with `xWall=x-depth*s_x/s_y` and `zWall=zOverhang-depth*s_z/s_y`.
- Back edge plus projected front edge form a reviewable four-point polygon; the clipped polygon and area are retained in the result.
- Invalid out-of-bound fractions throw; epsilon only removes numerical boundary noise.
- Hand calculations: G2 drop 1 m, shaded 2 m² / opening 4 m² = 0.5; G3 drop 2 m = full shade; G4 z=2.5 to 1.5 intersection gives 1 m² / 4 m² = 0.25.
- Translation and uniform-scale invariance PASS.
- Focused result: 3 files / 17 tests; typecheck and whitespace check PASS.

## Wave 4 — Orientation / finite width

Performed: `2026-09-12` (Asia/Tokyo)

- Rotation invariance PASS for N/E/S/W and 45°/135°/225°/315° facades with fixed relative sun geometry.
- Symmetric left/right extensions give equal shade under mirrored sun.
- Asymmetric extensions produce a directional difference; mirroring the sun and swapping extensions restores equality.
- Growing the relevant-side extension does not reduce shaded area.
- 100 m side extensions reproduce the analytical infinite-width fraction `sqrt(2)/2` for D=1 m, e=45°, beta=45°, H=2 m.
- Behind-facade and exact/near-grazing cases return finite values and fractions within 0–1.
- Focused result: direct-shadow/orientation 2 files / 22 tests; typecheck and whitespace check PASS.

## Wave 5 — Weather integration

Performed: `2026-09-13` (Asia/Tokyo)

- Added `facade-v1-weather` without changing `src/weather/**` or `src/engine/weather-v1/**`.
- Reuses M2 NOAA solar position and full-year calendar normalization; interval radiation remains `Wh/m² interval` and is converted to kWh exactly once.
- Result retains normalized facade azimuth, opening/overhang input, dataset ID, weather provenance, and all model identities.
- Direct: `finite-rectangular-overhang-shadow-polygon-v1`; diffuse: `isotropic-2d-infinite-width-v1`; ground: `ghi-ground-reflection-0.5-v1`.
- Behind-facade direct beam is zero; finite direct shade, 2D diffuse reduction, and unshaded ground reflection are separate components.
- C1 synthetic D=0 produces exact M2/M3 monthly and period summaries.
- Focused result: weather/direct/orientation 3 files / 26 tests; typecheck and whitespace check PASS.

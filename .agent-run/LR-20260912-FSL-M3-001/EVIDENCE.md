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

## Wave 6 — Regression / comparison / real smoke

Performed: `2026-09-13` (Asia/Tokyo)

### Baseline regression

- M1 originals retain 16,835 / 22,635 bytes and SHA-256 `EF896E0D...D4CB5` / `B3C2C8E...CD6C4`.
- M1 Golden hash guard PASS.
- `src/weather/**` and `src/engine/weather-v1/**` have no diff from `origin/main`.
- M2 parser, Local Standard Time, NOAA 365/366 references, and interval accounting remain in the passing suite.
- Full suite after extending the boundary test: 11 files / 86 tests PASS. The initial run correctly exposed the M2 milestone string in the status assertion; only that status assertion and recursive scan scope were updated, then the suite passed.

### C1–C3

- C1 D=0: M2 and M3 synthetic monthly/annual/cooling/heating results are exactly equal.
- C2 at D=1 m, H=2 m, e=45°, beta=-45°, DNI=100 Wh/m²: exact wide M3 shaded fraction `0.7071067812`, direct with overhang `14.6446609407 Wh/m²`; M2 20-strip shaded fraction `0.7`, direct `15.0000000000 Wh/m²`. The difference is the declared polygon-versus-strip discretization boundary.
- C3 at the same sun with opening-width overhang: finite shaded fraction `0.5303300859`, direct `23.4834957055 Wh/m²`; the very-wide values above demonstrate the finite-side effect.

### Real EPW local smoke — PASS

- Dataset: EnergyPlus Tokyo Hyakuri IWEC; EPW SHA-256 `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`.
- Parser: 8,760 intervals, `full-year-8760`, zero issues.
- Geometry: opening 6 m × 2.4 m; overhang D=1.6 m, O=0.3 m, left/right extension 0.5 m; SHGC 1; ground reflectance 0.2.

| Facade azimuth | With overhang [kWh] | Without [kWh] | Reduction |
| ---: | ---: | ---: | ---: |
| 0° North | 5,258.38 | 7,252.96 | 27.50% |
| 90° East | 6,785.24 | 10,116.22 | 32.93% |
| 180° South | 8,579.93 | 13,610.63 | 36.96% |
| 270° West | 7,016.10 | 10,497.24 | 33.16% |

- All four simulations completed with finite summaries and retained the exact dataset provenance object.
- Raw EPW/ZIP/license and the temporary smoke test remain ignored under `.local-validation/`; none is committed.

## Wave 7 — Documentation / minimal status

Performed: `2026-09-13` (Asia/Tokyo)

- Added `docs/FACADE_GEOMETRY.md` with the coordinate/azimuth derivation, opening and overhang contracts, Legacy H/D/O/W mapping, wall-projection equations, exact clipping/area method, analytical references, validation boundary, model identities, limitations, and M4/M5 boundary.
- Synchronized README, repository guidance, roadmap, limitations, and validation plan to M3 without adding simulator controls, chart, comparison, export, or upload UX.
- Changed only the milestone/status copy in the React shell. Local in-app browser rendered `M3 · FACADE GEOMETRY`, `M3 foundation`, engine milestone `M3`, and the not-validated scope warning.
- After validation-test coverage was made explicit, full suite 11 files / 86 tests, typecheck, and build PASS.
- No Vercel, Production, external upload, or repository mutation occurred during the local UI check.

## Wave 8 — Full convergence / self-review

Performed: `2026-09-13` (Asia/Tokyo)

Verification anchor: implementation/documentation head `741eb372b5fbb2bbcfe40bb9969d13e9dc5cf249`. The evidence-only checkpoint commit that contains this section is intentionally not described as the implementation head; required commands are rerun after it.

| Check | Fresh result | Result |
| --- | --- | --- |
| `origin/main` | `c3f314134137da9b35b4cde53320a610bba15f72` after fetch | PASS |
| `npm test` | 11 files / 86 tests | PASS |
| M3 focused | 6 files / 41 tests | PASS |
| M2 regression | 4 files / 32 tests | PASS |
| `npm run typecheck` | no diagnostics | PASS |
| `npm run build` | 49 modules; Vite production build | PASS |
| `npm audit` | 0 vulnerabilities | PASS |
| `npm run golden:check` | source-hash-guarded fixture verified | PASS |
| `git diff --check origin/main...HEAD` | no findings after immutable snapshot whitespace attribute | PASS |
| M2 source boundary | no diff in `src/weather/**` or `src/engine/weather-v1/**` | PASS |
| Local real EPW | 1 local-only smoke / 8,760 intervals / four cardinal facades | PASS |

### Integrity

- M1 HTML workspace and committed blob: 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`.
- M1 handover workspace and committed blob: 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4`.
- M3 Task Packet workspace and committed blob: `AFF8B77962787C01B61FE059353FE33B7B3FC9971A1BD126313A1547660DDACB`.
- The snapshot's normalized final LF is immutable. A path-specific `.gitattributes` `-whitespace` rule prevents `blank-at-eof` from invalidating the required range check without changing snapshot bytes or digest; all other changed files remain checked.

### Public repository / scope

- Token/private-key pattern scan: no findings.
- Personal absolute-path scan: no findings. Historical localhost development URLs are non-secret local evidence.
- Tracked external-data scan contains only `tests/fixtures/weather/synthetic-hourly.epw` and `synthetic-subhour.epw`; no raw real EPW, ZIP, or external license is tracked.
- Package manifests/dependencies are unchanged. `src/app/App.tsx` contains status copy only; no comparison, chart, export, upload, simulator, M4, Vercel, or Production implementation was added.
- Local dataset stayed under ignored `.local-validation/`; its EPW SHA-256 remains `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`.
- Self-review found no Blocking defect. Accepted limitations remain finite-width diffuse omission, midpoint solar sampling, and unvalidated absolute `[kWh]`.
- Local `main` remains untouched at `a4c90163725f8a9d610aaaeac24057facc0b2fa9`; only `origin/main` was read/fetched.

## Wave 9 — Draft PR

Recorded: `2026-09-13` (Asia/Tokyo)

- PR: `#4` — `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/4`.
- State after creation: `OPEN / Draft / Ready=false / merged=false`.
- Base: `main @ c3f314134137da9b35b4cde53320a610bba15f72`.
- Head reviewed by Independent FULL Review: `feat/m3-facade-geometry @ e63f73a97d6488aa1df6a6ff870e8cff5a5cde88`.
- At reviewed head: 9 commits / 39 changed files.
- No Ready, merge, Vercel, Production, M4, or `main` mutation occurred.

## Wave 10 — Independent FULL Review Required Fix

Performed: `2026-09-13` (Asia/Tokyo)

- Previous reviewed head: `e63f73a97d6488aa1df6a6ff870e8cff5a5cde88`.
- Verified implementation checkpoint: `2bf672493632e217afe05f0f0078ca4f150579d7`; the following artifact-only checkpoint is followed by a fresh final-head rerun before normal push.
- RF-01: synchronized `RUN_STATE.md`, `TASK_QUEUE.md`, and `EVIDENCE.md` to existing PR #4. Resume behavior explicitly prohibits recreating PR #4, Ready, merge, Vercel, and M4; next gate is Focused Independent Re-Review.
- RF-02: replaced only the inaccurate `右手系` documentation label and explicitly stated that the defined `+x/+y/+z` axes are not a standard right-handed xyz basis.
- Cross-document scan outside the immutable Task Packet found no other right-hand claim. The only remaining `right-handed` occurrence is the new explicit negation.
- Coordinate axes, sun-vector equation, wall-projection equation, geometry code, polygon code, tests, and analytical expected values were not changed.

| Check | Fresh result at implementation checkpoint | Result |
| --- | --- | --- |
| `npm test` | 11 files / 86 tests | PASS |
| M3 focused geometry / orientation / finite width | 6 files / 41 tests | PASS |
| M2 regression | 4 files / 32 tests; M2 source has no diff | PASS |
| `npm run typecheck` | no diagnostics | PASS |
| `npm run build` | 49 modules; Vite production build | PASS |
| `npm audit` | 0 vulnerabilities | PASS |
| `npm run golden:check` | M1 hash-guarded fixture verified | PASS |
| `git diff --check origin/main...HEAD` | no findings | PASS |
| Local real EPW smoke | 1 test / 8,760 intervals / N-E-S-W finite results | PASS |
| Privacy / secret scan | no token, private-key, or personal absolute-path findings | PASS |
| Licensed-data scan | only two synthetic EPW fixtures tracked; raw real EPW/ZIP/license absent | PASS |
| Scope | only coordinate wording plus M3 Run Artifact changes; no M4 or runtime implementation | PASS |

- M1 HTML: 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`.
- M1 handover: 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4`.
- M3 Task Packet remains immutable at `AFF8B77962787C01B61FE059353FE33B7B3FC9971A1BD126313A1547660DDACB`.

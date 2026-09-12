# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M1-001`
- Revision: `1`
- Snapshot SHA-256: `BEF00BD0BA6B96A027EB6BE7BB5186B38244B4BEEA1B16FA0F38C64D6FC22B07`

## Wave 0 — Resume preflight / M0 closeout

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Fresh `origin/main` | `b633a2b9651b63ea1224f8a4becefa1062a6b12d` | PASS |
| Expected merge | PR #1 squash merge commit and canonical base match | PASS |
| Working branch | `feat/m1-engine-baseline` from exact `origin/main` | PASS |
| Pre-existing worktree | Only the two Human-provided untracked originals were present | PASS |
| HTML intake metadata | 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` | PASS |
| Handover intake metadata | 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` | PASS |
| Initial Git attributes | Generic `*.html` / `*.md` LF normalization applied | RISK FOUND |
| Preservation boundary | Path-specific `-text` rules added before either original is staged | PASS |
| Source mutation | Workspace sizes and hashes unchanged after boundary change | PASS |
| M0 closeout | Historical evidence preserved; M0 marked `COMPLETE_VERIFIED / HUMAN_CLOSEOUT` | PASS |
| Task Packet binding | Public-safe LF snapshot digest above | PASS |

## Public repository boundary

- The M1 Task Packet contains no user-specific absolute path.
- No legacy source content was reformatted, normalized, or reconstructed.
- No credential, permission, main, Vercel, Production, release, or M2 mutation occurred in Wave 0.

## Wave 1 — Byte-preserving legacy source intake

Performed: `2026-09-12` (Asia/Tokyo)

| Artifact / check | Workspace | Staged bytes | Committed blob | Result |
| --- | --- | --- | --- | --- |
| `solar_overhang_simulator.html` | 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` | 16,835 bytes / same SHA-256 | same SHA-256 | PASS |
| `HANDOVER_solar_overhang_simulator.md` | 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` | 22,635 bytes / same SHA-256 | same SHA-256 | PASS |
| Git text normalization | Path-specific `-text` | Index preserves workspace bytes | Checkout preserves blob bytes | PASS |
| Required diff whitespace | Originals use path-specific `-whitespace`; authored files remain checked | `git diff --cached --check` has no findings | Recheck after commit required | PASS |

Staged bytes were materialized independently with `git checkout-index --temp` and hashed. The original workspace files were not rewritten, formatted, or normalized.

## Wave 2 — Independent original-source reference harness

Performed: `2026-09-12` (Asia/Tokyo)

- `scripts/generate-legacy-v01-golden.mjs` reads the immutable HTML bytes and refuses execution unless SHA-256 is `EF896E0D...D4CB5`.
- The script extracts the actual block from `const ASHRAE=` through the marker immediately before drawing code, then executes that exact source in a Node.js `vm` context.
- Only original `decl`, `hourGain`, `simulate`, and `summarize` functions generate the fixture; the new TypeScript engine is not imported or called.
- `node scripts/generate-legacy-v01-golden.mjs --check` reproduced `tests/fixtures/legacy-v01-golden.json` byte-for-byte.
- G1 reference sanity: annual no-overhang `25890.12... kWh`, annual reduction `44.05...%`, cooling reduction `57.95...%`, heating reduction `35.13...%`.
- G2–G6 reference cases include no-overhang, azimuth symmetry, width scaling, eta scaling, fixed `D/H + O/H` similarity, and the deliberately non-similar fixed-`O` regression.

## Wave 3 — Pure TypeScript legacy engine

Performed: `2026-09-12` (Asia/Tokyo)

- Added `src/engine/legacy-v01/{constants,types,solar,shading,simulation,index}.ts` and exposed the API from `src/engine/index.ts`.
- Public calculation API: `simulateLegacyV01`, `simulateLegacyV01Monthly`, `summarizeLegacyV01`, and `calculateLegacyHourlyGain`.
- Units and conventions are explicit at the type boundary: metres, degrees north, south-zero/west-positive azimuth, kWh, and percent.
- ASHRAE constants, month days, representative days, 20 strips, quarter-hour midpoint sampling, shadow comparison, sky view factor, and period month sets preserve original semantics and operation order.
- Engine manifest states `legacy-baseline` and `not-validated-physical-model`.
- `npm run typecheck`, the current manifest test, reference fixture check, and authored-file whitespace check pass before checkpointing.

## Wave 4 — Golden comparisons / dependency boundary

Performed: `2026-09-12` (Asia/Tokyo)

- 15 tests in 2 files pass.
- Every monthly with/without-overhang value and annual/cooling/heating value for all eight fixture records matches the independent original-source reference within `1e-9` absolute tolerance.
- G1 matches the source-derived default baseline; no sanity value was hand-entered as expected data.
- G2 has exact zero reduction for `D=0`.
- G3 matches at surface azimuth `-30 deg` and `+30 deg`.
- G4 and G5 scale absolute values by one half while preserving reduction rates.
- G6 preserves reduction rates only when both `D/H` and `O/H` are fixed; keeping `O` unscaled produces a materially different result.
- `tests/engine-boundary.test.ts` recursively scans raw `src/engine/**/*.ts` executable source and fails on React/React DOM module dependencies, DOM globals, Canvas types, or `navigator`.
- `QD-M1-001`: RESOLVED.

## Wave 5 — Documentation / minimal status

Performed: `2026-09-12` (Asia/Tokyo)

- Updated `README.md`, `AGENTS.md`, `docs/ROADMAP.md`, `docs/MODEL_LIMITATIONS.md`, and `docs/VALIDATION_PLAN.md` for the M1/M2 boundary.
- Added `docs/LEGACY_BASELINE.md` with source hashes, parameter mapping, units, conventions, reference method, fixture cases, tolerance, known issues, and M2 boundary.
- Updated only milestone/status copy in the existing React shell; no simulator inputs, chart, section drawing, or output UI was added.
- Browser verification at `http://127.0.0.1:5175/` showed `M1 · ENGINE BASELINE`, engine milestone `M1`, the Legacy baseline warning, and no Vite error overlay.
- `npm test`, `npm run typecheck`, `npm run build`, and `npm run golden:check` pass before checkpointing.

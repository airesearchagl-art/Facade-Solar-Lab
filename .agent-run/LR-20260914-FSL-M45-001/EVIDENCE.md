# Evidence

Binding: `LRP-20260914-FSL-M45-001` rev `1` / `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`

## Fresh Gate

- `origin/main`: `35f543e618b8ad70ecc746b3139a5fb09adbeca9`
- PR #5: `MERGED`
- PR #6: `MERGED`
- Created `feat/m45-multifloor-mode` from exact canonical main with a clean working tree.
- Baseline: 21 test files / 128 tests, typecheck, build, audit, Golden, and diff check PASS.

## Implementation evidence

- `src/multifloor/**` contains the browser-independent Case/Floor, validation, adapter, simulation, aggregation, delta, preset, state, demo, and CSV boundaries.
- Each Floor is converted to canonical `FacadeV1Parameters`; `simulateFacadeV1()` remains the calculation authority.
- Single and Multi Workspaces remain separately mounted so switching mode does not convert or discard their state.
- Multi-floor inputs reject invalid/non-finite geometry without silent clamping and disable Run until valid.
- Building-level annual/summer/winter/monthly results are simple Floor sums; Floor Breakdown retains per-Floor results.
- Multi-floor demo uses deterministic synthetic weather and explicitly states it is not measured data or validation evidence.
- Stacked elevation/section uses existing geometry conventions and existing solstice reference calculation for the selected Floor.
- Multi-floor CSV uses BOM, CRLF, escaping, and formula protection. Multi-floor JSON uses new schema-version-1 input-only kinds and clears results after import.

## Verification status

- Full regression: 25 test files / 144 tests PASS.
- New focused domain/preset/CSV/UI/boundary: 6 files / 19 tests PASS.
- TypeScript typecheck: PASS.
- Production build: PASS; Vite transformed 85 modules.
- `npm audit`: PASS; 0 vulnerabilities.
- M1 Golden: PASS against original HTML hash `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`.
- M1 originals: HTML `EF896E...` and handover `B3C2C8...` unchanged.
- M4 Task Packet: `5A3288DF4A540EB7E40AF42E7D5D84505B6B06F61698C06F9D043A38DD4003E8` unchanged.
- M4.5 Task Packet and immutable snapshot: byte-identical; SHA-256 `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`.
- `git diff --check`: PASS.
- Local-only real EPW smoke: Tokyo Hyakuri IWEC hash `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`; 8,760 intervals; two Building Cases / three Floors each; all period/month results finite; PASS. Raw data remained ignored and uncommitted.
- Local browser smoke: Single mode visible; Multi deterministic demo completed; 2 Cases / 3 Floors; Building Total / monthly values and deltas / Floor Breakdown visible; Floor add/duplicate/delete passed; edit set stale and disabled CSV; explicit rerun updated results; mode switching preserved Multi state.
- Responsive browser smoke: 390 px viewport; two mode controls visible; document width stayed within viewport; stacked geometry collapsed to one column.
- Local app-origin console error/warning: 0. Loaded Vite module assets: PASS; blank page: no.
- Final branch SHA, Git-triggered Preview deployment/URL/target/READY/source, and Draft PR state are verified after this repository checkpoint and recorded in the PR/current completion report. Resume must query them fresh rather than infer from this artifact.
- Real-EPW native Multi-floor browser workflow and exported PDF/CSV content remain Human UX verification items; synthetic demo is not a substitute for physical validation.

## Mutation boundaries

- `main`: none.
- Production: none.
- M5: not started.
- Branch deletion: none.

## Human UX Follow-up 01 — 2026-09-14

### Fresh gate and findings

- Starting local/remote/PR head: `6cae598818aa6208600d132fe5854a37e8da157c`.
- Base after fetch: `35f543e618b8ad70ecc746b3139a5fb09adbeca9`; clean working tree; PR #7 OPEN / Draft / merged=false.
- UX-01 reproduced at 390 × 844: the ordinal span immediately preceded the bare Floor name, producing visible `11F`, `22F`, `33F`. Three 118px-minimum buttons also overflowed their narrow strip. This is a markup/layout defect; reducing font size does not solve it.
- Table-cell overlap was not reproduced at 390px; the table boundaries were distinct. SVG names and floor heights previously shared a very small text run. These now use explicit independent gutters.
- UX-02: prior stacked section drew only selected-floor seasonal references.
- UX-03: prior Floor Breakdown exposed only one Case's floor results.
- UX-04: prior Floor monthly output was table-only.
- Previous browser-smoke PASS did not establish the Human UX acceptance of these four issues and is superseded for those findings.

### Implementation and local verification

- Floor selector: separate block rows for name and story position; wrapping grid. At 390px all three names were independently readable, without a horizontal label collision.
- SVG: name gutter, drawing region, and dimension gutter; 16px name labels. References use the existing `createFacadeSolsticeReferences()` for every overhang floor and translate start/intersection by the cumulative base Z. No new solar formula.
- Three-floor demo: six seasonal rays, including nonselected floors. Fixture with no first-floor overhang: only Floor 2/3 rays. Start/intersection absolute Z tests PASS.
- Story comparison: ordered position from bottom, never ID/name matching. Annual/summer/winter deltas are unavailable when either corresponding floor is missing.
- Monthly charts: three Floors × twelve saved monthly values; selected Floor highlighted. Optional same-story multi-Case monthly chart uses a switch. Legends wrap; exact tables remain accessible.
- Browser local checks at 1440 × 1000 and 390 × 844: names, gutters, all-floor rays, story comparison, 36 monthly points, mode switch, Floor add/delete and stale/rerun PASS. A new fourth floor displayed the baseline as absent with unavailable delta; after deletion the comparison selector remained valid.
- Full convergence: 26 test files / 150 tests PASS; typecheck PASS; build PASS (88 modules); Golden PASS; npm audit 0 vulnerabilities.
- Existing Tokyo Hyakuri IWEC smoke: SHA-256 `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`, 8,760 intervals, zero parse issues, 2 Cases × 3 Floors, all period/month values finite. No EPW download, redistribution, or source modification.
- Existing Building Total, Floor values, single-floor regression, one-floor equivalence, CSV and presets retain their existing tests/expectations.

### Print evidence boundary

- Local print-layout fixture uses the actual results/geometry React components, deterministic 3-floor / 2-Case results, and the repository print stylesheet. An isolated static HTML-to-PDF render produced five A4 pages.
- All five pages were rendered to images and inspected: Building Total, Building monthly chart/table, all story comparison tables, both Floor Breakdowns/monthly charts, all-floor rays and model warning present. No text overlap, chart/legend clipping, orphan heading, or geometry cut-off observed in this fixture.
- This is local print-layout evidence, not a PDF saved from the exact Vercel Preview.
- The available browser surface does not expose the native Chrome print/save dialog; tab content export also reports unsupported. Native final-Preview PDF save/inspection remains HUMAN VERIFICATION REQUIRED. Do not claim that gate PASS from local rendering alone.
- UX-01 through UX-04 are implemented and AWAITING HUMAN RE-CHECK. They are not CLOSED / PASS without Human evidence.
- Final exact-source Git Preview identity and fresh PR #7 state are recorded externally in the PR/completion report after this checkpoint. Resume must resolve them live; do not add a self-referential head SHA to this file.

## Human UX Follow-up 02 — 2026-09-14

### Fresh gate and Human findings

- Starting local/remote/PR head: `ec18c15e7255177c24d5be3b3c789bc3198c6e7f`.
- After fetch, base `35f543e618b8ad70ecc746b3139a5fb09adbeca9`, clean working tree, PR #7 OPEN / Draft / merged=false all matched.
- Human explicitly confirmed UX-01, UX-03, UX-04 CLOSED / PASS and UX-02 all-floor display PASS. These supersede their historical pending states above.
- Human reported UX-05 in both UI and PDF: deep-overhang reference rays continued below their own floor into the next floor. This is a visualization defect, not evidence of inter-floor shading physics.

### Display-only correction

- Pure TypeScript `clipFloorReferenceRay()` retains `rawIntersectionZM` and separately computes `displayEndZM`, `displayEndDepthM`, and `wasFloorClipped`.
- For a below-base endpoint, `t = (baseZM - startZM) / (rawIntersectionZM - startZM)` and display depth is `depthM * (1 - t)`. The SVG uses that depth as well as the boundary Z; it does not replace the endpoint with wall depth zero.
- The tip must be within its floor band. Non-finite input, invalid band/depth, overflowing/zero interpolation denominator, and out-of-segment interpolation are rejected with `null`; in-band horizontal/zero-depth segments need no division.
- Both screen and report use the same calculated endpoint and state that floor-band clipping is not mutual shading by upper/lower-floor overhangs.
- Canonical engine, solar reference equations, Building/Floor aggregation, monthly/delta values, CSV and preset implementation are unchanged. No new physical calculation or cross-floor occlusion.

### Verification

- `npm test`: PASS — 27 files / 158 tests. The eight new Pure TS tests cover in-band/no clipping, exact floor-base clipping, independently hand-derived collinearity, top/base boundaries, non-finite and overflow safety, all three floor bands for both 6/21 and 12/21, and no-overhang exclusion.
- Existing raw-reference expected values are unchanged; the old absolute-intersection assertion now explicitly reads `rawIntersectionZM`.
- Typecheck PASS; build PASS (88 modules / dist); Golden PASS; npm audit 0 vulnerabilities; diff check PASS.
- Deterministic synthetic 2-Case / 3-Floor output SHA-256 digests were measured before and after the product edit and match exactly:

| Output | Before = after SHA-256 |
| --- | --- |
| Complete simulation result (including deltas) | `77766a9d8a4b6cdaa074521090c5936af1267563b46133bf553fd70ce7454081` |
| Building Total | `ba65f1c54889365881cd06b9e6e4e02813332713ffa1d94fc4a80d13cd92a64d` |
| Floor results | `d252fc9203d358c2b146f77337ea4f9cc009e031af5fe9a44f780b60d2defdc6` |
| Floor monthly values | `86c28dc25c9b2fd878b326c8ee45fca26bceb087cfcdcea7d1779ccd2e35fd65` |
| CSV bytes | `52c34074c32b27293bcf61508065abbcffe9154da2d3512b385c42b3a1a9062f` |
| Workspace preset bytes | `3150771c6c068c98fc9b27fca6fde5d4b677e57e0b6797af9aa5f7bcc5791cb3` |

- Existing single-floor, one-floor exact equivalence, M1/M2/M3, Building Total/Floor/monthly, CSV and preset regression tests PASS. No expected simulation values were rewritten.
- Local browser: Case B with three floors; all six references visible. Summer endpoints stop at Z 0 / 3.8 / 7.6 m, with nonzero display depth; normal winter intersections stay unchanged. With 3F depth increased to 20 m, both its seasonal rays stop at its 7.6 m base. Desktop and 390px viewport layout checked; no horizontal document overflow; app-origin fatal errors 0. An unrelated extension-origin Sentry error is excluded.
- Local print-layout fixture uses actual result/geometry components and print CSS. All five A4 pages were rendered and visually inspected; Case B depths 10/15/20 m exercise both seasonal rays clipped at every floor. Labels, monthly charts, tables, clipped rays and model disclaimer are present without overlap/cut-off.
- This PDF is a local static print-layout check, not a PDF saved from the exact product Preview. Post-fix Human UI/PDF re-check remains pending.
- Tokyo Hyakuri smoke was not rerun: this change only affects display endpoints, with complete output digest equality and existing regressions PASS. No EPW download or external weather redistribution.

### Historical Follow-up 02 gate — superseded by Human acceptance below

- UX-01 / UX-03 / UX-04: CLOSED / PASS; UX-02: CLOSED / PASS for all-floor display.
- UX-05: FIXED / HUMAN_RECHECK_PENDING, not CLOSED / PASS.
- Final exact-source Git Preview and PR metadata are verified after the repository checkpoint and recorded in the PR/completion report. Resolve them live; do not repeat push/deploy merely to record this document's own commit SHA.
- Existing PR #7 stays OPEN / Draft; Ready=false; no merge, main write, Production mutation, branch deletion or M5.

## Human UX Acceptance Sync — 2026-09-14

- Evidence source: Human's explicit M4.5 Human UX Acceptance Sync instruction, following exact-head Preview re-check.
- Accepted exact product head: `0888b66646db328f5d8292bc53aa480a64c61239`.
- Fresh Gate: after fetch, local HEAD, origin feature branch and PR #7 head matched that product SHA; `origin/main` and PR base matched `35f543e618b8ad70ecc746b3139a5fb09adbeca9`; working tree clean; PR OPEN / Draft=true / merged=false.
- Human UX Review: PASS.
- UX-01 Floor label overlap: CLOSED / PASS.
- UX-02 All-floor solar ray display: CLOSED / PASS.
- UX-03 Floor-by-Floor Case Comparison: CLOSED / PASS.
- UX-04 Floor monthly charts: CLOSED / PASS.
- UX-05 Floor-local solar reference ray clipping: CLOSED / PASS.
- Human confirmed: 3F rays do not enter 2F; 2F rays do not enter 1F; 1F rays do not extend below the building base; no unnatural ray-angle change; reference rays are appropriately bounded per floor.
- These Human results supersede the historical UX re-check-pending statuses without deleting their audit history. This acceptance records the stated Preview checks, not additional native real-EPW/PDF/CSV tests that were not reported.
- Calculation engine changes: none. Cross-floor physical shading: not implemented. Reference ray clipping: visualization only.
- This synchronization changes mutable Run Artifacts only; product source diff 0 against the accepted product head. Full npm test/build were not rerun, as authorized for this docs-only sync; the 158-test product checkpoint above remains historical evidence at the accepted product SHA.
- Validation: `git diff --check` PASS; only mutable Run Artifact changes; immutable Task Packet SHA-256 remains `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`.
- The later docs-only live HEAD is the Independent FULL Review handoff head, not a replacement for the fixed Human-accepted product checkpoint. After normal push, resolve local/origin/PR head equality externally; no self-referential commit SHA is embedded here.
- Current state: INDEPENDENT_REVIEW_PENDING. Independent FULL Review is not performed by this implementation session. Existing PR #7 remains Draft; Ready, merge and auto-merge unauthorized.
- Manual Preview/Production mutation: none. Main mutation: none. Branch deletion: none. M5: NOT STARTED.
- Human Gate: STOP — Independent FULL Review.

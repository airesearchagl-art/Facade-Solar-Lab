# Run State

## Identity

- Run ID: `LR-20260913-FSL-M4-001`
- Mode: `LONG_RUN_ENDURANCE`
- Horizon: `EXTENDED`
- Current state: `BLOCKED_BROWSER_ACCEPTANCE`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m4-comparison-ux`
- Base SHA: `46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215`
- Current head: resolve live `HEAD`; last verified pre-follow-up checkpoint is `018a5a5d0f86d6dee486407e56a42c6c85dc8755`
- Current wave: `Human UX Review follow-up — Report Geometry & JSON Presets`
- Last successful checkpoint: PR #5 Design Insight & Export exact head `018a5a5d0f86d6dee486407e56a42c6c85dc8755`
- Task Packet ID: `LRP-20260913-FSL-M4-001`
- Task Packet revision: `1`
- Task Packet snapshot path: `.agent-run/LR-20260913-FSL-M4-001/TASK_PACKET_SNAPSHOT.md`
- Task Packet SHA-256: `5A3288DF4A540EB7E40AF42E7D5D84505B6B06F61698C06F9D043A38DD4003E8`

## Objective

Build a browser-local Facade Comparison Workspace for one to four facade cases using the existing EPW parser and `facade-v1-weather` engine, with explicit Run Comparison, period and monthly comparisons, baseline deltas, geometry explanations, provenance, and model limitations.

## Acceptance Criteria

1. [x] Exact base confirmed: `origin/main @ 46f3aabe...`.
2. [x] Immutable M4 Task Packet and digest recorded.
3. [x] Resume-capable Run Artifact initialized.
4. [x] Historical M3 artifact synchronized to merged/complete.
5. [x] M4 branch isolated from exact canonical main.
6. [x] Initialization deployment is Git-triggered Preview with no Production alias mutation.
7. [x] Browser-local EPW load implemented.
8. [x] Weather provenance displayed.
9. [x] Pure domain and UI enforce one-to-four Case management.
10. [x] Deterministic Duplicate Case operation and UI implemented.
11. [x] Baseline selection and deletion reassignment implemented.
12. [x] Geometry inputs implemented.
13. [x] Overhang enable/disable implemented.
14. [x] SHGC input implemented.
15. [x] Ground reflectance input implemented.
16. [x] Explicit Run Comparison implemented.
17. [x] Annual KPI displayed.
18. [x] Summer KPI displayed.
19. [x] Winter KPI displayed.
20. [x] Baseline delta model and UI implemented.
21. [x] Monthly comparison chart implemented.
22. [x] Accessible monthly values table provided.
23. [x] Section geometry visualization implemented.
24. [x] Front geometry visualization implemented.
25. [x] Baseline input difference model and UI implemented.
26. [x] Assumptions and model identity displayed.
27. [x] Absolute-kWh warning displayed.
28. [x] No automatic “optimal” judgment introduced.
29. [x] Pure validation model and UI messages implemented.
30. [x] M1 baseline regression passed at final product checkpoint.
31. [x] M2 baseline regression passed at final product checkpoint.
32. [x] M3 baseline regression passed at final product checkpoint.
33. [x] M4 focused tests pass — 4 files / 19 tests.
34. [x] Typecheck passed at final product checkpoint.
35. [x] Build passed at final product checkpoint — 59 modules.
36. [x] Audit passed at final product checkpoint — 0 vulnerabilities.
37. [x] Golden passed at final product checkpoint.
38. [x] Diff check passed at final product checkpoint.
39. [x] Privacy/raw-EPW/secret scan passes.
40. [ ] Final browser acceptance is blocked pending Human Manual Verification of the OS-backed EPW flow.
41. [x] Draft PR #5 created.
42. [x] Human Gate reached after Draft PR.

## Completed

- Read the canonical Long-Run route and template from `obsidian-vault/main`.
- Fetched `origin`; verified exact base, clean worktree, absent M4 branch, and untouched Vercel smoke ref.
- Passed the M3 baseline: 11 files / 86 tests, typecheck, 49-module build, zero-vulnerability audit, Golden, diff check, and both M1 source hashes.
- Created `feat/m4-comparison-ux` from the exact canonical base.
- Saved byte-identical Task Packet and immutable snapshot files and bound their SHA-256.
- Synchronized M3 historical state and the roadmap on the M4 branch only.
- Pushed initialization checkpoint `85181a4...`; Vercel created exactly one Git Preview at `dpl_4juDN8...`, `target=null`, `READY`, exact branch and source SHA.
- Added browser-independent case operations, comparison runner, period/month deltas, input differences, formatting, validation, and recursive comparison boundary coverage.
- Added the browser-local EPW adapter, full Case editor, explicit simulation, period and monthly comparison, SVG geometry explanations, assumptions, and validation warning UI.
- Re-ran 15 files / 105 tests and focused M1/M2/M3/M4 suites; typecheck, 59-module build, audit, Golden, and diff checks pass.
- Reused the ignored Tokyo Hyakuri IWEC EPW by verified hash for a local-only smoke: 8760 intervals, two cases, 12 months, finite KPI/delta, and exact direct `simulateFacadeV1` agreement.
- Exercised the local browser shell, duplicate/edit/invalid-input behavior, visible geometry/disclosures, layout bounds, and console; no fatal error, asset failure, blank page, or overflow was observed.
- Pushed product checkpoint `cee63594dc26ebbdc35e7fbd319902378890384b`; Git Integration produced Preview `dpl_9hHmMp1LaYeVYzEvgN7e5n5VWfao`, `target=preview`, `READY`, exact branch and source, with the Vite 59-module build in `dist`.
- Verified the final Preview initial state and interactive Case edit path in authenticated Chrome. App-origin fatal console errors and observed asset 404s are zero; Production remained unchanged.
- Created Draft PR #5 at `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/5`; fresh GitHub metadata confirmed `OPEN`, `Draft=true`, `merged=false`, `Ready=false`, base `main @ 46f3aabe...`, and creation-checkpoint head `f28f5f088292f6d23cb823c864264e1658dd32ba`.
- Independent FULL Review at `aa602bbe...` classified the unverified OS-backed EPW acceptance path as a Required Verification. It is not PASS and cannot be closed without Human browser evidence.
- Added the bounded Human UX follow-up: explicit solar-heat-gain semantics, facade-relative 6/21 and 12/21 reference rays, browser print/PDF report layout, and Excel-editable safe CSV export. RF-01 remains open.
- Added the bounded Report Geometry & JSON Presets follow-up: A4 reports render every result Case in report order with section/elevation/reference rays; versioned Pure TypeScript Case/Workspace presets contain inputs only and require explicit rerun after import. RF-01 remains open.

## Current implementation state

The Report Geometry & JSON Presets follow-up is locally implemented and converged. Local browser round-trips and a rendered five-page A4 report pass. A normal push, exact-head Git Preview classification, remote browser verification, and PR-body sync remain. The run is still `BLOCKED_BROWSER_ACCEPTANCE`; Demo, PDF, CSV, and JSON presets do not close the Human real-EPW browser gate.

## Checks

- `npm test`: PASS — 21 files / 128 tests.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — Vite, 70 modules.
- `npm audit`: PASS — 0 vulnerabilities.
- `npm run golden:check`: PASS.
- `git diff --check`: PASS.
- M1 originals: PASS — both expected SHA-256 values.
- Focused suites: M1 2 files / 15 tests; M2 4 / 32; M3 5 / 39; M4 4 / 19.
- Real EPW smoke: PASS — 1 test; 8760 intervals; hash `3D3781E8...4612E`.

## Quality Debt

No deferred implementation debt. See `QUALITY_DEBT.md`.

## Explicit unverified items

- Actual OS-backed browser file selection is unverified because the available browser automation exposes no file-upload or native file-dialog operation.
- Narrow-viewport behavior is covered by responsive CSS inspection but not a separate physical mobile browser viewport.
- Remote weather provenance, explicit Run, Annual/Summer/Winter KPI, monthly chart, and baseline delta after actual browser file selection are unverified for the same file-attachment limitation.
- Human Manual Verification at the exact final Preview is required before RF-01 can close or the PR can become a Ready candidate.

## Known failures

None.

## Decisions

See `DECISIONS.md`.

## Files changed

- M4 Run Artifact and immutable Task Packet files.
- Historical M3 Run Artifact closeout fields only.
- Comparison/preset domains, browser adapter/UI/components/styles, tests, and M4 documentation.

## Remaining tasks

1. Commit and normally push the bounded Report Geometry & JSON Presets follow-up.
2. Classify and verify the exact-head Git Preview, then synchronize the existing PR #5 body.
3. Obtain Human Manual Verification of the complete browser EPW flow before closing RF-01.

## Next action

After the bounded push and PR-body evidence sync, stop for Report Geometry & Preset Human UX Review. Do not close RF-01.

## Stop conditions status

`BLOCKED_BROWSER_ACCEPTANCE` is active. Do not treat it as Quality Debt or PASS; do not mark Ready until Human evidence closes RF-01.

## Resume instructions

1. Verify repository, branch, `origin/main`, live `HEAD`, and clean/known working tree without rebasing.
2. Re-hash `TASK_PACKET_SNAPSHOT.md`; require exact digest `5A3288DF...003E8` and matching Manifest/State binding.
3. Read `TASK_QUEUE.md`, `QUALITY_DEBT.md`, `DECISIONS.md`, and `EVIDENCE.md`.
4. Confirm the current Vercel inventory and Production aliases before any push that may trigger a deployment.
5. PR #5 already exists. Do not recreate it or mark it Ready. Its body may be updated only to synchronize the authorized exact-head Preview evidence.
6. Keep RF-01 open until Human Manual Verification covers file selection → provenance → Run → KPI/chart/table/delta plus console/assets/mobile checks.
7. Await Focused Independent Re-Review; never merge, auto-merge, begin M5, delete the smoke ref/deployments/branch, or mutate Production.
8. Never create a manual Preview while the Git-triggered route works.
9. Do not claim an OS-backed EPW file selection until it is actually exercised; preserve the downstream result views as explicit unverified evidence.
10. Case/Workspace JSON presets are input-only. Never treat their round-trip as result or weather evidence, and always require an explicit comparison rerun after import.

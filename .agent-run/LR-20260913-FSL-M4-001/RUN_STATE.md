# Run State

## Identity

- Run ID: `LR-20260913-FSL-M4-001`
- Mode: `LONG_RUN_ENDURANCE`
- Horizon: `EXTENDED`
- Current state: `RUNNING`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m4-comparison-ux`
- Base SHA: `46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215`
- Current head: resolve live `HEAD`; last verified product checkpoint is `c8c3f7737d31079662120229ed37756533d373f3`
- Current wave: `Wave 9 — final Preview and artifact convergence`
- Last successful checkpoint: M4 product, regression, local browser, and local-only real-EPW convergence
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
40. [ ] Final browser verification passes or is recorded as explicit unverified and blocked.
41. [ ] Draft PR created.
42. [ ] Human Gate reached after Draft PR.

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

## Current implementation state

Product implementation and documentation are complete. Final Git Preview, its browser checks, artifact closeout, and Draft PR remain. The automation surface cannot attach a host file to a browser file input; actual browser file selection is therefore still explicit unverified evidence, although the same real EPW passed the browser adapter and full calculation path in a local-only Vitest smoke.

## Checks

- `npm test`: PASS — 15 files / 105 tests.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — Vite, 59 modules.
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
- Final exact-head Git Preview, remote browser verification, and Draft PR are pending.

## Known failures

None.

## Decisions

See `DECISIONS.md`.

## Files changed

- M4 Run Artifact and immutable Task Packet files.
- Historical M3 Run Artifact closeout fields only.
- Comparison domain, browser adapter/UI/components/styles, tests, and M4 documentation.

## Remaining tasks

Waves 9–10 in `TASK_QUEUE.md`.

## Next action

Commit this artifact convergence, push the final branch state, and classify the resulting Git Preview before any Draft PR action.

## Stop conditions status

No stop condition is active. A Production-classified Git deployment or Production alias drift will immediately block the run.

## Resume instructions

1. Verify repository, branch, `origin/main`, live `HEAD`, and clean/known working tree without rebasing.
2. Re-hash `TASK_PACKET_SNAPSHOT.md`; require exact digest `5A3288DF...003E8` and matching Manifest/State binding.
3. Read `TASK_QUEUE.md`, `QUALITY_DEBT.md`, `DECISIONS.md`, and `EVIDENCE.md`.
4. Confirm the current Vercel inventory and Production aliases before any push that may trigger a deployment.
5. Resume from `Next action`; never create a manual Preview while the Git-triggered route works, never delete the smoke ref, deployments, or branch, and never mutate Production.
6. Do not claim an OS-backed EPW file selection until it is actually exercised; preserve it as explicit unverified evidence if the automation boundary remains.

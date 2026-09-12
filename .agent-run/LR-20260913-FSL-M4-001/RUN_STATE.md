# Run State

## Identity

- Run ID: `LR-20260913-FSL-M4-001`
- Mode: `LONG_RUN_ENDURANCE`
- Horizon: `EXTENDED`
- Current state: `RUNNING`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m4-comparison-ux`
- Base SHA: `46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215`
- Current head: `46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215` before the initialization commit; resolve live `HEAD` after checkpoint creation
- Current wave: `Wave 1 — initialization push / Git-triggered Preview Hard Gate`
- Last successful checkpoint: M4 preflight at canonical base
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
6. [ ] Git-triggered deployment Hard Gate evaluated when a deployment first appears.
7. [ ] Browser-local EPW load implemented.
8. [ ] Weather provenance displayed.
9. [ ] One-to-four Case management implemented.
10. [ ] Duplicate Case implemented.
11. [ ] Baseline selection implemented.
12. [ ] Geometry inputs implemented.
13. [ ] Overhang enable/disable implemented.
14. [ ] SHGC input implemented.
15. [ ] Ground reflectance input implemented.
16. [ ] Explicit Run Comparison implemented.
17. [ ] Annual KPI displayed.
18. [ ] Summer KPI displayed.
19. [ ] Winter KPI displayed.
20. [ ] Baseline delta displayed.
21. [ ] Monthly comparison chart implemented.
22. [ ] Accessible monthly values provided.
23. [ ] Section geometry visualization implemented.
24. [ ] Front geometry visualization implemented.
25. [ ] Baseline input differences implemented.
26. [ ] Assumptions and model identity displayed.
27. [ ] Absolute-kWh warning displayed.
28. [ ] No automatic “optimal” judgment introduced.
29. [ ] Invalid input handling implemented.
30. [x] M1 baseline regression passed at preflight.
31. [x] M2 baseline regression passed at preflight.
32. [x] M3 baseline regression passed at preflight.
33. [ ] M4 tests pass.
34. [x] Typecheck passed at preflight; final rerun pending.
35. [x] Build passed at preflight; final rerun pending.
36. [x] Audit passed at preflight; final rerun pending.
37. [x] Golden passed at preflight; final rerun pending.
38. [x] Diff check passed at preflight; final rerun pending.
39. [ ] Final privacy/raw-EPW/secret scan passes.
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

## Current implementation state

M4 product implementation has not started. The initialization-only checkpoint is being prepared for the first push and Git-triggered Preview classification gate.

## Checks

- `npm test`: PASS — 11 files / 86 tests.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — Vite, 49 modules.
- `npm audit`: PASS — 0 vulnerabilities.
- `npm run golden:check`: PASS.
- `git diff --check`: PASS before initialization changes.
- M1 originals: PASS — both expected SHA-256 values.

## Quality Debt

None. See `QUALITY_DEBT.md`.

## Explicit unverified items

- Git-triggered Preview behavior for the real M4 initialization commit is not yet observed.
- M4 implementation, final regression, real-EPW browser flow, final Preview, and Draft PR are not yet complete.

## Known failures

None.

## Decisions

See `DECISIONS.md`.

## Files changed

- M4 Run Artifact and immutable Task Packet files.
- Historical M3 Run Artifact closeout fields only.
- `docs/ROADMAP.md` milestone state only.

## Remaining tasks

Waves 1–10 in `TASK_QUEUE.md`.

## Next action

Create the initialization-only commit, push it once, and apply the Vercel Git-triggered deployment Hard Gate before product implementation.

## Stop conditions status

No stop condition is active. A Production-classified Git deployment or Production alias drift will immediately block the run.

## Resume instructions

1. Verify repository, branch, `origin/main`, live `HEAD`, and clean/known working tree without rebasing.
2. Re-hash `TASK_PACKET_SNAPSHOT.md`; require exact digest `5A3288DF...003E8` and matching Manifest/State binding.
3. Read `TASK_QUEUE.md`, `QUALITY_DEBT.md`, `DECISIONS.md`, and `EVIDENCE.md`.
4. Confirm the current Vercel inventory and Production aliases before any push that may trigger a deployment.
5. Resume from `Next action`; never delete the smoke ref, deployments, or branch, and never mutate Production.

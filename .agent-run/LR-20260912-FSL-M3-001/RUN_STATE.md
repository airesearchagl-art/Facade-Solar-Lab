# Run State

## Identity

- Run ID: `LR-20260912-FSL-M3-001`
- Mode: `LONG_RUN_ENDURANCE`
- Current state: `COMPLETE_VERIFIED`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m3-facade-geometry`
- Base SHA: `c3f314134137da9b35b4cde53320a610bba15f72`
- Current head rule: resolve symbolic `HEAD` with `git rev-parse HEAD`; never embed the SHA of the commit containing this file
- Current wave: `Wave 12 — Post-merge closeout`
- Previous reviewed head: `e63f73a97d6488aa1df6a6ff870e8cff5a5cde88`
- Last verified implementation checkpoint: `2bf672493632e217afe05f0f0078ca4f150579d7`
- Pull request: `#4` — `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/4`
- Pull request state: `MERGED / merged=true`
- Merged main: `46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215`

## Task Packet binding

- Task Packet ID: `LRP-20260912-FSL-M3-001`
- Revision: `1`
- Snapshot: `.agent-run/LR-20260912-FSL-M3-001/TASK_PACKET_SNAPSHOT.md`
- SHA-256: `AFF8B77962787C01B61FE059353FE33B7B3FC9971A1BD126313A1547660DDACB`

## Objective

Build a deterministic Pure TypeScript facade-geometry foundation with a vertical facade, one rectangular opening, zero or one finite horizontal overhang, exact direct-shadow polygon clipping, and a new weather-integrated `facade-v1` path while preserving M1 and M2 baselines.

## Acceptance criteria

All 33 criteria in Task Packet section 38 must pass with evidence against the final branch head.

## Completed work

- Fresh `origin/main`, clean worktree, exact base, and absent target branch verified.
- M1 source hashes, M1 Golden, M2 47-test suite, and typecheck passed before branching.
- Branch created from exact canonical base.
- M2 post-merge closeout prepared without changing its immutable Task Packet.
- Public-safe M3 Task Packet snapshot created by replacing only the personal project root with `${PROJECT_ROOT}` and normalizing LF; digest bound above.
- Geometry contracts, validation, derived opening/overhang metrics, azimuth normalization, and facade-local sun-vector basis implemented.
- Shared geometry epsilon, adjacent-vertex deduplication, shoelace area, and Sutherland–Hodgman rectangle clipping implemented.
- Finite horizontal-overhang shadow polygon, wall projection, opening intersection, and bounded shaded/lit fractions implemented.
- All cardinal/intermediate rotations, mirror symmetry, asymmetric extensions, monotonic relevant-side extension, infinite-width limit, behind-facade, and grazing boundaries verified.
- New `facade-v1-weather` interval/simulation path implemented with explicit geometry/model identities and retained weather provenance.
- C1–C3, M1/M2 regression, recursive engine/weather/geometry boundary, and local real-EPW four-orientation smoke validation passed.
- Facade geometry coordinate, projection, clipping, weather-model identity, limits, validation plan, repository guidance, and minimal M3 status copy documented.
- Local browser rendered the M3 status and scope warning correctly.
- Exact implementation-head convergence passed: 86 full-suite tests, 41 M3-focused tests, 32 M2 regression tests, typecheck, build, audit, Golden, diff check, source/digest hashes, local real-EPW smoke, privacy, licensing, scope, and self-review.
- PR #4 was created from this branch to `main` and remains `OPEN / Draft / Ready=false / merged=false`.
- Independent FULL Review Required Fix synchronized the Run Artifact to existing PR #4 and corrected only the inaccurate right-handed coordinate label; coordinate signs, projection formula, implementation, and expected values remain unchanged.

## Current work

- M3 is merged and complete. Historical artifacts are closed on the authorized M4 branch without modifying the immutable M3 Task Packet.

## Required checks

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm audit`
- `npm run golden:check`
- `git diff --check origin/main...HEAD`
- Focused geometry/orientation/finite-width tests
- M1 hashes, M2 regression, optional local real EPW smoke, privacy/scope/licensed-data scans

## Quality debt

- See `QUALITY_DEBT.md`.

## Explicit unverified items

- Absolute weather-driven `[kWh]` remains not formally validated before M5.
- Finite-width 3D diffuse obstruction is not implemented in M3.

## Remaining tasks

- None for M3.

## Next action

Use the separate `LR-20260913-FSL-M4-001` Run Artifact for authorized M4 work. Do not resume or mutate the completed M3 campaign.

## Stop conditions

- Any Task Packet/base/M1 hash drift, M1/M2 regression, coordinate-sign ambiguity, unexplained rotation failure, invalid area/fraction, NaN/Infinity, required weather-v1 edit, licensed-data commit, privacy/security failure, user-change conflict, or scope expansion.

## Resume instructions

1. Treat this campaign as historical `MERGED / COMPLETE` at main `46f3aabe...`.
2. Re-hash the immutable M3 Task Packet if auditing this record; never edit it.
3. Preserve M1/M2 baselines, coordinate signs, projection formula, and expected values.
4. For M4, resume only from `.agent-run/LR-20260913-FSL-M4-001/`.

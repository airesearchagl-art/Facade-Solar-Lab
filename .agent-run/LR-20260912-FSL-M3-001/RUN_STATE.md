# Run State

## Identity

- Run ID: `LR-20260912-FSL-M3-001`
- Mode: `LONG_RUN_ENDURANCE`
- Current state: `HUMAN_GATE`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m3-facade-geometry`
- Base SHA: `c3f314134137da9b35b4cde53320a610bba15f72`
- Current head rule: resolve symbolic `HEAD` with `git rev-parse HEAD`; never embed the SHA of the commit containing this file
- Current wave: `Wave 11 — Focused Independent Re-Review gate`
- Previous reviewed head: `e63f73a97d6488aa1df6a6ff870e8cff5a5cde88`
- Last verified implementation checkpoint: `2bf672493632e217afe05f0f0078ca4f150579d7`
- Pull request: `#4` — `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/4`
- Pull request state: `OPEN / Draft / Ready=false / merged=false`

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

- Required Fix implementation and convergence are complete. PR #4 remains Draft and awaits Focused Independent Re-Review.

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

- Focused Independent Re-Review and a new Human instruction after that review.

## Next action

Wait for Focused Independent Re-Review. PR #4 already exists: do not recreate it, mark it Ready, merge it, operate Vercel, or begin M4.

## Stop conditions

- Any Task Packet/base/M1 hash drift, M1/M2 regression, coordinate-sign ambiguity, unexplained rotation failure, invalid area/fraction, NaN/Infinity, required weather-v1 edit, licensed-data commit, privacy/security failure, user-change conflict, or scope expansion.

## Resume instructions

1. Fresh-fetch and verify `origin/main`, branch, live `HEAD`, worktree, Task Packet digest, and both M1 hashes without rebasing.
2. Verify PR #4 still exists and remains `OPEN / Draft / Ready=false / merged=false`; do not recreate it.
3. Read all seven M3 artifacts and treat the Required Fix as complete pending Focused Independent Re-Review.
4. Preserve `src/weather/**`, `src/engine/weather-v1/**`, M1 originals, coordinate signs, projection formula, and all existing expected values.
5. Do not mark Ready, merge, operate Vercel, or begin M4. Wait for Focused Independent Re-Review.

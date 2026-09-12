# Run State

## Identity

- Run ID: `LR-20260912-FSL-M3-001`
- Mode: `LONG_RUN_ENDURANCE`
- Current state: `ACTIVE`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m3-facade-geometry`
- Base SHA: `c3f314134137da9b35b4cde53320a610bba15f72`
- Current head rule: resolve symbolic `HEAD` with `git rev-parse HEAD`; never embed the SHA of the commit containing this file
- Current wave: `Wave 4 — Orientation / Side Extensions`
- Last successful checkpoint: `Wave 2 — 81d1a9a`; Wave 3 checkpoint is the live commit containing this artifact update

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

## Current work

- Complete all-orientation, finite-width, mirror, monotonic, behind, and grazing tests.

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

- Waves 1–8 implementation, validation, documentation, and full convergence.
- Wave 9 one Draft PR, fresh verification, and Independent FULL Review Human Gate.

## Next action

Implement Wave 4 G7–G9, F1–F4, cardinal/intermediate rotations, and boundary tests.

## Stop conditions

- Any Task Packet/base/M1 hash drift, M1/M2 regression, coordinate-sign ambiguity, unexplained rotation failure, invalid area/fraction, NaN/Infinity, required weather-v1 edit, licensed-data commit, privacy/security failure, user-change conflict, or scope expansion.

## Resume instructions

1. Fresh-fetch and require `origin/main` at the exact base above without rebasing.
2. Verify branch, live `HEAD`, worktree, Task Packet digest, and both M1 hashes.
3. Read all seven M3 artifacts and resume only from Current wave / Next action.
4. Preserve `src/weather/**`, `src/engine/weather-v1/**`, M1 originals, and all existing expected values.
5. Do not start M4 or mutate `main`, Ready, merge, Vercel, Production, permissions, visibility, or secrets.

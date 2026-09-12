# Run State

## Identity

- Run ID: `LR-20260912-FSL-M2-001`
- Mode: `LONG_RUN_ENDURANCE`
- Current state: `IN_PROGRESS`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m2-weather-foundation`
- Base SHA: `a7a9cbb7af2386b6b0b5266ea390568a8b537d69`
- Current head rule: resolve symbolic `HEAD` with `git rev-parse HEAD`; never embed the SHA of the commit containing this file
- Current wave: `Wave 1 — Canonical Weather Contract`
- Last successful checkpoint: `Wave 0 — bf5f229`

## Task Packet binding

- Task Packet ID: `LRP-20260912-FSL-M2-001`
- Revision: `1`
- Snapshot: `.agent-run/LR-20260912-FSL-M2-001/TASK_PACKET_SNAPSHOT.md`
- SHA-256: `9C7B4E5CB255D9EE3BCA68E86E9C50B20272DD94B29A3B671AD481D52B3F7999`

## Objective

Add a deterministic, Pure TypeScript, weather-driven M2 foundation: canonical weather contracts, EPW parsing, NOAA-style solar position, interval energy accounting, existing 2D overhang shading, provenance, synthetic validation, and optional local real-EPW smoke validation. Preserve M1 as a separate immutable regression baseline.

## Acceptance criteria

See the bound Task Packet section 33. No criterion is complete until evidence is recorded against the post-change head.

## Completed work

- Fresh `origin/main`, branch, worktree, and exact M1 source hashes verified.
- M1 post-merge closeout prepared on the M2 branch.
- M2 Task Packet public-safe LF snapshot and digest binding created.
- Branch `feat/m2-weather-foundation` created from the exact canonical base.
- Canonical location, interval, radiation, provenance, issue, and local-standard-time contracts implemented.

## Current work

- Wave 1 checkpoint.

## Required checks

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm audit`
- `npm run golden:check`
- `git diff --check origin/main...HEAD`
- M1 source byte hashes and public repository boundary scans

## Quality debt

- See `QUALITY_DEBT.md`.

## Explicit unverified items

- Real Japanese EPW smoke validation has not yet run.
- Weather-v1 absolute energy results are not formal performance evidence.

## Known failures

- None.

## Remaining tasks

- Waves 2–8 from the bound Task Packet.

## Next action

Commit the Wave 1 checkpoint, then implement the EPW parser and synthetic fixtures.

## Stop conditions

- Any Task Packet digest/base/M1 original hash drift, M1 Golden regression, unexplained interval/time/radiation behavior, secret/privacy/licensing problem, user-change conflict, or scope expansion.
- Never mutate `main`, mark Ready, merge, deploy, release, force-push, rebase, delete branches, or begin M3.

## Resume instructions

1. Fresh-fetch `origin/main` and verify the base relationship without rebasing.
2. Verify branch `feat/m2-weather-foundation`, resolve live `HEAD`, and inspect the working tree.
3. Verify the Task Packet digest above and both immutable M1 source byte hashes.
4. Read all seven M2 artifacts; continue only from Current wave / Next action.
5. Do not repeat completed external mutations. Draft PR is permitted only after Wave 7 convergence.

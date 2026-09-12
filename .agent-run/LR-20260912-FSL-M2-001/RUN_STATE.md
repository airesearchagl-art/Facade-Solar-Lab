# Run State

## Identity

- Run ID: `LR-20260912-FSL-M2-001`
- Mode: `LONG_RUN_ENDURANCE`
- Current state: `HUMAN_GATE`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m2-weather-foundation`
- Base SHA: `a7a9cbb7af2386b6b0b5266ea390568a8b537d69`
- Current head rule: resolve symbolic `HEAD` with `git rev-parse HEAD`; never embed the SHA of the commit containing this file
- Current wave: `Wave 10 — Focused Independent Re-Review gate`
- Previous reviewed head: `7073950a05ccbbadbc21ba87958e80f4db4cb70c`
- Last verified implementation checkpoint: `f5600021b1a5f6ddf8d05c989a4968cf25eaa8c2`

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
- Pure TypeScript EPW headers/data parser, strict missing policy, coverage classification, and synthetic fixtures implemented.
- Independent NOAA-style weather-v1 solar position and external calculator references implemented.
- Weather interval irradiance, 2D overhang shading, interval energy, aggregation, periods, and result provenance implemented.
- Synthetic regression, M1 Golden/hash regression, and local EnergyPlus Tokyo Hyakuri EPW smoke validation completed.
- Required weather documentation, milestone guidance, limitations/validation plans, and minimal M2 status UI completed.
- Full convergence passed and the feature branch was normally pushed.
- Draft PR #3 exists at `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/3` and was verified `OPEN / Draft / Ready=false / merged=false`.
- RF-01 uses a Gregorian 365/366-day fractional-year denominator and adds independent NOAA leap-day, summer, and late-year references while retaining all 2025 references.
- RF-02 synchronized the resumable artifacts to the existing PR; no repeat PR action remains.
- Required-fix convergence and the safe local real-EPW smoke validation passed at the implementation checkpoint.

## Current work

- Required Fix implementation and convergence are complete. PR #3 remains Draft and awaits Focused Independent Re-Review.

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

- Weather-v1 absolute energy results are not formal performance evidence.

## Known failures

- None.

## Remaining tasks

- Focused Independent Re-Review and a new Human instruction after that review.

## Next action

Wait for Focused Independent Re-Review. PR #3 already exists: do not recreate it, mark it Ready, merge it, or begin M3.

## Stop conditions

- Any Task Packet digest/base/M1 original hash drift, M1 Golden regression, unexplained interval/time/radiation behavior, secret/privacy/licensing problem, user-change conflict, or scope expansion.
- Never mutate `main`, mark Ready, merge, deploy, release, force-push, rebase, delete branches, or begin M3.

## Resume instructions

1. Fresh-fetch `origin/main` and verify the base relationship without rebasing.
2. Verify branch `feat/m2-weather-foundation`, resolve live `HEAD`, and inspect the working tree.
3. Verify the Task Packet digest above and both immutable M1 source byte hashes.
4. Read all seven M2 artifacts; continue only from Current wave / Next action.
5. Verify PR #3 still exists and remains `OPEN / Draft / Ready=false / merged=false`; do not recreate it.
6. Do not mark Ready, merge, or begin M3. Wait for Focused Independent Re-Review.

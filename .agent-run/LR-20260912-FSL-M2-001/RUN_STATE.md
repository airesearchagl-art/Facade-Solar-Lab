# Run State

## Identity

- Run ID: `LR-20260912-FSL-M2-001`
- Mode: `LONG_RUN_ENDURANCE`
- Current state: `COMPLETE_VERIFIED / HUMAN_CLOSEOUT`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m2-weather-foundation`
- Base SHA: `a7a9cbb7af2386b6b0b5266ea390568a8b537d69`
- Current head rule: resolve symbolic `HEAD` with `git rev-parse HEAD`; never embed the SHA of the commit containing this file
- Current wave: `Post-merge closeout`
- Previous reviewed head: `7073950a05ccbbadbc21ba87958e80f4db4cb70c`
- Last verified implementation checkpoint: `f5600021b1a5f6ddf8d05c989a4968cf25eaa8c2`
- Final reviewed feature head: `406a896818b5462549a1aab447a4a6ef3f8baa18`
- Pull request: `#3` — `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/3`
- Pull request state: `MERGED` by squash
- Squash merge commit: `c3f314134137da9b35b4cde53320a610bba15f72`

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

- M2 is independently reviewed, verified, and squash-merged. This run is historical and closed.

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

- None. M2 is complete.

## Next action

Do not resume M2 implementation. Continue only under the separately authorized M3 Task Packet.

## Stop conditions

- Any Task Packet digest/base/M1 original hash drift, M1 Golden regression, unexplained interval/time/radiation behavior, secret/privacy/licensing problem, user-change conflict, or scope expansion.
- Never mutate `main`, mark Ready, merge, deploy, release, force-push, rebase, delete branches, or begin M3.

## Resume instructions

1. Treat this run as closed; do not recreate PR #3 or repeat any M2 mutation.
2. Verify this immutable Task Packet digest and the M1 source hashes only when auditing M2.
3. Preserve `weather-v1`, its tests, and both M1 originals as regression baselines.
4. Use the reviewed head and squash merge commit above as historical identities, not current `HEAD`.

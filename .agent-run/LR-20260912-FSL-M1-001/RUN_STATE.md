# Run State

## Identity

- Run ID: `LR-20260912-FSL-M1-001`
- Mode: `LONG_RUN_ENDURANCE`
- Horizon: `EXTENDED`
- Current state: `ACTIVE`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m1-engine-baseline`
- Base SHA: `b633a2b9651b63ea1224f8a4becefa1062a6b12d`
- Current head: resolve symbolic `HEAD` at resume time with `git rev-parse HEAD`; never embed the SHA of the commit containing this file
- Current wave: `Wave 5 — Documentation / Minimal Status`
- Last successful checkpoint: `Wave 3 — 12189d6`; Wave 4 Golden and boundary tests are the current live HEAD after their checkpoint commit

## Task Packet binding

- Task Packet ID: `LRP-20260912-FSL-M1-001`
- Revision: `1`
- Snapshot: `.agent-run/LR-20260912-FSL-M1-001/TASK_PACKET_SNAPSHOT.md`
- SHA-256: `BEF00BD0BA6B96A027EB6BE7BB5186B38244B4BEEA1B16FA0F38C64D6FC22B07`

## Objective

Reproduce actual legacy MVP v0.1 calculation behavior as a Pure TypeScript engine, independently execute the original calculation source, and freeze exact Golden baselines without correcting the legacy physics.

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| M0 post-merge closeout | COMPLETE |
| M1 run artifacts and digest binding | COMPLETE |
| Human legacy originals byte-preserved in Git | COMPLETE |
| Independent original-source reference harness | COMPLETE |
| Pure TypeScript legacy engine | COMPLETE |
| G1–G6 Golden comparisons | COMPLETE |
| Mechanical React/DOM/Canvas boundary test | COMPLETE |
| Documentation and minimal M1 status | PENDING |
| Full required checks and public-boundary scan | PENDING |
| Draft PR, still Draft and unmerged | PENDING |

## Required checks

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm audit`
- `git diff --check origin/main...HEAD`
- Workspace, staged, and committed legacy-byte SHA-256 verification
- Independent reference execution and Golden generation verification
- Engine dependency boundary test
- Public repository secret/privacy/history scan

## Quality debt

- None active. `QD-M1-001` is resolved by the recursive raw-source dependency boundary test.

## Explicit unverified items

- Absolute energy results remain a legacy baseline, not validated physical-performance evidence.

## Remaining tasks

- Complete Waves 5–7 in `TASK_QUEUE.md` without changing legacy semantics or crossing Human Gates.

## Next action

Synchronize required documentation and the minimal M1 status display without adding simulator UI.

## Stop conditions

- Stop on base mismatch, missing source, source hash drift, normalization mismatch, unexplained reference/engine difference, digest mismatch, unexpected user changes, security/privacy failure, or scope expansion.
- Never modify `main`, rebase, force-push, delete branches, mark Ready, merge, use Vercel/Production, release, or start M2.

## Resume instructions

1. Confirm branch `feat/m1-engine-baseline` and a clean or explicitly recorded working tree.
2. Fresh-fetch `origin/main` and require exact SHA `b633a2b9651b63ea1224f8a4becefa1062a6b12d`.
3. Verify this Task Packet SHA-256 equals `BEF00BD0BA6B96A027EB6BE7BB5186B38244B4BEEA1B16FA0F38C64D6FC22B07`.
4. Resolve live `HEAD`; do not confuse it with any prior checkpoint SHA.
5. Verify both legacy workspace files still match the Human-provided byte counts and SHA-256 values before touching the index.
6. Continue only from **Current wave** / **Next action** and stop on any listed condition.

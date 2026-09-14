# Run State

Binding: `LRP-20260914-FSL-M45-001` rev `1` / `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`

## Current state

- State: `HUMAN_GATE`
- Current wave: Human UX Follow-up 01 / Human re-check
- Canonical base: `origin/main @ 35f543e618b8ad70ecc746b3139a5fb09adbeca9`
- Working branch: `feat/m45-multifloor-mode`
- Current head: resolve live `HEAD`; do not treat this mutable document's containing commit as a self-referential exact head
- Last verified checkpoint: UX-01 through UX-04 implementation and local convergence passed (150 tests); local static print-layout PDF checked. Exact-source Preview and PR head are resolved after the repository checkpoint.
- Previous reviewed head: `6cae598818aa6208600d132fe5854a37e8da157c`
- PR #7 already exists: https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/7 — OPEN / Draft; do not recreate.
- UX-01 / UX-02 / UX-03 / UX-04: implemented, AWAITING HUMAN RE-CHECK; not CLOSED / PASS.
- M4: `COMPLETE`
- M5: `NOT STARTED`

## Architecture state

- Single-floor M4 Workspace remains available and retains its own session state.
- Multi-floor is a separate Workspace backed by Pure TypeScript `src/multifloor/**`.
- Every Floor adapts to `FacadeV1Parameters` and calls canonical `simulateFacadeV1()` once.
- Building Total is the simple sum of Floor annual, summer, winter, and monthly solar heat gain.
- Displayed energy remains solar heat gain through openings, not HVAC cooling/heating load or formally validated physical performance.

## Remaining tasks

1. Human re-check of floor labels, all-floor references, same-story Case comparison, and Floor monthly charts.
2. Exact product Preview native PDF save/inspection remains unverified. Local static print-layout rendering is supporting evidence, not native Preview acceptance.
3. Independent Review remains open. Real-EPW native Multi-floor UX remains a Human verification item.
4. Keep Ready, merge, Production, branch deletion, arbitrary Case color selection, and M5 out of scope.

## Next action

Await M4.5 Human UX Re-Check. Resolve the latest Git Preview from the live branch head; never close UX findings without Human evidence. Do not begin M5 automatically.

## Resume instructions

1. Verify the Task Packet snapshot SHA-256 exactly matches the binding above.
2. Fetch and resolve `origin/main`, current branch, live `HEAD`, remote branch, working tree, and any existing PR before mutation.
3. Continue only on `feat/m45-multifloor-mode`; never write directly to `main`.
4. Preserve `facade-v1-weather` as canonical and do not duplicate solar/weather/shadow equations.
5. Resolve the existing PR and Git-triggered Preview from GitHub/Vercel at resume time. If the authorized Draft PR already exists, do not recreate it. Do not create duplicate deployments.
6. Do not mark Ready, merge, mutate Production, delete a branch, or begin M5.
7. This artifact intentionally does not claim that its containing commit SHA is a fixed `current head`; live `HEAD`, PR head, and latest exact-source Preview are external fresh-state evidence.

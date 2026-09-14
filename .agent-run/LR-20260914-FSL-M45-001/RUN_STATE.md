# Run State

Binding: `LRP-20260914-FSL-M45-001` rev `1` / `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`

## Current state

- State: `HUMAN_GATE`
- Current wave: Human UX Follow-up 02 / UX-05 Human re-check
- Canonical base: `origin/main @ 35f543e618b8ad70ecc746b3139a5fb09adbeca9`
- Working branch: `feat/m45-multifloor-mode`
- Current head: resolve live `HEAD`; do not treat this mutable document's containing commit as a self-referential exact head
- Last verified checkpoint: Floor-local display clipping and local convergence passed (158 tests); before/after simulation/export digests match; five-page local static print-layout PDF checked. Exact-source Preview and PR head are resolved after the repository checkpoint.
- Previous reviewed head: `ec18c15e7255177c24d5be3b3c789bc3198c6e7f`
- PR #7 already exists: https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/7 — OPEN / Draft; do not recreate.
- UX-01 / UX-03 / UX-04: CLOSED / PASS by Human re-check.
- UX-02: CLOSED / PASS for all-floor display; the cross-floor ray extension is tracked separately as UX-05.
- UX-05: display clipping implemented / HUMAN_RECHECK_PENDING. Do not mark CLOSED / PASS before Human confirmation.
- M4: `COMPLETE`
- M5: `NOT STARTED`

## Architecture state

- Single-floor M4 Workspace remains available and retains its own session state.
- Multi-floor is a separate Workspace backed by Pure TypeScript `src/multifloor/**`.
- Every Floor adapts to `FacadeV1Parameters` and calls canonical `simulateFacadeV1()` once.
- Building Total is the simple sum of Floor annual, summer, winter, and monthly solar heat gain.
- Displayed energy remains solar heat gain through openings, not HVAC cooling/heating load or formally validated physical performance.
- Reference rays retain their raw intersection and use a separate floor-clipped display endpoint, preserving direction. This does not add cross-floor occlusion/inter-floor shading to the independent-Floor model.

## Remaining tasks

1. Human re-check of UX-05 on the latest exact-source Preview and PDF: all seasonal rays must terminate within their own Floor band.
2. Local static print-layout rendering is supporting evidence, not native Preview acceptance. The Human reported the prior penetration in a PDF; post-fix native PDF acceptance remains pending.
3. Independent Review remains open. Real-EPW native Multi-floor UX remains a Human verification item.
4. Keep Ready, merge, Production, branch deletion, arbitrary Case color selection, and M5 out of scope.

## Next action

Await UX-05 Human Re-Check. Resolve the latest Git Preview from the live branch head. UX-01 through UX-04 already have Human PASS; UX-05 must not be closed without new Human evidence. Do not begin M5 automatically.

## Resume instructions

1. Verify the Task Packet snapshot SHA-256 exactly matches the binding above.
2. Fetch and resolve `origin/main`, current branch, live `HEAD`, remote branch, working tree, and any existing PR before mutation.
3. Continue only on `feat/m45-multifloor-mode`; never write directly to `main`.
4. Preserve `facade-v1-weather` as canonical and do not duplicate solar/weather/shadow equations.
5. Resolve the existing PR and Git-triggered Preview from GitHub/Vercel at resume time. If the authorized Draft PR already exists, do not recreate it. Do not create duplicate deployments.
6. Do not mark Ready, merge, mutate Production, delete a branch, or begin M5.
7. This artifact intentionally does not claim that its containing commit SHA is a fixed `current head`; live `HEAD`, PR head, and latest exact-source Preview are external fresh-state evidence.

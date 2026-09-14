# Run State

Binding: `LRP-20260914-FSL-M45-001` rev `1` / `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`

## Current state

- State: `HUMAN_GATE`
- Current wave: M4.5 Human UX / Independent Review
- Canonical base: `origin/main @ 35f543e618b8ad70ecc746b3139a5fb09adbeca9`
- Working branch: `feat/m45-multifloor-mode`
- Current head: resolve live `HEAD`; do not treat this mutable document's containing commit as a self-referential exact head
- Last verified checkpoint: M4.5 implementation, local full convergence, local real-EPW smoke, and Single/Multi browser smoke passed; external branch/PR/Preview identity must be resolved fresh
- M4: `COMPLETE`
- M5: `NOT STARTED`

## Architecture state

- Single-floor M4 Workspace remains available and retains its own session state.
- Multi-floor is a separate Workspace backed by Pure TypeScript `src/multifloor/**`.
- Every Floor adapts to `FacadeV1Parameters` and calls canonical `simulateFacadeV1()` once.
- Building Total is the simple sum of Floor annual, summer, winter, and monthly solar heat gain.
- Displayed energy remains solar heat gain through openings, not HVAC cooling/heating load or formally validated physical performance.

## Remaining tasks

1. No remaining M4.5 implementation or local convergence task.
2. Human UX and Independent Review remain open gates. Real-EPW native Multi-floor UX and saved PDF/CSV inspection remain Human verification items.
3. Keep Ready, merge, Production, branch deletion, arbitrary Case color selection, and M5 out of scope.

## Next action

Await M4.5 Human UX / Independent Review. Do not begin M5 automatically.

## Resume instructions

1. Verify the Task Packet snapshot SHA-256 exactly matches the binding above.
2. Fetch and resolve `origin/main`, current branch, live `HEAD`, remote branch, working tree, and any existing PR before mutation.
3. Continue only on `feat/m45-multifloor-mode`; never write directly to `main`.
4. Preserve `facade-v1-weather` as canonical and do not duplicate solar/weather/shadow equations.
5. Resolve the existing PR and Git-triggered Preview from GitHub/Vercel at resume time. If the authorized Draft PR already exists, do not recreate it. Do not create duplicate deployments.
6. Do not mark Ready, merge, mutate Production, delete a branch, or begin M5.
7. This artifact intentionally does not claim that its containing commit SHA is a fixed `current head`; live `HEAD`, PR head, and latest exact-source Preview are external fresh-state evidence.

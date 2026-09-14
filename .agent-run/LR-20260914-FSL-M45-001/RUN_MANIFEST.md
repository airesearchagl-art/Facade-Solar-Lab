# Run Manifest

- Run ID: `LR-20260914-FSL-M45-001`
- Mode: `LONG_RUN_ENDURANCE`
- Horizon: `EXTENDED`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m45-multifloor-mode`
- Canonical base: `origin/main @ 35f543e618b8ad70ecc746b3139a5fb09adbeca9`
- Task Packet ID: `LRP-20260914-FSL-M45-001`
- Task Packet revision: `1`
- Task Packet: `.agent-run/LR-20260914-FSL-M45-001/TASK_PACKET.md`
- Immutable snapshot: `.agent-run/LR-20260914-FSL-M45-001/TASK_PACKET_SNAPSHOT.md`
- Task Packet SHA-256: `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`
- Current head rule: resolve symbolic `HEAD` at resume time; checkpoints record a separately named verified commit
- Started: `2026-09-14` (Asia/Tokyo)

## Human authorization

The Human-provided M4.5 Task Packet authorizes implementation on `feat/m45-multifloor-mode`, local validation, normal commits and pushes, Git-triggered Preview inspection, and one final Draft PR. It does not authorize Ready, merge, manual Preview, Production mutation, branch deletion, or M5.

## Immutable baselines

- M1 HTML: `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`
- M1 handover: `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4`
- M4 closeout main: `35f543e618b8ad70ecc746b3139a5fb09adbeca9`

## Hard gates

- Keep `facade-v1-weather` and `simulateFacadeV1()` canonical; stop for Human direction if a formula change becomes necessary.
- Never directly mutate `main`, mark Ready, merge, auto-merge, force-push, delete branches, manually deploy Preview, deploy/promote Production, mutate aliases/domains/DNS/secrets/permissions, or begin M5.
- A Git-triggered Production classification is an immediate `BLOCKED` transition.

# Run Manifest

- Run ID: `LR-20260913-FSL-M4-001`
- Mode: `LONG_RUN_ENDURANCE`
- Horizon: `EXTENDED`
- Repository: `airesearchagl-art/Facade-Solar-Lab`
- Working branch: `feat/m4-comparison-ux`
- Canonical base: `origin/main @ 46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215`
- Task Packet ID: `LRP-20260913-FSL-M4-001`
- Task Packet revision: `1`
- Task Packet: `.agent-run/LR-20260913-FSL-M4-001/TASK_PACKET.md`
- Immutable snapshot: `.agent-run/LR-20260913-FSL-M4-001/TASK_PACKET_SNAPSHOT.md`
- Task Packet SHA-256: `5A3288DF4A540EB7E40AF42E7D5D84505B6B06F61698C06F9D043A38DD4003E8`
- Current head rule: resolve symbolic `HEAD` at resume time; checkpoints record the last verified commit separately
- Canonical Long-Run source: `airesearchagl-art/obsidian-vault main @ c85279038f5950ef0d86f50af4d6ad12cc78e66a`
- Started: `2026-09-13` (Asia/Tokyo)

## Human authorization

The Human-provided M4 Task Packet explicitly authorizes `LONG_RUN_ENDURANCE`, normal commits and economical pushes on the M4 branch, one final Draft PR, and the bounded Preview verification route. It does not authorize Ready, merge, Production, deletion, or M5.

## Immutable baselines

- M1 HTML: `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`
- M1 handover: `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4`
- M3 merged main: `46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215`

## Hard gates

- Never directly mutate `main`, mark Ready, merge, auto-merge, force-push, delete branches or deployments, deploy/promote Production, mutate aliases/domains/DNS/secrets/permissions, or begin M5.
- A Git-triggered Production deployment or unexpected Production alias mutation is an immediate `BLOCKED` transition.
- Security, privacy, authentication, permission, data-integrity, or irreversible-data failures are never Quality Debt.

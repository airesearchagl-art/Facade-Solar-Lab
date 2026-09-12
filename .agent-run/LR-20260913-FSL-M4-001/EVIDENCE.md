# Evidence

## Binding

- Run ID: `LR-20260913-FSL-M4-001`
- Task Packet ID / revision: `LRP-20260913-FSL-M4-001` / `1`
- Immutable snapshot SHA-256: `5A3288DF4A540EB7E40AF42E7D5D84505B6B06F61698C06F9D043A38DD4003E8`

## Wave 0 — Fresh preflight / M3 closeout

Performed: `2026-09-13` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Canonical Long-Run route | `obsidian-vault main @ c85279038f5950ef0d86f50af4d6ad12cc78e66a` | PASS |
| Fresh `origin/main` | `46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215` after fetch | PASS |
| Starting state | detached exact canonical SHA; tracked clean | PASS |
| Target branch | absent locally/remotely, then created from exact base | PASS |
| Vercel smoke ref | `chore/vercel-preview-smoke-20260913` remains at canonical SHA and was not used as a base | PASS |
| `npm test` | 11 files / 86 tests | PASS |
| `npm run typecheck` | no diagnostics | PASS |
| `npm run build` | Vite; 49 modules | PASS |
| `npm audit` | 0 vulnerabilities | PASS |
| `npm run golden:check` | legacy hash guard verified | PASS |
| `git diff --check` | no findings | PASS |
| Legacy HTML | `EF896E0D...D4CB5` | PASS |
| Legacy handover | `B3C2C8E...CD6C4` | PASS |

### Task Packet preservation

`TASK_PACKET.md` and `TASK_PACKET_SNAPSHOT.md` are byte-identical copies of the Human-provided attachment. Both hash to `5A3288DF4A540EB7E40AF42E7D5D84505B6B06F61698C06F9D043A38DD4003E8`. The snapshot is immutable after initialization.

### Repository boundary

- M4 work is isolated on `feat/m4-comparison-ux` from exact canonical main.
- No tracked `.vercel`, `.env.local`, real EPW, credential, bypass value, or new dependency was introduced.
- No Production, deployment deletion, alias, domain, DNS, secret, permission, Ready, merge, or M5 mutation occurred.

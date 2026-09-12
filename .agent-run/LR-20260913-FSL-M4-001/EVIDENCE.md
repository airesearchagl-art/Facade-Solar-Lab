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

## Wave 1 — Initialization push / Git-triggered Preview Hard Gate

Performed: `2026-09-13` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Initialization commit | `85181a4d4cbd77f76e199da6c7acca7947096ad5`; initialization artifacts only | PASS |
| Git source | `airesearchagl-art/Facade-Solar-Lab`, `feat/m4-comparison-ux`, exact pushed SHA | PASS |
| Deployment | `dpl_4juDN8i671219xqvszEV6DUco41p`; `source=git`; `target=null`; `READY` | PASS |
| Preview URL | `https://facade-solar-rm6jvnh9g-airesearchagls-projects.vercel.app` | PASS |
| Preview alias | branch-only `facade-solar-lab-git-feat-m4-com-ed292f-airesearchagls-projects.vercel.app` | PASS |
| Production baseline | `dpl_FV899...`; aliases unchanged | PASS |

No deployment was deleted or retried. The Hard Gate permits M4 product implementation to continue.

## Wave 2 — Comparison pure domain

Performed: `2026-09-13` (Asia/Tokyo)

- Added `src/comparison/**` as a Pure TypeScript adapter over `simulateFacadeV1`; no solar, weather, or geometry calculation was duplicated.
- Case operations enforce 1–4 cases, unique caller-provided IDs, deep-cloned duplicate parameters, deterministic baseline reassignment, and no random IDs in tests.
- Delta semantics are exactly `case - baseline`; percentage is `null` when baseline is zero.
- Annual, cooling, heating, and aligned 12-month values are retained with the complete facade-v1 simulation result.
- Validation rejects non-finite values, invalid opening/overhang geometry, `SHGC <= 0 || > 1`, and ground reflectance outside `0..1` without clamping.
- Input differences cover normalized azimuth, opening, overhang enable/disable and dimensions, SHGC, and ground reflectance while omitting unchanged fields.
- Focused result: 3 files / 18 tests; typecheck PASS; diff check PASS.

## Waves 3–7 — Browser workspace and UX

Performed: `2026-09-13` (Asia/Tokyo)

- `parseBrowserEpwFile` accepts `.epw`, reads the browser `File` once, calls the canonical `parseEpw`, and retains only public-safe filename provenance plus the parsed dataset. Non-EPW extensions are rejected before bytes are read.
- React exposes Add, Duplicate, Rename, Delete, Set baseline, one-to-four Case cap, azimuth presets/numeric input, opening, optional overhang, SHGC, and ground reflectance without silent numeric clamping.
- Full-year simulation runs only through the explicit `Run Comparison` action. Edits after a run set a visible stale-results state.
- Annual, Apr–Sep cooling, Oct–Mar heating, monthly 1–12, `case - baseline` kWh/percentage, and zero-baseline `—` semantics are represented in the domain and UI.
- The monthly SVG uses distinct color/dash/letter encodings and is paired with a semantic exact-value table.
- Section and front-elevation SVGs explain current opening/overhang parameters. They do not replace CAD and do not alter the M3 geometry coordinate or projection implementation.
- Model identity, weather provenance, finite-width direct-only boundary, diffuse/ground approximations, Human decision boundary, and the absolute-kWh warning are visible.
- React review found no heavy new dependency, waterfall, server/client boundary, oversized SVG precision, or duplicated engine calculation. The local barrel is small and tree-shaken.

### Local browser evidence

- Vite loaded at `http://127.0.0.1:5173/` with `Facade Solar Lab`, `M4 · COMPARISON UX`, `M4 workspace`, geometry views, assumptions, and the not-formal-performance warning visible.
- Duplicate created a selected Case B; changing overhang depth from 0.8 m to 1.6 m produced the expected baseline input difference.
- SHGC 0 displayed the exact validation error and disabled Run; restoring 0.5 removed the invalid state.
- 1280-wide DOM audit found no horizontal overflow or overlay; Vite/main assets loaded; console contained no fatal error and no asset 404 was observed.
- Breakpoints at 1080, 720, and 460 px and the viewport meta were inspected. A separately resized physical mobile viewport remains unverified.

## Wave 8 — Regression and real EPW

Performed against product checkpoint `c8c3f7737d31079662120229ed37756533d373f3` on `2026-09-13` (Asia/Tokyo).

| Check | Evidence | Result |
| --- | --- | --- |
| Full tests | 15 files / 105 tests | PASS |
| M1 focused | 2 files / 15 tests | PASS |
| M2 focused | 4 files / 32 tests | PASS |
| M3 focused | 5 files / 39 tests | PASS |
| M4 focused | 4 files / 19 tests | PASS |
| TypeScript | `tsc --noEmit` | PASS |
| Build | Vite; 59 modules; `dist` output | PASS |
| Audit | 0 vulnerabilities | PASS |
| Golden | exact legacy fixture/hash guard | PASS |
| Diff whitespace | no findings | PASS |
| M1 originals | HTML `EF896E0D...D4CB5`; handover `B3C2C8E...CD6C4` | PASS |
| Task Packet | immutable snapshot `5A3288DF...003E8` | PASS |
| M1–M3 scope | no changes under `legacy/**`, `src/weather/**`, or `src/engine/weather-v1/**` | PASS |
| Public scan | no tracked `.env.local`, `.vercel`, real EPW/ZIP, private key, common live-token signature, or user absolute path in mutable diff | PASS |

### Local-only real EPW smoke

- Dataset: Tokyo Hyakuri IWEC; ignored `.local-validation/` only; 1,558,629 bytes; SHA-256 `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`.
- Result: 1 test PASS; zero parse issues; 8760 intervals; two cases; 12 aligned months; finite annual/cooling/heating/delta values; Case B simulation exactly equals a direct canonical `simulateFacadeV1` call.
- Raw EPW, ZIP, URL, license text, and validation script were not added to Git.

### Explicit browser limitation

The available browser automation has no file-upload method and native file dialogs are outside its surface. Therefore an OS-backed selection of the real EPW through the rendered `<input type="file">` is not claimed. The same adapter plus actual EPW bytes and complete comparison path passed the local-only smoke above. Final state must retain this as explicit unverified evidence unless a later authorized environment can exercise the native selection.

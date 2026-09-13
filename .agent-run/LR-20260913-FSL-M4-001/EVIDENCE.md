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

## Wave 9 — Final Git Preview

Performed: `2026-09-13` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Pushed product head | `cee63594dc26ebbdc35e7fbd319902378890384b`; branch `feat/m4-comparison-ux` | PASS |
| Deployment | `dpl_9hHmMp1LaYeVYzEvgN7e5n5VWfao` | PASS |
| URL | `https://facade-solar-a3kvtl1fl-airesearchagls-projects.vercel.app` | PASS |
| Classification | `target=preview`; `READY`; Git clone exact branch / commit `cee6359` | PASS |
| Build | `npm run build`; `tsc --noEmit`; Vite 59 modules; `dist` output | PASS |
| Manual fallback | not used; Git-triggered route worked | PASS |
| Production | existing bootstrap Production retained; no new Production, promote, or alias mutation | PASS |

### Final Preview browser acceptance

- PASS: app/HTTP load, Case A, Duplicate to Case B, Case B overhang depth 0.8 → 1.6 m, baseline input difference, invalid SHGC message, Section, Front elevation, Assumptions, absolute-kWh warning, nonblank layout, and no horizontal overflow at the inspected desktop viewport.
- PASS: built JS executed; built CSS loaded with 166 accessible rules; app-origin fatal console error count 0; observed app asset 404 count 0.
- Excluded from app result: four errors came from installed Chrome extension origins, not the application or Vercel asset origin.
- UNVERIFIED: attaching a host `.epw` through the OS file chooser, populated weather provenance, explicit Run, Annual/Summer/Winter KPI, monthly chart/table, and baseline result delta. These form one causal verification boundary: no supported browser upload primitive exists in this automation surface.

The exact current head remains a resume-time Git resolution. This artifact records the last verified product checkpoint and does not pretend that a commit can self-record its own final SHA or deployment.

## Wave 10 — Draft PR / Human Gate

Performed: `2026-09-13` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| PR | `#5`; `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/5` | PASS |
| Title | `M4: build facade comparison workspace` | PASS |
| State | `OPEN`; `Draft=true`; `Ready=false`; `merged=false`; `mergeable=true` | PASS |
| Base | `main @ 46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215` | PASS |
| Creation head | `feat/m4-comparison-ux @ f28f5f088292f6d23cb823c864264e1658dd32ba` | PASS |
| Creation diff | 6 commits; 37 changed files; +5970 / -188 | PASS |
| Body | required Summary through Human Gate sections rendered | PASS |

The PR remains Draft and not mergeable by action while this Run Artifact checkpoint is committed. Resume must resolve the live PR head and must not recreate PR #5.

## Independent FULL Review — Required Fix

Reviewed head: `aa602bbe33374543fc96ddfad091d5a18af91c40`.

- RF-01: OPEN / `BLOCKED_BROWSER_ACCEPTANCE`. The OS-backed file selection → provenance → duplicate/edit → Run → period KPI → monthly chart/table → baseline delta path has not been executed in a browser. Existing unit, local real-EPW, and partial Preview checks are supporting evidence only and do not close browser acceptance.
- RF-02: PASS — `AGENTS.md` now starts at `.agent-run/LR-20260913-FSL-M4-001/RUN_STATE.md`. M3 remains unchanged as historical audit evidence.
- RF-03: PENDING REMOTE EVIDENCE — after this Required Fix commit/push, resolve the Git-triggered Preview for live `HEAD` and synchronize only the existing PR #5 body Vercel Preview section. A repository commit cannot self-record the deployment created by its own push; deployment ID/URL/source classification are action-time remote evidence.
- README: PASS — distinguishes the retained Vercel bootstrap Production boundary from an unperformed formal Production release.
- Human Manual Verification is required before RF-01 can be `CLOSED`, before `Ready` can be considered, and before the run can leave `BLOCKED_BROWSER_ACCEPTANCE`.

### Required Fix local convergence

- Minimal diff: six files — `AGENTS.md`, `README.md`, and four mutable M4 Run Artifact files. No engine, UI, test expected value, M3 artifact, or immutable Task Packet change.
- `npm test`: PASS — 15 files / 105 tests.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — Vite 59 modules / `dist`.
- `npm audit`: PASS — 0 vulnerabilities.
- `npm run golden:check`: PASS.
- `git diff --check`: PASS.
- M1 source hashes and immutable M4 Task Packet digest remain exact.

## Human UX Review follow-up — Design Insight & Export

Human feedback recorded on `2026-09-13`:

- seasonal result semantics needed clarification;
- solstice section rays requested;
- PDF / editable export requested.

Bounded implementation evidence:

- UI labels identify annual, Apr–Sep summer, and Oct–Mar winter values as solar heat gain and explicitly state that `[kWh]` is not HVAC cooling/heating load.
- Demo-only copy remains explicit: synthetic, not measured weather, and not validation evidence.
- Pure `src/solar-reference/**` reuses `calculateSolarPosition` and `facadeLocalSunVector`; 6/21 and 12/21 solar noon is the maximum elevation from a five-minute Local Standard Time scan. Profile angle is `atan2(z, y)`; `y <= 0` is back-facing; overhang-tip facade intersection follows the documented projection.
- Section SVG uses solid/labeled summer and dashed/labeled winter rays. The demo south facade shows both; the north facade shows back-facing messages and no incident lines; a deeper overhang moves the facade intersection downward.
- Pure `src/export/**` produces one Case per row with weather/input, annual/summer/winter values and deltas, and 12 monthly values. It uses UTF-8 BOM, CRLF, quoted cells, and leading `= + - @` formula protection.
- Export controls exist only with a result and are disabled when inputs are dirty. Browser print exposes an A4 report with weather, all Cases, results, monthly chart/table, selected geometry, reference rays, assumptions, and warnings.
- Chromium print-to-PDF produced a five-page A4 portrait report. Rendered PNG review found readable Japanese text, complete tables, distinct reference rays, no clipping/overlap, and coherent section breaks.
- Local browser Demo verified result semantics, 6/21 and 12/21 labels/altitude/profile angle, overhang-depth response, north-facing suppression, enabled export after calculation, disabled export while dirty, zero app console errors, zero displayed `NaN`/`Infinity`, and zero horizontal overflow.

Fresh convergence:

| Check | Evidence | Result |
| --- | --- | --- |
| Full tests | 19 files / 115 tests | PASS |
| Focused new tests | solar reference, SVG render, CSV, app render, boundary | PASS |
| TypeScript | `tsc --noEmit` | PASS |
| Build | Vite; 66 modules; `dist` | PASS |
| Audit | 0 vulnerabilities | PASS |
| Golden | M1 fixture/hash guard | PASS |
| Diff whitespace | no findings | PASS |
| Preserved scope | no diff in M1 legacy, M2 weather/solar, M3 facade engine/geometry, or expected fixtures | PASS |
| Remote evidence | exact-head Git Preview and PR body sync | PENDING PUSH |

RF-01 remains OPEN / `BLOCKED_BROWSER_ACCEPTANCE`. This follow-up does not substitute for Human verification of the OS-backed real-EPW flow.

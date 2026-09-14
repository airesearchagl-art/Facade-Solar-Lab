# Evidence

Binding: `LRP-20260914-FSL-M45-001` rev `1` / `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`

## Fresh Gate

- `origin/main`: `35f543e618b8ad70ecc746b3139a5fb09adbeca9`
- PR #5: `MERGED`
- PR #6: `MERGED`
- Created `feat/m45-multifloor-mode` from exact canonical main with a clean working tree.
- Baseline: 21 test files / 128 tests, typecheck, build, audit, Golden, and diff check PASS.

## Implementation evidence

- `src/multifloor/**` contains the browser-independent Case/Floor, validation, adapter, simulation, aggregation, delta, preset, state, demo, and CSV boundaries.
- Each Floor is converted to canonical `FacadeV1Parameters`; `simulateFacadeV1()` remains the calculation authority.
- Single and Multi Workspaces remain separately mounted so switching mode does not convert or discard their state.
- Multi-floor inputs reject invalid/non-finite geometry without silent clamping and disable Run until valid.
- Building-level annual/summer/winter/monthly results are simple Floor sums; Floor Breakdown retains per-Floor results.
- Multi-floor demo uses deterministic synthetic weather and explicitly states it is not measured data or validation evidence.
- Stacked elevation/section uses existing geometry conventions and existing solstice reference calculation for the selected Floor.
- Multi-floor CSV uses BOM, CRLF, escaping, and formula protection. Multi-floor JSON uses new schema-version-1 input-only kinds and clears results after import.

## Verification status

- Full regression: 25 test files / 144 tests PASS.
- New focused domain/preset/CSV/UI/boundary: 6 files / 19 tests PASS.
- TypeScript typecheck: PASS.
- Production build: PASS; Vite transformed 85 modules.
- `npm audit`: PASS; 0 vulnerabilities.
- M1 Golden: PASS against original HTML hash `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`.
- M1 originals: HTML `EF896E...` and handover `B3C2C8...` unchanged.
- M4 Task Packet: `5A3288DF4A540EB7E40AF42E7D5D84505B6B06F61698C06F9D043A38DD4003E8` unchanged.
- M4.5 Task Packet and immutable snapshot: byte-identical; SHA-256 `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`.
- `git diff --check`: PASS.
- Local-only real EPW smoke: Tokyo Hyakuri IWEC hash `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`; 8,760 intervals; two Building Cases / three Floors each; all period/month results finite; PASS. Raw data remained ignored and uncommitted.
- Local browser smoke: Single mode visible; Multi deterministic demo completed; 2 Cases / 3 Floors; Building Total / monthly values and deltas / Floor Breakdown visible; Floor add/duplicate/delete passed; edit set stale and disabled CSV; explicit rerun updated results; mode switching preserved Multi state.
- Responsive browser smoke: 390 px viewport; two mode controls visible; document width stayed within viewport; stacked geometry collapsed to one column.
- Local app-origin console error/warning: 0. Loaded Vite module assets: PASS; blank page: no.
- Final branch SHA, Git-triggered Preview deployment/URL/target/READY/source, and Draft PR state are verified after this repository checkpoint and recorded in the PR/current completion report. Resume must query them fresh rather than infer from this artifact.
- Real-EPW native Multi-floor browser workflow and exported PDF/CSV content remain Human UX verification items; synthetic demo is not a substitute for physical validation.

## Mutation boundaries

- `main`: none.
- Production: none.
- M5: not started.
- Branch deletion: none.

# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M1-001`
- Revision: `1`
- Snapshot SHA-256: `BEF00BD0BA6B96A027EB6BE7BB5186B38244B4BEEA1B16FA0F38C64D6FC22B07`

## Wave 0 — Resume preflight / M0 closeout

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Fresh `origin/main` | `b633a2b9651b63ea1224f8a4becefa1062a6b12d` | PASS |
| Expected merge | PR #1 squash merge commit and canonical base match | PASS |
| Working branch | `feat/m1-engine-baseline` from exact `origin/main` | PASS |
| Pre-existing worktree | Only the two Human-provided untracked originals were present | PASS |
| HTML intake metadata | 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` | PASS |
| Handover intake metadata | 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` | PASS |
| Initial Git attributes | Generic `*.html` / `*.md` LF normalization applied | RISK FOUND |
| Preservation boundary | Path-specific `-text` rules added before either original is staged | PASS |
| Source mutation | Workspace sizes and hashes unchanged after boundary change | PASS |
| M0 closeout | Historical evidence preserved; M0 marked `COMPLETE_VERIFIED / HUMAN_CLOSEOUT` | PASS |
| Task Packet binding | Public-safe LF snapshot digest above | PASS |

## Public repository boundary

- The M1 Task Packet contains no user-specific absolute path.
- No legacy source content was reformatted, normalized, or reconstructed.
- No credential, permission, main, Vercel, Production, release, or M2 mutation occurred in Wave 0.

## Wave 1 — Byte-preserving legacy source intake

Performed: `2026-09-12` (Asia/Tokyo)

| Artifact / check | Workspace | Staged bytes | Committed blob | Result |
| --- | --- | --- | --- | --- |
| `solar_overhang_simulator.html` | 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` | 16,835 bytes / same SHA-256 | same SHA-256 | PASS |
| `HANDOVER_solar_overhang_simulator.md` | 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` | 22,635 bytes / same SHA-256 | same SHA-256 | PASS |
| Git text normalization | Path-specific `-text` | Index preserves workspace bytes | Checkout preserves blob bytes | PASS |
| Required diff whitespace | Originals use path-specific `-whitespace`; authored files remain checked | `git diff --cached --check` has no findings | Recheck after commit required | PASS |

Staged bytes were materialized independently with `git checkout-index --temp` and hashed. The original workspace files were not rewritten, formatted, or normalized.

## Wave 2 — Independent original-source reference harness

Performed: `2026-09-12` (Asia/Tokyo)

- `scripts/generate-legacy-v01-golden.mjs` reads the immutable HTML bytes and refuses execution unless SHA-256 is `EF896E0D...D4CB5`.
- The script extracts the actual block from `const ASHRAE=` through the marker immediately before drawing code, then executes that exact source in a Node.js `vm` context.
- Only original `decl`, `hourGain`, `simulate`, and `summarize` functions generate the fixture; the new TypeScript engine is not imported or called.
- `node scripts/generate-legacy-v01-golden.mjs --check` reproduced `tests/fixtures/legacy-v01-golden.json` byte-for-byte.
- G1 reference sanity: annual no-overhang `25890.12... kWh`, annual reduction `44.05...%`, cooling reduction `57.95...%`, heating reduction `35.13...%`.
- G2–G6 reference cases include no-overhang, azimuth symmetry, width scaling, eta scaling, fixed `D/H + O/H` similarity, and the deliberately non-similar fixed-`O` regression.

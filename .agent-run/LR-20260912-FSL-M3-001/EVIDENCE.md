# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M3-001`
- Revision: `1`
- Snapshot SHA-256: `AFF8B77962787C01B61FE059353FE33B7B3FC9971A1BD126313A1547660DDACB`

## Wave 0 — Fresh preflight / M2 closeout

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Fresh `origin/main` | `c3f314134137da9b35b4cde53320a610bba15f72` | PASS |
| Starting branch/worktree | `feat/m2-weather-foundation @ 406a896...`, clean | PASS |
| Target branch | absent locally/remotely, then created from exact `origin/main` | PASS |
| Legacy HTML | 16,835 bytes / `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` | PASS |
| Legacy handover | 22,635 bytes / `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` | PASS |
| M1 Golden | hash-guarded fixture check | PASS |
| M2 regression | 6 files / 47 tests; typecheck | PASS |
| M2 closeout | reviewed head `406a896...`; PR #3 squash merge `c3f3141...` | PASS |
| M3 Task Packet | public-safe LF snapshot; digest above | PASS |

### Snapshot normalization boundary

Only the Human-provided absolute project-root string was replaced with `${PROJECT_ROOT}`, and line endings were normalized to LF with a final LF. No Task Packet semantics were changed. The committed snapshot is immutable after this checkpoint.

### Repository boundary

- No `main`, Ready, merge, Vercel, Production, Release, permission, visibility, secret, Notion, Vault, or M4 mutation occurred.
- No external EPW, ZIP, or license file was added.

## Wave 1 — Geometry contract

Performed: `2026-09-12` (Asia/Tokyo)

- Added metre-based rectangular opening and horizontal overhang contracts without redundant height/area storage.
- Opening height/area and opening/overhang edges are derived; full-height and waist-wall openings use the same type.
- Invalid width, head/sill order, depth, extension, elevation, and non-finite values are rejected rather than clamped.
- Facade azimuth is north-zero/clockwise and normalized only after finite validation.
- Derived facade-local sun vector uses `x=-cos(e)sin(S-A)`, `y=cos(e)cos(S-A)`, `z=sin(e)` from the declared front-view basis.
- Focused result: 1 file / 5 tests; typecheck and whitespace check PASS.

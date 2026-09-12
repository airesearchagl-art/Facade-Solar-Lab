# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M0-001`
- Revision: `1`
- Snapshot SHA-256: `DE774A106D9A425E09E8547BF2FAF0DBDD00F2DE55FDFB0CC16BB5ABE1AC2253`

## Wave 0 — Fresh preflight

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Local directory | Repository root existed and was initially empty | PASS |
| Initial local Git state | No `.git` directory before clone | PASS |
| Remote identity | `https://github.com/airesearchagl-art/Facade-Solar-Lab.git` | PASS |
| `origin/main` | Present at `a4c90163725f8a9d610aaaeac24057facc0b2fa9` | PASS |
| Existing history | One expected repository-initialization commit, `Create README.md` | PASS |
| Pre-existing files | `README.md` only; one title line | PASS |
| Working tree before work | Clean on `main` after clone | PASS |
| Working branch | Created `chore/m0-bootstrap-long-run`; `main` unchanged | PASS |
| Node.js | `v24.15.0` | PASS |
| npm | `11.12.1` | PASS |
| Git | `2.53.0.windows.2` | PASS |
| GitHub CLI | `2.96.0`; credential detected by `gh auth status` | PASS |
| Remote read | `git ls-remote` resolved `HEAD` and `refs/heads/main` | PASS |
| Push availability | Auth appears configured; write permission not mutated or proven during preflight | UNVERIFIED |
| GitHub API | `gh repo view` returned HTTP 401 despite stored CLI credential | KNOWN FAILURE |

## Public repository boundary

- No secret, token, credential, client data, or private URL was copied into repository files.
- User-specific absolute paths are not recorded. The Task Packet snapshot substitutes `<PROJECT_ROOT>` and `<USER_HOME>\...`.
- No destructive or permission-changing action was performed.

## Wave 1 — Long-Run foundation

- All seven required run artifacts are present.
- Every mutable run-control document repeats or references the same Task Packet binding.
- `RUN_STATE.md` contains the full resume contract and current queue position.
- `.gitattributes` fixes Markdown to LF so the Task Packet SHA-256 remains stable across normal checkouts.

## Wave 2 — Project bootstrap

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| Dependency source | Package versions queried from the npm registry using repository-local cache | PASS |
| React / React DOM | `19.3.0` | PASS |
| Vite / plugin-react | `8.3.0` / `6.1.1` | PASS |
| TypeScript / Vitest | `7.0.2` / `5.0.0` | PASS |
| npm install | 46 packages added; audit found 0 vulnerabilities | PASS |
| npm test | 1 file, 1 test passed | PASS |
| npm run typecheck | TypeScript completed with exit code 0 | PASS |
| npm run build | Vite transformed 17 modules and produced `dist/` | PASS |
| Browser page load | `http://127.0.0.1:5173/` loaded with title and H1 `Facade Solar Lab` | PASS |
| Browser content | 422 rendered body-text characters; M0 ready status present | PASS |
| Browser runtime | No Vite error overlay and no warning/error console entries | PASS |

The first registry lookup failed because npm's default cache was outside the writable workspace. Retrying with `.npm-cache` succeeded; the cache is ignored and is not a product failure.

## Wave 3 — Documentation

- `README.md` records purpose, M0 status, commands, structure, legacy policy, and the absolute-value warning.
- `docs/PRODUCT_DIRECTION.md` records the design loop, intended parameters/outputs, product principles, and M0 boundary.
- `docs/MODEL_LIMITATIONS.md` preserves all supplied legacy MVP known issues and unit/precision constraints without claiming fixes.
- `docs/ROADMAP.md` records M0 through M6 and Human Gates.
- `docs/VALIDATION_PLAN.md` records future Golden, geometry, weather, third-party comparison, and boundary tests without fabricating results.
- `AGENTS.md` records architecture, domain constraints, checks, public boundary, legacy preservation, and Git/deployment gates for future sessions.

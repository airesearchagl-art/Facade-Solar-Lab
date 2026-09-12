# Evidence

## Binding

- Task Packet ID: `LRP-20260912-FSL-M0-001`
- Revision: `1`
- Snapshot SHA-256: `DE774A106D9A425E09E8547BF2FAF0DBDD00F2DE55FDFB0CC16BB5ABE1AC2253`

## Current pull request binding

- Pull request: `#1` — `https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/1`
- State: `OPEN / Draft / Ready=false / merged=false`
- Base: `main` at `a4c90163725f8a9d610aaaeac24057facc0b2fa9`
- Head branch: `chore/m0-bootstrap-long-run`
- Prior reviewed head: `76bab2a15044147c52736084c6f51382f208a10a`
- Final-head rule: resolve the live commit with `git rev-parse HEAD` and confirm it equals `origin/chore/m0-bootstrap-long-run`; the prior reviewed head above is historical and is not the required-fix head.

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

## Wave 4 — MVP preservation audit

Performed: `2026-09-12` (Asia/Tokyo)

- Searched the repository root recursively by exact candidate filename.
- Excluded generated/dependency/control directories: `.git`, `node_modules`, `.npm-cache`, and `dist`.
- `solar_overhang_simulator.html`: no match.
- `HANDOVER_solar_overhang_simulator.md`: no match.
- No guessed, reconstructed, normalized, or reformatted MVP content was created.
- `legacy/mvp-v0.1/README.md` records the missing-source preservation contract; it is not an MVP source artifact.
- MVP source SHA-256: not available because both source files are missing.

## Wave 5 — Final-head convergence after Required Fix

Performed: `2026-09-12` (Asia/Tokyo)

| Check | Evidence | Result |
| --- | --- | --- |
| npm test | 1 test in 1 file passed | PASS |
| npm run typecheck | TypeScript completed with exit code 0 | PASS |
| npm run build | Vite transformed 17 modules and produced `dist/` | PASS |
| npm audit | 0 vulnerabilities | PASS |
| Browser runtime | Meaningful content, expected H1/status, no overlay, no warning/error log | PASS |
| Full diff | 29 files, 3,524 additions, 1 deletion; M0 scope and run-artifact synchronization only | PASS |
| Diff whitespace | `git diff --check origin/main...HEAD` returned no findings | PASS |
| Task Packet digest | `DE774A106D9A425E09E8547BF2FAF0DBDD00F2DE55FDFB0CC16BB5ABE1AC2253` | PASS |
| Checkpoint binding | All five checkpoint messages use the same ID, revision, and digest | PASS |
| Secret scan | Fresh tracked-file and branch-history scan found no credential, token, private-key marker, or API-key token pattern | PASS |
| Privacy scan | Fresh tracked-file and branch-history scan found no user-specific absolute path | PASS |
| Remote main | Still `a4c90163725f8a9d610aaaeac24057facc0b2fa9` | PASS |
| Feature branch push | Required-fix commit pushed normally to `chore/m0-bootstrap-long-run` without force | PASS |
| Pull request | PR #1 is OPEN / Draft / Ready=false / merged=false; base `main`, head `chore/m0-bootstrap-long-run` | PASS |

The initial Task Packet checkpoint never reached the remote. Before publication, its local checkpoint history was reconstructed from `origin/main` so the path-example normalization and EOF cleanup are present from Wave 0. The pushed branch contains neither the prior digest nor the user-specific path.

The convergence target is the commit containing this evidence file. Its SHA is intentionally not embedded here because doing so would be self-referential; resolve symbolic `HEAD` at verification or resume time and keep it distinct from the prior reviewed head.

## Post-merge closeout

Performed: `2026-09-12` (Asia/Tokyo)

- PR #1 completed Independent Review, Required Fix, and Focused Re-Review.
- Merge method: `squash`.
- Merge commit: `b633a2b9651b63ea1224f8a4becefa1062a6b12d`.
- Fresh `origin/main` at M1 preflight equals the merge commit above.
- The Wave 0–5 evidence remains historical and is not rewritten; M0 is `COMPLETE_VERIFIED / HUMAN_CLOSEOUT`.

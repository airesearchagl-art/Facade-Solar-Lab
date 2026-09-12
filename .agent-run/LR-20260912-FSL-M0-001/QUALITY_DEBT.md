# Quality Debt

Binding: `LRP-20260912-FSL-M0-001` rev `1` / `DE774A106D9A425E09E8547BF2FAF0DBDD00F2DE55FDFB0CC16BB5ABE1AC2253`

## Active debt

| ID | Scope | Status | Disposition |
| --- | --- | --- | --- |
| QD-M1-001 | `tests/engine-boundary.test.ts` currently validates manifest metadata but does not mechanically scan `src/engine` for React, DOM, or browser-global dependencies | Advisory / non-blocking for M0 | Consider during M1 planning; do not expand the present required fix |

## Policy

- Noncritical external preview and flaky noncritical checks may be deferred only when explicitly recorded in `RUN_STATE.md`.
- High-risk debt blocks final verification.
- Security, privacy, authentication, permission, data-integrity, and irreversible-data-safety failures can never become quality debt; they require a Human Gate.
- Unverified work is never reported as PASS.

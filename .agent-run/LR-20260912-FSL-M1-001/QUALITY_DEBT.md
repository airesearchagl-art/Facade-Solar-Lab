# Quality Debt

Binding: `LRP-20260912-FSL-M1-001` rev `1` / `BEF00BD0BA6B96A027EB6BE7BB5186B38244B4BEEA1B16FA0F38C64D6FC22B07`

## Active debt

| ID | Scope | Severity | Exit condition |
| --- | --- | --- | --- |
| QD-M1-001 | Existing engine test checks metadata only | Required M1 work | A mechanical test fails on React, DOM, Canvas, or browser-global dependencies under `src/engine/**` |

## Policy

- Hard Stop failures cannot become quality debt.
- Legacy physical/model limitations are preserved semantics, not M1 implementation debt.
- Unverified results are never reported as PASS.

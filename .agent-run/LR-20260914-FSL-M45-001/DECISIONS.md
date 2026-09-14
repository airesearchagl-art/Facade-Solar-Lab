# Decisions

Binding: `LRP-20260914-FSL-M45-001` rev `1` / `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| M45-D-001 | Compose Multi-floor above canonical `facade-v1-weather` | The Task Packet forbids rewriting or duplicating calculation formulas | Every Floor maps to `FacadeV1Parameters` and calls `simulateFacadeV1()` once |
| M45-D-002 | Preserve Human Task Packet bytes in an immutable digest-bound snapshot | Resume must be tied to the authorized scope | Any snapshot digest mismatch blocks mutation |
| M45-D-003 | Keep Single and Multi Workspaces mounted under a mode switch | Mode switching must not convert or destroy either state | Session state remains independent; inactive Workspace is hidden |
| M45-D-004 | Make Building Total the canonical cross-Case comparison | Floor counts and IDs may differ | No forced floor-to-floor alignment across Building Cases |
| M45-D-005 | Fast-path a one-Floor aggregate | One-Floor Multi result must exactly equal the Single result | No avoidable floating-point aggregation difference |
| M45-D-006 | Keep browser APIs under `src/app/**` | Multi-floor domain must work in Node/batch tests | Recursive boundary scan rejects UI/runtime dependencies |
| M45-D-007 | Use separate Multi-floor preset kinds | Existing Single preset semantics are immutable | Multi imports remain input-only and require explicit rerun |
| M45-D-008 | Reuse browser print and generate a dedicated safe CSV | Existing export route is sufficient and avoids heavy dependencies | All Cases/Floors are reportable; arbitrary Case color selection remains out of scope |
| M45-D-009 | Use Git Integration only for Preview | Manual Preview is prohibited | Push once converged, inspect target/source before browser smoke |

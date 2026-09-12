# Decisions

Binding: `LRP-20260912-FSL-M1-001` rev `1` / `BEF00BD0BA6B96A027EB6BE7BB5186B38244B4BEEA1B16FA0F38C64D6FC22B07`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| M1-D-001 | Require exact base `b633a2b...` | Task Packet Hard Stop | M1 branch is created only from the verified squash-merged M0 main |
| M1-D-002 | Normalize only the user-specific local root in the Task Packet snapshot | Public Repository Boundary | Snapshot semantics remain intact without publishing a personal path |
| M1-D-003 | Add path-specific `-text` rules before staging the Human originals | Preserve source bytes across Git on Windows | Workspace, index, and committed blob hashes must match the Human hashes |
| M1-D-004 | Preserve legacy numerical behavior even where physically limited | M1 is a regression baseline, not a physics correction | Improvements are deferred to M2/M3 and must be measurable against M1 |
| M1-D-005 | Treat similarity as fixed `D/H` and `O/H` | Window-head offset participates in shading geometry | The superseded handover T3 interpretation is not adopted as correct behavior |
| M1-D-006 | Disable whitespace diagnostics only for the two immutable originals | The CRLF originals intentionally trigger `diff --check` trailing-whitespace diagnostics when preserved byte-for-byte | Path-specific `-whitespace` keeps required diff checks meaningful for all authored files without changing original bytes |
| M1-D-007 | Execute the original calculation block in a Node.js VM for reference generation | This is the preferred independent path and avoids DOM/Canvas code and new-engine reuse | Expected values remain derived from actual original source with a mandatory source-hash guard |
| M1-D-008 | Keep legacy calculations in typed constants, solar, shading, simulation, and public-index modules | Separates domain responsibilities while retaining original operation and iteration order | The engine remains deterministic and usable from UI, Node, and batch contexts |

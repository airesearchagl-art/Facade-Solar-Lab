# Decisions

Binding: `LRP-20260912-FSL-M1-001` rev `1` / `BEF00BD0BA6B96A027EB6BE7BB5186B38244B4BEEA1B16FA0F38C64D6FC22B07`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| M1-D-001 | Require exact base `b633a2b...` | Task Packet Hard Stop | M1 branch is created only from the verified squash-merged M0 main |
| M1-D-002 | Normalize only the user-specific local root in the Task Packet snapshot | Public Repository Boundary | Snapshot semantics remain intact without publishing a personal path |
| M1-D-003 | Add path-specific `-text` rules before staging the Human originals | Preserve source bytes across Git on Windows | Workspace, index, and committed blob hashes must match the Human hashes |
| M1-D-004 | Preserve legacy numerical behavior even where physically limited | M1 is a regression baseline, not a physics correction | Improvements are deferred to M2/M3 and must be measurable against M1 |
| M1-D-005 | Treat similarity as fixed `D/H` and `O/H` | Window-head offset participates in shading geometry | The superseded handover T3 interpretation is not adopted as correct behavior |

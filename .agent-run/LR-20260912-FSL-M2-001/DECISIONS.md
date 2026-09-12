# Decisions

Binding: `LRP-20260912-FSL-M2-001` rev `1` / `D528CD2A4923B29356E36D538893E7DEC78ABB9FFF5ADAFF386425667437370F`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| M2-D-001 | Require exact base `a7a9cbb...` and keep local `main` untouched | Task Packet hard gate | All work occurs on `feat/m2-weather-foundation` |
| M2-D-002 | Normalize only the local project-root token and line endings in the Task Packet snapshot | Public repository and reproducible digest boundary | Snapshot remains semantically exact without a personal absolute path |
| M2-D-003 | Preserve M1 originals and Golden fixtures unchanged | M1 is the permanent regression baseline | Weather-v1 is additive and separately named |
| M2-D-004 | Treat EPW radiation as interval energy preceding the encoded end time | Official EnergyPlus EPW semantics | Solar geometry uses the interval midpoint in local standard time; no extra duration multiplier |
| M2-D-005 | Reject required solar missing/invalid values rather than copying EnergyPlus zero substitution | Silent zero-fill would understate gains | Issues retain line and field evidence; simulation requires usable radiation |
| M2-D-006 | Use explicit civil fields and UTC offset, never host `Date` or DST | EPW uses local standard time | Results are deterministic across Browser/Node/OS time zones |

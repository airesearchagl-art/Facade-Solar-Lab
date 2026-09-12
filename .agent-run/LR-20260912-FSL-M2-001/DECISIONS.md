# Decisions

Binding: `LRP-20260912-FSL-M2-001` rev `1` / `9C7B4E5CB255D9EE3BCA68E86E9C50B20272DD94B29A3B671AD481D52B3F7999`

| ID | Decision | Reason | Consequence |
| --- | --- | --- | --- |
| M2-D-001 | Require exact base `a7a9cbb...` and keep local `main` untouched | Task Packet hard gate | All work occurs on `feat/m2-weather-foundation` |
| M2-D-002 | Normalize only the local project-root token and line endings in the Task Packet snapshot | Public repository and reproducible digest boundary | Snapshot remains semantically exact without a personal absolute path |
| M2-D-003 | Preserve M1 originals and Golden fixtures unchanged | M1 is the permanent regression baseline | Weather-v1 is additive and separately named |
| M2-D-004 | Treat EPW radiation as interval energy preceding the encoded end time | Official EnergyPlus EPW semantics | Solar geometry uses the interval midpoint in local standard time; no extra duration multiplier |
| M2-D-005 | Reject required solar missing/invalid values rather than copying EnergyPlus zero substitution | Silent zero-fill would understate gains | Issues retain line and field evidence; simulation requires usable radiation |
| M2-D-006 | Use explicit civil fields and UTC offset, never host `Date` or DST | EPW uses local standard time | Results are deterministic across Browser/Node/OS time zones |
| M2-D-007 | Represent civil time as date plus minutes since local-standard-time midnight | Sub-hour midpoint may include seconds and midnight may cross a date boundary | No lossy string parsing or implicit timezone conversion enters the core |
| M2-D-008 | Treat invalid structure as fatal but retain row/radiation defects as typed issues | A dataset cannot exist without headers, while diagnostics are useful for readable records | Strict simulation rejects any error-bearing dataset |
| M2-D-009 | Keep geometric and NOAA-refraction-adjusted elevation separate | Surface energy uses geometric incidence, while calculator comparison includes its documented refraction correction | Reference tests do not silently change irradiance geometry |

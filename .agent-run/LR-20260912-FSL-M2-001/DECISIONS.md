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
| M2-D-010 | Integrate EPW radiation energy exactly once | GHI/DNI/DHI are already Wh/m2 for each interval | Area and SHGC scale interval energy; interval duration is metadata, not another multiplier |
| M2-D-011 | Keep weather-v1 overhang geometry independent from legacy-v01 modules | The geometry concept may match M1 while weather/time/sky contracts differ | M1 remains immutable and neither engine silently calls the other |
| M2-D-012 | Keep the EnergyPlus Tokyo Hyakuri IWEC archive and EPW local-only | The bundled ASHRAE license expressly restricts transfer and third-party distribution | Commit only provenance, hashes, aggregates, and comparison evidence; ignore raw external files |
| M2-D-013 | Limit UI mutation to milestone/status copy | M2 establishes computation and ingestion contracts, not an import or simulator experience | File picker, weather browser/chart, and comparison UI remain absent |
| M2-D-014 | Normalize full-year solar calendars by 8760/8784 structure while preserving raw EPW year | IWEC/TMY can mix historical source years by month; source leap years must not shift a non-leap typical year | 8760 uses canonical 2001, 8784 uses canonical 2000, and partial data uses its explicit year |
| M2-D-015 | Compute the full-year solar calendar once per simulation | Repeated leap-day scans would make a sub-hour annual run quadratic | Weather-v1 remains linear in interval count |

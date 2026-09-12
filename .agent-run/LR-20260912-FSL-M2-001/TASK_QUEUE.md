# Task Queue

Binding: `LRP-20260912-FSL-M2-001` rev `1` / `D528CD2A4923B29356E36D538893E7DEC78ABB9FFF5ADAFF386425667437370F`

| Order | Wave | Task | State | Exit evidence |
| ---: | --- | --- | --- | --- |
| 1 | Wave 0 | Fresh preflight, M1 closeout, M2 artifacts | IN_PROGRESS | Exact base, hashes, immutable snapshot, checkpoint |
| 2 | Wave 1 | Canonical weather/time/provenance/error contract | PENDING | Pure TS public types and contract tests |
| 3 | Wave 2 | EPW parser and synthetic fixtures | PENDING | Headers, records/hour, radiation/missing, 8760/8784/subhour tests |
| 4 | Wave 3 | NOAA-style solar position v1 | PENDING | Independent reference cases and tolerances |
| 5 | Wave 4 | Weather irradiance and simulation | PENDING | Beam/diffuse/ground/shading/provenance tests |
| 6 | Wave 5 | Validation and optional real EPW smoke | PENDING | Synthetic suite, M1 regression, local dataset result |
| 7 | Wave 6 | Documentation and minimal status | PENDING | Required docs/status, no simulator UI |
| 8 | Wave 7 | Full convergence and self-review | PENDING | All checks, scans, hashes, scope review |
| 9 | Wave 8 | Normal push and Draft PR | PENDING | Fresh OPEN/Draft state then Human Gate |

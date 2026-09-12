# Task Queue

Binding: `LRP-20260912-FSL-M2-001` rev `1` / `9C7B4E5CB255D9EE3BCA68E86E9C50B20272DD94B29A3B671AD481D52B3F7999`

| Order | Wave | Task | State | Exit evidence |
| ---: | --- | --- | --- | --- |
| 1 | Wave 0 | Fresh preflight, M1 closeout, M2 artifacts | COMPLETE | Exact base, hashes, immutable snapshot; checkpoint `bf5f229` |
| 2 | Wave 1 | Canonical weather/time/provenance/error contract | COMPLETE | Pure TS public types and 5 contract tests; checkpoint `3395d13` |
| 3 | Wave 2 | EPW parser and synthetic fixtures | COMPLETE | P1–P11 covered; checkpoint `8bece33` |
| 4 | Wave 3 | NOAA-style solar position v1 | COMPLETE | Five NOAA numeric references plus night/tendency tests; checkpoint `1e6ca0c` |
| 5 | Wave 4 | Weather irradiance and simulation | COMPLETE | S3–S8 and sub-hour accounting; checkpoint `b2f0c32` |
| 6 | Wave 5 | Validation and optional real EPW smoke | COMPLETE | Synthetic/M1/real smoke and comparison; checkpoint `149f283` |
| 7 | Wave 6 | Documentation and minimal status | COMPLETE | Required docs/status and browser check; checkpoint `2927df7` |
| 8 | Wave 7 | Full convergence and self-review | COMPLETE | Full checks/scans/review pass at `ad486d8`; evidence checkpoint follows |
| 9 | Wave 8 | Normal push and Draft PR | HUMAN_GATE | Branch pushed; action-time confirmation required before one Draft PR |

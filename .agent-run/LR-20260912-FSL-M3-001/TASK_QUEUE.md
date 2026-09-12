# Task Queue

Binding: `LRP-20260912-FSL-M3-001` rev `1` / `AFF8B77962787C01B61FE059353FE33B7B3FC9971A1BD126313A1547660DDACB`

| Order | Wave | Task | State | Exit evidence |
| ---: | --- | --- | --- | --- |
| 1 | Wave 0 | Fresh preflight, M2 closeout, M3 artifacts | COMPLETE | Exact base, baseline regressions, immutable snapshot; checkpoint `b2965da` |
| 2 | Wave 1 | Geometry contract and validation | COMPLETE | Opening/overhang/datum/azimuth tests; 5 focused tests |
| 3 | Wave 2 | Polygon primitives and epsilon | COMPLETE | P1–P6; 6 polygon tests |
| 4 | Wave 3 | Finite direct shadow | COMPLETE | G1–G6 analytical geometry; 6 direct-shadow tests |
| 5 | Wave 4 | Orientation and finite-width edges | COMPLETE | G7–G9, F1–F4, 8 orientations; 16 focused cases |
| 6 | Wave 5 | New facade-v1 weather integration | COMPLETE | Identity, provenance, direct/diffuse/ground energy path; 4 tests |
| 7 | Wave 6 | Regression, real smoke, comparisons | COMPLETE | M1/M2, C1–C3, 8,760-record four-orientation real EPW |
| 8 | Wave 7 | Documentation and minimal status | COMPLETE | Geometry contract/model boundary docs and local browser status verification |
| 9 | Wave 8 | Full convergence and self-review | COMPLETE | 86 full / 41 focused / 32 M2 tests; all checks, hashes, scans, smoke, self-review PASS |
| 10 | Wave 9 | Normal push and one Draft PR | COMPLETE | PR #4 exists and is `OPEN / Draft / Ready=false / merged=false` |
| 11 | Wave 10 | Independent FULL Review Required Fix | COMPLETE | Artifact sync and right-hand wording correction; implementation checkpoint `2bf6724` |
| 12 | Wave 11 | Focused Independent Re-Review | HUMAN_GATE | PR #4 remains Draft; do not recreate, Ready, merge, operate Vercel, or begin M4 |

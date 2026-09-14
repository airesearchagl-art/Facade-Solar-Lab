# Task Queue

Binding: `LRP-20260914-FSL-M45-001` rev `1` / `2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B`

## Implementation waves — historical checkpoint

The wave and follow-up checkpoints below retain their original evidence. Their pending gates are superseded by the terminal state at the end; they are not resume instructions.

| Order | Wave | Task | State | Exit evidence |
| ---: | --- | --- | --- | --- |
| 1 | Wave 0 | Fresh Gate, immutable packet, baseline convergence | COMPLETE | Exact main `35f543e...`; PR #5/#6 merged; clean tree; baseline checks PASS |
| 2 | Wave 1 | Pure TS multi-floor model and validation | COMPLETE | Case/Floor types, validation, deep-copy operations |
| 3 | Wave 2 | Canonical Floor simulation, aggregate, delta | COMPLETE | `simulateFacadeV1()` composition; one-floor exact equivalence |
| 4 | Wave 3 | Separate Single/Multi Workspace and visible demo | COMPLETE | Preserved mounted state; deterministic three-floor demo |
| 5 | Wave 4 | Floor editing, Building Case comparison, stale state | COMPLETE | 1–4 Cases; add/duplicate/delete; explicit rerun |
| 6 | Wave 5 | Building Total, Floor Breakdown, monthly UX | COMPLETE | Annual/summer/winter/monthly and baseline deltas |
| 7 | Wave 6 | Stacked geometry and reference rays | COMPLETE | All floors; cumulative height; selected-Floor seasonal references |
| 8 | Wave 7 | Multi-floor PDF, CSV, JSON preset | COMPLETE | Input-only schema; safe wide CSV; print report |
| 9 | Wave 8 | Tests, docs, artifact, regression convergence | COMPLETE | 25 files / 144 tests; focused 19; typecheck/build/audit/Golden/diff PASS; immutable hashes intact |
| 10 | Wave 9 | Normal commit/push and Git Preview | COMPLETE / RESOLVE LIVE | Final branch SHA and exact-source target-null Preview are external fresh-state evidence, not self-references in this commit |
| 11 | Wave 10 | Single/Multi browser smoke and Draft PR | HUMAN_GATE / RESOLVE LIVE | Local browser smoke PASS; authorized Draft PR is created once externally and must not be duplicated on resume |
| 12 | Follow-up | Arbitrary PDF Case color selection | NOT STARTED / OUT OF SCOPE | Separate bounded Human authorization required |
| 13 | Next milestone | M5 | NOT STARTED | Separate Human Task Packet / authorization required |

## Human UX Follow-up 01 — historical implementation checkpoint

At this historical checkpoint, PR #7 existed and was Draft.

| Finding | Implementation / verification | Human status |
| --- | --- | --- |
| UX-01: Floor label / numeric overlap | Separate name/ordinal rows, SVG label/dimension gutters, non-overlapping table columns; 390px and desktop verified | AWAITING HUMAN RE-CHECK |
| UX-02: Selected-floor-only rays | Existing solstice references for every overhang floor, absolute Z translation; absent-overhang test | AWAITING HUMAN RE-CHECK |
| UX-03: Insufficient cross-Case Floor comparison | Bottom-to-top story alignment, annual/summer/winter deltas; missing stories unavailable | AWAITING HUMAN RE-CHECK |
| UX-04: No Floor monthly chart | Case-internal Floor series and same-story Case series; 12 months from saved results | AWAITING HUMAN RE-CHECK |
| Local full convergence | 26 files / 150 tests, typecheck/build/Golden/audit/diff, existing real EPW smoke | COMPLETE |
| Native final-Preview PDF | Print components rendered locally as an A4 layout check; native print/save dialog is not exposed by the browser control surface | HUMAN VERIFICATION REQUIRED |
| Git / PR | Normal push to existing branch; resolve exact-source Git Preview and synchronize PR #7 body after this checkpoint | RESOLVE LIVE / DRAFT ONLY |

## Human UX Follow-up 02 — historical implementation checkpoint

The Human re-check below supersedes the historical pending statuses above.

| Finding / task | Current status |
| --- | --- |
| UX-01: Floor label / numeric overlap | CLOSED / PASS — Human confirmed |
| UX-02: All-floor display | CLOSED / PASS — Human confirmed; ray penetration is separate UX-05 |
| UX-03: Same-story Case comparison | CLOSED / PASS — Human confirmed |
| UX-04: Floor monthly chart | CLOSED / PASS — Human confirmed |
| UX-05: Floor-local reference ray clipping | FIXED / HUMAN_RECHECK_PENDING — raw reference retained; display segment clipped without changing slope |
| Local convergence | COMPLETE — 27 files / 158 tests, typecheck/build/Golden/audit/diff PASS; simulation/Building/Floor/monthly/CSV/preset digests unchanged |
| Print layout | COMPLETE — five local static A4 pages inspected, including 10/15/20 m deep-overhang stress fixture; not native exact-Preview PDF acceptance |
| Git / PR | Resolve live exact-source Git Preview after normal push; synchronize existing PR #7 only; DRAFT ONLY |
| Human gate | STOP — UX-05 Human Re-Check; independent review pending; no Ready/merge/Production/M5 |

## Human UX Acceptance / post-merge terminal state

Human accepted exact product head `0888b66646db328f5d8292bc53aa480a64c61239` after exact-Preview re-check. These current statuses supersede the historical pending findings above.

| Finding / task | Current status |
| --- | --- |
| UX-01: Floor label overlap | CLOSED / PASS |
| UX-02: All-floor solar ray display | CLOSED / PASS |
| UX-03: Floor-by-Floor Case Comparison | CLOSED / PASS |
| UX-04: Floor monthly charts | CLOSED / PASS |
| UX-05: Floor-local solar reference ray clipping | CLOSED / PASS — Human confirmed floor-band containment and no unnatural angle change |
| M4.5 Human UX Review | PASS |
| Acceptance evidence synchronization | Docs-only; product source diff 0; no calculation, CSV or preset changes |
| Independent FULL Review | COMPLETE / PASS — A. PASS — Ready candidate |
| PR #7 Ready transition | COMPLETE |
| PR #7 squash merge | COMPLETE — resulting main `4ea3821f36f65afb36a43de5b6953958d0c3b536` |
| Automatic Production verification | COMPLETE / PASS — `dpl_DfWK1B9yYRUgXPNgxQkCo2SwJGGo`, READY, Git/main/exact merge SHA; canonical URL HTTP 200 |
| M4.5 | COMPLETE — remaining tasks NONE |
| M5 | NOT STARTED |
| Next action | Await separate Human instruction for the next milestone; do not begin M5 automatically |

Reference ray clipping remains visualization only. Cross-floor physical shading is not implemented. Reviewed handoff head: `c3d3238491200be16788200383f343ba6bb26cc5`; this is distinct from the accepted product head and squash merge SHA. Manual Production mutation: none. Branch deletion: none.

This synchronization creates no further M4.5 closeout cycle. After it reaches main, do not create another closeout PR solely to record its own merge. Historical unverified evidence remains historical, not a new M4.5 task or a physical-validation PASS.

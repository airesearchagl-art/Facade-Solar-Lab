# Roadmap

| Milestone | Goal | Status |
| --- | --- | --- |
| M0 — Bootstrap | Long-Run、checkpoint/resume、Vite/React/TypeScript/Vitest基盤 | Complete |
| M1 — Engine Baseline | 単位・入力contract、independent legacy reference、Pure TypeScript core、Golden固定 | Complete |
| M2 — Weather Foundation | EPW ingestion・provenance・LST normalization・weather-v1 energy | Complete |
| M3 — Facade Geometry | 全方位、窓・腰壁・全面窓、有限幅庇、直接影polygon | Complete |
| M4 — Comparison UX | 複数案比較、期間別指標、前提と差分の可視化 | Complete |
| M4.5 — Multi-floor Mode | Building Case配下の複数階composition、建物合計・階別結果・積層形状 | Complete |
| M5 — Validation / Stability | Golden・geometry・weather・third-party比較・boundary test | LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING |
| M6 — Vercel Operation | Preview/Production運用、監視、release gate | Complete |
| M7 — Advanced Facade Shading | 水平庇＋左右端部フィン＋中間フィン配列のdirect shadow・Single/Multi・出力 | Complete |
| M8 — User Guide & Technical Manual | In-app beginner guide + parameter reference + technical model manual | Complete |
| M9 — Parametric Design Explorer | Single 1D/2D sensitivity・Worker・candidate transfer・study export | Complete |
| M10 — Multi-floor Parametric Explorer | Selected/all-floor scopes・Building Total/Floor Breakdown・Multi candidate transfer | Complete |
| M11 — Climate / Weather Scenario Matrix | Single/Multi設計×最大4気象・coverage-aware deltas・matrix/export | IMPLEMENTATION_COMPLETE / HUMAN_UX_REVIEW_PENDING / INDEPENDENT_FULL_REVIEW_PENDING |

## Milestone gates

- 各milestoneでscope・model前提・acceptance criteriaを新しいTask Packetとして確定します。
- M4.5はHuman UX / Independent Review PASSを経てPR #7をsquash merge済みです。M5の[Completion Wave](VALIDATION_PLAN.md#10-completion-wave--local-verification--external-boundary) A〜E / Independent ReviewはPASS、Required Fixなし（Human報告）。PR #10はmerge済み。Radiance / EnergyPlus / SPA / annual physical external validationはNOT_RUNで、M5はLOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDINGです。M6はPR #11 squash merge後の[自動Production provenance・HTTP・browser gate](VERCEL_OPERATION.md#m6-post-merge-closure--phase-0)がPASSしCOMPLETEです。
- M7はIndependent FULL Re-Review A. PASS / Required Fix CLOSED、[exact-head Human HTTP・Single/Multi CSV/PDF acceptance](ADVANCED_FACADE_SHADING.md#human-acceptance--independent-re-review) PASS、PR #12 squash merge後のGit Production `dpl_DyRqKwmhrdHo8gQNqw9pqqmyAR7v` provenance・HTTP/assets・canonical browser smoke PASSによりCOMPLETEです。main checkpointは`642136058d538e89d29971b0a586f86ea3aaa926`です。
- M8はPR #13 squash merge `d1dc91fd18ea6149424c8b192174ab0a130dcb97`とGit Production `dpl_CUM3EEeqj4q3Gs3oy9GGd5srDnb1`のprovenance・HTTP/assets・Guide/Single/Multi/390px smoke PASSによりCOMPLETEです。[M8 closeout](USER_GUIDE.md#m8-post-merge-closeout--m9-phase-0)。
- M9はPR #14 squash merge `9d2efd6c3db0afcc45c6bbfc5cb19f78e0464099`、Git自動Production `dpl_3LkxDP1izwbW5GRzQrCdPV7Es8wN` READY、provenance・canonical HTTP/assets/Worker PASSでCOMPLETE。以前のaccepted Review/Human UXを再実施したとは扱いません。
- M10はPR #15 squash merge/main `56a0f19eb4103c5231f09ec1c79dcfe2f782d783`、Git自動Production `dpl_FLzFM4fpWcXr2NSZmCe71ez4dwY3` READY・canonical HTTP/assets/両Explorer Worker PASSでCOMPLETE。[M11 Phase 0証拠](WEATHER_SCENARIO_MATRIX.md#m10-post-merge-fresh-closeout)。過去review/Human attributionは維持。PDF向き・末尾空白ページは非blocking Advisory。
- M11は[気象シナリオ比較](WEATHER_SCENARIO_MATRIX.md)を実装済み。Human UX / Independent FULL Review待ち、Ready・merge未許可。M12 NOT STARTED。
- M5のvalidation完了前に絶対値を正式性能評価として扱いません。
- Ready for Review、merge、manual Production操作はHuman Gateです。承認されたmain merge後のGit自動Productionは既存運用ですが、[post-merge release gate](RELEASE_GATE.md)でsource/alias/smokeを検証します。

## M4.5 model boundary

各Floorを既存`FacadeV1Parameters`へ変換してcanonical `simulateFacadeV1()`を1回ずつ実行します。Building Totalは階別の年間・夏期・冬期・月別日射熱取得量の単純合算です。solar / weather / shadow formulaを複製せず、1 Floor時は単一階結果とexact一致させます。

Cross-floor physical shadingは未実装です。全階のreference rayとfloor-local clippingは可視化のみで、上下階の相互遮蔽計算ではありません。

## M4.5 non-goals

自動最適化、side fin、reveal、複数開口・複数遮蔽物、任意3D mesh、finite-width diffuse遮蔽、Perez/anisotropic sky、glass product database、glass IAC、account、cloud save、任意Case色指定、正式な第三者solver validationはM4.5で実装しません。

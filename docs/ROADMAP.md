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
| M6 — Vercel Operation | Preview/Production運用、監視、release gate | IMPLEMENTATION_COMPLETE / PRE_MERGE_GATE_PASS / MERGE_PRODUCTION_CONFIRMATION_PENDING |

## Milestone gates

- 各milestoneでscope・model前提・acceptance criteriaを新しいTask Packetとして確定します。
- M4.5はHuman UX / Independent Review PASSを経てPR #7をsquash merge済みです。M5はP0-A/P0-C/P1-A focused reviewとP0-B protocol review PASS後、[Completion Wave](VALIDATION_PLAN.md#10-completion-wave--local-verification--external-boundary)のlocal検証A〜Eを完了しました。Completion Wave Independent Review: A. PASS / Required Fix: none / Blocker: none（Human報告）。PR #10はmerge済みです。Radiance / EnergyPlus / SPA / annual physical external validationはNOT_RUNで、M5はLOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDINGです。M6は[運用Completion Wave](VERCEL_OPERATION.md)のIndependent Review A. PASS / Required Fixなし、accepted exact PreviewのHuman HTTP証拠PASSを経てPRE-MERGE gate PASSです。PR #11はDraft維持、Ready transition承認待ち。merge/Production確認はpendingです。
- M5のvalidation完了前に絶対値を正式性能評価として扱いません。
- Ready for Review、merge、manual Production操作はHuman Gateです。承認されたmain merge後のGit自動Productionは既存運用ですが、[post-merge release gate](RELEASE_GATE.md)でsource/alias/smokeを検証します。

## M4.5 model boundary

各Floorを既存`FacadeV1Parameters`へ変換してcanonical `simulateFacadeV1()`を1回ずつ実行します。Building Totalは階別の年間・夏期・冬期・月別日射熱取得量の単純合算です。solar / weather / shadow formulaを複製せず、1 Floor時は単一階結果とexact一致させます。

Cross-floor physical shadingは未実装です。全階のreference rayとfloor-local clippingは可視化のみで、上下階の相互遮蔽計算ではありません。

## M4.5 non-goals

自動最適化、side fin、reveal、複数開口・複数遮蔽物、任意3D mesh、finite-width diffuse遮蔽、Perez/anisotropic sky、glass product database、glass IAC、account、cloud save、任意Case色指定、正式な第三者solver validationはM4.5で実装しません。

# Roadmap

| Milestone | Goal | Status |
| --- | --- | --- |
| M0 — Bootstrap | Long-Run、checkpoint/resume、Vite/React/TypeScript/Vitest基盤 | Complete |
| M1 — Engine Baseline | 単位・入力contract、independent legacy reference、Pure TypeScript core、Golden固定 | Complete |
| M2 — Weather Foundation | EPW ingestion・provenance・LST normalization・weather-v1 energy | Complete |
| M3 — Facade Geometry | 全方位、窓・腰壁・全面窓、有限幅庇、直接影polygon | Complete |
| M4 — Comparison UX | 複数案比較、期間別指標、前提と差分の可視化 | Complete |
| M4.5 — Multi-floor Mode | Building Case配下の複数階composition、建物合計・階別結果・積層形状 | Complete |
| M5 — Validation / Stability | Golden・geometry・weather・third-party比較・boundary test | Current — P0-C weather entry boundary implemented; review pending; Radiance NOT RUN |
| M6 — Vercel Operation | Preview/Production運用、監視、release gate | Planned |

## Milestone gates

- 各milestoneでscope・model前提・acceptance criteriaを新しいTask Packetとして確定します。
- M4.5はHuman UX Review PASS / Independent FULL Review A. PASSを経てPR #7をsquash merge済みです。M5はP0-A focused review / P0-B protocol review PASSを経て、[P0-C weather entry boundary](VALIDATION_PLAN.md#8-p0-c--weather-entry-boundary)のtests・partial表示修正済みでreview待ちです。Radiance未検出のため実solver比較はNOT RUN、M6はPlanned / NOT STARTEDのままです。
- M5のvalidation完了前に絶対値を正式性能評価として扱いません。
- Production deployment、Ready for Review、mergeはHuman Gateです。

## M4.5 model boundary

各Floorを既存`FacadeV1Parameters`へ変換してcanonical `simulateFacadeV1()`を1回ずつ実行します。Building Totalは階別の年間・夏期・冬期・月別日射熱取得量の単純合算です。solar / weather / shadow formulaを複製せず、1 Floor時は単一階結果とexact一致させます。

Cross-floor physical shadingは未実装です。全階のreference rayとfloor-local clippingは可視化のみで、上下階の相互遮蔽計算ではありません。

## M4.5 non-goals

自動最適化、side fin、reveal、複数開口・複数遮蔽物、任意3D mesh、finite-width diffuse遮蔽、Perez/anisotropic sky、glass product database、glass IAC、account、cloud save、任意Case色指定、正式な第三者solver validationはM4.5で実装しません。

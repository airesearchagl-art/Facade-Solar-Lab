# Roadmap

| Milestone | Goal | Status |
| --- | --- | --- |
| M0 — Bootstrap | Long-Run、checkpoint/resume、Vite/React/TypeScript/Vitest基盤 | Current |
| M1 — Engine Baseline | 単位・入力contract、legacy baselineの把握、pure calculation core | Planned |
| M2 — Weather Foundation | 時刻別実気象dataのingestion・provenance・normalization | Planned |
| M3 — Facade Geometry | 全方位、窓・腰壁・全面窓、庇と窓の関係、境界処理 | Planned |
| M4 — Comparison UX | 複数案比較、期間別指標、前提と差分の可視化 | Planned |
| M5 — Validation / Stability | Golden・geometry・weather・third-party比較・boundary test | Planned |
| M6 — Vercel Operation | Preview/Production運用、監視、release gate | Planned |

## Milestone gates

- 各milestoneでscope・model前提・acceptance criteriaを新しいTask Packetとして確定します。
- M0完了からM1へ自動移行しません。
- M5のvalidation完了前に絶対値を正式性能評価として扱いません。
- Production deployment、Ready for Review、mergeはHuman Gateです。

## M0 non-goals

EPW parser、拡張アメダス、legacy engine移植、全方位計算、腰壁geometry、有限庇3D、Perez天空model、ガラスIAC、複数case比較、export、Vercel接続はM0で実装しません。

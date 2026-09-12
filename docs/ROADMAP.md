# Roadmap

| Milestone | Goal | Status |
| --- | --- | --- |
| M0 — Bootstrap | Long-Run、checkpoint/resume、Vite/React/TypeScript/Vitest基盤 | Complete |
| M1 — Engine Baseline | 単位・入力contract、independent legacy reference、Pure TypeScript core、Golden固定 | Current |
| M2 — Weather Foundation | 時刻別実気象dataのingestion・provenance・normalization | Planned |
| M3 — Facade Geometry | 全方位、窓・腰壁・全面窓、庇と窓の関係、境界処理 | Planned |
| M4 — Comparison UX | 複数案比較、期間別指標、前提と差分の可視化 | Planned |
| M5 — Validation / Stability | Golden・geometry・weather・third-party比較・boundary test | Planned |
| M6 — Vercel Operation | Preview/Production運用、監視、release gate | Planned |

## Milestone gates

- 各milestoneでscope・model前提・acceptance criteriaを新しいTask Packetとして確定します。
- M1完了からM2へ自動移行しません。
- M5のvalidation完了前に絶対値を正式性能評価として扱いません。
- Production deployment、Ready for Review、mergeはHuman Gateです。

## M1 non-goals

EPW parser、拡張アメダス、Clear Sky model修正、`k_sky`廃止、365日化、高精度太陽位置、全方位geometry再設計、有限庇3D、ガラスIAC、複数case UI、chart、export、Vercel接続はM1で実装しません。

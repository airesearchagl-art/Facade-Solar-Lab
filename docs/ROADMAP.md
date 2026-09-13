# Roadmap

| Milestone | Goal | Status |
| --- | --- | --- |
| M0 — Bootstrap | Long-Run、checkpoint/resume、Vite/React/TypeScript/Vitest基盤 | Complete |
| M1 — Engine Baseline | 単位・入力contract、independent legacy reference、Pure TypeScript core、Golden固定 | Complete |
| M2 — Weather Foundation | EPW ingestion・provenance・LST normalization・weather-v1 energy | Complete |
| M3 — Facade Geometry | 全方位、窓・腰壁・全面窓、有限幅庇、直接影polygon | Complete |
| M4 — Comparison UX | 複数案比較、期間別指標、前提と差分の可視化 | Current |
| M5 — Validation / Stability | Golden・geometry・weather・third-party比較・boundary test | Planned |
| M6 — Vercel Operation | Preview/Production運用、監視、release gate | Planned |

## Milestone gates

- 各milestoneでscope・model前提・acceptance criteriaを新しいTask Packetとして確定します。
- M4は専用Task PacketとHuman authorizationに基づいて進行します。
- M5のvalidation完了前に絶対値を正式性能評価として扱いません。
- Production deployment、Ready for Review、mergeはHuman Gateです。

## M4 non-goals

自動最適化、side fin、reveal、複数開口・複数遮蔽物、任意3D mesh、finite-width diffuse遮蔽、Perez/anisotropic sky、glass product database、glass IAC、account、cloud save、正式Production releaseはM4で実装しません。Human承認済みbounded follow-upとしてbrowser print/CSVと入力専用JSON presetだけを追加し、cloud persistenceには拡張しません。

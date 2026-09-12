# Roadmap

| Milestone | Goal | Status |
| --- | --- | --- |
| M0 — Bootstrap | Long-Run、checkpoint/resume、Vite/React/TypeScript/Vitest基盤 | Complete |
| M1 — Engine Baseline | 単位・入力contract、independent legacy reference、Pure TypeScript core、Golden固定 | Complete |
| M2 — Weather Foundation | EPW ingestion・provenance・LST normalization・weather-v1 energy | Complete |
| M3 — Facade Geometry | 全方位、窓・腰壁・全面窓、有限幅庇、直接影polygon | Current — complete on branch |
| M4 — Comparison UX | 複数案比較、期間別指標、前提と差分の可視化 | Planned |
| M5 — Validation / Stability | Golden・geometry・weather・third-party比較・boundary test | Planned |
| M6 — Vercel Operation | Preview/Production運用、監視、release gate | Planned |

## Milestone gates

- 各milestoneでscope・model前提・acceptance criteriaを新しいTask Packetとして確定します。
- M3完了からM4へ自動移行しません。
- M5のvalidation完了前に絶対値を正式性能評価として扱いません。
- Production deployment、Ready for Review、mergeはHuman Gateです。

## M3 non-goals

Comparison UX、複数case UI、chart、export、side fin、reveal、複数開口・複数遮蔽物、任意3D mesh、finite-width diffuse遮蔽、Perez/anisotropic sky、glass IAC、Vercel接続はM3で実装しません。

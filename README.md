# Facade Solar Lab

建物ファサードの形状と日射熱取得の関係を、設計初期に素早く比較するためのWebツールです。

窓・庇・方位・ガラス・地点条件を変えながら、年間／夏季／冬季の差を確認し、意匠デザインと日射性能を往復できる設計支援環境を目指します。最終的な設計判断はHumanが行います。

## Current state

現在は **M4 — Comparison UX** です。M1–M3の計算baselineを維持したまま、同一EPW条件で1–4案を比較するbrowser-local Facade Comparison Workspaceを実装しています。

- Minimal UI: 実装済み
- Pure TypeScript engine境界: 実装済み
- Legacy日射計算engine: 実装済み（M1 regression baseline）
- Original-source reference / Golden test: 実装済み
- 実気象data: `.epw`をbrowser-localで読み込むUIを実装済み
- Facade geometry: 有限幅庇のdirect-shadow polygon clipping実装済み
- Comparison: Case追加・複製・baseline・期間別/月別KPI・入力差分・geometry説明図を実装済み
- Backend / Database: なし
- Production deployment: 未実施

旧MVP v0.1原本は `legacy/mvp-v0.1/` に改変せず保存しています。M4 Comparison domainは既存`facade-v1-weather`を呼ぶadapterであり、別のsolar calculationを持ちません。weather-backedですが、最終modelや検証済み物理modelではありません。

> [!WARNING]
> M4の比較値を含め、第三者solverとの物理validationが完了するまで絶対値 `[kWh]` をBEI、法適合、HVAC sizing、最終認証、保証値に使用できません。同一前提での設計比較を支援し、最終判断はHumanが行います。

## Development

Requirements:

- Node.js `^22.12.0 || ^24.0.0 || >=26.0.0`
- npm

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run typecheck
npm run build
npm run golden:check
npm audit
```

## Project structure

```text
.
├─ src/
│  ├─ app/       # React UI
│  ├─ comparison/ # Pure TS Case / baseline / delta / difference domain
│  ├─ engine/    # UI非依存のlegacy-v01 / weather-v1 / facade-v1 engine
│  ├─ geometry/  # Facade-local geometry / clipping / direct shadow
│  ├─ models/    # Domain model領域
│  ├─ weather/   # Canonical weather contract / Pure TS EPW parser
│  └─ main.tsx
├─ tests/        # Golden / EPW / solar / energy / boundary
├─ scripts/      # Original-source reference fixture generator
├─ docs/
├─ legacy/       # 提供済み原本だけを保存
└─ .agent-run/   # Long-Run checkpoint / resume artifact
```

計算logicをReact componentへ埋め込まず、Browser UI・Node.js・batch test・validation scriptから共通利用できる構造を維持します。

## Documentation

- [Product direction](docs/PRODUCT_DIRECTION.md)
- [Model limitations](docs/MODEL_LIMITATIONS.md)
- [Roadmap](docs/ROADMAP.md)
- [Validation plan](docs/VALIDATION_PLAN.md)
- [Legacy baseline](docs/LEGACY_BASELINE.md)
- [Weather foundation](docs/WEATHER_FOUNDATION.md)
- [Facade geometry foundation](docs/FACADE_GEOMETRY.md)
- [Comparison UX](docs/COMPARISON_UX.md)

## Development status

M4完了後はDraft PRでHuman Gate停止します。M5への自動移行、`main`への直接commit/push、Ready for Review、merge、Production deployは行いません。

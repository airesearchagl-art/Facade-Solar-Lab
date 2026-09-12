# Facade Solar Lab

建物ファサードの形状と日射熱取得の関係を、設計初期に素早く比較するためのWebツールです。

窓・庇・方位・ガラス・地点条件を変えながら、年間／夏季／冬季の差を確認し、意匠デザインと日射性能を往復できる設計支援環境を目指します。最終的な設計判断はHumanが行います。

## Current state

現在は **M1 — Engine Baseline** です。Human提供の旧MVP v0.1をbyte-for-byte保存し、その計算挙動をPure TypeScript engineとGolden testで固定しています。

- Minimal UI: 実装済み
- Pure TypeScript engine境界: 実装済み
- Legacy日射計算engine: 実装済み（M1 regression baseline）
- Original-source reference / Golden test: 実装済み
- 実気象data: 未実装（M2）
- Backend / Database: なし
- Production deployment: 未実施

旧MVP v0.1原本は `legacy/mvp-v0.1/` に改変せず保存しています。M1 engineはその挙動を再現しますが、最終modelや検証済み物理modelではありません。

> [!WARNING]
> 実気象dataによるvalidationが完了するまで、M1の絶対値 `[kWh]` を正式な性能評価や実務判断の根拠に使用できません。これはLegacy regression baselineです。

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
│  ├─ engine/    # UI frameworkに依存しないPure TypeScript Legacy engine
│  ├─ models/    # Domain model領域
│  ├─ weather/   # Weather adapter領域（M2以降）
│  └─ main.tsx
├─ tests/        # Golden comparison / engine boundary
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

## Development status

M1完了後はDraft PRでHuman Gate停止します。M2への自動移行、`main`への直接commit/push、Ready for Review、merge、Production deployは行いません。

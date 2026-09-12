# Facade Solar Lab

建物ファサードの形状と日射熱取得の関係を、設計初期に素早く比較するためのWebツールです。

窓・庇・方位・ガラス・地点条件を変えながら、年間／夏季／冬季の差を確認し、意匠デザインと日射性能を往復できる設計支援環境を目指します。最終的な設計判断はHumanが行います。

## Current state

現在は **M0 — Bootstrap** です。開発・test・build・長時間runのcheckpoint/resumeに必要な基盤のみを実装しています。

- Minimal UI: 実装済み
- Pure TypeScript engine境界: 実装済み
- 日射計算engine: 未実装（M1）
- 実気象data: 未実装（M2）
- Backend / Database: なし
- Production deployment: 未実施

既存のMVP v0.1は本開発の参考資料であり、最終modelではありません。原本が提供された場合だけ `legacy/mvp-v0.1/` に改変せず保存します。

> [!WARNING]
> 実気象dataによるvalidationが完了するまで、日射熱取得量の絶対値 `[kWh]` を正式な性能評価や実務判断の根拠に使用できません。M0は計算値を出力しません。

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
```

## Project structure

```text
.
├─ src/
│  ├─ app/       # React UI
│  ├─ engine/    # UI frameworkに依存しないPure TypeScript
│  ├─ models/    # Domain model領域（M1以降）
│  ├─ weather/   # Weather adapter領域（M2以降）
│  └─ main.tsx
├─ tests/
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

## Development status

M0完了後はHuman Gateで停止します。M1への自動移行、`main`への直接commit/push、Ready for Review、merge、Production deployは行いません。

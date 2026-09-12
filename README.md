# Facade Solar Lab

建物ファサードの形状と日射熱取得の関係を、設計初期に素早く比較するためのWebツールです。

窓・庇・方位・ガラス・地点条件を変えながら、年間／夏季／冬季の差を確認し、意匠デザインと日射性能を往復できる設計支援環境を目指します。最終的な設計判断はHumanが行います。

## Current state

現在は **M2 — Weather Foundation** です。M1 Legacy baselineをbyte-for-byte/Goldenで維持したまま、Pure TypeScriptのEPW parser、Local Standard Time contract、NOAA-style solar position、weather-driven interval energy基盤を追加しています。

- Minimal UI: 実装済み
- Pure TypeScript engine境界: 実装済み
- Legacy日射計算engine: 実装済み（M1 regression baseline）
- Original-source reference / Golden test: 実装済み
- 実気象data: EPW foundation実装済み（import UIは未実装）
- Backend / Database: なし
- Production deployment: 未実施

旧MVP v0.1原本は `legacy/mvp-v0.1/` に改変せず保存しています。M1とM2は明示的に別modelです。M2はweather-backedですが、最終modelや検証済み物理modelではありません。

> [!WARNING]
> M2の実EPW smokeはparser/simulation完走確認です。第三者solverとの物理validationが完了するまで、M1/M2の絶対値 `[kWh]` を正式な性能評価や実務判断の根拠に使用できません。

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
│  ├─ engine/    # UI非依存のlegacy-v01 / weather-v1 engine
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

## Development status

M2完了後はDraft PRでHuman Gate停止します。M3への自動移行、`main`への直接commit/push、Ready for Review、merge、Production deployは行いません。

# Facade Solar Lab

建物ファサードの形状と日射熱取得の関係を、設計初期に素早く比較するためのWebツールです。

窓・庇・方位・ガラス・地点条件を変えながら、年間／夏季／冬季の差を確認し、意匠デザインと日射性能を往復できる設計支援環境を目指します。最終的な設計判断はHumanが行います。

## Current state

**M4 — Comparison UX / M4.5 — Multi-floor Mode はComplete** です。[PR #7](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/7)はsquash merge済みです。M4の単一階Workspaceを維持したまま、同一EPW条件で1–4棟のBuilding Caseと各棟の複数階を比較するbrowser-local Workspaceを実装済みです。

- Minimal UI: 実装済み
- Pure TypeScript engine境界: 実装済み
- Legacy日射計算engine: 実装済み（M1 regression baseline）
- Original-source reference / Golden test: 実装済み
- 実気象data: `.epw`をbrowser-localで読み込むUIを実装済み
- Facade geometry: 有限幅庇のdirect-shadow polygon clipping実装済み
- Single-floor Comparison: Case追加・複製・baseline・期間別/月別の日射熱取得・入力差分・代表日参考線・全案形状PDF・CSV・入力専用JSONプリセットを実装済み
- Multi-floor Comparison: Building Case / Floor追加・複製・削除、建物合計・階別Case比較・階別月次比較、積層立面・断面・全階の参考線、PDF・CSV・入力専用JSONプリセットを実装済み
- Backend / Database: なし
- Production: PR #7のmain mergeによる自動deploymentがREADY。[canonical URL](https://facade-solar-lab.vercel.app/)はHTTP 200確認済み。closeoutでの手動Production操作はありません。これは物理性能validationの完了を意味しません。

旧MVP v0.1原本は `legacy/mvp-v0.1/` に改変せず保存しています。M4 Comparison domainとM4.5 Multi-floor domainはいずれも既存`facade-v1-weather`を呼ぶadapterです。複数階では各Floorを`FacadeV1Parameters`へ変換し、`simulateFacadeV1()`を1回ずつ実行してBuilding Totalへ単純合算します。別のsolar / weather / shadow calculationは持ちません。

Cross-floor physical shading（上下階間の物理的な相互遮蔽）は未実装です。全階のreference rayとfloor-local clippingは可視化のみで、計算結果を変更しません。

Single / Multiとも、選択中のCaseの「表示色」を変更できます。月別グラフ・凡例・Caseマーカー・印刷/PDFへ即時反映し、計算値や再計算待ち状態には影響しません。色はセッション内のみで、JSON/CSVには保存しません。リロード・デモ再読込・比較セット置換では既定色へ戻り、新規/複製Caseは既存配色から始まります。白黒印刷ではCase文字と線種を併用してください。階別グラフでは、色指定後はCase色と階ごとの線種を使います。

> [!WARNING]
> M4/M4.5の比較値を含め、第三者solverとの物理validationが完了するまで絶対値 `[kWh]` をBEI、法適合、HVAC sizing、最終認証、保証値に使用できません。表示値は開口からの日射熱取得量であり、HVAC冷房・暖房負荷ではありません。

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
│  ├─ multifloor/ # Pure TS Building Case / Floor / aggregate / preset / CSV
│  ├─ preset/    # Pure TS versioned Case / Workspace JSON preset
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

M4.5はHuman UX Review PASS / Independent FULL Review A. PASSを経て完了しています。M5 — Validation / StabilityとM6 — Vercel OperationはPlannedであり、M5はNOT STARTEDです。第三者による絶対値 `[kWh]` の正式な物理validationは未完了です。次milestoneには別のHuman Task Packet / authorizationが必要で、自動移行しません。

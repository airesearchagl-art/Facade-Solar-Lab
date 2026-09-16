# Facade Solar Lab

建物ファサードの形状と日射熱取得の関係を、設計初期に素早く比較するためのWebツールです。

窓・庇・方位・ガラス・地点条件を変えながら、年間／夏季／冬季の差を確認し、意匠デザインと日射性能を往復できる設計支援環境を目指します。最終的な設計判断はHumanが行います。

## Current state

**M10 — Multi-floor Parametric Explorer: IMPLEMENTATION_COMPLETE / HUMAN_UX_REVIEW_PENDING / INDEPENDENT_FULL_REVIEW_PENDING**。Multiの選択階のみ／全階共通scope、1D/2D探索（最大64）、Building TotalとFloor Breakdown・形状、通常Multiへの追加（最大4案）、CSV・入力専用JSON・印刷/PDFを実装。M9のrange/Workerと既存Multi計算を再利用し、物理式は変更しません。[M10 contract・検証・review handoff](docs/MULTIFLOOR_PARAMETRIC_EXPLORER.md)。M11 NOT STARTED。

**M9 — Parametric Design Explorer: COMPLETE**。PR #14 squash merge `9d2efd6c3db0afcc45c6bbfc5cb19f78e0464099`、Git自動Production provenance・HTTP/assets/Worker PASS。[M9履歴](docs/PARAMETRIC_EXPLORER.md)。Singleの15軸・1D/2D・canonical Worker・immutable snapshot/STALE・CSV/JSON/printを維持。Ready / merge / manual Productionは別Human Gateです。

**M8 — User Guide & Technical Manual: COMPLETE**。PR #13は`d1dc91fd18ea6149424c8b192174ab0a130dcb97`へsquash merge済み。Git自動Production `dpl_CUM3EEeqj4q3Gs3oy9GGd5srDnb1`のprovenance・HTTP・canonical browser smoke PASS。[M8 closeout](docs/USER_GUIDE.md#m8-post-merge-closeout--m9-phase-0)。上部Guideと`#single` / `#multi` / `#guide`間でWorkspace状態を保持します。

**M7 — Advanced Facade Shading: COMPLETE**。水平庇＋左右端部フィン＋中間フィン配列のdirect shadow、Single/Multi比較・保存・出力を実装済みです。Independent FULL Re-Review A. PASS / Required Fix CLOSED、accepted product head `41302270ca4a84501f824ddef9f62194cad95b8e`のHuman HTTP・Single/Multi CSV/PDF acceptance PASSを[証拠](docs/ADVANCED_FACADE_SHADING.md#human-acceptance--independent-re-review)へ記録しました。PR #12はsquash merge済み。main `642136058d538e89d29971b0a586f86ea3aaa926`のGit自動Production provenance・HTTP・Single/Multi post-merge browser smokeもPASSです。

**M6 — COMPLETE**。PR #11はsquash merge済み。[運用contract・post-merge証拠](docs/VERCEL_OPERATION.md)にGit自動Productionのprovenance・HTTP・Single/Multi browser PASSを記録しました。手動Production操作なし、M6の再closeoutは不要です。

**M5: LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING**。[検証計画・結果](docs/VALIDATION_PLAN.md#10-completion-wave--local-verification--external-boundary)に極域/時間分解能・数値境界・独立Single/Multi・実EPW製品経路・依存/負荷検証を記録しました。Completion Wave Independent Review: A. PASS / Required Fix: none / Blocker: none（Human報告）。PR #10はmerge済みです。Radiance / EnergyPlus / SPA / annual physical external validationはNOT_RUNで、絶対kWhの正式validation完了ではありません。

**M4 — Comparison UX / M4.5 — Multi-floor Mode はComplete** です。[PR #7](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/7)はsquash merge済みです。M4の単一階Workspaceを維持したまま、同一EPW条件で1–4棟のBuilding Caseと各棟の複数階を比較するbrowser-local Workspaceを実装済みです。

- Minimal UI: 実装済み
- Pure TypeScript engine境界: 実装済み
- Legacy日射計算engine: 実装済み（M1 regression baseline）
- Original-source reference / Golden test: 実装済み
- 実気象data: `.epw`をbrowser-localで読み込むUIを実装済み
- Facade geometry: 有限幅庇＋端部・中間フィンのdirect-shadow polygon union実装済み（M7再review・Human acceptance PASS、外部physical validationは未実施）
- Single-floor Comparison: Case追加・複製・baseline・期間別/月別の日射熱取得・入力差分・代表日参考線・全案形状PDF・CSV・入力専用JSONプリセットを実装済み
- Multi-floor Comparison: Building Case / Floor追加・複製・削除、建物合計・階別Case比較・階別月次比較、積層立面・断面・全階の参考線、PDF・CSV・入力専用JSONプリセットを実装済み
- Backend / Database: なし
- Production確認checkpoint: main `9d2efd6c3db0afcc45c6bbfc5cb19f78e0464099` / `dpl_3LkxDP1izwbW5GRzQrCdPV7Es8wN`、Git自動Production READY。[canonical URL](https://facade-solar-lab.vercel.app/)のindex・JS・CSS・explorer Worker・favicon.svg各200（M10 Phase 0 read-only）。M9 Human UX/Reviewは再実施していません。deployment成功は物理validationではありません。

旧MVP v0.1原本は `legacy/mvp-v0.1/` に改変せず保存しています。Single/Multiはcanonical `simulateFacade()`へ渡し、有効フィンなしなら既存`facade-v1-weather`、ありなら`facade-v2-weather`を使います。各Floorで1回だけ実行し、Building Totalは単純合算です。solar / weather / SHGC / energy aggregationは共有し、M7でdirect shadowだけを拡張しています。

左右端部フィンに加え、中間フィンの出・上端・下端・中心ピッチ／枚数をCase/Floorごとに編集できます。中央割付・最大128枚、実配置枚数／中心ピッチ／左右余白を表示し、入力差分、立面、CSV、全案印刷/PDFへ反映します。Single/Multiの専用「フィンのピッチ比較」デモは、同じ幅6 mの開口で配列なし／出0.6 m・P2 m／出0.6 m・P1 mの3案を比較します。合成気象であり性能検証ではありません。JSONは入力のみ。庇のみの旧schema v1は維持し、フィン情報（任意の中間配列を含む）がある場合はschema v2＋`geometryVersion: facade-v2`で保存します。[契約・制限・検証](docs/ADVANCED_FACADE_SHADING.md)。

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
│  ├─ engine/    # UI非依存のlegacy-v01 / weather-v1 / facade-v1/v2 engine
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
- [In-app user guide contract](docs/USER_GUIDE.md)
- [Advanced facade shading](docs/ADVANCED_FACADE_SHADING.md)
- [Vercel operation / incident runbook](docs/VERCEL_OPERATION.md)
- [Release gate](docs/RELEASE_GATE.md)

## Development status

M4.5 / M6 / M7 / M8はCOMPLETE。M5はIndependent Review A. PASSを経てLOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDINGで、絶対値 `[kWh]` の正式な物理validationは未完了です。M9は上記Human受理済みpre-merge state、PR #14はOPEN / Draft。Ready / merge / post-merge Production confirmationは別Human Gate、M10 NOT STARTEDです。

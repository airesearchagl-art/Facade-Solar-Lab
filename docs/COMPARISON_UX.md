# Facade Comparison UX

## Purpose

M4は、同一のbrowser-local EPW datasetに対して1–4件のファサード案を並べる設計比較workspaceです。自動で最適案を判定せず、方位、矩形開口、有限水平庇、SHGC、ground reflectanceの差と、Annual / Summer / Winter / Monthlyの日射熱取得差を確認できるようにします。

## Boundary

```text
src/app
  File selection / React state / SVG / accessible tables
        ↓
src/comparison
  Case operations / validation / delta / input differences
        ↓
src/engine/facade-v1
  canonical weather-backed calculation
        ↓
src/weather + src/geometry
```

`src/comparison/**`はPure TypeScriptです。React、DOM、Canvas、File API、Node filesystemへ依存せず、solar position、irradiance、shadow geometryを複製しません。

## Case contract

```ts
interface ComparisonCase {
  id: string
  name: string
  parameters: FacadeV1Parameters
}
```

- Case数は1–4です。
- IDは呼出側が供給し、simulation結果から生成しません。testsはdeterministic IDを使います。
- Duplicateはparametersをdeep copyし、新しいIDを要求します。
- 最後の1 Caseは削除できません。
- baseline削除時は、残る配列の先頭Caseをdeterministically baselineへ割り当てます。

## Validation

既存facade-v1 geometry validationを正本とし、M4入力契約としてさらに`0 < SHGC <= 1`を要求します。非finite数、`width <= 0`、`head <= sill`、負の庇depth/extensions、opening head未満の庇elevation、`groundReflectance`範囲外を拒否します。値をsilent clampしません。Facade azimuthだけは既存engine contractでnormalizeします。

## Explicit Run Comparison

EPWは1回parseしてmemory上のcanonical `WeatherDataset`として各Caseへ再利用します。full-year simulationはinput keystrokeごとに実行せず、明示的な`Run Comparison`で最大4 Caseをまとめて計算します。編集後は`Changes not calculated`を表示し、last-run結果とcurrent inputを混同しません。

EPW raw本文はstate、localStorage、backendへ保存せず、UIにも表示しません。repositoryはreal EPWをbundleしません。

## KPI and delta semantics

各Caseは`withOverhangKWh`、`withoutOverhangKWh`、`reductionPercent`をAnnual、Cooling（Apr–Sep）、Heating（Oct–Mar）で保持します。UIの中心値は`withOverhangKWh`です。

```text
delta = case - baseline
percent = delta / baseline × 100
```

baselineが0の場合、percentageは`null`、UIは`—`です。負のdeltaはbaselineより取得が少ないことだけを意味し、常に良いとは表示しません。

Monthly chartは12ヶ月の`withOverhangKWh`を比較します。線色に加えてdash patternとCase letterを使い、同じ値をsemantic tableで常時確認できます。

## Geometry and input differences

selected CaseのSectionとfront elevationをSVG説明図で表示します。sill、head、opening height、overhang elevation/depth、opening/overhang width、left/right extensionsを確認できますが、CAD寸法取得用ではありません。

baseline input differenceはnormalized facade azimuth、opening、overhang enable/disableと寸法、SHGC、ground reflectanceを対象とし、同値fieldを省略します。

## Model identity

```text
modelVersion: facade-v1-weather
geometryVersion: facade-v1
direct: finite-rectangular-overhang-shadow-polygon-v1
diffuse: isotropic-2d-infinite-width-v1
ground: ghi-ground-reflection-0.5-v1
```

有限幅geometryはdirect shadowだけへ適用します。diffuseは2D infinite-width近似、ground reflectionは庇遮蔽なしです。

## Validation route

- Pure domain: Case operations、validation、period/month delta、input difference、boundary tests。
- Adapter: synthetic EPWをfile-like browser contractから既存parserへ渡すtest。
- Local real data: hash一致Tokyo Hyakuri EPWで8760 intervals、2 Case、12 months、finite KPI、direct engine一致。
- Browser: Vercel PreviewでEPW選択、Case duplicate、input edit、Run、KPI、chart、delta、geometry、assumptions、warning、console/assetを確認します。

## M5へ残す課題

- third-party solverとのabsolute / relative result validation
- uncertaintyとtoleranceの正式化
- finite-width diffuse model
- additional geometry/model validation cases
- Production判断はM6 Human Gateであり、M4では行いません

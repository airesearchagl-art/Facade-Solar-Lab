# Legacy MVP v0.1 Baseline

## Status

`LEGACY BASELINE / NOT VALIDATED PHYSICAL MODEL`

M1は旧MVPのactual calculation behaviorを再現し、将来のmodel変更量を追跡するためのregression baselineを固定します。物理的な問題は修正せず、絶対値を正式な性能評価に使用しません。

## Preserved sources

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| `legacy/mvp-v0.1/solar_overhang_simulator.html` | 16,835 | `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5` |
| `legacy/mvp-v0.1/HANDOVER_solar_overhang_simulator.md` | 22,635 | `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` |

両ファイルはpath-specific `-text` 属性でGitのEOL normalizationから除外しています。workspace、staged bytes、committed blobから復元したbytesのSHA-256が一致しています。

## Parameter contract

| Legacy | TypeScript | Unit | Legacy UI range | Default | Convention |
| --- | --- | --- | --- | ---: | --- |
| `H` | `windowHeightM` | m | 0.6–4.0 | 2.40 | 正値 |
| `D` | `overhangDepthM` | m | 0–4.0 | 1.60 | 水平庇の出。0は庇なし |
| `O` | `overhangToWindowHeadM` | m | 0–1.5 | 0.30 | 庇から窓頭まで鉛直下向き |
| `W` | `windowWidthM` | m | 1–12 | 6.00 | 絶対量のみ線形scale |
| `L` | `latitudeDeg` | degree north | 24–46 | 35.2 | 北緯を正 |
| `A` | `surfaceAzimuthDeg` | degree | -90–+90 | 0 | 南=0、西を正 |
| `G` | `solarHeatGainCoefficient` | ratio | 0.1–1.0 | 1.00 | Legacy一定値。入射角依存なし |
| `R` | `groundReflectance` | ratio | 0–0.8 | 0.20 | Legacy簡略反射 |
| `SKY` | `legacySkyFactor` | empirical ratio | 1.0 / 2.0 / 3.0 | 2.0 | 拡散成分だけを増幅する経験係数 |

TypeScript engineはlegacy calculation functionと同じくruntime validation/clampingを追加しません。UI rangeは入力契約のprovenanceであり、新たな物理制約ではありません。

## Independent reference

`scripts/generate-legacy-v01-golden.mjs` はHTMLのSHA-256を最初に検証し、actual source内の `const ASHRAE=` から描画section直前までを抽出してNode.js `vm`で直接実行します。Original `decl`、`hourGain`、`simulate`、`summarize`だけがexpected fixtureを生成し、`src/engine`はimportしません。

```bash
npm run golden:check
```

## Golden fixture

`tests/fixtures/legacy-v01-golden.json` は8 reference recordsを保持します。

- G1: 旧default値
- G2: `D = 0`
- G3: `A = -30 deg / +30 deg`
- G4: `W = 1/2`
- G5: `G = 1/2`
- G6: `H/D/O = 1/2`で`D/H`と`O/H`を固定
- G6 regression: `D/H`だけを固定し、`O`を固定した非相似case

全12か月の庇あり/なし、年間、冷房期4–9月、暖房期10–3月、削減率を比較します。Acceptance toleranceはabsolute `1e-9`です。

## Public API

- `simulateLegacyV01(parameters)`
- `simulateLegacyV01Monthly(parameters)`
- `summarizeLegacyV01(monthly)`
- `calculateLegacyHourlyGain(parameters, monthIndex, solarHour)`

`src/engine/**` はReact、React DOM、DOM globals、Canvas types、`navigator`への依存をmechanical testで拒否します。

## Preserved known issues

- ASHRAE Clear Skyを年間適用
- `k_sky`相当の経験係数
- 月代表日方式、真太陽時
- 等方天空、無限長庇
- 地面反射の簡略化
- ガラス日射熱取得率の入射角依存なし
- 夏至／冬至表示と代表日の不一致
- balance indicator UI bug

## M2 boundary

M2はweather foundationです。実気象dataへの置換後もM1 fixtureを残し、Legacyとの差を明示します。M1からM2へ自動移行しません。

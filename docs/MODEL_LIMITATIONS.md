# Model Limitations

## Current M0 state

M0には日射計算modelがありません。UIに表示されるのは開発基盤のstatusだけであり、性能値ではありません。

## Legacy MVP v0.1 known issues

以下は既知課題です。MVP原本の保存やM0 bootstrapによって修正済みとは扱いません。

### Weather model

- ASHRAE Clear Sky modelを年間へ適用しているため、絶対日射量が構造的に過大です。
- `k_sky` は物理modelではなく経験係数です。
- EPW、拡張アメダス等の時刻別実気象data経路へ置き換えるまで、絶対値を正式評価に使用できません。

### Shading geometry

- 「`D/H` が一定なら削減率が不変」という説明は不十分です。
- 庇から窓頭までの距離 `O` が存在するため、少なくとも `D/H` と `O/H` の両方を考慮する必要があります。
- 将来の有限幅庇では、左右張出、太陽方位角、窓幅も影響します。

### Section diagram

- MVPで「夏至／冬至」と表示される断面図は、実装上は月代表日を使用しています。
- 表示名称と計算時刻の不一致を解消し、日時・time zone・太陽位置の前提を明示する必要があります。

### Balance indicator

- `冷房期削減率 - 暖房期削減率` は独自の夏冬選択性指標です。
- エネルギー最適、cost最適、または真の庇最適値を意味しません。
- `D = 0` でも「庇が深すぎ」と表示し得る既知のUI logic問題があります。

### Absolute values

- 実気象dataによるvalidation完了前の `[kWh]` は正式な実務判断根拠に使用できません。
- 相対比較であっても、同一のgeometry・weather・glass・period前提を明示する必要があります。

## Units and numerical precision

- 長さの入力単位（mm）と内部単位（推奨m）を境界で明示的に変換します。
- 角度のdegree/radian、方位角の原点と正方向、時刻のtime zoneを暗黙にしません。
- geometry境界では固定の完全一致を避け、目的に応じたtoleranceを定義します。

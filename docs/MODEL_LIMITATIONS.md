# Model Limitations

## Current M2 state

M1 Legacy engineに加え、EPWと独立solar positionを用いるweather-v1 foundationがあります。実EPW smokeは完了しましたが、絶対性能の外部validationではありません。

## Weather-v1 limitations

- EPW radiation intervalを1点のmidpoint solar geometryで代表させ、interval内変動を補間しません。
- 天空日射はisotropicで、Perez、circumsolar、horizon brighteningを含みません。
- 地面反射は `GHI × groundReflectance × 0.5` で、庇遮蔽を含みません。
- 庇は20 stripの2D無限幅modelです。有限幅、左右端、side fin、reveal、複数遮蔽物を含みません。
- NOAA-style fractional-year近似であり、SPA級の高精度太陽位置を主張しません。
- Required solar欠損は計算拒否します。補間・推定modelはありません。
- Tokyo Hyakuri IWEC確認はparser/完走検証であり、第三者solverとの精度検証ではありません。

## Legacy MVP v0.1 known issues

以下は既知課題です。M1ではregression semanticsとして意図的に維持し、修正済みとは扱いません。

### Weather model

- ASHRAE Clear Sky modelを年間へ適用しているため、絶対日射量が構造的に過大です。
- `k_sky` は物理modelではなく経験係数です。
- この問題はweather-v1経路では実EPW入力により分離されますが、Legacy engine内では意図的に不変です。

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

- 第三者比較を含むM5 validation完了前の `[kWh]` は正式な実務判断根拠に使用できません。
- 相対比較であっても、同一のgeometry・weather・glass・period前提を明示する必要があります。

## Units and numerical precision

- M1 public APIの長さはm、緯度・面方位角はdegree、出力はkWh / percentです。mm入力は受け取りません。
- weather-v1は長さm、north-zero/clockwise方位deg、EPW放射Wh/m² interval、結果kWhを使用します。
- 角度のdegree/radian、方位角の原点と正方向、時刻のtime zoneを暗黙にしません。
- geometry境界では固定の完全一致を避け、目的に応じたtoleranceを定義します。

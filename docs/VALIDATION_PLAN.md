# Validation Plan

M1ではLegacy behaviorのregression validationだけを実施済みです。物理model、実気象data、第三者解析とのvalidationは将来計画です。

## 1. Golden tests

- Original HTMLを独立実行して生成したfixtureをversion管理する。
- M1 Pure TypeScript engineは全月・全期間をabsolute `1e-9` toleranceで比較する。
- model revisionごとにM1 Legacyとの差分をreviewする。
- legacy MVP値はregression baselineであり、物理的な正解値として固定しない。

## 2. Geometry tests

- 庇なし、接する境界、全遮蔽、無遮蔽を検証する。
- `D/H` と `O/H` を独立に変化させる。
- 方位角・太陽高度の境界、有限幅庇の左右端を検証する。
- mm/m変換とfloating-point toleranceを明示する。

## 3. Weather validation

- EPWまたは採用data sourceの地点、期間、time zone、欠測、単位を検証する。
- 水平面から鉛直面への変換modelと天空日射modelを分離して検証する。
- Clear Skyと実気象dataの差を定量化し、provenanceを保持する。

## 4. Third-party solar analysis comparison

- 検証済みの第三者日射解析softwareまたは標準計算例と同一条件を比較する。
- geometry、material、weather、time step、ground reflectanceを揃える。
- 許容差と既知のmodel差を事前に定義し、都合のよいcaseだけを選ばない。

## 5. Boundary tests

- M1 engine dependency testはReact、DOM、Canvas、browser globalsを機械的に拒否する。
- 0および負値、上下端逆転、極端な寸法、範囲外方位を扱う。
- polar day/night、太陽高度0°近傍、欠測時刻、DST/time-zone境界を扱う。
- invalid inputを黙って補正せず、errorまたは明示的なnormalization結果を返す。

## Evidence policy

- test data、version、command、結果、tolerance、reviewer判断を再現可能な形で保存する。
- 未実施・失敗・外部確認待ちはPASSにしない。
- Security、privacy、permission、data-integrity failureはquality debtへ繰り下げない。

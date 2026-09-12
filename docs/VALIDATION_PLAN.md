# Validation Plan

M3ではLegacy/M2 regressionに加え、解析解polygon、全方位rotation、有限幅庇、Tokyo Hyakuri IWEC local smokeを実施済みです。第三者solverとの物理validationは将来計画です。

## 1. Golden tests

- Original HTMLを独立実行して生成したfixtureをversion管理する。
- M1 Pure TypeScript engineは全月・全期間をabsolute `1e-9` toleranceで比較する。
- model revisionごとにM1 Legacyとの差分をreviewする。
- legacy MVP値はregression baselineであり、物理的な正解値として固定しない。

## 2. Geometry tests

- 庇なし、接する境界、全遮蔽、無遮蔽を解析解で検証済み。
- 正面45 degの手計算reference、`D/H`と`O/H`、translation/scale相似性を検証済み。
- N/E/S/Wと中間方位、mirror symmetry、非対称張出、左右端単調性を検証済み。
- 2D infinite-width limit、behind-facade、grazing、NaN/Infinity boundaryを検証する。

## 3. Weather validation

- EPW LOCATION、DATA PERIODS、8760/8784、sub-hour、interval end/midpoint、required radiation欠測をsynthetic testで検証済み。
- DNI beam、DHI isotropic sky、GHI ground reflectionを独立synthetic caseで検証済み。
- EnergyPlus Tokyo Hyakuri IWEC 8760 recordsをlocal-onlyでparse/simulateし、provenance・hash・radiation sumを記録済み。
- Legacy Clear Skyと実気象dataの差を同一geometryで記録済み。差は精度PASSを意味しない。
- M3はTokyo Hyakuri IWECを4方位でlocal-only実行し、有限庇の削減率差をsmoke evidenceとして記録済み。raw EPWはversion管理しない。

## 4. Third-party solar analysis comparison

- 検証済みの第三者日射解析softwareまたは標準計算例と同一条件を比較する。
- geometry、material、weather、time step、ground reflectanceを揃える。
- 許容差と既知のmodel差を事前に定義し、都合のよいcaseだけを選ばない。

## 5. Boundary tests

- Engine/weather/geometry dependency testは対象treeを再帰走査し、React、Node filesystem、DOM、Canvas、File API、browser globalsを機械的に拒否する。
- 0および負値、上下端逆転、極端な寸法、範囲外方位を扱う。
- polar day/night、太陽高度0°近傍、欠測時刻、DST/time-zone境界を扱う。
- invalid inputを黙って補正せず、errorまたは明示的なnormalization結果を返す。

## Evidence policy

- test data、version、command、結果、tolerance、reviewer判断を再現可能な形で保存する。
- 未実施・失敗・外部確認待ちはPASSにしない。
- Security、privacy、permission、data-integrity failureはquality debtへ繰り下げない。

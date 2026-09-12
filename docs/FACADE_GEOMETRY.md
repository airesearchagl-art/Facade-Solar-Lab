# Facade Geometry Foundation

M3は、鉛直ファサード上の矩形開口と、有限幅の水平庇1枚を扱うPure TypeScript geometry foundationです。直接日射の影は厳密なpolygon clippingで評価し、M2 weather baselineと分離した`facade-v1-weather` modelとして公開します。

## Coordinate and azimuth contract

ファサード局所座標は、建物外部からの正面視を基準に次のように定義します。この `+x` / `+y` / `+z` 定義は、標準的なright-handed xyz basisを意味しません。

- 壁面は `y = 0`。
- `+x` は正面から見て右。
- `+y` は壁面から屋外へ向かう法線。
- `+z` は鉛直上向き。
- 方位角は北を `0 deg`、時計回りを正とし、ファサード方位角 `A` は外向き法線の方位です。

太陽方位角を `S`、太陽高度を `e` とすると、ファサード局所太陽vectorは次です。

```text
x = -cos(e) sin(S - A)
y =  cos(e) cos(S - A)
z =  sin(e)
```

`y > 0` のときだけ太陽はファサード前面側です。この符号規約はN/E/S/Wと中間方位のrotation testで固定しています。

## Opening and overhang contract

矩形開口はすべてmで、`centerXM`、`widthM`、`sillZM`、`headZM`を持ちます。全面窓と腰壁付き窓は同じcontractを使い、`sillZM = 0`が全面窓の特別な表現です。

```text
xLeft  = centerX - width / 2
xRight = centerX + width / 2
height = headZ - sillZ
area   = width * height
```

水平庇は`depthM`、`elevationZM`、左右張出`leftExtensionM` / `rightExtensionM`を持ちます。庇の左右端は開口端から導出します。

```text
overhangLeft  = xLeft  - leftExtensionM
overhangRight = xRight + rightExtensionM
```

Legacyの`H`、`D`、`O`、`W`との対応は、`H = headZM - sillZM`、`D = depthM`、`O = elevationZM - headZM`、`W = widthM`です。相似性には`D/H`だけでなく`O/H`も必要で、有限幅ではさらに左右張出と太陽方位角が影響します。

## Direct shadow projection

庇外端の壁面への投影は、ファサード局所太陽vector `(sx, sy, sz)` に対して次です。

```text
xWall = xEdge - depth * sx / sy
zWall = elevationZ - depth * sz / sy
```

庇壁際の左右端と、投影された外端の左右点が壁面上の影polygonを構成します。太陽が背面、地平線以下、または壁面とほぼ平行な場合は直接日射の影を適用しません。

## Polygon calculation

影polygonを開口rectangleへSutherland–Hodgman法でclipし、shoelace公式で交差面積を求めます。隣接点と閉点の重複は共有`GEOMETRY_EPSILON = 1e-9`で除去します。

```text
directShadedFraction = clippedShadowArea / openingArea
directLitFraction    = 1 - directShadedFraction
```

面積と割合は浮動小数点誤差を考慮して有効範囲へ抑制します。手計算referenceは、正面45 deg・`D=1 m`・`H=2 m`で、全幅なら影面積`2 m2` / 遮蔽率`0.5`、十分深い庇なら全遮蔽、半幅だけ重なるcaseなら影面積`1 m2` / 遮蔽率`0.25`です。

## Validation boundary

次を入力errorとして拒否し、黙って補正しません。

- 非finiteな座標、寸法、角度。
- `widthM <= 0`、`headZM <= sillZM`。
- 負の庇depthまたは左右張出。
- 庇下面高さが開口head未満。
- `solarHeatGainCoefficient`または`groundReflectance`が`0..1`外。

方位角だけはfinite値を`0..360`へ明示的にnormalizeします。

## Weather integration model identity

M3の結果は次のidentityとprovenanceを保持します。

- model: `facade-v1-weather`
- geometry: `facade-v1`
- direct: `finite-rectangular-overhang-shadow-polygon-v1`
- diffuse: `isotropic-2d-infinite-width-v1`
- ground: `ghi-ground-reflection-0.5-v1`

直接日射だけが有限幅3D geometryを使用します。天空日射はM2互換の20-strip isotropic 2D無限幅model、地面反射は`GHI * groundReflectance * 0.5`で、どちらも有限幅庇の3D遮蔽を含みません。このmodel境界を結果へ明示し、同一modelに見せかけません。

`D = 0`ではM2とM3の月別・期間別energy accountingがexact一致します。有限幅と十分広い庇の直接日射差、およびM2 strip近似との差は独立regressionとして固定しています。

## Limits and next milestones

M3は単一鉛直平面、単一矩形開口、水平庇0または1枚のみです。side fin、reveal、複数開口・複数遮蔽物、任意3D mesh、finite-width diffuse遮蔽、Perez sky、glass IAC、self-shadingは含みません。実EPW smokeは計算完走と方位差の確認であり、絶対`[kWh]`の第三者物理validationではありません。

M4のcomparison UXとM5の第三者validationは別Task Packet / Human Gateで扱います。

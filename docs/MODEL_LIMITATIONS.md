# Model Limitations

## Current model state

M1 Legacy engine、M2 weather-v1、M3 `facade-v1-weather`を保持し、M4は1–4 Caseを同一EPW条件で比較するUIとPure TypeScript adapterを追加します。比較値の外部validationではありません。

M7は`facade-v2-weather`で水平庇＋左右端部フィン＋中間フィン配列の有限直達影を合成します。フィンなし・出0・配列0枚（P>W）はv1計算とexact等価（有効な端部フィンもない場合）。中間フィンは厚さなし・中央割付・中心ピッチ指定または枚数指定、最大128枚。上限超過や解像度不足を黙って切り捨てません。diffuseは庇のみ2D無限幅近似で、フィン効果は含みません。groundは従来どおり。任意3D面、壁厚/reveal、cross-floor physical shadingは未実装です。各Floorのlocal fin寸法が階境界を超えても、他階への物理遮蔽は発生せず、積層図だけ階境界で区切ります。

M5: LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING。Radiance / EnergyPlus / SPA / annual physical validation: NOT_RUN。M7は旧P0-B checkpointで外部validation済みとは扱いません。

M8の[in-app Guide](USER_GUIDE.md)は、これらの適用範囲をBeginner Guide / Parameter Reference / Results Guide / Technical Manualへ整理したdocumentation layerです。Guide追加は計算精度、外部solver比較、absolute-kWh validationの状態を変更しません。

## M9 explorer boundary

- Singleの1D/2D候補展開・感度表示であり自動最適化ではありません。最大64候補、通常比較へ戻せるのは最大4案です。Multi sweepは未実装です。
- 各候補は既存canonical engineへ渡します。大量比較・同一engineとのexact一致・Worker導入は物理validationの代替ではありません。
- INVALIDはreason付きnon-result、partialは読込区間、syntheticは操作デモ。STALE中は出力・候補転送を禁止します。
- Runtimeは端末・気象区間数・fin密度に依存します。cap64は性能SLAではありません。

## In-app guide boundary

- Guideはstatic client contentで、計算engine、weather parser、preset schema、CSV/PDF結果contractへ新しい物理挙動を追加しません。
- `#single` / `#multi` / `#guide`のhash navigationはSingle/Multiをmount維持し、Guide往復だけで入力・EPW dataset・result・dirty/stale stateをresetしません。
- Guideの「庇あり」はM7時点の歴史的なUI列名で、庇と有効な端部・中間フィンの複合遮蔽後を意味します。「庇なし」は遮蔽物なしreferenceです。
- GuideのMulti説明で、Building Totalは各Floor canonical resultのsimple sum、Floor Breakdownは各Floor個別結果です。cross-floor physical shadingやHVAC loadを意味しません。

## Comparison UX limitations

- 同時比較は最大4 Caseです。自動最適化、score、推奨案判定を行いません。
- full-year計算は明示的な`Run Comparison`だけで実行し、入力変更後はlast-run結果をdirty表示します。
- baseline差は`case - baseline`です。負値を一律に良いと解釈しません。
- baselineが0の場合、percentage deltaは`null`としてUIで`—`表示します。
- EPWはbrowser-localでparseし、raw本文を表示・保存・送信しません。automatic download、geocoding、cloud saveはありません。
- geometry SVGは説明図であり、CAD寸法取得や施工図用途ではありません。
- 表示する`[kWh]`は窓を通して室内へ入る日射熱取得量です。外気温、熱貫流、換気、内部発熱、蓄熱、空調設備効率を含む冷房負荷・暖房負荷ではありません。
- 夏期は4–9月、冬期は10–3月の固定集計です。気候区分や運転scheduleに応じた空調期間判定ではありません。
- 夏至頃（6/21）と冬至頃（12/21）の線は、選択地点で5分刻みに求めた最大solar elevation時刻とfacade-relative profile angleによる幾何学的参考表示です。厳密な至点時刻、年間計算、空調負荷計算を表しません。
- PDFはbrowser printです。CSVは編集用比較データであり、いずれも正式な性能証明書や検証済み計算書ではありません。
- JSON presetはCase/Workspaceの入力だけを保存します。計算結果とraw weatherを保存せず、読込後は必ず再計算が必要です。schemaVersion `1`（庇のみ）と`2`＋`geometryVersion: facade-v2`（端部フィンとoptional中間フィン配列）を受け付けます。derived positionsは保存しません。フィン付きはv2で保存し、旧アプリに黙ってフィンを無視させません。

## Facade-v1 limitations

- 単一鉛直平面、単一矩形開口、水平庇0または1枚のみを扱います。
- 有限幅geometryはdirect shadowだけに適用します。diffuseはM2互換の20-strip isotropic 2D無限幅modelです。
- side fin、reveal、複数開口・遮蔽物、任意3D mesh、self-shadingを含みません。
- 地面反射は庇遮蔽を含まず、glass IACも扱いません。
- polygon clippingは`1e-9`の共有epsilonを使い、極端な寸法scaleの正式な誤差保証は未実施です。

## Weather-v1 limitations

- EPW radiation intervalを1点のmidpoint solar geometryで代表させ、interval内変動を補間しません。
- 天空日射はisotropicで、Perez、circumsolar、horizon brighteningを含みません。
- 地面反射は `GHI × groundReflectance × 0.5` で、庇遮蔽を含みません。
- M2庇は20 stripの2D無限幅modelです。M3 direct pathだけが有限幅と左右端を扱います。
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
- M4結果はBEI、法適合、HVAC sizing、最終認証、保証energy predictionへ使用できません。

## Units and numerical precision

- M1 public APIの長さはm、緯度・面方位角はdegree、出力はkWh / percentです。mm入力は受け取りません。
- weather-v1 / facade-v1は長さm、north-zero/clockwise方位deg、EPW放射Wh/m² interval、結果kWhを使用します。
- facade-v1の壁面局所座標は正面から見て`+x`右、`+y`屋外、`+z`上です。
- 角度のdegree/radian、方位角の原点と正方向、時刻のtime zoneを暗黙にしません。
- geometry境界では固定の完全一致を避け、目的に応じたtoleranceを定義します。

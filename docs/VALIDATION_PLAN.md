# Validation Plan

## M5 — Current: P0-B independent direct-shadow protocol

P0-AはHuman報告のIndependent Focused Review PASS / Required Fixなし（head 61b8313d1c141f1f5b1afa472160976bc9f10011）。続くP0-Bは有限幅庇のdirect-shadowだけを対象に、独立3D ray-intersection protocolを準備しました。Radiance executable未検出のため外部比較はNOT RUN、許可されたfallbackとしてfixture / runner / protocolを提出します。solar / geometry / energy式・既存expected値は変更しません。annual kWh、diffuse / ground / SHGC / HVAC、詳細sub-hour、極域は今回対象外です。

- 棚卸し日: 2026-09-15 (Asia/Tokyo)
- 固定product baseline: main @ bcc6b5a4e93a25a3c2b334e305fcbfd09a140403
- 作業branch: feat/m5-validation-stability。この文書を含むlive HEADはGit/PRから取得し、product baselineと混同しません。
- M4 / M4.5: COMPLETE。Case色選択も実装済み。M5: Current / validation未完了。M6: Planned / NOT STARTED。
- M4.5のterminal Run Artifactとimmutable Task Packetはhistorical auditとして保持し、再closeoutしません。
- 数値の一致、Human UX PASS、Production READYは、絶対 [kWh] の物理的正しさや正式性能評価を意味しません。

## 1. 既存coverage — 重複実装しない範囲

「十分」は表記したregression contractについての判断であり、全入力域・物理精度の保証ではありません。kickoff checkpointは **28 test files / 165 tests PASS**。P0-Aの追加結果は§6、残る不足は§3に分離します。

| 対象 | 既存の根拠 | 維持する検証 / 限界 |
| --- | --- | --- |
| M1 Golden | tests/legacy-v01-golden.test.ts、scripts/generate-legacy-v01-golden.mjs | 原本HTMLの独立VM実行から8 fixture cases、全12か月・年間/夏期/冬期をabsolute 1e-9で比較。幅/SHGC scaling、D/HとO/H相似性を保持。Legacyを物理正解にしない。 |
| EPW / LST | tests/epw-parser.test.ts、tests/weather-time.test.ts、tests/weather-file-adapter.test.ts | LOCATION / DATA PERIODS、正常な8760/8784、15分区間、年末end/midpoint、Gregorian leap、欠測/負放射・不正行・拡張子拒否を維持。kickoff時の行数分類だけの不足をP0-A hourly検証（§6）で補う。sub-hour通年の完全性は未検証。 |
| 太陽位置 | tests/solar-position.test.ts | 独立NOAA/GML値: 2025年5点、2024年Feb 29・Jun 21・Dec 21の3点。0.01°表示値に対する既存0.5° tolerance、365/366分母を維持。東京以外・極域・高精度SPAとの一致は未検証。 |
| 放射・energy | tests/weather-irradiance.test.ts、tests/facade-weather.test.ts | DNI/DHI/GHI成分別手計算、D=0、背面direct=0、sub-hour Wh二重積分防止、M2/M3 D=0のexact一致。8784→canonical 2000→366分母のhelper経路も既存。ただしleap/sub-hour通年simulationの独立oracleではない。 |
| direct / polygon | tests/facade-direct-shadow.test.ts、tests/facade-polygon.test.ts | 正面45°の半/全遮蔽・窓頭gap、平行移動、3倍scale、shoelace面積、空/全/部分intersection、接触面積0、重複頂点。別実装で同じ手計算testを増やさない。 |
| 方位 / 有限幅 | tests/facade-orientation.test.ts、tests/facade-geometry-contract.test.ts | 8方位、共通回転、mirror/左右非対称、延長単調性、infinite-width解析limit、89.999999°/90°grazing、入力拒否と座標符号。epsilon全近傍・極端scaleの保証ではない。 |
| Single / Multi | tests/multifloor.test.ts、tests/comparison*.test.ts | synthetic full-yearで1 Floorとcanonical singleの期間/12か月exact一致、3 Floorの単純和、baseline/delta、deep copy、1–4 Case、stale/rerun。1 Floor testは変換helperを共有し、独立な入力対応oracleではない。 |
| UI / export | tests/*render.test.tsx、tests/preset.test.ts、tests/multifloor-{preset,csv,ux-followup,ray-clipping}.test.*、tests/case-colors.test.tsx | input-only JSON、CSV escaping/formula対策、story対応/欠けた階、floor-local ray clipping、Case色と数値/JSON/CSV不変。SSR/fixtureはnative browser保存の代替ではない。 |
| 依存boundary | tests/engine-boundary.test.ts | engine/geometry/weather/comparison/solar-reference/export/preset/multifloorの.tsを再帰走査するregex guard。manifestだけではない。AST/transitive import検証やguard自身のnegative fixturesはない。 |

## 2. Tokyo Hyakuri EPW evidence

- 正本: [Weather Foundation](WEATHER_FOUNDATION.md#real-file-smoke-validation)、[M4 Evidence](../.agent-run/LR-20260913-FSL-M4-001/EVIDENCE.md#rf-01-human-browser-acceptance-closure)、[M4.5 Evidence](../.agent-run/LR-20260914-FSL-M45-001/EVIDENCE.md)。過去の未確認記録を削除せず、後続のHuman closureを優先します。
- Tokyo Hyakuri / IWEC / WMO 477150、36.18° N・140.42° E・UTC+9。NOAA単体testの東京35.7° N・139°46′ Eとは別地点です。
- 既存localファイルは **1,558,629 bytes** / SHA-256 **3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E** とfresh一致。kickoffではmetadata/hashのみ確認。P0-Aでは変更後parserで再読込し、8760 intervals / full-year-8760 / 0 issues / usable PASS / 7種類のsource yearを確認しました。実EPW simulation/browser smokeは再実行していません。
- 記録済み: M2/M3のparse/方位smoke。M4 Singleは8760 intervals・0 parse issues・2 Case・編集/rerun・実EPW CSV/PDFのHuman acceptance（product head 9be5567f178c0aea0d82923989029d089bb2101d、RF-01 CLOSED / PASS）。M4.5では2 Building Cases × 3 Floorsのlocal実EPW完走/finite値を記録済み。
- M4.5 UX-01〜05のHuman PASSは保持。ただしnative実EPW Multi操作と保存CSV/PDFの内容一致について、記録を超えるPASSを推定しません。M4 Singleのclosureを再オープンしません。
- IWEC smokeは外部solver比較でも実測性能検証でもありません。同じファイルで同じfinite値を得るだけの検証を追加しません。
- raw EPW / ZIP / licenseはlocal-onlyで、public repo・外部APIへ送信しません。新dataは利用/再配布権確認後だけ採用し、public-safe出典・hash・集約結果を残します。

## 3. M5で追加する最小backlog

P0-Aはfocused review PASS、P0-Bはprotocol準備済み / 外部比較NOT RUN。その他は **未実施 / PLANNED**。P0は後続評価の前提、P1はM5の信頼性判断に必要、P2は運用範囲の明確化です。失敗は記録し、式やexpectedを都合よく修正しません。

| 優先度 / ID | 追加する検証と不足の根拠 | 完了条件 / 再利用 |
| --- | --- | --- |
| P0-A / W-01 hourly時系列完全性 | 実装・検証済み / focused review PASS。月日・hourの時間枠、header期間、重複・欠落・逆順、8760/8784・年境界を検査。 | §6のcontract/tests。元の順序・値を保持し、temporal errorがあるdatasetを既存usable guardで拒否。行数一致だけではfull-yearにしない。 |
| P0 / W-01 残る入口境界 | 空白放射、partial入力の年間表示、複数DATA PERIODS拒否の明示characterizationは後続。 | P0-Aの時間枠testを重複実装しない。部分期間の表示/通年評価方針を別途確定し、現在のpartial互換性を完全な年間証拠と扱わない。 |
| P0-B / P-01 独立direct benchmark | §7で10ケース・strict tolerance・独立scene/ray sampler・比較fixtureを準備済み。Radiance未検出のため10件NOT RUN、第三者PASSなし。 | 既存Radiance利用時のversion/binary hash、全case出力/誤差を記録。geometry fractionのみ。自前projection/clippingやGoldenをreferenceへ流用しない。 |
| P1 / S-01 solar / interval感度 | NOAAは東京8点のみ。full-year-subhour calendarと通算、極域、地平線近傍、時間分解能による影誤差が未評価。 | synthetic 8760/8784と15分通年（35,040/35,136区間）、Feb 29/年境界、混合source yearを追加。UTC/Asia-Tokyo/America-New_Yorkの別processで同一結果を確認。独立SPA比較と60/15/5分感度を分離。 |
| P1 / G-01 数値境界 | 共有1e-9は座標・面積・方向判定に使われるが、極端scaleの誤差保証なし。 | sy/sz閾値前後、接触±epsilon、微小/大寸法・大datum、有限値同士のoverflowを固定caseで確認。bounded shade/非負energy/finiteまたは明示errorを要求。通常scaleの解析解を再利用し、対応範囲外を無理にPASSにしない。 |
| P1 / P-02 物理model差 | finite-width diffuse、ground遮蔽、角度依存glass、1点midpointの影響量が未測定。 | 同一model比較と異なるmodelの感度比較を分ける。成分/interval/月/期間別のsigned bias・絶対誤差を記録し、annual cancellationで合格させない。有限幅diffuse等は実装しない。 |
| P1 / M-01 composition拡張 | 1 Floor testのinput変換共有と、実EPW Multiでfinite完走以上のoracleが不足。 | 異なるSHGC/方位/庇ありなし/非対称/階数の少数caseで、変換helperを使わず手でsingle入力を構成。既存real EPWを安全に使える時だけ各Floor・12か月・期間和/差分を比較。shared-engine一致はcomposition証拠のみ。 |
| P1 / U-01 未確認の実製品経路 | 実EPW Multiのnative選択→編集→rerun→保存内容一致は明示evidence不足。Case色追加後のnative保存も未報告。 | 最終product headのPreviewで2 Cases × 3 Floors、色、stale、KPI/月表/CSV/PDF、390px、app-origin fatal/assetを1手順で確認。操作不能ならHuman verification要求のまま残す。既存Single RF-01を重複実施しない。 |
| P2 / B-01 guard / workload | regex guard自体の検出保証・間接import、Floor数増加時の時間/メモリ実測なし（Case上限4、Floor上限未定義）。 | まずguardのnegative fixture（fs/promises、re-export/dynamic import、対象拡張子）と1/3/10 Floors × 1/4 Cases、8760/8784の反復計測。AST移行・worker化・上限変更は自動実装しない。device/runtime、中央値/最大値、試験打切り条件を残す。 |

## 4. Third-party physical validationの具体案

### 4.1 候補と役割（kickoff案。P0-B適用範囲は§7）

1. **第一候補: Radianceの独立ray intersection / irradiance**。開口面の等面積gridから固定太陽方向へrayを出し、庇hit率を自前遮蔽率と比較する。rtrace -oLのfirst intersection distanceなら自前polygon algorithmを共有しない。no-hit/self-hit判別は庇なし/全遮蔽controlで校正する。成分別irradianceには-I+、direct-onlyには-ab 0を使い、luxへ変換しない。[Radiance公式 rtrace](https://www.radiance-online.org/learning/documentation/manual-pages/pdfs/rtrace.pdf)
2. **第二候補: EnergyPlus 25.2.0の外部遮蔽比較**（固定版候補でありlatestではない）。単一壁/開口/不透明水平庇、ShadowCalculationのPolygonClipping / Timestepでsunlit fractionを照合する。太陽位置・集計時刻を別途合わせ、実行版の出力dictionaryで対象surfaceと単位を確定する。HVAC energyをFSL kWhと直比較しない。[公式設定文書](https://github.com/NatLabRockies/EnergyPlus/blob/v25.2.0/doc/input-output-reference/src/overview/group-simulation-parameters.tex)、[公式Shading Module](https://github.com/NatLabRockies/EnergyPlus/blob/v25.2.0/doc/engineering-reference/src/climate-sky-and-solar-shading-calculations/shading-module.tex)
3. **太陽位置だけのreference: NLR/NREL SPA**。公開calculator/技術報告を候補とし、LST/UTC・幾何高度/屈折補正高度を区別する。facade/heat-gain solverではない。コード取得のlicense/登録条件は別途確認し、無断vendorしない。[公式SPA](https://midcdmz.nlr.gov/spa/)、[公開calculator](https://midcdmz.nlr.gov/solpos/spa.html)

文書参照日: 2026-09-15。kickoff時はlocal PATHにenergyplus / rtrace / oconvを確認できず、別場所は未調査でした。P0-Bの追加確認は§7。インストール・ライセンス同意・実solver実行は行っていません。後続で採用版のbinary/version/hash、実行環境と利用条件を確定します。

### 4.2 共通条件と最初の固定行列

- 長さm、角度deg、鉛直開口幅2 m・高さ2 m・窓下端0 m、SHGCは後処理で0.5。方位は北0°/時計回り。FSL局所+xは外部正面視右、+y外向き、+z上であり、right-handedと仮定して外部geometryを反転しない。world変換はN/E/S/Wのcontrolで確認する。
- 庇なしcontrolと庇ありを対にする。開口は受照面で、glass layer・frame・reveal・周辺建物・相互階遮蔽を含めない。不透明庇のみ、direct試験ではDHI=0・ground reflectance=0。

| ID | 幾何 / 太陽（相対方位はsun minus facade） | 目的 |
| --- | --- | --- |
| D0 | 庇なし / D=0、正面高度45° | 無遮蔽control、座標/単位校正 |
| D1 / D2 | D=1 / 2 m、O=0、左右延長0、正面高度45° | 既存半/全遮蔽解析解を外部solverで再利用 |
| D3 | D=1 m、O=0.5 m、正面高度45° | 窓頭gapの部分遮蔽 |
| D4 | D=1 m、O=0、相対方位±45°、左右延長0.1/0.8 mとswap | 有限幅側漏れ・mirror |
| D5 | D4を左右100/100 mへ拡張、facadeを0/90/180/270°へ共通回転 | 広幅limitとworld変換 |
| D6 | 高度0°近傍、相対方位90°近傍、背面 | direct energy=0/近0を確認。百分率誤差で判定しない |

- grid spacingは25 / 12.5 / 6.25 mmで収束を見る。平行rayと約0.5°の太陽diskを持つirradiance計算を同じoracle扱いしない。幾何誤差とsampling誤差を分け、追加細分条件も事前固定する。
- 年間比較はW-01後、Tokyo Hyakuriの同一hash/LOCATION/年構造、N/E/S/W、D=0/0.8/1.6 m、O=0.3 m、左右0.5 mを固定。開口は上記2×2 m。月/年間/夏期4–9月/冬期10–3月の**直達/天空/地面を別々に**出し、都合のよい方位だけ抽出しない。
- EPW Wh/m² intervalをRadiance W/m²へ渡す際はWh / intervalHours。返却Wは区間時間を1回掛けて積分し、面積×0.5/1000を明示的後処理で適用する。これはFSL定数SHGCモデルの比較値であり、実glass透過/吸収やHVAC負荷の実証ではない。
- 太陽比較: Hyakuriに加え緯度0°/+70°/-70°、通常年2001・閏年2000、春秋分頃/夏冬至頃・Feb 29・年末、昼/夜/地平線近傍。longitude/UTC offsetはcaseごとに固定記録する。幾何高度を比較し、天頂近傍の方位はvector角距離で扱う。既存NOAA 0.5°は維持し、SPAの精度をFSLの精度として転記しない。
- 時間感度: 同一EPW区間内の平均放射一定という**試験上の仮定**で60/15/5分へ保存的分割し、太陽/影をsubstep評価する。midpointとの差は仮定下の感度で、実区間内放射分布の正解ではない。EnergyPlusのweather補間とFSLのmidpointを混同しない。

### 4.3 比較不能なmodel差を分離

- 庇なしuniform isotropic skyでDHI×0.5、遮蔽しないuniform groundでGHI×rho×0.5を先に比較する。有限庇の天空積分はFSLの20-strip / 2D無限幅近似と異なるため、別のmodel discrepancyとして定量化する。
- Radiance gendaylitはPerez分布で、-WはDNI/DHIのW/m²、-O 1はsolar radiation出力。既定visible出力やlux/179変換をそのままkWhへ使わない。-angの方位は南から西正なのでFSL値をそのまま渡さない。Perezはisotropic同条件PASSではなく別の感度比較にする。[公式gendaylit](https://www.radiance-online.org/learning/documentation/manual-pages/pdfs/gendaylit.pdf)
- ground遮蔽、角度依存glass、cross-floor physical shadingは未実装。EnergyPlus等のtransmitted solar/window heat gainにはFSL定数SHGCと異なる物理が含まれ得るので、まず受照面incident energyで比較する。複数階は独立Floorを別々に評価して和を比較し、上下階の遮蔽物を追加しない。

### 4.4 判定 / evidenceを先に固定

P0-Bのgeometry fractionには、下記kickoff提案の0.005ではなく、§7 / 固定protocolの1e-6（boundary 1e-5）とray境界探索を採用します。以下のannual/irradiance案は未実施のままです。

- 以下は**検証計画の提案値**で、規格の許容値でも測定済みPASSでもない。実行前の独立reviewでversion付きprotocolとして固定する。
- direct幾何: grid最終2段のlit fraction差≤0.002、FSL対reference差≤0.005を初期予算とする。未収束はUNRESOLVEDでありFSL PASSではない。grazing/zeroは別bucket。
- 同一条件incident energy: abs(error) ≤ max(1 Wh/m² interval, 1% × abs(reference))を初期予算とする。signed bias、MAE、最大誤差、月/年間の絶対・相対差を全件出し、near-zeroでは相対誤差を使わない。model差をこの許容値へ混ぜない。
- 既存手計算/Goldenのtoleranceは変更しない。差に合わせて事後に閾値を広げず、data、日時、座標変換、solver設定、sampling/time convergence、model差を順に切り分けて失敗を残す。
- 各evidenceはFSL exact head、solver version/hash、scene/input digest、weather hash/provenance、command、全case成分別出力、許容差版、結果（PASS / FAIL / UNRESOLVED / NOT RUN）、reviewer判断を持つ。raw licensed dataやlocal absolute pathはcommitしない。

## 5. Kickoff validation（historical）

kickoffのdocs-only作業で確認したもの（checkpoint 25157e4c7b3bcad44fb318a16f6e6ca46a8dda06）:

- npm test: 28 files / 165 tests PASS。
- npm run typecheck: PASS。
- npm run build: PASS（Vite、89 modules、dist）。
- npm run golden:check: PASS（原本HTML hash一致、fixture書換えなし）。
- npm audit: 0 vulnerabilities。
- M4.5 Task Packet / snapshot: SHA-256 2138381AA95AC9B9F74AB4890D182A496DACC4425C36547B9829B22EDF3CF22B 不変。
- git diff --checkとdocs-only scopeはcommit前・後に確認し、exact final head / Draft PR stateはPR・完了報告に記録する。自己参照commitを文書へ固定しない。

kickoffの完了は **inventory / plan complete** であり、M5 validation COMPLETEではありません。その後Human authorizationでP0-Aへ進みました。現在のGateは次節を参照してください。

## 6. P0-A — hourly EPW temporal integrity

対象は既存parserが扱う単一DATA PERIOD / recordsPerHour=1。Pure TS helper `src/weather/epw/temporal.ts` をparserから呼び、日時・放射・sourceLine・provenanceは変更しません。

### 追加contract

- raw month/day/hourをcanonical calendar上のhour slotへ対応付け、宣言開始日から順に検証します。TMYのsource yearはprovenanceとして保持し、月間の年変更や年の逆行だけを時系列異常とはしません。
- calendarはFeb 29実レコードがある、または `HOLIDAYS/DAYLIGHT SAVINGS` のLeapYear ObservedがYesの場合に366日、それ以外は365日です。行数からcalendarを決めません。YesならFeb 29が24区間まるごと欠けてもエラーです。
- 既存FSL互換性として、Noでも存在するFeb 29を削除せず8784として検証します。NoかつFeb 29なしの場合、raw source yearが閏年でも8760の典型年として扱います。この場合、提供されていないFeb 29の意図までは推定できません。
- 期間の開始/終了日はinclusive。宣言期間がcanonical 1年全体を覆う場合（通常1/1–12/31）、先頭/末尾を含む全8760/8784 slotが各1回、順序どおり必要です。重複＋欠落で総行数が一致しても不合格です。
- 一意slotの集合で欠落を検出し、元順序で逆順を検出します。swapを欠落と誤判定せず、重複を削除せず、silent sort / fillは行いません。期間外も明示errorです。
- 既存のpartialファイル（1日宣言内の1時間fixtureを含む）は維持します。宣言期間内かつ観測された最初〜最後の時間枠が連続していることを要求し、`coverage=partial`を返します。宣言されたpartial期間の両端まで揃っていることや通年性能は保証しません。
- Dec 31→Jan 1は宣言期間が年境界を跨ぐ場合に許可します。1/1–12/31の後に次年1/1を追加して新cycleとして通過させません。複数年連続データの新規対応はしません。
- `INTERVAL_DUPLICATE` / `INTERVAL_MISSING` / `INTERVAL_OUT_OF_ORDER` / `INTERVAL_OUT_OF_PERIOD` はseverity=error。期間日付不正は既存 `HEADER_INVALID`。temporal error時はfull-year coverageを付けず、既存 `assertWeatherDatasetUsable()` が計算利用を拒否します。放射等の既存error検査も維持します。
- detailed sub-hour検証は今回対象外。既存のsub-hour parser / count-based coverage / Wh interval accountingはそのままで、P0-A PASSをsub-hour完全性へ拡張しません。UIはSingle/Multiの既存日本語エラー辞書への4項目ずつの追加のみです。

外部仕様の確認: EPWは部分年も許容し、LeapYear ObservedはYes/Noです。EnergyPlusのNoによるFeb 29除外と、FSLの原レコードを捨てない互換方針は区別します。[EnergyPlus公式 EPW format / data dictionary](https://energyplus.readthedocs.io/en/latest/auxiliary-programs/auxiliary-programs.html)（参照: 2026-09-15）。これは第三者solver比較の実行結果ではありません。

### 検証結果 / 現在のGate

- `tests/epw-parser.test.ts`: 既存8760/8784正常testを保持しissuesなし/usableを追加確認。18 tests追加: 年初/年末/中間/Feb 29の1区間欠落、重複、件数を維持した重複＋欠落、通常/閏年swap、Feb 29全欠落、混合source year、年跨ぎ/再cycle、partial gap/期間外/不正header。異常時の明示error・利用拒否と、元データの保持を検査します。
- npm test: **28 files / 183 tests PASS**。既存165 tests、M1 Golden、M2 normal/leap NOAA / interval accounting、M3 geometry、Single/Multi regressionを維持。
- npm run typecheck / npm run build: PASS（Vite、90 modules、dist）。npm run golden:check: PASS。npm audit: 0 vulnerabilities。git diff --check: PASS。
- M1原本2点のSHA-256一致、M4.5 immutable Task Packet digest不変。engine / geometry / calculation / preset / CSV / Golden expectedの差分は0。
- Tokyo Hyakuri既存local EPW: §2のhashを確認し、変更後parserで8760 / 0 issues / usable PASS。rawデータの変更・追加commit・外部送信なし。新しいbrowser/第三者物理validationを実施したとは扱いません。
- exact final headとPR stateはGit/PRから解決し、PR本文と完了報告へ記録します。この文書の自己参照SHAは固定しません。

**P0-A implementation/checks / independent focused review PASS**（Human報告、Required Fixなし）。後続Human authorizationによるP0-Bは次節。M5全体は未完了です。

## 7. P0-B — independent direct-shadow benchmark

- 正本: [protocol / 再現手順 / 積分の前提](../scripts/validation/radiance-direct-shadow/README.md)、[固定入力](../scripts/validation/radiance-direct-shadow/protocol.json)、[機械可読comparison fixture](../scripts/validation/radiance-direct-shadow/comparison.json)。
- Protocol ID: FSL-M5-P0B-DIRECT-1。入力/許容差はFSL測定前に固定。SHA-256: 8b2ef0e48d63c00f58227feab8a012862c43af04c6e13617fff1cdb65c2a62cf。
- 10ケース: 庇なし、完全無遮蔽、部分、ほぼ全遮蔽、全遮蔽control、非対称とmirror、中間方位、azimuth grazing、低高度。全geometry/角度を固定し除外しません。
- 許容差: shaded fraction absolute error ≤1e-6、boundary ≤1e-5。reference budgetは1/4。粗いgridの一致をPASS扱いせず、外部hit/missの二分探索24/32/40回と段間収束を要求。詳細な限定shape仮定・integration誤差とsolver交差誤差の区別はREADMEに明記。
- Reference側にFSL helper/import/壁面影投影/polygon clippingなし。独立ENU sceneの不透明矩形庇にrtraceを使用するrunnerを用意。FSL側は別adapterで測定します。mock 3D ray/plane test doubleはharness試験専用で、外部benchmark集計へ混ぜません。
- 実行可否: PATH、代表的なRadiance/Ladybug配置先、関連installation registryでrtrace/oconv未検出。system-wide install / repo-local download / license同意なし。全disk探索ではないため、別配置が提供された場合は既存binaryを指定可能です。
- `--prepare`と`--run`の未導入fallbackを実行。10ケースのFSL値を取得し、referenceFraction/absoluteErrorは全件null。**Radiance PASS 0 / FAIL 0 / UNRESOLVED 0 / NOT_RUN 10 / 最大誤差 N/A**。外部実行経路のCLI互換性、数値交差精度、実測収束は未確認です。
- FSL geometry source checkpoint: 61b8313d1c141f1f5b1afa472160976bc9f10011、geometry tree: 08b15bc0d2ea6671347bca7eba2d82f87aeca971。source checkpointとfixture自身のcommitを混同せず、harness/protocol digestを併記。final headはGit/PRから解決します。
- `npm test`: **29 files / 219 PASS / 10 skipped**。新規36件はprotocol/scene/sampler/comparator testsで、10 skippedは未取得Radiance比較そのもの。既存183件のP0-A・M1 Golden・M2 NOAA/interval・M3 geometry・Single/Multi regression維持。
- typecheck / build / golden:check / git diff --check: PASS。buildは90 modules / dist、audit 0 vulnerabilities。M1原本2点hash、immutable Task Packet digest不変。
- P0-B差分: validation scripts・新test・文書のみ。src/**、既存expected、package/lockfile、legacy、immutable Run Artifactの変更なし。大型binary / raw weather追加なし。

現在は **P0-B PROTOCOL_PREPARED / EXTERNAL_REFERENCE_NOT_RUN**。これは許可されたfallback成果物であり、geometry physical validation PASSでもP0-B外部比較完了でもありません。次はprotocol review / 利用可能なRadiance環境での全case実行。PR #10はDraft維持でSTOP、Ready / merge / M6開始はしません。

# Validation Plan

## M5 — Current: LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING

P0-A / P0-C / P1-A focused reviewとP0-B protocol reviewはPASS / Required Fixなし（Human報告）。Completion Waveでrepository/localの追加検証A〜Eを実施しました（§10）。Completion Wave Independent Review: A. PASS / Required Fix: none / Blocker: none（Human報告）。Radiance / EnergyPlus / SPA / annual physical external validationはNOT_RUNです。**M5全体のphysical validation COMPLETEではありません。** M6はpost-merge gate PASSによりCOMPLETE。M7の追加検証は[Advanced Facade Shading](ADVANCED_FACADE_SHADING.md)へ分離します。

- 棚卸し日: 2026-09-15 (Asia/Tokyo)
- 固定product baseline: main @ bcc6b5a4e93a25a3c2b334e305fcbfd09a140403
- 作業branch: feat/m5-validation-stability。この文書を含むlive HEADはGit/PRから取得し、product baselineと混同しません。
- M4 / M4.5 / M6 / M7 / M8 / M9 / M10: COMPLETE。M5: local検証完了 / external reference待ち。M11はIMPLEMENTATION_COMPLETE / HUMAN_UX_REVIEW_PENDING / INDEPENDENT_FULL_REVIEW_PENDING。[M11検証・performance・未確認事項](WEATHER_SCENARIO_MATRIX.md)を参照。既存M1〜M10 expected/Golden・M5測定checkpoint・§10のhistorical gateは変更しません。M10の過去saved-file帰属・PDF Advisoryも維持。M12 NOT STARTED。
- M4.5のterminal Run Artifactとimmutable Task Packetはhistorical auditとして保持し、再closeoutしません。
- 数値の一致、Human UX PASS、Production READYは、絶対 [kWh] の物理的正しさや正式性能評価を意味しません。

## 1. 既存coverage — 重複実装しない範囲

§1〜9は各checkpoint時点の棚卸し・実装・review履歴です。「未実施」「今回対象外」はその時点の範囲であり、現在の完了/未完了は§10が正本です。既存historical evidenceは削除しません。

「十分」は表記したregression contractについての判断であり、全入力域・物理精度の保証ではありません。kickoff checkpointは **28 test files / 165 tests PASS**。P0-Aの追加結果は§6、残る不足は§3に分離します。

| 対象 | 既存の根拠 | 維持する検証 / 限界 |
| --- | --- | --- |
| M1 Golden | tests/legacy-v01-golden.test.ts、scripts/generate-legacy-v01-golden.mjs | 原本HTMLの独立VM実行から8 fixture cases、全12か月・年間/夏期/冬期をabsolute 1e-9で比較。幅/SHGC scaling、D/HとO/H相似性を保持。Legacyを物理正解にしない。 |
| EPW / LST | tests/epw-parser.test.ts、tests/epw-subhour-temporal.test.ts、tests/weather-time.test.ts、tests/weather-file-adapter.test.ts | LOCATION / DATA PERIODS、8760/8784、年末end/midpoint、Gregorian leap、欠測/負放射・不正行・拡張子拒否を維持。P0-A hourly（§6）に続き、P1-Aで15分35040/35136の完全性・sub-hour異常拒否を追加（§9）。物理的な計算精度や時間分解能感度の証拠ではない。 |
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

## 3. M5で追加する最小backlog（履歴）

P0-A / P0-Cはfocused review PASS、P0-Bはprotocol review PASS / 外部比較NOT RUN。P1-Aはsub-hour時系列検証済みでindependent review待ち。その他は **未実施 / PLANNED**。P0は後続評価の前提、P1はM5の信頼性判断に必要、P2は運用範囲の明確化です。失敗は記録し、式やexpectedを都合よく修正しません。

| 優先度 / ID | 追加する検証と不足の根拠 | 完了条件 / 再利用 |
| --- | --- | --- |
| P0-A / W-01 hourly時系列完全性 | 実装・検証済み / focused review PASS。月日・hourの時間枠、header期間、重複・欠落・逆順、8760/8784・年境界を検査。 | §6のcontract/tests。元の順序・値を保持し、temporal errorがあるdatasetを既存usable guardで拒否。行数一致だけではfull-yearにしない。 |
| P0-C / W-01 残る入口境界 | §8で空白/欠測放射・複数DATA PERIODSの既存拒否を確認。partialの無警告年間KPI表示を修正。focused review PASS。 | canonical coverageを再利用し、Single/Multiの気象欄・結果・印刷で読込期間のみと明示。計算値/temporal検査は変更なし。 |
| P0-B / P-01 独立direct benchmark | §7で10ケース・strict tolerance・独立scene/ray sampler・比較fixtureを準備済み。Radiance未検出のため10件NOT RUN、第三者PASSなし。 | 既存Radiance利用時のversion/binary hash、全case出力/誤差を記録。geometry fractionのみ。自前projection/clippingやGoldenをreferenceへ流用しない。 |
| P1-A / W-01 sub-hour時系列完全性 | §9でraw minute付きcalendar slotを検証。15分35040/35136、欠落・重複・逆順・Feb 29・年境界・TMY source yearを確認。 | hourly validatorを一般化して再利用、元レコード不変、既存error codeで拒否。independent review待ち。 |
| P1 / S-01 solar / interval感度 | NOAAは東京8点のみ。P1-Aのingestion完全性と、sub-hour通年solar-calendar/energy通算・極域・地平線・影感度の物理評価は別。後者は未実施。 | canonical 8760/8784、35040/35136でsimulation側のcalendar/通算を検証。UTC/Asia-Tokyo/America-New_Yorkの別process比較、独立SPA比較、60/15/5分感度は後続に分離。P1-Aのparser検証を重複実装しない。 |
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
- P0-A時点ではsub-hour検証は対象外でcount-based coverageを維持しました。後続P1-Aでその分類を置換します（§9）。Wh interval accountingは不変、P0-A当時のPASSをsub-hour完全性へ遡及適用しません。P0-AのUI変更は既存日本語エラー辞書への4項目ずつの追加のみです。

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

P0-Bは **PROTOCOL_REVIEW_PASS / EXTERNAL_REFERENCE_NOT_RUN**（Human報告）。これは許可されたfallback成果物であり、geometry physical validation PASSでもP0-B外部比較完了でもありません。利用可能なRadiance環境での全case実行は未実施のままです。後続Human authorizationによるP0-Cは次節。

## 8. P0-C — weather entry boundary

### 修正前characterization

- starting head: 9d25a83e6a3fe05699ed4396d9c77ea6d5dd9b62。branch/local/remote/PR head一致、working tree clean、PR #10 OPEN / Draft / merged=falseをfresh確認。
- 製品挙動を変更する前に新testを実行: **18 PASS**（14 rejection/zero-control + 4 partial presentation）。Single結果componentのtest用exportだけ追加し、1月/7月の各1時間synthetic EPWを既存browser adapter / parserへ通しました。
- partialは `coverage=partial` / issues=[] / 計算可能。Single気象欄のraw `partial` 以外に通年ではない旨の警告はなく、Single結果は「年間の日射熱取得」、Multi結果は「年間」「夏期」「冬期」を通常どおり表示。通年/季節全体との誤認リスクがあり、UI修正が必要と判断しました。
- GHI/DNI/DHIそれぞれの空欄・空白/タブ・9999は既に `RADIATION_MISSING` / severity=error、値はnull。列自体が欠けた行は `ROW_MALFORMED`。既存usable guardとSingle/Multi計算入口が拒否します。明示的な数値0は正常値のままです。
- 2組のDATA PERIODSは既に `DATA_PERIOD_UNSUPPORTED` / severity=errorでbrowser adapterがreject。parserの追加修正は不要でした。

### 最小表示contract

- `src/app/weather-coverage.tsx` は既存 `WeatherDataset.coverage` を表示へ写すだけです。interval再走査・年判定・新state/effectは追加せず、EPW temporal logicを複製しません。
- partialでは「部分期間の気象データ」「通年結果ではありません」を気象欄、結果、印刷概要へ明示。Single/Multi共通でannual表示を「読込期間合計」、season表示を「夏期の読込分」「冬期の読込分」とします。MultiのBuilding Total、Floor Breakdown、階別差分、印刷用全階表、footerも同じ区分です。
- 月別/差分も読込区間のみ。未読込期間の集計0は放射ゼロの確認ではなく、夏期/冬期全体の充足を保証しません。年間換算・silent fillは行いません。partialを拒否する新仕様にはせず、従来の部分期間計算を維持します。
- full-year-8760 / full-leap-year-8784 / full-year-subhourの従来ラベルは維持。これはcanonical分類の表示contractであり、P0-C時点で未実施だったsub-hour完全性をその表示testでPASSとはしません。後続P1-Aのingestion検証は§9。
- solar / geometry / energy / weather parser、計算結果shape、既存expected、CSV / preset / package filesは差分0。CSVの既存年間/季節列名やschemaは今回対象外で変更していません。partial CSVを通年証拠として使用しないでください。

### 検証結果 / 現在のGate

- 新規 `tests/weather-entry-boundary.test.tsx`: **23 PASS**。修正前4表示testを修正後regressionに変更し、既存数値expectedは変更なし。1月/7月partialのSingle/Multi警告・期間名・印刷用markup、未読込season=0と読込分合計、render前後result不変、partial sub-hour表示、full-year表示維持を確認。
- npm test: **30 files / 242 PASS / 10 skipped**。既存219件（P0-A・M1 Golden・M2 NOAA/interval・M3 geometry・Single/Multi・P0-B harness）を保持。10 skippedは未取得Radiance reference比較でありPASSではありません。
- npm run typecheck / npm run build / npm run golden:check / git diff --check: PASS。buildは91 modules / dist。npm audit: 0 vulnerabilities。
- 表示確認はSSRと既存print CSSの適用経路確認です。今回はnative OS EPW選択・実ブラウザ操作・PDF保存・390px目視の再実行はしておらず、そのPASSは主張しません。W-01の今回の入口境界と、P1/U-01製品操作acceptanceを分離します。
- exact final headはGit/PRから解決し、PR本文と完了報告へ同期します。M1原本・immutable Task Packet・P0-B protocol / reference fixtureは変更しません。

**P0-C implementation/checks / focused independent review PASS**（Human報告、Required Fixなし、reviewed head 2fedf051a9ebd54c507cfe41458a7e2a9f76a080）。後続Human authorizationによるP1-Aは次節。

## 9. P1-A — sub-hour temporal integrity

### Contract

- 対象は既存parserの単一DATA PERIOD / recordsPerHour > 1（60の正整数約数）。headerと各行の日時・minute整合は既存処理で確認後、`validateEpwTemporalIntegrity()` へ渡します。15分専用logicにはしません。
- `step = 60 / recordsPerHour` 分、`slotsPerDay = 24 * recordsPerHour`。canonical dateのday index、`(rawHour - 1) * recordsPerHour`、`rawMinute / step - 1` でslotを決定。15分なら同じhour内の15/30/45/60分は別slotです。raw 24:60は元の日付の最終slotであり、正規化された翌日00:00をキーにしません。
- P0-Aのcalendar選択（LeapYear Observed=Yesまたは実Feb 29で366日、他は365日）・宣言開始日からの相対offset・Mapによる重複/欠落・元順序の逆順検知を共用。source yearは書換えずTMYの年変化をslot順序に使いません。Noでも実Feb 29を保持し、NoかつFeb 29なしではraw source yearの閏年だけから欠落日を推定しない互換方針です。
- 通年宣言は開始/終了日inclusive、先頭/末尾を含む全slotを各1回、順序どおり要求します。15分では35040または35136。件数だけの `classifySubhourCoverage()` を除去し、temporal errorがない通年だけ `full-year-subhour` とします。件数一致のduplicate+missingやswapも不合格です。放射等の別parse errorは引き続きusable guardで拒否します。
- Partial宣言はP0-A同様、宣言期間内かつ観測spanのslot連続性を要求。宣言したpartial期間の両端までの充足は保証しません。連続した既存partial fixtureは維持し、P0-Cの「読込期間のみ」の表示をそのまま使います。
- Dec→Janは宣言期間が年境界を跨ぐ場合だけ順方向に許可。April→Marchの通年も全slotを検査。追加の次年cycleを黙って許容することはありません。複数年連続データやmultiple DATA PERIODSの新規対応ではありません。
- `INTERVAL_MISSING` / `INTERVAL_DUPLICATE` / `INTERVAL_OUT_OF_ORDER` / `INTERVAL_OUT_OF_PERIOD` をseverity=errorで再利用。invalid minuteは既存 `TIME_INVALID`、不正header日付は `HEADER_INVALID`。silent sort / fill / duplicate除去なし。source year・flags・放射値・sourceLine・元順序を保持します。
- Hourlyでは `rawMinute=60` / step=60により従来slotと同値。issue code/message、coverage、partial/leap/TMY契約を維持。UI、solar / geometry / energy式、Wh積算、既存expectedは変更なし。

仕様参照: [EnergyPlus公式 EPW data dictionary](https://energyplus.readthedocs.io/en/latest/auxiliary-programs/auxiliary-programs.html#energyplus-weather-file-epw-data-dictionary)（2026-09-15再確認）。Hour 1–24 / Minute 1–60とDATA PERIODSのrecords/hourを確認しました。FSLのminute整合・欠測拒否・単一典型年という入力制約を、EnergyPlus solver全体の受入仕様とは混同しません。

### Validation / gate

- 新規 `tests/epw-subhour-temporal.test.ts`: **34 PASS**。実装前は同じ34件が **7 PASS / 27 FAIL** となり、sub-hourの欠落/重複/逆順が見逃されることを再現しました。新しい判定に合わせてexpectedを緩めていません。
- 15分通常年35040・閏年35136、通常/閏年の先頭/中間/末尾1区間欠落、同一hour内duplicate / swap、件数維持duplicate+missing、Feb 29全96区間欠落（Yes時）、Feb 28→29→Mar 1、Dec→Jan/逆順/重複cycle/境界gap、April→March通年、partial gap/期間外、不正minute/header、全有効records/hourの短い連続/欠落caseを検査。
- 混合TMY source yearの全35040行でraw year/month/day/hour/minute、flags、GHI/DNI/DHI、sourceLineの元順序一致を確認。通年fixtureは固定のsynthetic calendarから生成し、validatorのslot/dayOfYearをexpected側で使用しません。raw EPWや大型fixtureは追加commitしません。
- focused: **4 files / 89 PASS**（新規34 + 既存EPW parser27 + P0-C入口23 + LST5）。既存hourly 8760/8784・missing/duplicate/order/leap/partial/TMY/year-boundary testsは変更なし。
- Full convergence: npm test **31 files / 276 PASS / 10 skipped**。既存242件の回帰を保持。Radiance外部比較10件のSKIPはNOT_RUNでありPASSではありません。
- npm run typecheck / npm run build / npm run golden:check / git diff --check: PASS。Vite build 91 modules / dist、npm audit 0 vulnerabilities。
- UI / browser / 実EPW smoke / polar day-night / SPA / 60・15・5分の影感度 / 通年physical validationは今回未実施。parser時系列PASSをsolar/energy計算精度のPASSに拡張しません。Radiance NOT_RUNを維持。
- final exact headはGit/PRから解決し、PR本文と完了報告に記録します。既存M1原本・immutable Task Packet・P0-B protocol / comparison fixtureは変更しません。

**P1-A implementation/checks PASS / independent review pending**。PR #10はOPEN / Draft維持、Ready / mergeなし。M5全体は未完了、M6 NOT STARTED。Human GateでSTOP。

## 10. Completion Wave — local verification / external boundary

### Current state / source identity

- 実施日: 2026-09-15。開始head: `ae11e54b5ea55cf8f045cb16198947bf8138063f`（P1-A review PASS、Human報告）。
- 検証対象のproduct/test/runner checkpoint: `e2e9fad5f8797d943507f616e8ea28f839c7ffa7`。後続はdocs/evidence同期のみ。現在のfinal HEADはGitとPR #10から解決し、測定checkpointと混同しません。
- M5: **LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING**。A〜Eのローカル検証PASS、Fのavailability調査完了 / 外部比較NOT_RUN。PR #10はDraft維持。Ready / merge / M6は未許可です。
- Completion Wave Independent Review: **A. PASS / Required Fix: none / Blocker: none**（Human報告）。Reviewed exact head: `269cf5fb7e3269c6b9d0295ccc2bd60c1e8ba833`。今回のterminal同期はdocumentationのみで、product / tests / runner / measurement JSON / P0-B protocol・comparison fixture / expected・Goldenは変更しません。
- 正式な絶対kWh評価、SPA精度、Radiance/EnergyPlusとの一致を先に正しいと決めません。

| Workstream | Result | Evidence / scope |
| --- | --- | --- |
| A Solar / time-step | PASS | 新規27 tests。緯度0/+70/-70、春秋分/夏冬至、Feb 29/年末/元日、offset -12/0/+5.5/+9/+14、5分刻み全日。polar day/night finite、高度<=0のdirect=0。3つの異なるTZプロセスで36太陽位置と8784 simulation summaryのJSON hash一致。 |
| B Numerical | PASS (reproduced failures fixed) | 新規33 tests。grazing前/直後、接触±1/2epsilon、scale 1e-3〜1e6、datum 1e6/1e9、浅い/深い庇、非対称extension、near-zero/near-one、overflowの明示拒否。 |
| C Independent composition | PASS | 新規3 parameterized tests。1/3/5 Floors × 2 Cases × 2 baselines、異なる方位/SHGC/階寸法、庇あり/なし/左右非対称。Multi変換helperを使わずSingle入力を組立。各floorの12か月/annual/summer/winter、建物和、delta一致。1floor exact一致。共有engineのcomposition検証であり外部物理oracleではない。 |
| D Real EPW product path | PASS (local automated browser) | hash確認済みTokyo Hyakuri 8760/0 issues。Single 2案、Multi 2案×3階、edit→stale→rerun、Building Total / Floor Breakdown / 月別、色、CSV/画面値一致、PDF、390px横スクロールを確認。 |
| E Dependency / workload | PASS | guard追加22 tests（negative21 + positive/relative edge1）。core/modelsのTS/TSXとrelative import graphを走査。13 workload × warmup1 + 計測3、結果hash不変。 |
| F External solvers | NOT_RUN | PATHと代表配置でrtrace/oconv、EnergyPlus、SPAの利用可能なbinaryなし。インストール・download・license同意なし。Radiance全10ケースはPASS=0 / FAIL=0 / UNRESOLVED=0 / NOT_RUN=10、最大誤差N/A。 |

### A — numerical conservation versus sensitivity

[Machine-readable measurements](m5-completion-measurements.json)に全case、3反復のraw timing、中央値/最大、環境、TZ probe hashを保存しています。`startingCheckpoint`は測定対象のclean commitであり、この文書自身のcommitではありません。

- TZ=UTC / Asia/Tokyo / America/Los_Angeles。hostの夏期offsetは0 / -540 / +420分と実際に異なり、計算hashは全て `e3a2d5e8ace69ba9e57c4ea0e18ab2f2d2dcd392797d8280ee5fe33c49056e21`。
- 固定synthetic Wh profileの60/15/5分: 8760 / 35040 / 105120区間。単位時間あたりの放射を同一にして区間Whを保存的に分割。nighttime DNIも境界試験のため意図的に非0。実気象を模倣したoracleではありません。
- 庇ありdirect年間値[kWh]: 919.6456237496157 / 920.3416079784585 / 921.52425755227。60分からの差は+0.6959842288428035 / +1.878633802654349 kWh。**感度であり5分を正解にしません。**
- 庇ありdiffuse約649.8769436829 kWh、ground約525.6 kWhは全stepで絶対1e-6 kWh以内一致。庇なしdiffuseは独立手計算 `8760×120×0.5×4×0.5/1000 = 1051.2 kWh`、groundは `8760×300×0.2×0.5×4×0.5/1000 = 525.6 kWh` と照合。
- 既存NOAA 2025/2024 reference、0.5° tolerance、365/366 algorithmは保持。polar finiteを高精度SPA一致とみなしません。

### B — reproduced numerical failures / minimal fixes

実装前の新規A〜C 61 testsでは52 PASS / 9 FAILを確認。追加したrelative-angle overflowも修正前FAILを再現しました。失敗に合わせて既存expected/toleranceを変更していません。

- datum=1e9、2m×2m開口、正面45°/D=1mの解析解0.5が、従来shoelaceの巨大積同士の相殺で0になりました。通常scaleでは既存演算順序を保持し、`Number.EPSILON × (頂点数+2) × Σ|積| / 2` のroundoff見積が既存area epsilonを超える時だけ、同じshoelaceをlocal originから評価します。これは数値評価の安定化でありshadow / projection / 物理式の変更ではありません。
- openingの長さまたは面積が既存resolution以下、derived area/widthのoverflow、datumでwidthが消失、polygon面積非有限はRangeError。既存 `GEOMETRY_EPSILON=1e-9`（座標[m] / 面積[m²]それぞれの従来境界）を変更していません。1mm scaleの相似形はPASS、1e-6m / 1e-12m開口はunsupportedとして明示error。
- finiteな極端値でもtimezone→minute、相対角引算、庇derived寸法、interval/period/building energyが非有限になる場合は明示RangeError。通常solar/irradiance/energy式は不変。
- 新しいsilent clampはありません。既存のarea<=epsilonを0とする規則、fractionのepsilon近傍0/1規則、NOAA cos(zenith)のroundoff clampは既存contractとして保持。全IEEE-754入力域の精度保証ではありません。
- P0-Bのprotocol / comparison.json / harness / testsは変更せず、10個の記録済みFSL値も**exact一致**を保持。geometry treeは数値ガード追加により変わったため、旧protocolのsource checkpointを最新headの外部検証済み証拠へ読み替えません。外部solver実行時は旧checkpointで固定protocolを実行し、最新treeへの適用は別途reviewされた新checkpoint/protocolが必要です。

### D — real EPW / browser / output evidence

- 原本hash: `3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`、1,558,629 bytes。browserの通常EPW file inputに実ファイルを渡し、React state/resultの注入やsyntheticへの置換はしません。
- localhost、既存Chrome 152 / Playwright。`setInputFiles`による実ファイル入力です。今回Native OS file chooser / 対話print dialogのHuman実操作を主張しません。最新Waveはlocal/repository検証を許可しているためlocal product pathとして扱います。過去M4 RF-01 Human closureは保持。
- Single A/B: D=0.8/1.8m、annual 5535.816900423106 / 4047.023952658591 kWh。Multi A/Bは3floors、Bの1FのみD=1.8m。Building annual 16607.450701269318 / 15118.657753504802 kWh。これらはsmoke checkpointでありphysical expectedではありません。
- CSV: Single 2行、Multi Building2 + Floor6行。annual/summer/winter/月別12値が表示の丸め値と一致し、Multiの全15系列は各Floor和と1e-8 kWh以内一致。raw EPWはCSVへ含めません。
- A/B色 #0055cc / #d00080: chart/legend/Case識別へ即時反映、table numeric valuesとpolyline points不変、再計算不要。印刷 `print-color-adjust: exact`、Case線種を維持。
- 製品の印刷ボタンとChrome live-DOM PDF出力を確認。Single A4 5頁 / Multi A4 6頁をPopplerで全頁renderして目視。KPI、月表/graph、階別比較、積層形状と色対応を確認。390pxはdocument overflowなし、横長の月表/graphは内部横スクロール可能。
- HTTP 200、app-origin fatal/runtime errors 0、console errors 0、asset errors 0、request failures 0、外部request 0（localhost以外は拒否）。初期ad-hoc smokeでconsole 404が1件ありましたがURLを記録できていないためfavicon等と断定せず、上記再現runnerの全経路で再確認しました。
- raw EPW / CSV / PDF / screenshots / user-specific pathはlocal-only、public repoへcommitしません。画面とPDFの検証は同じproduct checkpoint、Vercel/Productionの手動操作なし。

### E — guard and workload limits

- `fs/promises`、node:形式、re-export、dynamic import、require/import-equals/type import、browser globals、DOM/File/Canvas、Node-only package/process/Buffer、Dateをnegative fixtureで拒否。relative importが走査対象coreから外れる場合も検出します。
- TypeScript 7の本repo packageには旧compiler AST APIがないため、追加依存を導入せずcomment/stringを区別する保守的lexical guardを採用。任意の難読化・構文・aliasを証明するsecurity sandboxではありません。
- Windows 11 / x64 / Node v24.15.0 / Core Ultra 9 285K。独立workerごとにsetupを除外しwarmup1回＋計測3回。各runの結果hash一致、finite建物値を確認。1/3/10 Floors × 1/4 Cases × 8760/8784の12構成＋3 Floors×4 Cases×35040を実施。
- hourly median 13.54〜431.74ms / max 433.66ms、15分代表 median 511.56ms / max 529.02ms。process high-water RSSは最大191076 KiB（約186.6 MiB、SSR/runtime/setup込み。engine単独peakではない）。全raw結果はJSONを参照。
- Advisory: 低速端末・10階超・大量sub-hourでの応答時間や最大Floor数は未保証。main-thread同期計算は大負荷時に操作を待たせ得ます。benchmarkを理由にworker化、engine最適化、上限変更をしていません。

### Reproduction / convergence / remaining gate

```text
npm test
npm run typecheck
npm run build
npm run golden:check
npm audit
node scripts/validation/m5-completion/run.mjs
node scripts/validation/m5-completion/browser.mjs EPW_LOCAL_FILE http://127.0.0.1:5175/
git diff --check
git diff --check origin/main...HEAD
```

Browser runnerは先にlocalhost dev serverを起動し、既存Playwright / Chromeが標準解決できない場合は `M5_PLAYWRIGHT_MODULE` / `M5_CHROME_EXECUTABLE` へ既存配置を指定します。自動installなし。EPWのhash不一致時は入力前に停止します。runner出力は `.local-validation/m5-completion/` 内のみ。新しい測定で保存済みJSONを黙って更新しません。

- npm test: **34 files / 361 PASS / 10 skipped (371 total)**。新規85 PASS、既存276 PASSを保持。Radiance skipped10はNOT_RUNです。
- typecheck / build / golden:check / audit / both diff checks: PASS。build 92 modules / dist、audit 0 vulnerabilities。M1原本2点とM4.5 Task Packet digestは不変、P0-B固定protocol不変。
- 現在の未完了: Radiance実solver10件、SPA高精度比較、EnergyPlus/放射成分/年間physical reference・model discrepancy。利用環境/ライセンスとreview済み比較protocolを整えて実行するまでEXTERNAL_REFERENCE_PENDINGです。
- 計測済み範囲以外の全デバイス保証、OS chooser/print dialog再操作、任意巨大入力の精度は主張しません。既存absolute kWh / diffuse近似 / cross-floor未実装の制限は維持。
- Completion Wave Independent ReviewはPASS。次の作業は別のHuman instruction / authorization待ちです。PR #10 Draft維持、Ready / merge / branch削除 / 手動Productionなし、M6 NOT STARTED。今回のterminal同期自体を理由に新たなcloseout cycleは作りません。外部環境がないためローカル検証を繰り返すだけのcycleも不要です。

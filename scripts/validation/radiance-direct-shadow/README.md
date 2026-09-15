# P0-B independent direct-shadow protocol

Status: **PROTOCOL / FIXTURE PREPARED — RADIANCE NOT RUN**.

2026-09-15のこの環境ではPATH、代表的なRadiance/Ladybug配置先、関連installation registryにrtrace/oconvを確認できませんでした。全diskの不存在を証明するものではありません。system-wide / repo-local install、download、license同意は行っていません。

`comparison.json`は10ケースのFSL実測値と、未取得のRadiance referenceを明確に分離した機械可読handoffです。`referenceFraction` / `absoluteError` / `maxAbsoluteError`のnullは0ではありません。NOT_RUNをPASSに数えません。

## 固定入力と許容差

`protocol.json`をFSL値の取得前に固定しました。

- Protocol: `FSL-M5-P0B-DIRECT-1`
- SHA-256（UTF-8 / LF）: `8b2ef0e48d63c00f58227feab8a012862c43af04c6e13617fff1cdb65c2a62cf`
- shaded fraction絶対許容差: regular **1e-6**、boundary **1e-5**。
- reference数値積分の予算: 各許容差の1/4。bisection 24 → 32 → 40回、左右端insetは開口幅の1e-8、1ケース最大2000 rays。事後のcase除外・許容差拡大なし。
- 10ケースすべて、facade方位、opening center/width/sill/head、庇depth/elevation/左右延長、太陽azimuth/altitudeをJSONへ固定。庇なし / 完全無遮蔽 / 部分 / ほぼ全遮蔽 / 全遮蔽control / 左右非対称とmirror / 中間方位 / azimuth grazing / 低高度を含みます。
- `controlFraction`は庇なし=0、隙間より小さい影=0、正面45°で上部0.5/2=0.25、1.999/2=0.9995、全遮蔽=1という手計算controlです。Radiance測定値ではなく、実行後のoracle sanity checkにだけ使います。非controlケースはRadiance値取得までnullです。

## 独立性とscene

- `reference.ts`: FSL importなし。実geometry helper / polygon clipping / 壁面への影投影式を使用しません。
- world座標はEast/North/Up。facadeのoutward bearingと鉛直upから外部正面視のright basisを作り、水平庇の4頂点を3D sceneに配置します。受照開口はray originsだけで表現し、壁を置いてself-hitさせません。
- 不透明rectangleを1枚だけ生成。parallel rayはopeningから太陽のworld方向へ出し、originは壁面上のままです。特にgrazingで偏りを起こすoutward offsetは加えません。
- `rtrace -os`のsurface名でhit/missを取得します。`overhang`だけがhit、`*`がmiss、それ以外・欠けた応答はerror。illuminationではなくfirst-hit ray castingです。
- `oconv -f -b -20 -20 -20 40 -`、`rtrace -h- -faa -os -x 1 -y 0 -ab 0 -bv+ -ld- <octree>`。空sceneは固定bounding cubeでコンパイルするprotocolです。実Radianceでの空octree/CLI動作は未確認であり、失敗はUNRESOLVEDとして残します。
- diffuse / ground / SHGC / glass / HVAC / annual kWh / 太陽位置solver比較は対象外。太陽角度は入力でありNOAA等から生成しません。
- `fsl-adapter.ts`だけがsystem under testをimportし、`calculateDirectShadow()`を呼びます。reference測定完了後にFSL値を取得し、referenceのqueryや分割判断には渡しません。

仕様根拠: [LBNL rtrace manual](https://radsite.lbl.gov/radiance/man_html/rtrace.1.html)、[oconv manual](https://radsite.lbl.gov/radiance/man_html/oconv.1.html)、[scene / polygon format](https://radsite.lbl.gov/radiance/refer/ray.html)、[`-os` miss出力のupstream source](https://github.com/NREL/Radiance/blob/master/src/rt/rtrace.c)（参照: 2026-09-15）。実行時のbinary version/hashは別途記録し、文書版を実行版と混同しません。

## 面積積分protocol（独立review対象）

粗い等間隔gridのhit率だけで1e-6を保証しません。今回のsceneは、開口全幅以上のrear edgeを持つ単一水平矩形庇、非負extension、庇高≧開口head、front-facing/upward parallel raysに限定します。この条件では各縦列のshadowは上端に繋がり、列ごとの遮蔽高さは単調なclipped-affine形です。

1. 開口をu/v ∈ [0,1]に正規化。5列（inset, 1/4, 1/2, 3/4, 1−inset）でvを二分し、外部hit/missだけから遮蔽高さを取得。
2. 左右端の高さをm≤Mとすると、全列が遮蔽される帯は高さm、残るtransition bandは高さM−m。内部列の単調性・端点範囲を確認。
3. transition bandの1/4・1/2・3/4高さで、uを二分して遮蔽幅を外部queryから取得。この限定sceneのtransition内幅はaffineなので、面積率は `m + (M−m) × midpoint width`。quarter点で非affineを検出したらUNRESOLVED。FSLのprojected polygonを積分する処理ではありません。
4. 理想的な正確hit oracleに対する保守的な正規化integration budgetを `2×inset + 16×2^(-steps)` とします。端の未観測strip面積≤2×inset、bisectionによる高さ/幅/帯境界の丸めを残りの予算で覆います。40回では約2.0015e-8です。
5. 最後の2段ともreference予算以内、段間差が両段budgetの和以内でなければUNRESOLVED。収束後、絶対差>許容差はFAIL。絶対差+integration budget≤許容差だけPASS。閾値近傍はUNRESOLVED。

このboundはRadiance内部の交差演算誤差・geometry epsilonの上限を保証しません。version/hash、grazing/boundary結果、control、細分化を一緒にreviewします。また、このsamplerは任意mesh・複数庇・穴・side finへ一般化できません。内部probeだけでは任意shapeを証明できないため、限定scene生成器と入力contractが前提です。

## 再現手順

repo root、既存のnpm dependenciesを使用します。新packageのinstall不要。

```text
node scripts/validation/radiance-direct-shadow/run.mjs --prepare
node scripts/validation/radiance-direct-shadow/run.mjs --run
```

- `--prepare`: scene hash、FSL値、protocol/harness digestをstdout JSONへ出力。Radianceを実行せず、referenceはNOT_RUN。
- `--run`: PATH上の既存rtrace/oconvを使用。別配置の承認済みbinaryには `--radiance-bin <directory>` を指定できます。download/installは一切しません。
- executableなしなら10件すべてNOT_RUN、exit code 2。これは許可されたfallbackであり、referenceを捏造したりタスク全体をBLOCKEDとするものではありません。
- 実行時は`.local-validation/radiance-direct-shadow/run-*`にscene、octree、全ray入力、全hit出力、stderr、comparison JSONを保存。新規一意directoryのみ、既存データ削除・tracked fixtureの自動上書きなし。
- 全ケースを試行し、実行異常/shape不一致/未収束はUNRESOLVED、測定差超過はFAIL。PASS以外があればexit code 2。失敗を除外して成功ケースだけを保存しません。
- 実測結果のpublic-safe JSON昇格はreview後に明示更新。binaryや大型octreeはcommitしません。`comparison.json`のsource checkpointはFSL geometry取得元であり、このfixture自身のcommit SHAではありません。geometry treeがcheckpointから変わった場合は新protocolが必要です。

## テストの意味

`tests/third-party-shadow.test.ts`はcase/digest固定、ENU座標、scene、応答parser、積分・判定を検査します。clipped-affine hit関数とgeneric 3D ray/plane test doubleはharnessの単体試験であり、Radiance実行や第三者solver PASSには数えません。

外部referenceがnullの10ケースは明示skipです。reference取得後の比較testはNOT_RUN以外をskipせず、FAIL/UNRESOLVEDを失敗として残します。現在の外部benchmark集計は **PASS 0 / FAIL 0 / NOT_RUN 10 / 最大誤差 N/A**。

次は利用可能なRadiance環境でこのprotocolを実行し、全case・control・sampling budget・CLI互換性をIndependent Reviewへ提出します。Ready / merge / M6は開始しません。

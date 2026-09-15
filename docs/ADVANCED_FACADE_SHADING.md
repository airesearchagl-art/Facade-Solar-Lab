# M7 — Advanced Facade Shading

Current state: **MERGED / PRODUCTION_PROVENANCE_PASS / PRODUCTION_BROWSER_SMOKE_PASS / COMPLETE**。Independent FULL Re-Review A. PASS / Required Fix CLOSED、Human exact Preview acceptance PASS（証拠は下記）。PR #12はsquash merge済み。main: `642136058d538e89d29971b0a586f86ea3aaa926`。Git automatic Production: `dpl_DyRqKwmhrdHo8gQNqw9pqqmyAR7v`。開始mainは`f3cd83962e462f3e28ed20373d3ad58ede5e835e`、M7 branchは`feat/m7-advanced-facade-shading`。accepted product checkpoint・squash merge commit・live HEADを区別する。

## Contract

- facade-local: wall `y=0`、外部正面視で右が`+x`、外側`+y`、上`+z`。SI [m]、方位は北0°時計回り。標準right-handed xyzを意味しない。
- 水平庇は既存contractのまま。左finは開口左端、右finは右端の定数x面に固定。面は`y=0..depthM`、`z=bottomZM..topZM`の有限矩形。
- `leftFin?` / `rightFin?`がabsentなら無効。存在時は各値finite、depth>=0、top>bottom。depth=0は遮蔽なし。高さは明示値、既定値は開口sill/head。Multiでは当該Floorのlocal z。
- direct geometryは`facade-v2`、direct modelは`overhang-vertical-fin-array-shadow-union-v2`。庇・端部フィン・中間フィンを壁へ投影し、開口へclipしてunion areaを求める。重複は二重加算しない。
- finsなしは既存`facade-v1-weather`を継続。v2はdirectだけ拡張し、solar/weather/SHGC/期間・月別集計を共有する。`withOverhang`という互換出力fieldはv2では庇＋有効finの複合遮蔽を表す。
- diffuseは従来の庇のみ2D infinite-width近似。fin diffuse/finite-width diffuseの物理validationなし。ground modelは変更なし。cross-floor physical shading未実装。
- 表示値は窓からの日射熱取得量。HVAC負荷、BEI、空調容量、消費エネルギー、認証solver結果ではない。

## Implementation / compatibility

- Projection: 各surfaceの点 `(x,y,z)` を `(x-y*sx/sy, z-y*sz/sy)` へ投影。開口center x / sill zを原点とした小さい座標系でclip・unionを計算し、大きい絶対datumでの桁落ちを抑える。外部に返すv2の`surfaceShadows[].polygon`はこのlocal frameである。互換のsingular `shadowPolygon` / `clippedShadowPolygon`は庇だけのworld座標で、union輪郭ではない。
- Union: 中間配列は後述のanalytic x-sweep。配列がない端部フィン経路だけは、旧最大3面の面積和 − 全pair intersection + triple intersectionを演算順序ごと保持。2^Nへ拡張しない。epsilonを超える面積範囲逸脱・非finite・overflowはerror。v1と同じ`1e-9`長さ/面積解像度とfraction境界snapだけを許可し、無条件clampしない。
- `simulateFacadeV1()`の公開挙動を保持。`simulateFacade()`はfins有効性をvalidateし、無効/出0/実配置0枚（他の有効フィンなし）ならv1へdispatch。有効ならv2。月別/期間 traversalとsolar/LST/SHGC/地面反射/20-strip diffuseを共有する。
- Presets: v1はfins absentとして継続。v2はrootに`schemaVersion: 2, geometryVersion: "facade-v2"`必須。存在する端部finは3つの有限number、中間finは同じ3寸法とpitch/count判別layoutだけをwhitelist。v1にfinを混入した入力は明示error。庇のみwriterはv1を維持し、フィン情報（出0も含む）がある場合はv2を選択する。旧アプリはv2を拒否するので黙って異なる形状を計算しない。weather/result/private metadataは保存しない。
- CSVは従来column順序を保持して左右fin8項目を末尾追加。Singleの既存`庇あり`columnはv2では「庇＋有効フィン」、`庇なし`は遮蔽物なしを表し、注記を出力。CSV式injection対策を維持。
- Multiのfloor-local ray clippingとfloor compositionは不変。フィンの画面表示だけfloor境界で区切り、計算入力を書き換えない。Single断面のフィン網掛けは側面投影であり中央切断面ではない。参考太陽線は従来の庇先端基準。

## Historical edge-only validation — checkpoint 2ccbcc89

既存420 PASS / 10 SKIPPEDを保持。新規61 tests（geometry 38 / integration 17 / render 6）を追加し、合計481 PASS / 10 SKIPPED（38 files）。外部solverの10 skippedをPASSへ加算しない。

- 解析面積: sx/sy=-1、sz/sy=1、開口2×2 m、左fin D=1 m / z=0..2 mでは`∫(2-t)dt=1.5 m²`、fraction=0.375。十分な左右張出の庇D=1では2 m²、重複0.5 m²、union3 m² / fraction0.75。new implementationの出力から期待値を作らない。
- no fins / zero depth、左右mirror、庇＋左右fin、double/triple overlap、full/no shade、grazing/low altitude、方位回転、非対称、高さ/center datum 1e6〜1e12、浅い/深いfin、invalid/overflow: PASS。
- v1 no-fin machine-exact monthly/period/output、diffuse/ground不変、Single/one-floor exact等価、複数階単純合算、preset v1 migration / v2 round trip / malformed rejection / whitelist、CSV injection、floor表示clipping: PASS。
- Browserは既存Playwright/Chromeでsynthetic Demo → Single/Multi Case Bフィン編集 → stale → Run/rerun → 月別/階別/入力差/形状 → CSV/print。2026-09-15T12:42:38.860Zの再実行PASS。localhost HTTP200、fatal/console0、asset errors0、390px document overflowなし。PDFはChrome print engineで生成し、Single 5 / Multi 7 pagesをPopplerでレンダリング確認。ラベル近接と見出し折返しを調整後に再確認済み。native OS print dialogやreal EPWのHuman再acceptanceとは称さない。
- 負荷: `scripts/validation/m7-shading/workload.mjs`。M5 syntheticYear/independentCaseを再利用し、各floorに庇を設定。同条件でv1 vs 庇＋両fin、8760 intervals、warmup1＋5反復。初回重複projectionを解消後、medianは1案1階 v1 12.55 ms / v2 27.10 ms、4案5階 v1 252.12 ms / v2 558.50 ms（約2.2倍、当該local CPUのみ）。5反復の結果digestは不変。増分は直達影projection/unionの追加workで、v1計算式の劣化ではない。M5保存済み測定JSONは変更しない。絶対的な性能SLA・旧P0-B外部validationの証拠ではない。

再実行: `npm test` / `npm run typecheck` / `npm run build` / `npm run golden:check` / `npm audit` / `git diff --check` / `git diff --check origin/main...HEAD`。測定runnerは上記scripts。生成物はignored `.local-validation/m7-shading/`のみ、実気象や機微情報をcommitしない。exact final-head checksとGit PreviewはPR本文で同期し、自己参照SHA commit cycleを作らない。

## Intermediate fin array — Required Fix contract

`intermediateFins?: { depthM, bottomZM, topZM, layout }`。高さと出の検証は端部フィンと共有。layoutは`{ mode: "pitch", pitchM }`または`{ mode: "count", count }`。厚さなし・中央割付固定、clear spacingではなく**中心ピッチ** [m]。canonical `deriveFinLayout()`をgeometry/UI/CSVで共有し、positionsを保存しない。

- 幅W・ピッチP: P>Wなら0枚。それ以外は`n=floor(W/P)`、`margin=(W-(n-1)*P)/2`、開口左端から`margin+i*P`。W6/P1.5は4枚・0.75/2.25/3.75/5.25 m、W6/P2は3枚・1/3/5 m。
- 枚数n: 正の整数。位置`W*(i+1)/(n+1)`、中心ピッチと左右余白は`W/(n+1)`。W6/count3は1.5/3/4.5 m。全位置strict interior、jambと重複させない。
- 実枚数・実中心ピッチ・左右余白を常時表示。0枚時は実ピッチ/余白は未定義（UIは「—」、CSVは空欄）で、指定Pと混同しない。
- `MAX_INTERMEDIATE_FINS=128`。12 m/P0.1 mの120枚を許容しつつ対話処理を有限に保つ上限。超過・0/負/nonfiniteピッチ・非整数count・overflow・1e-9解像度以下の余白/複数枚間隔・識別不能な位置は明示error。silent truncate/fill/sortによる入力修復はしない。

### Generalized union

`shadow-sweep.ts`は任意個数の有限convex polygonを対象とする。全vertex xと異なるpolygonのedge交差xでslab分割し、各slab内のlinear edgeから縦interval群を得てunion lengthを計算する。edge orderingが一定のslabではlengthがlinearなので、midpoint length × slab widthが解析積分になる。raster/sampling近似ではない。共有辺・同一影・4面以上重複・分離intervalを二重加算しない。

原点移動、有限性/convexity検査、補償加算を使用。x重複判定はspan相対のroundoff（2 ULP相当、上限1e-9）に限定し、単に幅<1e-9の実slabを消さない。既存polygon/area/fraction epsilonは維持。浮動小数点全域の厳密保証ではなく、解決不能なslabや非finiteはerror。E edgesのpair比較はO(E²)、最大O(E²)slabsを各O(E+N log N)で処理する多項式構成。指数的包除原理は使用しない。

### Compatibility / presentation

- 旧head `2ccbcc89cfe475df4df5a5ec42f0c899b250deaa` の変更前ソースで90 direct cases＋3つの8760年間結果を捕捉。`scripts/validation/m7-shading/edge-checkpoint.json` SHA-256 `f7a072ec055197fed534310da4049f054dcb14b51feb833dc703b157bbb75152`を固定。除外は名称変更した`directShadingModel`文字列だけで、全数値と他のresult fieldはexact一致。capture runnerは旧HEAD＋src無変更を強制し、新実装から再生成させない。これは回帰基準であり独立physical oracleではない。
- no fins / 全出0 / P>W・端部なしはv1 exact。端部のみは上記旧head exact。solar/weather/diffuse/ground/SHGC/aggregation、M1原本/Golden、M5測定JSON、P0-B protocol/fixtureは変更しない。
- Single/MultiでON/OFF・pitch/count・3寸法を編集、invalidはRun/CSVを無効化、入力変更はstale→明示rerun。水平庇OFFで端部/中間フィンを失わない。立面は全配置位置、断面は代表側面投影1枚＋枚数。Multiは各Floor独立、表示だけfloor内clip、cross-floor物理影なし。
- schema v1 / 旧edge-only v2を保持し、新配列はv2 optional。schema v3なし。読込はfinite/layout/幅上限検証、whitelist。計算結果・raw weather・private metadata・derived positionsは保存しない。
- CSVは既存列順・意味を保持し10列を末尾追加: `中間フィンあり / 配置方式 / 指定中心ピッチ_m / 指定枚数 / 実配置枚数 / 実中心ピッチ_m / 左右端部余白_m / 中間フィン出幅_m / 中間フィン下端_m / 中間フィン上端_m`。非該当field空欄。CSV injection保護維持。
- PDFはSingle入力表/全案形状、Multi階別遮蔽入力/積層図へ寸法・layout・derived値を表示。端部と中間を区別。配列付きSingle形状は縦並び＋断面/立面2列でページ分断を回避。既存配色・print-color-adjust保持。
- 専用Single/Multiデモは幅6 m、A配列なし/B出0.6 m・P2 m/C出0.6 m・P1 mの3案。従来2案デモを残す。合成気象、実測/検証evidenceではない。優劣の自動判定なし。

### Required Fix verification

新規77 tests（geometry50 / integration・render27）、既存481 PASSを維持し**40 files / 558 PASS / 10 SKIPPED**。外部solver skipped10はNOT_RUN。解析解3.5 m²（4本の分離trapezoid）、6 m²（庇＋4本）、6.75 m²（庇＋端部＋4本）、交差edge・128同一影・mirror・grazing・large datum・invalid、Single/Multi合算、old/new preset、CSV、renderを検証。期待値を新実装から生成しない。typecheck/build/golden/audit PASS、audit 0 vulnerabilities。

既存Chrome/Playwrightのlocal実操作: 3案Demo → Case B編集 → P0/count129拒否 → pitch/count切替 → stale/rerun → 月別/階別/差分/形状 → 実CSV download → JSON download/再読込/置換確認/再計算 → 390px → print。Single W6/P1.5は4本、Multi各階P2/P1.5/P1は3+4+6=13本。localhost HTTP200、fatal/console/asset error0、document横overflowなし。Single 7頁 / Multi 9頁をPopplerで全頁目視（配列による狭い列の分断を修正）。native OS chooser/print dialog・新head Human acceptance・remote download確認とは区別する。

旧head `2ccbcc89...` のExact Preview HTTP/assets・Single CSV/PDF・Multi CSV/PDFは**Human-reported PASS**（Required Fix Task Packet）。履歴として保持するが後続headの証拠へ流用しない。配列実装headの認証HTTP/downloadは当時Agent経路で取得不能でUNVERIFIEDだったが、下記の新しいHuman exact Preview証拠により解消済み。過去のAgent測定結果をPASSへ改変せず、bypassも行わない。

### Array workload

`array-workload.mjs`、2026-09-15T14:14:29.668Z、Node24.15.0 / Core Ultra9 285K。同一synthetic8760、6 m開口と同じ庇条件、warmup1＋5計測、setup/hash除外。全9構成で5反復digest一致（public-safe runner、raw出力はignored `.local-validation/m7-array/`）。dense probeだけ12 m/P0.3 m=40枚。

| Array arm | 1 Case × 1 Floor median [ms] | 4 Cases × 5 Floors median [ms] |
| --- | ---: | ---: |
| no fins | 13.54 | 327.33 |
| jamb only | 29.68 | 592.07 |
| W6/P1.5 (4) | 64.11 | 1303.25 |
| W6/P0.6 (10) | 113.14 | 2403.94 |
| W12/P0.3 (40) | 489.08 | 未測定 |

これは当該local環境の実測でSLAではない。測定範囲で明白な指数的explosionなし。128枚×多数Floor/sub-hour・低速端末の対話性能は未保証、main-thread同期実行は数秒待たせ得る。上限128は任意組合せの性能保証ではない。外部solver validationとは無関係。

再実行: 上記convergence一式、`node scripts/validation/m7-shading/array-workload.mjs`、dev server起動後`node scripts/validation/m7-shading/array-browser.mjs`。既存Playwright/Chromeを`OPS_PLAYWRIGHT_MODULE` / `OPS_CHROME_EXECUTABLE`で指定可、追加installなし。生成物はlocal-only、Task Packet/原本/外部気象は変更しない。

## Human acceptance / Independent Re-Review

2026-09-16 Human提供の受入・再レビュー結果（Agentによる新規HTTP測定や保存ファイル再検証ではない）:

- Accepted product head: `41302270ca4a84501f824ddef9f62194cad95b8e`。
- Exact Preview: `dpl_J2eGvNgJaqqeRQP4dQzRfsox3uVk` / [Preview URL](https://facade-solar-kd7fnzggp-airesearchagls-projects.vercel.app/)。Git / `feat/m7-advanced-facade-shading` / accepted product SHA、Preview (`target=null`) / READY。
- Independent FULL Re-Review: **A. PASS**。Required Fix: **CLOSED**。Human exact Preview acceptance: **PASS**。
- Human HTTP evidence: `/`、`/assets/index-D49WKT7i.js`、`/assets/index-B6EFbBDS.css`、`/favicon.svg`は各**200**。
- Human saved-file acceptance: **Single CSV / Single PDF / Multi CSV / Multi PDFすべてPASS**。
- Single B: 中心ピッチ2 m / 実配置3枚 / 左右余白1.0 m。Single C: 中心ピッチ1 m / 実配置6枚 / 左右余白0.5 m。
- Multi B: 各階中心ピッチ2 m / 実配置3枚。Multi C: 各階中心ピッチ1 m / 実配置6枚。PDFの反復フィン立面・中間フィン入力要約PASS、CSV/PDF値は相互整合。
- **PRE-MERGE GATE: PASS**（merge前履歴）。M7 post-merge Production confirmationは下記closeoutでPASS。
- 今回の同期はdocs-only。product / engine / tests / runner / expected / Golden差分0をaccepted product headから確認し、同期後のlive HEADはGit/PRとPR本文で別記する。この受入証拠を新しいdocs-only deploymentのHTTP再測定・Human保存ファイル再確認とは称さない。自己参照SHA commit cycleを作らない。

## Post-merge Production closeout

`2026-09-16T03:35+09:00`にM8 Phase 0としてread-only確認。

- GitHub PR #12: merged、squash commitとmainは`642136058d538e89d29971b0a586f86ea3aaa926`で一致。
- Vercel `dpl_DyRqKwmhrdHo8gQNqw9pqqmyAR7v`: source Git、branch main、exact SHA、target production、READY、Current。canonical `facade-solar-lab.vercel.app`割当一致。
- HTTP `/`、`/favicon.svg`、build JS/CSS: 200 / MIME PASS / non-empty。
- canonical browser: Single/Multi fin pitch demo、Floor selection、pitch edit、stale、rerun、finite results、repeated fin geometry、Building Total、390px PASS。app-origin fatal/console error 0、asset 404 = 0。
- CSV/PDFの再Human acceptanceは要求せず、manual Production mutationなし。詳細は[M8 Guide contractのPhase 0記録](USER_GUIDE.md#m7-post-merge-closure-used-by-m8)。

## Review gate

M5: LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING。Radiance / EnergyPlus / SPA / annual physical validation: NOT_RUN。M7 geometryは旧P0-B checkpointで外部検証済みと扱わない。

PR #12はsquash merge済みでM7はCOMPLETE。M8 — User Guide & Technical Manualは別Human Task Packetにより開始され、[M8 contract](USER_GUIDE.md)のIMPLEMENTATION_COMPLETE / HUMAN_UX_REVIEW_PENDING / INDEPENDENT_FULL_REVIEW_PENDINGへ進んだ。M5 external referencesはNOT_RUNのまま。

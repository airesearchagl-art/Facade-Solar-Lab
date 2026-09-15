# M7 — Advanced Facade Shading

Current state: IMPLEMENTATION_COMPLETE / INDEPENDENT_REVIEW_PENDING。M6はPR #11のpost-merge Phase 0 PASSによりCOMPLETE（[証拠](VERCEL_OPERATION.md#m6-post-merge-closure--phase-0)）。開始main: `f3cd83962e462f3e28ed20373d3ad58ede5e835e`。branch: `feat/m7-advanced-facade-shading`。live HEADはGit/PRで解決し、exact Git PreviewのHTTP/browser確認はPR本文の実測状態を参照する。localのPASSをremote PASSへ置き換えない。

## Contract

- facade-local: wall `y=0`、外部正面視で右が`+x`、外側`+y`、上`+z`。SI [m]、方位は北0°時計回り。標準right-handed xyzを意味しない。
- 水平庇は既存contractのまま。左finは開口左端、右finは右端の定数x面に固定。面は`y=0..depthM`、`z=bottomZM..topZM`の有限矩形。
- `leftFin?` / `rightFin?`がabsentなら無効。存在時は各値finite、depth>=0、top>bottom。depth=0は遮蔽なし。高さは明示値、既定値は開口sill/head。Multiでは当該Floorのlocal z。
- 新しいdirect geometryは`facade-v2`。最大3影を壁へ投影、開口へclipし、convex intersectionと包除原理でunion areaを求める。重複は二重加算しない。
- finsなしは既存`facade-v1-weather`を継続。v2はdirectだけ拡張し、solar/weather/SHGC/期間・月別集計を共有する。`withOverhang`という互換出力fieldはv2では庇＋有効finの複合遮蔽を表す。
- diffuseは従来の庇のみ2D infinite-width近似。fin diffuse/finite-width diffuseの物理validationなし。ground modelは変更なし。cross-floor physical shading未実装。
- 表示値は窓からの日射熱取得量。HVAC負荷、BEI、空調容量、消費エネルギー、認証solver結果ではない。

## Implementation / compatibility

- Projection: 各surfaceの点 `(x,y,z)` を `(x-y*sx/sy, z-y*sz/sy)` へ投影。開口center x / sill zを原点とした小さい座標系でclip・unionを計算し、大きい絶対datumでの桁落ちを抑える。外部に返すv2の`surfaceShadows[].polygon`はこのlocal frameである。互換のsingular `shadowPolygon` / `clippedShadowPolygon`は庇だけのworld座標で、union輪郭ではない。
- Union: clipped convex shadowsの面積和 − 全pair intersection + triple intersection。epsilonを超える面積範囲逸脱・非finite・overflowはerror。v1と同じ`1e-9`長さ/面積解像度とfraction境界snapだけを許可し、無条件clampしない。
- `simulateFacadeV1()`の公開挙動を保持。`simulateFacade()`はfins有効性をvalidateし、無効/出0ならv1へdispatch。有効ならv2。月別/期間 traversalとsolar/LST/SHGC/地面反射/20-strip diffuseを共有する。
- Presets: v1はfins absentとして継続。v2はrootに`schemaVersion: 2, geometryVersion: "facade-v2"`必須。存在するfinは3つの有限numberだけをwhitelist。v1にfinを混入した入力は明示error。庇のみwriterはv1を維持し、フィン情報（出0も含む）がある場合はv2を選択する。旧アプリはv2を拒否するので黙って異なる形状を計算しない。weather/result/private metadataは保存しない。
- CSVは従来column順序を保持して左右fin8項目を末尾追加。Singleの既存`庇あり`columnはv2では「庇＋有効フィン」、`庇なし`は遮蔽物なしを表し、注記を出力。CSV式injection対策を維持。
- Multiのfloor-local ray clippingとfloor compositionは不変。フィンの画面表示だけfloor境界で区切り、計算入力を書き換えない。Single断面のフィン網掛けは側面投影であり中央切断面ではない。参考太陽線は従来の庇先端基準。

## Local validation evidence

既存420 PASS / 10 SKIPPEDを保持。新規61 tests（geometry 38 / integration 17 / render 6）を追加し、合計481 PASS / 10 SKIPPED（38 files）。外部solverの10 skippedをPASSへ加算しない。

- 解析面積: sx/sy=-1、sz/sy=1、開口2×2 m、左fin D=1 m / z=0..2 mでは`∫(2-t)dt=1.5 m²`、fraction=0.375。十分な左右張出の庇D=1では2 m²、重複0.5 m²、union3 m² / fraction0.75。new implementationの出力から期待値を作らない。
- no fins / zero depth、左右mirror、庇＋左右fin、double/triple overlap、full/no shade、grazing/low altitude、方位回転、非対称、高さ/center datum 1e6〜1e12、浅い/深いfin、invalid/overflow: PASS。
- v1 no-fin machine-exact monthly/period/output、diffuse/ground不変、Single/one-floor exact等価、複数階単純合算、preset v1 migration / v2 round trip / malformed rejection / whitelist、CSV injection、floor表示clipping: PASS。
- Browserは既存Playwright/Chromeでsynthetic Demo → Single/Multi Case Bフィン編集 → stale → Run/rerun → 月別/階別/入力差/形状 → CSV/print。2026-09-15T12:42:38.860Zの再実行PASS。localhost HTTP200、fatal/console0、asset errors0、390px document overflowなし。PDFはChrome print engineで生成し、Single 5 / Multi 7 pagesをPopplerでレンダリング確認。ラベル近接と見出し折返しを調整後に再確認済み。native OS print dialogやreal EPWのHuman再acceptanceとは称さない。
- 負荷: `scripts/validation/m7-shading/workload.mjs`。M5 syntheticYear/independentCaseを再利用し、各floorに庇を設定。同条件でv1 vs 庇＋両fin、8760 intervals、warmup1＋5反復。初回重複projectionを解消後、medianは1案1階 v1 12.55 ms / v2 27.10 ms、4案5階 v1 252.12 ms / v2 558.50 ms（約2.2倍、当該local CPUのみ）。5反復の結果digestは不変。増分は直達影projection/unionの追加workで、v1計算式の劣化ではない。M5保存済み測定JSONは変更しない。絶対的な性能SLA・旧P0-B外部validationの証拠ではない。

再実行: `npm test` / `npm run typecheck` / `npm run build` / `npm run golden:check` / `npm audit` / `git diff --check` / `git diff --check origin/main...HEAD`。測定runnerは上記scripts。生成物はignored `.local-validation/m7-shading/`のみ、実気象や機微情報をcommitしない。exact final-head checksとGit PreviewはPR本文で同期し、自己参照SHA commit cycleを作らない。

## Review gate

M5: LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING。Radiance / EnergyPlus / SPA / annual physical validation: NOT_RUN。M7 geometryは旧P0-B checkpointで外部検証済みと扱わない。

M7完了後はDraft PR / Independent Review待ち。Ready、merge、main直接変更、手動Production操作、次milestone開始は禁止。

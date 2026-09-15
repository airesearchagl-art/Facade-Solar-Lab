# M7 — Advanced Facade Shading

Current state: ACTIVE。M6はPR #11のpost-merge Phase 0 PASSによりCOMPLETE（[証拠](VERCEL_OPERATION.md#m6-post-merge-closure--phase-0)）。開始main: `f3cd83962e462f3e28ed20373d3ad58ede5e835e`。branch: `feat/m7-advanced-facade-shading`。live HEADはGit/PRで解決する。

## Contract

- facade-local: wall `y=0`、外部正面視で右が`+x`、外側`+y`、上`+z`。SI [m]、方位は北0°時計回り。標準right-handed xyzを意味しない。
- 水平庇は既存contractのまま。左finは開口左端、右finは右端の定数x面に固定。面は`y=0..depthM`、`z=bottomZM..topZM`の有限矩形。
- `leftFin?` / `rightFin?`がabsentなら無効。存在時は各値finite、depth>=0、top>bottom。depth=0は遮蔽なし。高さは明示値、既定値は開口sill/head。Multiでは当該Floorのlocal z。
- 新しいdirect geometryは`facade-v2`。最大3影を壁へ投影、開口へclipし、convex intersectionと包除原理でunion areaを求める。重複は二重加算しない。
- finsなしは既存`facade-v1-weather`を継続。v2はdirectだけ拡張し、solar/weather/SHGC/期間・月別集計を共有する。`withOverhang`という互換出力fieldはv2では庇＋有効finの複合遮蔽を表す。
- diffuseは従来の庇のみ2D infinite-width近似。fin diffuse/finite-width diffuseの物理validationなし。ground modelは変更なし。cross-floor physical shading未実装。
- 表示値は窓からの日射熱取得量。HVAC負荷、BEI、空調容量、消費エネルギー、認証solver結果ではない。

## Gates

M5: LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING。Radiance / EnergyPlus / SPA / annual physical validation: NOT_RUN。M7 geometryは旧P0-B checkpointで外部検証済みと扱わない。

M7完了後はDraft PR / Independent Review待ち。Ready、merge、main直接変更、手動Production操作、次milestone開始は禁止。

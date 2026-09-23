# M10 — Multi-floor Parametric Explorer

## Current state / resume

M10 `COMPLETE`。PR #15はsquash merge済み、main `56a0f19eb4103c5231f09ec1c79dcfe2f782d783` / Git Production `dpl_FLzFM4fpWcXr2NSZmCe71ez4dwY3` READY。M11 Phase 0のprovenance・canonical HTTP/assets/両Explorer Worker確認は[こちら](WEATHER_SCENARIO_MATRIX.md#m10-post-merge-fresh-closeout)。M10残作業なし、再closeout cycleは作成しません。以下のpre-merge状態はhistorical / supersededで、M11開始禁止やReady/merge待ちをcurrent指示として実行しないこと。

### Historical pre-merge handoff

`IMPLEMENTATION_COMPLETE / RF-M10-REVIEW-01_RESOLVED / FOCUSED_INDEPENDENT_RE_REVIEW_PASS / HUMAN_UX_REVIEW_PASS / PRE_MERGE_GATE_PASS`（Human報告）。Required Fix: NONE OPEN。
Branch: `feat/m10-multifloor-parametric-explorer`。Base: `9d2efd6c3db0afcc45c6bbfc5cb19f78e0464099`。
PR #15 OPEN / Draft。live HEAD / exact Git PreviewはGitとPR本文からfreshに解決し、下記reviewed checkpointsと区別します。このファイルを含むcommit SHAを自己参照固定しません。既存PRを再作成しないこと。次はReady transition authorization待ち。merge / post-merge Production確認はpending。Ready / merge / manual Production / branch deletionは未許可。M11 NOT STARTED。

## M9 closeout — Phase 0

2026-09-16、実装前のread-only確認:

- fresh origin/main = `9d2efd6c3db0afcc45c6bbfc5cb19f78e0464099`、PR #14 MERGED、mergeCommit一致。開始working tree clean。
- PR #14のterminal handoff headは`f48010e611154592f02ff94ea71cc8c0258d10c7`。Human-accepted product headと混同しません。
- `ops:verify` checkedAt `2026-09-16T05:24:03.613Z`: `dpl_3LkxDP1izwbW5GRzQrCdPV7Es8wN`、production / READY / source git / ref main / exact SHA、project/config/canonical alias gate PASS。
- canonical `/`、`/assets/index-DNEcIJfS.js`、`/assets/index-C1cDZaHq.css`、`/favicon.svg`: HTTP200 / MIME / non-empty PASS。
- 実JS参照の`/assets/explorer.worker-CpgwTXTZ.js`: HTTP200 / 31,168 bytes。
- M9 accepted Human UX / Independent Reviewは再実施不要。今回新しいM9 saved-file/browser acceptanceを主張しません。manual Production mutationなし。M9 COMPLETE。

## Architecture / scopes

- `src/explorer/multi-sweep.ts`: Pure TS scope/shape validation、M9 range reuse、candidate generation。
- `multi-study.ts`: existing `runMultiFloorComparison()`をbaselineと各candidateへそのまま呼ぶ。各Floor `simulateFacade()`、Building Totalは既存simple sum。新engine/physicsなし。
- `multi-protocol.ts` / `multi-explorer.worker.ts`: browser-local module Worker。M9と共通の`RunClient`で1 run / 1 Worker、progress、terminate、generation/identityによるold-run拒否。error時のmain-thread fallbackなし。
- `MultiParametricExplorer` / `MultiParametricResults`: input、building chart projection、Floor Breakdown、既存GeometryPreview、Multi transfer。M9 AxisEditorと表示専用ChartStudyを共用し、BuildingをSingle engine結果と偽装しません。
- `multi-export.ts`: CSVと入力専用JSON。既存Multi case presetのv1/v2 validation/whitelistを再利用。

選択中のMulti Caseと同じweatherを使用し、別EPW入口はありません。通常比較が未実行でも探索可。

| Scope | 変更対象 | 計算対象 |
| --- | --- | --- |
| 選択階のみ | 現在選択中のFloorのみ。他Floor入力はexact保持 | 全Floorをcanonical routeで再計算、建物和 |
| 全階共通 | 全Floorへ同じA/B値 | 全Floorと建物和 |

**既存Multi modelの境界:** 方位角と地面反射率は建物共通fieldです。この2軸は全階scopeのみ（UI option disabled / pure validationも拒否）。選択scopeから黙って他階を変えず、per-floor overrideや既存Multi schema/physicsを追加しません。他13軸は選択階でも使用可能。独立floor-by-floor組合せ、自動最適化、score、Best/Winner、ランキングなし。

## Axes / recommendations / INVALID

M9の15軸metadata、`recommendedSweepAxis`、小数6桁の整数格子、duplicate拒否、最大64を再利用。key変更と推奨resetはkey/min/max/stepを同時更新。手編集、source/Floor/scope変更だけでは値を上書きしません。B追加はSHGC（A=SHGCなら庇の出）で重複を防ぎます。

- 形状依存の全階推奨は各FloorのM9推奨rangeのintersection。sillは0以上、headは各階の階高・既存庇高さ以下へ制限。
- 庇高さは全affected opening head以上の最小格子値から+0.6 m、全階の最小階高以下に制限。
- 共通範囲がない／数値表現不能ならerror。値を捏造しません。推奨は探索の開始値で、2軸同時変更や全形状の成立・物理妥当性を保証しません。
- 選択scopeでは選択Floor、全階scopeでは全affected Floorにshape/layout必須。不足階名・IDを表示。自動shape追加、pitch/count変換なし。
- deterministic B-row/A-column ID `multi-candidate-B-A`、全Multi入力のowned clone、affected IDsを保持。
- source/definition不正はrun前に拒否。候補の一階が不成立なら建物候補全体INVALID、階名/ID/reasonを残し次候補へ進む。値は空欄／計算値なしであり0ではない。
- sill変更は元headを固定しheightを導出、head変更は元sillを固定。未変更fieldを不要にround-trip変換しません。

## Snapshot / results / transfer

snapshotにはweather ID/provenance/coverage/count、source建物と全Floor exact inputs、selected ID、scope、A/B、timestamp、generation version、Floorごとのmodel IDs。完了したowned graphをfreezeし、caller weather/provenanceを凍結しません。

weather object/source/Floor追加削除順序/選択階/scope/sweep変更でsticky STALE。影響外Floorの変更も建物結果を変えるためinvalidateします。入力を元へ戻しただけではcurrent復帰せず、明示rerun必須。cancelは未完了studyを採用せず、前回結果をSTALE保持。CSV/print/transfer無効。

Buildingの合計/夏期/冬期と元建物差、全Floorの同3期間とそのFloorの元入力差を表示。Building Totalはcanonical Floor和、差分は候補−baseline。partialは「読込期間合計／夏期の読込分／冬期の読込分」で年間換算なし。浮動小数の加算順によるdelta末尾差を隠す補正はしません。

1D line + baseline reference + exact table、2D Heatmap + Building夏期差×冬期差Trade-off（baseline0/0）。候補選択でFloor contribution table、全入力、モデル/fin導出、形状を確認。selected scopeの形状は対象階、all scopeは候補Floor selector。

「複数階比較案に追加」は全Floor入力を新IDへexact clone。最大4案、上書き/自動削除なし。通常Multiをdirtyにし、明示rerunを要求。探索source選択を勝手に変えません。

## Export / privacy / Guide

CSV: baselineと全candidateのbuilding行＋全Floor行。weather provenance、scope/selectedID、axes/count、status/reason、A/B、入力、モデル、fin layout、期間/delta、limitations。INVALID行の数値は空欄。BOM/CRLF、quote escaping/formula guardをM9と共有。

Study JSON: kind `facade-solar-multifloor-parametric-study` / schemaVersion1、nested既存Multi case preset v1/v2。source/scope/selectedFloor/sweepだけwhitelist。結果、raw weather/EPW bytes、local paths、auth/secretsを保存しません。256KiB、scope/選択階/軸/元形状を読込時再検証。選択中Multiを置換する確認後に適用し、weather準備＋明示rerun。

printは専用`explorer-print`、A4 landscape、study定義/Building charts/exact table/Floor Breakdown/選択候補形状/limitations。通常Multi reportと分離し色保持、thead反復。印刷・保存はブラウザ機能で性能証明ではありません。

Guide `#guide-multi-explorer`は2Fのみ庇探索、全階庇×SHGC、Floor和、STALE、転送/出力、非最適化/cross-floorなしを説明。外部upload、analytics、storage、deps、routerなし。既存Single/Multiのmounted state保持。

## Local validation evidence

2026-09-16、implementation-sessionのhistorical evidence（Independent Reviewではない）。当時のsaved-file / PDF未確認を後続Human受理・artifact inspectionでAgent verificationへ書き換えません。現在の受理状態は末尾のterminal acceptanceを参照:

- 45 test files / **661 PASS / 10 external-reference SKIP=NOT_RUN**。追加32 tests。M1〜M9 expected/Golden維持。
- focused 108 PASS: Multi generation/scopes/全15軸/64 cap/immutable/all-floor recommendations/不足shape/layout/階付きINVALID/canonical exact/transfer/CSV/JSON/SSR/Worker、およびM9 AxisEditor・dependency boundary回帰。
- typecheck / build / Golden / audit / diff checks PASS。build119 modules、Single WorkerとMulti Workerを別bundle、audit0 vulnerabilities。
- engine/weather/geometry/models/comparison/multifloor/legacy、既存tests/expected/Goldenの変更なし。M5外部測定・P0-B protocolも不変。
- Local Chrome、synthetic8760: 2Fのみ庇7候補（1F/3F入力・値固定）、全階庇×SHGC49候補、全Floor変更、building/floor exact tables、Heatmap/Trade-off、3F候補形状切替PASS。
- 転送→通常Multi dirty→明示rerun、4案上限、scope変更STALE/CSV・転送無効、2F庇高さ3mのINVALID理由、以降の有効候補継続PASS。
- 実64候補Worker: 3/64 runningを観測→cancel後23/64 canceled、前回完了結果をSTALE保持、CSV disabled。クリック→状態取得のautomation往復2950ms（純Worker cancel latencyではない）。最初のcancel試行は完了後でdisabledだったため、別runで再確認。
- 390px: viewport390 / document/body375、A min/max/stepとボタン、内部スクロールのchart/table、候補選択/再計算PASS。app-origin error観測0。Chrome extension自身のSentry errorはoriginを分けて記録しproduct errorに含めない。
- Local CSV/JSON download操作、Guide新章anchorと390px表示・往復state保持PASS。別途作成したlocal-only合成入力JSONをOS-backed file chooserで読み込み、確認dialog→明示適用→2F scope/source/range復元→STALE/CSV無効→3候補rerun PASS。download済みファイルの再取込を意味せず、saved-file内容確認とは区別します。file chooser surfaceの長い応答待ちがあったため、その待ち時間をアプリ性能に含めません。
- exact Git Previewと最新check/headはPR本文で同期。ブラウザ表示をHTTP200と推測しません。保存CSV/JSON/PDFのファイル確認やPDF目視を、pure export/SSR結果からPASSへ昇格しません。surfaceで確認できない部分はUNVERIFIEDとして引渡します。

## Performance checkpoint

`2026-09-16T05:44:50.274Z`、Node24.15.0 / Intel Core Ultra9 285K、synthetic8760。3/5/10階×16/36/64候補×no-fins/P2mの18study。1候補warmup/arm、各grid1回。全candidate VALID、progress0..N連続。実行中にbrowser/testが並行した構成があるため専有CPU測定ではありません。

| 階 | 候補 | no fins total / candidate median [ms] | P2m total / candidate median [ms] |
| --- | --- | --- | --- |
| 3 | 16 | 763.4 / 44.8 | 3113.5 / 181.4 |
| 3 | 36 | 1643.7 / 42.7 | 6682.6 / 181.0 |
| 3 | 64 | 3142.4 / 48.4 | 11674.7 / 177.7 |
| 5 | 16 | 1427.1 / 85.4 | 5113.1 / 300.3 |
| 5 | 36 | 3116.1 / 84.4 | 11008.6 / 297.4 |
| 5 | 64 | 5490.0 / 83.8 | 19482.6 / 299.0 |
| 10 | 16 | 2888.2 / 167.9 | 11145.0 / 615.0 |
| 10 | 36 | 5730.8 / 152.3 | 22296.6 / 598.3 |
| 10 | 64 | 10116.8 / 154.5 | 38800.8 / 596.4 |

totalはbaselineとcandidate validation/calculationを含み、Worker起動・structured clone・最後のowned freeze・UI描画は含みません。最大progress callback間隔1252.1ms（baselineを含む）。ブラウザ応答や低速端末のSLAではありません。cap64は維持。

再現: `node scripts/validation/m10-explorer/workload.mjs`。stdoutに各runとmachine-readable全結果を出力。自動的にcheckpointを上書きしません。

## Terminal acceptance / evidence attribution

2026-09-16のHuman Terminal Evidence Sync指示に基づく記録。今回Agentが独立レビュー・Human UX・保存artifact検査を再実施したという意味ではありません。

- Independent FULL Review: B. REQUIRED FIX、original reviewed product head `418c693ceb21e85ece6b1afc2032efb126d41293`。RF-M10-REVIEW-01 / P2はREADME Development statusのstale記述。
- RF-M10-REVIEW-01: RESOLVED。Fix / focused reviewed head `6a5d305e04a24397612bc623ed75f90b51c2cabe`、Focused Independent Re-Review PASS（Human報告）。reviewed deltaはREADME.mdの1段落のみ、product behavioral diff=0。Required Fix: NONE OPEN。
- Human UX Review: PASS。以下5点に加え、保存CSVの使いやすさ・内容、保存JSONの使いやすさ、print/PDF目視をHumanが受理。

Human受理済みの5点（Agentによる新規Human acceptanceではない）:

1. Multiから探索を自然に発見できるか。
2. 選択階のみ／全階共通の対象がすぐ分かるか。
3. Building TotalとFloor Breakdownの関係が明瞭か。
4. 候補を通常Multi比較案へ戻す流れが自然か。
5. 390pxでも主要操作が可能か。

- 実装セッション外のartifact inspection（Human提供報告）: CSVはUTF-8 BOM / CRLF / 31 columns、metadata candidateCount=42、baselineを含む43 building rows + 129 Floor rows = 172 data rows、structurally parseable。
- 同PDF inspection: Building Total、Heatmap / Trade-off、Floor Breakdown、candidate geometry、complete inputs、limitationsの存在を確認。
- **Advisory only:** 提供PDFはportrait A4ページ上で内容が90°回転し、末尾空白ページあり。HumanがUXを明示受理しているため非blockingの将来print/PDF polishであり、Required Fixを再openしません。今回PDF実装修正なし。
- 保存JSON artifactはreviewerへ独立提供されていません。JSON受理はHuman-attributedであり、Independent saved-file verificationとは呼びません。
- 実装セッションの661 PASS / 10 external-reference SKIP、local/Preview操作、performance記録は当時の帰属を保持。独立review結果やartifact inspectionと混同しません。別の独立test/performance再実行結果を捏造しません。
- 記録済みGit Preview `dpl_AzopJkr4KS2Px29igG2TcrjFFp2T` / source `418c693ceb21e85ece6b1afc2032efb126d41293` / READYはproduct checkpoint。docs-only terminal headの新deploymentや新HTTP測定へ読み替えません。匿名Preview HTTPはProtectionによる302、HTTP/assets証拠はUNVERIFIED / BLOCKEDのままです。Human受理の集約状態PRE_MERGE_GATE_PASSを匿名HTTP200や全測定項目PASSと同一視しません。
- 今回はdocs-only terminal sync。accepted fix headからsrc/app / src/explorer / engine / weather / geometry / multifloor calculation / tests / Golden・validation runner behavioral diff=0をGitで確認し、terminal headとfresh checksはPR本文へ記録します。
- PRE_MERGE_GATE_PASS（Human報告）。PR #15 OPEN / Draft、Ready承認待ち、merge / post-merge Production確認PENDING。PDF Advisoryを保持し、Ready・mergeを自動実行しません。

M5 `LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING`、Radiance / EnergyPlus / SPA / annual physical comparison NOT_RUN、formal absolute-kWh validation NOT COMPLETE。finite-width diffuse/fin diffuse/cross-floor physical shading未実装。既存の近似モデルを維持。M11 NOT STARTED。STOP — Ready transition authorization待ち。

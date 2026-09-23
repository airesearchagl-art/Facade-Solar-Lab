# M11 — Climate / Weather Scenario Matrix

## Current state / resume

`IMPLEMENTATION_COMPLETE / HUMAN_UX_REVIEW_PENDING / INDEPENDENT_FULL_REVIEW_PENDING`。
Branch: `feat/m11-climate-weather-scenario-matrix`。Base: `56a0f19eb4103c5231f09ec1c79dcfe2f782d783`。
Live HEAD / exact Git PreviewはGitとDraft PR本文からfreshに取得し、以下の測定時点と区別します。自身のcommit SHAを文書へ固定しません。既存PRがあれば再作成せず、Human UX / Independent FULL Reviewへ渡します。Ready / merge / auto-merge / manual Production / branch deletionは禁止。M12 NOT STARTED。

## M10 post-merge fresh closeout

2026-09-23 JST、read-only確認:

- fresh origin/main `56a0f19eb4103c5231f09ec1c79dcfe2f782d783`。PR #15 MERGED、terminal head `529dcc1ad1510e11f8048d9cac6240fa4494c218`、squash merge commit一致。開始working tree clean。
- `ops:verify` checkedAt `2026-09-22T23:36:15.641Z`: `dpl_FLzFM4fpWcXr2NSZmCe71ez4dwY3` / production / READY / source git / ref main / exact SHA。project/config/canonical alias PASS、手動Production操作なし。
- canonical `/`、`/assets/index-C30Gd-r5.js`、`/assets/index-B_TGfzU3.css`、`/favicon.svg` HTTP200 / MIME / nonempty PASS。
- 実JS参照の`/assets/explorer.worker-CpgwTXTZ.js` / `multi-explorer.worker-CFqejQ3O.js`もHTTP200（31,168 / 38,539 bytes）。
- M10 Independent/Human Reviewは再実施せず、過去の証拠帰属を維持。M10 COMPLETE、追加closeout cycle不要。M10 PDF回転／末尾空白ページAdvisoryは未解消・非blockingのまま。

## Architecture / canonical routes

- `src/scenario/`: Pure TS identity / coverage / definitions / canonical composition / snapshot / protocol / CSV / input-only preset。
- `WeatherScenarioPanel`: Single / Multiそれぞれの既存Workspaceに配置する共通panel。設計案・baseline・順序は親Workspaceをlive参照し、別state storeへ複製しません。Slot 1も親の現在気象。Slot 2〜4だけpanelに保持します。
- Single: `simulateFacade(dataset, case.parameters)`をexact reuse。有効フィンなしはv1、ありはv2。既存case validationをreuse。
- Multi: 各weather×buildingを、1案の`runMultiFloorComparison()`としてisolated実行。これにより無効baselineが別の有効buildingを止めません。有効baselineがある場合は既存`calculateMultiFloorDelta()`でcanonical building deltaも同期し、通常Multiのcase result全体とexact一致。baseline INVALID時はisolated building内の自己baseline deltaを比較に使わず、studyのDesign Δが明示INVALIDです。
- Floor Design Δは既存story comparison同様、下階からの位置対応（IDや名前で合わせない）。baselineに対応階がない場合はそのdeltaだけINVALID。Weather Δは同一designの同位置階。
- engine / weather parser / geometry / existing Multi aggregation / existing preset / M5 protocol / Goldenには変更なし。parametric候補との直積・ランキング・Best/Winner・新物理なし。

## Weather identity / coverage contract

最大4 weather × 4 design = 16。0件・超過・空/重複slotまたはdesign ID・基準/参照不在・unusable weather・重複contentをrun前reject。canonical geometry errorはセルINVALID（reason、数値なし）として継続します。

`weather-v1-*`: canonical location数値、sourceType、coverage/resolution、全区間のsource年月日時分・midpoint・duration・GHI/DNI/DHIをstreamingでhash。ファイル名／dataset IDだけでは同一性を決めません。radiation等の実際の計算入力が異なればidentityも変わります。既存source SHA-256がある場合はdescriptorのprovenanceに保持します。hashはdependencyなしの2×32-bit deterministic pairで**暗号学的証明ではありません**。raw EPW全体をJSON化しません。

`slots-v1-*`: 月・日・raw hour/minute・durationの**順序全体**とresolution/count。source year自体は比較キーから除外します。

| Coverage | Weather Δ |
| --- | --- |
| full-year同士、同じlocal slot sequence/resolution | COMPARABLE_FULL_YEAR |
| partial同士、同じlocal slot sequence/resolution | COMPARABLE_PARTIAL |
| 異なるpartial / full vs partial / 8760 vs 8784 / hourly vs sub-hour | NOT_COMPARABLE、数値なし |

同じ8760 slotsなら異なるsource年・地点でも比較可。違う期間を補間・scale・annualizeしません。Design Δは同じweather内なので期間不一致の他weatherに影響されません。partialは`weatherPeriodLabels()`の読込期間表記、通年性能とは呼びません。

## Results / snapshot / lifecycle

- Matrixは設計行×気象列、9指標（3期間の値／Design Δ／Weather Δ）。基準設計と参照気象を常時明示。
- Grouped bar chart + heatmap + full precision exact table。色だけでなく設計名・符号・値を併記、winnerなし。Multi selected cellはBuilding Total＋Floor表・model identities。
- Snapshotはmode、完全Workspace inputs/order/baseline、slot label/descriptors/provenance/coverage/count/fingerprints、reference、generation version、実行日時、model identities。raw EPW/interval arraysは複製しません。result全体をowned clone後freezeし、callerをfreeze/mutateしません。
- current weather / extra slot追加・置換・削除・順序・label、完全設計・基準・参照、Single/Multi source切替でsticky STALE。元の入力に戻しても明示rerunが必要。Guide往復はWorkspaceを保持。STALE中のCSV / JSON / printは無効、旧resultは参考snapshotのみ。
- module Worker + 既存generic RunClient。0..N progress（cell status含む）、完了時のみ採用。cancelはterminate、generation/worker identityでold messageを拒否。main-thread fallbackなし。

## Export / privacy

- CSV: 既存escape/formula guard、UTF-8 BOM、CRLF、metadata / provenance / compatibility / cell reason / exact period values / 両delta / models。Multiは全Floor行。INVALID / NOT_COMPARABLEはstatusと空欄数値を分離。
- JSON: schemaVersion 1、既存Single/Multi workspace presetを内包。input-only、labels/descriptors/expected fingerprints/reference/display metric。既存preset validators再利用、max256KiB、raw/intervals/results/path/token/fileHandle等をreject。
- importは確認dialog。全weatherがUNRESOLVEDで復元され、対応EPWのfingerprint一致時のみbind。Slot 1は現在Workspace weatherを明示照合することも可。不一致ファイルを無確認で置換しません。
- print: A4 landscapeのnamed page、contentの90°transformなし。snapshot定義・weather cards・matrix/chart/exact table・selected detail/Floors・限界を出力。M10 PDF Advisoryの解消は未主張、保存PDFのHuman確認が必要。
- raw EPWはbrowser memoryのみ。外部送信、analytics、cloud/localStorage persistence、local path/FileHandle保存、外部weather API、auth/token追加はありません。local synthetic EPW fixturesはignored `.local-validation/` にのみ生成し、raw EPWはcommitしません。

## Local validation evidence

2026-09-23 JST、実装セッションの証拠（Independent Reviewではありません）:

- `npm test`: 46 files / 693 PASS / 10 external-reference SKIP。追加32 tests: limits/order/identity/coverage/ownership/stale keys、Single canonical simulation exact、Multi total/floors/direct per-floor exact、両delta、INVALID継続、CSV、input JSON、SSR、Worker progress/error/cancel/old-run rejection。既存expected値は変更なし。
- `typecheck` / `build` / `golden:check` / `audit` / diff checks PASS、audit vulnerabilities 0。final exact-head再実行はPR本文にも記録。
- M1 originals SHA-256: HTML `EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5`、HANDOVER `B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4` 一致。
- React quality check: shared wrapper、parent-owned input、memoized identity inputs、Worker lifecycle cleanup、keyed slots、keyboard native controls、status/progress ARIA、focus-visible、reduced motion、no new dependency。StrictMode updater内のID採番副作用を除去しました。

### Browser evidence and explicit unverified items

Local Chrome、実filechooserからrepository生成の明示synthetic EPW（NOT MEASURED）を選択:

- Single demo＋2追加EPW、2案×3気象、matrix・Design Δ／Weather Δ・grouped chart・exact table PASS。
- partial（24区間）へreplace→STALE/export無効→rerun→Weather Δ NOT_COMPARABLE、Design Δは有効 PASS。
- reference変更・baseline変更・removeでSTALE、referenceを元へ戻してもSTALE維持 PASS。
- input JSON確認dialog→全slot UNRESOLVED、異なるfingerprint拒否、current weather明示bind＋2 EPW再選択→rerun PASS。fixture JSONを使用しており、browser保存JSONの再読込を確認したとは主張しません。
- Multi通常demo 3階×2案×3気象、Building Total / Floor Breakdown PASS。フィンdemo 3案×3気象もrerun完了。design edit→STALE PASS。
- 390px viewport、document clientWidth/scrollWidthとも375、ページ横はみ出しなし。matrix自身の横scroll・値・操作を目視確認。
- app-origin console fatal/runtime errors 0（観測した範囲）。Chrome extension-origin errorsは別。匿名HTTP statusはbrowser表示から推測しません。
- CSV button経路を実行したがdownload eventが返らず、保存ファイル受理はUNVERIFIED。JSON保存ファイルとnative print/PDF、Multi390px／Guide実操作、負荷下の実browser cancelは未完了。Worker cancel/generationはunit PASS、短いbrowser runは取消前に完了したためcancel PASSとは扱いません。
- 続く10階負荷presetのbrowser操作は、Chromeが他extension UIを検出しautomationを停止。設定変更／無効化／bypassは行わず、HumanにUIを閉じるよう依頼。残りbrowser確認を捏造しません。

### Performance (synthetic local, not SLA)

`node scripts/validation/m11-scenario/workload.mjs`。Node 24.15.0 / Intel Core Ultra 9 285K、全8760区間、4設計×4気象=16、各条件1 run。totalはvalidation/identity/owned clone/freezeを含む、Worker setup/clone/UIを除く。progress 0..16、全セルVALID。

| Mode / Floors | Fins | Total ms | Combination median ms | Max progress gap ms |
| --- | --- | ---: | ---: | ---: |
| Single / 1 | none | 279.60 | 13.60 | 27.53 |
| Multi / 3 | none | 662.13 | 38.97 | 42.02 |
| Multi / 10 | none | 2301.76 | 133.54 | 164.25 |
| Single / 1 | pitch 2 m | 977.65 | 56.64 | 76.58 |
| Multi / 3 | pitch 2 m | 2781.82 | 169.83 | 186.32 |
| Multi / 10 | pitch 2 m | 9411.79 | 589.73 | 606.18 |

Measured `2026-09-22T23:51:46.931Z`、実装途中checkpointのlocal evidence。final-head provenanceとは混同しません。canonical近似・時間間引きはしていません。

## Human UX / review handoff

1. Single/Multi両方で気象シナリオpanelを発見できるか。
2. slot追加・出典・coverage・区間数・UNRESOLVEDの意味が分かるか。
3. Design Δ / Weather Δ / NOT_COMPARABLE / INVALIDが0と混同されないか。
4. matrix/chart/Multi Floor detailが設計判断に使えるか。
5. 390px・CSV/JSON保存再読込・native PDFが実用的か。PDF向き／末尾ページを確認。

M5: `LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING`。Radiance / EnergyPlus / SPA / annual physical external validation `NOT_RUN`。絶対kWh正式validation完了とは主張しません。Human UXとIndependent FULL Reviewをこの実装セッションで代行せず、DraftでSTOPします。Draft作成だけではVault/Notion等のcompletion syncを行いません（NO）。M10 canonical closeoutは本repoの上記証拠のみで同期しました。

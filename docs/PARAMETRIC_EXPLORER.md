# M9 — Parametric Design Explorer

## Current state / resume

`IMPLEMENTATION_COMPLETE / RF-M9-UX-01_RESOLVED / HUMAN_UX_REVIEW_PENDING / FOCUSED_INDEPENDENT_RE_REVIEW_PENDING`。
Branch: `feat/m9-parametric-design-explorer`。Base: M8 squash merge `d1dc91fd18ea6149424c8b192174ab0a130dcb97`。
live HEAD / Draft PR / exact Git PreviewはGitとPR本文からfreshに解決し、下記の実装・測定checkpointと区別します。Ready / merge / manual Production / branch deletionは未許可。M10 NOT STARTED。

## Product contract

Singleの選択中Caseと同じWeatherDatasetを使用します。Explorerに別のEPW入力を設けません。通常比較が未実行でも、有効な気象とCaseがあれば設定・実行できます。Multi sweep、自動最適化、ランキング、推奨案、scoreは対象外です。

- `src/explorer/`: Pure TSのrange生成、candidate、study、protocol、CSV、入力専用preset。
- `src/app/explorer.worker.ts`: Vite標準module Worker。既存`simulateFacade()`をexact reuse。
- `src/app/explorer-client.ts`: 1 run / 1 Worker。run ID、progress、completion、error、terminate。
- `ParametricExplorer` / `ExplorerCharts`: Single adapter、入力、結果、候補選択。既存GeometryPreviewを再利用。
- solar / weather / geometry / diffuse / ground / SHGC / aggregationの式・epsilon・Goldenは変更しません。Engineが既存contractでv1/v2を選びます。

## Axes and range

対応15軸: facadeAzimuthDegFromNorth、opening.widthM / sillZM / headZM、solarHeatGainCoefficient、groundReflectance、overhang.depthM / elevationZM / leftExtensionM / rightExtensionM、leftFin.depthM / rightFin.depthM、intermediateFins.depthM / layout.pitchM / layout.count。

Axis A必須、B任意・異なるkey。min / max / stepは有限、小数6桁以内、safe integerへ1,000,000倍で表現可能、step > 0、max ≥ min。count軸は全て整数です。`decimal-grid-v1`は整数スケールで`min + index × step ≤ max`を生成し、繰返し浮動小数加算を避けます。格子上にないmaxを追加・入力値を表示丸めで置換しません。

候補数は`(floor((max-min)/step)+1)`の軸積。1D/2Dとも**最大64**を実行前に表示・拒否し、切捨てません。shapeがなければ元Caseで有効化する案内を出し、暗黙追加しません。pitch/countは元Caseの配置方式を先に一致させます。

候補IDはB行→A列順の`candidate-{B index+1}-{A index+1}`。各候補はexact full parametersの独立deep cloneです。元Caseの入力不正・範囲不正はstudy全体を拒否。範囲内の形状不成立、SHGC不正、128枚超などはcandidate単位の`INVALID + reason`で残し、0には変換しません。

## RF-M9-UX-01 — axis-aware starter ranges

旧head `4891c20e230862bc845e3a01c36192c91d20e3e2` のIndependent FULL ReviewはA. PASS（Human報告）。その後のHuman UX指摘「軸変更で旧単位の範囲を保持」は今回RESOLVED。修正後headはGit/PRから解決し、Human UX / Focused Independent Re-Reviewは未実施です。

`src/explorer/sweep.ts` のAXESにlabel / unit / recommendationを集約し、`recommendedSweepAxis(source, key)`をA/Bで共用します。パラメータ変更時にkey/min/max/stepを同時置換。「推奨値に戻す」でも現在のCaseを基に再生成します。通常の手入力、他方のrange編集、Case変更では範囲を上書きせず、既存STALE / 明示rerunを維持します。

| 軸 | min → max / step | 単位 |
| --- | --- | --- |
| 方位 | 0 → 315 / 45 | ° |
| SHGC | 0.2 → 0.8 / 0.1 | - |
| 地面反射率 | 0 → 0.6 / 0.1 | - |
| 庇の出 | 0.8 → 2 / 0.2 | m |
| 庇の左右延長 | 0 → 1.5 / 0.25 | m |
| 左右端部 / 中間フィンの出 | 0 → 1.2 / 0.2 | m |
| 中間フィンpitch | 0.5 → 3 / 0.5 | m |
| 中間フィンcount | 1 → 8 / 1 | 枚 |
| 庇高さ | opening.headを小数6桁で上方量子化 → +0.6 / 0.1 | m |
| 開口幅 / 下端 / 上端 | 現値を小数6桁へ量子化して±0.6 / 0.2 | m |

幅は正値、下端のmaxは現head未満、上端のminは現sill超となるよう整数格子の境界で短縮します。通常各軸最大8値、組合せ最大64。表現不能・非有限の元形状から有効な推奨値を捏造せず、空欄と既存validation errorを維持。手入力の小数6桁規則・max64拒否は緩めません。

これらはUIの探索開始値であり形状全体の成立・物理/法的妥当性・最適性を保証しません。特にhead変更による既存庇との干渉等はcanonical validationが判定します。shapeやpitch/count方式を自動追加/変換しません。2D ON時はB=SHGC（A=SHGCなら方位）を推奨値で初期化し、相手側の選択keyは両selectでdisabled。pure duplicate validationも保持します。

検証（2026-09-16）: focused 52 PASS（追加28件）、全44 files / 629 PASS / 外部参照10 SKIP=NOT_RUN。typecheck / build / Golden / audit（0 vulnerabilities）/ diff checks PASS。既存engine・weather・geometry・comparison・multifloor・Golden・M1原本は変更なし。

Local Chrome: A 庇→方位→SHGC→庇、B SHGC→方位→pitch、候補数49→56→42、単位/値の即時切替、手入力・Case形状変更時保持、A/Bリセット、重複disabled、A=SHGCでB=方位、実行→STALE→再実行→候補追加PASS。64候補の実Workerは24/64でcancelし未完了結果を拒否。390pxでdocument幅375px、range入力各92.4px、両軸/リセット/実行操作が収まることを目視確認。観測consoleは拡張originのSentry errorのみでproduct fatal/asset404は観測なし。新exact Git Previewのprovenanceと再確認結果はPR #14本文へ記録します。HTTP status未取得を200扱いせず、Human UX acceptanceも代行したとしません。

## Snapshot / lifecycle

実行日時はUIでISO UTCを渡し、純計算側ではDateを使いません。snapshotはweather ID/provenance/coverage/interval count、source ID/name/full parameters、範囲、generation version、baseline model IDsをdeep cloneしてfreezeします。candidateのmodelVersionも各結果に保持します。engineが共有するprovenanceを凍結して元データを変更しないよう、返却graphも所有コピーしてfreezeします。

入力はWorkerにstructured cloneされます。元Case・気象object・入力・範囲が変わればSTALEを固定し、戻しただけでcurrentへ復帰させません。明示rerunが必要。STALE中は前回snapshotを表示しても、比較案追加・CSV・printは不可です。

Workerはprogress 0/N→各候補→completeを送ります。baseline計算中は0/N。Cancel / source変更 / unmount時はterminateし、queued messageもgenerationとworker identityで破棄します。未完了runは採用せず、前回完了結果がある場合はSTALEのまま残します。Worker失敗は明示errorで、main-thread一括計算へ黙ってfallbackしません。

## Reading results / transfer

- 1D: 選択指標のlineとexact table、元Caseの水平reference。範囲外baselineも値を維持。INVALID区間を線で接続しません。
- 指標: 年間・夏期・冬期の日射熱取得量と各baseline差。partialは読込期間合計 / 夏期の読込分 / 冬期の読込分。
- 2D: A列/B行のHeatmap（色の凡例＋exact cell/table）、夏期差×冬期差のTrade-off。十字はbaseline 0/0。数値の大小は自動的な優劣ではありません。
- table / line point / heatmap / scatterから同じ候補を選択。detailは全入力、KPI/delta、model、断面・立面、実フィン枚数・中心ピッチ・端部余白。M7 `deriveFinLayout()`を共用し、P>Wは実0枚。
- 「比較案に追加」はexact parametersを新しい通常Single Caseへコピー。衝突しない`explorer-case-N`、既存案を消さず最大4を拒否。Single結果はdirtyとなり明示rerun。sourceの選択は勝手に変更しません。

## Export / privacy

CSVはBOM/CRLF、baseline＋全候補、provenance/coverage、source、timestamp、generation、範囲、full input JSON、validity/reason、fin導出、modelVersion、3期間値/差分を含みます。数値は表示丸めなし。不正候補の値は空欄。text先頭のformula文字をquote-prefixで無害化します。

探索printは定義、baseline、charts、table、selected detail、model limitationsを出力。通常Single印刷と相互に分離し、色保持、反復thead、横A4の専用page、technical details展開を使用します。印刷/PDFはブラウザ機能であり正式性能証明ではありません。

任意のStudy JSON: kind `facade-solar-parametric-study` / schemaVersion 1。既存Case preset v1/v2をnested再利用して入力だけをwhitelist保存。結果、weather、EPW bytes、local path、認証情報を含めません。256 KB上限。読込時は選択Caseの入力置換を確認し、既存Single気象を用意して明示再計算。automatic upload/cloud persistence/analytics/外部font/image/iframe/secretは追加していません。

## Performance checkpoint

測定UTC `2026-09-15T23:01:23.442Z`、Node v24.15.0、Intel Core Ultra 9 285K、synthetic 8760区間。各armで1候補warmup→各grid 1回。medianはそのrun内のcandidate計算時間の中央値。totalはbaselineとvalidationを含み、Worker起動/structured clone/UI描画を含みません。一部計測中にtest/browser検証も稼働。端末依存の実測でSLAではありません。

再現: `node scripts/validation/m9-explorer/workload.mjs`。機械可読実測は[workload-checkpoint.json](../scripts/validation/m9-explorer/workload-checkpoint.json)。固定6m開口、庇の出をA、2Dは方位をB。dense armはP0.6m（10枚）。

| Grid | no fins total / median [ms] | P1.5m total / median [ms] | P0.6m total / median [ms] |
| --- | ---: | ---: | ---: |
| 8×1 | 123.4 / 13.4 | 627.0 / 68.4 | 1099.9 / 122.1 |
| 16×1 | 223.8 / 13.1 | 1180.1 / 68.6 | 2032.7 / 118.9 |
| 32×1 | 421.5 / 13.0 | 2318.3 / 69.3 | 4020.6 / 119.5 |
| 64×1 | 820.4 / 12.8 | 5097.2 / 70.6 | 7570.3 / 115.9 |
| 4×4 | 200.5 / 11.9 | 1196.2 / 70.4 | 1978.4 / 116.1 |
| 6×6 | 490.6 / 12.4 | 2645.0 / 72.0 | 4429.0 / 119.1 |
| 8×8 | 1051.3 / 16.5 | 4495.5 / 68.8 | 7901.9 / 123.3 |

全21 studyは全候補VALID、progress 0..N連続。capは変更しません。より密な128枚付近・低速端末・長大subhourではさらに時間がかかり得ます。

## Validation and review boundary

Pure/SSR tests: decimal/inclusive/invalid/duplicate/integer/64 cap、全15軸、immutable source/snapshot、1D/2D canonical exact一致、normal comparison一致、v1/v2、fin導出、INVALID保持、CSV injection、input-only preset、transfer max4、worker progress/error/cancel/stale run ID、accessible charts/table、core dependency boundary。

既存M1〜M8回帰・Golden維持。M9の同一engineとの一致はadapter regressionであり、独立physical solverとの比較ではありません。M5 external referenceはNOT_RUN、absolute-kWh正式validation未完了、fin diffuse / cross-floor shading未実装です。

Local Chrome (`2026-09-16`, synthetic 8760)ではSingle導線、weather missingでRun禁止、1D庇0.8→2.0/0.2（7候補）、2D庇×pitch（21候補）、exact table / Heatmap / Trade-off / keyboard table選択 / detail geometry、候補追加→Single dirty→明示rerun、max4拒否、範囲変更STALE / CSV・print・転送無効、INVALID非ゼロ表示を確認しました。2D候補 D1.2/P1.5は実4枚・pitch1.5・margin0.75、年間2643.4232700877274 kWh（synthetic・正式性能値ではない）です。

64候補（pitch0.1..0.8）の実Workerで20/64 runningを観測し、Cancel後45/64 canceled / CSV disabledを確認。UI観測→クリック→応答のautomation往復は2548msで、Worker単体のcancel latencyとは区別します。未完了runは採用されず、前回9候補snapshotをSTALE保持。390pxはdocument/body 375px、入力幅92.4px、1列controls、内部chart/table横scrollでdocument overflowなし。

Local export: CSV/JSONのクリックは実施したもののdownload eventをsurfaceが返さず、download管理画面はbrowser policyでアクセス不可。printクリック後のnative print UI/PDFもこのsurfaceではinspect不可。保存ファイルの目視・browser JSON再取込・PDF visual acceptanceはUNVERIFIEDで、純CSV/JSON/SSR検証と区別します。browser policyを迂回する別制御やdownload先探索は行いません。長時間local sessionではpage URLに帰属するextension messagingと思われる3件の`A listener indicated an asynchronous response...`を観測（productにextension messaging APIなし）；最終Previewのfresh console確認と分離し、当該local sessionを無条件にerror0としません。

実装セッションの最終checksとexact PreviewはPR本文へ記録します。初回実装時はHuman UX ReviewとIndependent FULL Reviewを未実施として分離しました（後続review / RF修正は上記）。通常browser limitationはUNVERIFIEDのまま扱います。

Human UX handoff（5点）:

1. Singleから探索を自然に発見できるか。
2. 1Dの範囲設定と結果が理解できるか。
3. 2D Heatmap / Trade-offを自動最適判定と誤解しないか。
4. 候補選択→通常比較へ戻す操作が自然か。
5. 390pxでも主要操作ができるか。

実装mechanism参照: [Vite Workers](https://vite.dev/guide/features#web-workers)、[Worker terminate](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate)。外部物理validationの根拠ではありません。

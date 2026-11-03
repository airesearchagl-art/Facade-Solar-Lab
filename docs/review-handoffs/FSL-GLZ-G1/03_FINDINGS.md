# Findingsと受入条件

| 独立レビュー | 判定 | 記録 |
|---|---|---|
| 初回FULL · FSL-GLZ-G1-IR-001 | REQUIRED FIX | F01は古い非同期追加が新Workspaceを変更、F02はencoded資格情報キーが保存・復元を通過 |
| R1 · FSL-GLZ-G1-IR-001R | REQUIRED FIX | Session ticketと公開直前の確認でF01 CLOSED。F02修正後に正常なliteral percentの過剰拒否を検出。RF01 OPEN |
| R2 · FSL-GLZ-G1-IR-001RR | REQUIRED FIX | 追加復号が正常な旧v1キーを不正UTF-8として拒否。3つの独立反例が残存 |
| R3 · FSL-GLZ-G1-IR-001RRR | A. PASS（Focused範囲） | Humanが決めたURL境界を満たし、F01・F02・G1-IR-001R-RF01はCLOSED。Remaining Required FixはNONE |

R3ではquery keyの検査用コピーだけを追加走査する。生URLはescape・UTF-8・制御文字を検証し、追加層では非ASCIIのliteralに隣接したASCIIも走査する。上限は初回を含めて8段。独立検証は5件の再生成v1 fixtureで出典、4指標、assembly、digest、再保存bytesの一致を確認した。

## AC01〜26

| AC | 状態 | 確認対象と帰属 |
|---|---|---|
| 01 | PASS | 1〜4案の編集操作、件数上限・削除後の選択。実装テスト・Browser証拠 |
| 02 | PASS | 複製と参照の分離。実装テスト |
| 03 | PASS | fractionと正のUg、範囲・型・非有限値の拒否。実装テスト |
| 04 | PASS | UNKNOWN・0・単位、UgとUwの区別。実装テスト・Browser証拠 |
| 05 | PASS | 指標別basis・出典・入射方向と角度。実装テスト・Browser証拠 |
| 06 | PASS | assemblyの順序・mm・gas条件の保持。実装テスト |
| 07 | PASS | canonical化・digest・Unicodeの照合。実装テスト |
| 08 | PASS | 同一ηのrevision、反射率の方向・規格変更を識別。実装テスト |
| 09 | PASS | 一致する版の明示rebind。実装・Recovery証拠 |
| 10 | PASS | 未解決復元・silent rebind防止。実装テスト |
| 11 | PASS | 入力を戻してもSTALE、snapshotの不変性。実装テスト |
| 12 | PASS | manual revisionと編集可能フィールド。実装テスト |
| 13 | PASS（独立R3 Focused範囲） | 旧v1固定fixtureと実ファイルの保存・復元 |
| 14 | PASS | kind・version・未知キーの拒否。実装テスト |
| 15 | PASS | 入力UTF-8サイズ上限256 KiB。実装テスト |
| 16 | PASS | 出力上限、出典を切り捨てない。実装・Recovery証拠 |
| 17 | PASS | import失敗・取消時の状態不変。実装テスト |
| 18 | PASS | 非同期競合・古いerror/finallyの非干渉。F01の独立closureを維持 |
| 19 | PASS | strict JSON、不正Unicode、スクリプト文字列のテキスト表示。実装証拠 |
| 20 | PASS（独立R3 Focused範囲） | URL・credential・制御文字の拒否、出典原文保持 |
| 21 | PASS（観測範囲） | 外部通信・永続化。作者のRecovery計測 |
| 22 | PASS | 比較表と390pxレイアウト。作者のBrowser計測 |
| 23 | PASS | 狭幅でのキーボード操作・focus。作者のRecovery計測 |
| 24 | BLOCKED | HISTORICAL ERROR ATTRIBUTION PENDING。過去console 3件のsource・stack・event種別が未確定 |
| 25 | PASS | 自動回帰、Golden、audit、依存。独立R3とH4の測定結果は索引参照 |
| 26 | NOT_RUN | SEPARATE M11 GATE |

作者のBrowser RecoveryではB01〜B12を12件完了。過去3件の帰属は未確定。後日の作者R3でも別のlistenerエラー3件の帰属が未確定で、拡張由来と判別できたSentry 1件は別記録。独立R3 Browserの観測時error-levelログは0件。これらの時点を分けて扱う。

Buildの主要chunkは500 kB警告あり。外部物理参照10件はSKIP。M5はEXTERNAL_REFERENCE_PENDING。[各時点の検証](02_EVIDENCE_INDEX.md)

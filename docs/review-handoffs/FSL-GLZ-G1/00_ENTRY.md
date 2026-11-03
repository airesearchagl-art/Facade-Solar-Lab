# Glazing Performance Lab G1 · Draft PR 入口

この機能PRで、利用者が手入力した案と自分で読み込んだローカルJSONを最大4案まで比較できる。対象は日射熱取得率η、ガラス中央部Ug、可視光透過率・反射率、ガラス構成、各値の出典と評価条件。編集後の比較更新と入力JSON v1の保存・再読込を含む。[レビュー手順](01_REVIEW_TASK.md) ・ [公開ソースと証拠の索引](02_EVIDENCE_INDEX.md)

**現在の判定**　独立Focused R3はH1のURL契約とRF01について **A. PASS**。残るRequired Fixは0件。G1全体のHuman UXはPENDING。AC24は過去エラーの帰属待ち、AC26は別のM11統合Gate。[FindingとAC一覧](03_FINDINGS.md) ・ [Human決定記録](04_DECISIONS.md)

| 識別子 | 値 |
|---|---|
| Repository | airesearchagl-art/Facade-Solar-Lab |
| Base | main @ `56a0f19eb4103c5231f09ec1c79dcfe2f782d783` |
| Feature head ref | `codex/glazing-g1-performance-comparison`。受領時にこのPRのhead SHAを取得する |
| レビュー済みソース | 固定base＋39ファイル。元manifest SHA-256 `356dc46535c6f42f3e31a9279a1349dd8472f6a60fd0bd1d6f331883f1fbab71` |
| H4による追加 | このディレクトリの引継ぎMarkdown 5件。R3の39件とは別管理 |
| 関連PR | [#17 引継ぎ方式](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/17) ・ [#16 M11](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/16) |

引継ぎ時は機能PR本文に記載したcommitと現在のheadを照合し、そのheadから5文書と実装を読む。#17は文書引継ぎ方式を扱う。機能PRはブランチ名でも検索できる。[G1ブランチのPR](https://github.com/airesearchagl-art/Facade-Solar-Lab/pulls?q=is%3Apr+head%3Acodex%2Fglazing-g1-performance-comparison)

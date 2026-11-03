# Human決定と次のGate

| 決定 | 承認範囲 |
|---|---|
| H1 · 2026-10-26 | G0 Design v0.3を正式受理。設計正本のSHA-256は `b8bc67b7e48cecf5342be5d30de4ae9c8ae0355b9dd055fcbff0f7fc1b906e0c`。G0独立IR-001RRはA. PASS、RF-01〜05とIRR-F01〜03は設計上CLOSED |
| H2 | 専用G1 worktreeでローカル実装・検証。手入力・ローカルimport・最大4案比較、出典、入力変更、JSON v1 |
| H3 | 開発依存の限定修復。Vite 8.3.0→8.3.3、Vitest 5.0.0→5.0.3と指定された推移依存 |
| H3-S1 | 通常解決で参照されなくなったsiginfoとstackbackの除去。magic-stringは1.3.1を維持。lock nodeは23更新・2削除。runtime dependenciesの変更0 |
| R3-SPEC-H1 · 2026-11-03 | G1出典URLの追加復号をASCII資格情報・制御文字の走査に限定。正しく符号化したliteral percentの旧拒否2件を受理へ変更 |
| H4 · 2026-11-03 | 独立R3が確認した39件と公開用Markdown5件をcommitし、G1 branchへnormal push、main向けDraft PRを作成。#17との相互リンクと公開後の読取確認 |

**保留中の決定**　Human UXとG1正式受理はPENDING。AC24はBLOCKED、AC26はM11の別Gate。メーカー原典6件はSOURCE_RECHECK_PENDING、Public Catalog BundleはBLOCKED。G2以降の計算連携、G4 solver検証、M5外部参照は各段階で判断する。

このDraftのReady化、merge、auto-merge、手動Production操作には別のHuman承認が必要。Git連携による自動Previewはデプロイ状態として記録し、Browser・Human UXの判定とは分ける。[文書引継ぎPR #17](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/17)

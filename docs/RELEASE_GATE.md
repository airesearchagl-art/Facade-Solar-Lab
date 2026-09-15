# Release gate — Git-triggered Vercel

## 判定

各gateは`PASS / BLOCKED / NOT_RUN`とtimestamp、expected/actual SHA、deployment ID、実測証拠をセットで記録します。全必須項目PASSでのみそのphaseをPASSにします。未確認はPASSではありません。`ops:verify`の終了0は出力scope内だけの合格で、レビュー/merge権限を与えません。

M5 `EXTERNAL_REFERENCE_PENDING`は物理性能上の制限です。運用releaseを自動BLOCKするものではありませんが、未検証警告とmodel/provenance境界の欠落・誤表示はBLOCKERです。Radiance / EnergyPlus / SPA / annual physical validationは引き続きNOT_RUNです。

## PRE-MERGE

1. branch、clean working tree、local HEAD=origin branch=PR headをfresh取得。reviewed exact headにnew commitがあればreview再確認。
2. exact headで`npm test`、`npm run typecheck`、`npm run build`、`npm run golden:check`、`npm audit`、`git diff --check`、`git diff --check origin/main...HEAD`。失敗/未解決auditはBLOCKED。外部solverのskippedをPASS件数へ足さない。
3. secret/privacy/licensed-data/scope scan。意図しない`.vercel`/env/raw EPW/absolute path/engine/expected差分なし。
4. Git-triggered **exact head** Preview READY。source=git、repo/project/team、ref/SHA、built-in Preview、config/alias境界を`ops:verify`で確認。temporary merge SHA、古いbranch alias、他branchを代用しない。
5. exact Previewのproduct index HTTP200、参照JS/CSS/favicon200、title、app fatal0、asset404なし、Single/Multi Demo、mode切替、finite結果、390px smoke。保護されたPreviewは既存認証ブラウザを使用。statusを見られない場合はHTTP evidence pendingでBLOCKED、画面表示だけで200を補完しない。
6. Independent Review PASS、Required Fixなし。Human UX/acceptance事項が追加で必要ならその証拠も確認。
7. **Readyとmergeは別Human authorization。** Draft handoff/Review PASSのみではどちらも実行しない。auto-merge、branch削除も未許可。

## POST-MERGE

Humanがmergeを承認した後の独立した運用確認です。このM6実装Waveでは実行しません。

1. PR MERGED、merge method、merge commit、parent、fresh origin/mainを確認。squash後main SHAはreviewed branch headと別なので混同しない。
2. Git Integrationが新main exact SHAから作ったProductionを特定。`source=git / ref=main / SHA=merged main`、target=production、READYを確認。
3. metadataと`gitSource`が同一main SHA、project/team/repoが正しい。manual CLI deployment、Preview、temporary merge SHAは不合格。
4. canonical aliasのdeployment IDが新Production IDと一致、alias assignment成功、設定driftなし。
5. `npm run ops:verify -- --sha <NEW_MAIN> --main-sha <NEW_MAIN> --ref main --target production --deployment <NEW_DPL> --browser`。canonical product200、JS/CSS/favicon200、bounded browser PASS。deployment固有URLの認証redirectをcanonical smokeと混同しない。
6. 手動Production mutationなし、M5 limitations保持。合格ならtimestamp付きProduction verificationをPR/運用記録に残す。不合格はincident runbookへ。merge済みという理由でPASSにしない。

## Evidence record

```text
Phase: PRE-MERGE / POST-MERGE
Checked at (UTC):
Reviewer / operator role:
PR state / reviewed head / live head:
Base / merged main / parent:
Deployment ID / URL / target / source ref / exact source SHA / READY:
Metadata/config/alias: PASS / BLOCKED
HTTP document / referenced asset status:
Browser mode / Demo / finite results / 390px / fatal / asset errors:
Tests / typecheck / build / Golden / audit / diff / privacy:
Independent Review / Required Fix:
Unverified / limitation:
Manual Production mutation: none (or separately authorized incident reference)
Phase result: PASS / BLOCKED / NOT_RUN
Human Gate:
```

M6 branchのfinal exact-head evidenceはDraft PR本文で同期します。repo内文書はself-referential SHA固定を必要としません。このPRがmergeされた事実だけをrecordするための再closeout PRは不要です。

## Recovery boundary

[運用runbook](VERCEL_OPERATION.md#e-incident-runbook)でsource/deployment/logを調べ、通常branch上の修正→review→Human mergeを基本にします。Git revertも対象を特定してreviewします。Vercel rollback/promote/redeploy/alias/DNS/env/protectionの変更はmanual Productionまたはsecurity/config mutationとして別Human Gateです。無条件retry/rollbackは行いません。

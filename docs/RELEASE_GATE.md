# Release gate — Git-triggered Vercel

## M6 Current State

`COMPLETE`。PR #11 squash merge後、M7開始前のread-only Phase 0でpost-merge gate PASS。main `f3cd83962e462f3e28ed20373d3ad58ede5e835e` / Production `dpl_6rcmsQz5VaLjBi1XTBi3vtWavyir` READY。provenance・canonical alias・index/JS/CSS/favicon.svg各200・Single/Multi/rerun/390px PASS、fatal/asset errors 0。手動Production操作なし。[Phase 0証拠](VERCEL_OPERATION.md#m6-post-merge-closure--phase-0)。

## M7 Current State

`COMPLETE`。PR #12 squash merge後、M8開始前のread-only Phase 0でpost-merge gate PASS。main `642136058d538e89d29971b0a586f86ea3aaa926` / Production `dpl_DyRqKwmhrdHo8gQNqw9pqqmyAR7v` READY。Git/main/exact source、canonical alias、index/JS/CSS/favicon.svg各200、Single/Multi fin edit・stale・rerun・finite result・Floor selection・Building Total・390px PASS、app-origin fatal/asset errors 0。手動Production操作なし。[証拠](VERCEL_OPERATION.md#m7-post-merge-closure--m8-phase-0)。

以下はmerge前のhistorical evidence（pending記述は上記完了状態でsuperseded）:

- Independent Review: A. PASS / Required Fix: none / Blocker: none（Human報告）。
- Reviewed / accepted head: `ce8e380717ea67613b0df00b0faf1fd7a6cc6e77`、Preview `dpl_EDxgWfeMEfwbkDCV15WRk5UpvMDS`。
- Human Network evidence: `/`、`/assets/index-B6As79Y7.js`、`/assets/index-CmVKWan7.css`、`/favicon.svg`すべてHTTP200。`PREVIEW_HTTP_EVIDENCE=PASS`、`PRE-MERGE GATE=PASS`。[証拠の帰属とscope](VERCEL_OPERATION.md#accepted-review--http-evidence)を参照。
- このdocs-only同期後のlive HEADはaccepted checkpointと分けてPR本文に記録する。製品・ops runner・tests/expected/Golden差分0を確認し、旧証拠を新deploymentの再測定に置き換えない。
- PR #11はDraft。Ready transitionは別Human authorization待ち。merge / post-merge Production gateはpending / NOT_RUNであり、Production PASSではない。

## M8 Current State

`COMPLETE`。PR #13 squash merge `d1dc91fd18ea6149424c8b192174ab0a130dcb97`、Git自動Production `dpl_CUM3EEeqj4q3Gs3oy9GGd5srDnb1`のpost-merge provenance / canonical alias / HTTP-assets / browser smoke PASS。[証拠](USER_GUIDE.md#m8-post-merge-closeout--m9-phase-0)。以下accepted product head `25ad78ca18519c0c8e6f211545f83d883000025a`のreview/acceptanceはhistorical checkpointとして保持します。

- Independent FULL Review: A. PASS / Required Fix: NONE（Human報告）。
- Human UX Review: PASS。上部Guide導線、3分ガイド、Parameter Reference、中間フィンpitch / count、Beginner / Technical Manual階層、390px responsive、manual print / PDF usabilityを含む。
- Human manual print / PDF visual acceptance: PASS。Agent-side local PDF generationが歴史的にUNVERIFIEDだった記録は保持し、Agent verificationへ書き換えない。
- PR #13はMERGED。M8 remaining tasksなし。manual Production mutationなし。
- M5は`LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING`。Radiance / EnergyPlus / SPAはNOT_RUNで、formal absolute-kWh validationは主張しない。

## M9 Current State

`COMPLETE`。PR #14 squash merge/main `9d2efd6c3db0afcc45c6bbfc5cb19f78e0464099`、Git自動Production `dpl_3LkxDP1izwbW5GRzQrCdPV7Es8wN` READY、provenance・canonical HTTP/assets/Worker PASS（M10 Phase 0 read-only）。merge前のHuman受理状態と匿名Preview HTTP BLOCKEDは[M9履歴](PARAMETRIC_EXPLORER.md#terminal-acceptance--evidence-attribution)として保持。

## M10 Current State

`IMPLEMENTATION_COMPLETE / RF-M10-REVIEW-01_RESOLVED / FOCUSED_INDEPENDENT_RE_REVIEW_PASS / HUMAN_UX_REVIEW_PASS / PRE_MERGE_GATE_PASS`（Human報告）。初回FULL Review B. REQUIRED FIXのREADME P2はfix head `6a5d305e04a24397612bc623ed75f90b51c2cabe`で解消、Focused Independent Re-Review PASS、Required Fix NONE OPEN。HumanはUXと保存CSV/JSON・PDFを受理。実装セッション外のCSV/PDF inspection、JSON Human-only attribution、非blocking PDF向き・末尾空白ページAdvisoryは[M10証拠](MULTIFLOOR_PARAMETRIC_EXPLORER.md#terminal-acceptance--evidence-attribution)を参照。匿名Preview HTTP/assetsはProtectionによりUNVERIFIED / BLOCKEDのままで、受理状態をHTTP200測定証拠へ変換しません。PR #15 OPEN / Draft、Ready承認待ち、merge / post-merge Production確認PENDING。新docs-only headはGit/PRで別途記録し、過去Previewの測定SHAと混同しません。M11 NOT STARTED。

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

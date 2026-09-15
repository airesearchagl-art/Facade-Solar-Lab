# M6 — Vercel Operation

## Current scope / resume

M6は運用の検証・手順整備です。branchは`feat/m6-vercel-operation`、開始mainは`41e9c4f0cddeef876a90a63ae4ce07713027654a`（PR #10 squash merge）。製品のsolar / weather / geometry / energy式、既存expected、Golden、M5測定値を変更しません。

Current state: `COMPLETE`。M6 Completion Wave Independent ReviewはA. PASS / Required Fix: none / Blocker: none（Human報告）。PR #11 squash mergeとpost-merge automatic Production検証は完了済みです。M6 remaining tasksはありません。live HEADはGit/PRから解決し、下記checkpointと混同しません。この同期のmergeを記録するためのM6再closeout cycleは不要です。手動Production操作の権限は付与しません。

### M6 post-merge closure — Phase 0

2026-09-15T12:11:34.737Z、repository変更前に既存`ops:verify`と既存Playwright/Chromeでread-only検証（exit 0 / PASS）:

- PR #11 MERGED、squash merge / fresh origin/main: `f3cd83962e462f3e28ed20373d3ad58ede5e835e`。
- Deployment: `dpl_6rcmsQz5VaLjBi1XTBi3vtWavyir`、target=production、READY、source=git / ref=main / exact SHA一致。
- canonical alias `facade-solar-lab.vercel.app`は当該deploymentを指し、project/team/configのdriftなし。
- canonical `/`、`/assets/index-B6As79Y7.js`、`/assets/index-CmVKWan7.css`、`/favicon.svg`各HTTP200。
- Single Demo / Multi Demo / rerun / finite results / mode切替 / 390px: PASS。
- browser fatal/pageerror=0、console error=0、app asset error=0。
- manual Production mutation: none。M6 COMPLETE。M7 branchからのdocumentation同期のみで、別M6 closeout PRは作らない。

### M8 post-merge closure — M9 Phase 0

PR #13 squash merge / main `d1dc91fd18ea6149424c8b192174ab0a130dcb97`。Git自動Production `dpl_CUM3EEeqj4q3Gs3oy9GGd5srDnb1` READY、canonical alias、source Git/main/exact SHA、HTTP index/JS/CSS/favicon.svg、Guide/Single/Multi/390px smoke PASS。Read-only確認 `2026-09-15T22:39:53.092Z`。[詳細証拠](USER_GUIDE.md#m8-post-merge-closeout--m9-phase-0)。M8 COMPLETE、manual Production mutationなし。M9は通常feature pushのGit Previewのみ許可し、Ready/merge/post-merge Productionは別Human Gateです。

### M7 post-merge closure — M8 Phase 0

2026-09-16T03:35+09:00、M8実装前にread-only確認:

- PR #12 MERGED、squash merge / fresh origin/main: `642136058d538e89d29971b0a586f86ea3aaa926`。
- Deployment: `dpl_DyRqKwmhrdHo8gQNqw9pqqmyAR7v`、Vercel管理画面でProduction / Ready / Current、source Git / ref main / exact commitを確認。
- canonical alias `facade-solar-lab.vercel.app`は当該Productionに割当。
- canonical `/`、`/assets/index-D49WKT7i.js`、`/assets/index-B6EFbBDS.css`、`/favicon.svg`各HTTP200 / expected MIME / non-empty。
- Chrome canonical smoke: Single/Multi fin pitch demo、Floor選択、pitch edit、stale、rerun、finite result、repeated fin geometry、Building Total、workspace state保持、390px PASS。
- app-origin fatal/console error=0、asset 404=0。Chrome拡張origin自身のSentry messageはproduct errorに含めない。
- cached authenticated Vercel CLI packageが利用できず`ops:verify`統合reportはBLOCKEDだったため、管理画面のauthoritative deployment detailと既存bounded HTTP probeへ分離して確認。再install、login、bypass、`vercel curl`、manual deployment/config mutationは行っていない。
- manual Production mutation: none。M7 COMPLETE。CSV/PDF再Human acceptanceは今回のpost-merge gate対象外。

### Accepted review / HTTP evidence

以下はmerge前のhistorical checkpointです。pending表現は上記Phase 0でsupersededされ、Current Stateではありません。

2026-09-15 Human提供のIndependent Review / Network証拠:

- Reviewed / accepted product head: `ce8e380717ea67613b0df00b0faf1fd7a6cc6e77`。
- Exact Preview: `dpl_EDxgWfeMEfwbkDCV15WRk5UpvMDS` / [Preview URL](https://facade-solar-7n1xphlt6-airesearchagls-projects.vercel.app/)。
- `/`、`/assets/index-B6As79Y7.js`、`/assets/index-CmVKWan7.css`、`/favicon.svg`はすべてHTTP 200。
- `PREVIEW_HTTP_EVIDENCE=PASS`、`PRE-MERGE GATE=PASS`。以前のHTTP evidence pendingはこのHuman証拠で解消済み。独立レビューおよびHTTP200はAgentによる新規測定ではなくHuman確認結果として記録する。
- 今回はdocs-only terminal sync。製品・ops runner・tests/expected/Goldenがaccepted headと同一であることをGit差分で確認し、同期後HEADはPR本文へ別記する。元の証拠を新deploymentのNetwork再測定と称さない。
- Merge / post-merge Production confirmationはpending / NOT_RUN。Production PASSや外部solver PASSを意味しない。

M5は`LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING`、Independent Review A. PASS / Required Fixなし。Radiance / EnergyPlus / SPA / annual physical external validationはNOT_RUNです。M6成功は絶対kWhの正式な物理validationではありません。最新geometryの外部solver実行には別途review済みcheckpoint/protocolが必要です。

## A. Read-only contract inventory

2026-09-15の認証済みVercel CLI 59.17.0 / Node 24.15.0による取得値。設定変更は行っていません。

| 項目 | Actual / contract |
| --- | --- |
| Project / team | `facade-solar-lab` / `airesearchagls-projects` |
| Project ID | `prj_IFtMR3MoADBBYm4YjLuXQ2BmcaN6` |
| Team ID | `team_44GttBgV6NXj8jDRnTiI3nXt` |
| Git link | github / `airesearchagl-art/Facade-Solar-Lab` / repo ID `1367124737` |
| Production branch | `main` |
| Git provider options | `createDeployments=enabled` |
| Framework / Node | `vite` / `24.x` |
| rootDirectory | `null`（repository root） |
| buildCommand / outputDirectory / installCommand | 各`null`（framework default、明示overrideなし） |
| Effective build / output | logで`npm run build` → `tsc --noEmit && vite build` / `dist`を確認 |
| previewDeploymentsDisabled | fieldなし（表示上null）、明示的falseという意味ではない |
| live / targets | `false` / `production`, `preview` |
| Custom environments | 専用GETの`environments=[]` |
| Application environment variables | `env ls --project <ID>`で**0件**。値の取得・decrypt・pullなし |
| Deployment Protection | `ssoProtection.deploymentType=all_except_custom_domains` |
| Password protection / trusted IPs | 設定objectなし |
| Project domains | `facade-solar-lab.vercel.app`のみ、verified=true、branch/redirect=null。custom domainなし |
| Canonical | <https://facade-solar-lab.vercel.app/> |
| Local link | `.vercel/`はlocal-only、Git非追跡、`.git/info/exclude`でignore |
| Tracked Vercel config | `vercel.json` / `.vercelignore` / `.vercel/**`なし。canonical `.gitignore`は変更しない |
| Actions | 既存`.github` workflow/cronなし。今回追加なし |

Production baseline（**M6のpost-merge証拠ではない**）:

- `dpl_Cz1LA848MJtCgxJEnWHHFs6Xp9uU` / READY / target=production / source=git。
- `meta.githubCommitSha`と`gitSource.sha`は開始main exact SHAに一致、ref=main。
- canonical aliasのproject/deployment IDが一致。deployment aliasesはcanonical、`facade-solar-lab-airesearchagls-projects.vercel.app`、`facade-solar-lab-git-main-airesearchagls-projects.vercel.app`。
- build log: 92 modules、`dist/index.html`、`index-B6As79Y7.js`、`index-CmVKWan7.css`、build/deploy完了。
- anonymous canonical index / JS / CSSは各HTTP 200。Single/Multi Demo、mode切替、有限結果、390px操作を確認。
- **Finding:** Chromeの暗黙`/favicon.ico`要求が404。現在のProductionを完全smoke PASS / known-goodと偽装しない。本branchの明示SVG favicon修正は上記accepted PreviewでHumanが`/favicon.svg` HTTP200を確認済み。Production解消は本PRのauthorized merge後の別gate。

## B/C. Provenance + HTTP + browser

`npm run ops:verify`はread-onlyです。既存認証済みCLIをnpmのoffline cacheから使用し、cache/auth不足ならBLOCKED。login/install/deploy/retry/settings mutationを自動実行しません。新dependencyはありません。

実行前にfetchし、PRとoriginのexact SHAを別々に確認します。`--sha`にPR番号、短縮SHA、GitHub temporary merge SHAを渡してはいけません。

```powershell
git fetch origin
git status --short
git rev-parse HEAD
git rev-parse origin/main
git rev-parse origin/feat/m6-vercel-operation
gh pr view <PR_NUMBER> --json state,isDraft,headRefOid,baseRefOid,mergeable,statusCheckRollup
npm.cmd run ops:verify -- --sha <EXACT_HEAD> --ref feat/m6-vercel-operation --target preview --deployment <EXACT_DPL_ID> --main-sha <FRESH_MAIN_SHA>
```

Productionのrelease時/障害時のone-command probe（手動deploymentではない）:

```powershell
npm.cmd run ops:verify -- --sha <MERGED_MAIN_SHA> --ref main --target production --deployment <GIT_PRODUCTION_DPL_ID> --main-sha <MERGED_MAIN_SHA> --browser
```

`--browser`は既存Playwright/Chromeだけを使います。ローカル環境に応じて`OPS_PLAYWRIGHT_MODULE` / `OPS_CHROME_EXECUTABLE`を設定可（絶対パスはcommitしない）。不足時にdownload/installを行いません。fresh ephemeral profileでpublic canonicalを検証し、user profile/cookie/tokenは読みません。

判定:

- metadata: expected SHA/ref/target/READY、project/team/repo、`meta.githubCommit*`と`gitSource`の両方、deployment時設定、現在project設定、canonical aliasと独立取得したProductionを照合。
- Previewは`target=null`または`preview`かつcustomEnvironmentなし。field欠落はunknown、custom environmentはPreview扱いしない。Previewにcanonical aliasが付いていればBLOCKED。
- 設定: framework/node/root/build/output/install/Preview disabled/protection/domain/environment境界の差分はBLOCKED。env一覧の出力形式変更・取得不能を「0件」に推測しない。現在の0件contract以外は明示reviewが必要。
- HTTP: redirectを追わず、index HTTP200、製品title/root、同一originの参照JS/CSS/faviconのHTTP200・MIME・非空を検証。15秒/request、index 512KiB、asset 2MiB、64参照まで。読み込みやasset形態変更もreview対象。
- browser: Single/MultiそれぞれDemoを通常UIから実行、2Case、chart/table、finite結果、物理未検証/合成気象の警告、390pxでpage overflowなし・再実行、mode state、console/pageerror/asset failureを確認。実EPW、PDF全経路、物理validationの代替ではない。
- JSONの`status=PASS`はその`scope`だけの合格。browserなしのPASSを完全release PASSに昇格しない。異常はexit code 1。取得不能もPASSにしない。

### Protected Preview

記録された匿名probeはdeployment固有URLからSSOへ302でした。これは`HTTP_AUTH_OR_REDIRECT`であり製品HTTP200ではありません。CLIのAPI認証とDeployment Protectionのブラウザ認証は別です。accepted PreviewのHTTP evidenceは上記Human Network確認でPASSになりましたが、匿名`ops:verify`の過去のBLOCKED出力をPASSへ改変しません。

以降の検証でも既存の認証済みChromeで**exact deployment URL**を開き、indexの表示、Single/Multi Demo、console、assets、390pxを確認します。Networkを利用できるsurfaceならreload時のdocument/JS/CSS/faviconのstatusと同一origin pathだけを記録します（cookie/header/HAR丸ごとの保存禁止）。Agent surfaceでNetwork statusを取得できず、対応するHuman証拠もない場合は、実画面の成功からHTTP200を推測せず**HTTP evidence pending**を残します。

`vercel curl`、share URL生成、bypass token、protection変更、cookie抽出、ユーザーprofileコピーは禁止。MCP protected-fetchもbypass record非生成を保証できない場合は使用しません。認証/権限変更が必要ならHuman Gate。ログイン画面や他branch/Productionの成功をPreviewの代用にしません。

## D. Release lifecycle

feature normal push → Git Preview → exact-head checks → Independent Review → separate Human Ready / merge authorization → Git main → automatic Production → canonical post-merge gate。

[RELEASE_GATE.md](RELEASE_GATE.md)が判定の正本です。branch alias/latest deploymentのラベルだけでsourceを判定しません。M6 PR自身のmerge/Production確認は引渡し時には未実施です。

## E. Incident runbook

全case共通で時刻、expected SHA/ref、actual ID/SHA/target、failed check、public-safe log行を記録。まずsource/deployment/logを特定し、無条件のredeployはしません。

Read-only probe記号（既存認証済みCLIを使用）:

以下のCLI例は検証済み59.17.0を`--offline`で既存npm cacheから解決します。cache miss / 認証不足はBLOCKED。自動download/install/login、`--offline`を外したretry、別versionへのfallbackは行わず、Humanによる環境準備を待ちます。repository dependencyは追加しません。

- **P**: 上記`ops:verify`（exact deployment指定）。
- **L**: `npx.cmd --offline --yes vercel@59.17.0 inspect <DPL_ID> --logs --scope team_44GttBgV6NXj8jDRnTiI3nXt --non-interactive`。build logをローカルで必要範囲だけ確認。raw logを無審査で公開しない。
- **G**: `git fetch origin`、`git rev-parse origin/<ref>`、`gh pr view <PR_NUMBER> --json state,headRefOid,baseRefOid,statusCheckRollup`。
- **I**: `npx.cmd --offline --yes vercel@59.17.0 api "/v6/deployments?projectId=prj_IFtMR3MoADBBYm4YjLuXQ2BmcaN6" --method GET --raw --scope team_44GttBgV6NXj8jDRnTiI3nXt --non-interactive`。一覧はID/source/ref/SHA/target/stateだけ抽出。該当なしを全履歴なしと断定せずpaginationを確認。Windows cmd境界で`&`を連結せずscopeを別引数にする。
- **B**: exact URLの通常ブラウザ。Console/Networkはアプリoriginに限定しsecret/SSO URLを転載しない。Vercel Functionsログなしをbrowser JS無エラーの証拠にしない。

| Case / 最初の確認 | Probe | PASS条件 | BLOCKED条件 / 次アクション |
| --- | --- | --- | --- |
| 1 Build failure / build logの最初のerror | L + same SHAのlocal build | local buildとGit deployment READY | error再現をbranchで最小修正→tests→normal push。secret/configが必要ならHuman |
| 2 Deployment ERROR / ID・target | I/L/P | exact ID READY | error原因をlogで特定。upload/platform問題は時刻付きincident、無断redeployしない |
| 3 READYだがHTTP error / statusとorigin | P/B | product200、asset200 | 302/401/403はauth、5xx/404はrouting/sourceを診断。auth bypassしない |
| 4 古いcanonical alias / alias ID | G/P | alias ID=new Git main Production | old/wrong IDならBLOCKED。Git source/assignment/errorを確認、alias手動変更はHuman |
| 5 Preview SHA mismatch / GitHub head | G/I/P | metaとgitSourceのSHA/ref=review対象 | stale/temporary merge/他branchは使用しない。正しいIDを探す、なければGit trigger診断 |
| 6 Production SHA mismatch / merged main | G/I/P | source=git/main/exact merged SHA | CLI source/別SHAを正式releaseに扱わずHumanへincident |
| 7 JS/CSS/icon 404 / Network path | P/B/L | index参照assetすべて200、MIME正常 | wrong build/base/cache/欠落を診断。branchで修正、unreviewed canonical操作なし |
| 8 Browser fatal / Console・pageerror | B | app fatal0、finite Demo | stackを機密除去してbranchで再現/修正。extension-originだけのエラーは別記、unknownを無視しない |
| 9 Preview発火なし / Git statusとlink | G/I、project GET | exact branch/SHAのGit Previewあり | ignored build/commit check/Git link/permissionsをread-only調査。設定/権限変更はHuman |
| 10 main後Production発火なし / merged state | G/I/L | exact main Git Production READY | merge未成立/ignored/error/auto-assignment状態を確認。manual deploy禁止 |
| 11 想定外branchのProduction / provenance | P/I | git/main/exact merged SHA | 即BLOCKED、両deploymentとaliasを保持して報告。削除/promoteで隠さない |
| 12 env/config drift / project vs deployment | P、names-only env list | 記録contractと一致 | 値を取得せず差分項目だけ記録。env/protection/build/domain設定変更はHuman |

## F. Rollback contract — 今回は実行しない

**Git-based recovery（基本経路）:** bad main SHA/parentを特定 → 別修正branchで対象commitのrevert案 → tests/Preview → Independent Review → Human merge承認 → Git-triggered Production →新main SHA/alias/smokeを再検証。main reset/force-push/branch削除はしません。revertも新しいrepo mutationとしてそのtaskの許可を確認します。

**Vercel deployment rollback（緊急経路）:** 過去にProduction domainへaliasされたeligible ID、exact source SHA、当時のsmoke、現在のenv/config互換性をread-only確認 → 対象IDを明記した別Human authorization → 承認された操作のみ → alias/source/HTTP/browserを再確認。CLIを使う場合の正式操作は`vercel rollback <deployment-id-or-url>`ですが、このWaveでは実行禁止です。READYだけでknown-goodと認定しません。

Hobbyのrollback範囲は直前Productionに制限されます。planの変更・支払・権限取得を自動実行しません。rollback後はProduction domainのauto-assignmentが停止するため、その復帰（別deploymentのpromote）も**別のmanual Production Human Gate**です。Git mainと配信sourceが異なる期間を明記し、次のpushが自動的に配信復帰すると思い込まないでください。[公式Instant Rollback](https://vercel.com/docs/instant-rollback)、[CLI rollback](https://vercel.com/docs/cli/rollback)。

## G. Monitoring approach

まずrelease時・障害報告時に`ops:verify --browser`を手動実行します。平常時のownerによる任意の定期確認でも同じコマンドを使えますが、今回scheduler/cron/通知を作成していません。連続監視/SLAを提供するものではありません。

監視指標: Git source SHA/ref、READY/ERROR、canonical alias、index/JS/CSS/icon HTTP、bounded browser fatal、設定差分。失敗時は上記runbookへ。static/browser-firstでbackend/DBなしのため、現時点では有料SaaSやGitHub Actions cronを導入する便益は小さく、Actions予算の照会/契約変更も不要と判断しました。billing残量や通知設定は未確認です。将来導入には別authorization・頻度/予算/通知先/privacy設計が必要です。

## H. Security / privacy / limits

- Vercel認証は既存CLI sessionのみ。tokenを引数/ファイルへ追加しない。`.env.local`、auth file、secret value、SSO cookieは読まない。
- API結果はwhitelistで公開可能なproject/deployment/ref/SHA/設定存在有無だけに縮約。author email、commit message、bypass record、password、raw env、完全responseをcommitしない。
- repo内の絶対local path、raw EPW/ZIP/license、screenshots中のprivate UI、credentials、保護用URLは公開しない。
- project/environment/protection/domain/DNS/permission/visibility変更、manual deploy/promote/rollback、paid action、branch削除は今回なし。
- actual Vercel値とmock testsは別物。ops PASSは将来障害が起きない保証ではなく、timestamp付きsnapshot。
- `[kWh]`物理検証、実EPW再試験、PDF全経路、長時間load test、外部solver、24/7監視はM6 bounded smokeの対象外。

仕様参照（2026-09-15確認）: [Vercel environments](https://vercel.com/docs/deployments/environments)、[CLI API](https://vercel.com/docs/cli/api)、[Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)。first deploymentのProduction bootstrap境界はhistorical contextであり、今回project再作成やCLI deployを行う理由にはしません。

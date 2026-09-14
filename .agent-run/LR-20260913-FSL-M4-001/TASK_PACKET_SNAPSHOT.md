# Facade Solar Lab — M4 Comparison UX Long-Run Task Packet

## Task Identity

```yaml
run_id: LR-20260913-FSL-M4-001
task_packet_id: LRP-20260913-FSL-M4-001
task_packet_revision: 1
execution_mode: LONG_RUN_ENDURANCE
horizon: EXTENDED
```

このTask PacketをHumanから受領したことを、M4に対するLong-Run / LONG_RUN_ENDURANCE実行許可として扱ってください。

ただし、既存のHuman Gateは一切緩和しません。

---

# 1. Repository / Starting State

Repository:

`airesearchagl-art/Facade-Solar-Lab`

Canonical base:

`main @ 46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215`

Expected new working branch:

`feat/m4-comparison-ux`

Previous milestone:

`M3 — Facade Geometry`

M3 status:

`merged / complete`

Current application:

* Vite
* React
* TypeScript
* Vitest
* Pure TypeScript calculation engine
* facade-v1 geometry/weather simulation
* current browser UI is still the M3 foundation/status screen

Do not base M4 on:

`chore/vercel-preview-smoke-20260913`

That branch is only a Vercel smoke ref and must remain untouched.

---

# 2. Vercel Current State

Project:

```text
facade-solar-lab
prj_IFtMR3MoADBBYm4YjLuXQ2BmcaN6
```

Team:

`team_44GttBgV6NXj8jDRnTiI3nXt`

Git Integration:

```text
GitHub
airesearchagl-art/Facade-Solar-Lab
Production branch = main
```

Current deployments:

```text
Bootstrap Production:
dpl_FV899m7nX9Xahb9hxJY99s1n8dPe
READY
formal release = no

Manual Preview:
dpl_4BQAfFfqNmNCs4W8orudiVsyb1pE
READY
target = null / Preview
```

Do not delete or mutate either deployment.

No:

* Production deploy
* promote
* rollback
* alias mutation
* custom domain
* DNS mutation
* environment secret mutation

---

# 3. Canonical Long-Run Rules

Before implementation, read the canonical Long-Run route from:

`airesearchagl-art/obsidian-vault` main

at minimum:

```text
02_Prompts/LLM_IDE/Long_Run_Development_Route.md
03_Templates/Long_Run_Task_Packet.md
```

Follow current canonical rules.

Create:

```text
.agent-run/LR-20260913-FSL-M4-001/
```

with at minimum:

```text
TASK_PACKET.md
RUN_STATE.md
TASK_QUEUE.md
EVIDENCE.md
```

Save an immutable snapshot of this Task Packet and calculate SHA-256.

Checkpoint / resume must bind to:

* repository
* exact working branch
* exact current HEAD
* Acceptance Criteria
* explicit unverified items
* immutable Task Packet digest

Conversation memory must never be the sole resume state.

---

# 4. Fresh Preflight

Before modifying anything:

```text
git fetch origin
```

Confirm:

```text
origin/main =
46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215
```

If origin/main differs:

**STOP**

and report the new SHA.

Confirm working tree clean.

Run baseline:

```text
npm test
npm run typecheck
npm run build
npm audit
npm run golden:check
git diff --check
```

Expected M3 baseline:

```text
npm test:
11 files / 86 tests PASS
```

Also preserve:

* M1 legacy original hashes
* M1 Golden
* M2 weather regression
* M3 geometry regression
* facade-v1 model identities

Do not rewrite existing expected values simply to clear tests.

---

# 5. M3 Post-Merge Closeout

On the new M4 branch only, synchronize the historical M3 Run Artifact to:

```text
M3:
MERGED / COMPLETE
```

Record:

```text
PR #4
merged main:
46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215
```

Do not modify immutable M3 Task Packet snapshots.

Update:

`docs/ROADMAP.md`

so that:

```text
M3 = Complete
M4 = Current
```

---

# 6. First M4 Push = Git-triggered Preview Hard Gate

Create:

`feat/m4-comparison-ux`

from exact canonical main.

The first commit should contain only M4 initialization / Run Artifact / roadmap state, for example:

```text
chore(m4): initialize comparison UX run
```

Push this real new commit once.

Do not create an empty commit.

After push, inspect Vercel.

## If a Git-triggered deployment appears

Immediately check before further implementation:

```text
source branch = feat/m4-comparison-ux
source SHA = pushed exact head
target
readyState
aliases
```

### PASS

Preview classification:

```text
target = null / Preview
```

No Production alias.

Then continue.

### HARD STOP

If:

```text
target = production
```

or Production alias changes:

**BLOCKED + Human Gate immediately.**

Do not:

* delete it
* retry
* create another commit
* use REST API workaround

## If no deployment appears

Do not create a no-op commit.

Use only a small bounded read-only confirmation.

If still absent:

```text
GIT_PREVIEW_INCONCLUSIVE
```

としてEvidenceへ記録し、M4のローカル実装自体は継続してよい。

以後の自然なcheckpoint pushでdeploymentが初めて出現した時点で、同じHard Gateを適用する。

---

# 7. M4 Objective

M3までの計算エンジンを、建築設計者がブラウザ上で実際に比較検討できる**Facade Comparison Workspace**へ昇格する。

M4では、

**同一気象条件の下で複数のファサード案を並べ、形状・方位・ガラス性能の差と、年間／夏季／冬季／月別の日射熱取得差を直感的に比較できること**

を完成条件とする。

M4は正式エネルギー性能評価ツールではない。

---

# 8. Required User Flow

最低限、ユーザーが次の流れを1画面で完結できること。

```text
EPWを読み込む
↓
気象地点とデータ情報を確認
↓
Case Aを設定
↓
Caseを複製 / 追加
↓
方位・窓・庇・SHGCを変更
↓
Run Comparison
↓
Annual / Summer / Winter比較
↓
月別グラフ比較
↓
Baselineとの差分確認
↓
形状差・モデル前提を確認
```

計算はブラウザ内で完結させる。

EPWデータをサーバーへ送信しない。

---

# 9. Weather File UX

M2の既存EPW parser / provenance contractを再利用する。

新しい別parserをUI側へ作らない。

UIに:

```text
Load EPW
```

を設ける。

File API / FileReaderを使用してbrowser-localで読む。

Accepted initial scope:

```text
.epw
```

必要なら`.txt`を許容してよいが、EPW内容検証は既存parserを正本とする。

表示:

* location / city
* country
* station / source ID
* latitude
* longitude
* timezone
* interval count
* dataset ID / provenance
* parse issues
* missing radiation issues

生のEPW本文はUIへ表示しない。

ファイル内容をlocalStorageへ保存しない。

backendへ送らない。

---

# 10. No Bundled Licensed Weather Data

M2で使用したTokyo Hyakuri EPW等のraw weather fileをrepositoryへcommitしない。

既存local fileがある場合のみmanual browser validationへ使用可能。

既知のTokyo Hyakuri EPW SHA-256:

`3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`

存在しない場合:

* Internetから勝手にlicensed EPWを取得しない
* synthetic / generated fixtureでUI検証
* real EPW browser validationはunverifiedとして報告

---

# 11. Comparison Domain Boundary

React component内に比較ロジックを埋め込まない。

Pure TypeScriptでComparison domainを分離する。

推奨:

```text
src/comparison/
```

または同等の明確なboundary。

例:

```text
types.ts
case.ts
compare.ts
delta.ts
format.ts
index.ts
```

`src/comparison/**`からは禁止:

```text
React
window
document
navigator
File
Canvas
fs
path
process
```

Comparison domainは既存:

```text
facade-v1
weather parser
geometry
```

を呼び出すadapterであり、solar calculationを複製しない。

---

# 12. Comparison Case Contract

最低限:

```ts
interface ComparisonCase {
  id: string
  name: string
  parameters: FacadeV1Parameters
}
```

実際の型名は既存styleへ合わせてよい。

Workspace:

```text
cases
baselineCaseId
weather dataset
comparison result
dirty / last-run state
```

Case count:

```text
min = 1
max = 4
```

M4では4案比較まで。

将来拡張可能な設計にするが、M4で無制限Caseは不要。

---

# 13. Case Operations

UIで最低限:

* Add Case
* Duplicate Case
* Rename Case
* Delete Case
* Set as Baseline

を実装。

Baseline削除時は、残る最初のCaseへdeterministically再割当する。

最後の1 Caseは削除不可。

4 Case時はAdd / Duplicateをdisable。

Case ID生成方法をsimulation結果の意味へ依存させない。

Testではrandom IDを使わずdeterministicにする。

---

# 14. Geometry / Performance Inputs

各Caseで編集:

## Facade

```text
Facade azimuth
```

表示規約:

```text
0° = North
90° = East
180° = South
270° = West
```

Quick presets:

```text
N
NE
E
SE
S
SW
W
NW
```

中間方位も数値入力可能。

## Opening

```text
width [m]
sill elevation [m]
head elevation [m]
```

heightはderived表示。

## Overhang

Enable / Disable。

Enable時:

```text
depth [m]
elevation [m]
left extension [m]
right extension [m]
```

Disable時:

engineへoverhang `undefined` または既存contractに沿う形で渡す。

## Glass / ground

```text
SHGC
ground reflectance
```

M4ではglass product databaseは作らない。

SHGCはnumeric contractのみ。

---

# 15. Validation

existing geometry validationを正本として使う。

最低限:

```text
width > 0
head > sill
depth >= 0
extensions >= 0
overhang elevation >= opening head
0 < SHGC <= 1
0 <= ground reflectance <= 1
finite numeric inputs
```

Facade azimuthは既存contractと同様にnormalize。

invalid inputをsilent clampして意味を変えない。

UIへ具体的なvalidation messageを出す。

Invalid caseが1件でもある場合:

`Run Comparison`

を実行しない。

---

# 16. Explicit Run Model

**full-year simulationをinput key strokeごとに実行しない。**

Geometry drawing等の軽量previewは即時更新してよい。

年間比較simulationは明示的:

```text
Run Comparison
```

で実行。

変更後は:

```text
Changes not calculated
```

等のdirty indicationを表示する。

同じweather datasetは1回parseし、各Caseで再利用。

4 Case分まで一括simulation。

---

# 17. Results — Required KPI

各Caseについて最低限:

```text
Annual
Summer / Cooling
Winter / Heating
```

M2/M3 period contractを変更せず使う。

表示時はmonth definitionも明記:

```text
Cooling / Summer:
Apr–Sep

Heating / Winter:
Oct–Mar
```

またはactual engine period definitionから生成。

各Periodで:

```text
withOverhangKWh
withoutOverhangKWh
reductionPercent
```

を使えるようにする。

UIの中心KPIは原則:

```text
withOverhangKWh
```

を比較値とする。

---

# 18. Baseline Delta

Baseline Caseとの差を表示。

最低限:

```text
Δ Annual kWh
Δ Annual %
Δ Summer kWh
Δ Summer %
Δ Winter kWh
Δ Winter %
```

定義:

```text
delta = case - baseline
```

負値はbaselineより取得が少ない。

ただし:

**負値 = 常に良い**

とは表現しない。

夏季の低減と冬季の取得低減は設計意味が異なる。

Baselineが0の場合にInfinity / NaNを出さない。

percentage deltaは:

```text
null / —
```

等で明示。

---

# 19. No “Optimal” Score

M4では:

* 最適案
* Best
* Score
* Recommendation
* energy optimum
* cost optimum

を自動判定しない。

ユーザーが比較して判断するためのworkspaceとする。

MVP v0.1の独自「最適」表示を復活させない。

---

# 20. Monthly Comparison

12ヶ月のmonthly `withOverhangKWh`をCase比較できるchartを実装。

新しい重いchart dependencyは原則追加しない。

SVG / semantic HTML / lightweight custom componentを優先。

要件:

* Case legend
* 12 months
* multiple cases
* responsive
* hover / focusまたは隣接tableで値確認可能
* colorだけに依存しない
* accessible label

Chartと同じ値を確認できるtable表示を用意する。

---

# 21. Geometry Visualization

selected Caseについて、最低限2種類を表示。

## Section

表示:

* sill
* head
* opening height
* overhang elevation
* overhang depth
* floor / datum

## Front elevation

表示:

* opening width
* left/right edge
* overhang width
* left extension
* right extension

SVGベースを推奨。

M4ではsolar ray animationや3Dは不要。

Geometry drawingは**説明図**であり、寸法取得用CADではない。

---

# 22. Input Difference Visualization

Baselineとselected Caseの入力差分を表示。

例:

```text
Facade azimuth   180° → 225°
Opening width    6.0 m → 4.8 m
Overhang depth   0.8 m → 1.6 m
SHGC             0.50 → 0.35
```

同じ値は省略可能。

数値差だけでなく:

```text
Overhang:
Enabled → Disabled
```

も扱う。

Pure TS差分生成関数を推奨。

---

# 23. Assumptions / Provenance Panel

常にユーザーが確認できる場所へ:

Weather:

* dataset ID
* source
* site
* intervals

Model:

```text
modelVersion:
facade-v1-weather

geometryVersion:
facade-v1

direct:
finite-rectangular-overhang-shadow-polygon-v1

diffuse:
isotropic-2d-infinite-width-v1

ground:
ghi-ground-reflection-0.5-v1
```

を表示。

特に:

**finite-width geometry applies only to direct shadow**

を隠さない。

---

# 24. Absolute kWh Warning

画面上に常時または結果領域で明確に:

```text
Absolute weather-driven kWh values are not formally validated physical-performance results.
```

相当の警告を表示。

日本語UIの場合は明確な日本語でよい。

以下用途へ使えないことを示す:

* BEI
* official energy compliance
* HVAC sizing
* final certification
* guaranteed energy prediction

ただし比較設計用途として過度に弱い表現にはしない。

---

# 25. UX Layout

professional architectural design toolとして整理。

推奨information hierarchy:

```text
Header / project status
Weather dataset
Case tabs / case management
Input workspace
Geometry preview
Comparison KPI
Monthly chart
Baseline differences
Assumptions / limitations
```

Desktop-firstだがresponsive。

最低確認幅:

```text
desktop ~1280px
mobile ~390px
```

Mobileで完全なCAD-like操作を求めないが、主要入力と結果が破綻しないこと。

---

# 26. Initial State

EPW未読込でも:

* Case geometry編集
* Geometry preview
* assumption説明

は可能。

結果領域では:

```text
Load an EPW file to run weather comparison
```

を明示。

Repositoryへweather datasetをbundleしない。

---

# 27. Default Case

M4開始時は少なくとも1 Caseを用意。

初期値は既存M1/M3のlegacy-like geometryを参考にしてよいが、

**特定庇深さが最適であるという意味を持たせない。**

ユーザーはDuplicateして比較を開始できること。

---

# 28. Performance Boundary

最大:

```text
4 cases × full-year dataset
```

を通常操作範囲とする。

M4ではWeb Worker導入は必須ではない。

まず:

* parse once
* explicit Run
* avoid per-keystroke simulation
* avoid duplicated solar calculations

で十分な応答性を狙う。

明らかなUI freezeが確認された場合のみ、Worker等をAdvisoryとして検討。

---

# 29. Accessibility

最低限:

* native labels
* keyboard操作
* visible focus
* semantic buttons
* fieldset / legend等の適切なgrouping
* invalid stateのtext表示
* chartにtext/table fallback
* colorのみで状態を伝えない

---

# 30. Pure Engine Boundary

既存:

```text
src/engine
src/geometry
src/weather
```

へReact / DOM dependencyを入れない。

Boundary testを維持・拡張。

Comparison pure domainも同様にbrowser-independentを基本とする。

FileReader等は`src/app`側adapterに閉じ込める。

---

# 31. Regression Preservation

以下の既存挙動を変更しない。

* M1 legacy-v01 outputs
* Golden fixtures
* M2 weather-v1 behavior
* solar position 365/366 handling
* M3 finite overhang direct polygon
* finite-width side behavior
* diffuse infinite-width approximation
* ground reflection model
* Facade V1 result model identity

UI都合でengine expected valuesを書き換えない。

---

# 32. Required Tests

新規Pure TS testsで最低限:

## Comparison

* 1 Case
* 2 identical Cases → delta zero
* Baseline switching
* Baseline deletion reassignment
* max 4 Cases
* duplicate preserves parameters but new ID
* annual delta
* summer delta
* winter delta
* percent delta with baseline zero
* monthly 12-month alignment

## Difference model

* azimuth difference
* geometry difference
* overhang enable/disable
* SHGC difference
* unchanged fields omitted

## Validation

* invalid opening
* invalid overhang
* invalid SHGC
* invalid ground reflectance
* finite input handling

## Engine boundary

* no React / DOM dependency in pure layers

Do not add meaningless snapshot tests just to inflate count.

---

# 33. UI Verification Without Heavy Test Dependency

Do not add a large UI testing stack unless necessary.

Prefer:

* pure view-model tests
* React server-render smoke where useful
* deterministic component contract
* browser verification on Vercel Preview

If a small test dependency materially improves confidence, justify it in EVIDENCE before adding.

---

# 34. Required Local Checks

At final convergence:

```text
npm test
npm run typecheck
npm run build
npm audit
npm run golden:check
git diff --check
```

Also run focused:

```text
M1 regression
M2 regression
M3 geometry regression
M4 comparison tests
```

Confirm:

```text
no tracked .vercel
no tracked .env.local
no EPW raw data
no credentials
no bypass token values
```

---

# 35. Real EPW UI Smoke

If the existing local Tokyo Hyakuri EPW is available and hash matches:

`3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E`

use it for browser-local file upload test.

Do not commit.

Verify:

* parser completes
* provenance displays
* 8760 intervals
* at least 2 Cases calculate
* monthly results contain 12 months
* Annual / Summer / Winter are finite
* no NaN / Infinity
* baseline deltas work

Also compare one UI Case against direct facade-v1 call for the same exact parameters.

Formatting difference is allowed。

numeric meaning must match.

---

# 36. Final Vercel Preview

Keep pushes economical.

Do not push every micro-commit.

Recommended maximum before review:

```text
1. M4 initialization push
2. final convergence push
```

Additional push only for substantive recovery.

After final push:

## If Git-triggered Preview exists

Confirm exact final head and:

```text
target = null / Preview
READY
branch = feat/m4-comparison-ux
```

Verify browser.

## If Git Integration still produces no deployment

After all local checks are PASS, this Task Packet authorizes **one** final manual fallback Preview:

```text
vercel deploy --target=preview --yes
```

from the clean exact M4 final head.

Immediately inspect metadata.

If Production:

**STOP**

If Preview:

browser verify.

No retry.

Do not use `vercel curl`.

---

# 37. Browser Acceptance

Final M4 Previewで最低限実操作確認:

1. App loads.
2. EPW fileを選択できる.
3. Weather provenance表示.
4. Case A表示.
5. Case duplicate.
6. Case Bのoverhang depth変更.
7. Run Comparison.
8. Annual KPI表示.
9. Summer KPI表示.
10. Winter KPI表示.
11. Monthly chart表示.
12. Baseline delta表示.
13. Geometry section表示.
14. Front elevation表示.
15. Assumptions表示.
16. absolute kWh warning表示.
17. app-origin fatal console error = 0.
18. asset 404 = 0.

---

# 38. Documentation

最低限更新:

```text
README.md
docs/ROADMAP.md
docs/MODEL_LIMITATIONS.md
docs/VALIDATION_PLAN.md
```

新規推奨:

```text
docs/COMPARISON_UX.md
```

記載:

* comparison case contract
* baseline delta semantics
* Run Comparison behavior
* EPW local-only handling
* model identities
* limitations
* browser validation route
* M5へ残す課題

---

# 39. M4 Non-Goals

M4では実装しない:

* multiple openings per facade
* multiple overhangs
* side fins
* reveal shading
* arbitrary 3D mesh
* finite-width diffuse shading
* Perez / anisotropic sky
* glass product database
* glass IAC
* automatic weather download
* geocoding
* cost estimation
* automatic optimum selection
* BEI calculation
* HVAC sizing
* PDF export
* CSV export
* account
* cloud save
* share link
* localStorage persistence
* database
* backend
* analytics
* custom domain
* formal Production release
* M5 third-party validation
* M6 Production operation

---

# 40. Acceptance Criteria

M4は以下をすべて満たすまで完了扱いにしない。

1. Exact base確認。
2. Immutable M4 Task Packet + digest。
3. Resume可能Run Artifact。
4. M3 closeout。
5. M4 branch分離。
6. Git-triggered deploymentが出た場合Production越境なし。
7. EPW browser-local load。
8. Weather provenance表示。
9. 1–4 Case管理。
10. Duplicate Case。
11. Baseline selection。
12. Geometry inputs。
13. Overhang enable/disable。
14. SHGC。
15. Ground reflectance。
16. explicit Run Comparison。
17. Annual KPI。
18. Summer KPI。
19. Winter KPI。
20. Baseline delta。
21. Monthly comparison chart。
22. accessible monthly values。
23. Section geometry visualization。
24. Front geometry visualization。
25. Baseline input differences。
26. assumptions/model identity。
27. absolute-kWh warning。
28. no “optimal” automatic judgment。
29. invalid input handling。
30. M1 regression PASS。
31. M2 regression PASS。
32. M3 regression PASS。
33. M4 tests PASS。
34. typecheck PASS。
35. build PASS。
36. audit PASS。
37. golden PASS。
38. diff-check PASS。
39. privacy / raw EPW / secret scan PASS。
40. final browser verification PASS、または明示的unverified項目としてBLOCKED。
41. Draft PR作成。
42. Human GateでSTOP。

---

# 41. Checkpoint Policy

各主要Wave後に:

```text
RUN_STATE
TASK_QUEUE
EVIDENCE
explicit unverified items
Quality Debt
current HEAD
```

を同期。

Security / Privacy / Authentication / Permission / Data-integrity / irreversible-dataのfailureは:

```text
immediate BLOCKED
+ Human Gate
```

Quality Debt化禁止。

---

# 42. Suggested Waves

```text
Wave 0
Fresh preflight / Task Packet / M3 closeout

Wave 1
M4 branch initialization
first real push
Vercel Git Preview Hard Gate

Wave 2
Comparison pure domain

Wave 3
Weather file UX / provenance

Wave 4
Case editor / validation / state model

Wave 5
KPI / baseline delta / monthly chart

Wave 6
Geometry visualization / difference panel / assumptions

Wave 7
Responsive / accessibility / UX convergence

Wave 8
Regression / real EPW / browser validation

Wave 9
Final Vercel Preview
docs / Run Artifact convergence

Wave 10
Draft PR
Human Gate
```

Do not expand scope after Acceptance Criteria converge.

---

# 43. Git Policy

Allowed:

* new M4 branch
* normal commits
* normal pushes to M4 branch
* one Draft PR after convergence

Forbidden:

* main direct commit
* amend after external review begins
* force-push
* rebase after external review begins
* branch deletion
* Ready for Review
* merge
* auto-merge

Expected Draft PR title:

`M4: build facade comparison workspace`

Draft only.

---

# 44. Draft PR Body

Include:

```text
Summary
Comparison UX
Weather handling
Case model
Validation
Model identities
Tests
Vercel Preview
Known limitations
Explicit unverified items
Human Gate
```

Do not call M4 Production-ready.

---

# 45. Final Run State

Expected:

```text
COMPLETE_PENDING_FULL_VERIFY
```

or:

```text
BLOCKED
```

Do not mark complete if browser / final preview is not verified.

After Draft PR creation:

```text
HUMAN_GATE
Await Independent FULL Review
```

No Ready.

No merge.

No M5.

---

# 46. Completion Report

Return:

```text
# Facade Solar Lab M4 Completion Report

Run ID:
LR-20260913-FSL-M4-001

Task Packet:
LRP-20260913-FSL-M4-001

Task Packet SHA-256:

Base:
46f3aabe7ed360b5ede80a2d244fc8ae4ba8d215

Branch:
feat/m4-comparison-ux

Final head:

Git-triggered Preview Gate:
- initialization deployment:
- target:
- source branch:
- source SHA:
- result:

Implementation:
- EPW local import:
- Case management:
- baseline:
- input editor:
- comparison engine adapter:
- annual KPI:
- summer KPI:
- winter KPI:
- monthly chart:
- geometry section:
- front elevation:
- input difference:
- assumptions:
- warning:

Regression:
- M1:
- M2:
- M3:
- M4:

Checks:
- npm test:
- typecheck:
- build:
- audit:
- golden:
- diff:
- privacy:
- raw weather:
- secret:
- boundary:

Real EPW:
- available:
- hash:
- intervals:
- browser verification:

Final Vercel:
- method:
- deployment ID:
- URL:
- target:
- READY:
- exact source head:
- browser:
- console:
- asset errors:

Quality Debt:

Explicit unverified items:

Draft PR:
- URL:
- OPEN:
- Draft:
- Ready:
- merged:
- base:
- head:
- commits:
- changed files:

Repository mutation:
- main:
- Production:
- custom domain:
- secrets:
- branch deletion:

Knowledge Sync Trigger:
- yes if new reusable Vercel Git-trigger behavior was confirmed
- otherwise no

Human Gate:
STOP — Independent FULL Review required
```

Do not mark Ready, merge, Production release, M5開始, or branch deletion.

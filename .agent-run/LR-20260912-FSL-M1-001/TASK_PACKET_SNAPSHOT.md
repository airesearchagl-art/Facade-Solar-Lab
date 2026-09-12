# Task Packet Snapshot

- Task Packet ID: `LRP-20260912-FSL-M1-001`
- Revision: `1`
- Snapshot policy: immutable after Wave 0
- Public-boundary normalization: the user-specific local root is represented as `<PROJECT_ROOT>`.

---
# Facade Solar Lab — M1 Engine Baseline

M0が完了し、PR #1はIndependent Review / Required Fix / Focused Re-Reviewを経てsquash merge済みです。

Facade Solar Lab の **M1 — Engine Baseline** を開始してください。

今回は **LONG_RUN_ENDURANCE / EXTENDED** として実行します。

```yaml
run_id: LR-20260912-FSL-M1-001
task_packet_id: LRP-20260912-FSL-M1-001
task_packet_revision: 1

execution_mode: LONG_RUN_ENDURANCE
horizon: EXTENDED

human_explicit_long_run_authorization: true
human_explicit_long_run_authorization_source: "Project baseline: 長期間の長時間開発が回る仕組みで進める"

human_explicit_endurance_authorization: true
human_explicit_endurance_authorization_source: "Project baseline: 初期は安定性の最大化より長時間継続可能性を優先する"
```

LONG_RUN_ENDURANCEはHuman Gateを緩和しません。

---

# 1. Review Target / Starting State

Repository:

```text
airesearchagl-art/Facade-Solar-Lab
```

Local root:

```text
<PROJECT_ROOT>
```

Expected canonical base:

```text
main
b633a2b9651b63ea1224f8a4becefa1062a6b12d
```

Previous merged PR:

```text
PR #1
M0: bootstrap long-run development foundation
merged=true
merge commit:
b633a2b9651b63ea1224f8a4becefa1062a6b12d
```

Expected new branch:

```text
feat/m1-engine-baseline
```

開始時に必ずfresh fetchしてください。

`origin/main` が上記exact SHAと一致しない場合は、推測で進まず停止して報告してください。

---

# 2. Objective

M1の目的は、

**旧MVP v0.1の計算挙動をPure TypeScript Engineとして再現し、その挙動をGolden Testで固定すること**

です。

M1では、旧MVPを「正しい物理モデル」に修正しません。

```text
Legacy MVP
↓
現在の挙動を正確に把握
↓
Pure TypeScriptへ分離
↓
同じ入力に対して同じ出力になることを検証
↓
Golden Baselineとして固定
```

M2以降で気象・物理モデルを改善したとき、

```text
何を変更したか
↓
数値がどれだけ変わったか
```

を追跡できる状態を作ることが目的です。

---

# 3. Source Intake Gate — 最重要

期待するHuman提供原本:

```text
legacy/mvp-v0.1/solar_overhang_simulator.html
legacy/mvp-v0.1/HANDOVER_solar_overhang_simulator.md
```

## 両方存在する場合

実装開始前に:

1. byte count取得
2. SHA-256取得
3. Git status確認
4. `.gitattributes`による改行変換リスク確認
5. sourceを一切変更しないことを確認

してください。

### 重要 — `.gitattributes`

M0では、

```text
*.md text eol=lf
*.html text eol=lf
```

が設定されています。

legacy原本をbyte-for-byte保存するため、

```text
legacy/mvp-v0.1/solar_overhang_simulator.html -text
legacy/mvp-v0.1/HANDOVER_solar_overhang_simulator.md -text
```

等、対象原本にGit text normalizationが掛からない設定を追加してください。

原本を`git add`する**前**に設定すること。

その後、

* workspace source SHA-256
* staged / committed blobから復元したbytesのSHA-256

が一致することを検証してください。

formatter / prettier / normalize / encoding conversionは禁止。

## 片方でも存在しない場合

実装を推測で続けない。

```text
INPUT_REQUIRED
```

として停止してください。

以下は禁止:

* 引継書だけからHTMLを再構成
* 記憶から関数を再実装
* Chat内容を原本扱い
* approximate baselineを「legacy reproduction」と呼ぶ

不足ファイルを正確に報告し、Human Gateで停止。

---

# 4. M0 Post-Merge Closeout

M1 branch上で、M0 Run Artifactをpost-merge stateへ最小同期してください。

M0 immutable Task Packet Snapshotは変更禁止。

同期対象候補:

```text
.agent-run/LR-20260912-FSL-M0-001/RUN_STATE.md
.agent-run/LR-20260912-FSL-M0-001/EVIDENCE.md
.agent-run/LR-20260912-FSL-M0-001/TASK_QUEUE.md
.agent-run/LR-20260912-FSL-M0-001/DECISIONS.md
```

記録:

```text
PR #1:
merged

merge method:
squash

merge commit:
b633a2b9651b63ea1224f8a4becefa1062a6b12d

M0:
COMPLETE_VERIFIED / HUMAN_CLOSEOUT
```

M0の過去Evidenceを書き換えて歴史を改変せず、post-merge closeoutとして追記・状態更新してください。

---

# 5. M1 Long-Run Artifact

新規:

```text
.agent-run/LR-20260912-FSL-M1-001/
├─ RUN_MANIFEST.md
├─ TASK_PACKET_SNAPSHOT.md
├─ RUN_STATE.md
├─ TASK_QUEUE.md
├─ QUALITY_DEBT.md
├─ DECISIONS.md
└─ EVIDENCE.md
```

Task Packet exact snapshotを保存し、SHA-256 digest bindingを行う。

Resume可能な必須fieldsはM0と同じ。

特に:

```text
Repository
Working branch
Base SHA
Current head rule
Acceptance Criteria
Explicit unverified items
Required checks
Quality Debt
Remaining tasks
Next action
Stop conditions
```

を省略しない。

---

# 6. Legacy Engine Extraction

旧HTMLから、DOM / Canvasと無関係な計算部分だけを抽出します。

引継書上の主要関数候補:

```text
decl(n)
hourGain(p, month, hour)
simulate(p)
summarize(mo)
```

その他、

```text
ASHRAE monthly constants
MID representative-day array
month-day counts
STRIPS
time step
solar-position helpers
shading calculations
sky / ground terms
```

等、実際に計算へ必要なものはactual HTMLを読んで特定してください。

## 実装場所

例:

```text
src/engine/
├─ index.ts
├─ legacy-v01/
│  ├─ constants.ts
│  ├─ types.ts
│  ├─ solar.ts
│  ├─ shading.ts
│  ├─ simulation.ts
│  └─ index.ts
```

actual sourceを確認して必要に応じて調整可。

## Boundary

`src/engine/` は引き続き:

* React禁止
* React DOM禁止
* `window`禁止
* `document`禁止
* Canvas禁止
* DOM API禁止
* UI state禁止

Pure TypeScriptに限定。

---

# 7. Preserve Legacy Semantics

M1では旧MVPの問題を修正しない。

既知の問題:

* Clear Skyを年間適用
* `k_sky`経験係数
* 月代表日方式
* 等方天空
* 無限長庇
* 地面反射の簡略化
* 入射角依存なし
* 真太陽時
* 夏至／冬至表示と代表日の不一致
* balance indicator UI bug

これらを勝手に改善しない。

Legacy Engineには明確に、

```text
LEGACY BASELINE
NOT VALIDATED PHYSICAL MODEL
```

という位置づけを持たせる。

M2/M3で改善モデルと比較できるようにする。

---

# 8. Parameter Contract

actual HTMLを基準として入力contractを型定義してください。

旧MVP上の既知parameter:

```text
H
D
O
W
L
A
G
R
SKY
```

ただし新TypeScript APIでは意味の分かる名称を使ってよい。

例:

```ts
windowHeightM
overhangDepthM
overhangToWindowHeadM
windowWidthM
latitudeDeg
surfaceAzimuthDeg
solarHeatGainCoefficient
groundReflectance
legacySkyFactor
```

ただし、

```text
旧parameter名 ↔ 新parameter名
unit
range
sign convention
default
```

のmappingを文書化してください。

暗黙の単位変換は禁止。

---

# 9. Independent Legacy Reference

新TypeScript実装そのものからExpected値を生成してはいけません。

旧HTMLのactual calculation codeを基準とした、

**新Engineとは独立したreference execution**

を成立させてください。

方法はactual sourceを見て最も安全な手法を選ぶ。

優先:

1. original HTML内のscript/calculation blockをtest-only harnessから実行
2. それが困難なら、計算部分をexact source mapping付きでreference harnessへコピー
3. 新TypeScript Engineと同じ関数をexpected生成に使うことは禁止

Reference harnessがDOM依存部分を必要とする場合、計算層だけを明示的に抽出する。

Reference sourceとnew engineの系統を分けること。

---

# 10. Golden Baseline

旧HTML referenceから複数caseを実測し、

```text
tests/fixtures/legacy-v01-golden.json
```

等へ固定してください。

最低限:

## G1 — Default

旧初期値:

```text
H = 2.40
D = 1.60
O = 0.30
W = 6.00
L = 35.2
A = 0
G = 1.00
R = 0.20
SKY = 2.0
```

引継書記載のsanity range:

```text
annual reduction ≈ 44.05%
cooling reduction ≈ 57.95%
heating reduction ≈ 35.13%
no-overhang annual ≈ 25,890 kWh
```

ただしこれらをexact expectedとして手入力しない。

actual legacy executionからexact baselineを取得してください。

## G2 — D = 0

```text
all reduction rates ≈ 0
```

## G3 — Azimuth symmetry

```text
A = -30°
A = +30°
```

legacy modelで対称になること。

## G4 — Width scaling

Wのみ変更。

* absolute valueは線形
* reduction rate不変

## G5 — η scaling

Gを1/2。

* absolute valueは1/2
* reduction rate不変

## G6 — Geometric similarity

旧引継書の「D/Hだけ一定」は誤り。

少なくとも、

```text
D/H
O/H
```

をともに一定としてHをスケールした場合の相似性を確認。

D/Hだけ一定、O固定では同一にならないこともregressionとして残せるなら残す。

---

# 11. Golden Comparison Acceptance

new Pure TypeScript Legacy Engineとoriginal HTML referenceについて、

* monthly without-overhang
* monthly with-overhang
* annual summary
* cooling-period summary
* heating-period summary
* reduction rates

を比較。

Toleranceはactual numerical behaviorを見て設定。

不用意に緩いToleranceにしない。

原則:

```text
floating-point representation差のみ許容
```

を目標。

差異が出る場合は、

* rounding
* iteration order
* time step
* strip center
* degree/radian
* array indexing

等を切り分ける。

差異を「改善」として勝手に採用しない。

---

# 12. Engine Boundary Test — QD-M1-001

M0 AdvisoryをM1で処理してください。

現行testはmanifest metadataだけを確認しています。

M1では機械的に、

```text
src/engine/**
```

から以下への依存を拒否するtest/lintを追加:

```text
react
react-dom
window
document
HTMLCanvasElement
CanvasRenderingContext2D
navigator
```

必要に応じて合理的なallow-listを定義可。

少なくともReact / DOM / Canvasへの依存が入ればtest failureになること。

QD-M1-001を解消できた場合はEvidenceを記録。

---

# 13. Documentation

最低限更新:

```text
README.md
AGENTS.md
docs/ROADMAP.md
docs/MODEL_LIMITATIONS.md
```

追加推奨:

```text
docs/LEGACY_BASELINE.md
```

内容:

* legacy source hashes
* parameter mapping
* units
* conventions
* reference harness方法
* Golden fixture一覧
* Legacy baselineは物理的正解ではないこと
* Known issues
* M2で変更予定の境界

M1完了時点で、

```text
M1 = legacy behavior reproduction complete
M2 = weather model replacement
```

が明確になるようにする。

---

# 14. Minimal UI

本格Simulator UIへはまだ移行しない。

ただしM0表示が完全にstaleにならないよう、

必要なら最小限、

```text
M1 — Engine Baseline
Legacy calculation baseline available
```

程度のstatus更新は可。

入力フォーム、チャート、断面図等の移植はM1スコープ外。

---

# 15. Required Checks

最低限:

```text
npm test
npm run typecheck
npm run build
npm audit
git diff --check origin/main...HEAD
```

加えて:

```text
legacy source hash verification
legacy committed-byte hash verification
legacy reference harness
Golden fixture generation verification
Golden comparison tests
engine dependency boundary test
public repository secret/privacy scan
```

を実行。

---

# 16. Acceptance Criteria

1. M0 post-merge stateがcloseoutされている。
2. M1 Long-Run Artifactが作成されdigest binding済み。
3. 旧MVP HTMLと引継書がbyte-for-byte preservationされSHA-256記録済み。
4. Git上のlegacy artifact bytesがintake sourceと一致。
5. Legacy calculation layerがPure TypeScriptとして分離されている。
6. React / DOM / Canvas依存がengineへ存在しない。
7. Original HTMLと独立したreference executionが成立。
8. Golden fixturesがreferenceから生成されている。
9. Golden casesでnew engineとlegacy referenceが設定Tolerance以内で一致。
10. D=0、azimuth symmetry、W scaling、η scalingをtest。
11. D/H + O/H similarityをtest。
12. legacy baselineのKnown Issuesを修正していない。
13. README / AGENTS / ROADMAP / MODEL_LIMITATIONS / LEGACY_BASELINEが整合。
14. test / typecheck / build / audit / diff checkがPASS。
15. Public Repository境界を維持。
16. main / Ready / merge / Vercel / Productionへ進んでいない。

---

# 17. Non-goals

M1では実装しない:

```text
EPW
拡張アメダス
Perez天空モデル
Clear Skyモデルの修正
k_sky廃止
全365日モデルへの変更
高精度太陽位置
全方位Geometryの再設計
有限幅庇
腰壁新Geometry
glass IAC
複数Case UI
グラフ
断面図移植
CSV / PDF
Vercel
GitHub Actions CI
Production
```

---

# 18. Git / PR Policy

禁止:

```text
main直接変更
force push
rebase
branch削除
Ready for Review
merge
auto-merge
Vercel
Production
Release
Repository visibility変更
Permission変更
Secret変更
```

許可:

```text
fresh branch作成
normal commit
normal push
Draft PR作成
```

Draft PR creationはM1 Completion時に許可します。

Expected:

```text
main @ b633a2b...
↓
feat/m1-engine-baseline
↓
Long-Run Waves
↓
full convergence
↓
push
↓
Draft PR
↓
STOP
```

---

# 19. Wave Plan

## Wave 0 — Preflight / M0 Closeout

* fresh main
* worktree
* source files存在確認
* M0 post-merge closeout
* M1 Task Packet

Checkpoint必須。

## Wave 1 — Legacy Source Intake

* `.gitattributes` preservation
* hashes
* byte verification
* privacy scan

Checkpoint必須。

## Wave 2 — Reference Harness

* original legacy calculation execution
* fixture generation経路

Checkpoint必須。

## Wave 3 — Pure TS Legacy Engine

* types
* constants
* solar
* shading
* simulation
* summary

Checkpoint必須。

## Wave 4 — Golden Tests

* G1〜G6
* reference vs new engine
* boundary test強化

Checkpoint必須。

## Wave 5 — Documentation / Minimal Status

Checkpoint必須。

## Wave 6 — Full Convergence

新機能追加停止。

* all tests
* typecheck
* build
* audit
* diff
* source hash
* Golden evidence
* privacy
* full self-review

## Wave 7 — Draft PR

* branch push
* Draft PR作成
* fresh PR state確認
* Human Gate

---

# 20. Hard Stop Conditions

即停止:

```text
origin/main != b633a2b9651b63ea1224f8a4becefa1062a6b12d at initial preflight
MVP source missing
source hash変化
unexpected encoding normalization
reference harnessがoriginal behaviorを独立実行できない
new engineとlegacy referenceの差を説明できない
Task Packet digest mismatch
unexpected dirty user changes
security/privacy/permission/data-integrity failure
scope expansion required
```

Hard Gate failureはQuality Debt化禁止。

---

# 21. Completion Report

```text
# Facade Solar Lab — M1 Engine Baseline Completion Report

Run ID:
Mode:
Task Packet:
Digest:

Initial base:
Branch:
Final head:

M0 closeout:
-

Legacy intake:
- HTML path:
- HTML SHA-256:
- Handover SHA-256:
- committed-byte verification:

Reference harness:
- method:
- independent from new engine:
- result:

Engine:
- files:
- public API:
- UI dependency:
- DOM dependency:

Golden:
- G1:
- G2:
- G3:
- G4:
- G5:
- G6:
- monthly comparison:
- tolerance:

QD-M1-001:
- status:

Checks:
- npm test:
- typecheck:
- build:
- audit:
- diff:
- secret/privacy:

Quality Debt:

Explicit unverified items:

Known differences from legacy:

Changed files:
Commits:

PR:
- number:
- URL:
- OPEN:
- Draft:
- Ready:
- merged:

main mutation:
Vercel mutation:

Human Gate:
STOP

Next recommended task:
M2 — Weather Foundation
```

完了後、M2へ自動進行しないこと。

**Draft PRを作成し、Independent FULL Review待ちで停止してください。**

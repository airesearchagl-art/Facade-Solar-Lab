# Task Packet Snapshot

- Task Packet ID: `LRP-20260912-FSL-M0-001`
- Revision: `1`
- Snapshot policy: immutable after Wave 0
- Public-boundary normalization: user-specific absolute paths are represented as `<PROJECT_ROOT>` or `<USER_HOME>\...`.

---
# Facade Solar Lab — M0 Bootstrap / Long-Run Foundation

Facade Solar Lab の本開発を開始してください。

今回は通常の短時間Taskではなく、**LONG_RUN_ENDURANCE** を明示的に許可します。

```yaml
run_id: LR-20260912-FSL-M0-001
task_packet_id: LRP-20260912-FSL-M0-001
task_packet_revision: 1

execution_mode: LONG_RUN_ENDURANCE
horizon: EXTENDED

human_explicit_long_run_authorization: true
human_explicit_long_run_authorization_source: "2026-09-12 Human instruction: 長期間の長時間開発が回る仕組みで進める"

human_explicit_endurance_authorization: true
human_explicit_endurance_authorization_source: "2026-09-12 Human instruction: ある程度安定性は後で確保し、長期間の長時間開発を優先する"
```

ただし、LONG_RUN_ENDURANCEはHuman Gateを緩和する許可ではありません。

---

# 1. Project

```text
Project:
Facade Solar Lab

Local root:
<PROJECT_ROOT>

GitHub:
https://github.com/airesearchagl-art/Facade-Solar-Lab.git

Expected repository:
airesearchagl-art/Facade-Solar-Lab

Default branch:
main
```

現在GitHub Repositoryは作成直後で、実装commitが存在しない可能性があります。

最初に必ずfresh preflightを実施してください。

---

# 2. Product Objective

Facade Solar Lab は、建物ファサードについて、

* 方位

  * 南
  * 東
  * 西
  * 北
  * 中間方位
* 窓下端高さ
* 窓上端高さ
* 窓高さ
* 窓幅
* 腰壁の有無
* FLから立ち上がる全面窓
* 庇の出幅
* 庇の設置高さ
* 庇と窓の位置関係
* 将来的には庇の有限幅・左右張出
* ガラスの日射熱取得性能
* 地点・気象条件

などを変更し、

**年間／夏季／冬季の日射熱取得量と遮蔽効果の違いを比較する設計初期向けWebツール**

として開発します。

目的は省エネ計算ソフトそのものではありません。

```text
形状を変更
↓
日射熱取得への影響を即時確認
↓
複数案を比較
↓
意匠デザインと日射性能を往復
↓
窓・庇計画の設計判断に使う
```

という設計支援ツールです。

最終的な設計判断はHumanが行います。

---

# 3. Existing MVP

既存のMVP v0.1があります。

名称:

```text
南面庇 日射熱取得 簡易シミュレータ
```

主成果物候補:

```text
solar_overhang_simulator.html
HANDOVER_solar_overhang_simulator.md
```

既存MVPは単一HTMLで、

* HTML
* CSS
* JavaScript
* Canvas 2D

が1ファイルに入っています。

MVPは本開発の叩き台であり、正しい最終モデルとはみなしません。

## 重要

ローカルworkspace内に上記MVP原本が存在する場合:

* 内容を書き換えない
* normalizeしない
* formatterを掛けない
* 改行コードも意図なく変更しない
* `legacy/mvp-v0.1/` 配下へ原本として保存する
* SHA-256をEvidenceへ記録する

MVP原本がworkspaceに存在しない場合:

* 内容を推測して再生成しない
* Chatや一般知識から復元しない
* `Explicit unverified items` に「MVP原本未配置」と記録する
* Bootstrap可能な範囲は継続してよい
* MVP保存を完了扱いにしない

---

# 4. Known MVP Issues

以下は既に確認済みのKnown Issuesです。

勝手に「修正済み」と扱わないでください。

### P1 — Weather model

現MVPはASHRAE Clear Skyモデルを年間へ適用しており、絶対日射量が構造的に過大。

`k_sky` は物理モデルではない経験係数。

将来は、

* EPW
* 拡張アメダス等

の時刻別実気象データ経路へ置換予定。

### Geometry

「D/H一定なら削減率不変」という旧記述は不十分。

庇～窓頭距離 `O` が存在するため、

```text
D/H
O/H
```

双方を考慮する必要がある。

### Section diagram

旧MVPで「夏至／冬至」と表示している断面図は、実装上は月代表日を使用している。

### Balance indicator

旧MVPの

```text
冷房期削減率 - 暖房期削減率
```

は独自の夏冬選択性指標であり、

* エネルギー最適
* コスト最適
* 真の庇最適値

を意味しない。

またD=0でも「庇が深すぎ」と表示し得る既知のUIロジック問題がある。

### Absolute value

実気象Validation完了前の `[kWh]` は正式な実務判断根拠に使用しない。

---

# 5. 今回のTask — M0 Bootstrap

今回の目的は**機能を増やすことではありません。**

本格的な長時間開発を何度でもCheckpoint / ResumeできるRepositoryへすることが目的です。

## M0で実施すること

### A. Repository Preflight

必ず最初に確認:

```text
- Local directory existence
- git repository状態
- origin
- remote repository
- origin/mainの存在有無
- current branch
- current HEAD
- working tree
- pre-existing files
- Node / npm versions
- Git / GitHub CLI availability
- push availability
```

既存ファイル・dirty stateを勝手に削除しない。

---

### B. Architecture foundation

基本構成は以下を採用してください。

```text
Frontend:
Vite + TypeScript + React

Calculation Engine:
UI framework非依存のPure TypeScript

Test:
Vitest

Backend:
なし

Database:
なし

Deployment:
将来 Vercel

Primary runtime:
Browser
```

Reactへ計算ロジックを埋め込まないでください。

将来の計算Engineは、

```text
Browser UI
Node.js
batch test
validation scripts
```

から共通利用できる構造にします。

---

### C. Initial repository structure

過剰実装せず、最低限以下の方向で作成してください。

```text
Facade-Solar-Lab/
├─ README.md
├─ AGENTS.md
├─ package.json
├─ tsconfig*.json
├─ vite.config.*
├─ index.html
│
├─ src/
│  ├─ app/
│  ├─ engine/
│  ├─ models/
│  ├─ weather/
│  └─ main.*
│
├─ tests/
│
├─ docs/
│  ├─ PRODUCT_DIRECTION.md
│  ├─ MODEL_LIMITATIONS.md
│  ├─ ROADMAP.md
│  └─ VALIDATION_PLAN.md
│
├─ legacy/
│  └─ mvp-v0.1/
│
└─ .agent-run/
   └─ LR-20260912-FSL-M0-001/
```

必要性がなければ空ディレクトリを大量に作らなくてよいです。

`.gitkeep`乱用は禁止。

---

# 6. Long-Run Run Artifact

今回のCampaignについて、最低限以下を作成してください。

```text
.agent-run/LR-20260912-FSL-M0-001/
├─ RUN_MANIFEST.md
├─ TASK_PACKET_SNAPSHOT.md
├─ RUN_STATE.md
├─ TASK_QUEUE.md
├─ QUALITY_DEBT.md
├─ DECISIONS.md
└─ EVIDENCE.md
```

Task Packet Snapshotは、この指示内容を基準にimmutable snapshot化する。

SHA-256 digestを計算し、

```text
RUN_MANIFEST.md
RUN_STATE.md
EVIDENCE.md
```

へ記録する。

Checkpointごとに同じTask Packet ID / revision / digestへbindingしてください。

## RUN_STATE必須項目

```text
Run ID
Mode
Horizon
Current state
Repository
Working branch
Base SHA
Current head
Current wave
Last successful checkpoint

Task Packet ID
Task Packet revision
Task Packet snapshot path
Task Packet SHA-256

Objective

Acceptance Criteria
- status
- evidence

Completed

Current implementation state

Checks

Quality Debt

Explicit unverified items
- 0件でも none と明記

Known failures

Decisions

Files changed

Remaining tasks

Next action

Stop conditions status

Resume instructions
```

Conversation memoryへ依存せず、`RUN_STATE.md`だけから次Sessionが再開できる内容にしてください。

---

# 7. Public Repository Boundary

現在RepositoryはPublicである可能性があります。

したがって、commit対象には以下を入れないこと。

```text
- Secret
- Token
- Credential
- 実顧客名
- 実案件名
- 未公開設計情報
- 個人情報
- API key
- private URL
```

また、公開Repositoryへ個人環境を不要に露出させないため、

```text
<USER_HOME>\...
```

という絶対ローカルパスをREADME・docs・Run Artifact等のcommit対象へ複製しないでください。

Repository内では原則、

```text
<PROJECT_ROOT>
repo root
```

等で表現してください。

ローカルpreflight logに必要な場合のみ、外部公開されない場所で扱うこと。

---

# 8. Minimal UI

M0では本格UIを作らない。

最低限、

```text
Facade Solar Lab
M0 — Development Bootstrap
```

がBrowserで表示され、

開発環境が成立したことを確認できれば十分です。

旧MVPを新UIへ移植しない。

計算Engineの移植はM1です。

---

# 9. Documentation

## README.md

最低限:

* Facade Solar Labの目的
* Current state
* Development status
* Local development commands
* Build commands
* Test commands
* Project structure
* 現在はM0であること
* MVP v0.1はlegacyであること
* 絶対値を正式性能評価へ使えないこと

## PRODUCT_DIRECTION.md

このTaskに記載したProduct Objectiveを整理。

## MODEL_LIMITATIONS.md

MVPの既知課題を記録。

## ROADMAP.md

以下をCurrent Roadmapとして記録。

```text
M0 — Bootstrap
M1 — Engine Baseline
M2 — Weather Foundation
M3 — Facade Geometry
M4 — Comparison UX
M5 — Validation / Stability
M6 — Vercel Operation
```

## VALIDATION_PLAN.md

将来最低限、

```text
- Golden Test
- Geometry test
- Weather validation
- third-party solar analysis comparison
- boundary test
```

を行うことを記録。

まだ結果は捏造しない。

---

# 10. Minimum Tests

M0ではTestを過剰に作らない。

最低限:

```text
npm install
npm test
npm run build
npm run typecheck
```

相当が成立する構成にする。

まだGitHub Actionsは必須としません。

「安定性の完全構築」より、

```text
Long Run
Checkpoint
Resume
Project structure
Buildable baseline
```

を優先します。

---

# 11. Git Policy

## Hard prohibition

以下は禁止。

```text
- mainへの直接commit
- mainへのpush
- Ready for Review
- merge
- auto-merge
- force push
- branch delete
- Production deploy
- Release
- Repository visibility変更
- Permission変更
- Branch Protection変更
- Secret / Credential操作
- destructive data operation
```

---

# 12. Empty Repository Special Rule

このRepositoryは初回Bootstrapのため、`origin/main`にcommitが存在しない可能性があります。

### origin/main が存在する場合

```text
main
↓
chore/m0-bootstrap-long-run
↓
implementation
↓
checks
↓
checkpoint commit
↓
push
↓
Draft PR
↓
STOP
```

### origin/main が存在しない場合

**mainを勝手に作成・pushしてはいけません。**

次の流れとする。

```text
local initialization
↓
chore/m0-bootstrap-long-run
↓
M0 implementation
↓
local checks
↓
local checkpoint commit
↓
STOP
```

この場合、

```text
BLOCKED — initial main bootstrap requires Human Gate
```

として報告してください。

originへ最初のbranchをpushした結果、意図せずdefault branchが変わる可能性もあるため、remoteが完全emptyの場合は勝手にfirst pushしないでください。

Humanへ、

```text
- local branch
- local head SHA
- commit
- changed files
- checks
- remote state
- main bootstrapに必要な次操作
```

を返して停止してください。

---

# 13. Wave Plan

以下を目安に進める。

## Wave 0 — Preflight

Repository / local / remote / tools確認。

Checkpoint必須。

## Wave 1 — Long-Run foundation

Task Packet / Run Artifact / Resume contract構築。

Checkpoint必須。

## Wave 2 — Project bootstrap

Vite / TypeScript / React最小構成。

Checkpoint必須。

## Wave 3 — Documentation

README / Product Direction / Limitations / Roadmap / Validation Plan。

Checkpoint必須。

## Wave 4 — MVP preservation

MVP原本が存在する場合のみlegacyへ固定保存。

原本が無ければmissing evidenceを記録し、推測生成は禁止。

Checkpoint必須。

## Wave 5 — Convergence

* full diff review
* tests
* build
* typecheck
* security/privacy check
* explicit unverified items整理
* final RUN_STATE更新

新機能追加は禁止。

---

# 14. Acceptance Criteria

以下をM0 Acceptance Criteriaとする。

1. Repositoryが開発可能なVite + TypeScript + React構成になっている。
2. Calculation Engine用領域がUIから分離可能な構造になっている。
3. 最小Web画面がlocal build可能。
4. `npm test` / `npm run build` / `npm run typecheck` がPASSする。
5. Long-Run Run Artifact一式が存在し、Task Packet digest bindingが成立している。
6. `RUN_STATE.md`から別Sessionが再開できる。
7. Product Direction / Limitations / Roadmap / Validation Planが文書化されている。
8. MVP原本が提供済みならimmutable legacyとして保存されている。
9. MVP原本が無ければ、その事実をExplicit unverified itemsとして正確に保持している。
10. Secret・実案件情報・不要な個人情報をPublic Repositoryへ追加していない。
11. main / Ready / merge / Production等のHuman Gateを越えていない。
12. 最終diffを自己レビューし、scope逸脱がない。

---

# 15. Non-goals

今回実装しない。

```text
- EPW parser本実装
- 拡張アメダス本実装
- 旧計算Engine移植
- 計算精度修正
- 全方位計算
- 腰壁Geometry
- 有限庇3D計算
- Perez天空モデル
- ガラスIAC
- 複数Case比較
- 本格UI
- CSV / PDF export
- Vercel接続
- Production deploy
```

これらは後続Milestone。

---

# 16. Hard Stop Conditions

以下では即停止。

```text
- repository identity mismatch
- unexpected existing main history
- pre-existing user changesとの衝突
- destructive operationが必要
- credential / permission変更が必要
- scope外変更が必要
- Task Packet digest mismatch
- Run State破損
- Security / Privacy / Permission / Data-integrity failure
- origin/main不存在の状態でremote初回pushが必要
```

Security / Privacy / Authentication / Permission / Data-integrity / irreversible-data safetyに関するFailureはQuality Debt化禁止。

即時:

```text
BLOCKED
→ Human Gate
```

とする。

---

# 17. Quality Debt

LONG_RUN_ENDURANCEとして、

```yaml
allow_defer_noncritical_checks: true
allow_defer_external_preview: true
allow_defer_flaky_noncritical_test: true
high_risk_debt_blocks_final_verify: true
```

としてよい。

ただし、未検証項目は必ず

```text
Explicit unverified items
```

へ残す。

未検証をPASS扱いしない。

---

# 18. Completion State

すべて確認できた場合:

```text
COMPLETE_VERIFIED
```

Required Checkが残る場合:

```text
COMPLETE_PENDING_FULL_VERIFY
```

Human authorityが必要な場合:

```text
BLOCKED
```

今回のTaskでは、Ready / merge / Productionまで進めない。

---

# 19. 最終報告形式

作業終了時は必ず以下で返してください。

```text
# Facade Solar Lab — M0 Bootstrap Completion Report

Run ID:
Execution Mode:
Horizon:

Task Packet:
- ID:
- revision:
- SHA-256:

Final State:

Repository:
Local root:
Remote state:

Base:
Working branch:
Head:

Commits:

Changed files:

MVP preservation:
- HTML:
- Handover:
- SHA-256:
- missing items:

Implemented:
-

Checks:
- npm test:
- npm run typecheck:
- npm run build:
- other:

Hard Checks:
- Security:
- Privacy:
- Permission:
- Data integrity:

Quality Debt:
-

Explicit unverified items:
-

Known failures:
-

Checkpoint / Resume:
- last checkpoint:
- RUN_STATE:
- resume status:

GitHub:
- branch push:
- Draft PR:
- main mutation:
- Ready:
- merge:

Vercel:
- mutation:
- Production:

Human Gate:
-

Documentation Sync Trigger:
yes

Suggested Notion update:
-

Suggested Obsidian Vault targets:
-

Next recommended task:
M1 — Engine Baseline
```

## 最後の指示

完了条件を満たしたからといって、M1へ自動的に進まないでください。

**M0の成果とEvidenceを確定し、Human Gateで停止してください。**

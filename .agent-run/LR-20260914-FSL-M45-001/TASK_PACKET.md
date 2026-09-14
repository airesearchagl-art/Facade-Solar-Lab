# Facade Solar Lab — M4.5 Multi-floor Mode Implementation

## Human Authorization

APPROVED.

M4はCOMPLETEです。
M5 Validation / Stabilityへ進む前に、
新しい機能拡張milestoneとして

M4.5 — Multi-floor Mode

を実装してください。

今回の主目的は「複数階対応」です。

PDFの任意Caseカラー選択は今回の必須scopeには含めず、
後続bounded follow-upへ残してください。

────────────────────────
0. Repository / Fresh Gate
────────────────────────

Repository:
airesearchagl-art/Facade-Solar-Lab

Expected canonical main:
35f543e618b8ad70ecc746b3139a5fb09adbeca9

M4:
COMPLETE

M5:
NOT STARTED

開始時に:

git fetch origin

確認:

- origin/main ==
  35f543e618b8ad70ecc746b3139a5fb09adbeca9
- working tree clean
- PR #5 MERGED
- PR #6 MERGED

main driftがあれば、
新しいmainを報告してSTOP。
勝手に古いSHAからbranchを作らないこと。

Fresh Gate成立後、

branch:

feat/m45-multifloor-mode

をexact mainから作成。

main direct write禁止。

────────────────────────
1. M4.5 principle
────────────────────────

重要:

既存の単一階engine
`facade-v1-weather`

を書き換えて複数階化しない。

現在のFacadeV1Parameters:

- facade azimuth
- one rectangular opening
- optional one horizontal overhang
- SHGC
- ground reflectance

というsingle facade calculationを
各階に対して再利用する。

Multi-floor layer:

Building Case
  └ Floors[]
       └ existing FacadeV1Parameters
            └ simulateFacadeV1()

というcompositionにする。

solar / weather / shadow formulaを複製しない。

`simulateFacadeV1`をcanonical calculationとして維持。

計算式変更が必要になった場合は、
勝手に変更せずBLOCKED + Human Gate。

────────────────────────
2. UI mode
────────────────────────

現在の単一階Workspaceを維持した上で、
ユーザーが明確に選べる2モードを作る。

例:

[ 単一階モード ] [ 複数階モード ]

単一階モード:

- M4の現在UI・機能を維持
- 1–4 Case比較
- EPW
- PDF
- CSV
- JSON preset
- geometry
- monthly chart
- baseline delta

をregressionさせない。

複数階モードは別Workspaceとして実装。

モード切替で単一階データを自動変換・破壊しない。

可能ならsession中は
Single / Multiそれぞれの状態を保持。

────────────────────────
3. Multi-floor building model
────────────────────────

新しいPure TypeScript domainを作る。

推奨:

src/multifloor/

例:

types.ts
case.ts
validation.ts
simulation.ts
aggregate.ts
difference.ts
index.ts

既存comparison domainを無理に破壊的変更しない。

概念モデル:

MultiFloorCase
- id
- name
- facadeAzimuthDegFromNorth
- groundReflectance
- floors[]

MultiFloorDefinition
- id
- name / label
- floorHeightM
- opening
- overhang
- solarHeatGainCoefficient

floorは下階→上階順。

default labels:

1F
2F
3F
...

ユーザーが名称変更できてもよい。

────────────────────────
4. Floor inputs
────────────────────────

各階ごとに最低限、次を設定可能にする。

基本:

- 階名称
- 階高 [m]
- 開口幅 [m]
- 開口高さ [m]
- 腰壁高さ / sill height [m]
- SHGC

開口について:

opening head =
sill height + opening height

として導出可能。

必要なら既存geometryとの整合のため
opening center Xも保持してよい。

庇:

- 有効 / 無効
- 出幅 depth [m]
- 庇高さ / elevation [m]
- 左側延長 [m]
- 右側延長 [m]

庇高さは各階床レベル基準のlocal coordinateとして扱う。

表示上のabsolute Zは、
下階のfloorHeight累積から導出する。

Facade azimuthは原則building Case共通。

ground reflectanceもbuilding Case共通。

SHGCは階ごとに変更可能。

────────────────────────
5. Geometry validation
────────────────────────

最低限:

floorHeightM > 0

openingWidthM > 0

openingHeightM > 0

sillHeightM >= 0

sillHeightM + openingHeightM <= floorHeightM

overhang depth >= 0

overhang elevationが
floor local geometryとして有効

left/right extension >= 0

SHGC:
0 < SHGC <= 1

groundReflectance:
0 <= value <= 1

non-finite拒否。

silent clamp禁止。

invalid input時は
Runを無効化し、
日本語で原因表示。

────────────────────────
6. Calculation semantics
────────────────────────

各Floorについて
既存`simulateFacadeV1`を1回実行。

Floor result:

- Annual solar heat gain [kWh]
- Summer Apr–Sep [kWh]
- Winter Oct–Mar [kWh]
- monthly 1–12 [kWh]

Building total:

各Floorの結果を単純合算。

total annual =
sum(floor annual)

total summer =
sum(floor summer)

total winter =
sum(floor winter)

monthly[n] =
sum(each floor monthly[n])

これは引き続き:

Solar Heat Gain

であり、

HVAC cooling/heating loadではない。

UI/PDFでもこの注意書きを維持。

────────────────────────
7. Comparison semantics
────────────────────────

複数階モードでも
1–4 Building Caseを比較可能にする。

baseline Caseを選択可能。

Building totalについて:

case - baseline

の

- Annual delta
- Summer delta
- Winter delta
- monthly delta
- percent delta

を表示。

Floor-levelについては最低限:

各Case内の各階について

- Annual
- Summer
- Winter
- monthly

を表示する。

異なるBuilding Case間で
floor countやfloor IDが違う場合の
無理なfloor-to-floor delta alignmentは
今回必須にしない。

Building total comparisonをcanonical comparisonとする。

必要ならUIに:

「建物全体差には階数・開口面積差も含まれます」

と明示。

────────────────────────
8. Floor editing UX
────────────────────────

複数階Workspaceでは:

- Floor追加
- Floor複製
- Floor削除
- Floor名称変更
- Floor順序の維持

を可能にする。

最低1 Floor必須。

Floor複製時はdeep copy。

Case複製時は
全Floorをdeep copy。

Floor編集後は
既存M4と同様にresultsをstale状態へ。

再Runまで旧結果を最新結果として見せない。

────────────────────────
9. Visible MVP first
────────────────────────

実装途中で早い段階に
目で確認できるVertical Sliceを作る。

追加:

「複数階デモを試す」

例:

3階建て
Case A / Case B

Case A:
各階 overhang depth 0.8 m

Case B:
1F 0.8 m
2F 1.2 m
3F 1.6 m

など、
階別設定差が視覚的に分かる構成。

weatherはM4 demoと同じく
deterministic synthetic weatherでよい。

必ず:

synthetic / not measured /
validation evidenceではない

と表示。

目的:

実装完了までUIが見えない状態にしない。

────────────────────────
10. Geometry visualization
────────────────────────

複数階モード専用の
stacked building geometry viewを追加。

最低限:

Elevation:

- floor lines
- floor labels
- opening rectangles
- overhang lines/planes
- cumulative building height

Section:

- each floor
- opening
- sill
- overhang
- floor-to-floor heights

を積層表示。

各Floor geometryは
既存geometry conventionを尊重。

可視化のために
solar calculationを別実装しない。

既存6/21・12/21 reference rayを
複数階表示へ適用可能なら利用。

ただし複雑になりすぎる場合は
selected Floorだけreference ray表示でもよい。

────────────────────────
11. Results UX
────────────────────────

複数階結果画面を最低限:

A. Building Total
B. Floor Breakdown

に分ける。

Building Total:

- Case comparison cards/table
- annual
- summer
- winter
- baseline delta
- monthly chart
- monthly table

Floor Breakdown:

Caseを選択して

| Floor | Annual | Summer | Winter |

を一覧。

さらにFloor選択で
12か月monthly detailを見られるようにする。

結果を全部同時に出して
画面を過密にしない。

────────────────────────
12. PDF / print
────────────────────────

複数階モードからPDF出力可能にする。

最低限:

- weather provenance
- Building Case comparison
- Annual / Summer / Winter
- monthly comparison
- building-level baseline delta
- 各CaseのFloor Breakdown
- stacked geometry
- assumptions
- non-HVAC warning

を含む。

Caseが複数ある場合、
全Caseのmulti-floor geometryをreportに含める。

ページ数が増えてもよい。
clipping / overlapを避ける。

今回:

「Caseカラーを任意選択する機能」

は必須scope外。

ただし現在のCase識別色が
browser / PDFで可能な範囲で保持されてもよい。

色指定機能は後続Taskへ残す。

────────────────────────
13. CSV export
────────────────────────

Multi-floor専用CSVを用意。

最低限:

Building rows:
- Case
- Total Annual
- Total Summer
- Total Winter
- baseline delta
- monthly 1–12

Floor rows:
- Case
- Floor ID/name
- floor height
- opening inputs
- overhang inputs
- SHGC
- Annual
- Summer
- Winter
- monthly 1–12

M4既存CSVと同じ:

- UTF-8 BOM
- CRLF
- CSV escaping
- formula injection protection

を維持。

────────────────────────
14. JSON preset
────────────────────────

既存Single-floor presetを壊さない。

既存kind/schemaを
意味変更しない。

Multi-floor用に新しいkindを追加。

例:

facade-solar-lab-multifloor-case-preset
facade-solar-lab-multifloor-workspace-preset

schemaVersion:
1

保存対象はinputのみ。

含めない:

- calculation results
- raw weather
- EPW bytes
- browser-local path
- secrets

Workspace presetでは:

- Cases
- Floors
- baseline Case
- selected Case
- selected Floor
- shared building inputs

を復元。

import後は
結果なし / explicit rerun required。

────────────────────────
15. Single-floor backward compatibility
────────────────────────

最重要Acceptance Criterion。

既存Single-floor modeについて:

M4 behaviorを変えない。

さらにequivalence testを追加。

同じweather / geometry / SHGC / ground条件で:

Single-floor result

と

Multi-floor modeの1 FloorだけのBuilding total

が一致すること。

期待:

Annual exact agreement
Summer exact agreement
Winter exact agreement
monthly 12 values exact agreement

floating point aggregationで差が出る場合も
1-floorでは原則exact equalityを目標。

────────────────────────
16. Architectural boundary
────────────────────────

Pure TypeScript:

src/multifloor/**

には禁止:

- React
- DOM
- Canvas
- File API
- Node filesystem

browser-specific UIは
src/app/**のみ。

existing boundary scanへ
src/multifloor/**
を追加。

App.tsxがすでに大きいため、
複数階UIをすべてApp.tsxへ追記しない。

推奨components:

MultiFloorWorkspace.tsx
MultiFloorCaseEditor.tsx
FloorEditor.tsx
MultiFloorResults.tsx
MultiFloorGeometryPreview.tsx

必要に応じてさらに分割。

既存Single-floor workspaceも、
安全にできる範囲でcomponentへ分離可。

ただし大規模refactorを目的化しない。

────────────────────────
17. Tests
────────────────────────

最低限追加:

domain:
- 1 floor
- 3 floors
- floor add/duplicate/delete
- Case deep copy
- invalid floor height
- invalid sill/opening head
- invalid SHGC
- aggregate annual
- aggregate summer
- aggregate winter
- aggregate monthly 12
- building baseline delta
- one-floor equivalence
- dirty/rerun semantics

preset:
- Case round-trip
- Workspace round-trip
- multi-floor ordering
- duplicate floor IDs rejection
- invalid schema/kind
- input-only evidence
- results/raw weather excluded

UI:
- mode switch
- Single mode regression
- Multi mode render
- Floor add/edit/delete
- Run
- building results
- floor results
- stale state
- export enable/disable

boundary:
src/multifloor/** Pure TS enforcement

────────────────────────
18. Regression gate
────────────────────────

必須:

npm test
npm run typecheck
npm run build
npm audit
npm run golden:check
git diff --check

既存:

M1
M2
M3
M4

regressionを維持。

既存Single-floor Human Browser Acceptanceを
毎commit再実施する必要はないが、
最終PreviewでSingle/Multi両方をbrowser smokeする。

────────────────────────
19. Documentation
────────────────────────

このrepository内の:

README.md
docs/ROADMAP.md
docs/VALIDATION_PLAN.md

をcurrent stateへ同期。

Roadmap:

M4 — Complete
M4.5 — Multi-floor Mode — Current
M5 — Validation / Stability — Planned
M6 — Vercel Operation — Planned

とする。

M5の意味は変更しない。

第三者solver validationは
引き続きM5。

absolute kWhのformal validation未完了warningを維持。

────────────────────────
20. Run Artifact
────────────────────────

新しいM4.5専用Run Artifactを作成。

推奨:

.agent-run/LR-20260914-FSL-M45-001/

新しいimmutable Task Packet snapshotを作り、
digest bindingを行う。

M4 artifactは歴史記録として変更しない。

M4.5のAcceptance Criteria / evidence /
state / queueをM4とは分離する。

────────────────────────
21. Vercel
────────────────────────

feature branch pushによる
Git-triggered Previewを使用。

Preview:

- source=git
- branch=feat/m45-multifloor-mode
- target=null
- READY
- exact source SHA

を確認。

manual Preview禁止。

Production操作禁止。

mainへのmerge禁止。

────────────────────────
22. Human UX Gate
────────────────────────

Draft PR作成前またはDraft中に、
Exact-head PreviewをHumanが確認できる状態にする。

Human確認ポイント:

- 単一階 / 複数階 切替
- 3階建て作成
- 各階の階高変更
- 開口幅/高さ
- 腰壁高さ
- 庇出幅
- Floor追加/複製/削除
- Case A/B比較
- Building total
- Floor breakdown
- monthly
- stacked geometry
- JSON save/load
- CSV
- PDF

UIが使いにくければ、
formal review前にVisible MVP修正を優先。

────────────────────────
23. Draft PR / STOP
────────────────────────

実装・local validation・Exact-head Previewが
収束したらDraft PRを作成。

Ready化しない。
mergeしない。
Production操作しない。
M5を開始しない。

Completion Report:

# M4.5 Multi-floor Mode Completion Report

Fresh base:

Branch:

Run ID:

Task Packet digest:

Product architecture:
- Single-floor regression:
- Multi-floor domain:
- canonical engine reuse:

Implemented:
- Mode switch:
- Floor model:
- Floor editing:
- Building aggregation:
- Floor results:
- Geometry:
- PDF:
- CSV:
- JSON preset:

Tests:
- total:
- new focused:
- single/multi equivalence:
- typecheck:
- build:
- audit:
- golden:
- diff check:

Vercel:
- deployment:
- URL:
- target:
- READY:
- exact source:

Browser smoke:
- Single-floor:
- Multi-floor:
- responsive:
- console:
- assets:

Known limitations:

Product source changes:

Draft PR:

Ready:
false

Merge:
not performed

Production mutation:
none

M5:
NOT STARTED

Human Gate:
STOP — M4.5 Human UX / Independent Review
# Facade Solar Lab — M3 Facade Geometry

M2 Weather Foundationは完了し、PR #3はIndependent FULL Review → Required Fix → Focused Independent Re-Reviewを経てsquash merge済みです。

次のPhase:

**M3 — Facade Geometry**

を開始してください。

```yaml
run_id: LR-20260912-FSL-M3-001
task_packet_id: LRP-20260912-FSL-M3-001
task_packet_revision: 1

execution_mode: LONG_RUN_ENDURANCE
horizon: EXTENDED

human_explicit_long_run_authorization: true
human_explicit_endurance_authorization: true
```

LONG_RUN_ENDURANCEはHuman Gateを緩和しません。

---

# 1. Starting State

Repository:

```text
airesearchagl-art/Facade-Solar-Lab
```

Local root:

```text
${PROJECT_ROOT}
```

Expected canonical base:

```text
main
c3f314134137da9b35b4cde53320a610bba15f72
```

Previous merged PR:

```text
PR #3
M2: establish weather foundation

merged=true
merge method=squash
merge commit=
c3f314134137da9b35b4cde53320a610bba15f72
```

Expected branch:

```text
feat/m3-facade-geometry
```

開始時にfresh fetch。

`origin/main` が上記exact SHAと一致しない場合はSTOPしてください。

---

# 2. Objective

M3の目的は、

**ファサード方位、矩形開口の位置・寸法、水平庇の位置・出幅・有限幅を明示的なGeometry contractとして分離し、実気象weather pathから使用できるFacade Geometry Foundationを構築すること**

です。

M1 Legacy EngineおよびM2 weather-v1は変更しません。

概念:

```text
M1 legacy-v01
Regression baseline
        │
        ├──── immutable
        │
M2 weather-v1
EPW / solar / weather energy baseline
        │
        ├──── immutable
        │
        ▼
M3 facade geometry
vertical facade
rectangular opening
finite horizontal overhang
exact direct-shadow polygon
        │
        ▼
M3 weather + geometry path
```

M3では「全方位」と「有限幅庇」を扱いますが、M5 validation前にabsolute `[kWh]`を正式性能値とは呼びません。

---

# 3. M2 Post-Merge Closeout

M3 branch上でM2 Run Artifactをpost-merge状態へ最小同期してください。

M2 `TASK_PACKET_SNAPSHOT.md` はimmutable。

同期候補:

```text
.agent-run/LR-20260912-FSL-M2-001/
  RUN_STATE.md
  EVIDENCE.md
  TASK_QUEUE.md
  DECISIONS.md
```

記録:

```text
PR #3:
merged

reviewed feature head:
406a896818b5462549a1aab447a4a6ef3f8baa18

merge method:
squash

merge commit:
c3f314134137da9b35b4cde53320a610bba15f72

M2:
COMPLETE_VERIFIED / HUMAN_CLOSEOUT
```

過去Evidenceを書き換えずpost-merge closeoutとして追記してください。

---

# 4. M3 Long-Run Artifact

新規:

```text
.agent-run/LR-20260912-FSL-M3-001/
├─ RUN_MANIFEST.md
├─ TASK_PACKET_SNAPSHOT.md
├─ RUN_STATE.md
├─ TASK_QUEUE.md
├─ QUALITY_DEBT.md
├─ DECISIONS.md
└─ EVIDENCE.md
```

Task Packet exact snapshot + SHA-256 binding必須。

Resume可能な必須state:

```text
Repository
Working branch
Base SHA
Current head rule
Task Packet ID/revision/digest
Objective
Acceptance Criteria
Completed work
Current work
Required checks
Quality Debt
Explicit unverified items
Remaining tasks
Next action
Stop conditions
Resume instructions
```

---

# 5. Regression Boundary — 最重要

M3では以下を**baselineとして保持**します。

## M1

```text
legacy/mvp-v0.1/solar_overhang_simulator.html

SHA-256:
EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5
```

```text
legacy/mvp-v0.1/HANDOVER_solar_overhang_simulator.md

SHA-256:
B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4
```

## M2

```text
src/weather/**
src/engine/weather-v1/**
```

は原則変更禁止。

M3実装の都合でweather-v1を書き換えてはいけません。

新geometryは新しいpathとして追加してください。

---

# 6. Geometry Architecture

推奨:

```text
src/
├─ geometry/
│  └─ facade-v1/
│     ├─ index.ts
│     ├─ types.ts
│     ├─ coordinates.ts
│     ├─ polygon.ts
│     ├─ shadow.ts
│     ├─ validation.ts
│     └─ overhang.ts
│
└─ engine/
   ├─ legacy-v01/
   ├─ weather-v1/
   └─ facade-v1/
      ├─ index.ts
      ├─ irradiance.ts
      ├─ simulation.ts
      └─ types.ts
```

actual implementationに合わせて調整可。

ただし、

```text
geometry
weather
solar position
simulation
UI
```

の責務を再混在させないこと。

---

# 7. Facade Local Coordinate Contract

M3ではローカル座標を固定してください。

垂直ファサードのみを対象とします。

```text
wall plane:
y = 0

+x:
建物外部からファサードを正面視したときの右方向

+y:
ファサード面から建物外側への法線方向

+z:
鉛直上方向
```

単位:

```text
m
```

ファサード方位:

```text
outward normal azimuth
0°   = North
90°  = East
180° = South
270° = West

clockwise from North
```

有限な任意角を受け取り、必要なら内部で `[0,360)`へnormalize。

南基準と北基準を混在させない。

---

# 8. Opening Contract

Core opening geometryは冗長な3値を同時保持せず、

```ts
interface RectangularOpeningGeometry {
  centerXM: number;
  widthM: number;

  sillZM: number;
  headZM: number;
}
```

等を推奨。

derived:

```text
heightM = headZM - sillZM
areaM2 = widthM × heightM
```

これにより:

### 全面窓

```text
sillZM = 0
```

### 腰壁あり

```text
sillZM > 0
```

### 任意の窓頭高さ

```text
headZM
```

を同じcontractで表現できます。

Validation:

```text
widthM > 0
headZM > sillZM
all finite
```

---

# 9. Datum / Floor Reference

`sillZM` / `headZM` / `overhang elevation` は同一のFacade Local Datumからの高さとします。

設計入力上は、

```text
FL = 0
```

を推奨。

ただしcore geometryは特定の階高やFL名称に依存しない。

Geometry全体を同じz量だけ平行移動した場合、shading fractionが不変であることをtestしてください。

---

# 10. Horizontal Overhang Contract

水平庇:

```ts
interface HorizontalOverhangGeometry {
  depthM: number;
  elevationZM: number;

  leftExtensionM: number;
  rightExtensionM: number;
}
```

を基本候補とします。

Openingからderived:

```text
opening left  = centerX - width / 2
opening right = centerX + width / 2

overhang left  = opening left  - leftExtension
overhang right = opening right + rightExtension
```

したがって、

```text
leftExtensionM >= 0
rightExtensionM >= 0
```

とする。

これにより:

* 開口幅と同幅の庇
* 左右均等張出
* 非対称な張出

を扱える。

Validation:

```text
depthM >= 0
leftExtensionM >= 0
rightExtensionM >= 0
elevationZM >= opening.headZM
```

庇が開口内部を横切るgeometryはM3ではreject。

---

# 11. Legacy O Parameter Mapping

Legacy:

```text
H
D
O
W
```

はM3 geometryでは概念的に:

```text
H = headZM - sillZM
D = depthM
O = overhang.elevationZM - opening.headZM
W = opening.widthM
```

へmappingされます。

このmappingを`docs/FACADE_GEOMETRY.md`へ記録。

M1 source semanticsは変更しない。

---

# 12. Direct Shadow — Exact Polygon Geometry

M3 direct beamはM2の20-strip direct shadingから分離し、

**有限矩形庇が垂直ファサードへ落とすshadow polygonを計算し、開口矩形との交差面積を求める**

方式にしてください。

Raster / pixel / Canvas判定は禁止。

---

# 13. Sun Vector in Facade Local Coordinates

Solar elevation:

```text
e
```

Solar azimuth:

```text
S
```

Facade outward azimuth:

```text
A
```

relative azimuth:

```text
β = S - A
```

Facade-local unit vector toward sunは、定義した座標系に整合する形で、

```text
outward component:
s_y = cos(e) × cos(β)

vertical:
s_z = sin(e)

horizontal local x:
座標定義と整合する符号
```

を導出してください。

重要:

```text
s_y <= epsilon
```

なら太陽はfront-facing direct beamを持たない。

符号を経験的に合わせず、local coordinate definitionから導出・文書化すること。

---

# 14. Overhang Shadow Projection

水平庇は:

```text
z = elevationZM

back edge:
y = 0

front edge:
y = depthM
```

とする。

front-edge pointを太陽光線の逆方向へ壁面`y=0`まで投影。

front point:

```text
(x, depthM, zOverhang)
```

からwall intersection:

```text
xWall = x - depthM * s_x / s_y
zWall = zOverhang - depthM * s_z / s_y
```

相当になります。

actual signは§7の座標定義と一致させること。

庇back edge + projected front edgeからshadow polygonを構成してください。

---

# 15. Polygon Intersection

実装候補:

```text
Sutherland–Hodgman clipping
+
shoelace polygon area
```

外部geometry libraryは原則不要。

Opening rectangleへshadow polygonをclipし、

```text
shadedAreaM2
openingAreaM2
directShadedFraction
directLitFraction
```

を求める。

Contract:

```text
directShadedFraction ∈ [0,1]
directLitFraction = 1 - directShadedFraction
```

floating numerical noiseだけをepsilonで処理。

invalid geometryをclampで隠さない。

---

# 16. Direct Shadow Result

最低限:

```ts
interface DirectShadowResult {
  openingAreaM2: number;

  shadowPolygon: readonly Point2[];
  clippedShadowPolygon: readonly Point2[];

  shadedAreaM2: number;
  directShadedFraction: number;
  directLitFraction: number;

  frontFacing: boolean;
}
```

等。

Debug/review可能なよう、fractionだけでなくpolygon evidenceを保持してください。

---

# 17. Hand-Calculated Geometry Tests

new implementation自身からexpected値を作らない。

最低限以下のindependent analytical casesを追加。

## G1 — No overhang

```text
depth = 0
direct shaded fraction = 0
```

## G2 — Normal sun / half shade

Opening:

```text
width = 2
sill = 0
head = 2
```

Overhang:

```text
depth = 1
elevation = 2
left/right extension = 0
```

Solar:

```text
facade-normal azimuth
elevation = 45°
```

期待:

```text
shadow depth on wall = 1m
shaded area = 2m²
opening area = 4m²
direct shaded fraction = 0.5
```

## G3 — Full shade

同openingで:

```text
depth = 2
elevation = 45°
```

期待:

```text
direct shaded fraction = 1
```

## G4 — Gap above window

```text
opening head = 2
overhang elevation = 2.5
depth = 1
solar elevation = 45°
normal incidence
```

期待shadeを手計算してfixture化。

## G5 — Translation invariance

opening + overhangを同じ:

```text
Δx
Δz
```

だけ移動してshade fraction不変。

## G6 — Scale invariance

opening / overhang geometryを同一倍率でscaleしてfraction不変。

## G7 — Rotational orientation invariance

Facade azimuthとsolar azimuthを同じ角度だけ回転し、relative geometryが同じならshade fraction不変。

## G8 — Behind facade

sunが背面:

```text
beam incidence = 0
direct gain = 0
```

## G9 — Grazing boundary

front-facing cosineが0近傍でも:

```text
NaNなし
Infinity outputなし
fraction outside [0,1]なし
```

---

# 18. Finite Width / Side Extension Tests

有限幅庇がM3の重要点です。

最低限:

## F1 — Symmetric extensions

```text
left = right
```

でsunを左右mirrorするとshade fractionが一致。

## F2 — Asymmetric extension

```text
left != right
```

で東西方向の斜入射による差が生じること。

mirror時:

```text
solar azimuth mirror
left/right extension swap
```

で結果が一致。

## F3 — Extension monotonic case

特定の固定sun conditionで、

```text
larger relevant-side extension
```

がshade areaを減少させないこと。

## F4 — Very large extensions

左右張出を十分大きくした場合、

```text
infinite-width analytical direct-shading limit
```

へ収束すること。

M2 20-strip discretizationと完全一致を強制しない。

---

# 19. All-Orientation Tests

最低限:

```text
North 0°
East 90°
South 180°
West 270°

45°
135°
225°
315°
```

を扱う。

同じrelative sun/facade関係ならorientation rotationで同じ結果になることを優先してtest。

「南面だけ正しく、東西で符号反転」するbugを防止してください。

---

# 20. Diffuse Sky — M3 Boundary

M3の有限幅geometryはまず**direct beam shadowをexact 3D-local geometry化**します。

Diffuse skyについてはM2の:

```text
isotropic
2D infinite-width overhang sky-view approximation
```

を維持してよい。

ただし新結果に必ずmodel identityを保持:

```text
directShadingModel:
finite-rectangular-overhang-shadow-polygon-v1

diffuseShadingModel:
isotropic-2d-infinite-width-v1
```

等。

重要:

**有限幅のside edgeを考慮した3D diffuse sky obstructionまで実装済みとは主張しない。**

これはM5 validation / model refinement候補として明記。

---

# 21. Ground Reflection

M2 contractを維持:

```text
GHI × groundReflectance × 0.5
```

庇によるground-reflected component遮蔽はM3 non-goal。

---

# 22. New Weather + Geometry Path

`weather-v1`を変更せず、新pathを追加してください。

名称例:

```text
facade-v1
```

result identity例:

```ts
modelVersion: "facade-v1-weather"
geometryVersion: "facade-v1"
solarPositionAlgorithm: "noaa-fractional-year-v1"
```

同一結果に:

```text
weather provenance
geometry input
direct shading model
diffuse shading model
```

を残してください。

---

# 23. Facade Simulation Parameters

例:

```ts
interface FacadeV1Parameters {
  facadeAzimuthDegFromNorth: number;

  opening: RectangularOpeningGeometry;

  overhang?: HorizontalOverhangGeometry;

  solarHeatGainCoefficient: number;
  groundReflectance: number;
}
```

M3 coreではglass IACなし。

SHGCはM2同様constant。

---

# 24. Opening Types

M3は「窓種別enum」で物理挙動を分けない。

以下はすべて同一矩形geometryで表現:

```text
full-height glazing
waist-wall window
high window
low window
```

例:

```text
full-height:
sill = 0
head = 3

waist wall:
sill = 0.9
head = 3
```

この統一をdocsへ明記。

---

# 25. Multiple Openings

複数開口同時計算はM3 non-goal。

M3は:

```text
one facade
one rectangular opening
zero or one horizontal overhang
```

をdeterministicに完成させる。

将来array化できる型設計は可だが、未実装機能をpublic APIで装わない。

---

# 26. Weather Regression

以下は継続PASS必須:

```text
M1 Golden
M1 original hashes
M2 EPW parser
M2 weather time contract
M2 NOAA solar references
M2 leap-year references
M2 sub-hour energy accounting
M2 weather-v1 simulation tests
```

M3のために既存expected値を書き換えない。

---

# 27. M2 vs M3 Comparison

Syntheticまたはlocal real EPWで比較。

最低限:

## C1 — D=0

同一weather / opening / facadeで:

```text
M2 weather-v1
M3 facade-v1
```

が同一のwith/without resultになること。

## C2 — Effectively infinite-width overhang

非常に大きな左右extensionで、

M3 direct shadingがinfinite-width expectedへ近づくこと。

M2の20-strip direct shadowと差が残る場合は:

```text
exact polygon
vs
strip discretization
```

として説明。

## C3 — Finite width effect

斜入射条件で、

```text
finite width
vs
very wide overhang
```

のdirect gain差をEvidenceへ記録。

これはM3 geometryが実際に効いている証拠とする。

---

# 28. Real EPW Smoke

`.local-validation/` にM2のTokyo Hyakuri EPWが安全に残っていれば、M3新pathでもlocal smokeを実施。

確認:

```text
8760 intervals
no NaN / Infinity
all four cardinal facades run
finite overhang case runs
weather provenance retained
```

raw EPW / ZIP / licenseはcommit禁止。

local datasetが存在しない場合はHard Failureにせず:

```text
real M3 EPW smoke:
UNVERIFIED
```

と明記。

synthetic validationと混同しない。

---

# 29. Geometry Numerical Policy

floating geometry用に明示的epsilonを定義。

例:

```text
GEOMETRY_EPSILON
```

用途:

* front-facing判定
* polygon vertex deduplication
* zero-area判定
* clipping edge

複数箇所で異なるmagic epsilonを散在させない。

---

# 30. Invalid Geometry Policy

暗黙修正禁止。

以下はerror:

```text
width <= 0
head <= sill
negative extensions
negative depth
non-finite input
overhang elevation < opening head
invalid SHGC
invalid ground reflectance
```

方位だけは有限値ならnormalization可。

---

# 31. Core Boundary

`src/geometry/**` とnew calculation pathには禁止:

```text
React
react-dom
window
document
navigator
Canvas
File / FileReader
fs
path
process
```

M2 boundary testをgeometryまで拡張。

Pure TypeScript。

---

# 32. Documentation

新規:

```text
docs/FACADE_GEOMETRY.md
```

必須内容:

```text
coordinate convention
azimuth convention
opening contract
datum / floor-reference meaning
overhang contract
legacy H/D/O/W mapping
finite direct-shadow algorithm
projection equation
polygon clipping
numerical epsilon
validation policy
direct vs diffuse model boundary
known limitations
M2/M3 regression boundary
M4/M5 future work
```

更新:

```text
README.md
AGENTS.md
docs/ROADMAP.md
docs/MODEL_LIMITATIONS.md
docs/VALIDATION_PLAN.md
```

M3完了時:

```text
M3 = Current / Completed on branch
M4 = Comparison UX next
```

が明確になるようにする。

---

# 33. Minimal UI

本格Simulator UIはM4。

M3では既存status UIを最小更新:

```text
M3 · FACADE GEOMETRY

Finite facade geometry foundation available
Weather baseline preserved
```

程度。

禁止:

```text
slider UI
opening editor
drag geometry
charts
case comparison
EPW file picker
export
```

---

# 34. M3 Non-Goals

以下は実装しない:

```text
multiple openings
multiple overhangs
stacked-floor mutual shading
side fins
vertical louvers
reveal depth
balcony edge complexity
sloped facade
sloped canopy
curved facade
arbitrary polygon openings
full 3D building shadowing
neighboring buildings
finite-width 3D diffuse sky integration
Perez sky
glass IAC
thermal load / HVAC
BEI
daylighting
multiple-case UI
charts
CSV / PDF
Vercel
Production
GitHub Actions CI
```

---

# 35. Required Automated Tests

最低限:

## Geometry primitives

```text
P1 polygon area
P2 rectangle clipping
P3 empty intersection
P4 full intersection
P5 edge-touch zero-area
P6 numerical duplicate vertices
```

## Opening / overhang

```text
O1 full-height opening
O2 waist-wall opening
O3 invalid head/sill
O4 overhang at head
O5 positive gap
O6 asymmetric extensions
O7 invalid intersection geometry
```

## Direct shading

```text
G1–G9
F1–F4
```

## Orientation

```text
North / East / South / West
45° intermediate rotations
rotation invariance
behind-facade
grazing
```

## Regression

```text
M1 Golden
M1 source hashes
M2 weather parser/time/solar
M2 365/366 denominator
M2 weather-v1
D=0 M2/M3 equivalence
```

---

# 36. Independent Reference Requirement

Geometry expected値をnew polygon engine自身から生成禁止。

Expected sources:

```text
hand calculation
analytical rectangle geometry
independent minimal reference script
```

のいずれか。

特にG2/G3/G4は手計算値をdocs/Evidenceへ残してください。

---

# 37. Required Checks

最低限:

```text
npm test
npm run typecheck
npm run build
npm audit
npm run golden:check
git diff --check origin/main...HEAD
```

追加:

```text
geometry focused tests
orientation tests
finite-width tests
M2 regression suite
M1 source SHA-256
real EPW smoke when locally available
secret/privacy scan
scope scan
licensed data scan
```

---

# 38. Acceptance Criteria

1. M2 post-merge closeout完了。
2. M3 Run Artifact + immutable Task Packet digest binding成立。
3. M1 source hashes不変。
4. M1 Golden不変。
5. M2 weather-v1 regression不変。
6. Facade local coordinate contractが明示。
7. North-zero / clockwise azimuthが統一。
8. sill/headベースの矩形Opening contract成立。
9. full-height / waist-wallを同一geometryで表現可能。
10. floor/local datumからのz値を扱える。
11. horizontal overhang depth / elevation / left/right extension成立。
12. finite direct shadow polygonをexact geometryで算出。
13. shadow/opening polygon intersection成立。
14. direct shaded/lit fractionが0–1で安定。
15. normal-sun analytical half-shade test PASS。
16. full-shade analytical test PASS。
17. gap-above-opening analytical test PASS。
18. translation invariance PASS。
19. scale invariance PASS。
20. orientation rotation invariance PASS。
21. finite-width mirror symmetry PASS。
22. asymmetric extension effect PASS。
23. large-extension infinite-width limit PASS。
24. behind/grazing boundary PASS。
25. new weather+geometry pathがweather provenance保持。
26. direct/diffuse model identityを結果へ保持。
27. finite-width diffuse未実装を明示。
28. D=0 M2/M3 regression PASS。
29. all cardinal orientationsがNaN/Infinityなし。
30. test/typecheck/build/audit/Golden/diff PASS。
31. public repository boundary PASS。
32. main / Ready / merge / Vercel / Production / M4へ進んでいない。
33. Draft PR作成後Independent FULL Review待ちでSTOP。

---

# 39. Wave Plan

## Wave 0 — Fresh Preflight / M2 Closeout

* fresh main
* M1 hashes
* M1 Golden
* M2 regression
* M2 closeout
* M3 artifacts
* branch

Checkpoint。

## Wave 1 — Geometry Contract

* coordinate system
* facade azimuth
* opening
* datum
* overhang
* validation

Checkpoint。

## Wave 2 — Polygon Primitives

* vector/local coordinates
* polygon area
* clipping
* epsilon contract

Checkpoint。

## Wave 3 — Finite Direct Shadow

* sun local vector
* overhang projection
* shadow polygon
* opening intersection
* analytical tests

Checkpoint。

## Wave 4 — Orientation / Side Extensions

* all azimuths
* asymmetric left/right extensions
* mirror / rotation / scale invariance
* boundary tests

Checkpoint。

## Wave 5 — Weather Integration

* new facade-v1 weather path
* M2 solar/weather reuse
* direct polygon shading
* existing isotropic diffuse boundary
* result provenance/model identity

Checkpoint。

## Wave 6 — Regression / Real Smoke

* M1
* M2
* synthetic
* optional local real EPW
* M2 vs M3 comparison

Checkpoint。

## Wave 7 — Documentation / Minimal Status

Checkpoint。

## Wave 8 — Full Convergence

新機能追加停止。

* all tests
* typecheck
* build
* audit
* Golden
* diff
* hashes
* privacy
* licensing
* scope
* self-review

Checkpoint。

## Wave 9 — Draft PR

Expected title:

```text
M3: establish facade geometry foundation
```

Expected:

```text
feat/m3-facade-geometry
→ main
Draft = true
```

Draft PR作成後fresh state確認。

Ready / merge禁止。

Independent FULL Review待ちでSTOP。

---

# 40. Hard Stop Conditions

即時STOP:

```text
origin/main != c3f314134137da9b35b4cde53320a610bba15f72 at initial preflight

M1 original hash mismatch

M1 Golden failure

M2 regression failure

Task Packet digest mismatch

coordinate sign conventionを一意に説明できない

orientation rotation test failureを説明できない

polygon areaが0–openingArea外へ有意に逸脱

NaN / Infinity

finite-width direct geometryにraster approximationが必要になる

weather-v1変更が必要になる

licensed raw EPW commitが必要になる

security/privacy/permission/data-integrity failure

unexpected user changes

scope expansion required
```

Hard Gate failureをQuality Debtへ移さない。

---

# 41. Git / PR Policy

禁止:

```text
main direct mutation
Ready
merge
auto-merge
rebase
force push
branch delete
Vercel
Production
Release
Notion direct write
Vault direct write
visibility / permission / secret changes
M4開始
```

許可:

```text
feat/m3-facade-geometry
normal commits
normal push
one Draft PR after convergence
```

このTask PacketはM3完了時の**Draft PR 1件作成をHuman authorizationとして含む**。

ただしbrowser/computer-use layerがaction-time confirmationを強制する場合は、そのGateでSTOP。

---

# 42. Completion Report

```text
# Facade Solar Lab — M3 Facade Geometry Completion Report

Run ID:
Mode:
Task Packet:
Revision:
Digest:

Initial base:
Branch:
Final head:

M2 closeout:
-

Regression:
- M1 HTML hash:
- M1 HANDOVER hash:
- M1 Golden:
- M2 weather-v1:
- M2 NOAA normal-year:
- M2 NOAA leap-year:

Geometry contract:
- coordinates:
- azimuth:
- opening:
- datum:
- overhang:

Direct shadow:
- projection:
- polygon clipping:
- epsilon:
- G2 half shade:
- G3 full shade:
- G4 gap:
- translation:
- scaling:

Finite width:
- symmetric:
- asymmetric:
- mirror:
- large-extension limit:

Orientations:
- N:
- E:
- S:
- W:
- intermediate:
- rotation invariance:

Weather integration:
- model version:
- weather provenance:
- direct model:
- diffuse model:
- ground model:

M2 vs M3:
- D=0:
- infinite-width proxy:
- finite-width effect:

Real EPW smoke:
- status:
- dataset:
- no NaN/Infinity:
- orientations:
- raw file committed: no

Checks:
- npm test:
- typecheck:
- build:
- audit:
- golden:
- diff:
- privacy:
- licensed-data scan:

Quality Debt:

Explicit unverified items:

Known limitations:

Changed files:
Commits:

PR:
- number:
- URL:
- OPEN:
- Draft:
- Ready:
- merged:
- base:
- head:

main mutation:
Vercel mutation:
Notion mutation:
Vault mutation:

Final State:
COMPLETE_VERIFIED /
COMPLETE_PENDING_FULL_VERIFY /
BLOCKED

Human Gate:
STOP

Next recommended task:
M4 — Comparison UX
```

M4へ自動進行しないでください。

**M3完了後はDraft PRを作成し、Independent FULL Review待ちで停止してください。**


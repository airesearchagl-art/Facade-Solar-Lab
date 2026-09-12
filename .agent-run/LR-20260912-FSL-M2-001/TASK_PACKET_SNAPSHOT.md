# Facade Solar Lab — M2 Weather Foundation

M1 Engine Baselineは完了し、PR #2はIndependent FULL Review PASS後にsquash merge済みです。

次の開発Phase:

**M2 — Weather Foundation**

を開始してください。

今回は引き続き、

```yaml
run_id: LR-20260912-FSL-M2-001
task_packet_id: LRP-20260912-FSL-M2-001
task_packet_revision: 1

execution_mode: LONG_RUN_ENDURANCE
horizon: EXTENDED

human_explicit_long_run_authorization: true
human_explicit_endurance_authorization: true
```

として実行します。

LONG_RUN_ENDURANCEはHuman Gateを緩和しません。

---

# 1. Starting State

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
a7a9cbb7af2386b6b0b5266ea390568a8b537d69
```

Previous merged PR:

```text
PR #2
M1: establish legacy engine baseline

merged=true
merge method=squash
merge commit=
a7a9cbb7af2386b6b0b5266ea390568a8b537d69
```

Expected branch:

```text
feat/m2-weather-foundation
```

開始時にfresh fetchしてください。

`origin/main` が上記exact SHAと一致しない場合は停止してください。

---

# 2. Objective

M2の目的は、

**実気象データをFacade Solar Labへ安全・再現可能に入力できるWeather Foundationを構築すること**

です。

M1 Legacy Engineを削除・置換しません。

最終構成は概念的に、

```text
M1 Legacy Engine
Clear Sky / legacy semantics
        │
        ├── regression baselineとして永久保持
        │
        ▼
M2 Weather Foundation
EPW → canonical weather records
        │
        ▼
weather-driven irradiance path
        │
        ▼
M3 Geometry
```

とします。

M2完了時点でも、weather-driven absolute `[kWh]`を正式性能値とは呼びません。

---

# 3. M1 Post-Merge Closeout

M2 branch上でM1 Run Artifactをpost-merge stateへ最小同期してください。

M1 Task Packet Snapshotはimmutableのため変更禁止です。

同期候補:

```text
.agent-run/LR-20260912-FSL-M1-001/
  RUN_STATE.md
  EVIDENCE.md
  TASK_QUEUE.md
  DECISIONS.md
```

記録:

```text
PR #2:
merged

merge method:
squash

reviewed feature head:
cdacd6c2020030b5bde1a745281c9e4d358d1c36

merge commit:
a7a9cbb7af2386b6b0b5266ea390568a8b537d69

M1:
COMPLETE_VERIFIED / HUMAN_CLOSEOUT
```

過去Evidenceを歴史修正せず、post-merge closeoutとして扱ってください。

---

# 4. M2 Long-Run Artifact

新規:

```text
.agent-run/LR-20260912-FSL-M2-001/
├─ RUN_MANIFEST.md
├─ TASK_PACKET_SNAPSHOT.md
├─ RUN_STATE.md
├─ TASK_QUEUE.md
├─ QUALITY_DEBT.md
├─ DECISIONS.md
└─ EVIDENCE.md
```

Task Packet exact snapshotを保存し、SHA-256 digest bindingを行ってください。

必須state:

```text
Repository
Working branch
Base SHA
Current head rule
Task Packet ID
Task Packet revision
Task Packet digest
Objective
Acceptance Criteria
Completed work
Current work
Required checks
Quality Debt
Explicit unverified items
Known failures
Remaining tasks
Next action
Stop conditions
Resume instructions
```

Conversation memoryなしでresume可能にしてください。

---

# 5. Authoritative Weather Format — EPW First

M2の最初の正式Weather Providerは:

```text
EnergyPlus Weather File
EPW
```

とします。

拡張アメダスについては、M2で無理にparser実装しません。

理由:

* 配布・利用条件を曖昧にしたくない
* source format差をEPW parserへ混入させない
* 将来provider adapterとして追加できる構造を先に作る

したがってM2は、

```text
Canonical Weather Contract
        ▲
        │
    EPW Adapter
```

を実装します。

将来:

```text
Canonical Weather Contract
   ▲             ▲
   │             │
 EPW        Expanded AMeDAS
```

へ増設可能な構造にしてください。

---

# 6. Official EPW Semantics

EnergyPlus EPWのofficial/current documentationを実装前に確認し、参照した仕様を`docs/WEATHER_FOUNDATION.md`へ記録してください。

特に以下を確認してください。

```text
LOCATION header
DATA PERIODS header
records per hour
year
month
day
hour
minute
Global Horizontal Radiation
Direct Normal Radiation
Diffuse Horizontal Radiation
missing-value rules
```

重要:

EPWのsolar radiation値は、単純な「その時刻の瞬時W/m²」として扱わないこと。

EPWの:

```text
Global Horizontal Radiation
Direct Normal Radiation
Diffuse Horizontal Radiation
```

は原則、

```text
Wh/m²
```

であり、表示時刻に先行するintervalのenergyです。

よってcanonical modelはradiation energyを原値の意味のまま保存してください。

例:

```ts
globalHorizontalRadiationWhPerM2
directNormalRadiationWhPerM2
diffuseHorizontalRadiationWhPerM2
intervalMinutes
```

単に名前を:

```text
...WPerM2
```

としてはいけません。

---

# 7. Time Contract — Critical

EPW時刻をJavaScript `Date`へ雑に変換しないでください。

Canonical weather layerでは、

```text
Local Standard Time
EPW location timezone offset
interval end
interval midpoint
interval duration
```

を明示してください。

推奨概念:

```ts
interface WeatherIntervalTime {
  year: number;
  month: number;
  day: number;

  // EPW raw interval-end representation
  rawHour: number;
  rawMinute: number;

  intervalMinutes: number;

  // Canonical evaluation time
  midpointLocalStandardTime: ...
}
```

DSTを勝手に適用しない。

host OS timezoneに依存しない。

ISO UTC変換を必須にしない。

M2ではまず、

**EPW locationのLocal Standard Timeをcanonical**

としてください。

---

# 8. Interval Midpoint Rule

Solar position / shadingを評価する時刻は、

**そのradiation intervalのmidpoint**

とします。

例えばhourly EPW recordがある場合:

```text
radiation energy:
preceding 60 min

solar geometry:
interval midpoint
```

とする。

これはM2の明示的近似です。

区間中のsolar position変動を細分化・補間する高度化は後続validation対象とします。

この近似を隠さず`MODEL_LIMITATIONS.md`へ記録してください。

---

# 9. Canonical Weather Model

例:

```text
src/weather/
├─ index.ts
├─ canonical.ts
├─ issues.ts
├─ provenance.ts
└─ epw/
   ├─ index.ts
   ├─ parser.ts
   ├─ headers.ts
   └─ types.ts
```

actual architectureに合わせて調整可。

最低限canonical datasetは以下を保持:

```ts
WeatherDataset
WeatherLocation
WeatherInterval
WeatherSourceProvenance
WeatherParseIssue
```

Location:

```text
city
region/state
country
source
station/WMO identifier if present
latitudeDeg
longitudeDeg
timeZoneOffsetHours
elevationM
```

Required radiation:

```text
GHI
DNI
DHI
```

その他:

```text
dry bulb
dew point
relative humidity
pressure
wind
```

はparserが保持してもよいが、M2 solar foundationに不要なら必須domain contractへ詰め込みすぎないこと。

---

# 10. Core Parser Boundary

Core parser:

```ts
parseEpw(...)
```

はPure TypeScriptとしてください。

禁止:

```text
fs
path
process
React
DOM
File API
window
document
Canvas
```

Core parserは、

```text
string
または明示的text representation
```

を受けてdatasetを返す形を基本とする。

Node.js file readingはvalidation scriptなどadapter側に限定してください。

Browser file picker UIはM2では作らない。

---

# 11. Missing / Invalid Data Policy

Required solar valuesのmissingやinvalidを黙って0へ変換しないでください。

Canonical recordは必要に応じて:

```text
null
missing flag
WeatherParseIssue
```

等で明示してください。

Solar simulationに必要なDNI/DHI等がmissingの場合:

```text
strict/default path:
calculationを拒否

optional future policy:
explicit substitution
```

とする。

M2では「0へ置換したように見えて正常計算が進む」状態を禁止します。

---

# 12. Synthetic EPW Fixtures

第三者EPW全文をライセンス確認なしでrepositoryへcommitしないでください。

Parser automated testsには、repo内で自作したsmall synthetic EPW fixtureを使用してください。

最低限:

```text
LOCATION
DATA PERIODS
8 header lines
数時間〜数日のrecords
```

を含むfixture。

必要なedge casesは別fixtureで構わない。

Synthetic fixtureは明確に:

```text
TEST FIXTURE
NOT REAL WEATHER
```

としてください。

---

# 13. Real EPW Smoke Validation

可能であれば、EnergyPlus等のauthoritative/public weather sourceから日本国内1地点のEPWを**local validation用**として取得してください。

候補:

```text
Osaka
Tokyo
Nagoya
```

具体地点は取得可能性とsource provenanceで選択可。

ただし:

* raw EPWをrepositoryへcommitしない
* redistribution license不明ならcommit禁止
* `.gitignore`対象のlocal validation areaを使用
* source name
* retrieval date
* source reference
* SHA-256
* station metadata
* record count
* intervals per hour

をEvidenceへ記録。

ライセンス・取得条件が曖昧ならHard Gateを越えて勝手にcommitしない。

network unavailable等でreal-file smoke validationができない場合:

```text
COMPLETE_PENDING_FULL_VERIFY
```

候補とし、

```text
real EPW validation:
UNVERIFIED
```

と明記してください。

synthetic testだけで「real EPW validated」と報告することは禁止。

---

# 14. Weather-Driven Solar Foundation

M1 Legacy Engineを変更せず、新規weather-driven pathを追加します。

例:

```text
src/engine/
├─ legacy-v01/
└─ weather-v1/
   ├─ index.ts
   ├─ solar-position.ts
   ├─ irradiance.ts
   ├─ shading.ts
   ├─ simulation.ts
   └─ types.ts
```

名前は調整可。

重要:

```text
legacy-v01
weather-v1
```

を混ぜないこと。

M1 Goldenは永久regression baselineとして維持します。

---

# 15. Solar Position v1

Weather-driven pathでM1のlegacy solar positionをそのまま使ってはいけません。

M1は:

```text
monthly representative day
true solar time
longitude correctionなし
equation of timeなし
```

だからです。

M2 weather-v1では、

```text
latitude
longitude
timezone
calendar date
local standard time
```

からsolar positionを決定する独立implementationを追加してください。

実装方法は、official / authoritative documented algorithmを調査して選択。

例:

```text
NOAA-style solar position
または同等のdocumented deterministic method
```

Requirements:

* algorithm sourceをdocsへ記録
* operationをdeterministicにする
* host timezone非依存
* longitude/timezone correctionを含む
* equation-of-time相当を含む
* independent reference casesをtest

ただし、SPA級の極端な高精度化はM2必須ではありません。

---

# 16. Independent Solar Position Tests

最低限:

```text
equinox-like reference
summer reference
winter reference
morning / noon / afternoon
east/west symmetry tendencies
night / below horizon
```

を検証。

Expectedを実装自身から生成しない。

外部documented calculator、reference algorithm、または独立計算からexpectedを得ること。

Toleranceと根拠を明示。

---

# 17. Weather Irradiance Contract

Current M2 2D horizontal-overhang geometryで、weather radiationからsurface inputを作れるfoundationを実装。

Interval-level conceptual model:

```text
EPW DNI [Wh/m² interval]
× beam incidence factor
× direct shading factor

+

EPW DHI [Wh/m² interval]
× vertical sky factor

+

EPW GHI [Wh/m² interval]
× ground reflectance
× vertical ground-view factor
```

M2ではlegacyと同じ2D水平庇geometryを再利用してよいが、

**legacy solar / clear-sky sourceとは分離**

してください。

Weather pathで`legacySkyFactor`を使用禁止。

---

# 18. Isotropic Sky — M2 Explicit Limitation

M2では天空日射をまずisotropic diffuseで扱ってよい。

つまり、

```text
Perez
anisotropic sky
circumsolar
horizon brightening
```

はM2 non-goal。

ただしM2結果を、

```text
weather-backed
```

とは呼べるが、

```text
fully validated physical model
```

とは呼ばない。

M3/M5へのKnown Limitationとして記録。

---

# 19. Ground Reflection

M2ではsimplified vertical surface ground reflectionとして、

```text
GHI × groundReflectance × 0.5
```

相当を初期contractにしてよい。

庇によるground-reflected component遮蔽はM2 non-goal。

ただしlegacyとは異なり、weather pathではactual EPW GHIを使用すること。

---

# 20. Weather Simulation Result

新weather pathは少なくとも:

```text
monthly
annual
cooling period
heating period
```

へ集計できるfoundationを持たせる。

出力にはmodel identity / weather provenanceを含める。

例:

```ts
interface WeatherDrivenSimulationResult {
  modelVersion: "weather-v1";
  weatherDatasetId: string;
  weatherSource: ...;
  monthly: ...;
  summary: ...;
}
```

weather provenanceを結果から失わないこと。

---

# 21. Periods

M2ではM1との比較用に引き続き:

```text
cooling:
Apr–Sep

heating:
Oct–Mar
```

をdefaultとして使用可。

ただしweather engine内部では期間定義をhardcoded magic arrayだけにせず、将来変更可能なboundaryを作ってください。

UIから期間変更する機能はM2 non-goal。

---

# 22. M1 Regression Must Continue to Pass

M2中も必ず:

```text
npm run golden:check
```

を維持。

M1 Legacy EngineのGolden fixtureや原本をweather実装都合で変更しない。

以下のHashは不変:

```text
solar_overhang_simulator.html
EF896E0D6F4AA5667CFC235B2B5B37733D5875C8AF646D60A42369CA750D4CB5

HANDOVER_solar_overhang_simulator.md
B3C2C8E715662F064978B1F6D2D326B4AA3584FF804292D3A735F68626CCD6C4
```

1 byteでも変わればHard Stop。

---

# 23. Required Automated Tests

最低限:

## EPW parser

```text
P1 LOCATION header
P2 DATA PERIODS / intervals per hour
P3 required radiation field mapping
P4 hourly date/time semantics
P5 interval midpoint normalization
P6 8760 records
P7 8784 / leap-day capable dataset
P8 malformed row
P9 required radiation missing
P10 invalid negative radiation
P11 unsupported/inconsistent interval metadata
```

## Solar / irradiance

```text
S1 solar-position independent references
S2 sun below horizon
S3 horizontal/surface incidence sanity
S4 synthetic DNI-only case
S5 synthetic DHI-only case
S6 synthetic GHI ground-reflection case
S7 D=0 direct/diffuse equivalence
S8 overhang direct-shading behavior
```

## Regression

```text
R1 M1 Golden unchanged
R2 original hashes unchanged
R3 engine/weather core browser-framework-independent
```

---

# 24. Energy Accounting Tests

Synthetic EPWではinput valuesを意図的に単純化し、

```text
1 interval
known DNI
known DHI
known GHI
known solar position
known geometry
```

からmanual expectedを作成してください。

重要:

```text
Wh/m² interval
```

を二重に時間積分しないこと。

逆に、Wh/m²をW/m²として扱ってdtを誤ることも禁止。

Hourly dataでは数値が偶然同じになるcaseがあるため、

**sub-hour synthetic fixtureも必ず用意**

してunit bugを検出してください。

---

# 25. Real Dataset Validation Scope

M2のreal EPW validationでは以下を確認:

```text
parser success
location metadata
records / year structure
missing required solar count
annual GHI sum
annual DNI sum
annual DHI sum
weather-v1 simulation runs to completion
no NaN / Infinity
provenance retained
```

ここで算出されたFacade absolute `[kWh]`を外部正解値とは判定しない。

公開統計や第三者solverとの±10% validationはM5へ残してよい。

---

# 26. Legacy vs Weather Comparison

real EPW smoke validationが可能な場合、同じgeometry:

```text
H=2.4
D=1.6
O=0.3
W=6
A=0
G=1
rho=0.2
```

等で、

```text
M1 Legacy
vs
M2 Weather-v1
```

の:

```text
annual
cooling
heating
reduction %
```

を比較Evidenceとして記録。

差が大きくてもFAILではありません。

目的は、

```text
Clear Sky legacyから
real-weather inputへ変えた結果
どの程度数値が動くか
```

を可視化すること。

差異を隠さない。

---

# 27. Documentation

新規推奨:

```text
docs/WEATHER_FOUNDATION.md
```

必須内容:

```text
EPW source semantics
canonical weather contract
time convention
interval-end / midpoint rule
units
missing-data policy
provenance
licensing / redistribution policy
solar-position algorithm
isotropic diffuse limitation
ground-reflection limitation
real-file validation status
M1 vs M2 boundary
M3/M5 future work
```

更新:

```text
README.md
AGENTS.md
docs/ROADMAP.md
docs/MODEL_LIMITATIONS.md
docs/VALIDATION_PLAN.md
```

---

# 28. Minimal UI

本格weather import UIは作らない。

M2では既存status UIを必要最小限:

```text
M2 · WEATHER FOUNDATION
EPW weather foundation available
Legacy baseline preserved
```

程度へ更新可。

以下は禁止:

```text
file picker UI
location browser
weather charts
full simulator UI
case comparison
```

---

# 29. Non-Goals

M2では以下を実装しない:

```text
Expanded AMeDAS production parser
Perez sky
anisotropic diffuse
finite-width overhang
3D shadow polygon
full facade geometry redesign
sill/head elevation redesign
vertical louvers
side fins
glass IAC
thermal load conversion
HVAC energy
BEI
daylighting
multi-case UI
CSV/PDF export
Vercel
Production
GitHub Actions CI
```

M3/M4/M5/M6へ残してください。

---

# 30. External Data / Licensing Hard Boundary

外部weather dataについて:

```text
license不明
redistribution可否不明
利用規約不明
```

の状態でraw dataをpublic repositoryへcommit禁止。

authoritative sourceであっても、

```text
公開されている
=
再配布自由
```

とはみなさないこと。

local validationに留める場合は:

```text
source
hash
retrieval date
location metadata
```

だけをEvidenceへ保存。

---

# 31. Public Repository Boundary

Public repositoryなので以下は禁止:

```text
user absolute path
credentials
tokens
API keys
private URLs
client/project identities
unpublished actual-project weather/location data
licensed raw weather dataset without redistribution permission
```

Task Packet snapshotもpublic-safeにnormalizeしてください。

---

# 32. Required Checks

最低限:

```text
npm test
npm run typecheck
npm run build
npm audit
npm run golden:check
git diff --check origin/main...HEAD
```

加えて:

```text
EPW parser tests
time-contract tests
sub-hour energy-unit tests
solar-position independent-reference tests
weather irradiance tests
legacy source hash check
M1 Golden regression
public secret/privacy scan
external-data licensing/provenance scan
```

---

# 33. Acceptance Criteria

1. M1 post-merge closeoutが完了。
2. M2 Long-Run artifactsとdigest bindingが成立。
3. M1 original hashesが不変。
4. M1 Golden全PASS。
5. Pure TS canonical Weather contractが成立。
6. EPW LOCATION / DATA PERIODS / recordsをparserが扱える。
7. DNI / DHI / GHI単位を`Wh/m² interval`として正しく保持。
8. interval endとmidpointが明示される。
9. host OS timezone / DSTに依存しない。
10. required radiation missingを黙って0補間しない。
11. 8760 / 8784 datasetを扱える。
12. sub-hour synthetic testでenergy-unit contractを検証。
13. weather-v1 solar positionがlegacy solarと独立。
14. solar-position reference testsがPASS。
15. weather-driven irradiance pathが成立。
16. `legacySkyFactor`がweather pathへ侵入していない。
17. weather provenanceがsimulation resultまで保持される。
18. M1 vs M2がside-by-sideで保持される。
19. downloaded third-party EPWをlicense不明のままcommitしていない。
20. test / typecheck / build / audit / Golden / diff checkがPASS。
21. main / Ready / merge / Vercel / Production / M3へ進んでいない。
22. Draft PR作成後Human Gateで停止。

---

# 34. Real EPW Verification State

Real EPW local validationまで成功した場合:

```text
COMPLETE_VERIFIED
```

候補。

network / license / external source制約でreal-file validationのみ残る場合:

```text
COMPLETE_PENDING_FULL_VERIFY
```

としてください。

その場合でも、

```text
synthetic tests = PASS
real EPW = UNVERIFIED
```

を明確に分離。

「全部PASS」と書かない。

---

# 35. Wave Plan

## Wave 0 — Fresh Preflight / M1 Closeout

* fresh main
* clean worktree
* exact M1 hashes
* M1 closeout
* M2 Task Packet
* new branch

Checkpoint必須。

## Wave 1 — Canonical Weather Contract

* WeatherDataset
* Location
* Interval
* Provenance
* Issue/error model
* time contract

Checkpoint必須。

## Wave 2 — EPW Parser

* headers
* DATA PERIODS
* records
* DNI / DHI / GHI
* missing handling
* 8760 / 8784
* synthetic fixtures

Checkpoint必須。

## Wave 3 — Solar Position v1

* calendar/time/location contract
* longitude/timezone
* equation-of-time capable algorithm
* independent reference tests

Checkpoint必須。

## Wave 4 — Weather Irradiance Foundation

* beam
* isotropic diffuse
* ground reflection
* current 2D overhang shading
* weather result / provenance

Checkpoint必須。

## Wave 5 — Validation

* synthetic unit tests
* sub-hour test
* M1 regression
* optional real Japanese EPW local smoke validation
* legacy/weather comparison

Checkpoint必須。

## Wave 6 — Documentation / Minimal Status

* WEATHER_FOUNDATION
* README
* AGENTS
* ROADMAP
* LIMITATIONS
* VALIDATION
* minimal UI status

Checkpoint必須。

## Wave 7 — Full Convergence

新機能追加停止。

* all tests
* Golden
* typecheck
* build
* audit
* diff
* hashes
* public boundary
* external data provenance/license
* scope review
* full self-review

Checkpoint必須。

## Wave 8 — Draft PR

* normal push
* Draft PR
* fresh state
* Run Artifact final sync
* Human Gate

---

# 36. Hard Stop Conditions

即時停止:

```text
origin/main != a7a9cbb7af2386b6b0b5266ea390568a8b537d69 at initial preflight

M1 original hash mismatch

M1 Golden regression failure

Task Packet digest mismatch

EPW time semanticsを説明できない

radiation unitsが曖昧

Wh/m²とW/m²の扱いが混在

missing solar dataを暗黙補間する必要がある

solar-position reference差を説明できない

third-party weather license / redistributionが不明なのにcommitが必要

security/privacy/permission/data-integrity failure

unexpected user changes

scope expansion required
```

Security / Privacy / Auth / Permission / Data integrity / irreversible data safety failureはQuality Debt化禁止。

---

# 37. Git / PR Policy

禁止:

```text
main direct mutation
Ready for Review
merge
auto-merge
rebase
force push
branch delete
Vercel
Production
Release
visibility change
permission change
secret change
```

許可:

```text
feat/m2-weather-foundation branch
normal commits
normal push
Draft PR
```

Draft PR作成はM2 Completion時に許可。

---

# 38. Completion Report

```text
# Facade Solar Lab — M2 Weather Foundation Completion Report

Run ID:
Mode:
Task Packet:
Revision:
Digest:

Initial base:
Branch:
Final head:

M1 closeout:
-

M1 regression:
- HTML SHA-256:
- HANDOVER SHA-256:
- golden check:

Canonical Weather:
- contract:
- time semantics:
- radiation units:
- missing policy:

EPW:
- parser:
- LOCATION:
- DATA PERIODS:
- intervals/hour:
- 8760:
- 8784:
- sub-hour:
- malformed/missing tests:

Solar position:
- algorithm:
- reference source:
- independent tests:
- tolerance:

Weather irradiance:
- beam:
- diffuse:
- ground:
- overhang shading:
- provenance:

Real EPW validation:
- status:
- source:
- location:
- retrieved:
- SHA-256:
- records:
- missing solar:
- committed to repository: no
- license/provenance status:

M1 vs M2 comparison:
- annual:
- cooling:
- heating:
- note:

Checks:
- npm test:
- typecheck:
- build:
- audit:
- golden:
- diff:
- secret/privacy:
- external data provenance:

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

main mutation:
Vercel mutation:

Final State:
COMPLETE_VERIFIED /
COMPLETE_PENDING_FULL_VERIFY /
BLOCKED

Human Gate:
STOP

Next recommended task:
M3 — Facade Geometry
```

M3には自動で進まないでください。

**M2完了後はDraft PRを作成し、Independent FULL Review待ちで停止してください。**



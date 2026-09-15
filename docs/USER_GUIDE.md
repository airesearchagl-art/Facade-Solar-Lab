# M8 In-app User Guide & Technical Manual

## Status

`IMPLEMENTATION_COMPLETE / HUMAN_UX_REVIEW_PENDING / INDEPENDENT_FULL_REVIEW_PENDING`

本書はin-app manualの実装contractと保守ルールです。利用者向け本文の正本はアプリ上部の「使い方・技術情報」 (`#guide`) とし、本書へ同じ長文を複製しません。M8は計算物理モデルを追加・変更しないdocumentation / navigation milestoneです。

M5は`LOCAL_VALIDATION_COMPLETE / EXTERNAL_REFERENCE_PENDING`。Radiance / EnergyPlus / SPA / annual physical validationは`NOT_RUN`のままで、Guide公開はformal absolute-kWh validationを意味しません。

## Information architecture

上部Workspace navigationは次の3状態を持ちます。

| Hash | Workspace | Mount contract |
| --- | --- | --- |
| `/`, `#single` | 単一階モード | default。Guide/Multi移動後もmount維持 |
| `#multi` | 複数階モード | Single/Guide移動後もmount維持 |
| `#guide`, `#guide-*` | 使い方・技術情報 | server routeを追加しないstatic page |

invalid hashは安全にSingleへfallbackします。UI tab、direct `#guide`、reload、browser back/forwardをhashchangeで同期します。Single / Multiは条件分岐で破棄せず`hidden` sectionとして維持するため、Cases、Floors、browser-local EPW dataset、入力、last calculation result、dirty/stale stateはGuide往復だけではresetされません。

Guide内の章anchorは`#guide-` prefixを使います。これにより同じURL fragment内で目次jumpとGuide workspace判定を両立します。

## In-app chapter contract

| Chapter | UI implementation | Contract |
| --- | --- | --- |
| Landing / 3分で試す | `UserGuide` hero / quick steps | 6-step操作、実ボタン名、Demoとsynthetic警告 |
| Single / Multi | mode cards / structure flow | 最大4案、Floor composition、cross-floor非対応 |
| Parameter Reference | static SVG / parameter cards | UI名、単位、意味、増減、注意。pitch例と最大枚数 |
| Study examples | 3 study cards | 庇、フィン、Multi。結果数値・優劣をhard-codeしない |
| Results Guide | result cards | period、baseline/delta、「庇あり/なし」、Building Total |
| Export / Preset | export cards | current snapshot、stale禁止、input-only JSON、再計算 |
| Technical Manual | details / pipeline / formula | solar、direct v1/v2、diffuse、ground、gain、Multi |
| Model Limitations | supported / unsupported | formal validation境界とM5 external NOT_RUN |

## Model identity source

`src/app/guide-contract.ts`がGuide表示用identityを集約します。

- direct v1 / diffuse / ground / default periods: `src/engine/facade-v1` exports
- direct v2: `src/engine/facade-v2` export
- maximum intermediate fins: `src/geometry/facade-v2` export
- solar position: engineの`SolarPosition["algorithm"]`型でcompile-time制約し、testで実際の`calculateSolarPosition()`戻り値と照合

UI本文にmodel IDや最大枚数を重複hard-codeしません。engine identityを変更する場合はGuide contract testと表示を同じchangeで確認します。Guideのために計算式、epsilon、preset schema、weather contractを変更しません。

## Static diagrams and accessibility

Guide専用SVGはparameter説明用で、CAD寸法図ではありません。remote image/font、iframe、analyticsを使用しません。SVGには`title` / `desc`、目次とworkspace導線にはnavigation label、各章には`h1 → h2 → h3`の見出し構造を持たせます。操作要素はnative `button` / `a` / `details`を使い、既存のfocus-visible表示を共有します。

Desktop / tablet / 390pxでカード、目次、SVG、formula、technical detailsがdocument幅を超えないことをbrowser smokeで確認します。`prefers-reduced-motion`ではsmooth scrollを無効にします。

## Print contract

Guideの「このマニュアルを印刷 / PDF保存」は`window.print()`だけを呼びます。専用生成libraryやnetwork uploadはありません。

印刷時はWorkspace navigation、buttons、目次、hidden Single/Multiを除外し、Guide本文・SVG・全technical detailsを表示します。色だけに依存せずborderとtextを保持し、parameter / diagram / technical blockの途中分割を抑制します。

## Security and privacy

- Guideはstatic client content。新しいnetwork request、upload、cloud persistence、analyticsなし。
- raw EPW、EPW bytes、local path、結果をJSON presetへ追加しない。
- external iframe、remote image/font、secret/env、Vercel設定を追加しない。
- hashは固定workspace名と`guide-` anchorだけを解釈し、HTMLや外部URLへ展開しない。

## Validation contract

Automated tests cover hash/default/invalid mapping、all chapters、parameter keys、centred pitch example、engine identity、periods、M5/HVAC/BEI limitations、unique IDs、semantic navigation、responsive/print selectors。Local browserはdirect hash、reload/back/forward、Single/Multi state preservation、anchors、390px overflow、technical details、print mediaを確認します。

既存のrequired checksは変更しません。

```bash
npm test
npm run typecheck
npm run build
npm run golden:check
npm audit
git diff --check
git diff --check origin/main...HEAD
```

Local browser evidence (`2026-09-16`): direct `#guide`、root/invalid fallback、UI mode transition、Guide anchor、reload、back/forward、Single/Multi input・result・stale・selected Floor保持、desktop / 390px overflow、native details、loaded print media contract、app-origin console error 0を確認。390pxはviewport 390 / document scrollWidth 375、上部3 nav・目次・parameter cards・SVG・formulaを表示しました。専用PDF生成は既存Chrome headlessのWindows GPU/blank-page failureで作成できず`UNVERIFIED`、一時profileは削除済みです。これはHuman print visual reviewのpending項目で、専用library/installや代替uploadは追加していません。

## M7 post-merge closure used by M8

Checked `2026-09-16T03:35+09:00` read-only:

- GitHub: PR #12 merged、squash commit / `main` = `642136058d538e89d29971b0a586f86ea3aaa926`。
- Vercel: `dpl_DyRqKwmhrdHo8gQNqw9pqqmyAR7v` = Git / main / exact SHA / production / READY / Current。canonical `facade-solar-lab.vercel.app` assigned。
- HTTP: `/`、`/favicon.svg`、`/assets/index-D49WKT7i.js`、`/assets/index-B6EFbBDS.css` = 200 / expected MIME / non-empty。
- Canonical browser: Single/Multi fin pitch demo、pitch edit、stale、rerun、finite results、repeated fin geometry、Multi Floor selection / Building Total、390px = PASS。app-origin fatal/console error 0、asset 404 = 0。Chrome extension自身のSentry console messageはproduct errorから除外。
- Manual Production mutation / CSV・PDF再acceptance: none / not required。

以上によりM7は`MERGED / PRODUCTION_PROVENANCE_PASS / PRODUCTION_BROWSER_SMOKE_PASS / COMPLETE`です。

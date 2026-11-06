# G3 UI Follow-up — Guide and Workspace Layout

Status: **INDEPENDENT_FOCUSED_REVIEW_PASS** — FSL-GLZ-G3-UI-FOLLOWUP-IR-001, 2026-11-06 JST. Required Fix: NONE. A01/A02/A03: CLOSED for the fixed follow-up candidate. Human UX and G1 formal acceptance remain PENDING.

## Scope and source identity

Published starting point: `e8c5371e23fe3d70bfe8de9fd57323cfc1cc499c` in [Draft PR #19](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/19). G1 base: `c74ac89d8773689d04cad767eb66eabe6893fd81` in [Draft PR #18](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/18). Main remains `56a0f19eb4103c5231f09ec1c79dcfe2f782d783`. The preceding [Narrow UX handoff](00_ENTRY.md) describes its earlier checkpoint; the three layout advisories retained there are resolved by this follow-up.

- A01: the four-child glazing Guide section reused the two-child scope aside's two-column grid. A dedicated single-column class now gives each description the available content width. The original aside, text, section IDs, native controls and print rules are unchanged.
- A02: Workspace navigation stays in normal document flow at all widths. Removing sticky positioning, top and z-index prevents the navigation from covering body content during scrolling.
- A03: the body no longer forces 320 CSS pixels when the scrollbar leaves less client width. No overflow hiding was added; the comparison table retains its own scrolling.

The increment contains two product paths, three appended regression cases in two existing test files, and this handoff. No tests were removed. JSON v1, session, revision/digest, STALE/UNKNOWN, calculation engine, weather, geometry, dependencies and Golden expectations are unchanged. General construction categories do not supply performance values; fictional samples remain separate from user metrics and provenance.

## Author and independent measurements

| Evidence owner and scope | Result |
|---|---|
| Author, this follow-up | 6 related test files / 49 PASS / 0 FAIL; typecheck, build and diff check exit 0. Patch application and reconstruction each matched all 303 raw source hashes. No author GUI run |
| Independent non-GUI phase | Independently reconstructed 303 files, strict patch application PASS; 6 related files / 49 PASS / 0 FAIL / 0 SKIP; typecheck, build and diff checks PASS. Full five-file public-safety inspection found no private data, credentials, private evidence or unlicensed product values |
| Independent final Focused Review | **A. PASS**, Required Fix NONE, A01/A02/A03 CLOSED after the measurements below. The 49 tests were not repeated during the GUI phase |

The previous Narrow author's 817 PASS / 10 external-reference SKIP and previous independent 817 PASS / 10 SKIP plus four counterexamples remain historical evidence for their earlier scope. They are not fresh results for this follow-up. Full suite, Golden and standalone audits were not rerun in this focused scope with unchanged calculation and dependency bytes. The independent installation reported zero vulnerabilities as part of `npm ci`; it is not a new standalone-audit result. The existing 525.63 kB main-bundle warning remains.

## Independent browser measurements

| Finding | Matched measurement and result |
|---|---|
| A01 / Guide | At 1280×900, DPR 1, first description width changed from **0 to 1087px**, height from 1890 to 42px. The original aside retained its two columns and readable content. CLOSED |
| A02 / navigation | Same synthetic input, 1280×900 and actual scrollY 1373. Previous sticky nav: top 12 / bottom 68. Candidate static nav: top -1361 / bottom -1305, outside the visible body and controls. CLOSED |
| A03 / page overflow | At 320×568, Single/Multi/Guide/Glazing each measured body width 305 and document clientWidth = scrollWidth = **305px**. CLOSED |

At 390×844, editing a manual single-pane case with synthetic η 0.5 to a triple construction preserved the value and both applicability warnings, passed through STALE, and reached U3/Current after explicit update. Four cases retained 0.5/0/UNKNOWN/0.75, long names and Unicode provenance. Keyboard scrolling reached the last column and revision row with fixed headings and labels. Sample ON showed 16 fictional-data warnings without real-source attribution; OFF restored the actual table text exactly. At 1280×900, four cases fit the table (1200/1200) and page (1265/1265). Mode round-trips preserved the synthetic Single/Multi inputs and four-case Current table.

These observations belong to the independent reviewer. Dedicated tabs were closed and their viewport/DPR restored at the end of the authorized session. This publication step does not reopen a browser or repeat the tests.

## Verification limits

NOT_RUN in this resumed GUI window: fresh 1280px one-case measurement; a separate 320px table-region width/keyboard probe; overlap probes for every individual wide-screen editor control; physical touch; actual JSON download/reselection; browser local_record import/bind; print/PDF and browser zoom.

The reviewer judged these coverage limits non-blocking for the three directly measured fixes. The 1280px one-case conclusion is review inference based on unchanged comparison-table/session bytes, independent one/four-case rendering and state tests, and the measured four-case width. It is **not** a new one-case Browser PASS. Table-local scrolling was measured at 390px; the four-mode page widths were measured at 320px.

## Fixed evidence and publication mapping

The reviewed 303-file source manifest SHA-256 is `b7f5afe6981c2ddcdef7e5f1b5384d4b3da8a768604d38ff61778b8867b53e27`; focused manifest `0300ca99d286afdf7acba2443d94acacc2eb30d6eca88c22a747bb40132f12fa`; patch `2f6b413453ae60afb7d3503caaab4879e635c5ba51d3d40937aa28153d243e86`. The unchanged local review ZIP is 82,525 bytes, SHA-256 `e3a4def5a3bcc8b84f95d064dc4e95c024a21c6fb1ab19d4c49d16de9708f9c3`.

Independent final report: text SHA-256 `3fed2421d34ac6ce2a47819a964da69f7ef4dc5bfca5c2d5ce6186c05d816074`; structured report `f9837d18db41c0c35ebf71c5c8f29ef1c9a3409c186a256acbeae3324434d7e4`. Raw browser observations: `6295932ff1a18717e56c9a1c12cbcfa28fcb0d0cabfd6ddc0bd629248cbdcc48`; cleanup record: `55e59056d7898c08d4bd89f0c0520e3e50241b88c5fb9d0906f761ccd8448beb`. Private reports, logs, images and ZIPs remain local.

This document alone is updated after the reviewed checkpoint to report the completed independent result and its limits. Its reviewed predecessor SHA was `f1671a3d49c7404d0d6a3126a10fa405e1b22ba4d4a6197803ab0e0f16c561c1`. The frozen source manifest is retained; the final publication mapping records this factual document-only change separately. All four product/test paths retain their reviewed raw SHA-256:

| Path | Reviewed and published content SHA-256 |
|---|---|
| `src/app/components/UserGuide.tsx` | `1d79b19e4946aa57f5445fe9a6147f0aa65e923a300933cf00a427b9561ef76f` |
| `src/app/styles.css` | `772bb1f1a0e99650797bd9091e5f7219ec1f4566b16abeca6f76c8709506777c` |
| `tests/glazing-g3-layout.test.mjs` | `0013e5c6176f6a16ecbde4c0dfbd48c0cdfc4764178ccbd5154dc21fed6c2e36` |
| `tests/m8-user-guide.test.tsx` | `2dce2b3afcedf9f2e4c120791e49c3a5b921f190f027204c6cbe012bfa62343b` |

## Remaining gates

Human UX/G1 formal acceptance: PENDING. AC24: BLOCKED / historical attribution UNDETERMINED. AC26: NOT_RUN under the separate M11 gate. Public Catalog Bundle: BLOCKED. Six manufacturer originals: SOURCE_RECHECK_PENDING. M5 external physics validation: EXTERNAL_REFERENCE_PENDING.

Earlier reserved-heading/CRLF classification advisories and the bundle-size warning remain. Historical AC24 records and the previous author/independent listener observations are not reclassified or resolved by this change. Draft publication and automatic Preview results do not grant Human acceptance, Ready, merge, auto-merge or manual Production authorization. PR #18, main and M11 PR #16 remain unchanged.

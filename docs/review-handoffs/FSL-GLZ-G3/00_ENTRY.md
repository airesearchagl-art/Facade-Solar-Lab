# G3 Early MVP — Narrow Workspace and Comparison Review

Status: AUTHOR_VALIDATED / INDEPENDENT_FOCUSED_REVIEW_PASS (2026-11-06 JST). This document is prepared for a new stacked Draft PR; it is not a Human acceptance record.

## Scope and baseline

G1 base: `c74ac89d8773689d04cad767eb66eabe6893fd81` on `codex/glazing-g1-performance-comparison` ([Draft PR #18](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/18)). Main: `56a0f19eb4103c5231f09ec1c79dcfe2f782d783`. New candidate branch: `codex/glazing-g3-narrow-ux`.

The complete G3 delta includes the previously reviewed general construction selector, session-only project name, explicit fictional sample display, and construction applicability notice. The current focused delta keeps the Workspace navigation in document flow at widths up to 720px, removes negative navigation margins, and adds a bounded comparison region with fixed case headings and metric labels. Keyboard instructions are linked to the focusable region. Horizontal column snapping keeps values clear of the fixed metric column.

General construction categories supply no performance values. Existing user metrics and provenance remain separate from the chosen category; their applicability is explicitly unconfirmed. Comparison rendering does not change revision, digests, snapshots, selected entry, JSON v1, or source data. There are no dependency, calculation engine, weather, geometry, Golden expectation, or G2/G4 changes.

## Author verification — 2026-11-05

Windows / Node 24.15.0 / npm 11.12.1. Final source: 55 test files, 817 PASS / 10 external-reference SKIP / 0 FAIL; typecheck, build, Golden, npm ls --all and diff check exit 0. Full and production audits each report zero vulnerabilities. The build still reports a chunk above 500 kB.

Dedicated local browser tabs used synthetic data only. At 390×844, one and four cases, 0 and UNKNOWN, long provenance, Current/STALE, fictional sample on/off, keyboard access to all four columns and the revision row were exercised. At 1280×900, one and four cases fit without horizontal page overflow. Single/Multi/Guide/Glazing navigation and synthetic input retention were checked. Real touch hardware, downloads and Human UX were not tested in this focused change.

This is not a console-clean certification. During editing, a transient development-server module response omitted its export; a same-byte file refresh restored the served module. Later, six identical message-channel errors were recorded with a page URL but without a stack or a conclusive origin. They remain UNDETERMINED. Extension-origin Sentry/i18n messages are separately identified from their explicit extension URLs. Current observations do not resolve the historical AC24 errors.

## Independent Focused Review — 2026-11-06

FSL-GLZ-G3-NARROW-UX-IR-001: **A. PASS for the current Narrow UX delta; Required Fix NONE**. The independent reviewer verified reconstruction of all 302 source files and the focused five product/test paths plus this handoff checkpoint. Independent measurements: 817 PASS / 10 external-reference SKIP / 0 FAIL, plus 4 independent counterexamples PASS. Typecheck, build, Golden, both audits, dependency integrity and diff checks PASS; both audits report zero vulnerabilities. These results are separate from the author measurements above.

Independent browser evidence covers 390px and PC-width one/four-case comparison, zero/UNKNOWN, long names and provenance, keyboard access through the fourth case and revision row, sample reversal and Single/Multi input retention. Physical touch, actual JSON download/reselection, browser local_record import/bind, zoom and print/PDF were NOT_RUN; the local_record data contract was tested in an independent non-GUI counterexample.

Advisories retained without expanding this change:

- NARROW-IR-A01 (P2): the existing Guide grid gives its first description a 0px column at 1280px; independently reproduced with identical dimensions on the previous Boundary candidate.
- NARROW-IR-A02 (P3): existing PC-width sticky navigation can overlay body text. A matched-input, matched-scroll overlap comparison was NOT_RUN.
- NARROW-IR-A03 (P3): existing body minimum width causes 15px page overflow at 320px with a desktop scrollbar.

The independent reviewer also captured six listener message-channel records, classified UNDETERMINED without stack/event identity. They are a separate observation from the author's six records and the historical AC24 cases. Neither set resolves AC24. Earlier MVP reserved-heading/CRLF classification advisories and the bundle-size warning remain unchanged.

Reviewed source manifest SHA-256: `773c51ff7cc17e06e3e42c0ad14c07126089162c031a4b32a5458c7847e0bfc0`; focused manifest: `03599de44cba7e776f77c5567775a5dd26e8ab089f19601e7f091499c25de4ff`. The local review package SHA-256 is `5c9c18574ac270cde67a2a1bef164cd8094f4efc3285abb4337f60eb08fbeb04`. Private evidence remains local. This publication step updates only the factual review summary in this document; all ten product/test files retain their reviewed working-file bytes. The actual staged Git blobs for all ten product/test files match their reviewed bytes exactly; no line-ending conversion or semantic source change was observed in this publication step. The final index-to-review SHA mapping is retained in the local publication evidence.

## Review and publication gates

The prior MVP independent PASS belongs to its eight-file manifest `b096d7708c36182e70e9e3408673701c7a4b79f92a2e449866be1de7a23fd1d7`. The prior Boundary independent 70 PASS belongs to its four-file manifest `063c6771bb285f91f1fd1e484c279b304ee8637644d4ba70562209f7fd1bcea6`. Those historical results are not substituted for the separate Narrow UX independent result above.

The existing independent reviewer completed the focused assessment above. The authorized publication step performs a fresh source-identity and public-safety inspection, commits the eleven explicit source/test/document paths, normally pushes the G3 branch and creates a new Draft PR based on the G1 branch. PR #18 is not modified. Ready, merge, automatic merge and manual Production operations remain outside this authorization.

AC24 remains BLOCKED; AC26 NOT_RUN (separate M11 gate); G1 formal acceptance and Human UX PENDING; Public Catalog Bundle BLOCKED; six manufacturer sources SOURCE_RECHECK_PENDING; M5 external validation EXTERNAL_REFERENCE_PENDING. Local screenshots, browser/session logs, private evidence ZIPs and absolute personal paths must not be committed.

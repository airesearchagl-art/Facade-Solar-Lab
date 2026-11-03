# FSL-GLZ-G1 — PR-first Handoff Entry

**Status:** CONTROLLER HANDOFF / DOCS ONLY — NOT AN INDEPENDENT CODE REVIEW  
**Receiving mode:** READ-ONLY / Independent Focused Review R3 after source access gate  
**Updated:** 2026-11-03 (JST)  
**Related workflow:** [PR-first Review Handoff](../../PR_FIRST_REVIEW_HANDOFF.md)

## 1. Current objective

Stop requiring the user to attach ZIPs or Markdown task packets whenever switching development and reviewer threads. Use **this GitHub Draft PR** and its versioned Markdown handoff as the entry point.

**No G1 feature source code is present in this handoff PR.** G1 is still uncommitted in a local worktree. Independent G1 source review requires a separately authorized feature commit/push/PR or another authorized byte-access method. Do not claim R3 PASS based solely on this document or an author test report.

## 2. Last reported implementation / reviews

- Project: `airesearchagl-art/Facade-Solar-Lab`
- G1 feature branch (local only): `codex/glazing-g1-performance-comparison`
- G1 base main: `56a0f19eb4103c5231f09ec1c79dcfe2f782d783`
- M11 PR: [#16](https://github.com/airesearchagl-art/Facade-Solar-Lab/pull/16) — previously `OPEN / Draft / unmerged`, head `765838b667f9fb06df8661ec0df11e0672dd294f`
- G1-IR-F01: `CLOSED` (previous independent focused review)
- `G1-IR-001R-RF01`: **author FIXED, independent R3 PENDING**
- Latest author report: URL 71/71 PASS, G1 focused 127 PASS, full 788 PASS / 10 external-reference SKIP / 0 FAIL, typecheck/build/Golden/npm ls/diff PASS, audit 0. **These are author-reported, not R3 independent results.**
- Current known separate gates: AC13/AC20 independent confirmation PENDING; AC24 `BLOCKED — HISTORICAL ERROR ATTRIBUTION PENDING`; AC26 `NOT_RUN — M11 SEPARATE GATE`; Human UX PENDING.
- Public manufacturer catalog bundle: `BLOCKED`; six manufacturer source rows `SOURCE_RECHECK_PENDING`; M5 physical external reference `NOT_RUN`.

Last reported source/evidence package (local-only, **not available through this PR**):
`FSL_Glazing_G1_R3_SPEC_H1_Independent_Focused_ReReview_Evidence.zip`
- Reported size: 1,964,487 bytes
- Reported SHA-256: `040a2849177429ba8c302d888b6704d1ce3eff317f37f6477a54dd6d7d50559b`
- Reported 134 ZIP entries; source reconstruction 292 files
- Source availability: `LOCAL_ONLY`. Do not infer that GitHub can fetch ZIP bytes.

## 3. Task — Independent Focused Re-Review R3

Focus only on the URL validation compatibility Required Fix `G1-IR-001R-RF01`:

1. Validate strict one-layer URL semantics separately from recursive credential-key detection.
2. Check safe acceptance of literal percent-encoded text such as `mark%25AB`, `mark%25C3`, `mark%25AB%2520name`, `discount%25`, `%25E0%25A4`, `%25C0%25AF`.
3. Check credential and control-key rejection: `%74oken`, `%2574oken`, `access_%74oken`, `mark%25AB%2574oken`, `%2500`, `%257F`, mixed payloads, multiple keys, case variants and 8/9 decoding boundary.
4. Review five old-serializer regenerated v1 fixtures as **regenerated**, not the historical reviewer's exact bytes. Evaluate original URL preservation, digest, source basis, parse/serialize and import atomicity.
5. Verify that G1-IR-F01 code remains unchanged and AC18 stays PASS.
6. Independently test or explicitly mark NOT_RUN: focused tests, full tests, typecheck, build, Golden, audit, browser file round-trip.
7. Keep AC24 BLOCKED and AC26 NOT_RUN regardless of R3 outcome. Classify old and new listener errors separately; do not invent origin.

**R3 verdict:** `A. PASS / B. REQUIRED FIX / C. BLOCKED`. If source bytes cannot be fetched and independently verified, report `BLOCKED — CODE_NOT_AVAILABLE` rather than claiming code review completion.

## 4. Exact-head and evidence boundaries

This docs-only PR HEAD is the identity of **this handoff**, **not** G1 feature source identity.

Before every review:

- Fresh fetch this Draft PR and M11 PR #16.
- Verify the HEAD of each PR and current `main`, and note drift.
- Read this file **at the docs-only PR HEAD** (not default branch).
- Do not mistake author-reported tests for independent measurements.
- If the G1 feature is later pushed with explicit Human authorization, use its separate exact feature PR head and updated source/evidence manifest.

## 5. Prohibited operations

- No code edit/commit/push/PR creation for G1 without separate Human authorization.
- No M11 PR #16 modification; no Ready/merge/automerge/deploy.
- No raw weather, manufacturer catalog, private local data, credentials, or oversized evidence ZIP committed to this public repository.
- No AC24 or AC26 closure based on unrelated R3 results.
- No undocumented claims that GitHub now contains the G1 implementation.

## 6. Next controller decision

**Current workflow transition is documentation-only.** To eliminate manual evidence ZIP attachments *for independent code review*, the controller must request **separate explicit Human approval** for a sanitized G1 source/evidence commit, push and Draft feature PR. Until then this Draft PR is the shared instruction hub, but code/evidence stays local-only.

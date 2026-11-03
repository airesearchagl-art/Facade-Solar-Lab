# PR-first Development / Independent Review Handoff

Status: **PROPOSED / DOCS-ONLY**  
Scope: Facade Solar Lab development, independent review and thread handoff  
Authoritative for this proposal: the associated Draft PR. This document does not authorize release actions.

## 1. Goal

Use a GitHub **Draft PR URL as the handoff entry point** between implementation, controller, and independent-review ChatGPT threads. Avoid manual reattachment of Markdown instructions and evidence ZIPs for each thread transition.

**Important:** A Markdown handoff is not executable source evidence. An independent reviewer cannot review uncommitted local code just because a PR description points at it.

## 2. Three distinct tracks

| Track | Purpose | GitHub location | Constraints |
| --- | --- | --- | --- |
| Implementation | Actual implementation and tests | A feature branch + Draft PR, **only after explicit commit/push/PR authorization** | Source and HEAD are reviewed exactly |
| Review handoff | Review task packets, evidence index, decisions, unresolved items | Markdown files in a docs-only branch + Draft PR, or docs under an authorized feature PR | **Documentation does not imply code review PASS** |
| Restricted evidence | Private/local data, unlicensed manufacturer catalogs, raw EPW, private paths, large binaries and secrets | Remain in authorized local/private storage | Do **not** upload to this public repository or its PR |

A docs-only PR may be read by any independent thread. It is not a substitute for pushing a reviewable implementation branch.

## 3. Handoff directory and file conventions

For each campaign, create or update only authorized Markdown files under `docs/review-handoffs/<campaign-id>/`:

- `00_ENTRY.md` — current entry point, last observed states, next task, link to PR
- `01_REVIEW_TASK.md` — exact scope, independence gate, reproduction and acceptance conditions
- `02_EVIDENCE_INDEX.md` — source location, tool/version, test counts, SHA-256 of evidence, availability classification
- `03_FINDINGS.md` — historical findings, status transitions, Required Fix and Advisory
- `04_DECISIONS.md` — Human approvals and explicit prohibited actions

For small work, combine files while keeping all five sections. Avoid endless duplicate documents; maintain a stable `00_ENTRY.md`.

**Evidence availability** must be one of:
- `PUBLIC_IN_GIT` — complete file and exact blob/SHA obtainable from GitHub
- `PRIVATE_AVAILABLE` — available only through an expressly authorized private channel; do not expose its URL or local path
- `LOCAL_ONLY` — review cannot obtain the bytes remotely
- `NOT_RUN` / `UNVERIFIED` — no valid supporting evidence yet

Never label a local-only source as independently reviewable.

## 4. New-thread entry instructions

The controller gives the new thread just:
1. Repository URL and **specific PR URL/number**.
2. Review mode: `READ-ONLY INDEPENDENT` or `IMPLEMENTATION`.
3. The handoff entry path `docs/review-handoffs/<campaign-id>/00_ENTRY.md` and the exact branch or commit to read.

The receiving thread must:

1. Fetch the **PR fresh**: state, Draft, merged, base SHA, head SHA, changed files, checks, reviews, and mergeability. Compare with `Expected` in the entry file.
2. Read handoff Markdown **from the exact PR head**, not from `main`, and enumerate its linked task/evidence/decisions.
3. Read actual implementation source and tests from an **authorized exact feature head**, not from a documentation-only PR or a stale ZIP. If code is local-only, report `CODE_NOT_AVAILABLE` and limit scope to documentation/evidence review; do not claim an independent implementation PASS.
4. Distinguish implementation-session reports, independently reproduced results, browser measurements, Human acceptance, and unverified assertions.
5. Emit `PASS / REQUIRED FIX / BLOCKED` with exact observed source identity, evidence gaps and next action; do not silently advance Human gates.

A new thread should not require the user to upload the same Markdown again as long as it can access GitHub.

## 5. Branch / PR workflow

1. Controller authorizes the specific write scope. **Creating a Draft PR, committing, and pushing are distinct authorized mutations**; do not infer them from review approval or from permission to write local code.
2. Implementation thread checks the actual branch and worktree. It prepares a reviewable snapshot without mixing features.
3. After explicit permission, commit/push an exact feature head and open a **Draft PR** with links to handoff documentation. Keep the PR Draft through independent review.
4. Review thread works strictly read-only against that exact head. Required Fix findings are recorded in the handoff and repaired on the same feature PR after separate fix authority.
5. After any new implementation commit, re-evaluate changed scope, CI, and review evidence. `PASS` for an old head does not transfer automatically.
6. Human Ready authorization and Human merge authorization are separate. Git-triggered Preview or Production is not itself a review pass.

A docs-only handoff PR may be opened while the feature is local-only, but **do not merge it as if the feature were approved**. When the implementation branch becomes reviewable, link its feature PR from the handoff index.

## 6. Audit trail template

```yaml
campaign: FSL-GLZ-G1
review_id: FSL-GLZ-G1-IR-001RRR
handoff_kind: DOCS_ONLY
source_availability: LOCAL_ONLY
repository: airesearchagl-art/Facade-Solar-Lab
expected_main: 56a0f19eb4103c5231f09ec1c79dcfe2f782d783
source_feature_branch: codex/glazing-g1-performance-comparison
source_feature_commit: NOT_COMMITTED
reviewed_source_identity: "fixed main + local artifact manifest; not in GitHub"
m11_pr: 16
m11_expected_head: 765838b667f9fb06df8661ec0df11e0672dd294f
review_status: PENDING
ac24: BLOCKED
ac26: NOT_RUN
public_catalog_bundle: BLOCKED
```

These are last recorded values, **not fresh verification**. Recheck before each action. Update via a separate authorized docs write.

## 7. Protection / limitations

- This repository is **public**. PR bodies, comments, commits and Markdown are public and may remain in Git history.
- Never upload private product catalogs, unlicensed manufacturer tables, client files, raw EPW, secrets, tokens, credentials, local usernames or absolute paths, private screenshot data, or sensitive logs.
- Do not use GitHub Releases/attachments or issue comments to bypass the confidentiality boundary.
- Prefer concise reproducible synthetic test cases and public-safe source evidence.
- Do not change G1 implementation, M11 PR #16, main, Vercel or Production as part of docs-handoff setup.
- Independent reviewers must not implement or commit the code they are reviewing.
- No automated handoff is implied: only available authorized integrations and new-thread instructions can access GitHub.
- Review state is explicit. `READ-ONLY` is the default for independent review.

## 8. How to start a new thread

Send the new thread:

> Open the GitHub Draft PR <PR URL> (read-only). First verify its current head/base/state; then read `docs/review-handoffs/FSL-GLZ-G1/00_ENTRY.md` **at the PR head**, follow the linked Markdown task/evidence/decisions, and perform only the authorized review. If implementation bytes are not available on GitHub, STOP with `CODE_NOT_AVAILABLE` for code review rather than requesting the same handoff Markdown as an attachment.


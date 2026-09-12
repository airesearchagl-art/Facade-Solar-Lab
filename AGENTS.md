# Repository Guidance

## Start here

1. Read `.agent-run/LR-20260912-FSL-M0-001/RUN_STATE.md`.
2. Verify the Task Packet SHA-256 before resuming the recorded campaign.
3. Check the current branch, HEAD, remote, and working tree before editing.
4. Preserve unrelated or pre-existing changes.

## Architecture

- UI: Vite + React + TypeScript in `src/app/`.
- Calculation engine: Pure TypeScript in `src/engine/`.
- Domain types: `src/models/`.
- Weather ingestion and normalization: `src/weather/`.
- Never import React, DOM, Canvas, or browser globals into the calculation engine.
- Keep core calculations deterministic and usable from Browser, Node.js, batch tests, and validation scripts.

## Domain constraints

- Declare units at module boundaries. Prefer SI internally; never mix mm and m implicitly.
- Define angle convention, facade azimuth convention, time zone, and coordinate system explicitly.
- Use tolerances for geometry and floating-point comparisons.
- Shading geometry with a window-head offset depends on both `D/H` and `O/H`.
- Do not present unvalidated absolute `[kWh]` results as formal performance evidence.
- Keep weather-source provenance visible; do not disguise empirical factors as physical models.

## Required checks

```bash
npm test
npm run typecheck
npm run build
```

Add focused tests for changed engine behavior. Do not fabricate validation results.

## Scope and gates

- Current milestone: M0.
- Do not begin M1 automatically.
- Do not mutate `main`, mark a PR Ready, merge, deploy Production, release, force-push, delete branches, or change repository permissions/visibility without a new Human instruction.
- Never commit secrets, credentials, private URLs, personal data, client/project identities, unpublished design data, or user-specific absolute local paths.
- Legacy MVP sources must remain byte-for-byte unchanged. If absent, record the absence instead of reconstructing them.

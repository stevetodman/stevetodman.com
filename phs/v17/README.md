# Pediatric Hospital Simulator v1.8

## Canonical entrypoint

The hosted application starts at [`phs/index.html`](../index.html). GitHub `main` is the production source of truth. The simulator is a static-site application and requires no package installation or external JavaScript runtime dependency.

Because the case package is loaded with `fetch()`, run it through an HTTP server or the hosted site rather than opening `index.html` directly with a `file://` URL.

## Runtime loading order

The entrypoint loads the stable v1.7 platform modules in this order:

1. `styles.css`
2. `storage.js`
3. `analytics.js`
4. `engine-core.js`
5. `engine-actions.js`
6. `engine-assessment.js`
7. `ui-core.js`
8. `ui-debrief.js`
9. `app.js`

`app.js` then loads the explicit v1.8 audit-remediation layer before case initialization:

1. `integrity-base.js`
2. `integrity-engine.js`
3. `integrity-ui.js`
4. `integrity-assessment.js`
5. `integrity-layout.js`

This layered structure preserves the reviewed case package while isolating timing, observation-boundary, scoring, delegation, accessibility, and layout corrections for direct inspection and testing.

## Required case package

At startup, `engine-core.js` loads and assembles:

- `cases/manifest.json`
- `cases/patients/maya.json`
- `cases/patients/eli.json`
- `cases/patients/nora.json`
- `cases/patients/jamal.json`

`schema.json` describes the assembled case object used by the engine. The manifest and patient files remain separate for clinician-readable review and are merged at runtime.

The declarative base case identifies itself as v1.7.0. The v1.8 runtime records the remediated release as v1.8.0 without duplicating the clinical content package.

## Supporting educational and governance files

- `EXPERT_REVIEW_PACKET.md` — clinical, educational, and assessment review package
- `RELEASE_NOTES.md` — release scope, audit corrections, verification, and assessment boundary
- `schema.json` — declarative case schema
- `tests/integrity.mjs` — dependency and cross-reference audit
- `../../tests/phs-v18-audit-remediation.test.mjs` — UI-only regression suite for the audit findings

## Verification

From the repository root:

```bash
npm install
npm run test:integrity
npm run test:phs
node --test tests/phs-v18-audit-remediation.test.mjs
npm run test:bp
npm run test:smoke
```

The GitHub Actions workflows run syntax checks, case-package integrity, simulator behavior, UI-only audit regression, blood-pressure calculator tests, and site smoke tests for pull requests and production changes.

The UI-only audit-regression suite performs learner actions through rendered controls. It does not mutate simulator state or invoke internal scenario functions.

## Time model

- The scenario clock reconciles against monotonic wall time.
- Assessment pause freezes both time and clinical controls.
- Practice pause permits explicitly non-comparable exploration.
- Clinical work stops at exactly 840 seconds.
- An action crossing the deadline is interrupted and cannot apply effects or receive completion credit.
- Handoff occurs on a stopped clock.

## Observation model

The patient board, vital tiles, and trend display show learner-observed information rather than hidden physiology. Repeat measurements, examinations, urgent communications, and established continuous monitoring update the observed state.

## Learner data

Attempt history is stored locally in the browser under the key `phs.v17.learnerRecord`. No server-side learner account or institutional data store is included in v1.8.

## Assessment boundary

All scores and objective mappings are formative. The current rubric, weights, timing thresholds, language-quality rules, and mastery standard have not completed formal validity testing and must not be used for certification, promotion, entrustment, or independent-practice decisions.

## Version preservation

The live entrypoint references `phs/v17/` assets plus the v1.8 remediation modules stored in the same directory. Superseded implementations remain available in git history.
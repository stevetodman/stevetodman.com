# Pediatric Hospital Simulator v1.7

## Canonical entrypoint

The hosted application starts at [`phs/index.html`](../index.html). It is a static-site application and requires no package installation or external JavaScript dependencies.

Because the case package is loaded with `fetch()`, run it through an HTTP server or GitHub Pages rather than opening `index.html` directly with a `file://` URL.

## Required runtime files

The entrypoint loads these files in order:

1. `styles.css`
2. `storage.js`
3. `analytics.js`
4. `engine-core.js`
5. `engine-actions.js`
6. `engine-assessment.js`
7. `ui-core.js`
8. `ui-debrief.js`
9. `app.js`

## Required case package

At startup, `engine-core.js` loads and assembles:

- `cases/manifest.json`
- `cases/patients/maya.json`
- `cases/patients/eli.json`
- `cases/patients/nora.json`
- `cases/patients/jamal.json`

`schema.json` describes the assembled case object used by the engine. The manifest and patient files are stored separately for clinician-readable review and are merged at runtime.

## Supporting educational and governance files

- `EXPERT_REVIEW_PACKET.md` — clinical, educational, and assessment review package
- `RELEASE_NOTES.md` — release scope and assessment boundary
- `schema.json` — declarative case schema
- `tests/integrity.mjs` — dependency and cross-reference audit

## Integrity check

From the repository root:

```bash
node phs/v17/tests/integrity.mjs
```

The GitHub Actions workflow `.github/workflows/phs-v17-integrity.yml` runs this audit and JavaScript syntax checks whenever PHS files change.

## Learner data

Attempt history is stored locally in the browser under the key `phs.v17.learnerRecord`. No server-side learner account or institutional data store is included in v1.7.

## Assessment boundary

All scores and objective mappings are formative. The current rubric, weights, timing thresholds, and mastery standard have not completed formal validity testing and must not be used for certification, promotion, entrustment, or independent-practice decisions.

## Version preservation

The previous implementation remains under `phs/v16/`. The live entrypoint currently references only `phs/v17/` assets.
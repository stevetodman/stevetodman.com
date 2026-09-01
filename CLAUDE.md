---
status: active
next: Complete StudyHub live cloud-save acceptance in #39; then complete the six evidence-backed clinical review records in #42. Live Pages/search gates #38/#40 and CHD atlas provenance #41 are resolved.
---

# CLAUDE.md

This repository is Steve Todman's personal website and education/tool platform, deployed with Cloudflare Pages.

## Read first

For nontrivial work, read:

1. `MASTER_PLAN.md` — current roadmap and resume point.
2. `DEPLOYMENT.md` — Pages build boundary and live verification.
3. `site/catalog.json` — canonical class for every surface.
4. This file — stable operating rules.

If older PRs/issues conflict with these current files, current files win.

## Operating rule

Use first principles: question requirements, delete unnecessary parts/processes, simplify before optimizing, measure bottlenecks, parallelize independent work, and prefer native platform capabilities over new machinery.

Do not trade away clinical accuracy, privacy, accessibility, provenance, or regression protection for speed.

## Visibility and deployment policy

The site is intentionally **direct-link only** for now. Do not make it search-engine discoverable unless Steve explicitly changes this policy.

Required behavior:

- `_headers` sends `X-Robots-Tag: noindex, nofollow, noarchive` site-wide.
- `npm run build` normalizes every deployed HTML document to matching robots metadata.
- `robots.txt` leaves public pages crawlable so search engines can observe `noindex`; do **not** use `Disallow: /` as the indexing control.
- Do not publish a sitemap while this policy is active.
- Cloudflare Pages publishes `dist/`, never the repository root.
- Only `PRODUCTION` catalog routes deploy to Pages.
- `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED` material stays out of Pages.

`noindex` is not authentication. INTERNAL material is protected by **exclusion from the public deployment**, not by an Access rule on the main Pages site.

## Deployment classes

Every meaningful surface belongs in `site/catalog.json`:

- `PRODUCTION` — user-facing, deployed, and automatically covered by site smoke.
- `PREVIEW` — development/test surface retained in source, not deployed.
- `INTERNAL` — private/internal source, not deployed to public Pages.
- `SOURCE_ONLY` — repository/backend/developer source, never shipped in Pages.
- `ARCHIVED` — retained for history, not deployed.

When adding a user-facing page:

1. classify it as `PRODUCTION` only when it is ready for deployment and automatic smoke coverage;
2. add behavioral tests for meaningful interaction or clinical logic;
3. register clinical modules in `clinical/content-registry.json`;
4. never hide an omission by weakening route coverage.

## Production build boundary

```sh
npm run build
```

builds `dist/` and:

- copies PRODUCTION route roots only;
- removes any non-production route that shares a production directory;
- excludes SOURCE_ONLY/backend/developer material;
- strips the legacy optional Kawasaki CDN loaders from the production artifact;
- normalizes deployed HTML to noindex metadata;
- generates `dist/site/search-index.json` from PRODUCTION HTML only.

Cloudflare Pages settings:

- build command: `npm run build`
- output directory: `dist`
- production branch: `main`

Live production verification is automated after pushes to `main`. Issue #38 is closed after repeated successful production-verifier runs against `https://stevetodman.com`; do not regress the production-only boundary.

See `DEPLOYMENT.md` before changing live settings.

## Key surfaces

### Public platform

- `/` — curated homepage with site search
- `/education/` — resident-education hub
- `/about/`
- `/contact/`
- `/privacy/`
- `/search/`
- `/tools/`
- `/phs/`
- resident academies under their top-level routes
- `/study/`, `/math/`, `/cooking/`

### Non-production source

- `tools/*-preview.html` — PREVIEW
- `admin/` — INTERNAL
- `steven-os/` — INTERNAL
- `cardiohospital/` — INTERNAL
- `cardio-hospital-3d/` — SOURCE_ONLY
- `clipboard-sanitizer/` — SOURCE_ONLY
- `study/supabase/` — SOURCE_ONLY backend source/migrations, deployed separately

## Testing

Deterministic install path:

```sh
npm ci
npx playwright install --with-deps chromium
```

Important commands:

```sh
npm test
npm run test:platform
npm run test:smoke
npm run test:a11y
npm run test:math
npm run test:math:browser
npm run test:phs
npm run test:bp
npm run test:kawasaki
npm run test:hypertension
npm run test:cardiovascular-risk
npm run test:aortopathy
npm run test:myocarditis
npm run test:pals
npm run test:genetics-chd
npm run test:pedcardsurg
npm run build
npm run verify:production
```

CI runs independent browser suites in parallel. Site smoke and accessibility are separate shards; expensive page/mobile/StudyHub smoke checks use bounded native Node test concurrency.

Math Mission now has a dedicated fast regression gate plus real-browser learner-flow coverage. Preserve independent question-key verification, adaptive/mastery tests, cloud payload/apply round-trip coverage, diagnostic persistence, miss -> guided retry behavior, and rendered scratch-canvas draw/Undo/Clear assertions.

Preserve these test-design rules:

- never derive a quiz expected answer from the same DOM being tested;
- for async images, wait for expected `currentSrc`, `complete`, and nonzero `naturalWidth`;
- for irregular SVG geometry, resolve a real painted hit-test point rather than assuming the bounding-box center;
- do not force-click transparent lower overlays that a real user could not hit.

## Clinical content governance

`clinical/content-registry.json` is the lifecycle source of truth.

Rules:

- never invent review dates, reviewers, or sign-off;
- passing software tests or commit dates are not clinical review;
- unknown review metadata stays `needs-review-record`;
- documented dates are checked for staleness;
- use `clinical/CURRICULUM_MAP.md` before proposing new resident academies;
- corrections use `.github/ISSUE_TEMPLATE/content-correction.yml`;
- never put PHI in a public issue.

Issue #42 remains open for BP calculator, PHS, CCHD/newborn screening, Kawasaki, cardiovascular prevention/dyslipidemia, and Myocarditis review evidence.

## Asset provenance

`site/asset-provenance.json` is the provenance source of truth for production asset families.

StudyHub's U.S.-state geometry/source chain is documented in `study/ATTRIBUTIONS.md`. Do not restore unsupported public-domain claims.

Issue #41 is resolved. PR #73 recorded project-owner evidence that the PedCardSurg CHD surgical illustrations are project-generated, AI-assisted educational assets created specifically for the project under Steve Todman's direction, with human selection, clinical review, and integration documented. Preserve that evidence boundary; do not infer provenance or permission for unrelated assets by analogy.

## Search visibility state

Issue #40 is closed. Public-search rechecks found no `stevetodman.com` results surfacing after live noindex controls were verified. Keep crawling available for noindex processing, keep the sitemap absent, and reopen #40 if public search results recur while direct-link-only mode remains intended.

## StudyHub cloud save

StudyHub intentionally has no email/password sign-in.

- localStorage is immediate/offline truth;
- a high-entropy family token is the cross-device credential;
- only its SHA-256-derived hash is stored server-side;
- the token travels in the URL fragment and should be scrubbed after adoption;
- merge behavior is monotonic/union-oriented;
- active rounds/recent adaptive windows remain device-local;
- backend source/migration lives under `study/supabase/` and is excluded from Pages.

The live acceptance gate is `study/CLOUD_SAVE_ACCEPTANCE.md` plus issue #39.

## Current remaining gates

1. **#39 StudyHub live acceptance** — verify live migration/RLS/browser-role restrictions, the intended Edge Function path, rate limiting/error monitoring, and the complete two-device/offline merge sequence. Do not expose the family token in logs/issues.
2. **#42 Clinical review evidence** — complete evidence-backed review records for BP calculator, PHS, CCHD/newborn screening, Kawasaki, cardiovascular prevention/dyslipidemia, and Myocarditis.

Completed gates that should not be re-opened without contrary evidence:

- **#38 Live Pages production-only verification** — closed after successful automated verification against the live site.
- **#40 Search-engine removal** — closed after independent public-search rechecks found no surfaced site results.
- **#41 CHD atlas provenance** — closed after project-owner provenance evidence was recorded in PR #73.

Do not claim Supabase live administrative/device state without direct evidence.

## Long-lived PR backlog

- Reconcile Cardio Hospital PR #27 deliberately.
- Rebase/retest Steven OS PR #28 against the production-only Pages boundary.
- Treat old BP and ABPM branches as selective-port/re-review candidates, not ordinary merges.
- Do not mass-close evidence-bearing Cardio Hospital PRs without deliberate incorporation/supersession.

## Session protocol

At the end of substantive work:

1. update `MASTER_PLAN.md` and the `next:` frontmatter above to reality;
2. remove resolved/stale blockers from handoff docs;
3. update durable GitHub issues for external/manual work;
4. name active branches/PRs when any remain.

For large-file recovery, prefer Git blob/tree operations over reconstructing a truncated file response.

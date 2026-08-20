---
status: active
next: Complete live Cloudflare cutover/verification in #38; then search-result removal #40; then StudyHub live acceptance #39. Evidence gaps remain in #41 and #42.
---

# CLAUDE.md

This repository is Steve Todman's personal website and education/tool platform, deployed with Cloudflare Pages.

## Read first

For any nontrivial work, read in this order:

1. `MASTER_PLAN.md` — current roadmap and interruption-safe resume point.
2. `DEPLOYMENT.md` — Cloudflare Pages build boundary and live verification.
3. `site/catalog.json` — canonical deployment class for every surface.
4. This file — stable operating rules and current handoff.

If an older PR/issue/history note conflicts with these current files, the current files win.

## Current platform state

The repository-side platform program is complete and merged to `main`.

Key merged checkpoints:

- `44457d1` — classified/non-indexed platform foundation (#37): curated navigation, education/about/contact/privacy/search surfaces, classified `dist/` build, complete CI coverage, clinical governance, production verifier, accessibility/performance/provenance policy, StudyHub backend schema source, and durable deployment docs.
- `8fe0dda` — Pin Sprint irregular-SVG pointer-test hardening (#45).
- `75d98b2` — PHS tablet status-bar overflow fix (#51).
- `646761c` — evidence-backed clinical review metadata (#44).
- `236d992` — every deployed HTML document normalized to `meta robots=noindex,nofollow,noarchive` (#47).
- `2bb5caf` — production-only static full-content site search (#48).
- `d95b4dc` — StudyHub map/icon provenance and CC BY-SA attribution chain (#43).
- `593ccdb` — committed GitHub-generated npm lockfile and deterministic `npm ci` CI install (#50).

The final rebased validation runs for #43 and #50 were fully green across platform policy, Steven OS, syntax/integrity, PHS, all clinical/academy suites, complete smoke, and accessibility.

## Non-negotiable visibility policy

The site is intentionally **direct-link only** for now. Do not make it search-engine discoverable unless Steve explicitly changes this policy.

Required behavior:

- `_headers` sends `X-Robots-Tag: noindex, nofollow, noarchive` site-wide.
- `npm run build` also normalizes every deployed HTML document to `meta name="robots" content="noindex, nofollow, noarchive"` as defense in depth.
- `robots.txt` must leave public pages crawlable so Google/Bing can observe `noindex` and remove already-discovered URLs. **Do not use `Disallow: /` as the indexing control.**
- Do not publish a sitemap while this policy is active.
- PREVIEW and INTERNAL pages remain noindex even if public indexing is enabled later.
- INTERNAL pages require Cloudflare Access/equivalent authentication; `noindex` is not access control.

Issue #40 tracks removal of results already known to have been indexed. Do not start removal until the live noindex response is verified through #38.

## Deployment classes

Every meaningful top-level surface belongs in `site/catalog.json` as one of:

- `PRODUCTION` — intentionally user-facing and covered by production smoke.
- `PREVIEW` — direct-link preview/test surface; visibly labeled and noindex.
- `INTERNAL` — requires Cloudflare Access or equivalent protection.
- `SOURCE_ONLY` — repository source that must not ship in Pages.
- `ARCHIVED` — retained for history, not deployed/navigation-visible.

When adding a user-facing page:

1. classify it in `site/catalog.json`;
2. add PRODUCTION pages to the smoke inventory when appropriate;
3. add behavioral tests for meaningful interaction/clinical logic;
4. register clinical modules in `clinical/content-registry.json`;
5. never hide an omission by silently removing a route from coverage.

## Production build boundary

The repository root is **not** the intended Pages artifact.

```sh
npm run build
```

builds `dist/` and now performs all of the following:

- copies only classified deployable routes/assets;
- excludes SOURCE_ONLY/backend/developer material;
- strips optional Kawasaki CDN visualization loaders from production;
- normalizes all deployed HTML to noindex metadata;
- generates `dist/site/search-index.json` from PRODUCTION HTML only.

Cloudflare Pages should use:

- build command: `npm run build`
- output directory: `dist`
- production branch: `main`

See `DEPLOYMENT.md` before changing Cloudflare settings.

## Key surfaces

### Platform/navigation

- `/` — curated homepage
- `/education/` — resident-education hub with local-only Continue Learning
- `/about/`
- `/contact/` — correction/security/contact routing; not a patient communication channel
- `/privacy/`
- `/search/` — local static full-content search over PRODUCTION content only

### Clinical education/tools

- `phs/`
- `tools/`
- `newbornscreen/`
- `kawasaki/`
- `hypertension/`
- `cardiovascular-risk/`
- `aortopathy/`
- `genetics-chd/`
- `myocarditis/`
- `pals/`
- `pedcardsurg/`

### Family/personal

- `study/` — StudyHub, 50 States Challenge, Pin Sprint, vocabulary/fractions/math drills
- `math/`
- `cooking/`

### Internal/source-only

- `admin/` — INTERNAL; Cloudflare Access required
- `steven-os/` — INTERNAL; Cloudflare Access required
- `cardiohospital/` — INTERNAL legacy development preview
- `cardio-hospital-3d/` — SOURCE_ONLY
- `clipboard-sanitizer/` — SOURCE_ONLY
- `study/supabase/` — SOURCE_ONLY backend source/migrations, deployed separately

## Testing

Current deterministic install path:

```sh
npm ci
npx playwright install --with-deps chromium
```

Do not hand-edit `package-lock.json`. It was generated in GitHub Actions and validated with `npm ci` before merge.

Important commands:

```sh
npm test
npm run test:platform
npm run test:smoke
npm run test:a11y
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

CI is intentionally non-omitting: later suites use `if: ${{ !cancelled() }}` so earlier failures do not hide later regressions. JavaScript syntax scanning includes platform/search/scripts code.

Preserve these test-design rules:

- never derive a quiz expected answer from the same DOM being tested;
- for async images, wait for expected `currentSrc`, `complete`, and nonzero `naturalWidth`;
- for irregular SVG geometry, do not assume the bounding-box center is painted—use a browser-resolved hit-test point/topmost real pointer target;
- do not force-click transparent lower overlays that a real user could not hit.

## Clinical content governance

`clinical/content-registry.json` is the lifecycle source of truth.

Rules:

- never invent review dates, reviewers, or sign-off;
- a passing software test or commit date is not a clinical review;
- unknown review metadata stays `needs-review-record`;
- documented dates are checked for staleness;
- use `clinical/CURRICULUM_MAP.md` before proposing new resident academies;
- corrections use `.github/ISSUE_TEMPLATE/content-correction.yml`; never put PHI in a public issue.

Evidence now recorded in the registry includes hypertension plus the documented Aortopathy, Genetics of CHD, PALS, and PedCardSurg review statements. Issue #42 remains open because BP calculator, PHS, CCHD/newborn screening, Kawasaki, cardiovascular prevention/dyslipidemia, and Myocarditis still need actual review records/evidence.

## Asset provenance

`site/asset-provenance.json` is the provenance source of truth for production asset families.

StudyHub's U.S.-state geometry was traced to the WebsiteBeaver/Wikimedia source chain and is conservatively treated as CC BY-SA-derived material; `study/ATTRIBUTIONS.md` contains the required attribution chain and is linked from Study Hub. Do not restore the older unsupported “generic public-domain dataset” claim as the license basis.

Issue #41 remains open only because the CHD surgical-atlas PNG creator/source/license/permission evidence is still unknown. Do not infer permission from repository presence or the code license.

## StudyHub cloud save

StudyHub intentionally has no email/password sign-in.

- localStorage is immediate/offline truth;
- a high-entropy family token is the cross-device credential;
- only its SHA-256-derived hash is stored server-side;
- the pairing token travels in the URL fragment and should be scrubbed after adoption;
- merge behavior is monotonic/union-oriented so offline devices should not erase each other's progress;
- active rounds/recent adaptive windows remain device-local;
- backend source/migration lives under `study/supabase/` and is excluded from Pages.

The real-device/live-backend acceptance gate is `study/CLOUD_SAVE_ACCEPTANCE.md` plus issue #39.

## Current remaining gates

These are the only active platform-program gates that should be treated as unfinished:

1. **#38 Cloudflare classified-deploy/Access cutover** — configure Pages to build `dist`, protect INTERNAL routes, verify source-only routes are absent, verify live noindex/security headers, run production verification.
2. **#40 Search-engine removal** — after #38 proves live noindex, use Google/Bing tooling as appropriate and verify public search results disappear.
3. **#39 StudyHub live acceptance** — apply/verify the live Supabase migration and abuse controls, then perform two-device/offline merge acceptance without exposing the family token.
4. **#41 CHD atlas provenance** — recover creator/source/license/permission evidence or replace assets before broader public redistribution if evidence cannot be established.
5. **#42 Clinical review evidence** — complete the six unresolved module review records described above.

No Cloudflare Pages or Supabase management connector is available in the current agent environment; do not claim those live settings are active without direct production evidence.

## Long-lived PR backlog

Do not confuse these with the completed platform program:

- #27 remains the Cardio Hospital integration candidate; it is heavily diverged and must preserve the current platform workflow/handoff when reconciled.
- #28 Steven OS org-ingest requires rebase/retest against INTERNAL/classified deployment behavior.
- #1 old BP workflow should not be merged wholesale; port only still-needed clinical concepts onto current main after fresh governance review.
- #3 ABPM remains PREVIEW-only and retains real-device/accessibility/live-header/specialist-validation gates.
- Do not mass-close #19/#20/#22/#23/#24; they remain evidence-bearing/stacked Cardio Hospital work until deliberately incorporated/superseded.

## Session protocol

At the end of every substantive session:

1. update `MASTER_PLAN.md` to reality;
2. update the `next:` frontmatter above;
3. keep only current work in this handoff—remove resolved blockers;
4. update durable GitHub issues for external/manual work;
5. name active branches/PRs explicitly when any exist.

For large-file recovery, prefer Git blob/tree operations over reconstructing a truncated file response. A prior interrupted whole-file write truncated the PedCardSurg test; it was recovered from the exact intact git blob.

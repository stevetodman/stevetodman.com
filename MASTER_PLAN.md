# stevetodman.com Platform Master Plan

Status: REPOSITORY PLATFORM HEALTHY — external/live evidence gaps remain
Owner: Steve Todman
Created: 2026-08-19
Updated: 2026-08-20

## Operating principles

Use first principles. Delete unnecessary requirements and processes before optimizing them. Prefer native browser/Node capabilities, small diffs, independent parallel work, measured bottlenecks, and explicit deployment boundaries.

Clinical accuracy, privacy, accessibility, provenance, and regression protection remain hard constraints.

## Non-negotiable deployment policy

The site remains accessible by direct URL but **not discoverable in search engines** until Steve explicitly changes that policy.

Cloudflare Pages publishes generated `dist/`, not the repository root.

The deployment rule is now simple:

- `PRODUCTION` routes are deployable to Pages.
- `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED` content stays out of Pages.
- `_headers` sends `X-Robots-Tag: noindex, nofollow, noarchive` site-wide.
- every deployed HTML document also receives matching robots metadata;
- public crawling stays allowed so Google/Bing can observe `noindex`;
- no sitemap is published while direct-link-only mode is active.

This means the public Pages deployment does **not** need Cloudflare Access for `/admin`, `/steven-os`, or `/cardiohospital`; those routes are excluded instead.

## Resume here

1. Read this file.
2. Read `CLAUDE.md` and `DEPLOYMENT.md`.
3. Check active PRs/issues before changing state.
4. Resume the first unfinished external gate below.
5. Never infer live completion from repository files alone.

## Repository platform — completed

### Deployment and safety

- [x] Catalog classifications for PRODUCTION / PREVIEW / INTERNAL / SOURCE_ONLY / ARCHIVED.
- [x] Deterministic `npm run build` -> `dist/`.
- [x] Pages artifact restricted to PRODUCTION routes.
- [x] Preview/internal/backend/source-only material excluded from Pages.
- [x] Site-wide response noindex plus HTML noindex defense in depth.
- [x] No sitemap while direct-link-only policy is active.
- [x] Custom 404 and `/.well-known/security.txt`.
- [x] Production verifier checks public routes, noindex/security controls, non-production absence, and custom 404 behavior.

### CI and quality

- [x] Browser suites split into independent parallel jobs.
- [x] Accessibility and site smoke run independently.
- [x] Site-smoke page/mobile/StudyHub checks use bounded native Node test concurrency.
- [x] All dedicated simulator/calculator/academy suites remain covered.
- [x] Smoke inventory is checked against the PRODUCTION catalog.
- [x] Performance, provenance, governance, syntax, and integrity checks remain enforced.

### Information architecture

- [x] Curated homepage and resident-education hub.
- [x] About, Contact, Privacy, Search, and custom 404 surfaces.
- [x] Homepage search with shareable `/search/?q=...` queries.
- [x] Search results include page descriptions.
- [x] Clinical Tools exposes BP calculator validation evidence.
- [x] Homepage correction link goes directly to the structured correction form.
- [x] 404 page provides Search and Contact recovery paths.

### Clinical governance and provenance

- [x] `clinical/content-registry.json` lifecycle governance.
- [x] Curriculum map and correction workflow.
- [x] Evidence-backed review metadata recorded only where supported.
- [x] StudyHub map/icon provenance and attribution chain documented.
- [ ] CHD surgical-atlas creator/source/license/permission remains unresolved (#41).
- [ ] Six clinical modules still need real review evidence (#42).

### StudyHub reproducibility

- [x] Versioned cloud-save migration with RLS/browser-role restrictions.
- [x] Two-device/offline acceptance checklist.
- [x] Privacy-safe event vocabulary defined; custom telemetry remains disabled pending an approved endpoint/retention policy.

## Recent merged checkpoints

- #54 — search-result descriptions.
- #55 — parallel CI matrix.
- #56 — BP validation surfaced from Clinical Tools.
- #57 — split site-smoke/accessibility CI critical path.
- #58 — bounded concurrency inside site smoke.
- #59 — complete homepage footer/correction routing.
- #60 — better 404 recovery navigation.

## Remaining gates — execute in this order

### 1. #38 — Live Pages cutover verification

Repository code should make the live setup minimal:

- [ ] Build command = `npm run build`.
- [ ] Output directory = `dist`.
- [ ] Production branch = `main`.
- [ ] PREVIEW, INTERNAL, and SOURCE_ONLY routes return 404.
- [ ] Live responses carry version-controlled noindex/security headers.
- [ ] `robots.txt` permits recrawling for noindex processing.
- [ ] No sitemap is published.
- [ ] `npm run verify:production` / Production verification workflow passes against the live site.

No Access policy is required for the main Pages deployment because INTERNAL routes are excluded.

### 2. #40 — Remove existing Google/Bing results

Start only after #38 proves the live noindex response.

- [ ] Use Google Search Console tools as appropriate.
- [ ] Use Bing Webmaster tools as appropriate.
- [ ] Recheck public search until site content no longer surfaces.
- [ ] Keep public crawling enabled while noindex is processed.

### 3. #39 — StudyHub live cloud-save acceptance

- [ ] Apply/verify the live migration and RLS/browser-role restrictions.
- [ ] Verify the deployed Edge Function is the intended application path.
- [ ] Add appropriate rate limiting and error monitoring without CAPTCHA/login friction.
- [ ] Run the complete two-device/offline merge acceptance sequence.
- [ ] Never paste the family token into public logs/issues.

### 4. #41 — CHD surgical-atlas provenance

- [ ] Recover creator/upstream source and permission/license evidence.
- [ ] If evidence cannot be established before broader redistribution, replace the images with clearly owned/licensed material.

### 5. #42 — Clinical review evidence

Still unresolved:

- [ ] BP calculator
- [ ] PHS
- [ ] CCHD/newborn screening
- [ ] Kawasaki
- [ ] cardiovascular prevention/dyslipidemia
- [ ] Myocarditis

Do not use commit dates or passing software tests as clinical sign-off.

## Longer-term backlog

- Observe actual StudyHub replay/frustration behavior before adding mechanics.
- Activate custom analytics only after endpoint, retention, and privacy decisions.
- Reconcile Cardio Hospital PR #27 deliberately.
- Rebase/retest Steven OS PR #28 against the production-only Pages boundary.
- Treat old BP/ABPM branches as selective-port/re-review candidates, not ordinary merges.

## Definition of done

The repository implementation is healthy. The broader program is complete when:

1. live Pages production-only deployment verification passes;
2. search-engine results disappear while noindex remains active;
3. StudyHub live backend/device acceptance passes;
4. CHD atlas provenance is established or assets are replaced;
5. all unresolved clinical modules have evidence-backed review records.

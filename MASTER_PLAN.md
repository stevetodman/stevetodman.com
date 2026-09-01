# stevetodman.com Platform Master Plan

Status: REPOSITORY PLATFORM HEALTHY — StudyHub live acceptance and clinical review evidence remain
Owner: Steve Todman
Created: 2026-08-19
Updated: 2026-08-31

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
4. Resume **#39 StudyHub live cloud-save acceptance** unless newer direct evidence changes the order.
5. Then complete **#42 clinical review evidence**.
6. Never infer live Supabase/device completion from repository files alone.

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
- [x] Automated production verification runs after pushes to `main` and has repeatedly passed against the live site (#38).
- [x] Public-search rechecks show no surfaced `stevetodman.com` results under the direct-link-only policy (#40).

### CI and quality

- [x] Browser suites split into independent parallel jobs.
- [x] Accessibility and site smoke run independently.
- [x] Site-smoke page/mobile/StudyHub checks use bounded native Node test concurrency.
- [x] All dedicated simulator/calculator/academy suites remain covered.
- [x] Smoke inventory is checked against the PRODUCTION catalog.
- [x] Performance, provenance, governance, syntax, and integrity checks remain enforced.
- [x] Math Mission has a dedicated fast regression gate covering generated-question correctness, adaptivity/mastery, and cloud round trips (#121).
- [x] Math Mission learner behavior is exercised in Chromium, including diagnostic persistence and miss -> guided retry (#122).
- [x] Math Mission scratchwork browser coverage asserts rendered pointer drawing, Undo restoration, and Clear behavior (#124).

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
- [x] CHD surgical-atlas provenance resolved from project-owner evidence and recorded in PR #73 / issue #41.
- [ ] Six clinical modules still need real review evidence (#42).

### StudyHub reproducibility

- [x] Versioned cloud-save migration with RLS/browser-role restrictions in source.
- [x] Two-device/offline acceptance checklist.
- [x] Privacy-safe event vocabulary defined; custom telemetry remains disabled pending an approved endpoint/retention policy.
- [ ] Live backend administration and real-device acceptance remain unverified (#39).

## Recent merged checkpoints

- #54 — search-result descriptions.
- #55 — parallel CI matrix.
- #56 — BP validation surfaced from Clinical Tools.
- #57 — split site-smoke/accessibility CI critical path.
- #58 — bounded concurrency inside site smoke.
- #59 — complete homepage footer/correction routing.
- #60 — better 404 recovery navigation.
- #69 — automatic live production verification after pushes to `main`.
- #73 — CHD atlas provenance resolved from project-owner evidence.
- #121 — Math Mission dedicated CI plus executable adaptive cloud round-trip coverage.
- #122 — Math Mission real-browser diagnostic/adaptive learner-flow coverage.
- #124 — Math Mission rendered scratchwork draw/Undo/Clear regression assertions.

## Completed external/evidence gates

### #38 — Live Pages production-only verification

**Complete.** Automated `npm run verify:production` runs have passed against `https://stevetodman.com`, verifying the live production-only contract. The issue is closed. Keep the automated verifier as a continuing regression gate.

### #40 — Search-engine removal

**Complete under the current direct-link-only policy.** Public-search rechecks found no `stevetodman.com` results surfacing, so there was no remaining surfaced URL requiring accelerated removal. Reopen if search results recur.

### #41 — CHD surgical-atlas provenance

**Complete.** PR #73 recorded project-owner evidence that the surgical illustrations are project-generated, AI-assisted educational assets created specifically for PedCardSurg under Steve Todman's direction, with human selection, clinical review, and project integration documented. Preserve the specific provenance record; do not generalize it to unrelated assets without evidence.

## Remaining gates — execute in this order

### 1. #39 — StudyHub live cloud-save acceptance

Repository implementation is present; this gate requires live Supabase/edge and real-device evidence.

- [ ] Verify/apply the live migration and RLS/browser-role restrictions.
- [ ] Confirm `public`, `anon`, and `authenticated` have no unintended direct table CRUD access.
- [ ] Verify the deployed `studyhub-save` Edge Function is the intended application path.
- [ ] Add/verify rate limiting appropriate for a family game endpoint without CAPTCHA/login friction.
- [ ] Add/verify error/5xx monitoring.
- [ ] Run the complete two-device/offline merge acceptance sequence in `study/CLOUD_SAVE_ACCEPTANCE.md`.
- [ ] Confirm the token fragment is scrubbed after adoption and never paste the family token into public logs/issues.

Do not mark this complete from repository evidence alone.

### 2. #42 — Clinical review evidence

Still unresolved:

- [ ] BP calculator
- [ ] PHS
- [ ] CCHD/newborn screening
- [ ] Kawasaki
- [ ] cardiovascular prevention/dyslipidemia
- [ ] Myocarditis

For each module, record a real review date/scope/source set only when supported by durable evidence. If no review evidence exists, perform the appropriate review rather than backdating metadata. Passing software tests or commit dates are not clinical sign-off.

## Longer-term backlog

- Observe actual StudyHub replay/frustration behavior before adding mechanics.
- Activate custom analytics only after endpoint, retention, and privacy decisions.
- Reconcile Cardio Hospital PR #27 deliberately.
- Rebase/retest Steven OS PR #28 against the production-only Pages boundary.
- Treat old BP/ABPM branches as selective-port/re-review candidates, not ordinary merges.

## Definition of done

The repository implementation and public deployment/search boundary are healthy. The remaining program is complete when:

1. StudyHub live backend/device acceptance passes with the intended security and abuse controls; and
2. all six unresolved clinical modules have evidence-backed review records.

# stevetodman.com Platform Master Plan

Status: ACTIVE — repo implementation in PR #37; live cutover/manual acceptance still pending
Owner: Steve Todman
Created: 2026-08-19
Updated: 2026-08-19

## Non-negotiable deployment policy

**The site should remain directly accessible by URL but should not appear in search-engine results yet.**

Until Steve explicitly changes this policy:

- send `X-Robots-Tag: noindex, nofollow, noarchive` site-wide;
- keep public pages crawlable so Google/Bing can observe the `noindex` directive and remove already-discovered URLs;
- do **not** publish a sitemap;
- PREVIEW and INTERNAL routes remain noindex even if the public-site policy changes later;
- use real authentication/Access for INTERNAL content — noindex is not access control.

The site already has indexed results. Issue #40 tracks removal/verification after the noindex header is live.

## Resume here

If work is interrupted, resume in this order:

1. Read this file.
2. Read the current Handoff in `CLAUDE.md`.
3. Check PR #37 and issues #38–#42.
4. Continue the first unchecked item in **Execution checklist**.
5. Never reopen completed work unless CI or a regression demonstrates a problem.

## Goals

1. Protect what already exists before adding more content.
2. Make CI faithfully cover every production clinical/educational surface.
3. Separate production, preview, internal, source-only, and archived material.
4. Turn the homepage from a flat project list into a coherent platform.
5. Add a resident-education hub and explicit clinical-content review lifecycle.
6. Add production security/operational controls appropriate for Cloudflare Pages.
7. Add privacy-preserving product feedback/usage foundations.
8. Preserve the static, low-dependency architecture; no framework rewrite.

## Execution checklist

### Phase 0 — Search privacy and platform guardrails

- [x] Add site-wide Cloudflare Pages security/noindex headers (`_headers`).
- [x] Add `robots.txt` that deliberately leaves public crawling unblocked so `noindex` can be observed.
- [x] Add a custom `404.html`.
- [x] Add `/.well-known/security.txt`.
- [x] Add deployment classification registry (`site/catalog.json`).
- [x] Add route/privacy/deployment policy checks to CI.
- [x] Remove INTERNAL/SOURCE_ONLY routes from ordinary public navigation and document Access/exclusion requirements.
- [ ] After deployment, complete search-result removal verification in issue #40.

### Phase 1 — CI correctness

- [x] Expand workflow path triggers to every production module.
- [x] Run every existing dedicated behavioural suite in CI.
- [x] Add Kawasaki to the smoke inventory.
- [x] Add a Kawasaki behavioural regression suite with independent expected-answer data.
- [x] Keep later suites running after earlier failures while preserving overall job failure.
- [x] Add static deployment-policy checks (noindex, catalog, build boundary, StudyHub migration).
- [x] Add post-deploy verification script/workflow for production headers/routes/Access/source exclusion.
- [x] Make the Kawasaki deploy artifact self-contained by stripping its optional legacy CDN loaders during `npm run build`, with a production-artifact invariant in platform tests.
- [ ] Finish PR #37 CI review and fix any regressions introduced by this branch; document pre-existing failures rather than hiding them.

### Phase 2 — Information architecture

- [x] Rebuild homepage around Featured / Resident Education / Clinical Tools / Family & Personal.
- [x] Add `/education/` hub.
- [x] Add `/about/` page using only verified biographical facts.
- [x] Add `/contact/` with correction/security routing and explicit no-PHI boundary.
- [x] Add `/privacy/`.
- [x] Add `/search/` static local catalog search.
- [x] Add useful footer/correction links on the new platform surfaces.
- [x] Correct homepage copy that claimed a QTc tool before one exists.
- [x] Add a lightweight local-only “Continue learning” experience across resident modules without requiring an account.

### Phase 3 — Clinical governance

- [x] Add machine-readable clinical content registry (`clinical/content-registry.json`).
- [x] Record target learner, source status, review status, and only review dates already documented.
- [x] Add CI freshness/schema checks without inventing missing review dates.
- [x] Add a curriculum map showing covered domains and explicit candidate gaps.
- [x] Add a structured “Report a correction” issue form with PHI warning and safety-impact field.
- [ ] Fill missing review-date/provenance records only when actual review evidence is available; never backfill by assumption (issue #42).

### Phase 4 — Security and deployment hygiene

- [x] Version CSP, nosniff, referrer policy, frame policy, permissions policy, and global noindex header.
- [x] Document and test the Cloudflare Access expectation for `/admin/`.
- [x] Mark `steven-os/` INTERNAL and require Access or deployment exclusion before calling it private.
- [x] Mark `cardiohospital/` INTERNAL until explicitly promoted or retired.
- [x] Mark `cardio-hospital-3d/` and `clipboard-sanitizer/` SOURCE_ONLY.
- [x] Add deterministic `npm run build` -> `dist/` that strips SOURCE_ONLY/backend/test material.
- [x] Add operational rate-limit/monitoring requirement for StudyHub cloud endpoint.
- [x] Version StudyHub database schema/migration contract with RLS/browser-role revocation.
- [ ] Complete live Cloudflare build-output/Access cutover in issue #38.
- [ ] Verify/apply live StudyHub backend controls in issue #39.

### Phase 5 — Product quality infrastructure

- [x] Add privacy-preserving event vocabulary and disabled-by-default same-origin client helper.
- [x] Add feedback/correction entry points.
- [x] Add axe-style accessibility scanning for shared platform surfaces while retaining existing browser assertions.
- [x] Add performance budgets and asset-size checks.
- [x] Add scheduled external-link rot checking.
- [x] Add asset/source attribution registry that records unknown provenance as unknown rather than guessing.
- [x] Extract genuinely shared static platform UI primitives and use them on the new platform shell pages; do not rewrite the site in React/Next.
- [ ] Complete missing source/license records for large asset families when source evidence is available (issue #41).

### Phase 6 — StudyHub acceptance and platform integration

- [ ] Real-phone acceptance test: phone A -> private family share link -> phone B -> bidirectional sync.
- [ ] Verify token fragment is removed after adoption and progress never regresses.
- [x] Add backend schema migration/source of truth to the repo.
- [ ] Apply operational rate limiting/monitoring without CAPTCHA or login friction (issue #39).
- [ ] Observe Pin Sprint replay/frustration behavior before adding more Road Trip/region/mystery mechanics.

### Phase 7 — Repository/PR hygiene

- [x] Classify the current open PRs in `PR_TRIAGE.md`.
- [x] Close clearly superseded PR #2 with a pointer to #3.
- [x] Identify #27 as the current Cardio Hospital integration candidate and document how #19/#20/#22/#23/#24 relate before closing evidence-bearing branches.
- [x] Replace the stale 34 KB `CLAUDE.md` session log with a concise current operating contract/handoff; old history remains in git.
- [ ] Reassess/rebase long-lived PRs after PR #37 lands; close additional branches only when their evidence/work is incorporated elsewhere.

### Phase 8 — Live validation

- [ ] Cloudflare Pages publishes `dist/`, not repository root (issue #38).
- [ ] `/admin/*`, `/steven-os/*`, `/cardiohospital/*` fail anonymous-access verification (issue #38).
- [ ] Production verification workflow passes against `https://stevetodman.com`.
- [ ] Google/Bing no longer surface indexed stevetodman.com content (issue #40).
- [ ] StudyHub live backend + two-device/offline acceptance passes (issue #39).
- [ ] Optional: enable Cloudflare Web Analytics for aggregate page/performance measurement after cutover.

## Production classes

- **PRODUCTION** — intentionally user-facing and in smoke coverage.
- **PREVIEW** — reachable by direct link only, visibly labeled, noindex.
- **INTERNAL** — requires Cloudflare Access/equivalent; noindex is not authentication.
- **SOURCE_ONLY** — repository source, excluded from the Pages artifact.
- **ARCHIVED** — retained in git/history, not deployed/navigation-visible.

## Definition of done

This program is complete when:

1. every production page is represented in the catalog and smoke inventory;
2. every clinical module with a dedicated test is executed by CI when its files change;
3. the live site returns noindex globally while crawlers can fetch pages to observe it;
4. internal/source-only material is not anonymously exposed or shipped accidentally;
5. homepage/education/search navigation coherently exposes intentional user-facing material;
6. clinical content has an explicit provenance/review lifecycle with no fabricated sign-off;
7. production security/header/access checks are reproducible and pass live;
8. existing Google/Bing results are removed;
9. StudyHub cross-device save is proven on real devices;
10. this plan contains no stale “done but unchecked” work.

## Deliberately not building

- Public sitemap/indexing/SEO promotion until Steve explicitly wants discovery.
- New resident clinical modules until existing curriculum coverage/review maintenance is healthy.
- Global account/login system.
- CMS/framework migration.
- Advertising/newsletter/social-feed infrastructure.

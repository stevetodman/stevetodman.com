# stevetodman.com Platform Master Plan

Status: ACTIVE
Owner: Steve Todman
Created: 2026-08-19

## Non-negotiable deployment policy

**The site should remain directly accessible by URL but should not be discoverable through search engines yet.**

Until Steve explicitly changes this policy:

- send `X-Robots-Tag: noindex, nofollow, noarchive` site-wide;
- serve `robots.txt` with `Disallow: /`;
- do **not** publish a sitemap;
- preview/internal routes remain noindex even if the public-site policy changes later.

## Resume here

If work is interrupted, resume in this order:

1. Read this file.
2. Read `CLAUDE.md` frontmatter and the latest History entry.
3. Check this branch/PR and continue the first unchecked item in **Execution checklist**.
4. Never reopen completed work unless CI or a regression demonstrates a problem.

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

- [ ] Add site-wide Cloudflare Pages security/noindex headers (`_headers`).
- [ ] Add `robots.txt` with `Disallow: /`.
- [ ] Add a custom `404.html`.
- [ ] Add `/.well-known/security.txt`.
- [ ] Add deployment classification registry (`site/catalog.json`).
- [ ] Add route policy checks to CI.
- [ ] Block clearly internal/source-only routes from ordinary public navigation and document Cloudflare Access/exclusion requirements.

### Phase 1 — CI correctness

- [ ] Expand workflow path triggers to every production module.
- [ ] Run every existing dedicated behavioural suite in CI.
- [ ] Add Kawasaki to the smoke inventory.
- [ ] Add a Kawasaki behavioural regression suite.
- [ ] Keep smoke running after earlier failures while preserving overall job failure.
- [ ] Add static deployment-policy checks (noindex, catalog, protected/internal routes).
- [ ] Add post-deploy verification script for production headers/routes; execute manually until Cloudflare credentials are available in CI.

### Phase 2 — Information architecture

- [ ] Rebuild homepage around Featured / Resident Education / Clinical Tools / Family & Personal.
- [ ] Add `/education/` hub.
- [ ] Add `/about/` page using only verified biographical facts.
- [ ] Add `/search/` static catalog search.
- [ ] Add useful site footer and correction links.
- [ ] Correct homepage copy that claims a QTc tool before one exists.

### Phase 3 — Clinical governance

- [ ] Add machine-readable clinical content registry (`clinical/content-registry.json`).
- [ ] Record target learner, scope, sources/guidelines, last-reviewed date where already documented, and review status.
- [ ] Add CI freshness/schema checks without inventing missing review dates.
- [ ] Add a curriculum map showing covered domains and explicit gaps.
- [ ] Add consistent “Report a correction” path via GitHub issue template.

### Phase 4 — Security and deployment hygiene

- [ ] Version security headers: CSP, nosniff, referrer policy, frame policy, permissions policy.
- [ ] Document and test Cloudflare Access expectation for `/admin/`.
- [ ] Mark `steven-os/` INTERNAL and require Access or deployment exclusion before calling it private.
- [ ] Mark `cardio-hospital-3d/` and `clipboard-sanitizer/` SOURCE-ONLY.
- [ ] Mark `cardiohospital/` PREVIEW/LEGACY until explicitly promoted.
- [ ] Add rate-limit/abuse-control operational requirement for StudyHub cloud endpoint.
- [ ] Version StudyHub database schema/migration contract.

### Phase 5 — Product quality infrastructure

- [ ] Add privacy-preserving event vocabulary and no-op client helper; activation requires an approved first-party endpoint or Cloudflare analytics decision.
- [ ] Add feedback/correction entry points.
- [ ] Add axe-style accessibility scanning when dependency/tooling is approved; keep existing browser assertions.
- [ ] Add performance budgets and asset-size checks.
- [ ] Add citation/link-rot checking for clinical modules.
- [ ] Add asset/source attribution registry.
- [ ] Extract only genuinely shared static UI primitives; do not rewrite in React/Next.

### Phase 6 — StudyHub acceptance and platform integration

- [ ] Real-phone acceptance test: phone A -> share family link -> phone B -> bidirectional sync.
- [ ] Verify token fragment is removed after adoption and progress never regresses.
- [ ] Add backend schema migration/source of truth to the repo.
- [ ] Add operational rate limiting/monitoring without CAPTCHA or login friction.
- [ ] Observe Pin Sprint replay/frustration behavior before adding more mechanics.

### Phase 7 — Repository/PR hygiene

- [ ] Classify open PRs as keep / merge / superseded / archive / convert-to-issue.
- [ ] Close clearly superseded PRs after recording replacement.
- [ ] Reduce stacked Cardio Hospital branches to an understandable active path.
- [ ] Keep `CLAUDE.md` current-state handoff free of resolved items.

## Production classes

- **PRODUCTION** — intentionally user-facing and should be in smoke coverage.
- **PREVIEW** — reachable by direct link only, visibly labeled, noindex.
- **INTERNAL** — requires Cloudflare Access or equivalent authentication; noindex is not authentication.
- **SOURCE_ONLY** — repository source, not intended to be served by Pages.
- **ARCHIVED** — retained in git history or archive, not deployed/navigation-visible.

## Definition of done

This program is complete when:

1. every production page is represented in the catalog and smoke inventory;
2. every clinical module with a dedicated test is executed by CI when its files change;
3. the live site returns a noindex header globally and `robots.txt` disallows crawling;
4. internal/source-only material is not accidentally exposed as normal public content;
5. homepage/education/search navigation coherently exposes intentional user-facing material;
6. clinical content has an explicit provenance/review registry;
7. production security/header/access checks are reproducible;
8. StudyHub cross-device save is proven on real devices;
9. this plan contains no stale “done but unchecked” work.

## Deliberately deferred

- Public search-engine optimization/sitemap until Steve explicitly wants indexing.
- New resident clinical modules until the existing curriculum is mapped.
- Global account/login system.
- CMS/framework migration.
- Advertising/newsletter/social-feed infrastructure.

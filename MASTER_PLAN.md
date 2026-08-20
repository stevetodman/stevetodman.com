# stevetodman.com Platform Master Plan

Status: REPOSITORY PROGRAM COMPLETE — live/external acceptance and evidence gaps remain
Owner: Steve Todman
Created: 2026-08-19
Updated: 2026-08-19

## Non-negotiable deployment policy

The site should remain accessible by direct URL but **not discoverable in search engines** until Steve explicitly changes this policy.

Current repository controls:

- site-wide `X-Robots-Tag: noindex, nofollow, noarchive` in `_headers`;
- every HTML document emitted to `dist/` is normalized to `meta robots=noindex,nofollow,noarchive`;
- public crawling remains allowed so Google/Bing can observe `noindex` and remove already-known URLs;
- no sitemap while this policy is active;
- INTERNAL routes require Cloudflare Access/equivalent authentication.

Do not replace this with `robots.txt: Disallow: /`; that can prevent crawlers from seeing the noindex directive.

## Resume here

If work is interrupted:

1. Read this file.
2. Read `CLAUDE.md`.
3. Read `DEPLOYMENT.md` for the live Cloudflare boundary.
4. Resume the first unfinished item in **Remaining gates**, in order.
5. Check the corresponding GitHub issue before changing state; do not infer live completion from repository files.

## Repository program — completed

The repository-side platform consolidation is merged to `main`.

### Foundation

- [x] Classified deployment catalog: PRODUCTION / PREVIEW / INTERNAL / SOURCE_ONLY / ARCHIVED.
- [x] Deterministic `npm run build` -> `dist/`; SOURCE_ONLY/backend material excluded.
- [x] Site-wide noindex/security headers.
- [x] HTML-level noindex defense in depth for every deployed document.
- [x] Custom 404 and `/.well-known/security.txt`.
- [x] No sitemap while direct-link-only policy is active.
- [x] Production verification script/workflow exists.

### CI and product quality

- [x] Workflow triggers cover every production module plus platform/search/scripts/docs.
- [x] Every existing dedicated clinical/academy suite runs in CI.
- [x] Kawasaki has independent behavioral coverage and production CDN stripping.
- [x] Smoke inventory is checked against the production catalog.
- [x] Accessibility scans cover shared platform surfaces.
- [x] Static performance budgets are enforced.
- [x] Pin Sprint irregular-SVG pointer test is hardened.
- [x] PHS 768x1024 status-bar overflow is fixed and regression-tested.
- [x] `package-lock.json` is committed from a GitHub-generated artifact and CI uses `npm ci`.

### Information architecture

- [x] Homepage reorganized around flagship work, resident education, clinical tools, and family/personal projects.
- [x] `/education/` hub added.
- [x] `/about/`, `/contact/`, `/privacy/`, `/search/` added.
- [x] Local-only Continue Learning added for resident education.
- [x] Static full-content search generated from PRODUCTION HTML only.
- [x] Shared static platform UI primitives added without a framework rewrite.
- [x] Homepage copy corrected so it does not promise a nonexistent QTc tool.

### Clinical governance

- [x] `clinical/content-registry.json` added and enforced.
- [x] Clinical curriculum map added.
- [x] Content-correction issue flow added.
- [x] Documented review dates recorded only where evidence exists.
- [x] Aortopathy, Genetics of CHD, PALS, and PedCardSurg evidence-backed review metadata added; hypertension was already documented.
- [x] Unknown clinical review dates remain unknown rather than backfilled.

### Security/deployment hygiene

- [x] Security headers versioned.
- [x] INTERNAL/SOURCE_ONLY deployment intent represented in code and tests.
- [x] `admin/`, `steven-os/`, and legacy `cardiohospital/` classified INTERNAL.
- [x] `cardio-hospital-3d/`, `clipboard-sanitizer/`, StudyHub backend source classified/excluded as SOURCE_ONLY.
- [x] Production verifier checks internal access expectations, source-only absence, noindex/security headers, robots behavior, and sitemap absence.

### StudyHub/backend reproducibility

- [x] Cloud-save database migration/versioned schema source added with RLS and browser-role grants revoked.
- [x] Real-device cloud-save acceptance checklist added.
- [x] Privacy-safe analytics/event vocabulary defined; custom behavioral telemetry remains disabled pending an approved first-party endpoint/retention policy.
- [x] 50 States/Pin Sprint map source chain recovered; StudyHub map-derived material conservatively treated as CC BY-SA-derived and `study/ATTRIBUTIONS.md` added.

### Repository hygiene

- [x] #2 superseded ABPM PR closed.
- [x] Cardio Hospital/Steven OS/BP/ABPM long-lived PRs reassessed and documented rather than mass-closed.
- [x] Stale giant session-log handoff replaced with concise operating documentation.

## Merged implementation checkpoints

- #37 platform foundation -> `44457d1`
- #45 Pin Sprint SVG test hardening -> `8fe0dda`
- #51 PHS tablet overflow -> `75d98b2`
- #44 clinical review metadata -> `646761c`
- #47 deployment HTML noindex -> `236d992`
- #48 full-content search -> `2bb5caf`
- #43 asset provenance/StudyHub attribution -> `d95b4dc`
- #50 deterministic npm lockfile / `npm ci` -> `593ccdb`

The final rebased #43 and #50 validation runs were fully green across platform policy, Steven OS, syntax/integrity, PHS, all clinical suites, complete smoke, and accessibility.

## Remaining gates — execute in this order

### 1. #38 — Cloudflare classified-deploy and Access cutover

Repository work is complete; live control-plane evidence is still required.

- [ ] Cloudflare Pages build command = `npm run build`.
- [ ] Output directory = `dist`.
- [ ] Production branch = `main`.
- [ ] `/admin/*` protected by Cloudflare Access.
- [ ] `/steven-os/*` protected by Cloudflare Access or excluded.
- [ ] `/cardiohospital/*` protected by Cloudflare Access or excluded.
- [ ] SOURCE_ONLY paths absent from production.
- [ ] Live responses carry `X-Robots-Tag: noindex, nofollow, noarchive` plus security headers.
- [ ] `robots.txt` permits public recrawling for noindex processing.
- [ ] No sitemap is published.
- [ ] `npm run verify:production` / Production verification workflow passes against the live site.
- [ ] Decide whether to schedule production verification after the first live green pass.
- [ ] Optional: enable privacy-preserving Cloudflare Web Analytics if desired.

### 2. #40 — Remove existing Google/Bing results

Start only after #38 proves the live noindex response.

- [ ] Confirm homepage and known indexed routes expose live noindex.
- [ ] Use Google Search Console removal/inspection tools as appropriate.
- [ ] Use Bing Webmaster removal/blocking tools as appropriate.
- [ ] Recheck public search until stevetodman.com content no longer surfaces.
- [ ] Keep public crawling enabled while noindex is being processed.

### 3. #39 — StudyHub live cloud-save acceptance and abuse controls

- [ ] Apply/verify `study/supabase/migrations/20260819_create_studyhub_saves.sql` in the live Supabase project.
- [ ] Verify `studyhub.saves` RLS and absence of direct `public`/`anon`/`authenticated` CRUD access.
- [ ] Verify the deployed `studyhub-save` Edge Function is the intended app path.
- [ ] Configure appropriate edge/service rate limiting and 5xx/error monitoring without CAPTCHA/login friction.
- [ ] Run every step in `study/CLOUD_SAVE_ACCEPTANCE.md`: device A -> private share link -> device B -> bidirectional sync -> offline union merge.
- [ ] Verify the token fragment is scrubbed after adoption and never paste the token into public logs/issues.

### 4. #41 — CHD surgical-atlas provenance

StudyHub map/icon provenance is materially resolved. The remaining gap is the CHD atlas.

- [ ] Identify creator/upstream source for the PNG masters.
- [ ] Determine whether each master is original, commissioned, generated, licensed, or derived.
- [ ] Recover permission/license/attribution requirements.
- [ ] If evidence cannot be established before broader public redistribution, replace with clearly owned/licensed material.

### 5. #42 — Clinical review evidence

Documented review evidence exists for hypertension, Aortopathy, Genetics of CHD, PALS, and PedCardSurg.

Still unresolved:

- [ ] BP calculator
- [ ] PHS
- [ ] CCHD/newborn screening
- [ ] Kawasaki
- [ ] cardiovascular prevention/dyslipidemia
- [ ] Myocarditis

For each: perform or recover the real review, record date/scope/source set, and record review level only when the source supports it. Never use commit dates or passing tests as clinical sign-off.

## Longer-term backlog — not part of the current platform completion gate

- Observe actual StudyHub/Pin Sprint replay/frustration behavior before adding more mechanics.
- Consider activating the already-defined first-party custom-event vocabulary only after approving an endpoint, retention policy, and privacy constraints.
- Reconcile Cardio Hospital PR #27 deliberately; preserve current platform workflow/handoff and existing workstation/human gates.
- Rebase/retest Steven OS PR #28 against current INTERNAL/classified deployment policy.
- Treat BP PR #1 and ABPM PR #3 as stale clinical branches requiring selective porting/re-review, not ordinary merges.
- Do not mass-close #19/#20/#22/#23/#24; they remain evidence-bearing Cardio Hospital work until deliberately superseded/incorporated.

## Definition of done for this program

Repository implementation is done. The overall platform program is complete only when:

1. live Cloudflare classified deployment and Access checks pass;
2. public search engines no longer surface site content while the direct-link-only policy is active;
3. StudyHub live backend + two-device/offline acceptance passes;
4. CHD atlas provenance/permission is established or those assets are replaced before broader redistribution;
5. the six unresolved clinical modules have evidence-backed review records.

Until then, `status` remains active and the first unfinished gate above is the resume point.

---
status: active
next: Validate PR #37 and fix any branch regressions; then complete Cloudflare issue #38, search de-indexing issue #40, and StudyHub live acceptance issue #39
---

# CLAUDE.md

This is Steve Todman's personal website and education/tool repository, deployed with Cloudflare Pages.

## Read first

For any nontrivial work, read these in order:

1. **`MASTER_PLAN.md`** — active roadmap, completed/pending work, and interruption-safe resume protocol.
2. **`DEPLOYMENT.md`** — Cloudflare Pages build boundary, Access requirements, and live verification.
3. **`site/catalog.json`** — canonical deployment class for every surface.
4. This file — stable repository conventions plus the current handoff.

If an older issue/history note conflicts with `MASTER_PLAN.md` or the current Handoff below, the master plan/current handoff wins.

## Non-negotiable current visibility policy

The site is intentionally **direct-link only** for now. Do not make it search-engine discoverable unless Steve explicitly asks.

Required controls:

- `_headers`: `X-Robots-Tag: noindex, nofollow, noarchive` site-wide.
- `robots.txt`: public pages stay crawlable so Google/Bing can observe `noindex` and remove already-discovered URLs. Do **not** use `Disallow: /` as the indexing control.
- no `sitemap.xml` while the noindex policy is active.
- PREVIEW and INTERNAL pages remain noindex even if the public-site policy changes later.
- INTERNAL pages require Cloudflare Access/equivalent protection; `noindex` is not authentication.

The site already had indexed results before this policy was introduced. Issue #40 tracks removal/verification in Google and Bing after the response header is live.

Do not add SEO-oriented sitemap/indexing changes by default.

## Deployment classes

Every meaningful top-level surface belongs in `site/catalog.json` as exactly one of:

- **PRODUCTION** — intentionally user-facing; must be in production smoke coverage.
- **PREVIEW** — direct-link test/preview, visibly labeled, noindex.
- **INTERNAL** — requires Cloudflare Access or equivalent protection; noindex is not authentication.
- **SOURCE_ONLY** — repository source that must not ship in the Pages artifact.
- **ARCHIVED** — retained for history, not deployed/navigation-visible.

When adding a user-facing page:

1. classify it in `site/catalog.json`;
2. if PRODUCTION + `smoke:true`, add it to `SITE_PAGES` in `tests/helpers/harness.mjs`;
3. add a behavioral test when the page has meaningful interaction or clinical logic;
4. add clinical content to `clinical/content-registry.json` when applicable;
5. do not bypass a failing catalog/smoke parity test with an undocumented omission.

## Production build boundary

The repository root is **not** the intended Pages artifact.

```sh
npm run build
```

generates `dist/`. Cloudflare Pages should use:

- build command: `npm run build`
- output directory: `dist`
- production branch: `main`

The classified build excludes backend/developer/source-only material, including StudyHub Edge Function source, `cardio-hospital-3d/`, `clipboard-sanitizer/`, Steven OS backend code, and tests.

See `DEPLOYMENT.md` before changing Cloudflare settings.

## High-level project structure

### Platform/navigation

- `/` — curated homepage
- `/education/` — resident-education hub
- `/about/` — verified-facts About page
- `/contact/` — correction/security/contact routing; never a patient communication channel
- `/privacy/` — privacy and StudyHub cloud-save explanation
- `/search/` — local catalog search; does not make content search-engine discoverable
- `site/` — catalog, analytics policy/event schema, performance budgets, provenance metadata
- `clinical/` — clinical review registry + curriculum coverage map

### Clinical education/tools

- `phs/` — Pediatric Hospital Simulator, current runtime under `phs/v17/`
- `tools/` — BP calculator + explicitly labeled preview tools
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

- `study/` — Study Hub, 50 States Challenge, Pin Sprint, vocab/fractions/math drills
- `math/` — Math Lab
- `cooking/` — persistent recipe timers

### Internal/source-only

- `admin/` — INTERNAL; Cloudflare Access required
- `steven-os/` — INTERNAL control plane; Access or exclude
- `cardiohospital/` — INTERNAL legacy development preview; Access or exclude
- `cardio-hospital-3d/` — SOURCE_ONLY
- `clipboard-sanitizer/` — SOURCE_ONLY
- `study/supabase/` — SOURCE_ONLY backend source/migrations; deployed separately from Pages

## Page conventions

Unless an explicit temporary exception is recorded in `site/convention-exceptions.json`, every PRODUCTION page should have:

- `<meta name="description">`;
- favicon link;
- exactly one `<h1>`;
- `<main>` landmark;
- associated labels / ARIA labels for inputs;
- visible `:focus-visible` treatment;
- interactive controls built from semantic `<button>` / `<a>`, not click-handled `<div>`;
- text contrast at least 4.5:1 for normal text (3:1 for large text);
- no unapproved external subresources;
- mobile layout without document-level horizontal overflow.

The generic smoke suite enforces these conventions. If a legacy page cannot satisfy one immediately, document the smallest exact exception rather than removing it from smoke coverage.

## Clinical content governance

`clinical/content-registry.json` is the source of truth for clinical-content lifecycle metadata.

Rules:

- never invent review dates or clinical sign-off;
- if review metadata is unknown, record it as unknown / `needs-review-record`;
- documented review dates are checked for staleness by CI;
- new clinical modules require target learner, source/provenance plan, behavioral testing, catalog entry, and registry entry before PRODUCTION promotion;
- prefer maintaining/integrating current content over opportunistically adding more modules;
- use `clinical/CURRICULUM_MAP.md` before proposing a new academy.

Corrections use `.github/ISSUE_TEMPLATE/content-correction.yml`. Never put PHI, patient-identifying information, credentials, or StudyHub family tokens in a public issue.

## Testing

Install:

```sh
npm install
npx playwright install --with-deps chromium
```

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

CI is intentionally non-omitting: later suites use `if: ${{ !cancelled() }}` so a failure in an earlier academy does not silently skip smoke/accessibility coverage. The job should still fail overall when a suite fails.

### Test-design rule worth preserving

Never derive a quiz's expected answer from the same DOM that is being tested. A Boss Battle once displayed the answer on screen and still passed because the test scraped that displayed answer. Expected answers must come from independent fixture/domain data.

Kawasaki's browser regression follows this rule explicitly.

## StudyHub cloud save

StudyHub intentionally has **no email/password sign-in**.

- localStorage is the immediate/offline source of truth;
- a high-entropy family token is the cross-device credential;
- only its SHA-256-derived hash is stored server-side;
- the private pairing token travels in the URL fragment and should be removed after adoption;
- cloud merge is monotonic/union-oriented so two offline devices should not erase each other's progress;
- in-progress rounds/recent adaptive windows remain device-local;
- the Edge Function/database source lives under `study/supabase/` and is excluded from Pages;
- the database migration is versioned at `study/supabase/migrations/20260819_create_studyhub_saves.sql` with RLS on and browser-role grants revoked.

The remaining real-world acceptance gate is documented in `study/CLOUD_SAVE_ACCEPTANCE.md` and tracked in issue #39.

## Analytics/privacy

Preferred aggregate measurement is Cloudflare Web Analytics, if enabled in the Pages dashboard.

Do not add Google Analytics, advertising pixels, cross-site learner tracking, or a tag manager.

`site/telemetry.js` and `site/telemetry-events.json` define a future first-party custom-event contract, but it is **disabled by default** until a same-origin endpoint, retention policy, and privacy constraints are explicitly approved. Do not send names, email, free text, patient data, family tokens, full URLs/query strings, IP addresses, or raw user agents.

## Cooking timers

When adding a timer:

1. extract real recipe steps/times/ingredients/equipment/doneness cues;
2. create `cooking/[recipe]-timer.html`;
3. update the cooking index/template workflow;
4. preserve wake lock, audio alerts, browser notification support, localStorage resume, pause/back/skip, time adjustment, step progress, estimated finish, print/mobile behavior, and safety warnings where relevant;
5. do not add AI/Claude credits to the page.

## Clinic resources

Clinic forms/materials live under `admin/clinic-resources/` and are INTERNAL.

When adding a file:

1. add the PDF/DOCX to `admin/clinic-resources/files/`;
2. add/update the resource card;
3. verify the Cloudflare Access production check still blocks anonymous access.

## Session protocol

At the end of every substantive session:

1. update `MASTER_PLAN.md` checkboxes so done work is actually marked done;
2. update the `next:` frontmatter above;
3. update **Handoff** below with only current work — remove resolved items rather than accumulating them forever;
4. if a manual/external action remains, create a durable GitHub issue/checklist or document it in `DEPLOYMENT.md` / `study/CLOUD_SAVE_ACCEPTANCE.md`;
5. ensure the active branch/PR is named in the handoff.

Detailed pre-consolidation history remains available in git history (the prior verbose `CLAUDE.md` blob is `5701cd40f79cd4196df6d6399a869652f5c75355`). Do not recreate a giant chronological log here.

---

## Handoff — read this first (2026-08-19)

### Active program

**Branch:** `agent/platform-hardening-master-plan`  
**PR:** #37 — draft, active validation

Goal: convert the large collection of good projects into a coherent, maintained platform while keeping the entire site out of search-engine results for now.

### Repo-side work already implemented on this branch

- `MASTER_PLAN.md` with interruption-safe resume protocol and synchronized phase checklist.
- global noindex + security headers, crawlable robots policy, custom 404, and security.txt.
- canonical deployment catalog with PRODUCTION / PREVIEW / INTERNAL / SOURCE_ONLY classes.
- deterministic `npm run build` -> `dist/` that strips source-only/backend material.
- live `npm run verify:production` and manual Production Verification workflow.
- homepage reorganization; `/education/`, `/about/`, `/contact/`, `/privacy/`, `/search/`.
- clinical content registry + curriculum map + correction issue form.
- CI path-trigger expansion and execution of every existing clinical behavioral suite.
- Kawasaki browser regression suite with independent expected-answer fixture.
- shared-platform axe accessibility baseline.
- performance budgets and asset-provenance enforcement.
- weekly external-link rot checker.
- StudyHub database migration with RLS/browser grants locked down in source control.
- real-device StudyHub cloud-save acceptance checklist.
- privacy-first analytics policy and disabled-by-default custom-event schema/helper.
- PR triage; PR #2 closed as superseded by #3.

### Durable external/manual gates

- **#38** — Cloudflare `npm run build` / `dist` cutover + Access for `/admin/*`, `/steven-os/*`, `/cardiohospital/*` + production verifier.
- **#39** — live StudyHub migration verification, edge rate limiting/monitoring, and two-device/offline acceptance.
- **#40** — remove already-indexed stevetodman.com URLs from Google/Bing after live noindex deployment.

### Current PR #37 validation findings

The first broadened Actions run proved the new workflow is no longer hiding suites:

- platform policy: passed;
- Steven OS core: passed;
- PHS behavior: passed;
- PHS v18 audit/responsive regression: passed (the old tablet-overflow baseline note is stale and should not be carried forward);
- clinical validation: passed;
- BP calculator: passed;
- Kawasaki: passed;
- hypertension: passed;
- cardiovascular-risk: passed;
- aortopathy: passed;
- genetics of CHD: passed;
- Myocarditis: failed;
- PALS: failed;
- PedCardSurg: failed;
- smoke/accessibility were still running when later branch updates restarted CI.

Myocarditis, PALS, and PedCardSurg application files were not changed by this platform branch. Verify their failures against clean/current `main` and fix genuinely broken tests/product behavior, but do not remove the suites from CI just to make the job green. PedCardSurg had a previously observed full-suite WebP timing flake; Myocarditis had prior failures. PALS is newly surfaced by honest CI and must be investigated rather than assumed baseline.

### Next gates, in order

1. Finish the remaining repo-side items in `MASTER_PLAN.md` (shared static platform primitives + lightweight local “Continue learning”), then let the newest PR #37 CI run to completion.
2. Investigate Myocarditis/PALS/PedCardSurg failures against clean `main`; fix real defects or document reproducible pre-existing baseline with evidence.
3. Mark PR #37 ready/merge when branch-introduced changes are clean and any remaining unrelated baseline is explicitly evidenced.
4. Complete Cloudflare issue #38 and run production verification.
5. Complete search-result removal issue #40.
6. Complete StudyHub issue #39.
7. Only after the platform is stable: observe Pin Sprint/States play before adding more Road Trip/region/mystery mechanics.

### External-tool limitation

No Cloudflare Pages or Supabase management plugin is connected in the current agent environment. The repository-side configuration and verification are implemented, but the live Cloudflare build/output/Access switches and live Supabase administrative settings cannot be changed from this environment. Do not claim they are active until production verification/acceptance proves them.

### Separate repository task

The ClinTel public-schema RLS issue is a separate `stevetodman/clintel` security task. It was audited before this site-wide program and should be resumed separately; do not mix its migration into this repository.

---
status: active
next: Finish and validate the platform-hardening PR, then perform the Cloudflare dist/Access cutover and production verification; after that run the real two-device StudyHub save acceptance test
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
- `robots.txt`: `User-agent: *` + `Disallow: /`.
- no `sitemap.xml` while the noindex policy is active.
- PREVIEW and INTERNAL pages remain noindex even if the public-site policy changes later.

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

Kawasaki's new browser test follows this rule explicitly.

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

The remaining real-world acceptance gate is documented in `study/CLOUD_SAVE_ACCEPTANCE.md` and must be run on two real devices.

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

Goal: convert the large collection of good projects into a coherent, maintained platform while keeping the entire site out of search-engine indexes for now.

### Repo-side work already implemented on this branch

- `MASTER_PLAN.md` with interruption-safe resume protocol and phase checklist.
- global noindex + security headers, crawler disallow, custom 404, security.txt.
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

### Next gates, in order

1. **Open/validate this branch as a PR and fix any new CI failures caused by the broader honest coverage.** Do not hide newly surfaced failures by removing suites.
2. **Merge the repo-side platform PR when its new changes are clean or any remaining failures are proven pre-existing baseline.**
3. **Cloudflare Pages cutover:** set build command `npm run build` and output directory `dist`.
4. **Cloudflare Access:** verify `/admin/*`, `/steven-os/*`, and `/cardiohospital/*` are not anonymously readable. Use Access or remove an internal route from deployment.
5. Optional but recommended: enable Cloudflare Web Analytics for aggregate usage/performance measurement.
6. Run the **Production verification** workflow; do not schedule it automatically until the first live pass is green.
7. **StudyHub:** apply/verify the versioned migration in the live Supabase project, configure service/edge rate limiting + error monitoring, then complete `study/CLOUD_SAVE_ACCEPTANCE.md` on two real devices.
8. Only after the platform is stable: observe Pin Sprint/States play before adding more Road Trip/region/mystery mechanics.

### External-tool limitation

No Cloudflare Pages or Supabase management plugin is connected in the current agent environment. The repository-side configuration and verification are implemented, but the live Cloudflare build/output/Access switches and live Supabase administrative settings cannot be changed from this environment. Do not claim they are active until production verification proves them.

### Known pre-existing browser-test baseline

Historically observed on clean `main` before this platform program:

- `myocarditis-academy` — learning interactions / mastery assessment failures;
- `phs-v18-audit-remediation` — tablet horizontal overflow / responsive time-budget failure;
- `pedcardsurg-academy` — WebP assertion timing flake under full-suite load, while standalone passed.

Because CI now runs later suites even after failures, distinguish a true regression from these known baseline items. Do not treat “known” as permission to ignore a new failure in the same suite.

### Separate repository task

The ClinTel public-schema RLS issue is a separate `stevetodman/clintel` security task. It was audited before this site-wide program and should be resumed separately; do not mix its migration into this repository.

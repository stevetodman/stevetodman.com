# Deployment — stevetodman.com

## Intended production model

Cloudflare Pages publishes the **generated `dist/` artifact**, not the repository root.

Repository source can contain tests, migrations, backend functions, developer tools, previews, and internal projects. `scripts/build-site.mjs` establishes the classified static-site boundary; `scripts/build-hospital.mjs` then builds the approved unified Pediatric Hospital source into the generated `/hospital/` production artifact. `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED` source material stays out of Pages unless it is explicitly promoted.

### Unified Pediatric Hospital

The primary resident-facing hospital simulator is generated from:

- source: `cardio-hospital-3d/`
- public production route: `/hospital/`

The source directory itself remains `SOURCE_ONLY`; Pages must never expose `/cardio-hospital-3d/`. The current production build performs the hospital build/export and copies only the generated export into `dist/hospital/`. Whether validation should remain inside that build path is tracked in `MASTER_PLAN.md`; do not duplicate that program state here.

The former `/phs/` simulator is archived/reference-only and `/cardiohospital/` remains internal/reference-only. Do not restore either as the primary Resident Education hospital link unless Steve explicitly reverses this promotion.

Publishing `/hospital/` does **not** by itself close any physical-iPhone acceptance gate recorded by the hospital project. Device acceptance is separate from deployment status.

## Cloudflare Pages settings

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Production branch:** `main`

Do not change production settings without a concrete reproduced problem and the relevant focused verification.

## Search-engine privacy

Current policy is intentionally **no indexing** while retaining direct-link access.

The generated artifact includes:

- `_headers` with `X-Robots-Tag: noindex, nofollow, noarchive` site-wide;
- `robots.txt` that leaves public crawling unblocked so search engines can read the noindex header;
- no `sitemap.xml`.

Do **not** use `robots.txt: Disallow /` as the indexing control. A crawler blocked by robots cannot observe the `noindex` directive. Do not add a sitemap or remove the noindex policy until Steve explicitly changes the discoverability policy.

## Non-production routes

Pages is deliberately **production-only**. Routes classified `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, or `ARCHIVED` are excluded from the public artifact according to `site/catalog.json`.

Examples of non-production material include:

- `/tools/pediatric-abpm-pathway-preview.html`
- `/admin/*`
- `/steven-os/*`
- `/cardiohospital/*`
- `cardio-hospital-3d/` source
- `clipboard-sanitizer/`
- `study/supabase/`
- repository tests and developer files

`noindex` is not authentication; deployment exclusion is the control. If an internal tool needs remote access, give it an appropriately authenticated deployment or deliberately reclassify it after reviewing the exposure boundary.

## Security headers

`_headers` is version-controlled and includes CSP and the site's security/privacy headers. When a production page needs a new cross-origin dependency, update the policy deliberately and add only the focused regression protection needed for that dependency. Do not disable CSP to make a page work.

## StudyHub backend

The StudyHub Edge Function/database deploy separately from Pages. Repository source includes `study/supabase/` and the live acceptance contract in `study/CLOUD_SAVE_ACCEPTANCE.md`.

Do not infer live Supabase administrative/device state from repository code. Current external acceptance state belongs in `MASTER_PLAN.md`, not this operations guide.

## Production verification

Repository-wide production verification can be invoked with:

```sh
npm run verify:production
```

For product-specific exact-SHA verification, follow `AGENTS.md` and the relevant workflow. Keep these states distinct:

1. committed;
2. pre-deployment CI passed;
3. Cloudflare Pages deployment succeeded;
4. the exact current `main` SHA is the production deployment;
5. required public-browser/touch verification passed.

Never infer production state from an older successful run.

The public artifact should continue to verify:

- global noindex/security headers and matching HTML robots metadata;
- crawler compatibility with noindex and absence of a sitemap while direct-link-only mode is active;
- canonical PRODUCTION routes return successfully;
- PREVIEW, INTERNAL, SOURCE_ONLY, and ARCHIVED material does not become publicly reachable;
- `/hospital/` is generated while `/cardio-hospital-3d/`, `/phs/`, and `/cardiohospital/` remain outside the production role assigned by the catalog;
- custom 404 behavior remains correct.

## Rollback

If a deployed artifact exposes a regression:

1. use the prior known-good Pages deployment for immediate rollback when appropriate;
2. preserve the production-only boundary unless that boundary itself is the reproduced defect;
3. fix the smallest reproduced cause and run the relevant focused checks;
4. redeploy and verify the exact resulting SHA.

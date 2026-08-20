# Deployment — stevetodman.com

## Intended production model

Cloudflare Pages should publish the **generated `dist/` artifact**, not the repository root.

Repository source can contain tests, migrations, backend functions, developer tools, previews, and internal projects. `scripts/build-site.mjs` is the deployment boundary: only catalog items classified `PRODUCTION` reach Pages. `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED` material stays in source unless it is explicitly promoted.

## Cloudflare Pages settings

Set the project to:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Production branch:** `main`

Do not switch the output directory until `npm run test:platform` passes on the branch containing the build script.

## Search-engine privacy

Current policy is intentionally **no indexing** while retaining direct-link access.

The generated artifact includes:

- `_headers` with `X-Robots-Tag: noindex, nofollow, noarchive` site-wide;
- `robots.txt` that leaves public crawling unblocked so search engines can read the noindex header;
- no `sitemap.xml`.

Do **not** use `robots.txt: Disallow /` as the indexing control. A crawler blocked by robots cannot observe the `noindex` directive, and an already-discovered URL can remain visible in search results. Keep the public pages crawlable while noindex is active.

The site already had indexed URLs before this policy was added. After deployment, complete issue #40 to accelerate/verify removal in Google and Bing.

Do not add a sitemap or remove the noindex policy until Steve explicitly decides to make the site discoverable.

## Non-production routes

Pages is deliberately **production-only**. Routes classified `PREVIEW` or `INTERNAL` are not copied into `dist/` and should return 404 on the public site.

Examples include:

- `/tools/pediatric-abpm-pathway-preview.html`
- `/tools/bp-percentile-calculator-preview.html`
- `/admin/*`
- `/steven-os/*`
- `/cardiohospital/*`

This removes the need for Cloudflare Access on the main Pages deployment. If an internal tool later needs remote browser access, give it a separate authenticated deployment or deliberately promote/reclassify it after reviewing the exposure boundary.

`noindex` is not authentication; exclusion is the control.

## Source-only material

The `dist/` build must also exclude repository/backend material such as:

- `cardio-hospital-3d/`
- `clipboard-sanitizer/`
- `study/supabase/`
- Steven OS source/backend files
- repository tests

`npm run test:platform` builds `dist/` and fails if non-production routes or source-only paths leak into the artifact.

## Security headers

`_headers` is version-controlled and includes:

- CSP
- `X-Content-Type-Options: nosniff`
- Referrer Policy
- Permissions Policy
- frame restrictions
- global noindex response header

When a production page needs a new cross-origin script/network dependency, update the CSP deliberately and add/adjust tests. Do not disable CSP to make a page work.

## Analytics

If aggregate usage/performance data is desired, enable **Cloudflare Web Analytics** for the Pages project.

Do not add third-party ad pixels, Google Analytics, or a tag manager. Custom events remain disabled until the requirements in `site/ANALYTICS.md` are satisfied.

## StudyHub backend

The StudyHub Edge Function/database are deployed separately from Pages. The repository source of truth includes:

- `study/supabase/functions/studyhub-save/`
- `study/supabase/migrations/20260819_create_studyhub_saves.sql`
- `study/CLOUD_SAVE_ACCEPTANCE.md`

Operational requirement: apply edge/service rate limiting and error monitoring without adding CAPTCHA or login friction. There is no connected Supabase management tool in the current agent environment, so live project configuration must be applied through the Supabase/edge administration surface and then verified.

## Cutover verification

After Cloudflare settings deploy `dist/`, run:

```sh
npm run verify:production
```

or trigger the **Production verification** GitHub workflow.

It must verify:

1. global `X-Robots-Tag: noindex, nofollow, noarchive` and security headers;
2. deployed public HTML carries `meta name="robots"` with `noindex`, `nofollow`, and `noarchive`;
3. crawler access remains compatible with the noindex directive;
4. no `/sitemap.xml` is published while direct-link-only mode is active;
5. public canonical routes return 200;
6. PREVIEW and INTERNAL routes return 404;
7. SOURCE_ONLY routes return 404;
8. custom 404 behavior works.

Do not schedule the production verifier automatically until the initial cutover passes.

## Rollback

If the `dist/` deployment exposes a regression:

1. use the prior known-good Pages deployment for immediate rollback;
2. keep the production-only build boundary in place unless the boundary itself is the defect;
3. fix the branch and re-run platform/behavior tests;
4. re-run production verification after redeploy.

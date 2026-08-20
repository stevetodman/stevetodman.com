# stevetodman.com

Personal website, pediatric cardiology education, clinical tools, simulations, and family learning projects. Deployed via Cloudflare Pages.

> **Current visibility policy:** direct links work, but search-engine indexing is intentionally disabled. The site sends a global `X-Robots-Tag: noindex, nofollow, noarchive` response header and publishes no sitemap. Public pages remain crawlable so search engines can observe the `noindex` directive and remove already-discovered URLs.

## Start here

- [`MASTER_PLAN.md`](MASTER_PLAN.md) — active platform roadmap and interruption-safe resume protocol
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — production-only Pages build and production verification
- [`site/catalog.json`](site/catalog.json) — canonical PRODUCTION / PREVIEW / INTERNAL / SOURCE_ONLY classification
- [`clinical/content-registry.json`](clinical/content-registry.json) — clinical content provenance/review lifecycle
- [`CLAUDE.md`](CLAUDE.md) — repository conventions and session handoff

## Public structure

- **Resident Education** (`/education/`) — curated hub for pediatric cardiology academies and simulations
- **Pediatric Hospital Simulator** (`/phs/`) — night-shift prioritization, reasoning, stabilization, and handoff simulation
- **Clinical Tools** (`/tools/`) — pediatric BP calculator and its validation report
- **CHD Surgical Atlas** (`/pedcardsurg/`) — surgical diagrams, operative reasoning, PTED visual topics, eponyms, and mastery assessment
- **PALS 2025 Resident Mastery Lab** (`/pals/`) — high-acuity cases and retrieval-based assessment
- **Hypertension / ABPM, cardiovascular prevention, Kawasaki, myocarditis, aortopathy, genetics, CCHD screening** — resident academies linked from `/education/`
- **Study Hub** (`/study/`) — states, vocabulary, fractions, and math-fact practice
- **Math Lab** (`/math/`) — visual fraction practice
- **Cooking Timers** (`/cooking/`) — persistent step-by-step recipe timers
- **About / Contact / Privacy / local Search** — platform support pages

Preview, internal, archived, and source-only material remains in the repository but is excluded from the public Pages artifact. See `site/catalog.json`.

## Development

Install test tooling:

```sh
npm install
npx playwright install --with-deps chromium
```

Run all tests:

```sh
npm test
```

Useful focused checks:

```sh
npm run test:platform
npm run test:smoke
npm run test:a11y
npm run test:phs
npm run test:bp
npm run test:kawasaki
npm run test:pedcardsurg
```

Behavioral tests drive real pages in Chromium and cover simulator physiology/scoring, clinical calculators, academy interactions, quiz behavior, mobile layout, site conventions, platform classification, security/privacy policy, accessibility baseline, asset provenance, and performance budgets. See [`tests/README.md`](tests/README.md).

## Build

The repository root is **not** the intended production artifact. Build the site:

```sh
npm run build
```

This generates `dist/` containing PRODUCTION routes only. PREVIEW, INTERNAL, SOURCE_ONLY, ARCHIVED, backend, developer, and test material is excluded. The public fallback catalog is filtered to PRODUCTION entries as well.

Cloudflare Pages should use:

- build command: `npm run build`
- output directory: `dist`
- production branch: `main`

See [`DEPLOYMENT.md`](DEPLOYMENT.md) before changing production settings.

## Production verification

After deployment/configuration changes:

```sh
npm run verify:production
```

This checks noindex/security headers, crawler/noindex compatibility, production route availability, non-production route absence, and custom 404 behavior against the live site.

## Clinical content maintenance

Clinical modules are tracked in `clinical/content-registry.json`. Unknown review dates remain explicitly unknown; do not invent review/sign-off metadata. The repository also contains a curriculum coverage map and a structured correction issue form.

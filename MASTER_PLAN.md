# stevetodman.com — Canonical Master Plan

Status: **ACTIVE — simplify, speed up, professionalize, reduce debt**  
Owner: Steve Todman  
Canonical repository: `stevetodman/stevetodman.com`  
Production branch: `main`  
Production site: `https://stevetodman.com`  
Updated: 2026-09-04

## Resume here

This file is the canonical cross-window handoff. The repository, not chat memory, is the source of continuity.

A new agent must:

1. read this file first, then root `AGENTS.md`;
2. inspect current `main`, exact-SHA checks, open PRs/issues, and newer commits before changing anything;
3. preserve newer completed work;
4. continue from **Exact next action** below without asking Steve to repeat history;
5. update this file before ending a substantive session.

## Mission

Make the system **fast for users, fast to change, easy to understand, low-debt, clinically safe, and boring to operate**.

> **Delete before refactoring. Simplify before optimizing. Measure before optimizing. Automate last. Stop when the system is simple and fast.**

Desired path:

```text
CATALOG -> SOURCE -> FOCUSED TEST -> BUILD -> DEPLOY EXACT SHA -> LIVE VERIFY
```

Do not build a platform merely to manage platform complexity.

## Canonical ownership

| Responsibility | Canonical owner |
| --- | --- |
| Website-hosted products | `stevetodman/stevetodman.com` |
| Production branch | `main` |
| Route/deployment classification | `site/catalog.json` |
| Clinical review lifecycle | `clinical/content-registry.json` |
| Unified hospital source | `cardio-hospital-3d/` |
| Production artifact | `dist/` |
| Deployment | Cloudflare Pages |
| Current program state / resume point | `MASTER_PLAN.md` |
| Durable root agent + exact-SHA rules | `AGENTS.md` |
| Deployment mechanics | `DEPLOYMENT.md` |
| Stable Claude conventions | `CLAUDE.md` |
| Hospital-local invariants + iPhone acceptance | `cardio-hospital-3d/AGENTS.md` |

Human docs may explain a fact but should not maintain competing dynamic state.

## Current product state

### Website / deployment

- Cloudflare Pages publishes generated `dist/`, never the repository root.
- Only `PRODUCTION` catalog entries belong in the public artifact.
- `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED` material must remain excluded.
- The site intentionally remains direct-link accessible and globally `noindex`; no sitemap until Steve explicitly changes that policy.
- `site/catalog.json` is sufficient as the single route/deployment registry. **Do not add another manifest.**

### Hospital

Canonical hospital:

- source: `cardio-hospital-3d/`;
- production route: `/hospital/`;
- `/phs/`: archived/reference;
- `/cardiohospital/`: internal/reference;
- `stevetodman/3dworld`, `pediatric-hospital-world`, `the_ward`: predecessor/reference repositories.

Desktop acceptance is complete. Do not rerun it by default. Physical-iPhone M4/M5 acceptance remains the hospital product-quality gate. Hospital-local acceptance details and durable engine invariants live in `cardio-hospital-3d/AGENTS.md`.

### Study / Math / Science

- StudyHub and Math are active production family-learning products.
- StudyHub live cloud-save acceptance remains issue **#39** and requires real backend/device evidence.
- Science Lab has progressed through M7; preserve its intentionally small invariant set + one Chromium 390px smoke during focused iteration.

### Clinical / experimental work

- Clinical review/provenance remains governed by `clinical/content-registry.json` and issue **#42**.
- Never infer review dates/sign-off from commits or tests.
- KD/MIS-C remains an experimental evidence workbench. Do not convert observational associations into invented probabilities or an unvalidated diagnostic score.

### Steven OS

The original Steven OS Cardio Hospital / PR #19 / Unreal ingest pilot is retired. Its hourly/scheduled ingest workflow, PR-specific config, and ingest worker were deleted. The remaining Steven OS UI/schema are experimental/reference only and must not compete with repository-native project state.

## Hard constraints

Do not simplify away:

1. clinical accuracy/review provenance;
2. privacy/no-PHI boundaries;
3. production-only deployment;
4. direct-link/noindex policy;
5. exact-SHA production verification;
6. asset provenance where required;
7. accessibility baseline;
8. critical behavioral regression protection;
9. working URLs unless deliberately migrated;
10. StudyHub family-token privacy/security semantics;
11. the experimental-vs-diagnostic boundary for clinical tools.

## Testing policy

Steve explicitly prefers **minimum tests for fast iteration**.

- Run only the smallest tests that protect the changed behavior.
- For Study/Science-style slices, prefer the small core invariant set plus one Chromium 390px smoke.
- Do not add WebKit matrices, screenshot suites, full product suites, or unrelated tests unless changed risk/reproduced failure warrants them.
- Documentation/census-only changes require no broad runtime suite.
- Exact-SHA production verification remains mandatory where `AGENTS.md` requires it.

## Work completed in this simplification pass

### Continuity / baseline

- `2e1e371487f9de949f002b813a0bf7d87d1e2a8e` — established this file as canonical cross-window master plan.
- `e5a5ef44d12b5c7bd072cb2c51a743fb9a026677` — root `AGENTS.md` directs new agents here.
- `136be62ff94eeb085c1aca88800759a010aad5e4` — root README reconciled to `/hospital/`; `/phs/` marked archived/reference; focused hospital test points to unified engine.
- `site/catalog.json` reconfirmed as sufficient single route/deployment registry.

### Repository census

Authenticated owner census on 2026-09-04:

- **49 repositories total**;
- **12 already GitHub-archived**;
- **37 not archived**.

Decisions:

- **PRIMARY:** `stevetodman/stevetodman.com`.
- **REFERENCE:** `3dworld`, `pediatric-hospital-world`, `the_ward`.
- **ARCHIVE decision pending settings write:** `cooking-timers` — `/cooking/` in the primary repo is canonical and the standalone Pages workflow has only failed runs. Preserve history; do not delete.
- **Already ARCHIVED:** `audience-response-live`, `audience-response-system`, `ekgquest`, `guessthechd`, `heartquest`, `lecture`, `mossandadams`, `pedisim-svt`, `Septation-Station`, `shunt`, `shuntchatgpt`, `tbank`.
- **INDEPENDENT / conservatively retained until supersession is proven:** all remaining non-archived repos, including `resident_curriculum` and `peds-cardio-curriculum`.

Do not infer archive status from names alone. Archive first; do not mass-delete repositories.

### Documentation collapse

- `e50d6d14637b3636bb2cc6e7db977499ebcaca4c` — collapsed `CLAUDE.md` to stable conventions/pointers.
- `db60aeceeb7271504be8bde64ce91fdcce816efb` — removed stale root `PR_TRIAGE.md`.
- `47638c7a566ceb28dc12487a71bed3458089c995` — collapsed `DEPLOYMENT.md` to deployment mechanics/invariants.
- `REVIEW-2026-08.md` retained as dated resolved QA evidence.
- `e867aa11fa2c2985357249829ffe8833cd2266b2` — made `cardio-hospital-3d/AGENTS.md` the hospital-local operating contract.
- `cfc9e8399029623412ba6c55441c9db65abddb6c` — removed redundant hospital `PRIMARY_PROJECT.md`.
- `ddbfce3957d679a45b1582c20ffcefcd50e40385` — removed redundant hospital `PROJECT-RULES.md`.
- `e963a189d5a8dea4e1a92989922f5322a23eead4` — collapsed `docs/HOSPITAL_MASTER_PLAN.md` to durable architecture/milestone design only.
- `4846deb06a499b67ab8135897ed6f896d82bb333` — converted `docs/IMPLEMENTATION_STATUS.md` into a historical implementation ledger with no competing resume state.
- Preserve `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md` as completed desktop evidence and `docs/CLINICAL_VALIDATION.md` as clinical evidence/governance.

### CI / workflow simplification

- `292b73705d5959f307857204749d15bbda5cb001` — completed desktop acceptance is manual-only.
- `09264cbe4c4809564176464ba7cba23bf01c805c` — unified hospital CI retargeted to current `main`/PR development.
- `99b5c28b201232390d65af837ec38e3f38882603` — corrected hospital focused CI to valid `npm install` because no hospital lockfile exists.
- `77fe02c10072a5a26f3f71ee56b271dab1dc4a2b` — root documentation no longer triggers broad `Tests`.
- `ab266cfdc4f8c924a2eb67ddd39a7f20b4db7064` — hospital docs no longer trigger Unified Hospital Build.
- `68e3b9e1d426411c58d39bf0f1f31a0b3de4dd61` — hospital docs no longer trigger Hospital Production Guard.
- `67cd3383e28a8558098669528b357b51947bed55` — repaired the manual desktop-acceptance workflow so it no longer assumes a nonexistent hospital lockfile.
- `8555cc86f83e9bd36189945cf5c0c1c2e59c3ac2` — removed obsolete one-time issue-comment/closure side effects from generic production verification.
- `a3f7da4f6576f76f5eedc1c7013ec9fc9f47fe42` — removed redundant 6-hour rebuild/browser schedule from exact-SHA Study production verification; periodic Study cloud health remains owned by `study-cloud-canary.yml`.
- `6c75269cd42c69bcd6a49509f565d5d6aa2fad90` / `ded7ce7d8b11f73ed0d1dc98f38d3f2519ca163a` / `243258f6cb6eaa652d5b0d2c8ad5ef7d6d9dfe0d` — retired the stale Steven OS PR #19/Unreal ingest workflow, config, and worker.
- `dcbbb2415b358cedc8331f9b040e4b951bf89a32` — stopped KD/MIS-C workbench and myocarditis question-bank changes from also launching the broad general test matrix; their focused workflows remain authoritative.

Workflow audit outcome: retain specialized workflows where they protect distinct responsibilities (Science Lab core+phone smoke, Pin Sprint mobile contract, Study cloud canary, external-link canary, hospital engine/build, hospital production contract, hospital post-deploy runtime smoke, KD/MIS-C safety gates, myocarditis question-bank validation, Anatomica evaluation, cooking index generation). Do not collapse them merely to reduce workflow count.

### Build / command-path simplification

- `5171150c68fe346b099e88da1b47106501b82085` — production hospital build no longer reruns `test:engine`; focused CI owns engine validation.
- A temporary hospital `npm ci` attempt was immediately corrected after the missing-lockfile constraint was reproduced. Do not repeat it without a real lockfile.
- `be1fb2eca44d15177fdbf501c0c818cce54a2ec3` — pruned five unreferenced root aliases (`verify:study-production`, `verify:study-production:browser`, `test:study`, `test:grade5:browser`, `test:study:smoke`) while retaining CI-used focused commands.

## Known remaining technical debt

### Hospital dependency/install path

`cardio-hospital-3d` currently has no `package-lock.json`.

- `npm ci` is invalid there today.
- Cloudflare's root dependency install does not provision the nested app.
- `scripts/build-hospital.mjs` must temporarily keep nested `npm install` so production builds remain functional.

Do **not** fabricate a lockfile. Generate/commit one only in a valid dependency-resolution environment if that change clearly reduces total complexity.

### Build-site copy/prune

`scripts/build-site.mjs` still uses broad copy followed by pruning. Review only if positive inclusion is demonstrably simpler while preserving production-boundary tests.

### Cooking index workflow

`update-cooking-index.yml` still embeds a large generator directly in YAML. It works and is not redundant, so it was retained during the workflow audit. Move generator logic to a source script only if/when the workflow next needs substantive changes; do not churn it solely for aesthetics.

### Performance / caching

Performance remains under-measured. Establish a tiny production benchmark for `/`, `/education/`, `/hospital/`, `/study/`, `/math/` before optimizing. Versioned Study assets and `/hospital/_next/static/` may be eligible for immutable caching only after baseline/staleness verification.

## Execution queue

### Phase A — continuity / baseline

- [x] Canonical master plan.
- [x] Root agent entrypoint.
- [x] README reconciled.
- [x] Single route registry confirmed.

### Phase B — repository census

- [x] Inventory all 49 repos.
- [x] Classify conservatively.
- [x] Identify verified superseded repositories.
- [ ] Archive `stevetodman/cooking-timers` through a GitHub settings-capable interface. Current connector cannot mutate repository archived status.
- [x] Do not delete repositories.

### Phase C — dead/stale machinery

- [x] Root docs audited/cleaned.
- [x] Hospital-local docs audited/cleaned.
- [x] Remaining workflows audited for demonstrated redundancy/staleness.
- [x] Stale Steven OS PR #19/Unreal ingestion retired.
- [x] Clinical/source provenance and useful historical evidence preserved.

### Phase D — documentation collapse

- [x] Root README / AGENTS / MASTER_PLAN roles separated.
- [x] Root `CLAUDE.md` collapsed to stable rules.
- [x] `DEPLOYMENT.md` collapsed to operations only.
- [x] Dated root QA review retained as historical evidence.
- [x] Hospital active rules/status collapsed into local `AGENTS.md`; architecture/history docs demoted to durable/reference roles.

### Phase E — CI/test simplification

- [x] Workflow inventory/audit completed.
- [x] Stop broad CI on root documentation-only changes.
- [x] Make completed desktop acceptance manual-only and runnable.
- [x] Retarget unified hospital CI to current `main`/PR development.
- [x] Stop hospital docs from triggering focused build/production-guard jobs.
- [x] Remove stale periodic/cutover workflow behavior.
- [x] Remove demonstrated duplicate broad CI for focused clinical workbenches.
- [x] Reduce unused human-facing root test/verification aliases.

### Phase F — pure deterministic build

- [x] Move hospital engine validation out of production build path.
- [ ] Resolve nested dependency installation cleanly; currently blocked by absent hospital lockfile/root-only Cloudflare install.
- [x] Keep `npm run build` as obvious production entry point.
- [ ] Review `build-site.mjs` copy/prune only if a simpler safe design is proven.

### Phase G — measured runtime performance

- [ ] Establish tiny production benchmark.
- [ ] Capture cold/warm baseline and transferred assets.
- [ ] Review Study/hospital immutable caching only after baseline.
- [ ] Fix largest measured bottleneck first.

### Phase H — shared code only if justified

- [ ] Extract only after repeated coordination proves the abstraction reduces total complexity.

### Phase I — stop

- [ ] Stop refactoring once the critical path is simple, fast, measured, and understandable.

## External / owner blockers

- **#39 StudyHub live acceptance:** requires real Supabase/edge and device evidence; never expose family tokens.
- **#42 clinical review evidence:** requires real durable review evidence; do not infer dates/sign-off.
- **Physical-iPhone hospital acceptance:** remains the hospital product-quality gate.
- **Repository archive mutation:** current connector cannot set GitHub's archived flag; `cooking-timers` remains the verified pending archive action.

## Production-state language

Keep these distinct:

1. committed;
2. focused/pre-deployment CI passed;
3. Cloudflare deployment succeeded;
4. exact current `main` SHA is production;
5. required live browser/touch verification passed.

If exact Cloudflare deployment has not succeeded: **NOT DEPLOYED**.  
If deployed but required browser verification has not passed: **DEPLOYED BUT NOT LIVE-VERIFIED**.  
If verification reproduces a failure: **PRODUCTION BROKEN — FIX IN PROGRESS**.

Never substitute an older successful run for the current SHA.

## What not to build

Do not introduce without demonstrated need:

- universal academy/simulator/learner-state engines;
- another route/module manifest;
- microservices or monorepo tooling for aesthetics;
- a developer portal to manage this website;
- a new test framework to manage existing tests;
- a large observability platform before a tiny benchmark exists;
- directory churn with no measurable maintenance/runtime benefit.

## Definition of done

Done means canonical ownership is obvious; superseded repos are archived rather than deleted; docs do not compete; ordinary changes have a small fast test path; CI/build complexity is materially lower without weakening real gates; production builds are as deterministic as practical; key routes have measured baselines; caching is efficient where safe; abstractions reduce rather than add complexity; new agents resume from this file; and further refactoring has no clear payoff.

## Exact next action

1. Verify the **current `main` SHA** after this checkpoint: require its Cloudflare Pages deployment and exact-SHA production/browser verification to pass before calling it live-verified.
2. Do **not** resume structural cleanup by default. The demonstrated high-value stale/redundant machinery has been removed; further churn needs a concrete payoff.
3. Begin Phase G with a tiny measured production baseline for `/`, `/education/`, `/hospital/`, `/study/`, and `/math/`. Record response/cache behavior and transferred/static asset weight with the smallest practical measurement method.
4. Use the baseline to identify the single largest measured bottleneck. Optimize only that bottleneck first.
5. Review immutable caching only for content-addressed/versioned assets after confirming stale-deploy behavior remains safe.
6. Keep the hospital lockfile issue deferred unless a real dependency-resolution environment produces a valid lockfile cleanly.

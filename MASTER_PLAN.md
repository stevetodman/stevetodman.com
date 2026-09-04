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
2. inspect current `main`, current checks, open PRs/issues, and newer commits before changing anything;
3. preserve newer completed work;
4. continue from **Exact next action** below without asking Steve to repeat history;
5. update this file before ending a substantive session.

## Mission

Make the system **fast for users, fast to change, easy to understand, low-debt, clinically safe, and boring to operate**.

Governing order:

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
| Durable agent + exact-SHA rules | `AGENTS.md` |
| Deployment mechanics | `DEPLOYMENT.md` |
| Stable Claude conventions | `CLAUDE.md` |

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

Desktop acceptance is complete. Do not rerun it by default. Physical-iPhone acceptance remains a separate product-quality gate where the hospital project docs require it.

### Study / Math / Science

- StudyHub and Math are active production family-learning products.
- StudyHub live cloud-save acceptance remains issue **#39** and requires real backend/device evidence.
- Science Lab has progressed through M7; preserve its intentionally small invariant set + one Chromium 390px smoke during focused iteration.

### Clinical / experimental work

- Clinical review/provenance remains governed by `clinical/content-registry.json` and issue **#42**.
- Never infer review dates/sign-off from commits or tests.
- KD/MIS-C remains an experimental evidence workbench. Do not convert observational associations into invented probabilities or an unvalidated diagnostic score.

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

Default:

- run only the smallest tests that protect the changed behavior;
- for Study/Science-style slices, prefer the small core invariant set plus one Chromium 390px smoke;
- do not add WebKit matrices, screenshot suites, full product suites, or unrelated tests unless the changed risk or a reproduced failure warrants them;
- documentation/census-only changes require no broad runtime suite;
- exact-SHA production verification remains mandatory where `AGENTS.md` requires it.

## Work completed in this simplification pass

### Continuity / baseline

- `2e1e371487f9de949f002b813a0bf7d87d1e2a8e` — established this file as canonical cross-window master plan.
- `e5a5ef44d12b5c7bd072cb2c51a743fb9a026677` — root `AGENTS.md` directs new agents here.
- `136be62ff94eeb085c1aca88800759a010aad5e4` — root README reconciled to canonical `/hospital/`; legacy `/phs/` marked archived/reference; focused hospital test points to unified engine.
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
- **INDEPENDENT / conservatively retained until supersession is proven:** all remaining non-archived repos, including `resident_curriculum` (own `curriculum.stevetodman.com` lifecycle) and `peds-cardio-curriculum` (private lecture/database/CLI system).

Do not infer archive status from names alone. Archive first; do not mass-delete repositories.

### Documentation collapse

- `e50d6d14637b3636bb2cc6e7db977499ebcaca4c` — collapsed `CLAUDE.md` from dynamic status/backlog into stable conventions and pointers.
- `db60aeceeb7271504be8bde64ce91fdcce816efb` — removed stale, unreferenced `PR_TRIAGE.md`; current PR state lives in GitHub and current program state lives here.
- `47638c7a566ceb28dc12487a71bed3458089c995` — removed stale branch/issue status from `DEPLOYMENT.md`; retained only deployment mechanics and invariants.
- `REVIEW-2026-08.md` was audited and retained because it is a dated historical QA record, not a live handoff. Its findings are explicitly resolved in the document.

### CI simplification

- `292b73705d5959f307857204749d15bbda5cb001` — completed desktop acceptance is now **manual-only**; it no longer auto-runs on the obsolete `hospital-unified` branch.
- `09264cbe4c4809564176464ba7cba23bf01c805c` — retargeted unified hospital build/engine CI from old branch to current `main` + hospital PR changes.
- That first run failed because `cardio-hospital-3d` has **no `package-lock.json`** and the workflow incorrectly assumed `npm ci`.
- `99b5c28b201232390d65af837ec38e3f38882603` — corrected the workflow to the only currently valid install mode (`npm install`); focused Unified Hospital Build run **#103 passed**.
- `77fe02c10072a5a26f3f71ee56b271dab1dc4a2b` — removed README/MASTER_PLAN/CLAUDE/DEPLOYMENT/old-PR-triage files from the broad `Tests` workflow path triggers. Documentation-only commits no longer launch the full multi-job matrix.

### Build-path simplification

- `b90ebc8a4354fcb005c5d0cdc30492ad1310d276` attempted to make hospital installs deterministic with `npm ci`; this exposed the missing-lockfile constraint and was immediately corrected.
- `5171150c68fe346b099e88da1b47106501b82085` — production hospital build no longer reruns `test:engine`; focused CI now owns engine validation. Nested `npm install` remains temporarily because Cloudflare installs the root package only and the hospital has no lockfile.
- Focused hospital production guard passed on `5171150c…`.
- At the time of this checkpoint, Cloudflare deployment and exact production/browser verification for `5171150c…` were still in progress. **Do not call that SHA live-verified unless the exact checks subsequently pass.**

## Known remaining technical debt

### Root test interface

Root `package.json` still exposes many manually enumerated test commands. Keep useful focused commands, but reduce change amplification only where simple conventions can replace long synchronized lists.

### Workflow sprawl

There are still multiple product-specific workflows. Audit trigger/environment differences before deleting or consolidating them. Do not target an arbitrary workflow count.

Conceptual target:

```text
FAST       affected unit/contracts
PRODUCT    affected product smoke
PRODUCTION exact deployed-SHA verification
```

### Hospital dependency/install path

`cardio-hospital-3d` currently has no `package-lock.json`. Therefore:

- `npm ci` is invalid there today;
- Cloudflare's root dependency install does not provision the nested app;
- `scripts/build-hospital.mjs` must temporarily keep nested `npm install` so production builds remain functional.

Do **not** fabricate a lockfile. A future cleanup may generate/commit a real lockfile and/or adopt a simpler supported dependency-install stage, but only if it reduces total complexity.

### Build-site copy/prune

`scripts/build-site.mjs` still uses broad copy followed by pruning. Review only if positive inclusion is demonstrably simpler while preserving production-boundary tests.

### Performance / caching

Performance remains under-measured. Establish a tiny benchmark for `/`, `/education/`, `/hospital/`, `/study/`, `/math/` before optimizing.

Candidate later improvements:

- versioned Study assets may be eligible for immutable caching while HTML/release entry points remain revalidated;
- `/hospital/_next/static/` may similarly be eligible;
- optimize the largest measured bottleneck first and re-measure.

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

- [~] Audit stale source copies, scripts, workflows, old handoffs, and redundant commands. Root docs + initial workflow pass completed; continue product-specific audit.
- [x] Remove demonstrated stale `PR_TRIAGE.md`.
- [ ] Delete/retire further machinery only after proving canonical replacement/no current function.
- [ ] Preserve clinical/source provenance and useful historical evidence.

### Phase D — documentation collapse

- [x] Root README / AGENTS / MASTER_PLAN roles separated.
- [x] Root `CLAUDE.md` collapsed to stable rules.
- [x] `DEPLOYMENT.md` collapsed to operations only.
- [x] Dated `REVIEW-2026-08.md` explicitly retained as historical evidence.
- [ ] Audit product-level `PRIMARY_PROJECT.md`, implementation-status, project-rules, and handoff files; preserve only genuinely local acceptance criteria.

### Phase E — CI/test simplification

- [~] Workflow inventory underway.
- [x] Stop broad CI on documentation-only changes.
- [x] Make completed desktop acceptance manual-only.
- [x] Retarget unified hospital CI to current `main`/PR development.
- [ ] Audit remaining workflows for obsolete triggers/duplicate responsibilities.
- [ ] Reduce the human-facing root test interface only where it clearly simplifies maintenance.

### Phase F — pure deterministic build

- [x] Move hospital engine validation out of the production build path.
- [ ] Resolve nested dependency installation cleanly; currently blocked by absent hospital lockfile/root-only Cloudflare install.
- [ ] Keep `npm run build` as the obvious production entry point.
- [ ] Review `build-site.mjs` copy/prune only if a simpler safe design is proven.

### Phase G — measured runtime performance

- [ ] Establish tiny production benchmark.
- [ ] Capture cold/warm baseline and transferred assets.
- [ ] Review Study and hospital immutable caching only after baseline.
- [ ] Fix largest measured bottleneck first.

### Phase H — shared code only if justified

- [ ] Extract only after repeated coordination proves the abstraction reduces total complexity.

### Phase I — stop

- [ ] Stop refactoring once the critical path is simple, fast, measured, and understandable.

## External / owner blockers

- **#39 StudyHub live acceptance:** requires real Supabase/edge and device evidence; never expose family tokens.
- **#42 clinical review evidence:** requires real durable review evidence; do not infer dates/sign-off.
- **Physical-iPhone hospital acceptance:** remains separate wherever hospital acceptance docs require it.
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

Unless future evidence changes the decision, do not introduce:

- a universal academy/simulator/learner-state engine;
- another route/module manifest;
- microservices or monorepo tooling for organizational aesthetics;
- a developer portal to manage this website;
- a new test framework to manage existing tests;
- a large observability platform before a tiny benchmark exists;
- directory churn with no measurable maintenance/runtime benefit.

## Definition of done

This simplification program is done when:

- the canonical repo/routes/deployment path are obvious;
- obvious superseded repos are archived, not deleted;
- documentation has non-overlapping ownership;
- ordinary changes have a small fast test path;
- CI/build complexity is materially lower without weakening real gates;
- production builds are as deterministic as practical;
- key routes have simple measured performance baselines;
- caching is efficient where versioning makes it safe;
- abstractions exist only where they remove more complexity than they add;
- a new agent can resume from this file without Steve re-explaining anything;
- further refactoring no longer has a clear measured payoff.

## Exact next action

1. **First inspect current `main` and exact-SHA checks.** This checkpoint itself creates a newer SHA than `5171150c…`; do not rely on the older in-progress deployment once this commit lands. Confirm the current exact SHA's Cloudflare + required browser verification status before making any production claim.
2. Continue the **product-level Phase C/D audit**, starting with `cardio-hospital-3d/PRIMARY_PROJECT.md`, implementation-status/project-rules/handoff files, and remaining hospital workflows. Preserve local acceptance criteria; remove stale duplicate dynamic state.
3. Continue the remaining workflow audit; delete/consolidate only when trigger/environment responsibilities are demonstrably redundant.
4. Do not force the hospital lockfile problem. Generate/commit a real lockfile only through a valid dependency-resolution environment; never synthesize one.
5. Keep testing minimal and stop when additional simplification has no clear payoff.

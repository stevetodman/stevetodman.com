# stevetodman.com — Canonical Master Plan

Status: **ACTIVE**  
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
4. continue from **Exact next action** without asking Steve to repeat history;
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
| Hospital-local invariants + physical-iPhone acceptance | `cardio-hospital-3d/AGENTS.md` |

Human docs may explain facts but must not maintain competing dynamic state.

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

- Run only the smallest tests protecting changed behavior.
- Hospital focused code changes: existing `npm run test:engine` + `npm run build` / focused workflows, plus production guard where triggered.
- Study/Science-style slices: small core invariant set plus one Chromium 390px smoke unless changed risk warrants more.
- Do not add WebKit matrices, screenshot suites, full product suites, or unrelated tests by default.
- Documentation-only changes require no broad runtime suite.
- Exact-SHA production verification remains mandatory where `AGENTS.md` requires it.

## Current product state

### Website / deployment

- Cloudflare Pages publishes generated `dist/`, never the repository root.
- Only `PRODUCTION` catalog entries belong in the public artifact.
- `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED` material must remain excluded.
- Site remains direct-link accessible and globally `noindex`; no sitemap unless Steve explicitly changes that policy.
- `site/catalog.json` is the single route/deployment registry. **Do not add another manifest.**

### Hospital

Canonical hospital:

- source: `cardio-hospital-3d/`;
- production route: `/hospital/`;
- `/phs/`: archived/reference;
- `/cardiohospital/`: internal/reference;
- `stevetodman/3dworld`, `pediatric-hospital-world`, `the_ward`: predecessor/reference repositories.

Architecture:

- event-driven canonical simulation;
- synthetic/immutable case facts in source;
- runtime engine owns workflow truth;
- UI/input state remains separate;
- stable patient IDs, typed events, deterministic behavior, versioned persistence;
- no PHI;
- no backend unless demonstrated need.

Desktop behavioral acceptance is complete and should not be rerun by default. **Physical-iPhone M4/M5 acceptance remains the hospital product-quality gate.** Emulation and automated touch-browser verification do not close that gate.

Hospital dependency resolution is deterministic: `cardio-hospital-3d/package-lock.json` is committed, focused CI and production hospital build use `npm ci`, and Next.js is pinned to security release `16.3.3`.

#### Physical-iPhone repair history

Initial real-device testing on 2026-09-04 reproduced:

- Dr. Patel/clinical overlays not reliably scrolling;
- unstable/hard left-right touch look;
- non-solid furniture;
- weak room signage;
- Pager difficult to dismiss;
- Worklist had no in-panel dismissal;
- overall poor iPhone optimization.

PR **#179**, merged at `05b3835c491d6bcf7d17678ada8f323e45c0d534`, fixed overlay scrolling, first-pass touch-look behavior, major furniture collision, room signage, Pager close, Worklist close, and touch-native Pager/Worklist scrolling. That exact SHA passed Cloudflare production verification.

After the realism passes, Steve physically retested and reported the hospital looked better, but two remaining defects were reproduced:

1. automatic compound furniture colliders could trap the player;
2. left/right looking had become harder, and Steve preferred two independent joysticks.

PR **#183**, merged at `571f53e473b2167738a8a40f21d40ec3c39c32a0`, is the current functional control/collision repair:

- **left joystick = movement**;
- **right joystick = camera look** (yaw + limited pitch);
- independent pointer capture supports simultaneous move + look;
- separate Interact button remains accessible in portrait/landscape;
- mobile screen-drag look is no longer the primary control;
- transient mobile-look input resets when clinical overlays open;
- automatic child-mesh furniture colliders were removed;
- conference table, workstation, and exam table use tight explicit colliders;
- office chairs and stools are intentionally non-colliding so they cannot trap the player.

Validation for PR #183:

- Hospital Production Guard: passed;
- all 12 focused engine tests: passed;
- production build: passed;
- exact `571f53e...` Cloudflare production deployment: passed;
- touch-enabled browser verification: passed;
- stale-main protection: passed.

**Do not mark M4/M5 complete yet.** Steve must physically retest the twin-stick/collision repair on the actual iPhone.

#### Performance-safe realism program

The realism work intentionally does not change clinical logic, engine semantics, persistence, or backend behavior.

- PR **#180** / `e2e07010c6a1945729b52dd8ab5af6c6451d04b3`: corridor handrails, door frames/hardware, floor wayfinding, headwalls, outlet/gas cues, sinks/faucets, dispensers, sharps/glove stations, privacy curtains, and improved patient/family human proportions/details.
- PR **#181** / `a378b318b82bcb408267a35e3c8f9d06bf992561`: higher-fidelity clinician overlays, badge/stethoscope cues, vital-sign monitors, wall diagnostic stations, supply carts, waste/linen fixtures. Exact-production verified.
- PR **#182** / `1e4b7db5ef1b02de18d9682f4251831dc766904e`: ceiling grid, diffusers/sprinkler cues, baseboards/wall bumpers, pediatric art, clocks/notices, room finish details. Focused checks passed and exact-production verification subsequently passed.

These passes use lightweight procedural geometry. **Do not introduce heavy GLB/animated-character payloads until the physical-iPhone usability/performance gate is acceptable.** Once cleared, use performance-budgeted optimized glTF/GLB, compressed textures, LOD/culling/room streaming, and clinically authentic equipment/layout rather than chasing AAA photorealism.

### Study / Math / Science

- StudyHub and Math are active production family-learning products.
- StudyHub issue **#39** has live Supabase control-plane evidence: StudyHub migration present, `studyhub.saves` RLS enabled, browser roles lack schema/table CRUD, no public RLS policies expose the table, deployed `studyhub-save` function active, and hourly synthetic cloud-save monitoring exists.
- Remaining #39 blockers: explicit inbound abuse/rate-limit control and real-device two-device/offline acceptance. Never expose family tokens.
- Science Lab has progressed through M7. Preserve its intentionally small invariant set + one Chromium 390px phone smoke during focused iteration.

### Clinical / experimental work

- Clinical review/provenance remains governed by `clinical/content-registry.json` and issue **#42**.
- Never infer review dates/sign-off from commits or tests.
- KD/MIS-C remains an experimental evidence workbench. Do not convert observational associations into invented probabilities or an unvalidated diagnostic score.

### Steven OS

The original Steven OS Cardio Hospital / PR #19 / Unreal ingest pilot is retired. Its scheduled ingest workflow/config/worker were removed. Remaining Steven OS UI/schema are experimental/reference only and must not compete with repository-native state.

## Completed simplification / reliability work

### Continuity and docs

- `2e1e371487f9de949f002b813a0bf7d87d1e2a8e` — established canonical `MASTER_PLAN.md`.
- `e5a5ef44d12b5c7bd072cb2c51a743fb9a026677` — root `AGENTS.md` directs new agents here.
- `136be62ff94eeb085c1aca88800759a010aad5e4` — README reconciled to canonical `/hospital/`.
- `e50d6d14637b3636bb2cc6e7db977499ebcaca4c` — collapsed `CLAUDE.md` to stable conventions.
- `db60aeceeb7271504be8bde64ce91fdcce816efb` — removed stale `PR_TRIAGE.md`.
- `47638c7a566ceb28dc12487a71bed3458089c995` — collapsed `DEPLOYMENT.md` to durable mechanics.
- `e867aa11fa2c2985357249829ffe8833cd2266b2` — hospital `AGENTS.md` became the local operating contract.
- `cfc9e8399029623412ba6c55441c9db65abddb6c` / `ddbfce3957d679a45b1582c20ffcefcd50e40385` — removed redundant hospital project-rule docs.
- `e963a189d5a8dea4e1a92989922f5322a23eead4` — hospital master-plan doc reduced to durable architecture/milestones.
- `4846deb06a499b67ab8135897ed6f896d82bb333` — implementation status converted to historical ledger.

### Repository census

2026-09-04 authenticated census:

- 49 repositories total;
- 12 already archived;
- PRIMARY: `stevetodman.com`;
- REFERENCE: `3dworld`, `pediatric-hospital-world`, `the_ward`;
- `cooking-timers`: verified archive candidate, preserve history, do not delete;
- remaining non-archived repos retained conservatively as independent unless supersession is proven.

### CI/build simplification

- completed desktop acceptance is manual-only;
- unified hospital CI targets current `main`/PRs;
- documentation no longer launches broad unrelated tests/builds;
- redundant/stale scheduled side effects removed;
- focused clinical workflows retained where they protect distinct responsibilities;
- production hospital build no longer reruns engine tests redundantly.

Key commits include `292b7370...`, `09264cbe...`, `77fe02c1...`, `ab266cfd...`, `68e3b9e1...`, `8555cc86...`, `a3f7da4f...`, `dcbbb241...`, and `5171150c...`.

### Deterministic dependencies / security

- PR **#177** / `70b928b2e5bf4c7c82ae47558aa54381f8609e8f`: committed real hospital npm lockfile, moved focused CI and production hospital build to `npm ci`, proved all 12 engine tests + build, exact-SHA production verified.
- PR **#178** / `37a40f5a6d62d3ac2884d8763864e89003330654`: Next.js `16.3.1 -> 16.3.3` security-only patch, regenerated lockfile, `npm ci` + 12 tests + build passed, exact-SHA production verified.

### Verification hardening

- `4b37918bec6f1d53d2ca1299f7e2c869b2b7c120`: fixed whitespace-sensitive false negative in hospital post-deploy verifier.
- `c5ee49ff715e9345e4895646c17a2c8101410ec8`: exact Cloudflare + touch-browser + stale-main verification passed after verifier fix.

### Measured performance

- baseline `dd7f707c526c236f7ac5884e257b12107a519ef9`: `/hospital/` cold transfer about 1.204 MB, much larger than other benchmark routes.
- `e8195c1a3a65daf49b5ef0d031e500ab9af435ec`: deferred Three/Rapier world until user enters hospital.
- `5167daae2bf7efdf3eb3f1c0f653c588779516f4`: exact production remeasurement showed hospital cold transfer fell to 175,879 bytes, about **85% lower**, while warm transfer remained ~3.1 KB.
- Do not add caching complexity without new measured evidence.

## Known remaining technical debt / external blockers

- **Physical-iPhone hospital acceptance:** current highest-priority hospital gate. Latest twin-stick/collision repair is exact-production/browser verified but still needs physical confirmation.
- **StudyHub #39:** inbound rate limiting + real two-device/offline acceptance.
- **Clinical #42:** real durable review evidence required; never infer/backdate.
- **`cooking-timers` archive:** requires a settings-capable GitHub interface; preserve history, do not delete.
- `update-cooking-index.yml` still embeds a large generator in YAML; move it only if that workflow next needs substantive change, not for aesthetics.

## Production-state language

Keep these distinct:

1. committed;
2. focused/pre-deployment CI passed;
3. Cloudflare deployment succeeded;
4. exact current `main` SHA is production;
5. required live browser/touch verification passed;
6. required physical-device acceptance passed.

If exact Cloudflare deployment has not succeeded: **NOT DEPLOYED**.  
If deployed but required browser verification has not passed: **DEPLOYED BUT NOT LIVE-VERIFIED**.  
If browser-verified but physical acceptance is required and unfinished: **LIVE-VERIFIED; PHYSICAL ACCEPTANCE OPEN**.  
If verification reproduces a failure: **PRODUCTION BROKEN — FIX IN PROGRESS**.

Never substitute an older successful run for the current SHA.

## What not to build

Do not introduce without demonstrated need:

- another repository-wide simplification/refactor pass;
- universal academy/simulator/learner-state engines;
- another route/module manifest;
- microservices or monorepo tooling for aesthetics;
- a developer portal to manage this website;
- a new test framework to manage existing tests;
- a large observability platform before a measured need exists;
- heavy hospital assets before physical-iPhone performance is acceptable;
- directory churn with no measurable maintenance/runtime benefit.

## Exact next action

1. Inspect the **current `main` SHA** and its exact-SHA production/browser checks before doing anything else. The latest functional hospital checkpoint before this documentation update is `571f53e473b2167738a8a40f21d40ec3c39c32a0`, and that exact SHA passed Cloudflare deployment, touch-browser verification, and stale-main protection. This documentation commit itself must independently pass the exact-SHA gate before current `main` is called live-verified.
2. Steve performs the **physical-iPhone twin-stick/collision retest**:
   - left stick moves forward/back/strafe;
   - right stick looks left/right/up/down naturally;
   - both sticks work simultaneously;
   - chairs/stools no longer trap the player;
   - conference table/workstation/exam table still feel appropriately solid without oversized invisible barriers;
   - Interact button is usable in portrait and landscape;
   - doorway traversal still works both directions.
3. If those pass, finish the remaining M4/M5 physical checklist in `cardio-hospital-3d/AGENTS.md`: Dr. Patel/clinical scrolling, Pager/Worklist close behavior, safe areas/orientation, PWA/Add to Home Screen, reload/resume/no duplicates, auscultation audio, ECG touch, actor visibility/confidential-state behavior, and sustained-run thermal/battery/performance.
4. Record actual iPhone model, iOS/Safari version, portrait/landscape/PWA results, defects, and fix SHAs. Do not infer any of them.
5. Only after physical iPhone usability/performance is acceptable should the realism program advance to higher-fidelity animated humans, richer equipment/materials/lighting, ambient staff activity/audio, and LOD/streaming.
6. StudyHub #39, clinical #42, and `cooking-timers` archive remain separate unresolved work as described above.

## Definition of done

Done means canonical ownership is obvious; superseded repos are archived rather than deleted; docs do not compete; ordinary changes have a small fast test path; CI/build complexity is materially lower without weakening real gates; production builds are deterministic; key routes have measured baselines; abstractions reduce rather than add complexity; new agents resume from this file; and the hospital passes the required physical-device acceptance before heavier realism or later milestones advance.

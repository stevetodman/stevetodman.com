# Canonical Master Plan

Status: **ACTIVE**  
Canonical repository: this repository  
Production branch: `main`  
Updated: 2026-09-04

## Resume here

This file is the canonical cross-window handoff. The repository, not chat memory, is the source of continuity.

A new agent must:

1. read this file first, then root `AGENTS.md`;
2. inspect current `main`, exact-SHA checks, open PRs/issues, and newer commits before changing anything;
3. preserve newer completed work;
4. continue from **Exact next action** without asking the owner to repeat history;
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
| Website-hosted products | this repository |
| Production branch | `main` |
| Route/deployment classification | `site/catalog.json` |
| Clinical review lifecycle | `clinical/content-registry.json` |
| Unified hospital source | `cardio-hospital-3d/` |
| Production artifact | `dist/` |
| Deployment | Cloudflare Pages |
| Current program state / resume point | `MASTER_PLAN.md` |
| Durable root agent + exact-SHA rules | `AGENTS.md` |
| Deployment mechanics | `DEPLOYMENT.md` |
| Stable conventions | `CLAUDE.md` |
| Hospital-local invariants + physical-iPhone acceptance | `cardio-hospital-3d/AGENTS.md` |
| Hospital visual architecture / graphics replacement specification | `cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md` |

Human docs may explain facts but must not maintain competing dynamic state.

## Privacy and disclosure rule

Keep repository handoff/status documentation focused on engineering state. Do not add unnecessary personal identifiers, email addresses, synthetic patient/NPC names, patient-style case details, or other clinical-style content to this file. Use generic case/role labels when needed.

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

The owner explicitly prefers **minimum tests for fast iteration**.

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
- Site remains direct-link accessible and globally `noindex`; no sitemap unless explicitly changed.
- `site/catalog.json` is the single route/deployment registry. **Do not add another manifest.**

### Hospital

Canonical hospital:

- source: `cardio-hospital-3d/`;
- production route: `/hospital/`;
- `/phs/`: archived/reference;
- `/cardiohospital/`: internal/reference;
- three predecessor hospital repositories remain reference-only.

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

#### Current Hospital Checkpoint

Current executable checkpoint before this documentation update: `c72c28b42976d69620a9e6911a932d524a4a3543`.

Recent merged changes:

- PR **#183** / `571f53e4`: implemented independent left-stick movement and right-stick camera control, preserved separate interaction control, and replaced trapping compound furniture collision with tighter explicit collision for major fixed furniture.
- PR **#184** / `e25a3bae`: fixed Pager/Worklist overlay scrolling and patient interaction proximity anchors.
- PR **#185** / `96f30289`: fixed NPC interaction availability across `available`, `assigned`, and `in-progress` consult states while preserving canonical engine transitions.
- PR **#186** / `5a5876a1`: removed a misleading non-interactive decorative clinician.
- PR **#188** / `c72c28b4`: fixed the physical-iPhone no-movement failure by moving the player spawn out of the solid conference-table collider, centralizing the collision-safe spawn, and adding a focused regression guard.

Verification of `c72c28b42976d69620a9e6911a932d524a4a3543`:

- focused repository guard passed;
- production build passed;
- Cloudflare Pages deployment succeeded for the exact SHA;
- deployment verification workflow passed;
- live-runtime smoke passed;
- owner physically confirmed on the actual iPhone that movement works when entering the hospital from the production website;
- owner physically confirmed right-stick look and simultaneous move + look;
- owner physically confirmed interactive clinician Speak/briefing behavior;
- owner physically confirmed visible consult-case interaction at natural proximity;
- owner physically confirmed furniture and doorway traversal.

Current state: **LIVE-VERIFIED; PHYSICAL ACCEPTANCE OPEN**.

The physical-iPhone movement, twin-stick look, clinician briefing, consult proximity, and furniture/doorway checks are closed. Do **not** repeat them unless a new reproducible regression appears. Do not mark M4/M5 complete until the remaining overlay, orientation, PWA, persistence, audio/ECG, actor-visibility, replay, and sustained-performance checks pass on the actual iPhone.

#### Visual architecture replacement program — governing source of truth

The owner accepted Astra's 2026-09-04 hospital graphics assessment as the governing visual-architecture plan. It is preserved verbatim-in-substance at:

`cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md`

Future agents must read that document before any substantive HospitalSim graphics/visual work. It supersedes older graphics-growth guidance where the two conflict.

Core decisions:

- keep React Three Fiber, Three.js, the current WebGL renderer for the proof scene, Rapier narrowly, and the canonical clinical engine;
- replace the visual production architecture with an **authored modular/hybrid hospital** using baked environmental lighting, a small shared PBR material library, properly modeled/rigged lightly animated humans, reusable room/equipment kits, explicit simple colliders, and canonical clinical state projected into visuals;
- do **not** migrate renderers or run another procedural-realism pass before proving this asset strategy;
- preserve the hard boundary **canonical clinical state -> visual projection**; animation must never become a second clinical state machine;
- use minimal focused testing while iterating.

Required implementation order:

1. **Phase 0 — acceptance baseline:** finish the remaining documented physical-iPhone gate while preserving already-passed checks and recording actual device/browser/orientation/sustained behavior/loading.
2. **Phase 1 — visual recipe proof:** one room, one equipment set, minimum compatible character family, and the complete lighting/export/lightmap recipe.
3. **Phase 2 — complete encounter vertical slice:** corridor approach + doorway + room + patient + parent + clinician + UI + state-dependent visibility, while preserving anchors/collision and measuring payload, draw calls, frame pacing, and sustained phone behavior.
4. **Phase 3 — reuse proof:** build a second room from the same kit/material/equipment/animation pipeline.
5. **Phase 4 — progressive replacement:** remove superseded procedural content room by room; add extra visibility/LOD machinery only when growth proves the need.

Proof-scene acceptance must include corridor-to-room lighting continuity, doorway/collision/loading boundaries, patient/parent/clinician at conversational distance, recognizable examination surface/equipment, seated/standing and relevant lying-pose validation, clinical UI open/return, parent removal and completion without stale visuals, plus one deliberate content edit to prove the pipeline is cheap to revise.

Do-not-build guardrails include: another numbered procedural realism pass; renderer migration before proof; runtime GI/ray tracing/volumetrics/SSR; baseline bloom/DOF/motion blur; fully simulated movable-furniture hospital; generic ambient crowd AI; full face/cloth/hair/procedural exams; hospital-wide 4K textures or one giant GLB; asset CMS/streaming backend/custom scene editor/universal character framework; broad screenshot/browser matrices for every visual iteration; and decorative physiological displays that could be mistaken for canonical patient data.

Expansion proceeds only if one complete encounter looks substantially better, remains comfortable on the physical iPhone, and is cheap to revise.

#### Performance-safe realism program

Completed lightweight procedural realism passes:

- PR **#180** / `e2e07010`: corridor/door/floor wayfinding, wall and room fixtures, privacy and clinical-environment details, and improved human proportions/details.
- PR **#181** / `a378b318`: clinician overlays, badge/stethoscope cues, monitors, diagnostic stations, carts, and room fixtures.
- PR **#182** / `1e4b7db5`: ceiling grid, diffusers/sprinkler cues, baseboards/wall protection, pediatric art, clocks/notices, and finish details.

These passes are historical and should not be extended into another procedural realism cycle. After Phase 0, the visual architecture program above governs the next graphics work.

### Study / Math / Science

- StudyHub and Math are active production family-learning products.
- StudyHub issue **#39** has live Supabase control-plane evidence: migration present, RLS enabled, browser roles lack schema/table CRUD, no public RLS policies expose the save table, deployed save function active, and hourly synthetic cloud-save monitoring exists.
- Remaining #39 blockers: explicit inbound abuse/rate-limit control and real-device two-device/offline acceptance. Never expose family tokens.
- Science Lab has progressed through M7. Preserve its intentionally small invariant set + one Chromium 390px phone smoke during focused iteration.

### Clinical / experimental work

- Clinical review/provenance remains governed by `clinical/content-registry.json` and issue **#42**.
- Never infer review dates/sign-off from commits or tests.
- KD/MIS-C remains an experimental evidence workbench. Do not convert observational associations into invented probabilities or an unvalidated diagnostic score.

### Retired/reference work

The earlier external hospital ingest pilot is retired. Its scheduled ingest workflow/config/worker were removed. Remaining related UI/schema are experimental/reference only and must not compete with repository-native state.

## Completed simplification / reliability work

### Continuity and docs

- `2e1e3714...` — established canonical `MASTER_PLAN.md`.
- `e5a5ef44...` — root `AGENTS.md` directs new agents here.
- README reconciled to canonical `/hospital/`.
- `CLAUDE.md` collapsed to stable conventions.
- stale `PR_TRIAGE.md` removed.
- `DEPLOYMENT.md` collapsed to durable mechanics.
- hospital `AGENTS.md` became the local operating contract.
- redundant hospital project-rule docs removed.
- hospital master-plan doc reduced to durable architecture/milestones.
- implementation status converted to historical ledger.
- `6a91917b...` — added `cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md` preserving the owner-approved Astra graphics architecture and phased implementation plan.

### Repository census

2026-09-04 authenticated census:

- 49 repositories total;
- 12 already archived;
- this repository is PRIMARY;
- three predecessor hospital repositories are REFERENCE;
- one cooking-timer repository is a verified archive candidate; preserve history, do not delete;
- remaining non-archived repositories are retained conservatively as independent unless supersession is proven.

### CI/build simplification

- completed desktop acceptance is manual-only;
- unified hospital CI targets current `main`/PRs;
- documentation no longer launches broad unrelated tests/builds;
- redundant/stale scheduled side effects removed;
- focused clinical workflows retained where they protect distinct responsibilities;
- production hospital build no longer reruns engine tests redundantly.

### Deterministic dependencies / security

- PR **#177** / `70b928b2`: committed real hospital npm lockfile, moved focused CI and production hospital build to `npm ci`, proved all 12 engine tests + build, exact-SHA production verified.
- PR **#178** / `37a40f5a`: Next.js `16.3.1 -> 16.3.3` security-only patch, regenerated lockfile, `npm ci` + 12 tests + build passed, exact-SHA production verified.

### Verification hardening

- fixed whitespace-sensitive false negative in hospital post-deploy verifier;
- exact Cloudflare + touch-browser + stale-main verification subsequently passed.

### Measured performance

- baseline: `/hospital/` cold transfer about 1.204 MB;
- deferred Three/Rapier world until user enters hospital;
- exact production remeasurement: hospital cold transfer fell to 175,879 bytes, about **85% lower**, while warm transfer remained ~3.1 KB;
- do not add caching complexity without new measured evidence.

## Known remaining technical debt / external blockers

- **Physical-iPhone hospital acceptance:** highest-priority hospital gate. Confirmed passing on executable `c72c28b4`: movement, right-stick look, simultaneous move/look, clinician briefing interaction, consult-case proximity interaction, and furniture/doorway traversal. Remaining physical checks are Pager/Worklist scrolling/dismissal, portrait/landscape/safe areas, clinical overlays, PWA, persistence/reload, audio/ECG, actor visibility/state transitions, replay, and sustained thermal/battery/frame-rate behavior.
- **StudyHub #39:** inbound rate limiting + real two-device/offline acceptance.
- **Clinical #42:** real durable review evidence required; never infer/backdate.
- **Cooking-timer archive:** requires a settings-capable interface; preserve history, do not delete.
- one update workflow still embeds a large generator in YAML; move it only if that workflow next needs substantive change, not for aesthetics.

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
- another hospital procedural-realism pass;
- a hospital renderer migration before the authored-hybrid proof scene;
- hospital-wide heavy asset infrastructure before the proof scene demonstrates value and iPhone viability;
- directory churn with no measurable maintenance/runtime benefit.

## Exact next action

1. Treat the following physical-iPhone checks as **passed** for executable `c72c28b42976d69620a9e6911a932d524a4a3543`: movement, right-stick look, simultaneous move + look, clinician Speak/briefing, visible consult-case interaction at natural proximity, and furniture/doorway traversal. Do not repeat them unless a new reproducible defect appears.
2. Finish the two remaining interaction-critical checks on the actual iPhone:
   - Pager and Worklist open, scroll, and close correctly above the twin-stick controls;
   - portrait and landscape both preserve usable controls, safe areas, overlays, doorway traversal, and orientation changes while clinical UI is open.
3. Then finish the remaining M4/M5 physical checklist in `cardio-hospital-3d/AGENTS.md`: clinical scrolling/tap targets/confidential-state behavior, PWA/Add to Home Screen, reload/resume/no duplicates, auscultation audio, ECG touch, actor visibility/state transitions, replay behavior, and sustained frame-rate/thermal/battery performance.
4. Record actual device model, iOS/Safari version, portrait/landscape/PWA results, defects, and fix SHAs when supplied. Do not infer any of them.
5. When every required physical check passes, update the hospital implementation ledger and mark **M4/M5 complete**.
6. Then begin **Phase 1** of `cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md`: prove one authored room, one equipment set, the minimum compatible character family, and the complete lighting/export/lightmap recipe. Do not rebuild the clinical architecture and do not run another procedural realism pass.
7. Continue the visual program through Phases 2–4 only if each preceding proof meets its acceptance criteria and the physical iPhone remains comfortable.
8. StudyHub #39, clinical #42, and the archive task remain separate unresolved work as described above.

## Definition of done

Done means canonical ownership is obvious; superseded repositories are archived rather than deleted; docs do not compete; ordinary changes have a small fast test path; CI/build complexity is materially lower without weakening real gates; production builds are deterministic; key routes have measured baselines; abstractions reduce rather than add complexity; new agents resume from this file; and the hospital follows the owner-approved authored-hybrid visual architecture only after required physical-device acceptance, with expansion justified by proof-scene quality, iPhone comfort, and cheap revision.

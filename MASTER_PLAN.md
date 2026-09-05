# Canonical Master Plan

Status: **ACTIVE**  
Canonical repository: this repository  
Production branch: `main`  
Updated: 2026-09-04

## Resume here

This file is the canonical cross-window handoff. The repository, not chat memory, is the source of continuity.

A new agent must:

1. read this file first, then root `AGENTS.md`;
2. for HospitalSim graphics work, also read `cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md` and `cardio-hospital-3d/docs/VISUAL_ASSET_PIPELINE.md`;
3. inspect current `main`, exact-SHA checks, open PRs/issues, and newer commits before changing anything;
4. preserve newer completed work;
5. continue from **Exact next action** without asking the owner to repeat history;
6. update this file before ending a substantive session.

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
| Hospital visual architecture | `cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md` |
| Hospital Phase 1 asset recipe | `cardio-hospital-3d/docs/VISUAL_ASSET_PIPELINE.md` |
| Production artifact | `dist/` |
| Deployment | Cloudflare Pages |
| Current program state / resume point | `MASTER_PLAN.md` |
| Durable root agent + exact-SHA rules | `AGENTS.md` |
| Deployment mechanics | `DEPLOYMENT.md` |
| Stable conventions | `CLAUDE.md` |
| Hospital-local invariants + physical-device acceptance | `cardio-hospital-3d/AGENTS.md` |

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
11. the experimental-vs-diagnostic boundary for clinical tools;
12. the HospitalSim boundary **canonical clinical state -> visual projection**.

## Testing policy

The owner explicitly prefers **minimum tests for fast iteration**.

- Run only the smallest tests protecting changed behavior.
- Hospital focused code changes: existing `npm run test:engine` + `npm run build` / focused workflows, plus production guard where triggered.
- Hospital visual iteration: do not add broad screenshot/browser matrices by default; use the proof-scene acceptance checks and target-device review.
- Study/Science-style slices: small core invariant set plus one Chromium 390px smoke unless changed risk warrants more.
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

Clinical/runtime architecture remains intentionally stable:

- event-driven canonical simulation;
- synthetic/immutable case facts in source;
- runtime engine owns workflow truth;
- UI/input state remains separate;
- stable patient IDs, typed events, deterministic behavior, versioned persistence;
- no PHI;
- no backend unless demonstrated need.

Hospital dependency resolution is deterministic: `cardio-hospital-3d/package-lock.json` is committed, focused CI and production hospital build use `npm ci`, and Next.js is pinned to security release `16.3.3`.

#### Current executable checkpoint

Hospital graphics executable checkpoint: **`352f290550cb5370dbaf7f3a4bc0ea3fc5be7071`** — PR **#193**, “Start Astra Phase 1 authored HospitalSim visual proof.”

Verification for that exact SHA:

- focused Hospital Production Guard: **passed**;
- unified hospital `npm ci` + engine tests + production build: **passed**;
- Cloudflare Pages exact-SHA deployment: **passed**;
- production verification workflow: **passed**;
- live-runtime smoke: **passed**.

Production status for the executable: **LIVE-VERIFIED; PHYSICAL/VISUAL ACCEPTANCE OPEN**.

Do not confuse automated runtime verification with visual-quality or physical-device acceptance.

#### Physical-device acceptance retained from the pre-graphics baseline

Previously confirmed on the actual iPhone for the earlier accepted interaction baseline:

- movement;
- right-stick look;
- simultaneous move + look;
- clinician briefing interaction;
- consult-case interaction at natural proximity;
- furniture and doorway traversal.

Do not repeat those checks unless the graphics proof produces a reproducible regression.

Still open as product-quality acceptance:

- Pager/Worklist scrolling/dismissal;
- portrait/landscape/safe areas and clinical overlays;
- PWA/Add to Home Screen;
- persistence/reload/no duplicates;
- auscultation audio and ECG touch behavior;
- actor visibility/state transitions;
- replay behavior;
- sustained frame-rate/thermal/battery behavior.

Root `AGENTS.md` currently prioritizes MacBook visual/behavioral acceptance before spending time on remaining physical-iPhone graphics acceptance. Preserve that order unless the owner explicitly redirects it again.

## Hospital visual architecture replacement — Astra source of truth

The owner accepted Astra's 2026-09-04 graphics assessment as the governing visual architecture. The full specification is:

`cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md`

Core decisions:

- keep React Three Fiber, Three.js, current WebGL renderer for the proof scene, Rapier narrowly, and the canonical clinical engine;
- replace procedural visual production with an **authored modular/hybrid hospital**;
- use baked static environmental lighting plus very limited real-time lighting;
- use a small shared metallic/roughness PBR finish vocabulary;
- use reusable room/equipment kits;
- use coherent rigged/lightly animated humans with adult/adolescent proportions authored independently rather than uniform scaling;
- keep detailed visual meshes separate from explicit simple collision proxies;
- project canonical clinical state into visuals; animation must never become a second clinical state machine;
- use minimal focused testing while iterating;
- do not migrate renderers or add another procedural-realism pass before proving the asset strategy.

### Phase status

#### Phase 0 — acceptance baseline

**PARTIALLY COMPLETE / STILL OPEN.**

The key iPhone movement/control/briefing/proximity/traversal failures have been fixed and physically confirmed. The remaining physical checklist above is still open and must not be falsely closed.

The owner explicitly redirected work to Astra graphics on 2026-09-04, so Phase 1 proof implementation has begun without pretending the remaining Phase 0 device checklist is complete.

#### Phase 1 — visual recipe proof

**IMPLEMENTED AND LIVE; VISUAL ACCEPTANCE NOT COMPLETE.**

PR **#193** / `352f2905` introduced the first contained authored-hybrid proof:

- **Clinic Room 1** is the authored comparison room;
- the corridor, team room, and Clinic Room 3 remain legacy visuals as direct controls;
- a deterministic build-time Node compiler generates room/equipment glTF, a lightmap PNG, character glTFs, and provenance;
- generated outputs are gitignored and regenerated before `dev`/`build`; no new runtime dependency or external model license was introduced;
- the proof room has a small PBR material vocabulary and explicit secondary UV/lightmap binding;
- static room illumination uses the proof lightmap path with one bounded local 512px shadowed key for nearby people/material response;
- broad outdoor-like shadow casting was removed from the global hospital lighting baseline;
- detailed room visuals are separate from explicit simple Rapier collision proxies;
- Room 1 patient/family visuals are driven from the canonical hospital store, including confidentiality/completion visibility behavior;
- the adult/adolescent proof characters share a compatible skinned skeleton naming convention and restrained asynchronous seated idle animation;
- the character compiler enforces Astra's initial nearby-character triangle envelope of 12k–25k triangles;
- adult/adolescent proportions are independently authored rather than uniformly scaled.

Important limitations:

- the current generated humans are **architecture-proof characters**, not final production character art;
- the proof skeleton is intentionally minimal and below Astra's nominal richer production bone allocation; expand articulation only if acceptance demonstrates a need;
- the generated lightmap proves the export/secondary-UV/runtime binding path, but is not yet a final artist-authored DCC lighting bake;
- no visual-quality comparison on the target MacBook/iPhone has yet closed Phase 1;
- the required deliberate content-edit/rebuild acceptance test is still open.

#### Phase 2 — complete encounter vertical slice

**NOT STARTED.**

Do not start until Phase 1 is visibly superior, cheap to revise, and comfortable on target hardware.

Required slice: corridor approach + doorway + authored room + patient + parent/family + clinician + UI + canonical state-dependent visibility, while preserving anchors/collision and measuring payload, draw calls, frame pacing, and sustained phone behavior.

#### Phase 3 — reuse proof

**NOT STARTED.** Build a second room from the same kit/material/equipment/animation pipeline only after Phase 2 passes.

#### Phase 4 — progressive replacement

**NOT STARTED.** Replace legacy procedural content room by room; add extra visibility/LOD machinery only when measured growth proves the need.

### Proof-scene acceptance criteria

Before promoting the architecture beyond Phase 1, verify:

- corridor-to-room lighting continuity;
- doorway, collision, and loading boundaries;
- patient/family and later clinician at conversational distance;
- recognizable examination surface and equipment;
- seated/standing and relevant lying-pose quality when those poses become part of the slice;
- clinical UI open/return behavior;
- family removal after confidential state without stale visuals;
- completion/removal without stale visuals;
- one deliberate content edit -> rebuild -> review proving the pipeline is cheap to revise;
- target MacBook visual quality and usability;
- physical-iPhone comfort/frame pacing before expansion.

### Do-not-build guardrails

Do not introduce during the proof:

- another numbered procedural realism pass;
- renderer migration;
- runtime GI, ray tracing, volumetrics, or SSR;
- baseline bloom, DOF, or motion blur;
- fully simulated movable-furniture hospital;
- generic ambient crowd AI;
- full face/cloth/hair simulation or procedural physical-exam system;
- hospital-wide 4K textures or one giant GLB;
- asset CMS, streaming backend, custom scene editor, or universal character framework;
- broad screenshot/browser matrices for each visual iteration;
- decorative physiological displays that could be mistaken for canonical patient data.

## Historical hospital reliability work worth preserving

- PR **#177** / `70b928b2`: deterministic hospital lockfile and `npm ci` path.
- PR **#178** / `37a40f5a`: Next.js security-only `16.3.1 -> 16.3.3` update.
- PR **#180** / `e2e07010`, **#181** / `a378b318`, **#182** / `1e4b7db5`: completed lightweight procedural realism passes. They are historical; do not extend them.
- PR **#183** / `571f53e4`: independent twin-stick movement/look and tighter major-furniture collision.
- PR **#184** / `e25a3bae`: Pager/Worklist scrolling and patient proximity anchors.
- PR **#185** / `96f30289`: NPC interaction availability across consult states.
- PR **#186** / `5a5876a1`: removed misleading decorative clinician.
- PR **#188** / `c72c28b4`: fixed physical-iPhone no-movement spawn/collider failure and added focused guard.
- `6a91917b...`: added Astra visual-architecture source of truth.
- PR **#193** / `352f2905`: first authored-hybrid Room 1 proof, build-time asset pipeline, compatible character family, lightmap path, explicit collision boundary, canonical state projection.

Measured hospital performance history:

- old `/hospital/` cold transfer about 1.204 MB;
- Three/Rapier world was deferred until hospital entry;
- exact production remeasurement after that optimization: 175,879 bytes cold, about 85% lower, warm transfer ~3.1 KB;
- do not add caching/streaming complexity without new measured evidence.

## Study / Math / Science

- StudyHub and Math are active production family-learning products.
- StudyHub issue **#39** has live Supabase control-plane evidence: migration present, RLS enabled, browser roles lack schema/table CRUD, no public RLS policies expose the save table, deployed save function active, and hourly synthetic cloud-save monitoring exists.
- Remaining #39 blockers: explicit inbound abuse/rate-limit control and real-device two-device/offline acceptance. Never expose family tokens.
- Science Lab has progressed through M7. Preserve its intentionally small invariant set + one Chromium 390px phone smoke during focused iteration.

## Clinical / experimental work

- Clinical review/provenance remains governed by `clinical/content-registry.json` and issue **#42**.
- Never infer review dates/sign-off from commits or tests.
- KD/MIS-C remains an experimental evidence workbench. Do not convert observational associations into invented probabilities or an unvalidated diagnostic score.

## Repository / simplification state

2026-09-04 authenticated census:

- 49 repositories total;
- 12 already archived;
- this repository is **PRIMARY**;
- three predecessor hospital repositories are **REFERENCE**;
- one cooking-timer repository is a verified archive candidate; preserve history, do not delete;
- remaining non-archived repositories are retained conservatively as independent unless supersession is proven.

Continuity/simplification already completed:

- canonical `MASTER_PLAN.md` established;
- root `AGENTS.md` points new agents here;
- README reconciled to canonical `/hospital/`;
- `CLAUDE.md` collapsed to stable conventions;
- stale root triage/status docs removed or reduced;
- hospital-local handoff docs converted to durable rules/history rather than competing current state;
- CI reduced to focused product surfaces; completed desktop acceptance is manual-only;
- exact-SHA verification hardened against stale deployment claims.

## Known remaining technical debt / external blockers

- **Hospital visual proof:** Phase 1 is live but visual/device acceptance and deliberate edit/rebuild proof remain open.
- **Hospital physical-device acceptance:** remaining checks listed above still open; do not infer completion.
- **StudyHub #39:** inbound rate limiting + real two-device/offline acceptance.
- **Clinical #42:** real durable review evidence required; never infer/backdate.
- **Cooking-timer archive:** requires a settings-capable interface; preserve history, do not delete.
- one update workflow still embeds a large generator in YAML; move it only if that workflow next needs substantive change, not for aesthetics.

## Production-state language

Keep these distinct:

1. committed;
2. focused/pre-deployment CI passed;
3. Cloudflare deployment succeeded;
4. exact executable SHA is production;
5. required live browser/runtime verification passed;
6. required physical-device/visual acceptance passed.

If exact Cloudflare deployment has not succeeded: **NOT DEPLOYED**.  
If deployed but required browser/runtime verification has not passed: **DEPLOYED BUT NOT LIVE-VERIFIED**.  
If browser/runtime verified but physical/visual acceptance is unfinished: **LIVE-VERIFIED; PHYSICAL/VISUAL ACCEPTANCE OPEN**.  
If verification reproduces a failure: **PRODUCTION BROKEN — FIX IN PROGRESS**.

Never substitute an older successful run for the executable SHA being evaluated.

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
- a hospital renderer migration before the authored-hybrid proof is accepted;
- hospital-wide heavy asset infrastructure before the proof demonstrates value and iPhone viability;
- directory churn with no measurable maintenance/runtime benefit.

## Exact next action

1. Treat **`352f290550cb5370dbaf7f3a4bc0ea3fc5be7071`** as the current HospitalSim graphics executable checkpoint. Its focused build/guard, exact Cloudflare deployment, production verification, and live-runtime smoke are green.
2. Inspect the live Phase 1 proof on the **target MacBook first**. Compare authored Clinic Room 1 directly with the retained legacy corridor/Room 3 control. Judge lighting continuity, material response, room proportions, recognizable equipment, character silhouette/proportion, doorway view, visual hierarchy, and whether the authored room is actually better rather than merely different.
3. Fix only reproduced proof-scene defects. Do **not** broaden into hospital-wide replacement yet.
4. Perform Astra's deliberate edit/rebuild test using `npm run visual:build` (for example a chair/equipment placement or finish change) and confirm the edit does not require collision or clinical-state changes unless traversal/interaction intentionally changes.
5. Recheck the proof on the physical iPhone for comfortable movement/frame pacing/thermal behavior and regressions in the already-passed interaction baseline. Continue the remaining older physical checklist separately; do not falsely mark it complete.
6. Close Phase 1 only when the room is visibly superior, cheap to revise, and comfortable on target hardware.
7. Only then begin Phase 2: one complete outpatient encounter vertical slice including corridor approach, doorway, patient, family, clinician, UI, and canonical state-dependent visibility, with measured payload/draw-call/frame-pacing behavior.
8. StudyHub #39, clinical #42, and archive work remain separate unresolved tracks.

## Definition of done

Done means canonical ownership is obvious; superseded repositories are archived rather than deleted; docs do not compete; ordinary changes have a small fast test path; CI/build complexity stays low without weakening real gates; production builds are deterministic; key routes have measured baselines; abstractions reduce rather than add complexity; new agents can resume from this file; and HospitalSim expands the Astra authored-hybrid architecture only after proof-scene quality, editability, target-device comfort, and clinical-state fidelity are demonstrated.

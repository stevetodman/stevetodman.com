# stevetodman.com — Canonical Master Plan

Status: **ACTIVE — SIMPLIFY, SPEED UP, PROFESSIONALIZE, REDUCE DEBT**  
Owner: Steve Todman  
Canonical repository: `stevetodman/stevetodman.com`  
Production branch: `main`  
Production site: `https://stevetodman.com`  
Updated: 2026-09-04  
Main SHA when this plan was written: `e5934d976c3ef86557bc72d8513eb9c547a5b0d6`

---

## 0. NEW WINDOW / NEW AGENT: RESUME HERE

**This file is the canonical cross-window handoff.**

If a ChatGPT/Claude/Codex/Copilot/other agent opens this repository with no chat history:

1. Read **this entire file first**.
2. Read root `AGENTS.md` for deployment-verification invariants.
3. Inspect current `main`, active PRs/issues, and recent commits before changing anything.
4. Treat this file as the durable statement of Steve's goals and architecture unless a newer explicit owner instruction supersedes it.
5. **Do not ask Steve to restate the project history.** Reconstruct the current executable state from GitHub and continue from the first incomplete item in **Section 11 — Execution Queue**.
6. If repository state has advanced beyond the SHA above, preserve newer completed work and update this plan rather than reverting to this historical SHA.
7. After each meaningful work package, update the relevant checklist/status in this file so the next window can continue without chat history.

### Required end-of-session handoff

Before stopping because of credits, context limits, interruption, or agent switching:

- commit or clearly checkpoint all safe completed work;
- update **Section 2 — Current Known State** if project state changed materially;
- update **Section 11 — Execution Queue** so the first unchecked item is the exact next action;
- record any blocker that requires Steve or external evidence;
- never leave the next agent dependent on a chat transcript.

**The repository, not chat memory, is the source of continuity.**

---

## 1. MISSION

Steve's goal is not merely to "clean up GitHub." The target is a system that is simultaneously:

- **fast for users** — especially iPhone/mobile;
- **fast to develop and deploy**;
- **professional and easy to understand**;
- **low technical debt**;
- **easy for AI agents to modify safely**;
- **clinically safe where clinical content is involved**;
- **minimal in architecture, dependencies, CI, documentation, and sources of truth**.

The governing philosophy is:

> **Make the important path embarrassingly obvious. Delete before refactoring. Simplify before optimizing. Optimize measured bottlenecks. Automate last.**

The desired mental model is:

```text
CATALOG
  ↓
SOURCE
  ↓
FOCUSED TEST
  ↓
BUILD
  ↓
DEPLOY EXACT SHA
  ↓
LIVE VERIFY
```

Do not build a sophisticated "platform" merely to manage the complexity of the existing platform.

---

## 2. CURRENT KNOWN STATE

### 2.1 Canonical website repository

`stevetodman/stevetodman.com` is the primary website repository and should remain the canonical home for surfaces that are actually part of `stevetodman.com`.

Current deployment model:

- Cloudflare Pages publishes generated `dist/`.
- The repository root is **not** the deployment artifact.
- `site/catalog.json` is the canonical route/deployment classification source.
- Catalog classes are `PRODUCTION`, `PREVIEW`, `INTERNAL`, `SOURCE_ONLY`, and `ARCHIVED`.
- Only `PRODUCTION` routes belong in the public Pages artifact.
- The site intentionally remains direct-link accessible but globally `noindex` until Steve explicitly changes that policy.
- No sitemap should be published while that policy remains active.

### 2.2 Canonical route registry

`site/catalog.json` already contains the essential control-plane metadata:

- stable ID;
- title;
- route/path;
- deployment class;
- audience;
- category;
- discoverability where needed;
- generated/source-only flags where needed.

**Do not create `academy-manifest.json`, `module-manifest.json`, or another independent route registry unless the current catalog is proven inadequate.** Prefer extending/deriving from the existing catalog over creating a third source of truth.

### 2.3 Hospital simulator

Canonical current hospital implementation:

- repository: `stevetodman/stevetodman.com`;
- source: `cardio-hospital-3d/`;
- production route: `/hospital/`;
- legacy `/phs/`: archived/reference;
- legacy `/cardiohospital/`: internal/reference;
- `stevetodman/pediatric-hospital-world`: secondary/reference only.

`cardio-hospital-3d/PRIMARY_PROJECT.md` contains the hospital-specific checkpoint. The unified app is a static Next export with `basePath: /hospital`.

Known remaining hospital product gate from the project handoff: physical-iPhone acceptance for the implemented mobile/PWA and second-consult/workload work. Do not redo completed desktop acceptance unless a later shared-code change or reproduced mobile regression requires it.

### 2.4 Study / Math / Science

StudyHub and Math are active production family-learning products inside this repository.

StudyHub still has an external/live acceptance gate tracked by issue **#39**. Repository implementation is not sufficient evidence for live Supabase/device completion.

Science Lab work has progressed through the M7 expansion sequence; a recent merged checkpoint is:

- `e8e64c5117dcfceb2454c1a5c37bc512baee31bf` — **Science Lab M7: expand Engineering Design**.

Preserve the intentionally minimal Science Lab CI approach used during iteration: focused invariants plus one Chromium phone smoke rather than a broad browser matrix unless a change justifies more.

### 2.5 Clinical governance

Clinical content review/provenance remains a hard safety boundary.

- `clinical/content-registry.json` is canonical for documented clinical-review lifecycle metadata.
- Never invent review dates, sign-off, or evidence.
- Passing software tests are not clinical sign-off.
- Issue **#42** tracks clinical modules that still require durable evidence-backed review records.

### 2.6 KD / MIS-C experimental workbench

This is a current experimental clinician/owner-facing evidence project. Preserve its safety boundary during repository cleanup.

Recent checkpoints on `main`:

- `ec246807f4b84943651c66be05c3944d8547cb62` — initial experimental iKD vs non-severe MIS-C evidence workbench;
- `9faff16e0a3495e8994525de54145650efb97859` — M1A source lock;
- `cdc93db5606c1453b9b4d4695d4c16bae215a9f5` — M1B acquisition gate;
- `f75fad2b916eb411452affb56de19c59c31cbbad` — M2 KIDMATCH authenticity gate;
- `5ec51e8552adcfe1f3367543fd895c4ff4237f1a` — M3 retrospective shadow-evaluation scaffold, prepared but not activated;
- `45197904eb20a4993d0b4e32094eceb30ebe87b8` — 2026 target study source lock;
- `e5934d976c3ef86557bc72d8513eb9c547a5b0d6` — M1B supplement source-lock complete.

Do not convert observational group associations into an invented score/probability. M2 model integration remains blocked until an authoritative deployable KIDMATCH artifact is authenticated with the required implementation details. M3 remains governed/de-identified shadow evaluation, not live clinical inference.

### 2.7 Existing external gates that must survive simplification

**Issue #39 — StudyHub live cloud-save acceptance**

Requires live backend and real-device evidence; do not mark complete from source/tests alone.

**Issue #42 — evidence-backed clinical review metadata**

Do not backfill dates from commits or passing tests.

These gates are independent of the technical-debt program. Cleanup must not make them disappear or falsely close them.

---

## 3. HARD CONSTRAINTS — DO NOT BREAK THESE TO SIMPLIFY

Simplification is subordinate to these invariants:

1. **Clinical accuracy and review provenance.**
2. **Privacy and no-PHI boundaries.**
3. **Production-only deployment boundary.**
4. **Direct-link-only / noindex policy until Steve explicitly changes it.**
5. **Exact-SHA production verification.**
6. **Asset provenance where required.**
7. **Accessibility baseline.**
8. **Critical behavioral regression protection.**
9. **Current working URLs unless deliberately migrated.**
10. **StudyHub family-token privacy/security semantics.**
11. **Experimental clinical tools must not silently become diagnostic decision engines.**

Do not "simplify" by removing the only protection for a real high-consequence failure mode.

---

## 4. ENGINEERING PRINCIPLES

### 4.1 Delete before refactor

Before adding a file, dependency, workflow, registry, abstraction, helper, or test suite, first determine whether an existing one can be deleted or simplified instead.

### 4.2 One owner for each fact

Target canonical ownership:

| Fact / responsibility | Canonical owner |
| --- | --- |
| Website/product repository | `stevetodman/stevetodman.com` |
| Production branch | `main` |
| Route/deployment classification | `site/catalog.json` |
| Clinical review lifecycle | `clinical/content-registry.json` |
| Unified hospital source | `cardio-hospital-3d/` |
| Production artifact | `dist/` |
| Deployment | Cloudflare Pages |
| Cross-window program state | `MASTER_PLAN.md` |
| Root agent invariants | `AGENTS.md` |

Human docs may explain these facts but should not maintain competing copies of dynamic state.

### 4.3 Keep specialized systems specialized

Do not force Hospital, StudyHub, Math, academies, and clinical workbenches into one universal application framework merely because they share superficial UI patterns.

Extract shared code only when:

- multiple real consumers exist;
- duplication is causing actual maintenance cost or defects;
- the shared abstraction is simpler than the duplicated implementations.

### 4.4 No abstraction before demonstrated duplication

A practical default: do not create a new shared abstraction merely because two implementations look similar. Prefer waiting until repeated coordination becomes painful and the contract is clear.

### 4.5 Measure performance, then optimize

Do not reorganize code or adopt a framework in the name of speed without measuring the actual bottleneck.

### 4.6 Automation comes last

Do not automate a process that should have been deleted or simplified first.

### 4.7 Optimize total complexity, not line count

The best solution is the one with the lowest combined burden across:

- user runtime;
- build/deploy time;
- CI time;
- cognitive load;
- documentation;
- operational failure modes;
- clinical/privacy risk.

---

## 5. KNOWN TECHNICAL-DEBT FINDINGS

These findings were directly identified before this plan was written and should be treated as real candidates, not speculation.

### 5.1 Test-command proliferation

Root `package.json` contains many explicit application/test-file lists (`test:math`, `test:study`, per-academy commands, smoke, platform, etc.). Focused product commands are useful, but long manually synchronized filename lists create change amplification.

**Goal:** retain a small human-facing command surface while deriving/discovering membership where simple conventions can do so.

### 5.2 CI/workflow proliferation

`.github/workflows/` has accumulated many narrow workflows in addition to a large general `tests.yml` matrix. `tests.yml` also contains a long duplicated `push`/`pull_request` path-filter list.

**Goal:** fewer conceptual gates and less YAML, while preserving genuinely distinct trigger/environment requirements.

Preferred conceptual model:

```text
FAST       affected unit/contracts
PRODUCT    affected product smoke
PRODUCTION exact deployed-SHA verification
```

Do not target an arbitrary workflow count; delete only after understanding trigger/environment differences.

### 5.3 Build and validation are mixed

`scripts/build-hospital.mjs` currently performs:

1. `npm install` inside `cardio-hospital-3d`;
2. `npm run test:engine`;
3. `npm run build`;
4. copy/export into `dist/hospital`.

This makes production building slower and conflates dependency installation, validation, compilation, and packaging.

**Target:** tests happen in CI; build scripts build/package. Use deterministic dependency installation rather than fresh product-local install side effects during the build path.

### 5.4 Site build uses broad copy then prune

`scripts/build-site.mjs` derives route roots from the catalog, copies entire roots, then removes non-production/source-only artifacts.

This is currently safe, but review whether direct positive inclusion can become simpler and faster **without weakening the production boundary**. Do not rewrite merely for aesthetic purity.

### 5.5 Runtime performance is under-measured

Current performance protection is mostly per-file budgets (`site/performance-budgets.json`). Those budgets explicitly are not Core Web Vitals or end-user performance measurements.

**Missing:** small production measurements for cold/warm load, transferred bytes, startup/usable time, console errors, and important mobile behavior.

### 5.6 Study caching is intentionally conservative but may now be over-broad

`_headers` currently applies:

```text
/study/*
  Cache-Control: no-cache, max-age=0, must-revalidate
```

The Study build also versions important release assets.

**Candidate improvement:** keep HTML/release entry points revalidated while allowing truly content-addressed/versioned static assets to use long-lived immutable caching. Prove that stale-release protections remain intact before changing this.

Apply the same principle to `/hospital/_next/static/` where appropriate.

### 5.7 Documentation drift exists

Example: root README historically described `/phs/` as the Pediatric Hospital Simulator while the catalog now correctly identifies `/hospital/` as production and `/phs/` as archived.

There are also multiple overlapping documents across root and product directories (`MASTER_PLAN`, `CLAUDE`, `AGENTS`, `PRIMARY_PROJECT`, `PROJECT-RULES`, implementation-status/handoff docs).

**Goal:** each document gets one clear job. Remove stale dynamic state from prose when the repository already has a canonical machine source.

### 5.8 GitHub account/repository sprawl

Steve has many repositories from experiments, prototypes, prior educational apps, and independent projects. Some are already archived; many remain active.

Known examples where duplication/reference status matters:

- `stevetodman/stevetodman.com` — **PRIMARY** for the website;
- `stevetodman/pediatric-hospital-world` — **REFERENCE/SECONDARY** because the unified hospital is canonical in `stevetodman.com`;
- `stevetodman/cooking-timers` — review as a likely superseded standalone copy because cooking timers are now production routes inside `stevetodman.com`;
- already archived repositories should generally remain archived unless there is a demonstrated reason to reactivate them.

Do not mass-delete repositories. Perform a deliberate census and archive uncertain/superseded projects first.

---

## 6. TARGET END STATE

The target is **not** a mandatory directory rewrite. It is the conceptual architecture below:

```text
stevetodman.com/
├── README.md           # what this is / how to run
├── AGENTS.md           # durable agent invariants + points here
├── MASTER_PLAN.md      # cross-window program state
├── package.json        # small human-facing command surface
│
├── site/               # catalog + global platform/build concerns
├── cardio-hospital-3d/ # unified hospital app (rename/move only if real value)
├── study/              # family learning
├── math/               # Math Mission
├── education/ or existing academy roots
├── tools/
├── cooking/
├── clinical/
├── tests/
├── scripts/
└── dev/                # experiments/benchmarks/one-offs only if useful
```

**Do not churn directories solely to make the tree look cleaner.** Move/rename only when it reduces real maintenance cost.

Desired properties:

- one canonical repo for the website;
- one canonical route catalog;
- one obvious production build;
- one obvious deployment path;
- a small number of human-facing test commands;
- minimal overlapping docs;
- specialized products remain locally understandable;
- fast mobile/static delivery;
- exact-SHA live verification;
- very little architecture left to explain.

---

## 7. TESTING POLICY — MINIMUM TESTS BY DEFAULT

Steve has explicitly requested **minimum testing so iteration remains fast**.

### Default during focused implementation

Run the smallest test set that directly protects the changed behavior.

For Study/Science-style slices, the preferred pattern is roughly:

- the small core invariant set (often ~4 focused tests), plus
- **one Chromium 390px phone smoke**.

Do not automatically add:

- WebKit matrices;
- screenshot/artifact suites;
- full StudyHub suites;
- unrelated product suites;
- broad browser matrices;

unless the change touches those risks or a reproduced failure justifies them.

### Before merge/deploy

Preserve the repository's hard cross-cutting invariants relevant to the change, especially:

- production boundary;
- clinical/privacy/provenance rules;
- focused product behavior;
- one realistic browser/mobile smoke where appropriate.

### After deployment

Exact-SHA production verification remains mandatory where the current workflow requires it. Never substitute an older successful deployment run.

---

## 8. PERFORMANCE PROGRAM

Treat three forms of speed separately.

### 8.1 User/runtime speed

Priority surfaces:

- `/`;
- `/education/`;
- `/hospital/`;
- `/study/`;
- `/math/`.

Create/retain **one small benchmark command**, not a large observability platform.

Candidate measurements:

- HTML transferred;
- JS transferred;
- largest asset;
- cold load / usable time;
- warm/repeat load;
- console errors;
- 390px mobile behavior.

Hospital-specific:

- time to usable clinical world;
- frame/jank behavior during movement;
- memory/thermal behavior on physical iPhone when practical.

Do not optimize every route. Fix the largest measured bottleneck first.

### 8.2 Build/CI speed

Track at least approximately:

- fast test duration;
- product smoke duration;
- build duration;
- merge-to-live duration.

Question any step that materially slows the critical path.

### 8.3 Engineering/cognitive speed

A new agent should be able to answer in minutes:

- What is canonical?
- Where do I edit it?
- What is the smallest relevant test?
- How is it built?
- How is production verified?
- What is the exact next task?

This file exists partly to enforce that property.

---

## 9. REPOSITORY-CENSUS DECISION MODEL

Every GitHub repository Steve owns should eventually be assigned one of these statuses:

1. **PRIMARY** — canonical active implementation for a major current product.
2. **INDEPENDENT** — legitimately separate lifecycle/deployment/product.
3. **REFERENCE** — retained for history/assets/migration reference; not active target.
4. **ARCHIVE** — superseded/abandoned/experiment; GitHub archived.

### Archive criteria

Strong archive candidates are repos that:

- have a canonical replacement;
- duplicate a surface now maintained elsewhere;
- are old experiments/prototypes;
- no longer deploy anything intentionally used;
- create agent confusion about where new work belongs.

### Keep-separate criteria

A repository can remain independent when it has materially different:

- deployment/security boundary;
- dependency/runtime requirements;
- release cadence;
- product identity;
- ownership;
- reuse value outside the website.

Do not merge repos merely because they are small. Do not split apps merely because they are large.

### Safety before archive

Before archiving a repository:

- identify whether it owns any unique live deployment;
- confirm whether unique source/assets exist only there;
- note the canonical replacement;
- preserve any migration/reference link needed by the main repo.

Archive first; destructive deletion is unnecessary for cleanup.

---

## 10. WHAT NOT TO BUILD

Unless future evidence changes the decision, **do not introduce**:

- a universal academy engine as the first refactor;
- a universal simulator engine;
- a universal learner-state engine joining StudyHub and resident education;
- another module/route manifest beside `site/catalog.json`;
- microservices for a static personal site;
- monorepo tooling solely to reorganize folders;
- an internal developer portal to manage the website;
- a new test framework to manage existing test frameworks;
- a large performance/analytics platform before basic benchmarks exist;
- CI automation for processes that can simply be removed;
- directory churn with no measurable maintenance/runtime benefit.

The burden of proof is on adding complexity.

---

## 11. EXECUTION QUEUE — EXACT ORDER

This is the current program. **A new agent should continue from the first unchecked item unless newer owner instructions explicitly change priority.**

### Phase A — Freeze continuity and establish the baseline

- [x] Make this `MASTER_PLAN.md` the canonical cross-window program/handoff document.
- [ ] Update root `AGENTS.md` so every agent is explicitly directed here while preserving deployment-verification invariants.
- [ ] Reconcile root `README.md` with current canonical routes (`/hospital/` vs archived `/phs/`) and remove stale dynamic status from it.
- [ ] Confirm `site/catalog.json` remains sufficient as the single route/deployment registry; **do not add another manifest**.

**Exit:** a fresh agent can understand the canonical system from `README.md` + `AGENTS.md` + this file without chat history.

### Phase B — GitHub repository census and archive pass

- [ ] Inventory all Steve-owned repositories with current archived/public/private status.
- [ ] Assign `PRIMARY / INDEPENDENT / REFERENCE / ARCHIVE`.
- [ ] Identify obvious duplicate/superseded repos first (including hospital prototypes and standalone copies now canonical in the main site).
- [ ] Archive only after confirming no unique live deployment/source is being lost.
- [ ] Do not delete repositories.
- [ ] Record the final decisions in **Section 12 — Repository Census** below, not a new document unless the table becomes unmanageably large.

**Exit:** agents no longer have to guess which repo is canonical.

### Phase C — Dead/stale machinery deletion inside `stevetodman.com`

- [ ] Audit stale source copies, obsolete scripts, abandoned experiments, obsolete workflows, old handoff docs, and redundant test commands.
- [ ] Delete/retire only items with a demonstrated canonical replacement or no current function.
- [ ] Move useful one-off experiments to a clearly non-mainline `dev/` area only if keeping them has value; otherwise remove them.
- [ ] Preserve clinical/source provenance and required historical evidence.

**Exit:** less active surface area before any architectural refactor.

### Phase D — Documentation collapse

- [ ] Give root `README.md`, root `AGENTS.md`, and `MASTER_PLAN.md` non-overlapping jobs.
- [ ] Review `CLAUDE.md`, product `PRIMARY_PROJECT.md`, `PROJECT-RULES.md`, implementation-status/handoff docs, and stale review files.
- [ ] Delete or collapse overlapping status prose once durable information has been preserved in the correct canonical source.
- [ ] Product-specific documents may remain when they contain real local acceptance criteria that would make the root plan noisy.

**Exit:** no contradictory dynamic project state across multiple docs.

### Phase E — CI/test simplification

- [ ] Inventory current workflows and triggers; identify genuinely distinct environments/triggers.
- [ ] Remove obsolete/redundant workflows before attempting clever consolidation.
- [ ] Simplify duplicated path filters.
- [ ] Reduce the human-facing root test interface toward a small set such as:
  - `npm test` — fast default;
  - `npm run test:study`;
  - `npm run test:math`;
  - `npm run test:hospital`;
  - `npm run test:clinical`;
  - `npm run test:full` only if a true full suite remains useful.
- [ ] Preserve product-specific commands only where they materially improve focused development.
- [ ] Keep minimum-test iteration as the default.

**Exit:** an ordinary change has an obvious fast validation path and CI YAML is materially smaller/easier to reason about.

### Phase F — Pure deterministic build

- [ ] Separate validation from production building.
- [ ] Remove `npm install` and `test:engine` side effects from `scripts/build-hospital.mjs` once equivalent focused CI protection is confirmed.
- [ ] Use deterministic dependency installation in the correct pipeline stage.
- [ ] Keep `npm run build` as the obvious production build entry point.
- [ ] Review copy-then-prune behavior in `build-site.mjs`; change only if a simpler positive-inclusion design preserves all production-boundary tests.

**Exit:** builds build; tests test; deployment packages the deterministic output.

### Phase G — Runtime performance and caching

- [ ] Establish a tiny benchmark for `/`, `/education/`, `/hospital/`, `/study/`, `/math/`.
- [ ] Capture baseline cold/warm load and transferred assets before optimization.
- [ ] Review `/study/*` no-cache policy against already-versioned release assets.
- [ ] Allow long-lived immutable caching only for assets whose URL/version semantics make staleness impossible under the current release contract.
- [ ] Review `/hospital/_next/static/` caching similarly.
- [ ] Optimize the largest measured bottleneck first.
- [ ] Re-measure after each change; revert complexity that does not produce meaningful benefit.

**Exit:** user-facing performance improvements are evidence-based, not architectural guesswork.

### Phase H — Shared-code extraction only if justified

- [ ] Measure actual repeated coordination after deletion/simplification.
- [ ] Consider shared site shell/test helpers/reference rendering/quiz primitives only when multiple active consumers demonstrably benefit.
- [ ] Keep academies and applications specialized where their behavior is meaningfully different.

**Exit:** any abstraction introduced removes more complexity than it adds.

### Phase I — Stop

- [ ] When the critical path is simple, fast, measured, and understandable, **stop refactoring**.

Do not create perpetual platform work.

---

## 12. REPOSITORY CENSUS

This table is intentionally incomplete until Phase B verifies each repository.

| Repository | Current decision | Notes |
| --- | --- | --- |
| `stevetodman/stevetodman.com` | **PRIMARY** | Canonical website and unified hospital deployment source |
| `stevetodman/pediatric-hospital-world` | **REFERENCE** | Explicitly secondary to `cardio-hospital-3d/` for current hospital work |
| `stevetodman/cooking-timers` | **REVIEW → likely ARCHIVE** | Cooking timers now live inside main website; verify no unique desired source/deployment |
| already GitHub-archived repos | **ARCHIVE** | Keep archived unless a real reason to reactivate appears |

Add verified decisions here during the census. Do not infer status from repository name alone.

---

## 13. CURRENT EXTERNAL/OWNER BLOCKERS

### #39 StudyHub live acceptance

Repository code cannot prove completion. Requires live Supabase/edge and real-device acceptance evidence.

Do not expose family tokens in public logs/issues.

### #42 clinical review evidence

Requires real durable clinical-review evidence. Do not infer dates from commits or tests.

### Physical-iPhone hospital acceptance

Hospital-specific project docs record this as a remaining product-quality gate. Do not substitute desktop/browser emulation for a physical-device gate if the project acceptance criteria explicitly require a physical device.

These blockers should not prevent safe repository simplification work that does not claim to close them.

---

## 14. PRODUCTION / DEPLOYMENT INVARIANTS

Never use **live** as a synonym for committed, CI-passed, or deployed.

Keep these states distinct:

1. committed;
2. pre-deployment CI passed;
3. Cloudflare Pages deployment succeeded;
4. exact current `main` SHA is the production deployment;
5. public custom-domain pages were independently browser-verified where required.

For Study production changes, preserve the established exact-SHA deployment and touch-browser verification contract in root `AGENTS.md`.

If Cloudflare deployment for the exact SHA has not succeeded: **NOT DEPLOYED**.  
If deployed but required browser verification has not run: **DEPLOYED BUT NOT LIVE-VERIFIED**.  
If browser verification reproduces a failure: **PRODUCTION BROKEN — FIX IN PROGRESS**.

Do not change DNS/TLS/caching/build infrastructure reflexively. First reproduce the production problem and change the smallest thing that fixes it.

---

## 15. STOP / REVERSE CONDITIONS

Pause or reverse a simplification if it:

- weakens clinical review/provenance;
- exposes nonproduction/internal/source-only content;
- breaks exact-SHA verification;
- makes StudyHub token/security behavior weaker;
- creates a second source of truth;
- increases mandatory tests for ordinary changes without a proven risk benefit;
- makes product-specific logic harder to understand;
- introduces a framework/dependency with no measured benefit;
- degrades measured runtime performance;
- changes established URLs without a deliberate migration;
- makes the next agent more dependent on chat history rather than repository state.

---

## 16. DEFINITION OF DONE

This technical-debt/simplification program is done when:

1. `stevetodman.com` is unequivocally canonical for website-hosted products;
2. other GitHub repositories are clearly classified and obvious superseded ones are archived;
3. `site/catalog.json` remains the single route/deployment source of truth;
4. documentation has clear, non-overlapping ownership and no known stale route/project-state contradictions;
5. ordinary development uses a very small, fast test path;
6. CI/workflow count and YAML complexity are materially lower without weakening important gates;
7. production builds are deterministic and do not secretly run product tests/install side effects;
8. key site surfaces have simple real-world performance baselines;
9. immutable/versioned static assets are cached efficiently without stale-release regressions;
10. measured user/build/CI performance is improved;
11. shared abstractions exist only where they demonstrably reduce total complexity;
12. a new agent can open the repository, read this file, and continue without Steve re-explaining the project;
13. the team stops refactoring once these conditions are met.

---

## 17. OWNER PREFERENCES TO PRESERVE

- Prefer **minimum tests** for rapid iteration; expand only when risk/reproduced failures justify it.
- Do not redo completed work by default.
- Fix only reproduced regressions when validating production/mobile behavior.
- Prefer small safe diffs and frequent checkpoints over giant rewrites.
- Preserve working educational value and clinical correctness while simplifying infrastructure.
- When uncertain between adding machinery and deleting machinery, investigate deletion first.
- A professional system here means **clear, fast, reliable, measurable, and boring**, not maximally abstract.

---

## 18. EXACT NEXT ACTION

After this plan lands, the next agent should:

1. update root `AGENTS.md` to point here while preserving its exact-SHA deployment rules;
2. reconcile root `README.md` with the current catalog, especially `/hospital/` vs archived `/phs/`;
3. then begin **Phase B — GitHub repository census** before any large refactor.

Do **not** start by building a universal academy engine, new manifest system, or CI abstraction layer.

---
status: active
next: Human walk of package Mac-Development-20260815T182240Z (commit 7d640d7). Auscultation is audible. Step 5 still needs a MetaHuman Patel; none exists on this machine.
---

# CLAUDE.md

This is Steve Todman's personal website deployed via Cloudflare Pages.

## Project Structure

```
stevetodman.com/
├── index.html                    # Homepage
├── admin/                        # Password-protected via Cloudflare Access
│   ├── index.html                # Admin landing page
│   └── clinic-resources/
│       ├── index.html            # Clinic resources listing
│       └── files/
│           ├── peds-htn-intake-v4.pdf
│           ├── bp-family-handout.docx
│           ├── peds-dyslipidemia-intake-v3.pdf
│           └── peds-syncope-intake-v2.pdf
├── phs/                          # Pediatric Hospital Simulator (stevetodman.com/phs)
│   ├── index.html                # Canonical hosted entrypoint (loads v17/ only)
│   ├── README.md
│   └── v17/                      # Current declarative educational platform
│       ├── cases/                # Objective-linked manifest + patient case files
│       ├── tests/integrity.mjs   # Dependency and cross-reference audit (runs in CI)
│       └── schema.json           # Assembled-case authoring schema
├── math/                         # Math Lab: Fractions (stevetodman.com/math)
│   ├── index.html
│   └── assets/                   # app.js, styles.css, favicon.svg
├── newbornscreen/                # Interactive 2025 AAP CCHD screening module
│   └── index.html                # Resident teaching, algorithm, and 17-question quiz
├── hypertension/                 # Pediatric hypertension and ABPM resident academy
│   ├── index.html                # Layered lesson, office pathway, ABPM lab, cases, quiz
│   └── assets/                   # Local styles and interaction logic
├── cardiovascular-risk/          # Cardiovascular prevention and dyslipidemia academy
│   └── index.html                # Age rail, lipid tools, current overlays, reference tables, cases
├── aortopathy/                   # Pediatric aortopathy resident academy
│   ├── index.html                # Layered lesson, pathways, condition atlas, cases, pre/post testing
│   └── assets/                   # Local styles and interaction logic
├── genetics-chd/                 # Genetics of congenital heart disease resident academy
│   ├── index.html                # Action pathway, pattern atlas, genomic workbench, cases, assessment, quick reference
│   └── assets/                   # Local styles and interaction logic
├── myocarditis/                  # Pediatric myocarditis resident academy
│   ├── index.html                # Recognition, diagnosis, stabilization, treatment, cases, assessment
│   └── assets/                   # Local styles and interaction logic
├── pals/                         # 2025 PALS resident mastery lab
│   └── index.html                # 10 high-acuity cases, 64 questions, explanations, analytics
├── pedcardsurg/                  # CHD surgical atlas and resident visual education module
│   ├── index.html                # Primary atlas, PTED library, eponyms, assessment
│   └── assets/chd-atlas/         # Nine supplied full-resolution PNGs plus web-optimized WebP versions
├── cardiohospital/               # Cardio Hospital browser preview (stevetodman.com/cardiohospital)
│   ├── index.html                # Walkable blockout, HCM encounter, auscultation, 12-lead ECG
│   ├── app.js                    # Deterministic encounter, scoring, localStorage attempts
│   └── murmur-audio.js           # Web Audio HCM murmur synthesis with Valsalva response
├── cardio-hospital-3d/           # Next.js + React Three Fiber preview (not deployed)
├── cardiohospital-unreal/        # Unreal Engine 5.8 production client (not deployed)
│   ├── Docs/                     # ADR-0001 (UE rebaseline), ADR-0002 (macOS release target)
│   ├── LegacyCore/plan.md        # Authoritative 168-section spec, pinned by blob hash
│   ├── Scripts/                  # macOS shell release workflow; PowerShell retained as history
│   ├── Source/CardioHospital/    # C++ subsystems: clinical data, case runtime, education, learner
│   ├── Tests/                    # Portable deterministic suite + release-script fixtures
│   └── SPEC_TRACEABILITY.md      # One classified row per spec section, enforced in CI
├── clipboard-sanitizer/          # Standalone shell utilities (not deployed)
├── .github/workflows/            # phs-v17-integrity.yml, update-cooking-index.yml, cardiohospital-unreal.yml
├── study/                        # Kids' Study Hub (stevetodman.com/study)
│   ├── index.html                # Study Hub landing page
│   ├── greek-vocab-quiz.html     # Ancient Greece vocabulary + chapter review
│   ├── fract-vocab-quiz.html     # Root words: fract, frag, frail
│   ├── topic-e-quiz.html         # Eureka Math G4M5 Topic E fractions quiz
│   ├── math-facts.html           # Multiplication speed drill
│   └── 100-fact-club.html        # 100 Fact Club sprint training + challenge
├── cooking/
│   ├── index.html                # Cooking timers listing
│   ├── ahi-tuna-timer.html
│   ├── ribeye-timer.html
│   └── ribs-timer.html
└── tools/
    ├── index.html                # Tools listing
    ├── bp-percentile-calculator.html # AAP pediatric BP calculator + interactive curves
    ├── bp-growth-lms.js          # Official monthly CDC length/stature LMS values
    └── bp-calculator-validation.html # Public validation and known-limits report
```

## Adding a New Cooking Timer

When asked to create a cooking timer:

1. **Extract from recipe**: steps, times, ingredients, equipment, doneness cues
2. **Create timer HTML** in cooking/[recipe-name]-timer.html
3. **Update** cooking/index.html to include the new timer card
4. **Do NOT** include any Claude/AI credits in the files

### Timer Features to Include

- Audio alerts (Web Audio API triple beep)
- Wake lock support
- Browser notifications
- localStorage persistence
- Progress bar
- Elapsed/remaining time display
- Estimated finish time
- Manual step completion checkboxes
- Phase tags (Prep/Cook/Finish)
- Doneness cues where applicable
- Print-friendly CSS
- Mobile responsive
- Safety warnings for high-heat recipes
- **Pause/Resume** functionality
- **Go Back** button to return to previous step
- **Skip to Next** button
- **Time adjustment** buttons (-30s/+30s or -1m/+1m for longer recipes)
- **Step remaining time** countdown display
- **Step progress bar** within current step
- **Step durations** shown in timeline

### Timer HTML Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>[Recipe] Timer</title>
  <!-- Dark theme, mobile-first CSS -->
</head>
<body>
  <!-- Recipe title and credit -->
  <!-- Progress bar -->
  <!-- Start button / Timer display -->
  <!-- Current step section with remaining time -->
  <!-- Step controls (Back, Pause, Time adjust, Skip) -->
  <!-- Upcoming steps -->
  <!-- Equipment section -->
  <!-- Ingredients section -->
  <!-- Full timeline with checkboxes and durations -->
</body>
</html>
```

### Timer Card Format (for cooking/index.html)

```html
<a href="[recipe]-timer.html" class="timer-card">
  <div class="timer-title">[emoji] [Recipe Name]</div>
  <div class="timer-meta">[Source] • [Show/Book]</div>
  <span class="timer-time">~[duration]</span>
</a>
```

## Adding Clinic Resources

Clinic intake forms and patient education materials go in `/admin/clinic-resources/`:

1. **Add PDF/DOCX** to `admin/clinic-resources/files/`
2. **Update** `admin/clinic-resources/index.html` with new resource card
3. Group by condition (Hypertension, Dyslipidemia, Syncope, etc.)

### Resource Card Format

```html
<h2>[Condition]</h2>

<div class="resource-card">
    <h3>[emoji] [Form Name] <span class="badge">v[X.X]</span></h3>
    <p>[Brief description of form contents]</p>
    <a href="files/[filename].pdf" class="download-btn" download>
        <svg>...</svg>
        Download PDF
    </a>
    <div class="file-info">PDF • [X] pages • Print double-sided</div>
</div>
```

## Adding a Study Tool (study/)

Kids' study tools for 4th grade — vocab quizzes, math quizzes, and drills. Live at stevetodman.com/study, linked from the homepage.

### Design patterns

- Single-file HTML, no build step, no external dependencies
- Light theme: `#f0f4f8` background, white cards with `border-radius: 16px`
- Purple gradient (`#667eea` → `#764ba2`) for vocab/academic quizzes
- Orange gradient (`#ed8936` → `#dd6b20`) for math/speed tools
- All internal links use relative paths (e.g., `href="./"` for back to hub)
- String concatenation for HTML building (not template literals)

### Quiz structure

- Menu → mode selection (Flashcards, Quiz, Full Test, etc.)
- Shuffled questions with multiple choice
- Immediate feedback with explanations
- Results screen with retry-missed option
- "Back to Study Hub" link on every page

### When adding a new tool

1. Create `study/[tool-name].html`
2. Update `study/index.html` with a new card (use `badge-purple` for quizzes, `badge-orange` for drills)
3. Update this CLAUDE.md project structure
4. Verify all math answers computationally before deploying

## Page conventions

Every page should have:

- `<meta name="description">` and a favicon link
- exactly one `<h1>`
- `<label for="...">` on every input, or an `aria-label` where a visible label would be redundant
- a visible `:focus-visible` outline on all interactive elements
- interactive controls built from `<button>`/`<a>`, never `<div onclick>`
- text contrast of at least 4.5:1 (3:1 for large text)
- no external network dependencies — no CDN fonts, scripts, or stylesheets

## Testing

Behavioural tests live in `tests/` and run in a real browser. They exist because
`phs/v17/tests/integrity.mjs` validates structure only — it passed clean while
blood pressure rendered as `NaN`, the simulator's mastery standard was
unreachable, and the BP calculator contradicted its own displayed thresholds.

```sh
npm install && npx playwright install --with-deps chromium
npm test              # all suites (~35s)
npm run test:phs      # simulator behaviour and score calibration
npm run test:bp       # BP calculator correctness
npm run test:cardiovascular-risk # prevention academy interactions and 2026 lipid logic
npm run test:aortopathy # aortopathy cases, pathways, and mastery scoring
npm run test:myocarditis # myocarditis navigation, cases, scoring, and content safeguards
npm run test:pals      # PALS case navigation, scoring, accessibility, and clinical-content safeguards
npm run test:genetics-chd # genetic CHD pathways, cases, mastery scoring, and clinical safeguards
npm run test:smoke    # page conventions, links, mobile, keyboard access
```

Run `npm test` before pushing anything that touches `phs/`, `tools/`, or
`study/`. CI runs the same suites on every push and pull request.

When adding a page, add it to `SITE_PAGES` in `tests/helpers/harness.mjs` — it is
then automatically checked against the page conventions above. See
`tests/README.md`.

## Deployment

- Push to main branch auto-deploys to Cloudflare Pages
- Live at: https://stevetodman.com
- Admin section protected by Cloudflare Access (email-based auth)

## Style Guide

- Dark theme: #1a1a2e to #16213e gradient (homepage, cooking timers)
- Light theme: #f8fafc background (clinic resources)
- Kids theme: #f0f4f8 background, white cards (study/)
- Accent color: #00cec9 (teal — homepage/cooking)
- Alert color: #e94560 (coral red — homepage/cooking)
- Quiz accent: #667eea purple (study/ vocab), #ed8936 orange (study/ math)
- Font: system fonts (-apple-system, BlinkMacSystemFont, etc.)
- No external dependencies (single-file HTML)

---

## Session Protocol

At the end of each work session, Claude will:
1. Update `next:` in frontmatter with the next logical step
2. Append to History below with what was done and why

---

## History

<!-- Claude appends here. Most recent first. -->
- 2026-08-15: Exam Room 3 auscultation now plays a procedural murmur aligned with `LegacyCore/src/lib/murmur-audio.ts`. Sites and descriptions come from clinical content; Valsalva boosts HCM and softens Still's. No MetaHuman Patel was imported — engine plugins exist, but there is no Patel identity asset, so step 5 stays failed. Portable tests 76/76.
- 2026-08-15: Patel presentation adapter: Mac TextToSpeech speaks only authored assignment and Socratic lines; listening lean while the learner menu is open; blink and a speaking cue on the blockout figure. Diagnosis follow-up uses `AttendingSocratic` and missed-opportunity templates from clinical content (section 29/30). No MetaHuman asset yet, so step 5 is still failed. Portable tests 74/74.
- 2026-08-15: Closed the remaining authored clinic loop in the blockout without adding a patient NPC. Returning to Patel after testing now offers diagnosis (authored differentials only), management, deterministic debrief from `EvaluateCurrentAttempt`, identity-free `RecordAttempt`, and `SelectNextCase` so HCM can start the vasovagal contrast without leaving the world. Portable tests 74/74.
- 2026-08-15: Continued on the authoritative 168-section plan (`LegacyCore/plan.md`, blob `e8935173`) and the `facfa6d` doorway branch. Linked that spec at the top of the Unreal README. Wired Exam Room 3 into the real case graph: Patel E now advances `system.load` through `assignment.accept`; entering the team/exam rooms records `navigate.workroom` / `navigate.exam-room`; E in Exam Room 3 introduces the encounter and offers numbered history/exam/order actions whose questions and findings come from `clinical-content.json`. No cube patient was added. Patel yaws toward the learner in range (gaze only — not voice or face). Portable Unreal tests 74/74.
- 2026-08-15: Human-gate run on exact package `Mac-Development-20260815T171530Z` (source `facfa6d`). The packaged app launched and the runtime blockout ward rendered (acceptance steps 1 and 2). Doorway spawn aim was not confirmed: the first captured view already faced a wall/floor after mouse capture. No observed WASD path through the doorway, team room, Patel assignment, or Exam Room 3. Step 5 and steps 8-19 remain unimplemented. The window did not land at 2560x1440 and no performance numbers were observed. `record-walkthrough-evidence.sh` wrote a Failed record; `walkthroughPassed` and `performanceCaptured` stay false. Local evidence is `Saved/WalkthroughEvidence/walkthrough-20260815T174612Z.json`; committed summary is `cardiohospital-unreal/Docs/walkthrough-20260815T174612Z-failed.md`.
- 2026-08-15: A normal learner-style launch exposed that scripted `BugItGo` screenshots had hidden a bad reception spawn view. The first attempted correction aimed due north, but the off-center start still faced a solid corridor-wall segment; the final implementation defines the reception start and doorway-center coordinates explicitly and derives `StartRotation` from their vector. Portable Unreal tests pass 72/72, the editor target compiles, and native Unreal automation passes 3/3. The exact corrected package is `cardiohospital-unreal/PackagedBuilds/Mac-Development-20260815T171530Z`, sourced from commit `facfa6d249f3`; its five cooked containers and ad-hoc signature passed packaging, while `walkthroughPassed` correctly remains false. Codex computer-use can launch and inspect the window but cannot provide sustained WASD or Unreal relative-mouse input, so the next gate is a human learner-control walkthrough, not more scripted camera shots.
- 2026-08-15: Reran the full first-build pipeline from project generation through packaging on the reference M4 Max and confirmed the packaged bundle renders the encounter scene: an in-engine `HighResShot` from the corridor shows the "Cardiology Team Room" door sign and the Dr. Patel figure through the door gap. Zero compile errors; the only fix was environmental — preflight requires Node 24+, satisfied by putting the machine's nvm v24.11.1 on PATH. Unattended capture of a packaged UE app on macOS hit three traps worth remembering: a force-killed instance leaves crash history that blocks the next launch behind a modal "reopen windows?" NSAlert until `ApplePersistenceIgnoreState` is set for the bundle id; UE's Mac argv reassembly adds its own quotes, so `-ExecCmds` must be passed shell-quoted only (literal inner quotes arrive doubled and parse empty); and Apple's GameController framework delivers the physical mouse to the game system-wide — even under `-RenderOffscreen` — so the desk mouse silently steers the camera during captures until `SetMouseSensitivity 0` is issued before posing the shot. Render verification only; the nineteen-step packaged walkthrough was not performed and the manifest's walkthroughPassed correctly remains false.
- 2026-08-15: Diagnosed the packaged app's black screen — the project had no world at all; `GameDefaultMap=/Engine/Maps/Entry` loads an empty map and `Content/` holds only clinical JSON. Added the first walkable ward slice authored entirely in C++: `CardioBlockoutGameMode` spawns a 30x20 m four-room ward with corridor, door gaps, landmark furniture, and a sun/atmosphere/sky-light rig at runtime from hard-referenced engine primitives, and `CardioBlockoutCharacter` walks it first-person at clinical pace. Config wires `GlobalDefaultGameMode` and WASD/mouse axis mappings; a new portable test holds class path, cook-forcing references, and axis names consistent across C++ and ini, since CI cannot compile Unreal. Confirmed walkable in the exact packaged bundle on the reference M4 Max — walkthrough steps 1 and 3 are now demonstrable. Then added the first encounter moment: door signs name the rooms to the case flow (Exam Room 3, Cardiology Team Room, Reception, Education Room), a placeholder block-figure Dr. Patel stands in the team room, and pressing E within conversation range starts `case-hcm` through the real `CardioCaseRuntimeSubsystem`, with the assignment panel (Canvas HUD, no new module deps) drawing every clinical fact from the shipped content document. Portable tests cross-check action bindings against input mappings, sign names, and that the assigned case id exists in `clinical-content.json` with a case graph; a guard asserts no clinical fact is hardcoded in the game mode.
- 2026-08-15: Drove the first real macOS package through on the reference M4 Max and closed the two gaps it exposed. Preflight now detects the Metal toolchain by executing `xcrun metal --version` — Xcode 26 ships the Metal compiler as a separate component, and `xcrun -f metal` resolves a path and exits 0 when it is absent, so the editor builds and automation passes and then every shader in the cook fails. Packaging now archives the staged bundle from `Saved/StagedBuilds/Mac` rather than trusting UAT's `-archive`, which copied the bare executable out of `Binaries/Mac`, and refuses to sign or hash a bundle carrying no `.pak`, `.utoc`, or `.ucas`. The first package produced a 412 MB seven-file bundle with a clean manifest and no cooked content in it.
- 2026-08-15: Rebaselined the Cardio Hospital release target from Windows/RTX to macOS on Apple silicon in ADR-0002, after the primary machine turned out to be an M4 Max with 128 GB. Ported the full stage model to shell — preflight, validation, project generation, editor build, automation, packaging, walkthrough evidence — using the same stage vocabulary as the retained PowerShell path, with a fixture asserting that parity in both directions. Kept the 60 FPS at 2560×1440 bar unchanged because it describes the learner's experience, not the GPU, and recorded that no Windows figure may be carried forward because none was ever measured. ADR-0001 retained unaltered as history per append-only ADR practice.
- 2026-08-15: Fixed a packaging blocker in the Unreal scaffold: three LegacyCore sources committed with CRLF before `.gitattributes` declared `*.ts text eol=lf` left a pristine clone dirty, which the package provenance gate rejected before any command ran. Added `npm run test:unreal` and the `clinical:*` scripts so the portable suite has a local entry point on any platform.
- 2026-08-14: Added the Cardio Hospital Unreal migration scaffold — portable deterministic clinical core, seven case graphs, C++ subsystems for clinical data, case runtime, education evaluation, and learner profile, plus the 168-section traceability matrix pinned by blob hash so the authoritative plan cannot drift without a deliberate rebaseline.
- 2026-08-14: Built the Cardio Hospital browser preview at `/cardiohospital/` — walkable blockout, Dr. Patel assignment, the Marcus Chen HCM encounter, four-site spatial auscultation with Valsalva response, a forced 12-lead ECG interpretation gate, and a no-WebGL QA mode for headless testing.
- 2026-08-13: Replaced the complete AV canal plate with a new immutable clean asset containing only the operative illustration and preoperative echo; removed the postoperative echo, superior atrial fold artifacts, and the obsolete source images so the blue numbered callouts and arrows cannot reappear through stale PNG/WebP selection. Bumped the PedCardSurg asset bundle version and updated regression coverage.
- 2026-08-13: Removed the three blue numbered callouts and their leader arrows from the complete AV canal surgical plate, regenerated its WebP derivative, and versioned both the image URLs and PedCardSurg asset bundle to prevent stale artwork from persisting in browser/CDN caches.
- 2026-08-13: Added explicit versioned asset URLs to `/pedcardsurg/` after a mixed-cache deployment served the updated nine-plate HTML with the old ten-plate Atlas JavaScript. This forces browsers and the CDN to load the corrected complete AV canal, Norwood, and BT-shunt mappings together.
- 2026-08-13: Corrected three user-identified CHD Atlas plates to Norwood stage I reconstruction, complete atrioventricular canal repair, and classic Blalock–Taussig shunt; deleted the rejected anomalous branch PA plate; and removed the Visual Surgery Lab, Key Lesions table, and Outcomes/STAT section. Updated navigation, counts, homepage discovery copy, and browser regression coverage for the nine-plate Atlas.
- 2026-08-13: Added ten supplied high-resolution congenital-heart surgical illustrations to `/pedcardsurg/` as the primary CHD Surgical Atlas, with clinically reviewed titles, flow transformations, interpretation checkpoints, full-resolution PNG access, WebP delivery, responsive/mobile behavior, homepage discovery, and automated atlas interaction/asset checks. Preserved the existing simplified before/after schematics as secondary flow-teaching tools.
- 2026-08-12: Expanded `/genetics-chd/` with an optional point-of-care genomic workbench covering GeneReviews, OMIM, ClinGen validity/dosage, ClinVar, gnomAD, HPO, DECIPHER, Orphanet, and Face2Gene; added a six-question report-interrogation workflow, worked examples, rapid-genome and emerging-omics boundaries, and three new assessment items. Updated the RASopathy-HCM section to reflect the selected retrospective 2025 MEK-inhibitor cohort while preserving its off-label, nonrandomized, expert-center status; posttest is now 18 questions.
- 2026-08-12: Rebuilt the uploaded genetics-of-congenital-heart-disease resource at /genetics-chd/, replacing inaccurate universal testing ladders, fixed recurrence percentages, inflated 22q11.2 associations, cfDNA diagnostic language, VUS overinterpretation, and experimental-therapy emphasis. Added a resident action pathway, high-yield pattern table, immediate extracardiac safety bundles, results/counseling guardrails, 5 branching cases, diagnostic pretest, 15-question 80%-to-pass posttest, printable reference, primary-source provenance through 2026, homepage discovery, and browser regression coverage.
- 2026-08-12: Rebuilt the uploaded pediatric myocarditis resource as `/myocarditis/`, correcting the Lake Louise criteria, return-to-sport timing, post-IVIG vaccine guidance, antithrombotic overclaims, and treatment certainty. Added action-focused recognition/diagnosis/stabilization lessons, 5 branching cases, a diagnostic pretest, 15-question 80%-to-pass posttest, printable reference, primary-source provenance, homepage discovery, and browser regression coverage.
- 2026-08-12: Added the PALS 2025 Resident Mastery Lab at `/pals/` with 10 high-acuity cases, 64 retrieval-based questions, hidden-on-start algorithm references, immediate explanations, accessibility improvements, primary-source citations, performance analytics, homepage discovery, and automated clinical-content safeguards.
- 2026-08-12: Added the Pediatric Aortopathy Resident Academy at `/aortopathy/`, anchored to the 2024 AHA scientific statement and updated with primary pediatric Marfan, vEDS, sports-participation, and 2026 Loeys-Dietz guidance. Added evidence-strength labels, resident action pathways, syndrome-specific deep dives, 5 branching cases, diagnostic pretest, 15-question 80%-to-pass posttest, printable quick reference, homepage discovery, and browser regression coverage.
- 2026-08-12: Added the guideline-based Pediatric Hypertension & ABPM Resident Academy at `/hypertension/`, reconciling the 2017 AAP office-BP guideline with the 2022 AHA ABPM update. Added an office timing pathway, threshold-aware ABPM lab, 5 branching cases, 26-question domain-scored quiz, printable quick reference, primary-source provenance, homepage discovery, and automated interaction tests.
- 2026-08-12: Replaced the hero's misleading static pills with working, keyboard-accessible links to the AAP report, screening technique, failed-screen response, and interactive quiz.
- 2026-08-12: Added a homepage project card linking directly to the newborn CCHD screening module so visitors can discover it from the main site.
- 2026-08-12: Added the interactive 2025 AAP newborn CCHD pulse-oximetry screening module at `/newbornscreen/`, including the updated algorithm, bedside response guidance, and a 17-question quiz. Added it to site-wide smoke-test coverage.
- 2026-08-03: Advanced the BP calculator to version 3.1 with years/months-first age entry, DOB alternative, simultaneous accessible validation, 2–3-reading auto-averaging, drift-free cm/ft+in toggles with local preference, new-patient clearing, explicit threshold deltas, normal-equivalent BP z-scores, clinical-threshold chart mode, direct labels and line patterns, and dark-mode coverage. Expanded the browser regression suite for each workflow.
- 2026-08-03: Rebuilt the pediatric BP calculator with monthly CDC growth references, exact AAP reading categories and drivers, category-specific follow-up, interactive age curves, copy/print support, a screening table, public validation documentation, and exhaustive 1,904-cell browser regression coverage.

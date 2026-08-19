---
status: active
next: Obtain pediatric resident and specialist feedback on the genetics-of-CHD and other resident mastery modules
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
├── clipboard-sanitizer/          # Standalone shell utilities (not deployed)
├── .github/workflows/            # phs-v17-integrity.yml, update-cooking-index.yml
├── study/                        # Kids' Study Hub (stevetodman.com/study)
│   ├── index.html                # Study Hub landing page
│   ├── us-states.html            # 50 States Challenge: spelling + map location practice/test
│   ├── us-states.webmanifest     # Add-to-Home-Screen manifest for the states app
│   ├── icons/                    # PNG app icons (iOS apple-touch-icon + manifest/maskable)
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
- **2026-08-19**: **Fixed a pre-existing Full Test bug found while adding the below**: both question renderers are shared by the practice queue and the graded test, but their "Next" buttons hardcoded `renderQueueQuestion()`. So after question 1 a Full Test silently fell out of the test flow — every later question rendered as a *map* question regardless of its planned type, the spelling/map subscores never accumulated, and the run ended on "Map Results" with no A–F grade at all. Verified against the deployed version before fixing. Added `advanceQuestion()`, which routes back to whichever flow started the round.
- **2026-08-19**: iPhone engagement/friction pass on study/us-states.html: (1) **Quick Round** — a 10-question mixed round targeting states the profile hasn't mastered (ranked most-missed → least-practised → unseen), since a 50-question pass is a long sit on a phone; (2) **Resume** — the active round is snapshotted after every answer into the profile, so closing the tab mid-round no longer discards it (snapshot is taken *before* `renderTestQuestion` increments its per-question totals, so resuming re-runs that increment exactly once); the round is device-local and deliberately excluded from the sync code; (3) **Add to Home Screen** — `us-states.webmanifest` plus real PNG icons in `study/icons/` (iOS ignores data: URIs and SVG for `apple-touch-icon`), rendered from the app's own map artwork, with `viewport-fit=cover` and `env(safe-area-inset-*)` padding so full-screen launch clears the notch/home indicator; (4) **Sound + confetti** — Web Audio chimes for correct/wrong/mastery/perfect-round and a CSS confetti burst, with a persisted mute toggle in the player strip. Audio context is created on first tap and resumed per play (iOS requires a gesture); confetti is suppressed under `prefers-reduced-motion`. No haptics: Safari on iOS does not support the Vibration API. Added `.webmanifest` to the test harness MIME map so the local server matches production.
- **2026-08-19**: Fixed "hard to click the smaller states" in Map Practice on study/us-states.html. The old fix only auto-zoomed a hardcoded 9-state "Northeast" list, so anything else small (Hawaii, etc.) got no help. Replaced it with a data-driven approach: rasterizes every state's actual filled pixel area on an offscreen canvas (bounding-box area alone is misleading — a spread-out state like Hawaii has a huge bbox around mostly open water) to find the 15 hardest-to-tap states, then auto-zooms tightly on whichever one is the target using native `getBBox()`. For multi-part states (Hawaii's islands), frames on the single largest connected landmass rather than the whole spread, since any tap within the state still counts as correct — this alone made the zoom ~10x tighter (biggest island went from ~1.2% to ~12.8% of the visible frame). Also bumped interactive-map stroke width slightly for extra tap-target padding everywhere.
- **2026-08-19**: Added an avatar picker to study/us-states.html: 20 emoji options (superheroes, animals, dragons, etc., each with an aria-label). A brand-new profile is routed to the picker right after the name is chosen ("Skip for now" falls back to the existing gendered default icon); "Change avatar" on the menu strip reopens it anytime. The chosen avatar now shows in the player strip, the profile-pick cards, and the Family Trophy Case, and travels through the cross-device Sync Code.
- **2026-08-19**: Fixed the reported "clicking Luke freezes on iPhone" bug in study/us-states.html: `loadData()`/`saveData()` re-read from `localStorage` on every call with no fallback, so if a write silently failed (confirmed by simulating Safari Private Browsing, which throws on every `localStorage` write) the profile pick never stuck and the app bounced straight back to the picker — reading as a freeze. Added an in-memory `memCache` so the current session stays consistent even when persistence fails. Also gave Luke and Samantha distinct, correctly-gendered profile icons (both used the same ambiguous 🙋 before), dropped the unnecessary 50 `<title>` elements from the road-trip map, and added a global `window.onerror` handler so any future JS error shows a visible "Restart" screen instead of looking frozen.
- **2026-08-19**: Added a cross-device "Sync Code" to study/us-states.html: a copy-pasteable code (no account, no server) that packs one profile's mastered states, boss/wrong counts, and weekly trophy stats, decoded and merged (never overwritten) into the other device's local progress. Chose this over a hosted backend after Supabase's free-tier project limit (2 active) was already used by other projects on the account. Also fixed a real cross-page horizontal-scroll bug on mobile: `<body>`'s flex child (`<main>`) had no `min-width: 0`, so it refused to shrink below its content's intrinsic width once any long unspaced string (the sync code) or a flex-basis:0 text input was on screen — added `main { min-width: 0; }` and `min-width: 0` on `.spell-form input`, which was already silently overflowing at phone widths in Spelling/Map/Boss/Full Test before this fix (undetected because the smoke suite only checks each tool's landing screen, not interaction states).
- **2026-08-19**: Added gamification to study/us-states.html: per-kid profiles (Luke/Samantha, localStorage), a "road trip" progress map on the menu that colors in states after 3 correct answers in a row, a Family Trophy Case comparing weekly mastery + boss defeats between the two profiles, and Boss Battles (HP-based spelling duels against each kid's most-missed states). Updated the site-smoke keyboard-operability check to tolerate a chained `.menu-card` screen (profile picker → mode menu) generically, not just for this tool.
- **2026-08-18**: Created study/us-states.html: 50 States Challenge (Explore map, Spelling Practice, Map Practice, Full Test with grade + spell/map subscores). Uses an inline SVG map (50 state paths extracted from a public-domain state-boundary dataset, embedded directly &mdash; no external map dependency), plus a zoomed Northeast inset in Map Practice so small New England states stay tappable on phone screens. Added Study Hub card. First-day-of-5th-grade study tool per user request.
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
- **2026-02-27**: Renamed english/ → twins/ → study/. Study tools live at stevetodman.com/study/. Added Study Hub card to homework-tracker (~/Desktop/twins/homework-tracker/src/hub.ts) — CSS class `.study` + card HTML added. NOT YET DEPLOYED — need to run `npm run deploy` in homework-tracker project.
- **2026-02-27**: Created fract-vocab-quiz.html, topic-e-quiz.html (Eureka Math G4M5 Topic E), 100-fact-club.html. Updated index.html with all cards. All math answers verified computationally.

---
status: active
next:
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
├── twins/                        # Kids' Study Hub (stevetodman.com/twins)
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
    └── bp-percentile-calculator.html
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

## Adding a Study Tool (twins/)

Kids' study tools for 4th grade — vocab quizzes, math quizzes, and drills. Live at stevetodman.com/twins.

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

1. Create `twins/[tool-name].html`
2. Update `twins/index.html` with a new card (use `badge-purple` for quizzes, `badge-orange` for drills)
3. Update this CLAUDE.md project structure
4. Verify all math answers computationally before deploying

## Deployment

- Push to main branch auto-deploys to Cloudflare Pages
- Live at: https://stevetodman.com
- Admin section protected by Cloudflare Access (email-based auth)

## Style Guide

- Dark theme: #1a1a2e to #16213e gradient (homepage, cooking timers)
- Light theme: #f8fafc background (clinic resources)
- Kids theme: #f0f4f8 background, white cards (twins/)
- Accent color: #00cec9 (teal — homepage/cooking)
- Alert color: #e94560 (coral red — homepage/cooking)
- Quiz accent: #667eea purple (twins/ vocab), #ed8936 orange (twins/ math)
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

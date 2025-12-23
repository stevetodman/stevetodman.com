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

## Deployment

- Push to main branch auto-deploys to Cloudflare Pages
- Live at: https://stevetodman.com
- Admin section protected by Cloudflare Access (email-based auth)

## Style Guide

- Dark theme: #1a1a2e to #16213e gradient (cooking timers)
- Light theme: #f8fafc background (clinic resources)
- Accent color: #00cec9 (teal)
- Alert color: #e94560 (coral red)
- Font: system fonts (-apple-system, BlinkMacSystemFont, etc.)
- No external dependencies (single-file HTML)

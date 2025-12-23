# CLAUDE.md

This is Steve Todman's personal website deployed via Cloudflare Pages.

## Project Structure

stevetodman.com/
├── index.html          # Homepage
├── cooking/
│   ├── index.html      # Cooking timers listing
│   ├── ribeye-timer.html
│   └── ribs-timer.html

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

### Timer HTML Template Structure

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
  <!-- Current step section -->
  <!-- Upcoming steps -->
  <!-- Equipment section -->
  <!-- Ingredients section -->
  <!-- Full timeline with checkboxes -->
</body>
</html>

### Timer Card Format (for cooking/index.html)

<a href="[recipe]-timer.html" class="timer-card">
  <div class="timer-title">[emoji] [Recipe Name]</div>
  <div class="timer-meta">[Source] • [Show/Book]</div>
  <span class="timer-time">~[duration]</span>
</a>

## Deployment

- Push to main branch auto-deploys to Cloudflare Pages
- Live at: https://stevetodman.com
- Cooking timers at: https://stevetodman.com/cooking/

## Style Guide

- Dark theme: #1a1a2e to #16213e gradient
- Accent color: #00cec9 (teal)
- Alert color: #e94560 (coral red)
- Font: system fonts (-apple-system, BlinkMacSystemFont, etc.)
- No external dependencies (single-file HTML)

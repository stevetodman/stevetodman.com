# stevetodman.com

Personal website and tools. Deployed via Cloudflare Pages.

## Contents

- **Pediatric Hospital Simulator** (`/phs/`) - Night-shift simulation for residents: prioritization, diagnostic reasoning, stabilization under uncertainty, and safe handoff, with an objective-linked debrief
- **Clinical Tools** (`/tools/`) - BP percentile calculator (AAP 2017 guidelines), pediatric ABPM pathway preview
- **Pediatric Hypertension & ABPM Academy** (`/hypertension/`) - Layered resident curriculum, office algorithms, ABPM interpretation lab, branching cases, and board-style assessment
- **Kawasaki Disease Resident Academy** (`/kawasaki/`) - Diagnosis, treatment, coronary risk, branching cases, and board-style assessment
- **Newborn CCHD Screening** (`/newbornscreen/`) - Updated AAP screening algorithm, bedside response guidance, and interactive quiz
- **Study Hub** (`/study/`) - Vocabulary quizzes, fraction practice, and timed multiplication drills
- **Math Lab** (`/math/`) - Fractions practice with tape diagrams and number lines
- **Cooking Timers** (`/cooking/`) - Step-by-step recipe timers with audio alerts
- **Clinic Resources** (`/admin/`) - Intake forms for HTN, dyslipidemia, syncope (password-protected)

## Development

Push to `main` branch auto-deploys to Cloudflare Pages.

### Tests

```sh
npm install && npx playwright install --with-deps chromium
npm test
```

Behavioural tests drive real pages in a real browser — simulator physiology and
scoring, BP calculator correctness, and site-wide conventions. See
[tests/README.md](tests/README.md).

See [CLAUDE.md](CLAUDE.md) for project structure and conventions.

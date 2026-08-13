# stevetodman.com

Personal website and tools. Deployed via Cloudflare Pages.

## Contents

- **Pediatric Hospital Simulator** (`/phs/`) - Night-shift simulation for residents: prioritization, diagnostic reasoning, stabilization under uncertainty, and safe handoff, with an objective-linked debrief
- **Clinical Tools** (`/tools/`) - BP percentile calculator (AAP 2017 guidelines), pediatric ABPM pathway preview
- **Pediatric Hypertension & ABPM Academy** (`/hypertension/`) - Layered resident curriculum, office algorithms, ABPM interpretation lab, branching cases, and board-style assessment
- **Cardiovascular Prevention & Dyslipidemia Academy** (`/cardiovascular-risk/`) - Age-driven preventive schedule, current lipid screening and FH treatment logic, legacy-guideline context, decision tools, and eight applied cases
- **PedCardSurg CHD Surgical Atlas & Visual Lab** (`/pedcardsurg/`) - Ten high-resolution primary surgical diagrams, twelve before/after flow visualizers, 55 PTED visual topics with a legacy-source guardrail, 26 decoded eponyms, current STAT context, and a 44-question mastery assessment
- **PALS 2025 Resident Mastery Lab** (`/pals/`) - Ten high-acuity cases and 64 retrieval-based questions with immediate guideline-cited explanations and performance analytics
- **Pediatric Myocarditis Resident Academy** (`/myocarditis/`) - Recognition, diagnostic confidence, pediatric acute-HF stabilization, evidence-calibrated therapy, branching cases, and mastery assessment
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
npm run test:pedcardsurg
```

Behavioural tests drive real pages in a real browser — simulator physiology and
scoring, BP calculator correctness, module interactions, mobile layout, and site-wide conventions. See
[tests/README.md](tests/README.md).

See [CLAUDE.md](CLAUDE.md) for project structure and conventions.

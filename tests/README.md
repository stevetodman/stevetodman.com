# Tests

Behavioural tests. They drive real pages in a real browser, because the failures
worth catching here are not crashes — they are confident wrong answers and
silently unreachable goals.

## Why these exist

`phs/v17/tests/integrity.mjs` validates *structure*: files exist, IDs
cross-reference, counts line up. It passed clean while:

- blood pressure rendered as `NaN` in the simulator's primary vitals tile;
- the mastery standard was unreachable, an expert run peaking at 70% against an
  80% minimum;
- untreated prostaglandin apnea had no clinical consequence and still marked the
  patient stabilized;
- the BP calculator contradicted its own displayed thresholds at the boundary.

Structural checks cannot catch any of that. Each assertion in this directory is
anchored to one of those defects, with a comment saying which.

## Running

```sh
npm install
npx playwright install --with-deps chromium

npm test              # everything
npm run test:phs      # simulator behaviour
npm run test:bp       # BP calculator correctness
npm run test:smoke    # site-wide conventions
npm run test:integrity # the existing structural audit
```

No server needs to be running — the harness serves the repository on an
ephemeral port.

## Layout

| file | what it protects |
|---|---|
| `helpers/harness.mjs` | static server, Playwright resolution, the page inventory |
| `helpers/phs.mjs` | simulator driver and the named clinical scenario plans |
| `phs-scenarios.test.mjs` | vitals rendering, deterioration, safety consequences, shift window, score calibration |
| `bp-calculator.test.mjs` | AAP 2017 accuracy, classification boundary, input plausibility, presentation |
| `site-smoke.test.mjs` | page conventions, external dependencies, links, mobile layout, keyboard access |

## The calibration tests

`phs-scenarios.test.mjs` pins the score gradient:

| scenario | expectation |
|---|---|
| do nothing | arrests, critical failure, floor score |
| sepsis frame + 20 mL/kg bolus | arrests |
| prostaglandin without airway support | arrests from apnea |
| the same, with airway support | survives and stabilizes |
| well-sequenced expert run | meets the mastery standard |

If the expert run stops meeting the standard, either the engine regressed or the
standard drifted — both worth a failing build. The mastery threshold is
currently calibrated against this one synthetic run, which is a sanity floor and
not standard setting; see `phs/v17/EXPERT_REVIEW_PACKET.md`.

## Adding a page

Add it to `SITE_PAGES` in `helpers/harness.mjs` and it is automatically covered
by the conventions, dependency, link, and mobile-layout suites.

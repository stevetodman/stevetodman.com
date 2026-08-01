# Pediatric Hospital Simulator

PHS is an AI-native pediatric hospital simulation platform centered on clinical shifts, longitudinal consequences, diagnostic reasoning, prioritization, communication, reassessment, and safe transfer of responsibility.

## Current hosted release

- Live entrypoint: `phs/index.html`
- Current platform: **v1.7**
- Primary scenario: **Night Shift: The Closing Window**
- Primary patient: Maya Carter, a 6-day-old infant with ductal-dependent systemic circulation from critical coarctation
- Competing patients: Eli, Nora, and Jamal

## Locked product direction

- Full children's hospital, with pediatric cardiology developed first and deepest
- Solo-first learner experience with AI-controlled clinical team members
- Persistent patients and downstream consequences
- Deterministic clinical truth engine separated from generative dialogue and presentation layers
- Voice/free-text interaction plus structured controls
- Continuous time, competing pages, delegation, and attention costs
- Layered EHR, procedures, imaging, communication, and debriefing
- Formative competency evidence mapped contextually to objectives, milestones, and EPAs
- Cloud core with optional desktop delivery
- Institutional licensing and longitudinal curriculum support

## Repository structure

- `index.html` — canonical hosted entrypoint
- `v17/` — current declarative educational platform
- `v17/cases/` — objective-linked case manifest and patient files
- `v17/schema.json` — assembled-case authoring schema
- `v17/tests/integrity.mjs` — dependency and cross-reference audit
- `v17/EXPERT_REVIEW_PACKET.md` — clinical and assessment review package
- `v17/RELEASE_NOTES.md` — current release scope
- `v16/` — preserved prior implementation

See [`v17/README.md`](v17/README.md) for the complete runtime dependency inventory and validation instructions.

## Educational architecture

The current learning loop is:

1. prebrief with measurable objectives;
2. forced initial acuity ranking;
3. history, examination, reasoning, orders, result interpretation, and communication under attention constraints;
4. patient-specific deterioration and treatment response;
5. end-of-shift patient-by-patient I-PASS;
6. objective-linked debrief and diagnostic-process analytics;
7. targeted remediation;
8. assigned surface variant and repeat attempt;
9. persistent local attempt history.

## Clinical and assessment governance

The clinical timing model and scoring weights are deterministic educational constructs. All current results are formative. PHS v1.7 must not be used for certification, promotion, entrustment, or independent-practice decisions until content review, response-process testing, standard setting, reliability studies, fairness analysis, and relationships with external measures have been completed.

## Development rule

Do not add case-specific behavior directly to the interface. New clinical content should be authored in declarative case files, linked to explicit objectives and teaching rationales, and reviewed through the expert-review process before deployment.

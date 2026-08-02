# PHS v1.8 release notes

## Purpose

v1.8 remediates the timing, cueing, assessment-integrity, responsive-layout, delegation, and accessibility defects identified by an independent UI-only audit of v1.7.

## Audit remediation

- Enforces the clinical deadline as a hard cutoff at exactly 840 seconds. An action that reaches the deadline is interrupted and cannot apply post-deadline effects or receive completion credit.
- Reconciles the scenario clock against monotonic wall time and refreshes the visible clock at 250 ms intervals, reducing callback-alignment and background-throttling drift.
- Displays learner-observed clinical state and measurements rather than hidden current physiology. Continuous monitoring creates new observed measurements only after monitoring has been established.
- Removes the target mechanism from learner-facing objectives while retaining it in the internal expert model and assessment framework.
- Requires an order search before order and treatment choices are displayed.
- Requires learner-entered result interpretation and management implications for interpretation credit.
- Requires clinically meaningful communication content for escalation, caregiver-update, and read-back credit.
- Requires patient-specific I-PASS content rather than minimum text length.
- Prevents an empty urgent-page set from earning response credit.
- Adds finite nurse and intern resources with assignment, busy state, parallel task completion, and double-booking prevention.
- Corrects tablet-width header overflow, including the inherited `min-width: max-content` behavior.
- Adds dialog semantics, modal focus containment, complete tab/tabpanel relationships, and keyboard tab navigation.
- Requires confirmation before destructive attempt reset or learner-history deletion.

## Verification

The v1.8 release is blocked by continuous integration unless all of the following pass:

- JavaScript syntax checks
- Declarative case-package integrity and cross-reference checks
- Simulator physiology, safety, timing, handoff, and mastery behavior tests
- UI-only audit-regression tests performed through rendered learner controls
- Blood-pressure calculator correctness tests
- Site-wide convention and smoke tests

The UI-only regression suite does not mutate simulator state or call internal scenario functions. It verifies the hard deadline, real-time clock behavior, pause/resume semantics, hidden-state boundaries, order-search behavior, content-dependent scoring, result interpretation, finite delegation, responsive layout, and accessibility relationships.

## Architecture

The v1.7 declarative case package remains in `phs/v17/cases/`. The v1.8 remediation runtime is layered through these reviewable modules:

- `integrity-base.js`
- `integrity-engine.js`
- `integrity-ui.js`
- `integrity-assessment.js`
- `integrity-layout.js`

This preserves the existing case package while making the audit corrections explicit and independently testable.

## Assessment boundary

All results remain formative. The rubric, weights, thresholds, text-quality rules, and mastery standard have not completed formal validity testing and must not be used for entrustment, certification, promotion, or independent-practice decisions.

## Prior release history

### v1.7 platform foundation

- Explicit measurable learning objectives in the prebrief
- Objective-to-framework contextual mappings with claim boundaries
- JSON Schema for declarative case files
- Full Closing Window case authored as external JSON
- Persistent local learner record
- Objective-linked debrief, remediation, variants, and diagnostic-process analytics
- Structured patient-by-patient I-PASS handoff
- Expert review and provisional standard-setting packet

### v1.7.1 corrections

- Corrected blood-pressure string rendering.
- Replaced automatic shift termination with a stopped-clock handoff window.
- Added clinical consequences for unsupported prostaglandin-associated apnea.
- Recalibrated urgent-page and prioritization thresholds so mastery remained attainable.

The superseded v1.6 implementation remains available in git history.
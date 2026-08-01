# PHS v1.7 release notes

## Purpose

v1.7 changes the project from a case-specific prototype into a reusable formative educational platform.

## Added

- Explicit measurable learning objectives in the prebrief
- Objective-to-framework contextual mappings with claim boundaries
- JSON Schema for declarative case files
- Full Closing Window case authored as external JSON
- Generic interpreter for history, examinations, orders, results, timing, physiology, pages, communication, scoring, and remediation
- Persistent local learner record using browser localStorage
- Attempt history and objective-level longitudinal scores
- Mastery loop: attempt, objective-linked debrief, targeted remediation, assigned surface variant, repeat
- Diagnostic-process analytics based on observable behavior
- Structured patient-by-patient I-PASS handoff
- Expert review and provisional standard-setting packet

## Assessment boundary

All results remain formative. The weights, thresholds, and mastery standard have not undergone formal validity testing and must not be used for entrustment, certification, promotion, or independent-practice decisions.

## v1.6 preservation

The superseded v1.6 implementation was removed from the deploy path. It remains available in git history.

## v1.7.1 corrections

- Blood pressure rendered as `NaN` in the vital-sign panel because a string value was passed through numeric rounding. Non-numeric vitals are now displayed verbatim.
- The shift previously ended automatically at 900 s, which forfeited both handoff rubric items and made the mastery standard unreachable. Clinical time now ends at 840 s with a warning at 720 s, and the end-of-shift handoff is completed on a stopped clock.
- Untreated prostaglandin-associated apnea had no clinical consequence and the patient was still marked stabilized. Unsupported apnea now deteriorates to arrest if airway support is not provided.
- The urgent-page rubric item required every urgent page to be answered within 90 s, which conflicted with correctly stabilising the highest-acuity patient first. It now requires two-thirds of urgent pages within 210 s.
- The prioritization objective contained only two rubric items, so a single miss fell below its 65 percent minimum. Its minimum is now 50 percent.

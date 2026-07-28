# Pediatric ABPM Preview — World-Class Product, UX, and Safety Gate Plan

**Status:** Test-preview release candidate only. This document is an execution gate, not a claim of clinical validation.

## 1. Product north star

In one continuous, iPhone-friendly flow, a clinician should be able to enter a complete synthetic or de-identified ABPM report, see exactly why the comparison is or is not available, inspect every threshold and clamp, and produce an identifier-free draft. The product must never turn unknown information into a negative finding, an automated phenotype, or a treatment recommendation.

The UX target is an *auditable report console*, not a prettier long form:

1. **Context:** completed age, combined outpatient/treatment state, office-BP eligibility.
2. **Report quality:** duration, successful/attempted count, device, then one deliberate fast-lane attestation or individual tri-state audit.
3. **Means:** three vertically stacked 24-hour/wake/sleep cards; no lateral data-entry scrolling.
4. **Age-adaptive bridge:** office values for age 13+; qualified office category plus report p95 reconciliation for younger patients.
5. **Review:** a thumb-reachable sticky action and a results workspace that stays visible but becomes stale after any meaningful edit.

## 2. Non-negotiable clinical and privacy boundaries

- Browser-local static page; no `fetch`, XHR, beacon, WebSocket, storage, uploads, raw ABPM files, OCR, or analytics.
- No DOB, study date, name, MRN, report text, or raw report upload. Use completed age in years/months.
- Synthetic/de-identified public testing only. `noindex` is not access control.
- No emergency triage, diagnosis claim, medication selection, dosing, automatic work-up bundle, or CKD MAP inference.
- AHA 2022 phenotype output requires eligible scope, documented adequate study-quality evidence for this preview, complete means/thresholds, valid office bridge, and untreated recording context.
- Under-13 report-transcribed p95 values are a provisional reconciliation workflow. An embedded LMS evaluator is a separate, source-validated release.

## 3. World-class gates — all must pass before an updated test preview is published

| Gate | Must pass | Evidence artifact |
|---|---|---|
| Core clinical logic | Exact age boundary; lower-of rule; threshold equality; every phenotype; treatment/office/quality withholding; no BP load | `pediatric-abpm-core.test.js` |
| Core/UI contract | `h24` naming; tri-state evidence; quality review reasons; clamp provenance; dipping/pattern; risk context; copy-note snapshot | `pediatric-abpm-ui.qa.js` |
| Scope-first safety | A 12-hour/blank-means study reports recording inadequacy first; no mean-error wall or phenotype | UI adversarial fixture |
| Privacy/no-egress | Static source scan and DOM test find no identifiers, network APIs, persistence APIs, inline code, or unapproved assets | UI QA + release review |
| Dependency failure | Missing core yields an explicit “Algorithm unavailable” state and disables input/copy | UI QA |
| Stale-state safety | Any classification-affecting mutation marks output stale and disables copy before the next frame | UI QA |
| Accessibility | WCAG 2.2 AA: contrast, focus visibility, `aria-invalid`, linked error summary, semantic lists/tables, results focus/status, reduced motion | automated DOM/CSS checks + manual VoiceOver/keyboard script |
| iPhone geometry | At 320/375/390/430 CSS px, portrait and landscape: no horizontal scroll for required input, all targets ≥44 px, sticky action above browser chrome | visual-regression screenshots + device test |
| Friction | Routine age-13+ path has ≤16 required focus targets and one final Review tap; no compulsory checkbox stack | interaction inventory + timed test |
| Performance | Local readiness update <100 ms; comparison <250 ms on a midrange mobile device; no layout shift after input | device/performance capture |
| Clinician usability | p90 known-report task completion ≤75 seconds for specialists and ≤120 seconds for residents, with no unsafe shortcut or wrong route | moderated synthetic task test |
| Clinical governance | Blinded vendor-report fixture comparison has zero categorical disagreement; pediatric hypertension/nephrology review is documented | signed governance record |
| Hosting security | CDN/origin delivers CSP, `frame-ancestors`, X-Frame-Options, Permissions-Policy, no-store cache policy, noindex header, referrer policy, and nosniff | response-header capture |

If any gate fails, the release stays local/test-only. A visual polish pass cannot override a clinical, privacy, or accessibility failure.

## 4. Adversarial test deck

Run the following prompts against every release candidate. The expected behavior is part of the test.

1. **Busy attending, one hand:** “Enter a complete normal 13-year-old synthetic report in under 60 seconds while the source report is in split view.” No lateral scroll or hidden required field.
2. **Decisive blocker:** “Set duration to 12 hours; leave means blank.” The first message names inadequate duration; phenotype and draft are unavailable.
3. **Unknown vs failed:** “Leave diary evidence untouched, then mark it not met.” The first outcome is review-required; the second is insufficient. Neither becomes a pass.
4. **Exact age switch:** “Change 12 years 11 months to 13 years 0 months and back.” Threshold route, fields, result, and draft must all reconcile.
5. **Nocturnal driver:** “Make sleep DBP exactly 65 at age 13 with normal office BP.” Masked phenotype and isolated nocturnal pattern are visible above the fold.
6. **Clamp audit:** “Under 13: wake p95 SBP 137 with mean 130.” The result row says `AHA fixed — clamped from 137.0`.
7. **Reconciliation:** “Make the 24-hour mean fall outside wake/sleep ±1.” A visible flag appears; it does not block phenotype by itself.
8. **Treated context:** “Use active treatment with normal ABPM and hypertensive office BP.” No white-coat label, therapy recommendation, or false normal result.
9. **CKD context:** “Select CKD without report-provided MAP.” The page says the MAP target is not assessed and does not calculate one.
10. **Single-digit correction:** “Change one sleep value after a result, then attempt Copy.” The prior result remains visibly stale; copying is disabled.
11. **VoiceOver/keyboard:** “Submit with two missing means.” Linked summary, field errors, focus, labels, and result headings remain intelligible without sight.
12. **Missing asset:** “Block `pediatric-abpm-core.js`.” No runtime stack trace, no output, and all interactive controls are disabled.
13. **Network/persistence:** “Enter values, calculate, copy, navigate away/back.” No outbound request caused by inputs; no form state is stored by page code.
14. **Hostile data:** “Paste malformed decimal, swapped SBP/DBP, transposed p95, and XSS-like text where a select/input permits it.” No script execution; no classification; field-specific recovery.

## 5. Deployment controls that code cannot provide alone

After external assets are fingerprinted, configure these as **response headers** at the host/CDN. An HTML meta tag is only a partial, defense-in-depth preparation.

```text
Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), clipboard-read=()
Cache-Control: private, no-store, max-age=0
X-Robots-Tag: noindex, nofollow, noarchive
```

Add HSTS only once the entire relevant domain/subdomain configuration is confirmed HTTPS-safe.

## 6. Staged release path

1. **Now — noindex test preview:** deterministic report-summary comparison, transparent rule file/hash, tri-state quality UX, synthetic examples, full fixture suite.
2. **Clinical validation candidate:** independently validated Wühl/LMS coefficient asset, golden fixtures, reconciliation thresholds treated as QA alerts (not new diagnostic rules), clinician-blinded vendor reports.
3. **Specialty modules:** separate CKD MAP review and treated-monitoring/discordance workflows, each with independent source/version/test gates.
4. **Clinical pilot:** only after governance, response-header, privacy, and regulatory review; no public-route PHI entry.

## 7. Release authority

The implementation team may ship a **noindex synthetic test preview** only after the automated gates pass. A clinician-owner plus pediatric hypertension/nephrology reviewer must approve any transition from test preview to real-patient clinical pilot. No individual feature owner can waive a hard safety, privacy, accessibility, or clinical-concordance gate.

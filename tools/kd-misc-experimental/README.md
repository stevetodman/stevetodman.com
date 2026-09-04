# iKD vs non-severe MIS-C Experimental Evidence Workbench

Route: `/tools/kd-misc-experimental/`

This is a clinician-only experimental evidence organizer. It is **not** a validated diagnostic calculator.

## v0.5 qualitative-likelihood workflow

The workbench now starts with a source-population applicability screen and returns one of five explicit qualitative states: favors non-severe MIS-C, favors incomplete KD, mixed, insufficient information, or outside the target phenotype. These are literature-pattern descriptions, not calibrated probabilities. Evidence from the same patient finding is grouped so multiple publications do not appear as multiple independent votes, and assessed-absent findings remain distinct from unknowns.

A patient-specific numeric percentage remains blocked until a reproducible model is authenticated and externally or locally recalibrated in the intended population. Observational prevalence tables, marginal associations, medians, and P values must never be multiplied or summed into a home-grown probability.

## v0.4-M1B-complete evidence contract

The workbench:

- defaults every interpreted field to `Unknown`;
- surfaces source-attributed associations only for findings explicitly marked `Yes`;
- never treats an absent finding as automatic evidence for the opposite diagnosis;
- includes the exact 2026 contemporaneous IKDR target-cohort main article **and** its electronic supplement;
- adds exact 2026 categorical findings for abdominal pain, diarrhea, vomiting, sore throat, irritability, rash, conjunctival injection, oral changes, and extremity changes;
- keeps cervical lymphadenopathy as explicit non-discriminating context;
- preserves the Fan 2023 aggregate GI variable as overlap/context rather than silently redefining it;
- displays main-paper and supplemental continuous laboratory/cardiac distributions as **group signals only** rather than inventing bedside cutoffs;
- preserves coronary incorporation-bias context;
- preserves the apparent creatinine-unit inconsistency printed in both main article and supplement instead of silently correcting it;
- keeps CSTE/CDC surveillance components separate and uncounted;
- shows Starnes model input availability but does not calculate the model result;
- contains no home-grown score, probability, diagnostic winner, treatment, or disposition logic;
- contains no free-text patient field, case-data network request, or browser persistence.

The direct link is `PRODUCTION` but `discoverable:false`; `noindex` is not authentication.

## M1 source lock

### M1A — complete

Fan et al., *Hospital Pediatrics* 2023, DOI `10.1542/hpeds.2022-007107`, remains the near-exact phenotype layer with exact source-attributed thresholds where published.

### M1B — complete

Primary article:

Harahsheh AS, Gunsaulus M, Tierney S, et al. *Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients.* *Pediatric Cardiology*. 2026. DOI `10.1007/s00246-026-04444-4`.

Exact target cohort:
- 769 non-severe MIS-C;
- 372 unconfirmed incomplete KD;
- 146 confirmed incomplete KD;
- 40 centers in 8 countries;
- January 2020 through October 2023.

Electronic supplement:
- `246_2026_4444_MOESM1_ESM.docx`;
- one-page most-extreme laboratory table;
- source-locked as group-level evidence only;
- no new validated cutoffs, likelihood ratios, model coefficients, or probability engine.

Detailed ledgers:
- `docs/KD_MISC_M1_SOURCE_LOCK.md`
- `docs/KD_MISC_M1B_MAIN_EXTRACTION.md`
- `docs/KD_MISC_M1B_SUPPLEMENT_EXTRACTION.md`
- `docs/KD_MISC_M1B_ACQUISITION_GATE.md`

## KIDMATCH

KIDMATCH must not be emulated. Integration still requires the authoritative implementation/model artifacts, preprocessing, licensing, conformal calibration/rejection behavior, and reproducible test vectors.

## Focused test

```bash
npm run test:kd-misc
```

Release also requires the focused M1B/M2/platform invariants and exact-SHA Cloudflare production verification after merge.

# iKD vs non-severe MIS-C Experimental Evidence Workbench

Route: `/tools/kd-misc-experimental/`

This is a clinician-only experimental evidence organizer. It is **not** a validated diagnostic calculator.

## v0.3-M1B-main contract

The workbench:

- defaults every interpreted field to `Unknown`;
- surfaces only source-attributed associations for findings explicitly marked `Yes`;
- never treats an absent finding as automatic evidence for the opposite diagnosis;
- displays the published result, source population, design, and limitation on each evidence card;
- now includes the exact 2026 contemporaneous IKDR target-cohort main article;
- adds source-attributed 2026 categorical findings for abdominal pain, diarrhea, vomiting, sore throat, irritability, rash, conjunctival injection, oral changes, and extremity changes;
- keeps cervical lymphadenopathy as explicit overlap/non-discriminating context in the 2026 target cohort;
- preserves the older Fan 2023 aggregate GI variable as overlap/context rather than silently redefining it from the 2026 component-symptom data;
- displays the 2026 age, fever, hematology, inflammatory-marker, ventricular-function, cardiac-biomarker, and coronary distributions as **group signals only** rather than inventing bedside cutoffs;
- treats the 2026 coronary result with an incorporation-bias warning because coronary involvement contributes to confirmation of incomplete KD;
- does not silently correct the apparent creatinine-unit inconsistency printed in Table 3; the numeric comparison is not a bedside input pending clarification;
- continues to use exact Fan 2023 thresholds only where those thresholds were directly reported;
- uses one shared platelet and lymphocyte input for both Fan comparative evidence and CDC surveillance context, preventing contradictory duplicate entries;
- keeps CSTE/CDC surveillance components separate and does not count them;
- shows Starnes model input availability but does not calculate the model result;
- preserves discordance when findings support both phenotypes;
- contains no home-grown score, probability, diagnostic winner, treatment, or disposition logic;
- contains no free-text patient field;
- makes no case-data network request and uses no browser persistence.

The direct link is classified `PRODUCTION` but `discoverable:false`. It is intentionally absent from normal site navigation. Site-wide `noindex` is not authentication.

## M1 source lock

### M1A — implemented

The original near-exact phenotype layer is source-locked to Fan et al., *Hospital Pediatrics* 2023 (DOI `10.1542/hpeds.2022-007107`) and supplemented only by clearly labeled adjacent/contemporaneous evidence from the AHA, CDC/CSTE, Starnes, Walton, Lee, and Lippi sources.

### M1B main article — source-locked

Primary source:

Harahsheh AS, Gunsaulus M, Tierney S, et al. *Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients.* *Pediatric Cardiology*. 2026. DOI `10.1007/s00246-026-04444-4`.

Exact target cohort:

- 769 non-severe MIS-C;
- 372 unconfirmed incomplete KD;
- 146 confirmed incomplete KD;
- 40 centers in 8 countries;
- contemporaneous IKDR enrollment from January 2020 through October 2023.

The main article does **not** provide a new validated diagnostic score, patient-level probability, multivariable coefficients, calibration analysis, decision curve, or validated continuous bedside cutoffs. The workbench therefore does not create any of those outputs.

The detailed extraction is in:

- `docs/KD_MISC_M1_SOURCE_LOCK.md`
- `docs/KD_MISC_M1B_MAIN_EXTRACTION.md`
- `docs/KD_MISC_M1B_ACQUISITION_GATE.md`

### M1B supplement — still pending

The paper explicitly references electronic supplementary material containing the most-extreme/peak-trough laboratory analyses. That supplement has not yet been obtained and source-locked. No supplement-only value is encoded in this build.

## KIDMATCH

KIDMATCH must not be emulated. It may be integrated only if the authoritative released implementation/model artifacts, preprocessing, licensing, conformal calibration/rejection behavior, and reproducible test vectors are verified.

## Focused test

```bash
npm run test:kd-misc
```

Release also requires the focused platform/production-boundary checks in `.github/workflows/kd-misc-experimental.yml` and exact-SHA Cloudflare production verification after merge.
# KD / MIS-C Experimental Workbench - M1B Primary-Source Acquisition Gate

Status: **BLOCKED ON VERIFIED FINAL 2026 PRIMARY SOURCE**
Date checked: 2026-09-04
Clinical surface: `/tools/kd-misc-experimental/`

## Objective

M1B is intended to source-lock the final 2026 Pediatric Cardiology study described as:

> *Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients*

The workbench must not encode a numeric result, threshold, effect estimate, model coefficient, probability, diagnostic weight, or subgroup conclusion from this study until the final version of record and any relevant supplement are directly verified.

## Target metadata to verify

Working metadata currently associated with the target article:

- file-style identifier: `s00246-026-04444-4.pdf`
- DOI candidate derived from that filename pattern: `10.1007/s00246-026-04444-4`

The DOI string is a **candidate, not a citation**. It must not be treated as verified merely because it matches the Springer filename pattern.

As of the check date, exact-title, filename, DOI-candidate, publisher-domain, and indexed-literature searches did not yield an independently verified final version of record or supplement suitable for source extraction. Therefore M1B remains blocked.

## Acquisition checklist

M1B can move from `BLOCKED` to `SOURCE_LOCKED` only after all of the following are satisfied:

- [ ] Publisher landing page or authoritative bibliographic record resolves.
- [ ] Exact final title is confirmed.
- [ ] DOI is confirmed directly rather than inferred from a filename.
- [ ] Complete author list and affiliations are recorded.
- [ ] Received, accepted, online-publication, and version-of-record dates are recorded when available.
- [ ] Full article is obtained from an authorized source.
- [ ] Every supplement / appendix relevant to cohort definitions or analyses is obtained.
- [ ] License / access status is recorded; copyrighted full text is not committed publicly unless redistribution is permitted.
- [ ] Article and supplement hashes are recorded in the extraction ledger when local source files are used.
- [ ] Page/table/figure/supplement provenance is recorded for every clinical value proposed for the workbench.
- [ ] Final publication is compared with Fan 2023 and other adjacent evidence so preliminary, broader, and final data cannot be conflated.
- [ ] Focused clinical tests are updated to lock the verified evidence contract before deployment.

## Required extraction schema

Extract only what the final source explicitly reports.

### Cohort construction

- study design and participating centers / countries;
- enrollment dates;
- source registry / database;
- exact iKD definition;
- exact non-severe MIS-C definition;
- severity definition and any ICU, shock, ventricular-dysfunction, coronary-disease, or vasoactive-support exclusions;
- whether KD cases were contemporaneous with MIS-C;
- SARS-CoV-2 exposure / PCR / antigen / serology handling;
- diagnosis confirmation / adjudication process;
- complete versus incomplete KD handling;
- coronary-involvement inclusion/exclusion rules;
- final analyzable sample sizes and flow exclusions;
- missing-data handling.

### Candidate discriminators

For every reported variable, capture denominator, timing, units, summary statistic, effect estimate, confidence interval, and P value when available:

- age, sex, race/ethnicity for transportability description only;
- fever duration and treatment timing;
- all five principal KD phenotype findings;
- gastrointestinal, neurologic, and respiratory symptoms;
- shock / hypotension;
- WBC, ANC, ALC, platelets, hemoglobin;
- CRP, ESR, sodium, albumin, AST, ALT, ferritin, D-dimer, creatinine;
- NT-proBNP / BNP and troponin with assay and units;
- LVEF / ventricular dysfunction and pericardial effusion;
- coronary maximum Z score / aneurysm category;
- pyuria / urinalysis definition;
- every variable retained in any multivariable analysis.

### Modeling / diagnostic-performance extraction

If a multivariable or diagnostic model is reported, capture:

- candidate and final predictors;
- exact coefficients / intercept if published;
- transformations, splines, interactions;
- variable-selection method;
- missing-data strategy;
- internal / temporal / external validation method;
- discrimination with confidence interval;
- calibration intercept / slope / plot if reported;
- Brier score if reported;
- sensitivity / specificity / PPV / NPV only at explicitly prespecified thresholds;
- decision-curve analysis if reported;
- subgroup performance;
- optimism correction / shrinkage;
- model availability: code, weights, nomogram, calculator, and test vectors.

No probability engine may be implemented from a model that cannot be reconstructed faithfully and whose validation scope is not appropriate for the intended population.

## Evidence-integration rules

1. Final primary-source data override remembered summaries or secondary descriptions.
2. A statistically significant univariable difference is an association, not automatically a bedside threshold.
3. Continuous variables remain continuous/group-level unless a clinically interpretable cutoff is explicitly studied and justified.
4. A threshold used for surveillance, inclusion, or descriptive tabulation must not be relabeled as a diagnostic cutoff.
5. A `No` response does not become evidence for the opposite diagnosis unless the source supports that interpretation.
6. Mixed or discordant signals remain visible; the tool must not manufacture a winner.
7. No treatment or disposition recommendation is derived from the comparative study.
8. No home-grown weighted score or synthetic probability is permitted.

## Current behavior while M1B is blocked

Until this gate is cleared:

- Fan 2023 remains the near-exact phenotype evidence layer;
- contemporaneous IKDR biomarker/coronary evidence remains clearly labeled as adjacent evidence;
- the Starnes model remains an input-availability audit only;
- CDC/CSTE surveillance components remain context, not diagnosis;
- the exact 2026 target paper contributes **zero numeric evidence** to the UI.

## Resume point

When an authoritative final article or supplement becomes available, resume here. Do not repeat M1A. First create a page/table-level extraction ledger from the primary source, then update the evidence registry, visible evidence version, and focused tests in the same pull request.
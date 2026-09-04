# KD / MIS-C Experimental Workbench - M3 Retrospective Shadow Evaluation Protocol

Status: **PREPARED - NOT ACTIVATED**
Date prepared: 2026-09-04
Clinical surface under evaluation: `/tools/kd-misc-experimental/`

## Purpose

M3 evaluates the existing evidence workbench retrospectively against a locally adjudicated target phenotype without changing patient care. It is a **shadow evaluation**, not a diagnostic deployment, model-development exercise, or chart-review shortcut.

No real patient data belong in this public repository.

## Activation gate

Do not begin case abstraction or analysis until the local governance path is documented.

- Institutional determination / protocol: **Add details here**
- Data custodian: **Add details here**
- Approved analysis environment: **Add details here**
- Approved case-abstraction team: **Add details here**
- Adjudication team: **Add details here**
- Sites / date range: **Add details here**
- Local data-retention and destruction plan: **Add details here**

A hidden/noindex website route is not an approved research-data environment. Patient-level data must remain in the institutionally approved local environment.

## Research question

Among de-identified children in the intended diagnostic-overlap population, how does the frozen evidence workbench behave relative to a final adjudicated reference diagnosis of:

1. confirmed incomplete Kawasaki disease; or
2. non-severe MIS-C?

The workbench itself does not issue a diagnosis, so M3 must not mislabel its performance as diagnostic sensitivity, specificity, or accuracy. The primary evaluation is descriptive: evidence coverage, discordance, missingness, source applicability, and failure modes by adjudicated outcome.

## Target population

Before chart review begins, the local protocol must define the target population and the meaning of **non-severe MIS-C** precisely enough that eligibility is reproducible.

Proposed target-population safeguards:

- include only cases in which the final adjudicated outcome is confirmed iKD, non-severe MIS-C, indeterminate, or an explicitly excluded alternative diagnosis;
- define the index encounter and severity boundary before abstraction;
- use data available at the clinically relevant index time, preferably before immunomodulatory treatment when the source evidence used that timing;
- do not select cases based on whether the workbench produces a favorable or one-sided pattern;
- do not silently mix complete KD, KD shock syndrome, severe MIS-C, or coronary-aneurysm-enriched cohorts into the primary target phenotype;
- retain indeterminate/overlap cases rather than forcing them into one diagnosis.

## Reference-standard adjudication

The following is a proposed methodological safeguard and requires local approval before activation:

1. Define a written adjudication charter before reviewing workbench output.
2. Use the full clinically relevant record available for final diagnosis, not only the variables entered into the workbench.
3. Keep adjudicators blinded to workbench evidence-state/output during initial adjudication whenever feasible.
4. Record independent disagreement explicitly.
5. Resolve disagreement by prespecified consensus or an additional adjudicator rather than by the workbench.
6. Keep `indeterminate` available as a legitimate final category.

The workbench output must not be incorporated into the reference diagnosis being used to evaluate it.

## Bias controls

M3 should explicitly monitor:

- **selection bias:** cases chosen because they were memorable, severe, or diagnostically difficult;
- **spectrum bias:** overrepresentation of disease extremes relative to the intended overlap population;
- **incorporation bias:** adjudicators using workbench output to define the reference diagnosis;
- **review bias:** abstractors knowing the final diagnosis while translating findings into tool inputs;
- **timing bias:** using post-treatment or later-illness values when a source study used presentation/pre-treatment values;
- **assay/unit mismatch:** applying published biomarker thresholds to incompatible assays or units;
- **era drift:** changing SARS-CoV-2 epidemiology, testing, vaccination, and MIS-C phenotype;
- **missingness bias:** treating unavailable data as negative/normal.

## Three-file local data design

To reduce leakage between abstraction, adjudication, and output review, use three separate structured files in the approved local environment.

### 1. Feature file

Contains only:

- a random research case ID;
- frozen evidence version;
- coarse age/fever context;
- the exact Yes / No / Unknown evidence inputs used by the live workbench;
- Starnes input-availability flags only.

It must contain **no adjudicated outcome** and no direct identifier.

### 2. Reference file

Contains only:

- the same random research case ID;
- adjudication status;
- adjudicated outcome;
- adjudication-charter version;
- whether initial adjudication was blinded to workbench output;
- whether reviewer disagreement occurred.

### 3. Frozen shadow-output file

Contains only:

- research case ID;
- evidence version;
- workbench evidence state;
- source-attributed evidence-card IDs displayed on each side/context panel;
- explicit `Starnes = not calculated`;
- explicit `KIDMATCH = not integrated`;
- confirmation that the shadow output was not used to change care.

Join the reference outcome only after the workbench output has been frozen.

## Privacy and data-minimization rules

The M3 local data contract intentionally excludes:

- name;
- MRN / medical-record number;
- patient ID from the EHR;
- DOB;
- exact encounter/admission/discharge dates;
- address;
- email;
- telephone number;
- free-text notes;
- clinician names;
- unstructured narrative copied from the chart.

Use a random research ID with no derivation from MRN, DOB, initials, room number, or encounter number.

The public repository contains schemas and validation code only. `research/kd-misc-shadow/data/` and `research/kd-misc-shadow/results/` are git-ignored and must remain local.

## Frozen input contract

For each case, every evidence input must be one of:

- `yes`
- `no`
- `unknown`

All fields are required so that missing fields cannot be silently interpreted as `no`.

The feature schema mirrors the live workbench input IDs. The validator performs structural/privacy checks only; it does not infer findings from raw labs, count criteria, calculate a score, or choose a diagnosis.

## Shadow evaluation outputs

M3 should report, with denominators and missingness made explicit:

1. distribution of workbench states (`insufficient`, `one-sided associations`, `discordant`) by adjudicated outcome;
2. frequency of each source-attributed evidence card by adjudicated outcome;
3. frequency and composition of discordant cases;
4. proportion of cases lacking key evidence inputs;
5. source-timing and assay/unit applicability failures;
6. indeterminate/overlap reference diagnoses;
7. abstraction/adjudication disagreements when measured;
8. clinically important failure narratives summarized only after de-identification and governance review.

Because the workbench does not classify patients, do not create a post hoc winner merely to calculate conventional classifier metrics.

## Comparator models

### Starnes

The live workbench remains input-availability only. If a retrospective comparator analysis is later approved, use a validated/verified implementation or a clinician-verified externally calculated result. Do not silently hand-calculate patient-specific probabilities inside this repository.

### KIDMATCH / Kawasaki MATCH

M2 remains blocked until the authentic deployable artifact is independently verified. M3 must not use a paper-derived or surrogate KIDMATCH implementation. A conformal reject must remain a reject if the authentic model is eventually added to a governed analysis.

## Missing data

- Never coerce missing to normal, absent, or `no`.
- Report missingness by variable and adjudicated outcome.
- Preserve `unknown` in the workbench input layer.
- Do not introduce research imputation into the evidence-workbench evaluation unless a separate prespecified analysis explicitly requires it.

## Version control

Every shadow run must record:

- exact workbench evidence version;
- exact Git commit used to produce the shadow output;
- adjudication-charter version;
- schema version;
- analysis-code version if/when analysis code is added.

Do not pool outputs from materially different evidence versions without stratifying or re-running the earlier cases under the frozen comparison version.

## Stop conditions

Stop M3 and do not interpret results if:

- governance/authorization is unclear;
- real patient data appear in Git history, browser storage, the public site, or any unapproved system;
- direct identifiers or free text enter the shadow dataset;
- the reference diagnosis uses the workbench output;
- the target phenotype/severity boundary is not reproducible;
- timing or units cannot be reconciled with the evidence card being evaluated;
- missing values are being treated as negative;
- a model comparator cannot be reproduced faithfully;
- the workbench is used to change care during this retrospective phase.

## Definition of M3-ready

M3 is **ready to activate**, not completed, when:

1. local governance fields above are completed;
2. target-population and non-severe definitions are frozen;
3. adjudication charter is approved locally;
4. de-identified feature/reference/output schemas are accepted;
5. the local validator rejects identifiers and malformed records;
6. synthetic-only repository tests pass;
7. no patient data are committed or deployed.

M3 is complete only after the governed retrospective analysis is performed on real de-identified cases and its limitations/failure modes are reviewed. No such performance results are claimed in this repository at protocol-preparation stage.
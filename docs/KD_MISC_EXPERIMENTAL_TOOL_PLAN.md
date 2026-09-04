# iKD vs non-severe MIS-C Experimental Evidence Workbench

Status: implementation plan for an experimental clinician-only tool
Owner: Steve Todman, MD
Repository: stevetodman/stevetodman.com
Initial route: /tools/kd-misc-experimental/
Release posture: hidden direct-link PRODUCTION route, site-wide noindex, not authenticated

## 1. Clinical problem

Incomplete Kawasaki disease (iKD) and non-severe multisystem inflammatory syndrome in children (MIS-C) can overlap substantially. The highest-risk design error is to convert observational associations, surveillance criteria, or internally validated models into a falsely precise bedside probability.

This project therefore starts as an **evidence workbench**, not a diagnostic calculator. Version 0.1 will organize verified findings, expose which published evidence each finding comes from, preserve unknowns, and highlight discordance. It will not generate a home-grown score, a synthetic probability, a diagnosis, a treatment recommendation, or a disposition recommendation.

The long-term goal is a calibrated, externally validated model specifically fit to the target phenotype: non-severe MIS-C versus confirmed iKD. That model is a later research milestone and is explicitly outside the v0.1 release contract.

## 2. Product principles

1. **Source fidelity over apparent intelligence.** Every care-relevant interpretation must map to a named source and a defined population.
2. **No evidence laundering.** Surveillance definitions remain labeled surveillance definitions. Association studies remain association studies. Internal validation remains internal validation.
3. **Unknown is a first-class state.** Missing data are never interpreted as normal, absent, or reassuring.
4. **No silent arithmetic.** The workbench does not count criteria, sum points, calculate a probability, or combine heterogeneous studies into an invented score.
5. **Discordance is visible.** Findings may support both syndromes. The UI must show that directly instead of forcing a winner.
6. **No treatment engine.** The output cannot recommend IVIG, corticosteroids, aspirin, anticoagulation, admission, ICU transfer, or discharge.
7. **Privacy by construction.** No names, DOBs, MRNs, free-text identifiers, analytics events, network requests, cloud storage, localStorage, or sessionStorage in v0.1.
8. **Mobile-first clinician usability.** The primary acceptance viewport is a 390 px touch device, while remaining usable on desktop.
9. **Versioned evidence.** Each evidence card identifies its source family and limitation. Clinical content changes require explicit review and a version bump.
10. **Production truth is exact-SHA truth.** A commit is not “live” until the exact main SHA has a successful Cloudflare Pages deployment and the public custom-domain route has passed production verification.

## 3. Intended user and non-users

### Intended user

A pediatric cardiologist or other clinician already evaluating a child in whom both iKD and MIS-C are being considered.

### Not intended for

- patients or families;
- autonomous diagnosis;
- screening asymptomatic children;
- treatment selection;
- emergency triage;
- use as a substitute for local multidisciplinary assessment;
- retrospective chart coding or billing.

The page must display “EXPERIMENTAL • CLINICIAN-ONLY • NOT VALIDATED FOR DIAGNOSIS OR TREATMENT” above the first input.

## 4. Evidence architecture for v0.1

### A. Guideline / definition context

**2024 AHA Kawasaki Disease scientific statement**

Use: current KD diagnostic framework and recognition that MIS-C belongs in the differential. The 2024 update retains the diagnostic classification framework while emphasizing timely diagnosis and coronary Z-score precision.

Implementation: display a source card and a neutral checklist of KD phenotype findings. Do not automate a diagnosis of complete or incomplete KD.

Reference: Jone PN, Tremoulet A, Choueiter N, et al. Circulation. 2024;150:e481-e500. PMID 39534969. DOI 10.1161/CIR.0000000000001295.

**2023 CSTE/CDC MIS-C surveillance definition, current CDC presentation**

Use: show individual surveillance-definition components as context only.

Implementation: never label the patient “meets MIS-C” from these fields. Do not count organ categories. State explicitly that this is a surveillance case definition and is not intended to replace clinical diagnosis or management judgment.

Reference: Melgar M, Lee EH, Miller AD, et al. MMWR Recomm Rep. 2022;71(4):1-14. DOI 10.15585/mmwr.rr7104a1. Effective January 1, 2023.

### B. Exact / near-exact phenotype evidence

**Fan et al., 2023**

Population: non-severe MIS-C compared with prepandemic incomplete KD without coronary involvement.

Use in v0.1: source-attributed directional findings only:
- older age was associated with non-severe MIS-C;
- thrombocytopenia and lymphopenia were more frequent in non-severe MIS-C;
- pyuria was more frequent in iKD;
- substantial definition overlap occurred.

Do not reuse the paper’s prior likelihood score as a new bedside score.

Reference: Fan LK, et al. Hospital Pediatrics. 2023. “Distinguishing Incomplete Kawasaki and Nonsevere Multisystem Inflammatory Syndrome in Children.”

**2026 contemporaneous IKDR paper**

Target source: “Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients” (Pediatric Cardiology; manuscript identifier associated with s00246-026-04444-4).

Current release rule: do **not** encode numeric thresholds, effect estimates, or derived weights from this source until the full text and supplement are source-verified. The paper is the highest-priority evidence upgrade for v0.2 because its cohort most closely matches the intended clinical question.

### C. Transparent prediction-model evidence

**Starnes et al., 2024**

Population: 602 children with complete/incomplete KD versus 105 with MIS-C. Final variables: age, sodium, platelet count, ALT, reduced LVEF, and CRP. Reported AUC 0.96 (95% CI 0.94-0.98), with good internal calibration; external validation is still required.

Use in v0.1: show only whether the variables required by the published model are available. Do not calculate the model probability in the workbench. The page should call this “published-model input completeness,” not “model result.”

Reference: Starnes LS, et al. J Hosp Med. 2024. “Clinical prediction model: Multisystem inflammatory syndrome in children versus Kawasaki disease.”

### D. Cardiac phenotype evidence

**Walton et al., 2023**

Contemporaneous IKDR cohort. Higher NT-proBNP and troponin I at presentation were associated with MIS-C versus KD. The study reported NT-proBNP >=1500 ng/L and troponin I >=20 ng/L as potentially useful discriminators, with specificity of 77% and 89%, respectively, in that cohort.

Use in v0.1: clinician manually records whether the exact published threshold is met. The UI must state that assay, units, timing, and population matter and that these are not universal diagnostic cutoffs.

Reference: Walton M, et al. Pediatr Cardiol. 2023. “Cardiac Biomarkers Aid in Differentiation of Kawasaki Disease from Multisystem Inflammatory Syndrome in Children Associated with COVID-19.”

**Lee et al., 2025**

IKDR contemporaneous comparison: coronary aneurysms and more severe coronary involvement were more prevalent in KD than MIS-C.

Use in v0.1: coronary aneurysm / maximum coronary Z-score >=2.5 can be displayed as KD-associated evidence, never as an exclusion of MIS-C.

Reference: Lee S, et al. J Am Heart Assoc. 2025. “Spectrum of Coronary Artery Involvement With Multisystem Inflammatory Syndrome in Children Versus Kawasaki Disease.”

### E. Contextual evidence intentionally not thresholded

**D-dimer**

A 2024 meta-analysis found higher D-dimer values in MIS-C than KD, but explicitly concluded that harmonized diagnostic thresholds remain to be established.

Implementation: if included, it is qualitative only (“markedly elevated by local assay/context: yes/no/unknown”) with a note that no universal discriminator threshold is encoded.

Reference: Lippi G, et al. Diagnosis (Berl). 2024. “Diagnostic value of D-dimer in differentiating multisystem inflammatory syndrome in Children (MIS-C) from Kawasaki disease: systematic literature review and meta-analysis.”

### F. KIDMATCH

KIDMATCH is an important externally tested machine-learning classifier for MIS-C/KD/other febrile illness and includes rejection of unfamiliar inputs. It is not reproduced in v0.1. Integration is allowed only after a current public implementation, model artifact/weights, license, preprocessing requirements, and validation behavior are independently verified. No surrogate “KIDMATCH-like” implementation is permitted.

## 5. v0.1 input contract

All interpreted inputs use explicit **Yes / No / Unknown** controls. “Unknown” is default.

### Context

- age band: optional descriptive field only; no automated age-derived diagnostic probability;
- fever duration: optional descriptive field only;
- hospitalization for inflammatory illness: yes/no/unknown;
- SARS-CoV-2 laboratory or epidemiologic evidence in the relevant window: yes/no/unknown.

### KD phenotype

- polymorphous rash;
- bilateral non-exudative conjunctival injection;
- oral/lip changes;
- extremity changes;
- cervical lymphadenopathy.

These are displayed as phenotype data, not counted by the application.

### Comparative phenotype

- gastrointestinal symptoms;
- thrombocytopenia documented by treating laboratory;
- lymphopenia documented by treating laboratory;
- pyuria;
- markedly elevated D-dimer by local context.

### Cardiac phenotype

- LVEF <55%;
- coronary aneurysm or maximum coronary Z-score >=2.5;
- NT-proBNP >=1500 ng/L using the exact published units;
- troponin I >=20 ng/L using the exact published units.

### Published-model completeness

Optional availability-only fields for Starnes model variables:
- age available;
- sodium available;
- platelet count available;
- ALT available;
- CRP available;
- LVEF classification available.

The application may state which inputs remain unavailable, but it must not calculate the score/probability.

## 6. Output contract

The output has four independent panels.

### 6.1 MIS-C-associated evidence present

Shows only source-attributed findings currently marked Yes that published evidence associates with MIS-C. Each card includes:
- finding;
- source;
- source population;
- limitation.

### 6.2 iKD/KD-associated evidence present

Same structure for findings associated with iKD/KD.

### 6.3 Overlap / uncertainty

Always visible. It must state:
- neither syndrome has a single definitive diagnostic test;
- substantial phenotype overlap exists;
- a finding associated with one syndrome does not exclude the other;
- missing data remain unknown;
- competing infectious/inflammatory diagnoses still require clinical consideration.

If at least one evidence card appears on both sides, show “DISCORDANT EVIDENCE — BOTH PHENOTYPES REPRESENTED.”

If all interpreted findings are unknown/no, show “INSUFFICIENT DISCRIMINATING DATA.”

### 6.4 Model / evidence applicability

- Starnes: show input completeness only, plus “internal model; external validation required.”
- KIDMATCH: “not reproduced in this tool; verified implementation required.”
- 2026 exact-phenotype IKDR study: “source extraction pending for numeric integration.”

No overall traffic light, winner, score, percentage, diagnostic label, or action recommendation is permitted in v0.1.

## 7. Safety and human-factors design

### Visual hierarchy

Top banner must be impossible to miss. Experimental status cannot be hidden behind an accordion or info icon.

### Prevent automation bias

- no green “safe” state;
- no red “disease present” state;
- no single dominant score;
- evidence columns have equal visual weight;
- citations and limitations are visible at the point of use;
- “Reset all” is prominent;
- result wording uses “associated with” rather than “predicts,” “rules in,” or “rules out.”

### Data hygiene

- no free-text notes;
- no patient identifiers;
- no cookies or browser storage;
- no telemetry or analytics;
- no remote API calls;
- no clipboard auto-copy;
- state resets on reload.

## 8. Technical architecture

Version 0.1 is a dependency-free static module:

- `tools/kd-misc-experimental/index.html`
- `tools/kd-misc-experimental/styles.css`
- `tools/kd-misc-experimental/app.js`
- `tools/kd-misc-experimental/README.md`

The evidence registry is an immutable JavaScript structure containing:
- stable evidence ID;
- input ID;
- direction (`misc`, `kd`, `context`);
- display text;
- source label;
- population summary;
- limitation;
- evidence version.

No clinical content should be embedded solely in DOM presentation code. This keeps evidence auditable and allows later extraction into a JSON registry.

## 9. Repository and release strategy

### Route classification

Catalog entry:
- class: PRODUCTION;
- audience: owner / clinician;
- discoverable: false.

This intentionally creates a direct-link public route while keeping it absent from navigation/search surfaces. Site-wide noindex remains active. **Noindex is not authentication.** If access control becomes necessary, the tool must move to an authenticated deployment rather than pretending that a hidden URL is private.

### Git strategy

1. develop on `clinical/kd-misc-experimental-workbench` from a known main SHA;
2. commit plan and implementation;
3. run focused CI;
4. review diff and clinical invariant tests;
5. merge only when green;
6. require exact merged SHA Cloudflare success;
7. run production verifier against `https://stevetodman.com`;
8. report “live-verified” only if the exact merged SHA remains current main and verification passes.

## 10. Test strategy

### 10.1 Static safety invariants

Fail CI if the v0.1 source contains:
- `localStorage`;
- `sessionStorage`;
- `fetch(`;
- `XMLHttpRequest`;
- treatment verbs in output templates such as “treat with,” “give IVIG,” “start steroids,” or “discharge”;
- an overall probability/score element;
- patient identifier fields.

### 10.2 Functional browser tests — Chromium, 390 px

1. route loads with HTTP 200 and no console/page errors;
2. experimental clinician-only banner is visible before inputs;
3. all interpreted controls default to Unknown;
4. selecting GI symptoms adds a source-attributed MIS-C-associated card;
5. selecting pyuria adds a source-attributed iKD-associated card;
6. selecting evidence on both sides triggers the discordance banner;
7. resetting restores all interpreted inputs to Unknown and removes evidence cards;
8. reload clears state;
9. no network requests occur after initial static document/assets;
10. page width does not overflow a 390 px viewport;
11. keyboard focus and form labels are programmatically associated.

### 10.3 Clinical invariant tests

Machine-checkable strings must ensure:
- CDC definition is labeled surveillance, not diagnostic;
- Starnes is labeled as requiring external validation;
- no D-dimer diagnostic cutoff is present;
- coronary aneurysm evidence does not claim to exclude MIS-C;
- Walton biomarker thresholds retain exact units and cohort-limitation language;
- the 2026 IKDR paper is not assigned unverified numeric values.

### 10.4 Platform tests

Run existing production-boundary tests to ensure the new route appears in `dist/`, remains noindex, and source/internal routes remain excluded.

### 10.5 Production tests

The production workflow must trigger on this module and catalog changes. It must:
- wait for the exact GitHub SHA’s Cloudflare Pages check to succeed;
- verify the custom domain;
- verify the new route returns 200;
- verify noindex and security headers;
- ensure non-production routes remain excluded.

## 11. Prospective validation roadmap

A world-class final diagnostic model should not be derived from hand-selected weights. It should be fit directly to patient-level data from the intended phenotype.

### Target outcome

Primary: adjudicated non-severe MIS-C versus confirmed iKD.

Secondary sensitivity analysis: include unconfirmed iKD as a separate or expanded cohort rather than silently mixing it with confirmed iKD.

### Candidate predictors

Prespecify predictors using current literature and clinical availability, including:
- age;
- fever duration;
- KD mucocutaneous features;
- GI involvement;
- platelet count;
- absolute lymphocyte count;
- CRP;
- sodium;
- ALT;
- albumin;
- D-dimer;
- NT-proBNP;
- troponin;
- pyuria;
- LVEF;
- coronary maximum Z-score;
- SARS-CoV-2 laboratory/epidemiologic evidence.

Predictor selection must be constrained by sample size and missingness. No stepwise “significance hunting” should define the final bedside model.

### Modeling strategy

Preferred transparent baseline:
- penalized logistic regression;
- restricted cubic splines for continuous predictors where justified;
- prespecified handling of missing data;
- bootstrap internal validation;
- full model intercept and coefficients published;
- shrinkage/penalization retained in the deployed model.

Compare against more flexible models only if sample size supports them and only if they provide meaningful gains in calibration/clinical utility, not merely AUROC.

### Required performance reporting

- AUROC with confidence interval;
- calibration plot;
- calibration intercept and slope;
- Brier score;
- sensitivity/specificity/PPV/NPV at prespecified clinically relevant thresholds;
- decision-curve analysis;
- missing-data analysis;
- subgroup performance by age, sex, race/ethnicity, era, center, and SARS-CoV-2 exposure/testing context when sample size permits;
- temporal validation;
- external validation at centers not used for model fitting.

### Deployment gate for a future probability model

A model-generated percentage cannot enter the clinical UI until:
1. exact derivation dataset and outcome definition are documented;
2. coefficients/preprocessing are reproducible;
3. internal optimism correction is complete;
4. external or strong temporal validation is available;
5. calibration is acceptable in the intended population;
6. a versioned model card and clinical review are committed;
7. unit tests reproduce published validation examples exactly;
8. the old evidence-only mode remains accessible as an audit view.

## 12. Evidence upgrade sequence

**M0 — v0.1 evidence workbench**
- safe input model;
- evidence registry;
- discordance/unknown handling;
- source limitations;
- mobile/browser tests;
- exact-SHA production verification.

**M1 — 2026 IKDR source lock**
- obtain/verify full article and supplement;
- extract exact cohort definitions, variables, units, effect sizes, missingness, and any multivariable analyses;
- create an evidence-extraction table with page/table provenance;
- update v0.1 only with source-verifiable content.

**M2 — KIDMATCH verification**
- locate authoritative released code/model artifacts;
- verify license, preprocessing, model weights, conformal-rejection logic, and test vectors;
- reproduce published examples before any integration;
- if artifacts cannot be verified, do not emulate it.

**M3 — retrospective local shadow evaluation**
- de-identified cohort only under appropriate institutional governance;
- no care changes based on output;
- compare evidence workbench/model candidates with final adjudicated diagnosis;
- record discordance and failure modes.

**M4 — prospective silent validation**
- tool runs without displaying model-driven recommendations to treating clinicians;
- evaluate calibration drift, missingness, usability, and out-of-distribution cases.

**M5 — validated clinical decision-support candidate**
- only after governance, validation, human-factors review, and regulatory/institutional requirements are satisfied;
- explicit versioned intended-use statement;
- post-deployment monitoring and rollback plan.

## 13. Change control

Every clinical change must include:
- source added/changed;
- exact claim changed;
- population and limitation;
- whether behavior/output changes;
- test update;
- evidence version bump.

A newer publication does not automatically replace older evidence. It must be evaluated for population fit and methodological quality.

## 14. Stop conditions

Do not promote or expand the tool if any of the following occur:
- source identity or units cannot be verified;
- a proposed feature depends on an unvalidated invented threshold;
- a model implementation cannot reproduce its source model;
- the UI encourages treatment decisions from an experimental association;
- missing data are being coerced to normal/negative;
- the production route leaks identifiers or persists patient data;
- exact-SHA deployment verification fails.

## 15. Definition of done for v0.1

Version 0.1 is complete only when:
- the plan and evidence registry are committed;
- the hidden clinician-only route is built;
- no PHI/persistence/network functionality exists;
- focused browser and clinical-invariant tests pass;
- platform boundary tests pass;
- the PR is merged to main;
- Cloudflare Pages succeeds for that exact merged SHA;
- production verification passes against the custom domain;
- the exact SHA remains current main at the time of reporting.

Until then, status must be reported as one of: **committed**, **CI passed**, **not deployed**, **deployed but not live-verified**, or **deployed and live-verified**.
# KD / MIS-C Experimental Workbench - M2 KIDMATCH Authenticity Gate

Status: **KIDMATCH INTEGRATION BLOCKED**
Date checked: 2026-09-04
Clinical surface: `/tools/kd-misc-experimental/`

## Decision

Do **not** reproduce, approximate, reimplement, or emulate KIDMATCH from paper prose.

The evidence lineage verifies that KIDMATCH exists, was internally implemented, and has undergone external validation. A 2024 PCORI final report also states that the code "has now been released and is generally available." However, as of the check date, a deployable authoritative public artifact containing the model weights plus the complete preprocessing and conformal-rejection machinery has **not been independently located and authenticated**.

The workbench therefore remains qualitative/source-attributed and must not calculate a KIDMATCH score, risk, probability, classification, SHAP explanation, or surrogate output.

## Verified chronology

### 1. 2022 model-development and validation paper

Lam JY, Shimizu C, Tremoulet AH, et al. *A machine-learning algorithm for diagnosis of multisystem inflammatory syndrome in children and Kawasaki disease in the USA: a retrospective model development and validation study.* Lancet Digit Health. 2022;4(10):e717-e726. doi:10.1016/S2589-7500(22)00149-2.

Verified characteristics:

- two-stage feedforward neural-network system;
- stage 1: MIS-C versus non-MIS-C;
- stage 2: Kawasaki disease versus other febrile illness among non-MIS-C patients;
- inputs include age, the five principal KD clinical signs, and 17 laboratory measurements;
- laboratory data were obtained at initial evaluation before treatment;
- preprocessing included special handling for automated differentials, percentile clipping, K-nearest-neighbor imputation for other missing laboratories, feature normalization, and age adjustment of hemoglobin;
- classification thresholds were selected to target high sensitivity during training;
- a conformal-prediction framework could reject unfamiliar/out-of-distribution samples rather than force a classification;
- the paper reported external MIS-C validation across multiple US sites;
- the paper's data-sharing statement said the investigators were unable to share the algorithm while applying for FDA Software-as-a-Medical-Device approval.

### 2. 2023 implementation report

Lam JY, et al. *Implementation of KIDMATCH: A Clinical Decision Support Tool for Diagnosing Pediatric Patients with Multisystem Inflammatory Syndrome and Kawasaki Disease.* AMIA Annu Symp Proc. 2023;2022:653-661.

Verified implementation details include:

- Python/TensorFlow model stack;
- Streamlit clinician interface;
- deployment on an internal Rady Children's Hospital virtual machine behind the hospital environment;
- manual entry of clinical/laboratory data in the implementation described;
- SHAP-based feature explanations;
- conformal rejection that can return a warning and withhold a risk score rather than force inference;
- iterative work on missing-data handling and automatically derived hematology fields;
- an internal model fact sheet.

This paper does not, by itself, provide an authenticated public inference package with everything required for faithful reproduction.

### 3. 2024 PCORI final report

Burns JC, Tremoulet AH, Shimizu C, et al. *Describing and Comparing Characteristics of Children with Kawasaki Disease and Multisystem Inflammatory Syndrome.* Patient-Centered Outcomes Research Institute. 2024. doi:10.25302/02.2024.CER.160234473C19.

The report states that the KIDMATCH code "has now been released and is generally available."

This establishes a **release claim**. It does not, by itself, identify or authenticate the exact public repository/package, license, version, weights, preprocessing constants, conformal calibration artifacts, or test vectors required for safe website integration.

### 4. 2025 United States external KD validation

Lam JY, et al. *External Validation of a Machine Learning Model to Diagnose Kawasaki Disease.* J Pediatr. 2025;282:114543. doi:10.1016/j.jpeds.2025.114543.

The published abstract reports greater than 89% accuracy across three children's hospitals. This supports continuing external validation of the model lineage but does not substitute for an authenticated deployable artifact or establish that every later validation used bit-identical model weights and preprocessing.

### 5. 2026 international validation lineage

Tremoulet AH, Lam JY, Ulloa-Gutierrez R, Burns JC, Nemati S, Gardiner MA, et al. *Validation of Kawasaki MATCH on a Latin American cohort: application to the REKAMLATINA network.* Pediatr Res. 2026 Jul 20. doi:10.1038/s41390-026-05190-2.

The report describes multinational validation of "Kawasaki MATCH" across the REKAMLATINA network and cites the earlier KIDMATCH/implementation lineage. This strengthens evidence that the model family continues to evolve and be validated. It also makes exact version mapping more important: the website must not assume that "KIDMATCH" (2022), later KD-focused validation, and "Kawasaki MATCH" (2026) are interchangeable model binaries without source verification.

## Public-artifact search result

Searches performed on 2026-09-04 included:

- exact KIDMATCH name and title searches;
- GitHub repository and code search;
- UCSD / Rady Children's / author-name combinations;
- Zenodo, OSF, Figshare, GitLab, and Software Heritage queries;
- distinctive implementation strings and Streamlit-related queries;
- model-fact-sheet, virtual-machine, preprocessing, and conformal-prediction terms.

Result: **PCORI release claim verified; authoritative deployable public artifact not independently located.**

This is a search result, not evidence that no such artifact exists. If an authoritative package is later identified, M2 resumes from the verification checklist below.

## Required authenticity package before integration

Every item below is required unless the authoritative package itself documents a functionally equivalent alternative.

### Provenance and legal use

- [ ] Artifact originates from UCSD/Rady, the model authors, or a clearly linked authoritative archive.
- [ ] Repository/archive owner and release history are verified.
- [ ] License explicitly permits the contemplated deployment and derivative integration.
- [ ] Exact release/version/commit and cryptographic hash are recorded.
- [ ] Regulatory/intended-use status is verified if relevant to deployment.

### Exact inference artifacts

- [ ] Stage 1 model weights and architecture serialization.
- [ ] Stage 2 model weights and architecture serialization.
- [ ] Exact feature names and ordering.
- [ ] Exact categorical/boolean encodings for the five KD signs and differential-type indicator.
- [ ] Exact output semantics and class ordering.
- [ ] Exact stage-specific classification thresholds.

### Preprocessing parity

- [ ] Training-derived mean and standard-deviation constants used for normalization.
- [ ] Exact 0.5th and 99.5th percentile clipping values for each affected feature.
- [ ] Exact automated-differential handling for bands, atypical lymphocytes, and absolute band count.
- [ ] Exact imputation constants where mean imputation is used.
- [ ] The KNN imputation reference/training representation or an authoritative serialized equivalent that can reproduce inference.
- [ ] Exact age-adjusted hemoglobin transformation/reference.
- [ ] Unit contract for every laboratory input.
- [ ] Missingness behavior for every feature.

### Conformal/rejection parity

- [ ] Exact nonconformity/trust-set formulation.
- [ ] Calibration/reference data or serialized calibration artifacts.
- [ ] Missingness component used in rejection.
- [ ] Risk-score component used in rejection.
- [ ] Exact acceptance/rejection thresholds.
- [ ] Confirmed behavior when a sample is rejected: no forced classification.

### Explanation parity

If SHAP explanations are displayed:

- [ ] Exact explainer configuration.
- [ ] Background/reference data or authoritative equivalent.
- [ ] Class/output mapping.
- [ ] Test vectors confirming feature-attribution parity.

### Test vectors and version mapping

- [ ] Authoritative synthetic/deidentified test inputs with expected preprocessing results.
- [ ] Expected stage-1 output.
- [ ] Expected conformal accept/reject result.
- [ ] Expected stage-2 output when applicable.
- [ ] Expected final classification.
- [ ] Expected explanation output if explanations are surfaced.
- [ ] Mapping between the artifact and the model version evaluated in the 2022, 2025, and/or 2026 publications.

## Website integration rules

If the gate is eventually cleared:

1. Integrate the authentic artifact, not a paper-derived reimplementation.
2. Preserve conformal rejection exactly; rejected cases must not receive a synthetic fallback prediction.
3. Do not silently substitute missing values or units outside the authenticated preprocessing contract.
4. Do not persist MRN, DOB, free text, or other identifiers merely because an internal implementation supported them.
5. Keep KIDMATCH output visibly separate from the qualitative evidence workbench until validation and human-factors review establish the combined presentation is safe.
6. Do not convert model output into treatment or disposition advice.
7. Add deterministic parity tests before any live inference is enabled.
8. Require exact-SHA production verification after any clinical-model integration.

## Current live-tool invariant

While this gate is blocked, the current workbench statement remains correct:

> **KIDMATCH: not reproduced here. Integration requires a verified authoritative implementation, model artifacts, preprocessing, licensing, and rejection behavior.**

No KIDMATCH-like surrogate is permitted.

## Resume point

Resume M2 only when a candidate authoritative artifact URL/package is found. Authenticate provenance first; then verify license, hashes, full preprocessing, model weights, conformal calibration, test vectors, and publication-version mapping before writing any inference code.
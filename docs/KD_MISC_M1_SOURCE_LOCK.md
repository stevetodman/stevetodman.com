# KD / MIS-C Experimental Workbench — M1 Source-Lock Ledger

Status: **M1A implemented; M1B final main article source-locked; electronic supplement pending**  
Date: 2026-09-04  
Clinical surface: `/tools/kd-misc-experimental/`

## Purpose

This ledger records exactly which comparative findings are allowed to drive the experimental workbench. It prevents later maintainers from converting remembered summaries, secondary citations, surveillance criteria, observational medians, or broad KD/MIS-C comparisons into unsupported bedside weights.

The workbench remains an evidence organizer. It does not output a diagnosis, overall score, probability, treatment recommendation, or disposition recommendation.

## M1A primary near-exact source

Fan LK, Bai S, Du C, et al. **Distinguishing Incomplete Kawasaki and Nonsevere Multisystem Inflammatory Syndrome in Children.** *Hospital Pediatrics*. 2023;13(10):e280-e284. DOI: `10.1542/hpeds.2022-007107`.

Population:
- 68 children with non-severe MIS-C meeting the 2023 MIS-C definition;
- 28 children with prepandemic incomplete Kawasaki disease meeting AHA iKD criteria;
- ICU-level care and coronary abnormalities were excluded from both cohorts.

Design limitation: retrospective single-system comparison; the iKD comparator was prepandemic.

## Source-locked Fan extraction

| Variable | Non-severe MIS-C | iKD | P value | Workbench treatment |
| --- | --- | --- | --- | --- |
| Age | median 8 y (IQR 5-10) | median 4 y (2-7.25) | <.001 | Group signal only; no invented age cutoff |
| Fever before treatment | median 6 d (5-7) | median 8 d (5-10) | <.001 | Group signal only; no diagnostic timing cutoff |
| Oral/lip changes | 35% | 64% | .009 | iKD-associated directional card |
| Polymorphous rash | 56% | 82% | .015 | iKD-associated directional card |
| Conjunctival injection | 74% | 61% | .214 | KD phenotype context only |
| Cervical lymphadenopathy | 12% | 11% | >.999 | KD phenotype context only |
| Extremity changes | 28% | 32% | .681 | KD phenotype context only |
| LVEF <55% | 22% | 3.6% | .034 | MIS-C-associated directional card |
| GI symptoms | 91.2% | 78.6% | .102 | Explicit overlap/non-discriminating card |
| CRP | median 12.5 mg/dL | median 10.9 mg/dL | .162 | Explicit overlap/non-discriminating card |
| Highest WBC >=15,000/mm3 before treatment | 4% | 39% | <.001 | iKD-associated directional card |
| Highest WBC | median 9.07 x10^3/uL | 13.3 x10^3/uL | <.001 | Group signal; exact binary threshold above is encoded |
| ANC | median 6.66 x10^3/mm3 | 9.39 x10^3/mm3 | <.001 | Group signal only; no invented ANC cutoff |
| ALC <1,000/mm3 | 43% | 18% | .021 | MIS-C-associated directional card |
| ALC | median 1.11 x10^3/mm3 | 1.99 x10^3/mm3 | <.001 | Group signal; binary published threshold above is encoded |
| Platelets <150,000/uL | 40% | 0% | <.001 | MIS-C-associated directional card |
| Platelets | median 179 x10^3/uL | 378 x10^3/uL | <.001 | Group signal; binary published threshold above is encoded |
| ALT >=45 U/L | 38% | 54% | .167 | Not directional |
| ALT | median 35 U/L | 72 U/L | .306 | Explicitly not directional |
| Albumin <=3 g/dL | 47% | 54% | .562 | Not directional |
| Albumin | median 3.10 g/dL | 3.00 g/dL | .443 | Explicitly not directional |
| Urine WBC >10/HPF | 12/60 (20%) | 14/23 (61%) | <.001 | iKD-associated directional card |
| Urine WBC | median 4/HPF | 14/HPF | .004 | Group signal; published binary threshold above is encoded |

Additional overlap findings:
- 24/28 (86%) of the iKD cohort could have met the organ-system and inflammatory portions of the 2023 MIS-C definition if SARS-CoV-2 evidence were present.
- 44/68 (65%) of non-severe MIS-C patients had at least 2 KD features.
- The previously published MIS-C likelihood score was concordant with the documented diagnosis in 74% of non-severe MIS-C and 71% of iKD; it is therefore **not reproduced** as the workbench's diagnostic engine.

## M1B final 2026 target-cohort source

Harahsheh AS, Gunsaulus M, Tierney S, et al. **Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients.** *Pediatric Cardiology*. 2026. DOI `10.1007/s00246-026-04444-4`.

Primary-source status:
- exact final publisher PDF verified;
- received 2026-06-18; accepted 2026-08-14;
- PDF SHA-256 `6aca331b8bc11bf5290a4d8579b5be75c0f0c8b7c5f80b09b152df489677a4cf`;
- copyrighted PDF is not committed to this public repository;
- electronic supplemental material is referenced by the article but remains pending source-lock.

### Exact target cohort

Multicenter observational IKDR cohort, January 2020 through October 2023, 40 centers in 8 countries:
- non-severe MIS-C: `n=769`;
- unconfirmed incomplete KD: `n=372`;
- confirmed incomplete KD: `n=146`.

Non-severe MIS-C required the 2020 CDC MIS-C criteria, evidence of prior SARS-CoV-2 infection within 3 months, no shock, and no ICU admission. KD patients with evidence of SARS-CoV-2 infection or exposure within 3 months were excluded. Confirmed incomplete KD met 2017 AHA criteria after central data review; unconfirmed incomplete KD had a site diagnosis that could not be confirmed from submitted information as meeting those criteria.

The full page/table extraction is maintained in `docs/KD_MISC_M1B_MAIN_EXTRACTION.md`.

### 2026 categorical findings now allowed as source-attributed cards

| Variable | Non-severe MIS-C | Unconfirmed iKD | Confirmed iKD | P value | Workbench treatment |
| --- | ---: | ---: | ---: | ---: | --- |
| Conjunctival injection | 58% | 62% | 71% | <.01 | iKD-associated card with omnibus-comparison caveat |
| Cervical lymphadenopathy | 26% | 30% | 22% | .16 | Explicit overlap/non-discriminating context |
| Rash | 50% | 69% | 68% | <.01 | iKD-associated card |
| Extremity edema | 25% | 36% | 32% | <.01 | iKD-associated card |
| Oral mucosal changes | 36% | 43% | 46% | .01 | iKD-associated card |
| Sore throat | 23% | 13% | 10% | <.01 | MIS-C-associated card |
| Abdominal pain | 64% | 19% | 25% | <.01 | MIS-C-associated card |
| Diarrhea | 47% | 27% | 29% | <.01 | MIS-C-associated card |
| Vomiting | 59% | 37% | 41% | <.01 | MIS-C-associated card |
| Irritability | 21% | 35% | 36% | <.01 | iKD-associated card |
| Cough | 27% | 30% | 37% | .06 | Not directional |
| Arthritis | 5% | 5% | 8% | .40 | Not directional |

All P values above are published three-group comparisons. They are **not** pairwise likelihood ratios and are not transformed into weights or patient-level probabilities.

### 2026 group signals not converted into new cutoffs

The main article source-locks the following directions/distributions for display, not for threshold creation:
- older age in non-severe MIS-C;
- shorter total fever duration in non-severe MIS-C;
- lower WBC, neutrophils, lymphocytes, and platelets in non-severe MIS-C;
- higher CRP and ferritin but lower ESR in non-severe MIS-C;
- no significant ALT or AST difference;
- lower trough LVEF and higher NT-proBNP/troponin in non-severe MIS-C;
- greater coronary involvement in confirmed incomplete KD, with important incorporation-bias limitations.

Exact medians/IQRs and denominators are recorded in `docs/KD_MISC_M1B_MAIN_EXTRACTION.md` rather than converted into bedside thresholds.

### Coronary finding — special handling

The 2026 target cohort reports coronary aneurysm (Z >=2.5) in 11% of non-severe MIS-C, 8% of unconfirmed iKD, and 41% of confirmed iKD. Coronary involvement contributes to confirming incomplete KD, so the large confirmed-iKD difference is partly incorporation-related. The exact 2026 result is therefore rendered as **context with an incorporation-bias warning**, not as a simple independent directional weight. The broader Lee 2025 IKDR result remains separately source-attributed.

### Aggregate GI variable — do not silently redefine

Fan 2023's aggregate `GI symptoms` variable was not significantly discriminating. Harahsheh 2026 reports separate abdominal-pain, diarrhea, and vomiting variables, each significantly more frequent in non-severe MIS-C. The workbench therefore keeps the Fan aggregate GI field as overlap/context and adds the three 2026 component inputs separately.

### Apparent creatinine-unit inconsistency

Table 3 labels creatinine as `mmol/L` while reporting medians around 25–40. The repository does not silently correct the source to a presumed alternative unit. That numeric comparison is retained as a source note but is not a bedside input pending clarification.

### What the 2026 main article does not provide

It does not publish a new:
- multivariable diagnostic model;
- coefficient/intercept set;
- validated continuous bedside cutoff;
- patient-level diagnostic probability;
- ROC/AUC for a new target-cohort classifier;
- calibration metric;
- decision-curve analysis;
- categorical likelihood ratio.

None of those outputs may be fabricated from study prevalences, medians, IQRs, or P values.

## Adjacent evidence allowed

### Starnes 2024

Use: published-model input availability and corroboration of reduced LVEF direction only. The model is not calculated in the workbench. Its population included complete and incomplete KD and was not restricted to non-severe MIS-C. External validation remains required.

### Walton 2023

Use: contemporaneous IKDR biomarker cards for NT-proBNP >=1500 ng/L and troponin I >=20 ng/L. These remain explicitly assay-, unit-, timing-, and population-dependent rather than universal diagnostic cutoffs. The 2026 target article's biomarker distributions are displayed separately and do not create new thresholds.

### Lee 2025

Use: broader contemporaneous IKDR coronary phenotype. Coronary aneurysm was less frequent and less severe in MIS-C than KD, but occurred in MIS-C; coronary findings must never be rendered as excluding MIS-C.

### Lippi 2024

Use: qualitative D-dimer direction only. No harmonized discriminator threshold is encoded.

### AHA 2024 and CSTE/CDC 2023

Use: phenotype and surveillance context. The workbench does not count KD features, count MIS-C organ categories, or declare either diagnosis/case definition met.

## Deliberately excluded from bedside weighting

- Race/ethnicity and zBMI: retained only for transportability assessment, not bedside diagnostic weighting.
- Treatment received: excluded because it is downstream of clinician judgment and can introduce incorporation bias.
- Any threshold inferred from a median/IQR or omnibus P value rather than explicitly studied as a threshold.
- Any composite weighting across Harahsheh, Fan, Walton, Lee, Starnes, or other heterogeneous studies.
- Any probability derived by treating study prevalence or specificity as a patient-level posterior probability.
- Any supplement-only peak/trough value until the actual electronic supplement is obtained and source-locked.

## M1B remaining gate — electronic supplement

The final article explicitly states that its online supplementary material contains a Supplemental Table and notes that peak/trough or most-extreme laboratory trends persisted there. The supplement has not yet been obtained in the source-lock workflow.

M1B becomes fully source-locked only after:
1. the Springer electronic supplement is obtained from an authoritative source;
2. its filename/version/hash are recorded;
3. supplement-only values, missingness, and definitions are extracted with provenance;
4. the registry/tests are updated only if those values materially and safely change the workbench.

## Release invariant

Any future clinical evidence change must update:
1. `tools/kd-misc-experimental/evidence-registry.js` and/or the versioned evidence extension;
2. this ledger and the relevant extraction ledger;
3. focused clinical invariant tests;
4. the visible evidence version.

A release is not live-verified until the exact merged SHA passes Cloudflare Pages and the custom-domain production verifier.
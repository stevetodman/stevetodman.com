# KD / MIS-C Experimental Workbench — M1 Source-Lock Ledger

Status: **M1A + M1B COMPLETE**  
Date: 2026-09-04  
Clinical surface: `/tools/kd-misc-experimental/`

## Purpose

This ledger defines exactly which published findings may appear in the experimental workbench. The workbench remains an evidence organizer; it does not output a diagnosis, score, probability, treatment recommendation, or disposition recommendation.

## M1A — Fan 2023 near-exact phenotype source

Fan LK, Bai S, Du C, et al. *Distinguishing Incomplete Kawasaki and Nonsevere Multisystem Inflammatory Syndrome in Children.* Hospital Pediatrics. 2023;13(10):e280-e284. DOI `10.1542/hpeds.2022-007107`.

Population: 68 non-severe MIS-C versus 28 prepandemic iKD; ICU-level care and coronary abnormalities excluded.

Source-locked bedside cards remain limited to findings/thresholds directly reported in that study, including platelet <150,000/µL, ALC <1,000/µL, urine WBC >10/HPF, highest WBC >=15,000/mm3 before treatment, LVEF <55%, oral changes, and rash. Aggregate GI symptoms and CRP remain explicit overlap/non-discriminating context.

## M1B — exact 2026 target cohort

Harahsheh AS, Gunsaulus M, Tierney S, et al. *Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients.* Pediatric Cardiology. 2026. DOI `10.1007/s00246-026-04444-4`.

### Primary article

- publisher PDF: `s00246-026-04444-4.pdf`
- SHA-256: `6aca331b8bc11bf5290a4d8579b5be75c0f0c8b7c5f80b09b152df489677a4cf`
- received 2026-06-18; accepted 2026-08-14
- exact cohort: 769 non-severe MIS-C, 372 unconfirmed incomplete KD, 146 confirmed incomplete KD
- 40 centers in 8 countries, January 2020 through October 2023
- detailed extraction: `docs/KD_MISC_M1B_MAIN_EXTRACTION.md`

### Electronic supplement

- publisher-style filename: `246_2026_4444_MOESM1_ESM.docx`
- supplied local filename: `246_2026_4444_MOESM1_ESM copy.docx`
- SHA-256: `af255b72826b87d708cfa82f54d36d5443007083f61eb306a20d27ef5bae92b5`
- one-page table: **Supplemental Table. Comparison of Laboratory Features at Most Extreme**
- detailed extraction: `docs/KD_MISC_M1B_SUPPLEMENT_EXTRACTION.md`

The copyrighted source files are not committed to this public repository.

## 2026 categorical findings allowed as source-attributed cards

| Variable | Non-severe MIS-C | Unconfirmed iKD | Confirmed iKD | P value | Treatment |
| --- | ---: | ---: | ---: | ---: | --- |
| Conjunctival injection | 58% | 62% | 71% | <.01 | iKD-associated with omnibus caveat |
| Cervical lymphadenopathy | 26% | 30% | 22% | .16 | overlap/context |
| Rash | 50% | 69% | 68% | <.01 | iKD-associated |
| Extremity edema | 25% | 36% | 32% | <.01 | iKD-associated |
| Oral mucosal changes | 36% | 43% | 46% | .01 | iKD-associated |
| Sore throat | 23% | 13% | 10% | <.01 | MIS-C-associated |
| Abdominal pain | 64% | 19% | 25% | <.01 | MIS-C-associated |
| Diarrhea | 47% | 27% | 29% | <.01 | MIS-C-associated |
| Vomiting | 59% | 37% | 41% | <.01 | MIS-C-associated |
| Irritability | 21% | 35% | 36% | <.01 | iKD-associated |

All P values are published three-group comparisons, not likelihood ratios or patient-level weights.

## 2026 presentation group signals

The main article supports group-level patterns of older age and shorter fever in non-severe MIS-C; lower WBC, neutrophils, lymphocytes, and platelets; higher CRP/ferritin and lower ESR; lower trough LVEF and higher cardiac biomarkers. ALT/AST at presentation were not significantly different. These distributions are displayed without inventing cutoffs.

## 2026 supplemental most-extreme laboratory signals

The supplement source-locks:

- lowest hemoglobin: 97 vs 100 vs 93 g/L; P<.01;
- highest WBC: 12.8 vs 14.2 vs 19.9 x10^9/L; P<.01;
- highest neutrophils: 8.9 vs 8.6 vs 11.8 x10^9/L; P<.01;
- highest lymphocytes: 3.3 vs 4.6 vs 5.3 x10^9/L; P<.01;
- highest platelets: 421 vs 478 vs 602 x10^9/L; P<.01;
- highest CRP: 139 vs 90 vs 112 mg/L; P<.01;
- highest ESR: 59 vs 66 vs 73 mm/hr; P<.01;
- highest ferritin: 331 vs 182 vs 200 ug/L; P<.01;
- highest ALT: 38 vs 26 vs 35 U/L; P<.01;
- AST: 47 vs 42 vs 46 U/L; P=.01;
- lowest albumin: 29 vs 32 vs 29 g/L; P<.01;
- highest creatinine: 43.3 vs 28.3 vs 26.5, printed as mmol/L; P<.01.

These are medians with IQRs in the source. They are **group-level signals only**. No new threshold is created from any median, IQR, extreme value, or omnibus P value.

Important non-simple patterns:
- highest neutrophils overlap closely between non-severe MIS-C and unconfirmed iKD;
- lowest hemoglobin is non-monotonic across iKD groups;
- peak ALT/AST are statistically different but non-monotonic;
- lowest albumin has the same median in non-severe MIS-C and confirmed iKD.

## Special cautions

### Coronary incorporation bias

CAA (Z >=2.5) occurred in 11% non-severe MIS-C, 8% unconfirmed iKD, and 41% confirmed iKD. Because coronary involvement contributes to confirming incomplete KD, the exact 2026 coronary result is context with an incorporation-bias warning rather than a simple independent weight.

### Aggregate GI variable

Fan 2023's aggregate GI variable was non-discriminating. Harahsheh 2026 reports abdominal pain, diarrhea, and vomiting separately and each is more frequent in non-severe MIS-C. The workbench therefore keeps the Fan aggregate GI field as overlap/context and adds the 2026 component symptoms separately.

### Creatinine unit inconsistency

Both the main article and supplement print creatinine as `mmol/L` while reporting values around 25-43. The repository records the source exactly as printed and does not silently reinterpret or convert the values for bedside use.

## What M1B does not provide

Neither the main article nor supplement publishes a new validated multivariable diagnostic model, coefficient/intercept set, validated continuous bedside cutoff, patient-level probability, ROC/AUC for a target-cohort classifier, calibration metric, decision-curve analysis, or categorical likelihood ratio.

## Adjacent evidence

Starnes 2024 remains input-availability/model-context only; Walton 2023 remains separately source-attributed for cardiac biomarker thresholds; Lee 2025 remains broader IKDR coronary context; Lippi 2024 remains qualitative D-dimer context; AHA 2024 and CSTE/CDC 2023 remain phenotype/surveillance context.

## Deliberately excluded from bedside weighting

- race/ethnicity and zBMI;
- treatment received;
- thresholds inferred from medians/IQRs/extreme values;
- composite weighting across heterogeneous studies;
- probabilities inferred from prevalence or specificity;
- KIDMATCH emulation.

## Release invariant

Any future evidence change must update the evidence registry/versioned extension, relevant extraction ledger, focused tests, and visible evidence version. A release is not live-verified until the exact merged SHA passes Cloudflare Pages and the custom-domain production verifier.

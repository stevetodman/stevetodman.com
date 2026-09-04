# KD / MIS-C Experimental Workbench — M1 Source-Lock Ledger

Status: M1A implemented; M1B pending exact 2026 primary source
Date: 2026-09-04
Clinical surface: `/tools/kd-misc-experimental/`

## Purpose

This ledger records exactly which comparative findings are allowed to drive the experimental workbench. It prevents later maintainers from converting remembered summaries, secondary citations, surveillance criteria, or broad KD/MIS-C comparisons into unsupported bedside weights.

The workbench remains an evidence organizer. It does not output a diagnosis, overall score, probability, treatment recommendation, or disposition recommendation.

## M1A primary near-exact source

Fan LK, Bai S, Du C, et al. **Distinguishing Incomplete Kawasaki and Nonsevere Multisystem Inflammatory Syndrome in Children.** Hospital Pediatrics. 2023;13(10):e280-e284. DOI: `10.1542/hpeds.2022-007107`.

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
- The previously published MIS-C likelihood score was concordant with the documented diagnosis in 74% of non-severe MIS-C and 71% of iKD; more than one quarter were inconclusive or discordant. It is therefore **not reproduced** as the workbench's diagnostic engine.

## Adjacent evidence allowed in M1A

### Starnes 2024

Use: published-model input availability and corroboration of reduced LVEF direction only. The model is not calculated in the workbench. Its population included complete and incomplete KD and was not restricted to non-severe MIS-C. External validation remains required.

### Walton 2023

Use: contemporaneous IKDR biomarker cards for NT-proBNP >=1500 ng/L and troponin I >=20 ng/L. These remain explicitly assay-, unit-, timing-, and population-dependent rather than universal diagnostic cutoffs.

### Lee 2025

Use: contemporaneous IKDR coronary phenotype. Coronary aneurysm was less frequent and less severe in MIS-C than KD, but occurred in MIS-C; coronary findings must never be rendered as excluding MIS-C.

### Lippi 2024

Use: qualitative D-dimer direction only. No harmonized discriminator threshold is encoded.

### AHA 2024 and CSTE/CDC 2023

Use: phenotype and surveillance context. The workbench does not count KD features, count MIS-C organ categories, or declare either diagnosis/case definition met.

## Deliberately excluded from bedside weighting

- Race/ethnicity: not encoded as a diagnostic input because transportability, social/epidemiologic confounding, and bias make bedside weighting inappropriate without validated modeling.
- Treatment received: not used as a predictor because it is downstream of clinician judgment.
- Any threshold inferred from medians/IQRs rather than explicitly studied as a threshold.
- Any composite weighting across Fan, Walton, Lee, Starnes, or other heterogeneous studies.
- Any probability derived by treating study prevalence or specificity as a patient-level posterior probability.

## M1B — exact 2026 paper gate

Target source:

**Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients** — Pediatric Cardiology; manuscript identifier associated with `s00246-026-04444-4` / DOI candidate `10.1007/s00246-026-04444-4`.

As of 2026-09-04, the exact full text and supplement were not available to the source-lock workflow and were not attached to the conversation used for this build.

Therefore:
- no 2026 cohort size is encoded;
- no 2026 prevalence is encoded;
- no 2026 medians/IQRs are encoded;
- no 2026 P values/effect estimates are encoded;
- no 2026 thresholds are encoded;
- no 2026 model coefficients or weights are encoded.

M1B is complete only after the exact primary full text and supplement are verified and a second extraction table is committed here with provenance.

## Release invariant

Any future clinical evidence change must update:
1. `tools/kd-misc-experimental/evidence-registry.js`;
2. this ledger;
3. focused clinical invariant tests;
4. the visible evidence version.

A release is not live-verified until the exact merged SHA passes Cloudflare Pages and the custom-domain production verifier.
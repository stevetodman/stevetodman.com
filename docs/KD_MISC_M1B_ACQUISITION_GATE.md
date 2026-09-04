# KD / MIS-C Experimental Workbench - M1B Primary-Source Acquisition Gate

Status: **SOURCE-LOCKED COMPLETE**  
Date checked: 2026-09-04  
Clinical surface: `/tools/kd-misc-experimental/`

## Objective

M1B source-locks the final 2026 Pediatric Cardiology study and its electronic supplementary material:

> Harahsheh AS, Gunsaulus M, Tierney S, et al. *Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients.* Pediatric Cardiology. 2026. doi: `10.1007/s00246-026-04444-4`.

## Verified final article

- DOI: `10.1007/s00246-026-04444-4`
- Publisher PDF: `s00246-026-04444-4.pdf`
- Received: 2026-06-18
- Accepted: 2026-08-14
- Journal: Pediatric Cardiology
- Article length: 11 pages
- Local source SHA-256: `6aca331b8bc11bf5290a4d8579b5be75c0f0c8b7c5f80b09b152df489677a4cf`
- The copyrighted PDF itself is **not** committed to this public repository.

## Verified electronic supplement

- Publisher-style filename: `246_2026_4444_MOESM1_ESM.docx`
- Supplied local filename: `246_2026_4444_MOESM1_ESM copy.docx`
- SHA-256: `af255b72826b87d708cfa82f54d36d5443007083f61eb306a20d27ef5bae92b5`
- Content: one-page **Supplemental Table. Comparison of Laboratory Features at Most Extreme**
- Source DOCX itself is **not** committed to this public repository.
- Full extraction: `docs/KD_MISC_M1B_SUPPLEMENT_EXTRACTION.md`

## Acquisition checklist

- [x] Publisher primary article obtained.
- [x] Exact title and DOI confirmed directly.
- [x] Full final author list and publication metadata recorded.
- [x] Main article hash recorded.
- [x] Electronic supplementary material obtained.
- [x] Supplement filename and hash recorded.
- [x] Main article table/page extraction completed.
- [x] Supplemental most-extreme laboratory table extracted.
- [x] Main and supplement findings compared before bedside encoding.
- [x] Source inconsistencies preserved rather than silently corrected.
- [x] Focused clinical invariants updated to lock the completed evidence contract.

## Final study design

- Multicenter observational International Kawasaki Disease Registry cohort.
- 40 centers in 8 countries.
- Enrollment January 2020 through October 2023.
- Non-severe MIS-C: `n=769`.
- Unconfirmed incomplete KD: `n=372`.
- Confirmed incomplete KD: `n=146`.
- Non-severe MIS-C required the 2020 CDC criteria, evidence of prior SARS-CoV-2 infection within 3 months, no shock, and no ICU admission.
- KD patients with evidence of SARS-CoV-2 infection/exposure within 3 months were excluded.
- Confirmed incomplete KD met 2017 AHA incomplete-KD criteria after central data review; unconfirmed incomplete KD had a site diagnosis that could not be confirmed from submitted information.

## Main article + supplement integration boundary

The final paper and supplement provide observational three-group comparisons. They do **not** publish a new validated diagnostic model or patient-level probability engine.

Therefore:

1. Categorical clinical findings from the final article may appear as source-attributed associations only.
2. Continuous presentation and most-extreme laboratory values remain group-level signals unless a separate primary study source-locks an exact validated threshold.
3. No cutoff is inferred from a median, IQR, peak/trough value, or omnibus P value.
4. Race/ethnicity, zBMI, and treatment received are not bedside diagnostic weights.
5. A `No` response never becomes automatic evidence for the opposite diagnosis.
6. Discordant evidence remains discordant; the tool does not manufacture a winner.
7. No treatment or disposition recommendation is derived from these comparative findings.
8. No home-grown score, weighted synthesis, or synthetic probability is permitted.

## Supplemental results now source-locked

The supplement reports medians/IQRs for the most extreme values of:

- lowest hemoglobin;
- highest WBC;
- highest neutrophils;
- highest lymphocytes;
- highest platelets;
- highest CRP;
- highest ESR;
- highest ferritin;
- highest ALT;
- AST;
- lowest albumin;
- highest creatinine.

These results reinforce several group-level directions but do not create new bedside thresholds. Peak ALT/AST, lowest hemoglobin, lowest albumin, and highest neutrophils are specifically retained as non-simple/non-monotonic group context rather than forced into a binary direction.

## Source-specific cautions

- The cohort used the 2020 CDC MIS-C definition, not the later 2023 surveillance definition.
- Shock was not defined uniformly across all sites.
- Echocardiographic images were not centrally reread.
- Unconfirmed incomplete KD remains vulnerable to misclassification.
- Coronary involvement contributes to confirmation of incomplete KD, creating incorporation bias for coronary comparisons.
- The main article and supplement both print creatinine units as `mmol/L` with values in the approximately 25-43 range. The repository preserves that source wording but does not silently reinterpret or convert it for bedside use.

## Gate result

**M1B is complete.**

Future work should not repeat primary-source acquisition or re-extract the main/supplement unless a corrected version, erratum, or new supplement is published. The next evidence-development gates remain KIDMATCH authenticity/implementation verification and governed retrospective/prospective validation; neither may be bypassed by treating these observational distributions as a diagnostic score.

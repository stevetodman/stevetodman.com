# KD / MIS-C M1B — 2026 Main-Article Extraction Ledger

Status: **FINAL MAIN ARTICLE SOURCE-LOCKED; ELECTRONIC SUPPLEMENT PENDING**  
Source checked: 2026-09-04  
Clinical surface: `/tools/kd-misc-experimental/`

## Primary source

Harahsheh AS, Gunsaulus M, Tierney S, et al. **Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients.** *Pediatric Cardiology*. 2026. DOI `10.1007/s00246-026-04444-4`.

Publisher PDF supplied to the source-lock workflow:

- filename: `s00246-026-04444-4.pdf`
- 11 pages
- received 2026-06-18
- accepted 2026-08-14
- SHA-256: `6aca331b8bc11bf5290a4d8579b5be75c0f0c8b7c5f80b09b152df489677a4cf`
- copyrighted PDF is not committed to this public repository.

## Cohort construction — pp. 2–3 / Figure 1

Design:
- multicenter observational cohort from the International Kawasaki Disease Registry (IKDR);
- 40 centers in 8 countries;
- enrollment January 2020 through October 2023;
- de-identified data submitted to the IKDR data coordinating center (DCC);
- laboratory and imaging reports submitted to the DCC; coronary Z scores calculated from reported measurements and submitted height/weight.

### Non-severe MIS-C

Site diagnosis was centrally checked against the **2020 CDC MIS-C criteria** plus evidence of prior SARS-CoV-2 infection within 3 months. Non-severe MIS-C required:
- no shock; and
- no ICU admission.

Flow:
- 2,146 site-diagnosed MIS-C enrolled;
- 211 excluded for lacking documented prior SARS-CoV-2 evidence;
- 108 excluded for not meeting CDC criteria;
- 1,827 confirmed MIS-C remained;
- 769 met the non-severe target definition.

### Incomplete KD

KD was diagnosed by participating sites. KD patients with prior SARS-CoV-2 infection or documented exposure within 3 months were excluded to reduce potential MIS-C misclassification.

Flow:
- 1,358 site-diagnosed KD enrolled;
- 203 excluded for SARS-CoV-2 infection/exposure;
- 637 complete KD excluded;
- 518 incomplete-KD cases remained;
- 146 met 2017 AHA incomplete-KD criteria after central review (**confirmed incomplete KD**);
- 372 had a treating-site incomplete-KD diagnosis but could not be confirmed from submitted information as meeting AHA incomplete-KD criteria (**unconfirmed incomplete KD**).

## Table 1 — demographics, p. 4

| Variable | Non-severe MIS-C | Unconfirmed iKD | Confirmed iKD | P value | Bedside treatment |
| --- | --- | --- | --- | --- | --- |
| Male sex | 62% | 60% | 55% | .30 | Non-discriminating |
| Age, median (IQR), years | 7.4 (4.2–11.1) | 2.5 (1.1–4.9) | 2.3 (0.8–4.3) | <.01 | Group signal only; no cutoff |
| Black race/ethnicity | 18% | 14% | 7% | <.02 | Transportability only; not bedside-weighted |
| White race/ethnicity | 41% | 41% | 41% | .98 | Non-discriminating |
| East Asian | 1% | 10% | 9% | <.01 | Transportability only; not bedside-weighted |
| Hispanic | 30% | 19% | 26% | <.01 | Transportability only; not bedside-weighted |
| South Asian | 7% | 10% | 10% | .30 | Not bedside-weighted |
| Mean zBMI | 0.53 ±1.38 | −0.12 ±1.39 | −0.03 ±1.16 | <.01 | Not bedside-weighted |

Race/ethnicity and zBMI are deliberately not converted into bedside diagnostic weights.

## Table 2 — clinical features, p. 4

| Variable | Non-severe MIS-C | Unconfirmed iKD | Confirmed iKD | P value | Workbench treatment |
| --- | --- | --- | --- | --- | --- |
| Conjunctival injection | 58% | 62% | 71% | <.01 | iKD-associated categorical card; omnibus comparison caveat |
| Cervical lymphadenopathy | 26% | 30% | 22% | .16 | Explicit overlap/non-discriminating context |
| Rash | 50% | 69% | 68% | <.01 | iKD-associated categorical card |
| Extremity edema | 25% | 36% | 32% | <.01 | iKD-associated categorical card |
| Oral mucosal changes | 36% | 43% | 46% | .01 | iKD-associated categorical card |
| Cough | 27% | 30% | 37% | .06 | Not directional |
| Sore throat | 23% | 13% | 10% | <.01 | MIS-C-associated categorical card |
| Abdominal pain | 64% | 19% | 25% | <.01 | MIS-C-associated categorical card |
| Diarrhea | 47% | 27% | 29% | <.01 | MIS-C-associated categorical card |
| Vomiting | 59% | 37% | 41% | <.01 | MIS-C-associated categorical card |
| Arthritis | 5% | 5% | 8% | .40 | Not directional |
| Irritability | 21% | 35% | 36% | <.01 | iKD-associated categorical card |
| Total fever duration, median (IQR), days | 6 (5–8) | 8 (6–11) | 9 (7–13) | <.01 | Group signal only; no timing cutoff |

The generic/aggregate `GI symptoms` field from Fan 2023 remains separate because Harahsheh 2026 reports **component symptoms**, not the same aggregate binary definition. The workbench therefore adds abdominal pain, diarrhea, and vomiting as separate 2026 inputs instead of silently changing the meaning of the Fan field.

## Table 3 — laboratory features at presentation, p. 5

All values below are medians with IQR unless otherwise noted.

| Variable | Non-severe MIS-C | Unconfirmed iKD | Confirmed iKD | P value | Workbench treatment |
| --- | --- | --- | --- | --- | --- |
| Hemoglobin, g/L | 115 (105–126) | 109 (101–118) | 104 (96–113) | <.001 | Group signal only |
| WBC, ×10^9/L | 9.0 (6.6–12.4) | 12.2 (9.2–16.4) | 17.4 (13.1–20.7) | <.001 | Group signal only; no new cutoff |
| Neutrophils, ×10^9/L | 6.3 (4.2–9.0) | 7.2 (4.2–10.1) | 10.2 (6.8–13.7) | <.001 | Group signal only |
| Lymphocytes, ×10^9/L | 1.4 (0.8–2.3) | 2.9 (1.6–5.0) | 3.5 (1.8–5.4) | <.001 | Group signal only; no new cutoff |
| Platelets, ×10^9/L | 201 (146–291) | 344 (249–429) | 470 (350–606) | <.001 | Group signal only; no new cutoff |
| CRP, mg/L | 103 (58–172) | 71 (26–138) | 83 (50–165) | <.001 | Group signal only; no new diagnostic cutoff |
| ESR, mm/hr | 48 (29–69) | 57 (33–81) | 67 (53–89) | <.001 | Group signal only |
| Ferritin, µg/L | 253 (155–449) | 163 (91–304) | 178 (112–306) | <.02 | Group signal only |
| ALT, U/L | 26 (17–44) | 23 (15–45) | 29 (15–63) | .22 | Non-discriminating |
| AST, U/L | 36 (27–52) | 37 (26–54) | 37 (26–62) | .45 | Non-discriminating |
| Albumin, g/L | 35 (30–40) | 36 (32–40) | 33 (28–37) | <.001 | Three-group difference but non-monotonic; no directional input |
| Creatinine | 39.8 (28.3–51.3) | 26.5 (19.4–37.1) | 24.8 (18.0–35.4) | <.001 | Source note only pending unit clarification |

### Creatinine unit inconsistency

Table 3 prints creatinine as `mmol/L`, but the reported values around 25–40 are not physiologically plausible in mmol/L. The repository does **not** silently correct the publication to another unit. The numeric result is preserved as a source note and is not encoded as a bedside input pending clarification from the authors/supplement/publisher metadata.

The article states that the same overall trends persisted when peak/trough or most-extreme laboratory values were examined in the **Supplemental Table**. Those supplement-only values are not yet source-locked.

## Table 5 — cardiac complications, p. 6

| Variable | Non-severe MIS-C | Unconfirmed iKD | Confirmed iKD | P value | Workbench treatment |
| --- | --- | --- | --- | --- | --- |
| Max coronary Z, median (IQR) | 1.3 (0.6–1.8) | 1.3 (0.7–1.8) | 2.0 (1.2–3.8) | <.01 | Group signal with incorporation-bias warning |
| CAA Z≥2.5 | 11% | 8% | 41% | <.01 | Context card, not simple directional weight |
| Lowest LVEF, median (IQR) | 60% (56–64) | 64% (60–67) | 64% (60–67) | <.01 | MIS-C group signal; no new cutoff |
| NT-proBNP at presentation, ng/L | 776 (240–2362) | 377 (134–1312) | 510 (154–1993) | <.02 | Group signal only |
| Highest NT-proBNP, ng/L | 2022 (603–5100) | 457 (165–1779) | 613 (171–2050) | <.01 | Group signal only |
| Troponin I at presentation, ng/L | 12 (10–40) | 10 (10–17) | 10 (10–20) | <.01 | Group signal only |
| Highest troponin I, ng/L | 20 (10–64) | 10 (10–20) | 10 (10–20) | <.01 | Group signal only |

### Coronary incorporation bias

The authors explicitly note that greater coronary involvement in confirmed incomplete KD is partly expected because coronary abnormalities contribute to confirming incomplete KD. Therefore the target paper's CAA result is not encoded as an independent diagnostic rule. This is especially important because CAA prevalence was similar between non-severe MIS-C (11%) and **unconfirmed** incomplete KD (8%), while confirmed incomplete KD was 41%.

## What the final paper does *not* provide

The main article does not publish:
- a new multivariable diagnostic model;
- coefficients or intercept;
- a validated patient-level probability;
- ROC/AUC performance for a new target-cohort classifier;
- calibration metrics;
- decision-curve analysis;
- validated cutoffs for the continuous laboratory/cardiorespiratory variables;
- likelihood ratios for the categorical findings.

Therefore the website must not manufacture any of those outputs from the reported medians, IQRs, prevalences, or P values.

## Study limitations — pp. 8–9

Source-locked limitations relevant to implementation:
- incomplete data submission across sites remained possible;
- possible misclassification, particularly in unconfirmed incomplete KD;
- the MIS-C cohort was classified using the 2020 CDC criteria for consistency even though the CDC definition changed in 2023;
- shock did not have a uniform objective definition across sites;
- echocardiographic reports/measurements were submitted without images and were not independently core-lab re-read;
- KD patients were excluded using submitted evidence of prior SARS-CoV-2 infection/exposure;
- data-sharing agreements may restrict patient-level data outside IKDR.

## Integration decision

Safe to integrate now:
- exact 2026 categorical clinical associations;
- exact group-level presentation laboratory and cardiac distributions as non-thresholded signals;
- explicit non-discriminating findings;
- source limitations and incorporation-bias cautions.

Not safe to integrate yet:
- any supplement-only peak/trough laboratory number;
- a new continuous cutoff inferred from medians/IQRs;
- a weighted score;
- a synthetic posterior probability;
- a treatment or disposition recommendation.

## Remaining M1B gate

Obtain the Springer electronic supplementary material associated with DOI `10.1007/s00246-026-04444-4`, record its hash, and extract the Supplemental Table with page/table provenance. Until then the visible evidence version is `0.3-m1b-main`, not full M1B completion.
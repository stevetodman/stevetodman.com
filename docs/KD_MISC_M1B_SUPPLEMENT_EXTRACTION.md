# KD / MIS-C Experimental Workbench - M1B Supplement Extraction

Status: **SOURCE-LOCKED**  
Date: 2026-09-04  
Parent article DOI: `10.1007/s00246-026-04444-4`

## Source

Springer electronic supplementary material supplied for the final 2026 Pediatric Cardiology article:

`246_2026_4444_MOESM1_ESM.docx`

Local supplied copy filename: `246_2026_4444_MOESM1_ESM copy.docx`

SHA-256 of the supplied file:

`af255b72826b87d708cfa82f54d36d5443007083f61eb306a20d27ef5bae92b5`

The source is one page containing one table titled **Supplemental Table. Comparison of Laboratory Features at Most Extreme**. Data are reported as median with interquartile range.

The copyrighted/source DOCX itself is not committed to the public repository.

## Exact supplemental extraction

Order of groups throughout:
1. non-severe MIS-C;
2. unconfirmed incomplete KD;
3. confirmed incomplete KD.

| Variable | n / non-severe MIS-C | n / unconfirmed iKD | n / confirmed iKD | P value | Workbench treatment |
| --- | --- | --- | --- | ---: | --- |
| Lowest hemoglobin (g/L) | 690; 97 (88, 109) | 351; 100 (89, 108) | 145; 93 (85, 103) | <.01 | Group signal only; non-monotonic across iKD groups |
| Highest WBC (x10^9/L) | 673; 12.8 (9.4, 17.9) | 346; 14.2 (11.1, 19.6) | 145; 19.9 (15.7, 24.6) | <.01 | Group signal only; reinforces higher WBC in iKD |
| Highest neutrophils (x10^9/L) | 624; 8.9 (6.2, 13.0) | 299; 8.6 (5.7, 12.4) | 131; 11.8 (8.5, 16.2) | <.01 | Group signal only; MIS-C and unconfirmed iKD overlap |
| Highest lymphocytes (x10^9/L) | 628; 3.3 (2.3, 5.2) | 287; 4.6 (2.9, 6.7) | 125; 5.3 (3.5, 8.2) | <.01 | Group signal only; no new ALC cutoff |
| Highest platelets (x10^9/L) | 637; 421 (291, 548) | 302; 478 (371, 632) | 143; 602 (480, 790) | <.01 | Group signal only; no new platelet cutoff |
| Highest CRP (mg/L) | 597; 139 (68, 199) | 198; 90 (32, 153) | 127; 112 (60, 188) | <.01 | Group signal only; higher in MIS-C, no cutoff |
| Highest ESR (mm/hr) | 493; 59 (37, 84) | 192; 66 (37, 92) | 99; 73 (57, 100) | <.01 | Group signal only; higher across iKD groups |
| Highest ferritin (ug/L) | 661; 331 (198, 588) | 209; 182 (97, 385) | 91; 200 (122, 374) | <.01 | Group signal only; higher in MIS-C, no cutoff |
| Highest ALT (U/L) | 671; 38 (23, 67) | 270; 26 (16, 58) | 138; 35 (17, 71) | <.01 | Statistically different but non-monotonic; not directional |
| AST (U/L) | 633; 47 (33, 71) | 251; 42 (30, 58) | 117; 46 (29, 73) | .01 | Statistically different but non-monotonic; not directional |
| Lowest albumin (g/L) | 682; 29 (24, 33) | 295; 32 (27, 37) | 140; 29 (25, 35) | <.01 | Non-monotonic; not directional |
| Highest creatinine (mmol/L as printed) | 688; 43.3 (31.4, 54.8) | 271; 28.3 (22.0, 39.8) | 133; 26.5 (19.4, 37.1) | <.01 | Preserve as source note only because printed unit appears implausible |

## What the supplement adds

The supplement confirms that the presentation-level trends in the main article generally persist when the most extreme laboratory values are examined. The strongest coherent group-level patterns remain:

- higher WBC, lymphocyte, and platelet maxima in incomplete KD;
- higher CRP and ferritin maxima in non-severe MIS-C;
- higher ESR maxima across incomplete-KD groups;
- higher reported creatinine maxima in non-severe MIS-C, subject to the source-unit inconsistency.

It also shows why several variables should **not** be simplified into directional bedside evidence:

- highest neutrophils are nearly identical in non-severe MIS-C and unconfirmed iKD;
- lowest hemoglobin is not monotonic across the two iKD groups;
- peak ALT and AST are statistically different but not monotonic;
- lowest albumin has the same median in non-severe MIS-C and confirmed iKD.

## Bedside-integration boundary

The supplement does **not** provide:

- validated continuous cutoffs;
- sensitivity or specificity for these extrema;
- likelihood ratios;
- a multivariable model;
- coefficients or intercept;
- patient-level probabilities;
- calibration or decision-curve analysis.

Accordingly, supplemental results are displayed only as source-attributed **group-level signals**. No threshold, point value, weight, score, probability, treatment recommendation, or disposition recommendation is created from the supplemental table.

## Source inconsistency: creatinine unit

The supplemental table again labels creatinine as `mmol/L` while reporting values such as 43.3, 28.3, and 26.5. The main article uses the same unit label with values of similar magnitude. The repository therefore records the values and unit exactly as printed but does not silently reinterpret or convert them for bedside use.

# KD / MIS-C Experimental Workbench - M1B Primary-Source Acquisition Gate

Status: **MAIN ARTICLE SOURCE-LOCKED; SUPPLEMENT PENDING**
Date checked: 2026-09-04
Clinical surface: `/tools/kd-misc-experimental/`

## Objective

M1B source-locks the final 2026 Pediatric Cardiology study:

> Harahsheh AS, Gunsaulus M, Tierney S, et al. *Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients.* Pediatric Cardiology. 2026. doi: `10.1007/s00246-026-04444-4`.

The final article is now directly verified from the publisher PDF supplied to the source-lock workflow. The supplement remains outstanding, so M1B is not yet marked fully complete.

## Verified final-article metadata

- DOI: `10.1007/s00246-026-04444-4`
- Publisher file: `s00246-026-04444-4.pdf`
- Received: 2026-06-18
- Accepted: 2026-08-14
- Journal: Pediatric Cardiology
- Article length: 11 pages
- Local source SHA-256: `6aca331b8bc11bf5290a4d8579b5be75c0f0c8b7c5f80b09b152df489677a4cf`
- Copyright statement in source: The Author(s), under exclusive licence to Springer Science+Business Media, LLC, part of Springer Nature 2026.
- The copyrighted PDF itself is **not** committed to this public repository.

## Source status

### Acquired and verified

- [x] Final publisher PDF obtained from an authorized/public publisher endpoint.
- [x] Exact final title confirmed.
- [x] DOI confirmed directly in the final article.
- [x] Complete final author list present in the article.
- [x] Received and accepted dates recorded.
- [x] Page/table provenance recorded in the M1 source-lock ledger.
- [x] Article hash recorded.
- [x] Final publication compared with Fan 2023 and adjacent IKDR evidence before bedside encoding.

### Still required for full M1B completion

- [ ] Obtain the electronic supplementary material referenced by the article.
- [ ] Record supplement filename, version, and SHA-256.
- [ ] Extract the reported peak/trough or most-extreme laboratory analyses from the supplemental table.
- [ ] Confirm whether the supplement adds any denominators, missingness detail, or analyses not present in the main article.
- [ ] Update the extraction ledger and focused clinical invariants with any supplement-only findings that are safe to expose.

## Final study design now source-locked

- Multicenter observational cohort from the International Kawasaki Disease Registry (IKDR).
- 40 centers in 8 countries.
- Enrollment January 2020 through October 2023.
- Non-severe MIS-C required the 2020 CDC MIS-C criteria, evidence of prior SARS-CoV-2 infection within 3 months, no shock, and no ICU admission.
- KD patients with evidence of prior SARS-CoV-2 infection or exposure within 3 months were excluded.
- Incomplete KD was centrally divided into:
  - confirmed incomplete KD meeting 2017 AHA incomplete-KD criteria; and
  - unconfirmed incomplete KD diagnosed by the treating institution but not confirmable from submitted information as meeting AHA incomplete-KD criteria.
- Final analytic groups:
  - non-severe MIS-C: `n=769`;
  - unconfirmed incomplete KD: `n=372`;
  - confirmed incomplete KD: `n=146`.

## Main-paper extraction boundary

The main paper reports three-group univariable comparisons of demographics, clinical findings, presentation laboratory values, treatment, and cardiac outcomes. It does **not** publish a new multivariable prediction model, coefficients, patient-level diagnostic probability, validated bedside cutoffs for the continuous laboratory variables, calibration analysis, or decision curve.

Therefore:

1. Statistically different continuous variables remain group-level signals unless an exact threshold is independently source-locked from another primary study.
2. Main-paper categorical findings may be displayed as source-attributed associations, but are not weighted or summed.
3. Race/ethnicity and treatment received remain excluded from bedside weighting.
4. A `No` response never becomes automatic evidence for the opposite diagnosis.
5. Mixed signals remain mixed; the tool does not manufacture a winner.
6. No treatment or disposition recommendation is derived from this comparative study.
7. No home-grown score or synthetic probability is permitted.

## Important source-specific cautions

- The 2020 CDC definition, rather than the 2023 surveillance definition, was used to classify MIS-C in this cohort.
- Shock did not have a uniform objective definition across sites; the paper describes site reporting with a pragmatic hypotension/perfusion/resuscitation interpretation.
- Echocardiographic images were not centrally re-read; submitted reports/measurements were used by the data coordinating center.
- The unconfirmed incomplete-KD group is explicitly vulnerable to misclassification.
- Coronary involvement contributes to confirmation of incomplete KD, so the large coronary difference between confirmed incomplete KD and the other groups is partly incorporation-related and must not be treated as an independent diagnostic rule.
- The main article states that most-extreme laboratory trends persisted in a supplemental table. Those values are **not** encoded until the supplement is obtained.

## Resume point

Do not repeat extraction of the final main article. Obtain the Springer electronic supplementary material for DOI `10.1007/s00246-026-04444-4`, hash it, extract the supplemental table with provenance, and then decide whether any supplement-only finding changes the evidence registry. M1B becomes fully `SOURCE_LOCKED` only after that step.
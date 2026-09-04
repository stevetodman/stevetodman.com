# KD / MIS-C Literature-Informed Likelihood Redesign

Status: **QUALITATIVE WORKFLOW IMPLEMENTED; NUMERIC PROBABILITY BLOCKED**  
Date: 2026-09-04  
Clinical surface: `/tools/kd-misc-experimental/`

## User goal

A clinician enters what is known about a patient and receives a concise assessment of whether the source-locked published pattern favors incomplete Kawasaki disease, favors non-severe MIS-C, is mixed, is insufficient, or falls outside the intended comparison.

## Current output contract

The workbench may:

- accept structured, identifier-free applicability and clinical findings;
- distinguish unknown from assessed absent;
- group multiple publications under one patient finding;
- show the exact source population, result, design, and limitation;
- state a **qualitative literature pattern**;
- refuse interpretation for shock, ICU-level illness, age outside the pediatric sources, or other target-population failures.

The workbench must not:

- count publications or findings as independent votes;
- multiply marginal likelihood ratios or use naive Bayes;
- infer weights from P values, medians, or IQRs;
- label assessed-absent findings as proof of the opposite syndrome;
- output a numeric probability, diagnosis, treatment, or disposition recommendation;
- extrapolate non-severe source cohorts to shock or ICU-level disease.

## Why numeric probability remains blocked

The available literature mixes different cohorts, eras, reference standards, severities, assays, timing, and outcome definitions. The 2026 target study publishes group distributions rather than a validated multivariable individual-probability model. Combining those marginal associations would create an unvalidated home-grown model.

A numeric patient-specific probability requires one of:

1. an authenticated published implementation with exact preprocessing, coefficients/weights, calibration, rejection behavior, licensing, and test vectors; or
2. a prespecified model developed and externally or temporally validated on patient-level data from the intended phenotype.

## Numeric-model release gate

Before displaying a percentage, require:

- frozen target population and index time;
- adjudicated outcomes with workbench-blinded initial review;
- consecutive or reproducibly sampled cases;
- exact units, assays, timing, and missingness;
- complete model artifact and preprocessing parity;
- calibration intercept/slope, Brier score, discrimination, uncertainty intervals, and decision-curve analysis;
- external or strong temporal validation;
- subgroup and era-drift assessment;
- out-of-distribution/rejection behavior;
- clinician human-factors testing;
- versioned model card, rollback plan, and exact-SHA production verification.

Until that gate passes, the qualitative evidence workbench is the only clinically exposed mode.

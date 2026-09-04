# M3 local shadow-evaluation scaffold

This directory contains **structure and privacy guardrails only** for the planned retrospective iKD vs non-severe MIS-C shadow evaluation.

It contains no patient data and must stay that way.

## Before use

Complete the governance and cohort-definition fields in `docs/KD_MISC_M3_SHADOW_EVALUATION_PROTOCOL.md` in the institutionally approved workflow. Do not place real data in this repository merely to complete those placeholders.

The validator is a defense-in-depth structural check. Passing it does **not** establish that a dataset satisfies institutional privacy, regulatory, or de-identification requirements.

## Local files

Create these only inside the approved local analysis environment:

- `data/features.json`
- `data/reference.json`
- `results/shadow-output.json`

The repository-level `.gitignore` in this directory excludes `data/`, `results/`, and `*.local.json` files.

### Feature file

Contains the frozen Yes/No/Unknown workbench inputs and model-input availability, but **not** the final adjudicated diagnosis.

### Reference file

Contains the random research case ID and adjudication fields only.

### Shadow-output file

Contains the frozen workbench evidence state and source-attributed evidence IDs. It must retain:

- `starnes_status: "not_calculated"`
- `kidmatch_status: "not_integrated"`
- `captured_without_care_change: true`

## Validation

From the repository root:

```bash
node research/kd-misc-shadow/validate.mjs features research/kd-misc-shadow/data/features.json
node research/kd-misc-shadow/validate.mjs reference research/kd-misc-shadow/data/reference.json
node research/kd-misc-shadow/validate.mjs output research/kd-misc-shadow/results/shadow-output.json
node research/kd-misc-shadow/validate.mjs crosscheck \
  research/kd-misc-shadow/data/features.json \
  research/kd-misc-shadow/data/reference.json \
  research/kd-misc-shadow/results/shadow-output.json
```

The validator rejects:

- unknown/additional fields;
- common identifier/free-text field names;
- email-, phone-, SSN-, and exact-date-like strings;
- malformed research IDs;
- missing Yes/No/Unknown workbench fields;
- non-frozen Starnes or KIDMATCH statuses;
- output records not explicitly captured without care change;
- feature/reference/output case-ID mismatches;
- feature/output evidence-version mismatches.

## Deliberate non-features

This scaffold does **not**:

- read EHRs;
- call any API;
- transmit data;
- store data in a browser;
- infer inputs from laboratory values;
- count KD or MIS-C criteria;
- calculate Starnes;
- run or emulate KIDMATCH;
- calculate a diagnosis or probability;
- recommend treatment or disposition;
- calculate retrospective performance metrics.

Those boundaries are intentional. Statistical analysis is a later governed step after real de-identified data, target-population definitions, adjudication procedures, and an analysis plan are finalized.
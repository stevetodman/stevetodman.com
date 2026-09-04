# iKD vs non-severe MIS-C Experimental Evidence Workbench

Route: `/tools/kd-misc-experimental/`

This is a clinician-only experimental evidence organizer. It is **not** a validated diagnostic calculator.

## v0.2-M1A contract

The workbench:

- defaults every interpreted field to `Unknown`;
- surfaces only source-attributed associations for findings explicitly marked `Yes`;
- never treats an absent finding as automatic evidence for the opposite diagnosis;
- displays the exact published result, source population, design, and limitation on each evidence card;
- uses exact Fan 2023 thresholds where those thresholds were directly reported;
- uses one shared platelet and lymphocyte input for both Fan comparative evidence and CDC surveillance context, preventing contradictory duplicate entries;
- explicitly labels findings that were **not discriminating** in the near-exact Fan cohort, including gastrointestinal symptoms and CRP;
- displays significant continuous group differences without inventing bedside cutoffs;
- keeps CSTE/CDC surveillance components separate and does not count them;
- shows Starnes model input availability but does not calculate the model result;
- preserves discordance when findings support both phenotypes;
- contains no treatment or disposition logic;
- contains no free-text patient field;
- makes no case-data network request and uses no browser persistence.

The direct link is classified `PRODUCTION` but `discoverable:false`. It is intentionally absent from normal site navigation. Site-wide `noindex` is not authentication.

## M1 source lock

### M1A — implemented

The near-exact phenotype layer is source-locked to Fan et al., Hospital Pediatrics 2023 (DOI `10.1542/hpeds.2022-007107`) and supplemented only by clearly labeled adjacent/contemporaneous evidence from the AHA, CDC/CSTE, Starnes, Walton, Lee, and Lippi sources.

The detailed extraction ledger is `docs/KD_MISC_M1_SOURCE_LOCK.md`.

### M1B — blocked pending the primary source

Target: *Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients* (Pediatric Cardiology; identifier associated with `s00246-026-04444-4`).

The exact 2026 full text and supplement are not source-locked in this build. **No numeric result, threshold, effect estimate, or model weight from that paper is encoded.** M1B proceeds only from the verified primary full text/supplement.

KIDMATCH must not be emulated. It may be integrated only if the authoritative released implementation/model artifacts, preprocessing, licensing, and rejection behavior are verified.

## Focused test

```bash
npm run test:kd-misc
```

Release also requires the focused platform/production-boundary checks in `.github/workflows/kd-misc-experimental.yml` and exact-SHA Cloudflare production verification after merge.
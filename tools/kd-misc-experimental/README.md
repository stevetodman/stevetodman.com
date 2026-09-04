# iKD vs non-severe MIS-C Experimental Evidence Workbench

Route: `/tools/kd-misc-experimental/`

This is a clinician-only experimental evidence organizer. It is **not** a validated diagnostic calculator.

## v0.1 contract

The workbench:

- defaults every interpreted field to `Unknown`;
- surfaces only source-attributed associations for findings explicitly marked `Yes`;
- never treats an absent finding as automatic evidence for the opposite diagnosis;
- keeps CSTE/CDC surveillance components separate and does not count them;
- shows Starnes model input availability but does not calculate the model result;
- preserves discordance when findings support both phenotypes;
- contains no treatment or disposition logic;
- contains no free-text patient field;
- makes no case-data network request and uses no browser persistence.

The direct link is classified `PRODUCTION` but `discoverable:false`. It is intentionally absent from normal site navigation. Site-wide `noindex` is not authentication.

## Evidence source lock

Core sources are listed on the page and in `docs/KD_MISC_EXPERIMENTAL_TOOL_PLAN.md`.

The 2026 contemporaneous iKD vs non-severe MIS-C IKDR publication is a planned v0.2 evidence upgrade. Numeric claims from that paper must not be added until the full text/supplement is verified and the extraction is committed with provenance.

KIDMATCH must not be emulated. It may be integrated only if the authoritative released implementation/model artifacts, preprocessing, licensing, and rejection behavior are verified.

## Focused test

```bash
npm run test:kd-misc
```

Release also requires the focused platform/production-boundary checks in `.github/workflows/kd-misc-experimental.yml` and exact-SHA Cloudflare production verification after merge.

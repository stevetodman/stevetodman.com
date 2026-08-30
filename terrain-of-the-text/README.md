# Terrain of the Text

Historically disciplined biblical geography for personal use and informal Bible study.

## Status

This directory is a temporary staging home on the isolated `atlas-main` branch. It does **not** alter the production `main` branch of `stevetodman.com`.

The intended permanent home is a dedicated GitHub repository with GitHub Pages publishing only the last approved state.

## Product thesis

Most biblical maps illustrate. This atlas should explain: **why does it matter that this happened here?**

A second thesis is equally binding: uncertainty is content. Contested locations, routes, dates, and interpretations are displayed as contested rather than silently resolved.

## Read before changing anything

1. `PROJECT-RULES.md`
2. `SPEC.md`
3. `REJECTED-CLAIMS.md`
4. `DECISIONS.md`
5. `CURRENT.md`
6. `ROUND-PROTOCOL.md`
7. The latest `audits/ROUND-N-AUDIT.md`

## Deliberately small control system

This project is maintained by one person. The governance should prevent drift without becoming a second project.

- No `archive/` snapshots: Git tags are the snapshots.
- No `CHANGELOG.md`: tags and round audits are the history.
- One audit file per round with both historical/geographic and software/regression sections.
- No universal claim-ID bureaucracy. Only contested claims and rejected claims receive ledger entries; ordinary sourced facts carry their citations directly where used.

## Development sequence

Round 0: evidence foundation and spec.

Round 1: geographic skeleton.

Round 2: one complete calibration episode.

Later rounds: one episode at a time, each compared against the last approved state before merge.

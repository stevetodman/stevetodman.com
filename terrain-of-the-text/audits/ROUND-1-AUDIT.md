# Round 1 Audit — Geographic Skeleton

**Status:** IN PROGRESS / NOT PASSING YET

## A. Historical/geographic audit

- [x] Physical vector source chosen with reusable terms: Natural Earth public domain.
- [x] Elevation source chosen: SRTM public domain.
- [x] Modern political layers excluded by default.
- [x] Initial anchor coordinates cross-referenced.
- [ ] Embedded coastline geometry acquired and validated.
- [ ] Inland-water geometry acquired and validated.
- [ ] Jordan/major drainage geometry reviewed for appropriate scale.
- [ ] Projection/rendering checked for positional distortion.
- [ ] No schematic geometry presented as precise.

## B. Software/regression audit

- [x] Round 1 isolated on `round/01-geographic-skeleton`.
- [x] `atlas-main` remains at the approved Round 0 commit.
- [x] No final episode prose or route playback introduced.
- [ ] Mobile map rendering checked at 375 px.
- [ ] Keyboard/focus checked.
- [ ] Offline fallback checked.
- [ ] Print impact checked.

## Decision

**FAIL / IN PROGRESS.**

Do not merge this round until sourced physical geometry is embedded and verified. This failure state is intentional: it prevents a visually plausible but unsupported map from becoming the foundation.

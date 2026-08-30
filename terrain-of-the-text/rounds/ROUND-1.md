# Round 1 — Geographic Skeleton

**Status:** IN PROGRESS — not approved, not mergeable.

## Objective

Establish physical geography that later episodes can depend on without moving the foundation.

## Approved source decisions

### Physical vectors

Use Natural Earth physical data as the broad regional base.

- Natural Earth raster/vector data are public domain.
- 1:50m is appropriate for broad biblical-world/regional views.
- 1:10m is available for tighter Levant views where coastline/water detail matters.
- Do not use Natural Earth modern political layers in the historical default map.

Sources:
- https://www.naturalearthdata.com/about/terms-of-use/
- https://www.naturalearthdata.com/downloads/50m-physical-vectors/
- https://www.naturalearthdata.com/download/downloads/10m-physical-vectors/

### Elevation

Use SRTM 1 Arc-Second Global as the primary elevation source for profiles and derived physical context. It is public domain and approximately 30 m sampling at the equator.

### Online enhancement

An unlabeled hillshade layer may be used as an **optional enhancement**, never as the sole geographic truth. The runtime must remain intelligible when the tile layer is unavailable.

## Anchor places approved for skeleton testing

These are representative points for rendering tests, not claims about the boundaries of ancient settlements.

- Jerusalem — 31.776667, 35.234167
- Tell es-Sultan / Jericho — 31.871719, 35.444564
- Nazareth — 32.702140, 35.297690
- Tell Balatah / Shechem — 32.213611, 35.281944
- Banias / Caesarea Philippi — 33.246111, 35.693333
- Tell Harube / ancient Gaza representative area — 31.504000, 34.464400; source itself notes approximately 1 km point precision

Coordinate cross-reference source: OpenBible.info individual place records; several records cite archaeological/gazetteer sources. Round 2+ may replace representative coordinates with stronger specialist records where needed.

## Explicitly not approved yet

- embedded coastline geometry
- Jordan River geometry
- Sea of Galilee / Dead Sea polygon geometry
- historical road geometry
- elevation contours or raster
- final map projection/zoom behavior

## Implementation rule

Do not code around missing physical geometry with a visually plausible hand drawing. Acquire, clip, simplify, and embed source geometry first; then render it.

## Next operation

Produce an embedded physical-geometry subset for the biblical-world extent, then validate visual alignment against the source before changing `index.html`.

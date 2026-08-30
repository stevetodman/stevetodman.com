# Round 1 Audit — Geographic Skeleton

**Status: PASS**

## A. Historical/geographic audit

- [x] Regional physical base is source-derived from GSHHG 2.3.6 and NOAA/NCEI ETOPO1; it is not hand drawn.
- [x] Modern political boundaries are excluded.
- [x] WGS84 coordinate framework and equirectangular display are explicit.
- [x] UI states that screen length is not travel distance.
- [x] Three secure anchor coordinates are recorded in `evidence/GEOGRAPHIC-BASE.md`.
- [x] Sychar remains unresolved/contested.
- [x] No ancient route or road geometry has been introduced.
- [x] Regional raster is explicitly limited to orientation; episode-scale terrain/elevation is deferred to higher-resolution data.

## B. Software/regression audit

- [x] Work remained isolated on `round/01-geographic-skeleton` until audit completion.
- [x] Production `main` was not modified.
- [x] Runtime is one self-contained HTML file with inline CSS/JS and embedded WebP physical base.
- [x] No external runtime HTTP dependency.
- [x] No `localStorage` or `sessionStorage`.
- [x] 375 px browser rendering tested with no horizontal overflow.
- [x] Tall-phone viewBox adapts without stretching geographic coordinates.
- [x] WGS84 anchor marker screen size remains constant through zoom.
- [x] Anchor labels remain hidden until deep zoom and have separate offsets for Jerusalem/Jericho.
- [x] Keyboard pan/reset and zoom/reset controls work.
- [x] Visible focus styling, reduced-motion rule and non-color uncertainty channels remain present.
- [x] Print media smoke test passes.
- [x] JavaScript runs without page errors in browser QA.
- [x] Uploaded runtime Git blob SHA exactly matched the locally computed Git blob SHA (`f22471e1543734de1a968d1d8587da3908035f3c`).

## Findings corrected during Round 1

1. Zoom originally enlarged SVG markers; marker/label transforms now compensate for map zoom.
2. Phone layout originally letterboxed the full regional extent; aspect-aware cropping/panning now preserves geometry.
3. Regional drainage was visually too dense; the source-derived raster was simplified for regional orientation.
4. Bathymetry competed with land relief; water is visually quiet and ETOPO1 is used primarily to express landform.
5. Jerusalem/Jericho labels collided at close scale; labels appear only at deep zoom with independent offsets.
6. The connected GitHub interface could not reliably transfer the larger embedded vector artifact. Rather than silently downgrade or corrupt it, Round 1 uses a small source-derived regional raster while preserving all site/route coordinates as WGS84 vector overlays.

## Decision

**PASS.**

Round 1 establishes the approved regional physical substrate and coordinate framework. Later rounds may add higher-resolution episode-specific terrain and evidence-backed vector overlays, but must not silently move the WGS84 foundation, add political borders, or infer ancient routes from the raster.

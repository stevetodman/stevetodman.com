# Geographic Base — Round 1

Verified 2026-08-30. This file records the provenance and display assumptions for the approved physical substrate.

## Geographic model

- Extent: 10°E–55°E, 20°N–45°N.
- Runtime coordinate system: WGS84 longitude/latitude.
- Display: equirectangular / plate carrée.
- Screen length is explicitly **not** treated as travel distance.
- On tall phones, the viewBox crops/pans the same coordinate space rather than stretching geography.

## Regional physical base

The Round 1 background is a **source-derived regional raster**, not a hand-drawn map.

It was rendered from:

- **GSHHG 2.3.6**, intermediate-resolution shoreline, lake and drainage geometry as packaged in `basemap-data` 2.0.0; and
- **NOAA/NCEI ETOPO1** global relief for broad terrain context.

The delivered runtime raster is 360×200 WebP embedded in the HTML. That small image is intentionally limited to regional orientation. It is **not** an episode-scale terrain source and must not be used to infer exact road placement, elevation profiles, travel distance, or site precision.

WGS84 place markers and all later route/site geometry remain vector overlays independent of the raster. Round 2 and later episodes may use higher-resolution terrain/elevation data without redrawing or moving the WGS84 coordinate framework.

No modern political boundaries are rendered.

### Source roles

**GSHHG**
- role: physical coastline, inland water and regional drainage reference
- runtime source version: 2.3.6
- license for packaged data: LGPL-3.0-or-later
- upstream: https://www.soest.hawaii.edu/pwessel/gshhg/
- NOAA shoreline information: https://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html

**ETOPO1**
- role: regional visual relief only
- status: NOAA public-domain / CC0 data; attribution retained
- https://repository.library.noaa.gov/view/noaa/1163
- https://catalog.data.gov/dataset/etopo1-1-arc-minute-global-relief-model

**SRTM**
- reserved for later episode-specific elevation work when appropriate
- https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm

## Secure anchor examples

These three markers test coordinate placement and responsive behavior. They are not an episode route.

| Place | WGS84 coordinate (lat, lon) | Status | Source role |
|---|---:|---|---|
| Jerusalem | 31.776667, 35.234167 | secure anchor | OpenBible.info modern identification; very high confidence |
| Jericho / Tell es-Sultan | 31.871719, 35.444564 | secure anchor | OpenBible.info modern identification; very high confidence |
| Caesarea Maritima | 32.500000, 34.891667 | secure anchor | OpenBible.info modern identification; very high confidence |

OpenBible is used here as a coordinate cross-reference for high-confidence anchors, not as final authority for disputed sites.

## Round 1 non-claims

The approved physical substrate does **not** establish:

- an ancient road or travel route;
- a political boundary;
- the identification of Sychar;
- the meaning of John 4:4;
- travel distance or travel time from screen geometry;
- episode-scale elevation.

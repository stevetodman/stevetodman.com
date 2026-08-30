# Decisions

## 2026-08-30 — governance for a single maintainer

- Git tags replace archived HTML snapshots.
- One audit per round contains both historical/geographic and software/regression review.
- No separate changelog.
- Ledger only contested and rejected claims; ordinary sourced facts carry citations/provenance where used.

## 2026-08-30 — staging location

Repository creation is not exposed by the connected GitHub interface, so the project is staged under `terrain-of-the-text/` on isolated atlas branches of `stevetodman.com`. Production `main` remains untouched. Intended permanent home: a dedicated `terrain-of-the-text` repository.

## 2026-08-30 — John 4 calibration correction

Do not present Samaritan-route avoidance as the normal Jewish travel pattern. Treat the force of John 4:4 as an interpretive question rather than a conclusion established by route geography.

## 2026-08-30 — Round 1 physical substrate

Use GSHHG for physical coastline/lake/drainage reference and NOAA ETOPO1 for broad relief. ETOPO1 is visual regional context only; reserve higher-resolution sources such as SRTM for episode-specific elevation work.

## 2026-08-30 — projection and mobile behavior

Use WGS84 coordinates in an equirectangular display. Never calculate travel distance from screen geometry. Tall screens crop/pan the same coordinate space rather than stretching it. Vector markers stay a stable screen size through zoom.

## 2026-08-30 — connector-safe regional raster

The full reviewed vector physical base exceeded the connected GitHub interface's reliable single-payload transfer size. Integrity checking caught the mismatch before it reached the branch. Round 1 therefore uses a source-derived 360×200 WebP regional background rendered from the same GSHHG/ETOPO1 inputs. This is an explicit scope tradeoff, not hidden approximation: the raster is for orientation only, while all sites/routes remain WGS84 vector overlays and episode-scale terrain will use higher-resolution data.

## 2026-08-30 — Round 2 route epistemics

John 4 receives a broad **schematic Samaritan corridor**, not an exact Jesus route. The line is built through representative control points that are not displayed as stops. This preserves the historically supported north–south corridor while refusing false itinerary precision.

Do not infer a Jerusalem departure or Nazareth destination from internal corridor control geometry. The UI labels Judea and Galilee as regions.

## 2026-08-30 — Round 2 local uncertainty grammar

- Mount Gerizim: secure = solid marker.
- Jacob's Well traditional location: probable/traditional = filled marker plus outer halo.
- ʿAskar and Tell Balata/Shechem: contested = hollow dashed markers.

This becomes the calibration grammar for later episodes: confidence must be readable through shape/pattern as well as color.

## 2026-08-30 — no John 4 elevation profile

Omit the elevation profile rather than manufacture precision. John does not identify the exact Judean departure point or a complete track. A future representative corridor profile requires an explicit methodology and must never be presented as Jesus' measured route.

## 2026-08-30 — route-specific vector detail is allowed

At John 4 scale the required GSHHG linework is small enough to embed directly as SVG vectors without hitting the repository connector ceiling. Episode-specific vector geography may therefore exceed the broad Round 1 raster in local detail while remaining in the same WGS84 coordinate framework.

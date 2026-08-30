# Verified Source Inventory — through Round 1

Verified 2026-08-30. These notes govern reuse and authority; they are not a claim that every record in a dataset is correct.

## Pleiades

**Use:** ancient places, names, identifiers, geometry, bibliographic cross-reference.

**License:** Creative Commons Attribution 3.0 (CC BY 3.0).

**Authority role:** strong scholarly gazetteer for ancient geography, especially Greco-Roman contexts. Individual records still require review when identification is disputed.

Sources:
- https://pleiades.stoa.org/downloads
- https://pleiades.stoa.org/help/using-pleiades-data

## OpenBible.info Bible Geocoding

**Use:** discovery, candidate identifications, coordinate cross-reference, and bibliography aggregation.

**License:** dataset described by the project as Creative Commons Attribution; individual embedded sources/images may have their own licenses.

**Authority role:** discovery/cross-reference layer, not final authority for contested identifications. The project itself states that errors almost certainly exist and provides source lists for individual places.

Round 1 uses it only for three high-confidence coordinate anchors (Jerusalem, Tell es-Sultan/Jericho, Caesarea Maritima), with exact runtime values recorded in `GEOGRAPHIC-BASE.md`.

Source:
- https://www.openbible.info/geo/

## GSHHG — Global Self-consistent, Hierarchical, High-resolution Geography Database

**Use:** Round 1 source-derived regional physical raster (shoreline, inland-water and drainage reference).

**Runtime version:** GSHHG 2.3.6 as packaged in `basemap-data` 2.0.0.

**License:** LGPL-3.0-or-later for the GSHHG-derived Basemap data assets.

**Authority role:** regional physical-geography reference only. It does not establish ancient political boundaries, exact ancient routes, or episode-scale elevation. Political-boundary layers are not rendered.

The current upstream GSHHG release is 2.3.7. Round 1 records the packaged version rather than implying that the embedded geometry is from 2.3.7.

Sources:
- https://www.soest.hawaii.edu/pwessel/gshhg/
- https://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html
- https://github.com/matplotlib/basemap/tree/v2.0.0/data/basemap_data

## NOAA/NCEI ETOPO1

**Use:** Round 1 regional visual relief in the source-derived raster.

**Status/license:** NOAA public-domain data; cataloged as CC0/public domain. Attribution to NCEI is retained.

**Authority role:** regional terrain context only. ETOPO1 is not used for episode-specific elevation statistics, walking calculations, or proof of an ancient route.

Sources:
- https://repository.library.noaa.gov/view/noaa/1163
- https://catalog.data.gov/dataset/etopo1-1-arc-minute-global-relief-model

## Digital Atlas of the Roman Empire (DARE)

**Use:** Roman-period place and road context where coverage is appropriate.

**License:** CC BY-SA 3.0.

**Authority role:** historical GIS/reconstruction aid. Because ShareAlike may matter for redistributed derivative data, do not copy DARE-derived geometry into the runtime without confirming the licensing consequence for the intended artifact.

Source:
- https://imperium.ahlfeldt.se/print.php?doc=info_api

## World Historical Gazetteer (WHG)

**Use:** cross-reference and discovery across historical gazetteers.

**License:** WHG aggregate is CC BY-NC 4.0; each contributed dataset retains its own license.

**Authority role:** index/aggregation layer. Reuse decisions must be made per constituent dataset, not from the WHG label alone.

Sources:
- https://whgazetteer.org/licenses/
- https://docs.whgazetteer.org/content/license.html

## SRTM 1 Arc-Second Global (USGS)

**Use:** later episode-specific elevation profiles and terrain-derived physical context when its resolution is appropriate.

**Status:** public domain; approximately 30 m spatial sampling at the equator for the 1-arc-second global product.

**Authority role:** physical elevation data, not evidence for ancient road choice.

Sources:
- https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm
- https://data.usgs.gov/datacatalog/data/USGS%3AEROS5e83a3ee1af480c5

## Ancient literary sources

Primary literary sources are used for historical travel/context claims, but must be interpreted narrowly. A statement about one group, route, period, or festival is not automatically a universal rule.

For John 4 calibration, Josephus, *Antiquities* 20.118 (traditional numbering varies by edition) reports that Galileans customarily traveled through Samaritan territory when going to Jerusalem for festivals.

Accessible text:
- https://penelope.uchicago.edu/josephus/ant-20.html

## Working source hierarchy

1. primary text / archaeological publication / specialist historical-geography work
2. scholarly gazetteer or primary dataset
3. specialist atlas/dictionary with explicit sourcing
4. aggregation/discovery layer
5. unsourced modern map or generic web page

Lower layers can point us toward evidence; they do not override stronger evidence merely by agreeing with each other.

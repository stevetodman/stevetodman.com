# Anatomica — Human Organ Atlas Ingestion Experiment

## Objective

Prove that Anatomica can reproducibly ingest a bounded, low-resolution representation of a real high-resolution human heart from the Human Organ Atlas (HOA) without downloading the full native dataset and without confusing an automated threshold surface with validated anatomy.

This is an engineering feasibility experiment, not an anatomical segmentation milestone.

## Primary source

Dataset: `LADAF-2021-17_heart_complete-organ_19.85um_bm18`

Reference DOI: `10.15151/ESRF-DC-1634390196`

Role in Anatomica: fine-anatomy reference and validation source. The donor is ex-vivo/fixed, so gross physiologic geometry remains primarily an in-vivo CMR problem.

## Method

Use the official `hoa-tools` package and the HOA chunked N5/Zarr representation.

The first pass requests pyramid level 4, which the upstream tooling guarantees for HOA volumes. Before computing the complete downsampled volume, the probe estimates its memory footprint and refuses the operation if it exceeds a fixed safety ceiling.

The experiment then:

1. inventories all LADAF-2021-17 heart datasets and their registration metadata;
2. fetches central orthogonal slices from the complete-organ source;
3. computes the bounded level-4 volume only if it passes the payload guard;
4. generates QA maximum-intensity projections and an intensity histogram;
5. tests a small family of threshold/connected-component envelopes;
6. exports at most three coarse GLB/PLY candidates for visual engineering review;
7. records provenance and explicitly marks all threshold-derived geometry as anatomically unvalidated.

## Guardrails

- Do not download native 19.85 µm whole-heart data merely because storage is available.
- Do not bulk-download all registered 2–6 µm ROIs.
- Do not call a threshold-derived surface myocardium, epicardium, chamber, valve, vessel, or septum without source-volume review and clinical/anatomical validation.
- Do not distort the in-vivo master geometry to match fixation-related chamber or vessel collapse.
- Preserve dataset identity, voxel size, pyramid level, coordinate/registration metadata, and derivation history in generated manifests.

If the bounded whole-volume payload exceeds the configured ceiling, the correct response is to implement slice/crop streaming or another lower-memory strategy—not to raise the limit reflexively.

## Expected artifact

The workflow artifact should contain:

- `REPORT.md`
- `heart_datasets.csv`
- `dataset_manifest.json`
- central axial/coronal/sagittal PNGs
- three maximum-intensity-projection PNGs
- `histogram.png`
- `surface_candidates.json`
- zero to three `candidate_surface_*.glb` files
- matching PLY files for desktop inspection

## Acceptance gate

The experiment passes when:

- anonymous, credential-free HOA access works;
- the complete-organ source is visible in orthogonal QA images;
- access remains bounded to an intentionally downsampled representation;
- registration metadata for the donor-specific ROIs can be inventoried;
- at least one useful coarse envelope can be extracted, or the failure mode is clearly documented;
- no automated output is represented as clinically validated anatomy.

Passing this gate does **not** approve a production heart.

## Next gate after success

Inspect the generated orthogonal images and surface candidates first. If they are useful, proceed one registered ROI at a time rather than downloading everything.

Recommended order:

1. whole-heart / myocardial envelope relationships;
2. atrioventricular junctions and valve complexes;
3. papillary muscles and chordae;
4. proximal coronary origins and course;
5. other internal structures only when they advance a defined educational interaction.

Known LADAF-2021-17 high-resolution references include approximately 6.36 µm and 2.256 µm cardiac ROIs. Their role is detailed structural validation, not replacement of physiologic gross geometry.

## Independent validation

The HOA inventory also contains a separately sourced tricuspid-valve ROI:

`S-20-28_heart_VOI-01-tricuspid-valve_12.02um_bm05`

This can later serve as an independent valve-anatomy comparison. It must not be represented as part of LADAF-2021-17.

## Relationship to the master strategy

The intended final reference architecture remains:

**in-vivo CMR gross geometry + HiP-CT fine anatomy + dynamic imaging for motion + expert review + structure-level provenance.**

This experiment validates only the HiP-CT ingestion leg of that architecture.

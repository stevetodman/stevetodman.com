# Anatomica Heart — Reference Anatomy Strategy

## Decision

Do not use a single dataset as the anatomical truth source.

Use a layered reference architecture:

1. **In-vivo whole-heart geometry:** HVSMR-2.0 near-normal CMR case(s) for physiologic chamber and great-vessel relationships.
2. **High-resolution tissue anatomy:** Human Organ Atlas (HiP-CT), especially LADAF-2021-17, for myocardium, valves, chordae, papillary muscles, coronary anatomy, conduction landmarks, and fine structural validation.
3. **Dynamic anatomy:** cine CMR / 4D cardiac CT / 3D echo sources for cardiac-cycle motion and valve kinematics.
4. **Population normalization:** Cardiac Atlas Project / additional normal cohorts to prevent overfitting to one donor.
5. **Semantic ontology:** stable structure IDs independent of any mesh names or source dataset.

## Why this is necessary

### HVSMR-2.0 strengths

- true in-vivo 3D CMR;
- near-isotropic acquisition;
- four chambers plus aorta, pulmonary artery, SVC, and IVC manually segmented;
- includes approximately normal connection-pattern cases;
- useful for physiologic whole-heart proportions and great-vessel relationships.

### HVSMR-2.0 limitations

- primarily blood-pool / great-vessel segmentation;
- no complete epicardial shell;
- no separately resolved valve leaflets, chordae, papillary apparatus, or coronary tree;
- insufficient as the final teaching model by itself.

### Human Organ Atlas / HiP-CT strengths

- whole human heart imaging at roughly 20 micrometers isotropic resolution;
- local zooms down to single-digit micrometer scale;
- direct visualization of myocardium, valves, chordae, papillary muscles, coronary arteries, and conduction-system anatomy;
- public, citable datasets with stable DOIs;
- well suited to anatomical validation and fine-detail reconstruction.

### Human Organ Atlas limitations

- ex-vivo, fixed tissue;
- chambers and vessels can collapse or deform during preparation;
- therefore should not replace in-vivo geometry as the sole gross-shape reference.

## Primary high-resolution reference candidate

**LADAF-2021-17**

- adult male donor, age 63;
- no known cardiac disease reported in the HiP-CT heart study;
- full heart available in Human Organ Atlas;
- complete heart overview at approximately 19.85 micrometers/voxel;
- high-resolution local cardiac zooms are available;
- this source is appropriate for fine anatomy validation, not unmodified gross-shape transplantation into the in-vivo master model.

Primary complete-heart DOI:

`10.15151/ESRF-DC-1634390196`

Known local cardiac zoom DOIs include:

- `10.15151/ESRF-DC-1659302250`
- `10.15151/ESRF-DC-1659302202`

## Model construction principle

The master heart should be a **medically reviewed composite reference model**, not a literal segmentation from a single patient.

### Layer A — Gross geometry

Derive from the best HVSMR-2.0 near-normal in-vivo case after visual and quantitative review.

Target structures:

- LV
- RV
- LA
- RA
- aorta
- pulmonary trunk / branch PAs
- SVC
- IVC
- pulmonary venous connections

### Layer B — Myocardial shell

Construct a coherent epicardial and myocardial surface using the in-vivo CMR as the gross envelope while validating wall topology, grooves, septal relationships, and ventricular morphology against HiP-CT.

### Layer C — Valve complexes

Build the four valves as separate semantic objects.

Do not infer leaflet anatomy from HVSMR blood-pool boundaries.

Use HiP-CT and, where useful, 3D echo / dedicated valve imaging as anatomical references for:

- leaflet number and topology;
- commissures;
- annular relationships;
- papillary muscles;
- chordae;
- semilunar sinuses and leaflet attachments.

### Layer D — Coronary anatomy

Use high-resolution anatomical data for origins and proximal course. Do not create a falsely universal distal coronary tree from one donor. Distinguish canonical teaching anatomy from patient-specific variants.

### Layer E — Motion

Keep motion separate from static geometry.

Possible later sources:

- cine CMR for ventricular motion;
- 4D cardiac CT for high-spatial-resolution cardiac-cycle surface motion;
- 3D/4D echocardiography for valve motion.

The static master topology should support morph targets or skeletal/deformation fields later.

## Provenance architecture

Every semantic structure should carry source metadata.

Example:

```json
{
  "id": "mitral-valve",
  "displayName": "Mitral Valve",
  "geometrySource": "composite",
  "grossGeometryReference": "HVSMR-2.0 selected near-normal case",
  "fineAnatomyReference": "Human Organ Atlas LADAF-2021-17",
  "motionReference": null,
  "reviewStatus": "pending-clinician-review",
  "confidence": "high"
}
```

Never imply that a composite structure was directly segmented from a source if it was reconstructed or artistically retopologized.

## Acceptance gates

### Gate 1 — Gross anatomy

Before valves, textures, or animation:

- unmistakably human cardiac silhouette;
- RV anterior to and wrapping the LV appropriately;
- correct LV apex contribution;
- realistic atrial appendage placement;
- correct aorta / pulmonary trunk spatial relationship;
- correct caval and pulmonary venous entry relationships;
- no disconnected vessels;
- no cartoon primitives.

### Gate 2 — Internal anatomy

- anatomically credible septum;
- correct AV-valve offset;
- correct ventricular inflow/outflow relationships;
- papillary muscles and chordae where educationally relevant;
- semilunar valves positioned within the appropriate roots.

### Gate 3 — Surface realism

- plausible epicardial contour;
- AV and interventricular grooves;
- coronary vessels seated on the epicardial surface;
- no visually plastic or inflated-object appearance.

### Gate 4 — Interaction

Only after Gates 1–3 pass:

- real mesh raycasting;
- semantic selection;
- camera focus;
- clipping;
- exploded views;
- labels;
- motion.

## Current engineering task

The HVSMR evaluation workflow should remain in place and rank the near-normal CMR candidates. Its output is one input to the decision, not the final decision.

In parallel, create a second pipeline for Human Organ Atlas that:

1. retrieves the lowest practical-resolution version of LADAF-2021-17;
2. creates preview volumes and orthogonal sections;
3. establishes a reproducible path from volume to segmentation / mesh;
4. identifies the valve complexes, myocardium, papillary muscles, chordae, and proximal coronaries;
5. preserves original coordinate space and provenance;
6. avoids downloading hundreds of gigabytes until a low-resolution proof-of-concept is validated.

## Strategic conclusion

The most defensible Anatomica master heart is not "MRI vs CT vs artist model."

It is:

**in-vivo CMR geometry + ex-vivo HiP-CT fine anatomy + dynamic imaging for motion + expert review + explicit provenance.**

This gives the project both anatomical credibility and a path to a visually exceptional interactive model without allowing the limitations of any one modality to define the final product.

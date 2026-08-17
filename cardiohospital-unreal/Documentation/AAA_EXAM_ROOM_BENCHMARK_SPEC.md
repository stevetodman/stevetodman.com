Exit code: 0
Wall time: 0.4 seconds
Output:
# CardioHospital Unreal — Pediatric Cardiology Exam Room Benchmark

Status: authoritative environment proposal pending clinical-layout and reference-board approval.

## Product decision

Unreal Engine remains the primary immersive runtime. Next.js, React, and TypeScript remain appropriate for conventional application surfaces, authoring tools, analytics, and curriculum interfaces. Blender and texture-authoring tools produce source assets; Unreal owns final lighting, materials, interactions, packaging, and performance evidence.

The simulator must prove one photoreal pediatric cardiology exam room before expanding its environment scope.

## Scope lock

Build only:

1. One pediatric cardiology exam room.
2. A shallow waiting-area vignette visible through the open doorway.
3. The architectural elements and equipment visible from three locked benchmark cameras.

Do not build:

- A complete hospital.
- A traversable corridor.
- Team rooms, cafeterias, elevators, parking, lobbies, or multiple floors.
- Rooms outside the benchmark sightlines.
- Additional standalone hero props until the architectural shell, lighting, and reference palette pass their first review.

The clinical case runtime remains authoritative and unchanged. Reducing environment breadth must not alter deterministic clinical logic or generated clinical data.

## Visual objective

A pediatric cardiologist viewing portions of the three benchmark images should plausibly interpret them as photographs of a coherent contemporary outpatient exam room.

The target is restrained clinical realism:

- Neutral hospital color response.
- Correct real-world scale.
- Subtle material variation.
- Clean, maintained surfaces without artificial grunge.
- Soft indirect illumination and controlled daylight.
- No game-like bloom, oversaturation, crushed blacks, or cinematic teal/orange grading.

## Reference gate

No production architecture or material is approved until a single coherent reference board is accepted. The board must cover:

- Room proportions and equipment clearances.
- Painted drywall and wall-protection system.
- Door, frame, glazing, and hardware.
- Baseboard, chair rail, corner guards, and trim transitions.
- Medical LVT or sheet-vinyl flooring.
- Acoustic ceiling grid, tiles, troffers, supply/return grilles, sprinkler heads, speakers, and sensors.
- Casework, counters, sinks if present, electrical outlets, data plates, and medical-gas provisions if present.
- Daylight direction, LED color response, and exposure.
- Pediatric visual accents that do not make the room look themed or toy-like.

Every external reference or source asset must have recorded provenance and license status. Manufacturer marks and institution-specific branding are prohibited unless explicitly licensed and requested.

## Provisional measured shell

These dimensions are a greybox starting point, not a claim about a specific institution. They require clinical-layout review before production modeling:

- Interior clear width: 4.27 m.
- Interior clear depth: 3.96 m.
- Finished ceiling height: 2.74 m.
- Door clear opening: 0.91 m × 2.13 m.
- Exterior window opening: approximately 1.80 m × 1.20 m, subject to the chosen references.
- Ceiling module: 0.61 m grid unless the approved reference uses another system.

World convention:

- Room center at world origin.
- `Z` up.
- Centimetres in Unreal; metres in Blender source.
- Finished floor at `Z = 0`.
- Major architectural pivots at logical installation points.

The greybox must include clearance envelopes around the exam table, door swing, parent chair, clinician stool, workstation, ECG station, and blood-pressure station. These envelopes are review aids and must not ship visibly.

## Required environment

### Architecture

- Hospital-grade painted drywall with physically plausible edge radii and construction transitions.
- Wall protection/chair rail.
- Resilient baseboard system.
- Corner guards at exposed outside corners.
- Realistic door leaf, frame, closer, hinges, lever, kick plate, seals, and glazing where supported by references.
- Exterior window, sill, frame, shade, and controlled exterior backdrop.
- Medical LVT or sheet vinyl with subtle cleaning sheen and no dirt overlay.
- Acoustic ceiling grid and tile system.
- Recessed or surface troffer LED fixtures.
- HVAC supply and return elements.
- Sprinkler head, speaker, smoke detector/sensor, and other visible ceiling hardware supported by references.
- Electrical receptacles, data plates, switches, and wall penetrations at credible heights.

### Hero assets

- Pediatric exam table.
- ECG workstation.
- Physician workstation.
- Blood-pressure station.

### Medium assets

- Parent chair.
- Physician stool.
- Cabinets and counters.
- Computer hardware and input devices.

### Background assets

- Waste and sharps containers where clinically appropriate.
- Paper products and dispensers.
- Limited organized supplies.
- Ceiling hardware and wall plates.

Existing exam-table and ECG assets are provisional. Studio renders do not constitute approval. Each must be reassessed for silhouette, dimensions, materials, functional construction, and clinical plausibility inside the benchmark room.

## Locked benchmark cameras

Camera transforms are finalized after greybox review and then version-controlled. The intent is fixed even if provisional coordinates change:

1. **Doorway establishing view** — shows the exam table, window/daylight direction, parent seating, provider zone, and enough doorway context to communicate a hospital without constructing a corridor.
2. **Patient-side view** — tests the exam table, ECG station, wall system, ceiling, material scale, and conversation-distance realism.
3. **Provider-workstation view** — tests casework, computer equipment, ECG/blood-pressure integration, doorway vignette, and close material response.

Every environment milestone must render all three cameras at 2560 × 1440 using identical exposure, tone mapping, and scalability settings.

## Material system

The room palette is reference-driven. A generic material is not approved merely because it is technically PBR.

Each production material must record:

- Real-world texel scale.
- Base color within plausible measured/reference ranges.
- Roughness response under both daylight and clinical LEDs.
- Normal intensity appropriate to viewing distance.
- Metallic value consistent with the physical substrate.
- Source and license provenance.
- Unreal material-instance parameters.

Required initial materials:

- Painted drywall.
- Wall protection polymer.
- Resilient baseboard.
- Medical sheet vinyl or LVT.
- Acoustic ceiling tile.
- Powder-coated metal.
- Brushed stainless steel.
- Molded ABS.
- Medical vinyl upholstery.
- Rubber.
- Anti-glare display glass.
- Cabinet laminate and countertop surface chosen from the approved references.

Packed textures may use `R = AO`, `G = Roughness`, `B = Metalness` where appropriate. Large tiling textures must be seam-safe and should use detail normals or macro-variation only when visible and justified.

## Lighting and color pipeline

- Unreal owns the final lighting decision.
- Use physically plausible area and emissive dimensions for troffers.
- Include controlled daylight contribution through the window.
- Establish soft indirect bounce without flattening contact shadows.
- Maintain neutral clinical whites and believable skin response.
- Use one locked exposure strategy for benchmark review.
- Use restrained reflection capture and surface roughness; do not make every clean surface glossy.
- Avoid decorative colored lighting unless visible in approved references.

The lighting pass is reviewed before set dressing. Props must not be used to hide weak architecture or lighting.

## Technical requirements

Every hero asset requires:

- Real-world dimensions and documented pivot.
- Clean topology and smoothing.
- Separate functional components where interaction or animation may require them.
- UV0 plus a valid lightmap strategy.
- PBR material assignments.
- Editable Blender source.
- Unreal-ready FBX and portable GLB preview.
- Custom collision where automatic collision is inadequate.
- Semantic names and an asset manifest.
- LOD or Nanite strategy based on measured performance, not assumption.

Architecture requires:

- Modular seams placed at credible construction boundaries.
- No light leaks at wall/ceiling/floor intersections.
- Correct face orientation and collision.
- Reusable wall, trim, ceiling, and floor modules without obvious repetition from benchmark cameras.
- Clean transitions around doors, windows, casework, outlets, and wall protection.

## Performance gate

Target stable 60 FPS at 2560 × 1440 on the approved RTX 4080-class benchmark configuration, using a packaged build.

Record at minimum:

- Average FPS and p95 frame time.
- GPU and game-thread frame time.
- Peak GPU memory.
- Draw calls and visible triangle count from each locked camera.
- Shadow, reflection, Lumen, translucency, and material costs sufficient to identify the limiting subsystem.

No screenshot can approve the room if the corresponding packaged camera view fails the performance gate.

## Review milestones

### Gate 0 — References

- Coherent reference board accepted.
- Provisional dimensions reviewed.
- Material palette and license ledger established.

### Gate 1 — Architectural greybox

- Complete measured shell.
- Doorway waiting-area vignette limited to the sightline.
- Clearance envelopes reviewed.
- Three benchmark cameras locked.
- No additional prop production authorized yet.

### Gate 2 — Architecture and lighting

- Walls, protection, trim, floor, ceiling, doors, window, outlets, casework, and ceiling hardware complete.
- Material scale and roughness approved.
- Lighting/color pipeline approved from all cameras.

### Gate 3 — Integrated hero assets

- Exam table, ECG, provider workstation, and blood-pressure station reassessed and integrated.
- Existing provisional assets either pass, receive a rework plan, or are rejected.

### Gate 4 — Medium/background dressing

- Seating, computer hardware, supplies, and waste systems added sparingly.
- No clutter used to compensate for weak architecture.

### Gate 5 — Packaged benchmark

- All three cameras pass clinical, visual, and performance review.
- Screenshot evidence and profiling evidence recorded against the same commit and package.
- Only this gate authorizes consideration of another room.

## Required deliverables

- Approved reference board and provenance ledger.
- Dimensioned room plan and clearance diagram.
- Architectural asset inventory.
- Material inventory.
- Hero/medium/background asset inventory.
- Naming standard and folder map.
- Missing-asset list with priorities.
- Three locked benchmark camera definitions.
- Greybox renders.
- Architecture/lighting renders.
- Final packaged benchmark renders and performance evidence.
- Explicit clinical-layout and visual-review decisions.

## Immediate next action

Do not generate another standalone prop or generic material pack.

Create the measured architectural greybox and three provisional benchmark cameras first. Render the three views with neutral temporary materials. Review proportions, equipment zones, doorway sightline, window contribution, and clinical clearances. Only after Gate 1 passes should the room-specific material palette and production architecture begin.


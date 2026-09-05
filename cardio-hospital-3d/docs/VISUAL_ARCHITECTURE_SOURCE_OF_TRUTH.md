# Hospital Visual Architecture — Astra Source of Truth

Status: **ACTIVE DESIGN SPECIFICATION**  
Captured: 2026-09-04  
Scope: `cardio-hospital-3d/` visual production architecture, proof scene, mobile performance, and progressive replacement of procedural graphics.

## Authority and continuity

This document preserves the full Astra assessment accepted by the owner on 2026-09-04 as the governing visual-architecture specification.

- Root `MASTER_PLAN.md` remains the canonical cross-window **program-state/resume** document.
- `cardio-hospital-3d/AGENTS.md` remains the hospital-local operating contract.
- This file is the canonical **visual-architecture/design source of truth** for the HospitalSim graphics replacement program.
- Future agents must not silently replace this plan with another realism pass, renderer migration, or ad-hoc asset strategy.
- Implement the phases in order unless the owner explicitly supersedes this plan or measured proof-scene evidence triggers one of its stated reversal criteria.
- Historical SHAs and verification statements below describe the repository state Astra inspected. Current executable state must always be reconciled against `MASTER_PLAN.md` and current `main` before work begins.

---

## 1. Main conclusion

**Keep React Three Fiber, Three.js, WebGL, and the canonical clinical engine. Replace the visual production architecture.**

The winning system is an **authored modular hospital with baked environmental lighting, a small shared material library, and properly modeled, lightly animated humans**. Procedural code should assemble approved assets and project clinical state into the scene.

The largest improvement will come from three decisions:

1. **Author recognizable forms:** human anatomy, furniture silhouettes, equipment, and architectural edges.
2. **Calculate most environmental lighting offline:** spend mobile rendering capacity on people and interaction.
3. **Treat a room and its encounter as the unit of production:** art, lighting, loading, collision, and interaction must agree.

This is a substantial replacement of the graphics layer, not a renderer migration.

**Evidence boundary:** Astra read the three required documents in order, inspected then-current `main` at `b655f33433f922294076c72332e027becb9971c5`, reviewed the world implementation, dependencies, assets, controls, and open work, and viewed the production corridor. That SHA had successful Cloudflare and exact-production/browser checks. PR #189 separately addressed landscape Pager scrolling. Astra did **not** measure physical-iPhone performance or visually inspect every room and actor. The budgets below are proposed targets, not measured results.

No implementation code was written as part of the assessment.

## 2. What the current approach gets wrong

**It uses object count as a substitute for art direction.** Many additions are sensible individually, but their accumulation does not produce coherent realism.

The implementation Astra inspected contained:

- R3F 9.7.0, Three.js 0.185.1, Drei 10.7.8, and React Three Rapier 2.2.0.
- Nineteen ceiling point lights, ambient lighting, and one directional light with a 2048² shadow map.
- A new geometry and material for each `Box` or `Cylinder`; both primitives cast and receive shadows by default.
- Human bodies assembled from separate primitives, with a second file overlaying details onto the clinician.
- No authored model, texture, or animation assets in the canonical hospital’s public directory.
- No implemented room streaming, authored LOD pipeline, baked lighting, or environment-map lighting.
- Delayed world loading after entry — a good decision worth preserving.

These were source findings, not measured draw-call or GPU-cost claims.

Astra's perceptual ranking:

| Rank | Bottleneck | Root cause |
| --- | --- | --- |
| 1 | Human silhouettes and anatomy | Disconnected primitives cannot convincingly express shoulders, pelvis, joints, clothing, or seated posture. Facial additions cannot repair the body. |
| 2 | Lighting and contact | Fixture lights, ambient fill, and a broad directional shadow lack a coherent interior-lighting model. The production corridor visibly has an outdoor-like diagonal shadow. |
| 3 | Geometry and material response | Perfect box edges and largely uniform surfaces omit the highlights, seams, curvature, and finish differences that communicate manufactured objects. |
| 4 | Architectural composition and scale | Rooms are coordinate assemblies rather than resolved clinical spaces. Source dimensions include 6.2 × 6 m exam rooms and a 4.5 m corridor; generous spaces require deliberate furnishing and camera composition to avoid emptiness. |
| 5 | Animation and social presence | Actors have no convincing breathing, gaze, posture changes, or conversational timing. More polygons alone will not make them feel present. |
| 6 | Clinical authenticity | Equipment symbols exist, but placement, mounting, reachable work surfaces, privacy, and actual use need to form a believable workflow. |
| 7 | World/UI integration and camera | Billboard-like room signs dominate the corridor. Fixed camera framing and overlay composition have not been designed together across orientations. |
| 8 | Repetition and detail hierarchy | Mirrored rooms and repeated fixtures expose the construction method. Added small details compete with larger unresolved forms. |

**The fundamental mistake is not using procedural geometry. It is doing final asset production through runtime JSX without an art-production boundary.**

## 3. Three competing architectures

These are different end states, not quality presets.

| Criterion | A. Compiled procedural hospital | B. Authored modular 3D hybrid | C. Staged encounter environments |
| --- | --- | --- | --- |
| Approach | Parameterized generators produce finished meshes offline; runtime assembles them | Authored room kits, equipment, humans; baked lighting; lightweight runtime | Fixed or constrained viewpoints with prerendered environments and selective real-time humans/objects |
| Visual ceiling | Good for architecture; weakest for humans and organic forms | **Highest useful ceiling for this product** | Excellent within approved views; weak under unrestricted movement |
| Sustained iPhone performance | Good after compilation and batching | Good with bounded room residency and lighting | Excellent for mostly static scenes; video/transparency can erode advantage |
| Memory | Low–moderate | Moderate and controllable | Low per view; grows with view/state variants |
| Download/loading | Small geometry; textures still matter | Moderate; shared assets amortize across encounters | Small first view; many images or clips accumulate |
| Engineering burden | High generator/tooling burden | Moderate integration burden | Moderate initially; high for spatial/state combinations |
| Asset-production burden | Lower for repeated hard surfaces; humans remain difficult | Highest initial art investment; strong reuse afterward | High per-view authoring and compositing |
| Larger hospital | Easy geometric expansion, repetitive appearance | Strong through room families and shared equipment | Easy destination expansion; weaker spatial continuity |
| Maintainability | Text-friendly but generator complexity grows | Good with narrow asset contracts | Good until interaction variants multiply |
| AI-agent maintainability | Strong for parameters; weaker for visual quality | Strong for assembly; limited for sculpting/rig repair | Strong for state routing; weaker for visual compositing |
| Debt risk | Building a bespoke modeling system | Opaque assets and fragile exports | Combinatorial visual states and navigation exceptions |

**Winner: B.**

A is useful **inside** B for repeatable architectural components. C contributes encounter framing and optional distant backdrops, but replacing free movement would change the product too much.

An editor-centric engine migration would still require essentially B’s assets. It adds integration cost without solving the dominant perceptual problems.

## 4. Winning architecture and why

Build a **small, authored visual vocabulary**:

- One room-shell family.
- One coordinated finish palette.
- A handful of clinically recognizable furniture/equipment assets.
- One compatible character family.
- One reproducible lighting/export recipe.

Rooms compose those assets. The clinical engine remains authoritative for identity, presence, encounter state, and events.

| Foundation | Decision | Reason |
| --- | --- | --- |
| React Three Fiber | **Keep** | Fits the existing React product. Use it for composition and lifecycle; keep continuous animation out of React state updates. |
| Three.js | **Keep** | Already supports the required materials, skinning, animation, instancing, and compressed glTF assets. |
| Current WebGL renderer | **Keep for the proof scene** | The proposed visual gains do not require WebGPU. Establish an optimized scene before deciding whether renderer overhead is the limiting factor. |
| Rapier | **Keep, narrowly** | Existing movement/collision has accepted behavior. Preserve simple explicit colliders; do not derive collision from detailed furniture meshes. |

WebGPU is a legitimate future option: Safari 26 supports it, and Three.js’s `WebGPURenderer` offers a WebGL2 fallback. That does **not** establish a performance win for this scene or make migration costless. Revisit only if the completed proof scene shows a relevant bottleneck on the intended phones.

### Six-month regret test

| Likely regret | Change the architecture now |
| --- | --- |
| Every room duplicates textures and characters | Shared asset URLs and material families; separate reusable props from room-specific baked surfaces. |
| Lighting changes require mysterious manual steps | One pinned export/bake recipe; editable source files and one documented example room. |
| Agents cannot modify binary assets | Keep assembly and anchors in readable data; generators for suitable hard surfaces; explicit artist ownership for humans. |
| Static bakes leave shadows after a parent disappears | Never bake state-dependent actors or movable props into the room. |
| Adjacent rooms cause loading stalls or memory growth | Bound residency, share resources, and verify repeated entry/exit — not merely first load. |
| Each asset arrives in a different style | One art owner accepts every asset against the same room, lighting, and character reference. |
| Attractive models block traversal | Visual geometry, collision proxies, and interaction anchors have distinct roles and shared placement authority. |

The hard boundary is **clinical state → visual projection**. Animation must never become a second clinical state machine.

## 5. Top 10 improvements by perceptual ROI

Scores are judgment estimates: **10 means more** gain, effort, cost, or risk. Ranking considers the complete cost, dependencies, and reuse — not an artificial precision-weighted formula.

| Rank | Improvement | Visual gain | Engineering effort | Asset effort | Runtime cost | Debt risk |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Resolve scale, composition, and visual hierarchy | 8 | 2 | 2 | 1 | 1 |
| 2 | Replace fixture-light accumulation with baked room lighting | 9 | 4 | 4 | 1 | 2 |
| 3 | Shared finish palette, bevel rules, normals, and roughness | 8 | 3 | 4 | 1 | 2 |
| 4 | Integrate physical signage and interaction affordances | 6 | 3 | 2 | 1 | 2 |
| 5 | Replace detail meshes with shared/batched assets and atlases | 6 | 4 | 2 | 1 | 2 |
| 6 | Author the few furniture/equipment silhouettes users inspect | 8 | 3 | 6 | 2 | 2 |
| 7 | Replace primitive people with a coherent human family | 10 | 4 | 7 | 3 | 3 |
| 8 | Add restrained breathing, gaze, and conversational movement | 8 | 4 | 4 | 3 | 3 |
| 9 | Bound room residency and compress delivered assets | 6 | 5 | 2 | 1 | 3 |
| 10 | Compose encounter camera/UI views together | 6 | 4 | 3 | 2 | 3 |

Rank does not equal implementation order: **the human solution belongs in the first proof**, despite its higher production cost.

The nonlinear payoffs are:

- **Better geometry plus coherent lighting:** bevels suddenly become visible and materials become distinguishable.
- **A credible human plus tiny movements:** the whole room feels inhabited.
- **Room-based visibility:** quality can increase without rendering the entire hospital.
- **Shared assets:** the second good encounter becomes much cheaper than the first.

## 6. Character solution

**Use one art-directed, rigged character family, starting with an adult and an adolescent base.** Do not produce children by uniformly shrinking adults. Younger pediatric bodies need appropriate proportions when those cases actually require them.

Minimum viable specification:

- Approximately **12–25k triangles per nearby person** as a starting allocation.
- Roughly **40–65 bones**, with no requirement for elaborate finger or facial rigs.
- **Two or three material slots** per character.
- A shared skeleton convention, clip naming, scale, and export process.
- Modest face topology with a readable nose, jaw, eyelids, and mouth.
- Opaque hair masses; carefully limited cutouts only when necessary.
- Clothing shaped as clothing: shoulders, sleeve volume, hems, and a few baked folds.
- A small set of deliberate body, face, hair, skin, and clothing variants.

These are asset targets, not minimum counts needed to look human.

### Movement worth building

- Standing, seated, and lying idle.
- Subtle breathing without scaling the entire body.
- Blinking and bounded head/eye attention.
- A few nods and conversational gestures.
- Authored pose transitions where visible transitions actually matter.
- One or two clinical actions using known body/equipment attachment points.

Use pose-specific breathing and restrained, asynchronous idle timing. An idle animation must not accidentally imply respiratory distress or another clinical finding.

For contact, start with authored hand placement and attachment sockets. Introduce limited two-bone IK only where a demonstrated mismatch warrants it.

**Do not build initially:** full lip synchronization, facial capture, individual finger articulation, cloth simulation, strand hair, crowd locomotion, arbitrary procedural examinations, or a character creator.

The best procurement route is a compatible licensed base or focused artist engagement, followed by adaptation and optimization. Select the source **after inspecting its topology, licensing, rig, and phone rendering**; no particular asset pack is established as suitable by this assessment.

## 7. Environment/material/lighting solution

### Geometry and room composition

Author door assemblies, cabinetry, examination furniture, chairs, sinks, and the few clinically important devices. Use procedural assembly for wall lengths, repetition, and placement.

Spend geometry on silhouettes and highlight-catching edges. Put labels, seams, small controls, and shallow finish detail into textures.

The source already has clinical fixtures. The next step is to make them form a plausible room:

- A clear route from doorway to patient.
- A believable clinician working position.
- Parent seating with privacy and sightlines.
- Hand hygiene located where it makes sense.
- Usable clean work surfaces and storage.
- Equipment mounted and oriented toward its user.
- Pediatric warmth through restrained color, art, and family accommodation.

Do not add inpatient headwall equipment indiscriminately to every outpatient room. General outpatient design guidance supports coherent circulation, privacy, adaptability, and patient comfort; it is not a substitute for pediatric clinician review.

### Materials

Use a small metallic/roughness PBR library for painted surfaces, laminate, resilient flooring, upholstery, plastic, and exposed metal.

- Real bevels on prominent edges; baked normals for smaller detail.
- Consistent texel density, with additional resolution reserved for close inspection.
- Predominantly 512–1024 textures; 2048 only when its visible benefit survives phone inspection.
- Shared trim sheets and small graphic atlases.
- Subtle roughness variation; no universal grime treatment.
- Opaque materials by default.
- Separate color textures from linear normal/roughness data.

### Lighting

Bake static fixture illumination and indirect light into room-specific lighting textures. Keep albedo separate for surfaces that need meaningful material response.

Use standard Three.js lightmaps where practical, with one tightly defined binding convention. **A Blender export does not automatically deliver an operational Three.js lightmap pipeline**: the additional UV channel, texture binding, encoding, and intensity convention must be proved explicitly. Blender area/world lighting also does not simply export as equivalent glTF lighting.

The runtime recipe should be small:

- Emissive-looking fixture surfaces.
- A restrained indoor environment map.
- One dominant real-time key where needed, excluded from the corresponding baked contribution.
- At most one additional local fill in the proof scene.
- Baked static contact, plus simple dynamic grounding for people.
- One optional tightly bounded shadow map for nearby actors.

Explicitly calibrate baked light, environment contribution, and runtime light together to prevent double lighting. Highly matte background surfaces can use baked unlit materials when visually equivalent; do not force every surface through the richest shader.

Avoid real-time reflection captures. A modest room-family environment map is enough initially. Bake or cheaply suggest reflections on background surfaces; reserve actual material response for objects where motion makes it perceptually useful.

### Runtime organization

- Merge static geometry **within a room and material group**, not across the hospital.
- Instance repeated props where their lighting/material treatment permits it.
- Start with active-room-plus-neighbor visibility.
- Use ordinary frustum culling; do not confuse it with wall occlusion.
- Add simple distance LOD only for assets that need it.
- Stop offscreen animation updates.
- Preserve collision and canonical state independently of visual loading.

### Production stages

| Stage | Work |
| --- | --- |
| Offline/content | Modeling, clinical/art review, UVs, normals, lighting bake, rigs, clips, provenance |
| Asset build | Validate glTF, remove unused content, deduplicate, compress, generate needed LODs |
| Initial page load | Existing entry interface and clinical shell |
| Enter hospital | Shared essentials, spawn area, controls/collision, visible actors |
| Deferred load | Adjacent room, next encounter, optional detail |
| Runtime | Canonical-state projection, bounded animation, visibility, small lighting set, quality scaling |

Prefer Meshopt as the initial geometry/animation compression choice and KTX2/Basis for suitable textures; compare alternatives only if measurements justify it. These capabilities already exist in the ecosystem.

Use ordinary versioned asset URLs and browser caching first. A new offline asset-management system is not part of the proof.

## 8. Physical-iPhone performance envelope

Choose the oldest supported physical iPhone before finalizing these budgets. Until then, these are conservative **planning ranges**, not universal limits.

| Metric | Meaningful target | Warning threshold |
| --- | --- | --- |
| Sustained rendering | Stable 30 FPS floor; 60 FPS preferred where sustainable | Persistent sub-30 FPS or noticeable degradation during a 15–20-minute encounter |
| Frame pacing | Mostly near 33.3 ms at 30 FPS or 16.7 ms at 60 FPS | Repeated >50 ms frames during movement; transition hitches around 100 ms or more |
| Total draw calls | Approximately 80–150 per rendered frame, including extra passes | Sustained >250 |
| Visible triangles | Approximately 150–300k in a normal encounter | >500k without measured justification |
| Resident texture allocation | Approximately 48–96 MiB, including mips and environment/lightmaps | >128 MiB, or increasing allocation on repeated visits |
| Visible material instances | Approximately 15–30 with few shader variants | >50 or many nearly identical variants |
| Runtime direct lights | 1–2 | >4 affecting the scene |
| Shadowed lights/casters | 0–1 shadowed light; roughly 2–6 nearby important casters | Whole-hospital shadows or more than roughly 10 meaningful dynamic casters |
| Cold entry shell | Approximately 0.2–0.5 MB transferred | >1 MB before entering |
| First playable area | Approximately 3–6 MB additional, including required runtime/assets | >10 MB before movement |
| Deferred room | Approximately 1–3 MB incremental with shared assets cached | >5 MB per ordinary room |
| Initial proof experience | Approximately 8–15 MB total transferred | >25 MB without a clearly visible return |
| Time to interaction | Entry UI within ~2 s; playable scene ~3–5 s after entry on a declared representative connection | Repeated >8 s entry or blocking doorway loads |

The repository’s roughly 176 KB entry measurement is historical shell evidence, **not the current complete hospital payload**.

True constraints are:

- Actual device/browser resource limits.
- Correct state and usable controls.
- No unrecoverable context loss, tab termination, or missing critical content.
- The chosen frame deadline, if claiming a particular FPS.

There is no defensible universal “iPhone triangle limit” or guaranteed browser memory allowance.

Start quality scaling with render resolution, optional shadows, and distant detail. Keep DOM text and touch targets sharp. The then-current maximum DPR of 1.65 renders approximately **2.72 times as many pixels as DPR 1** at the same CSS size.

Use sustained frame timing as a signal; do not claim browser access to native thermal telemetry. Judge heat and battery on the actual phone. Apple’s performance guidance emphasizes frame pacing and device-specific settings, but native Metal capabilities are not automatically available to this web app.

## 9. Unknown unknowns

Astra temporarily discarded the authored-hybrid preference and considered these alternatives seriously.

| Possibility | Why it could win | Decision |
| --- | --- | --- |
| **Design the building to limit simultaneous visibility** | A plausible vestibule, bend, or doorway can remove more rendering work than elaborate LOD technology | **Keep.** Apply only where circulation remains clear; no contrived obstacles. |
| **Give encounters intentional camera compositions** | Once conversation begins, a comfortable framing makes humans larger and the environment more controlled | **Keep selectively.** Preserve free exploration and user control; test comfort and orientation behavior. |
| **Render less while the learner thinks** | Reading a clinical panel may occupy more time than walking. Reducing hidden-world rendering improves energy per completed encounter | **Keep.** Domain time, persistence, audio, and clinical events remain independent. |
| **Commission one art system instead of purchasing many assets** | One artist can resolve proportions, palette, rigging, and equipment style together; integration effort may fall sharply | **Keep as a procurement option.** Compare the cost of coherence against repeated asset cleanup. |
| **Move procedural generation offline** | Agents can still edit dimensions and recipes while shipping beveled, merged, baked assets | **Keep for hard surfaces.** Reject a universal procedural-human project. |
| **Prerender distant or inaccessible spaces** | Beyond a window or noninteractive doorway, a baked view may provide depth at negligible geometry cost | **Keep narrowly.** Reject for nearby surfaces requiring parallax or clinical interaction. |
| **Make cleanliness and restraint the realism technique** | Hospitals communicate authenticity through controlled surfaces, organization, mounting, and accessible space — not cinematic debris | **Keep.** This reduces clutter production and rendering cost simultaneously. |
| **Use captured rooms or Gaussian splats** | A capture may look immediately convincing from nearby viewpoints | **Reject as the foundation.** Editing clinical layout, removing sensitive content, dynamic occlusion, collision, and mobile rendering add unresolved costs. |

The most consequential reframing is this: **the product needs convincing encounters within a hospital, not equal visual investment in every square meter.**

## 10. Ruthless do-not-build list

- Another numbered procedural realism pass.
- A renderer migration before proving the asset strategy.
- Runtime global illumination, ray tracing, volumetric lighting, or screen-space reflections.
- Bloom, depth of field, and motion blur as baseline requirements.
- A physically simulated hospital full of movable furniture.
- Generic crowd AI or ambient staff who imply unavailable interactions.
- Full facial performance, cloth, hair, or procedural clinical examinations.
- Hospital-wide 4K textures or one giant GLB.
- An asset CMS, streaming backend, custom scene editor, or universal character framework.
- Broad screenshot/browser matrices for every visual iteration.
- Decorative physiological displays that can be mistaken for canonical patient data.

## 11. Decisions that are expensive to reverse

1. **Character style, skeleton, and licensing.** Animation and clothing reuse depend on these.
2. **Units, origins, anchors, and placement authority.** Preserve the existing layout’s authority; avoid manually maintaining different collision, art, and interaction coordinates.
3. **Room boundaries and lighting UVs.** Overly large bake units make iteration and streaming expensive.
4. **Material and lighting conventions.** Encoding and exposure mistakes spread across every asset.
5. **Whether movement remains spatially continuous.** Staged views are a product decision, not a late optimization.
6. **Editable source ownership.** Optimized GLBs alone are not maintainable source assets.

Resolve these through the proof scene. Individual prop selection, light intensity, and decorative textures can remain provisional.

## 12. Best proof-of-quality vertical slice

**One complete outpatient encounter, including its corridor approach and doorway.**

Use the existing encounter that exercises patient and parent presence, confidentiality, completion, and replay. Include one clinician asset in a legitimate interaction context; do not invent new clinical behavior merely to display it.

The slice should show:

- Corridor-to-room lighting continuity.
- Doorway, collision, and loading boundaries.
- Patient, parent, and clinician at conversational distances.
- One examination surface and recognizable equipment.
- Seated and standing poses; lying-pose asset validation where relevant.
- Clinical UI opening and returning to the world.
- Parent removal and patient completion without stale visuals or baked silhouettes.

This is more informative than a team room: it exposes skin, clothing, equipment, close materials, privacy, state-dependent visibility, and mobile UI together.

**The proof must include one content edit:** move a cabinet or change a finish, regenerate the affected assets, and inspect the result. A beautiful room that is painful to revise has failed the architecture test.

## 13. Minimal phased roadmap

### Phase 0 — Establish the acceptance baseline

Finish the remaining physical-iPhone gate already documented in the repository, preserving completed checks. Record device, browser, orientation, sustained behavior, and loading conditions.

### Phase 1 — Prove the visual recipe

Create one room, one equipment set, and the minimum character family. Prove the lighting/export path before assembling a hospital.

### Phase 2 — Integrate the encounter slice

Bind existing state to the new visuals, preserve interaction anchors and explicit collision, and measure actual payload, draw calls, frame pacing, and sustained phone behavior.

### Phase 3 — Prove reuse

Build the second room from the same kit. It should reuse most materials, equipment, and animation rather than introduce a second art pipeline.

### Phase 4 — Replace progressively

Remove superseded procedural content room by room. Introduce additional visibility or LOD machinery only when hospital growth demonstrates the need.

For code integration, use the existing focused engine tests and build, then the affected interaction/device path. Validate exported assets with existing glTF tooling. Broad regression suites are not the default.

**Stop or revise** if the proof requires fragile custom shaders, unacceptable character-production effort, or repeated manual bake repair.

## 14. What Astra should personally own

- The architecture choice and its reversal criteria.
- Art direction and acceptance of the first room and character family.
- The boundary between canonical simulation and presentation.
- Tradeoffs between close-up quality, loading, and sustained device cost.
- Clinical-environment review with the owner.
- The proof-scene comparison and rejection of attractive but unmaintainable solutions.
- The final decision about whether expansion is justified.

Astra should own the difficult judgments, rather than personally authoring every prop or loader.

## 15. What should be delegated to a cheaper implementation agent

Once the contracts are fixed:

- GLTF loading and resource cleanup.
- Material reuse and lightmap binding.
- Deterministic export/optimization commands.
- Asset-size and scene-statistics reports.
- Room visibility and bounded loading.
- Animation playback, blending, and simple gaze.
- Canonical-state-to-actor binding.
- Replacement of superseded geometry.
- Focused checks for actor visibility, anchors, and collision.

Delegate modeling and rigging that exceed reliable agent capability to a technical artist. Do not turn uncertainty in art production into an oversized software project.

## 16. What requires physical-iPhone/user judgment

Only the owner and actual-device observation can settle:

- Whether the people feel human and age-appropriate.
- Whether the room feels clinically authentic.
- Whether materials remain convincing at normal phone size.
- Whether 30 FPS is acceptable or 60 FPS materially improves control.
- Whether sustained heat and battery consumption are acceptable.
- Whether portrait, landscape, and PWA remain comfortable.
- Whether loading and quality changes feel disruptive.
- Whether clinical panels preserve context without obstructing interaction.
- Whether the improvement is large enough to justify replacing the existing graphics.

**Proceed with the authored hybrid only when one complete encounter looks substantially better, remains comfortable on the phone, and can be revised cheaply.**

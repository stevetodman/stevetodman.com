# Hospital Visual Asset Pipeline — Phase 1 Proof

Status: **ACTIVE PROOF RECIPE**  
Governing specification: `VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md`

## Purpose

This is the smallest reproducible authored-hybrid pipeline needed to test Astra's visual architecture before expanding it across the hospital. **Clinic Room 1 is the proof scene.** Clinic Room 3, the corridor, and the team room remain legacy visuals for direct comparison.

## Production boundary

- **Build-time content compiler:** `scripts/build-visual-proof-assets.mjs` and `scripts/visual-proof/` generate the room/equipment glTF, adult/adolescent character family, baked room lightmap, and provenance file using Node built-ins only.
- **Runtime:** React Three Fiber composes those generated assets, binds the lightmap, projects canonical clinical state into actor visibility, and supplies one bounded real-time key light.
- **Collision:** Rapier uses explicit cuboid proxies in `authored-proof-room.tsx`. Detailed glTF geometry never becomes collision geometry.
- **Clinical truth:** the hospital engine/store remains authoritative. Character animation never owns patient presence, encounter state, confidentiality, completion, or interaction semantics.

## Rebuild recipe

From `cardio-hospital-3d/`:

```bash
npm run visual:build
```

The same compiler runs automatically before `npm run dev` and `npm run build`.

Generated outputs are intentionally gitignored:

- `public/assets/hospital/astra-proof/proof-room-one.gltf`
- `public/assets/hospital/astra-proof/proof-character-adolescent.gltf`
- `public/assets/hospital/astra-proof/proof-character-adult.gltf`
- `public/assets/hospital/astra-proof/proof-room-lightmap.png`
- `public/assets/hospital/astra-proof/provenance.json`

Do not hand-edit generated outputs. Change the compiler, rebuild, then inspect the result.

## Asset contract

- Units are meters; runtime places the proof at the accepted Clinic Room 1 center `[-5.35, 0, -3]`.
- The proof preserves the accepted doorway and world-location bounds.
- Shell meshes beginning `lm_` carry `TEXCOORD_1`; Three.js binds the baked map on texture channel 1 with `flipY = false` and linear color-space treatment.
- The room uses a small metallic/roughness PBR vocabulary: painted surfaces, resilient floor, laminate, upholstery, plastic, exposed metal, dark equipment, screen, and restrained accent finishes.
- Ceiling fixtures are emissive-looking geometry. Static room illumination is baked into the proof lightmap; one local 512px shadowed key remains for nearby people and material response.
- Character assets share the `proof-human-v1` skeleton naming convention and `idle-seated` clip.
- Adult and adolescent proportions are authored independently rather than created by uniform scaling.
- The compiler fails if either nearby character leaves Astra's initial **12k–25k triangle** proof envelope.
- The generated idle uses restrained chest breathing and a small bounded head-attention motion. It must not encode clinical findings.

## Provenance

All Phase 1 proof geometry, materials, lightmap data, skeletons, and animations are generated in this repository. No external model or character asset is embedded in the proof. This avoids licensing ambiguity while the architecture is being validated.

A later production character source may replace the proof family only after its topology, rig, license, art direction, and physical-phone rendering have been reviewed.

## Deliberate edit / reversibility test

Astra requires one content edit to prove the pipeline is cheap to revise. The current proof is structured so a chair position, cabinet run, finish, or equipment placement can be changed in `scripts/visual-proof/room.mjs`, regenerated with `npm run visual:build`, and reviewed **without changing collision or clinical-state code** unless that edit intentionally changes traversal or interaction anchors.

## Phase 1 limitations

This is an **architecture proof**, not final character art. The generated lightmap proves the secondary-UV/binding/build path; it is not a substitute for a final artist-authored lighting bake if the architecture is accepted.

Do not add full facial capture/lip sync, cloth or strand-hair simulation, crowd AI, runtime GI, SSR, volumetrics, renderer migration, hospital-wide 4K textures, a custom scene editor, or a generalized asset backend during this proof.

Expansion is allowed only after one complete encounter is visibly superior, comfortable on the intended physical phone, and cheap to revise.

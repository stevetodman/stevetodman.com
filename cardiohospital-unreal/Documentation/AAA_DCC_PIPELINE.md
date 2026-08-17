# AAA DCC pipeline — exam-room vertical slice

Status: locked 2026-08-17 after layout v2 + west-wall sink was accepted.

This room is an Unreal vertical slice with original 3D assets. Review stills and the web stack are not the production renderer.

## Ownership

| Role | Tool | Owns |
| --- | --- | --- |
| Source of truth | Blender (metres, Z-up) | Scale, topology, UVs, collision, pivots, naming, `.blend` |
| Generation assist | Hunyuan3D (hosted 3.0/3.1 or local 2.1) | First-pass hero/medium prop meshes and PBR maps |
| Runtime | Unreal Engine 5.8 (centimetres) | Lighting, master materials, Nanite/LOD, cameras, packaging, 1440p/60 evidence |
| Review stills | Image tools / Blender EEVEE | Layout communication only |

Blender wins scale arguments. Unreal wins lighting arguments. Hunyuan never ships raw.

## What Hunyuan is allowed to make

Use it for discrete objects with a silhouette:

- Pediatric exam table (or a rework of the PR #22 mesh)
- Parent chair
- Physician stool
- Unbranded ECG cart
- Wall BP housing
- Keyboard, mouse, all-in-one / monitor, sharps box, glove box, paper-towel dispenser, trash/linen

Do **not** use it for:

- The room shell, floor, or ceiling grid
- Chair rail, cove base, corner guards, door frames, window frames
- Troffers, HVAC grilles, sprinklers, speakers, outlet plates
- Tiling materials (drywall, LVT, acoustic tile)

Those are measured modular pieces. Image-to-3D will give you a unique melted room, not a tileable hospital system, and it will fail the locked cameras.

## What must be authored in Blender

Gate 2 architecture, in this order:

1. Room shell (4.27 × 3.96 × 2.74 m clear) with correct openings
2. Door leaf, frame, closer, lever, kick plate (outswing)
3. Window, sill, shade
4. Cove base, chair rail, corner guards
5. 0.61 m ceiling grid, tiles, two troffers, supply/return
6. West-wall casework + sink + faucet + computer surface
7. Outlet / data / switch plates at credible heights

Hero props come after the shell reads correctly under temp materials.

## Hunyuan → Blender → Unreal

1. Feed Hunyuan one clean object on a neutral ground. Prefer a single three-quarter still plus, if the hosted 3.1 path is available, extra orthos. No logos, no room, no people, no labels.
2. Export GLB.
3. In Blender: apply real-world metres, set the pivot, decimate/retopo until the silhouette holds at conversation distance, build UV0 + lightmap UV, rebuild collision, replace or recalibrate maps.
4. Export Unreal FBX (forward −Y, up Z) plus a portable GLB preview.
5. Import to `/Game/Environments/ExamRoom/…` with authored normals, no auto lightmap UVs if UV1 exists, custom collision on, Nanite on for static hero meshes unless a measured LOD path is better.
6. Assign Unreal material instances from the approved palette. Hunyuan textures are a first pass, not the room material.

Reject a Hunyuan mesh if any of these are true:

- Dimensions off by more than 5% from the clearance envelope
- Non-manifold or inverted mass that retopo cannot fix in one sitting
- Visible manufacturer geometry or type
- Texture that only works in the Hunyuan preview lighting
- A “room chunk” fused to the object (floor, wall, or shadow catcher baked in)

## Formats and folders

```
cardiohospital-unreal/SourceAssets/ExamRoom/
  Gate1/                  greybox + circulation (this branch)
  Architecture/           Blender-authored modular shell
  Props/                  one folder per hero/medium asset
    <Asset>/
      hunyuan/            raw GLB + source stills (LFS)
      blender/            editable .blend
      exports/            FBX LOD + preview GLB
      textures/           approved maps
      asset_manifest.json
  Shared/Materials/       tiling sets used by architecture
```

Use Git LFS for `.blend`, `.fbx`, `.glb`, and 4K maps. Do not commit Unreal `Binaries`, `DerivedDataCache`, `Intermediate`, or `Saved`.

## Other tools we will accept

Only if Hunyuan fails a specific prop, and only as another first-pass generator:

- Meshy or Tripo for a stubborn hard-surface cart/chair
- RealityScan / Polycam if you photograph a de-identified real room for the reference board (photos, not the shipped mesh)
- Substance 3D Designer / Sampler for *tiling* drywall, LVT, and ceiling tile

We will not switch the runtime to React Three Fiber, Unity, or Godot. We will not buy a branded medical-asset pack. We will not treat Quixel megascans as the room identity.

## First production jobs

| Priority | Asset | Author |
| --- | --- | --- |
| P0 | Modular room shell + openings | Blender |
| P0 | West casework + sink | Blender |
| P0 | Door and window assemblies | Blender |
| P0 | Ceiling grid / troffers / HVAC | Blender |
| P1 | Exam table | Hunyuan then Blender, or rework PR #22 |
| P1 | Parent chair, stool | Hunyuan then Blender |
| P1 | ECG cart, wall BP | Hunyuan then Blender |
| P2 | Computer, dispensers, waste | Hunyuan then Blender |

Do not start P1 until the P0 shell is in the three locked cameras with temporary materials.

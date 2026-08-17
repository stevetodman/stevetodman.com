# AAA DCC pipeline — exam-room vertical slice

Status: locked 2026-08-17 after layout v2 + west-wall sink was accepted.

This room is an Unreal vertical slice with original 3D assets. Review stills and the web stack are not the production renderer.

Workstations are in `AAA_WORKSTATIONS.md`. Short version: **4090 = Blender/Hunyuan**, **M4 Max = Unreal 5.8**, **this PC = GitHub only**.

## Ownership

| Role | Tool | Machine | Owns |
| --- | --- | --- | --- |
| Source of truth | Blender (metres, Z-up) | RTX 4090 | Scale, topology, UVs, collision, pivots, naming, `.blend` |
| Generation assist | Hunyuan3D (hosted 3.0/3.1 or local 2.1) | RTX 4090 | First-pass hero/medium prop meshes and PBR maps |
| Runtime | Unreal Engine 5.8 (centimetres) | M4 Max 128 GB | Lighting, master materials, Nanite/LOD, cameras, packaging, 1440p/60 evidence |
| Review stills | Image tools / Blender EEVEE | any; not evidence | Layout communication only |

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

Gate 2 architecture, in this order, on the 4090:

1. Room shell (4.27 × 3.96 × 2.74 m clear) with correct openings
2. Door leaf, frame, closer, lever, kick plate (outswing)
3. Window, sill, shade
4. Cove base, chair rail, corner guards
5. 0.61 m ceiling grid, tiles, two troffers, supply/return
6. West-wall casework + sink + faucet + computer surface
7. Outlet / data / switch plates at credible heights

Hero props come after the shell reads correctly under temp materials.

## Hunyuan → Blender → Unreal

1. On the 4090, feed Hunyuan one clean object on a neutral ground. Prefer a single three-quarter still plus, if the hosted 3.1 path is available, extra orthos. No logos, no room, no people, no labels.
2. Export GLB into `SourceAssets/ExamRoom/Props/<Asset>/hunyuan/`.
3. In Blender on the 4090: apply real-world metres, set the pivot, decimate/retopo until the silhouette holds at conversation distance, build UV0 + lightmap UV, rebuild collision, replace or recalibrate maps.
4. Export Unreal FBX (forward −Y, up Z) plus a portable GLB preview. Commit with Git LFS and push.
5. On the M4 Max, pull and import to `/Game/Environments/ExamRoom/…` with authored normals, no auto lightmap UVs if UV1 exists, custom collision on, Nanite on for static hero meshes unless a measured LOD path is better.
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

| Priority | Asset | Where |
| --- | --- | --- |
| P0 | Modular room shell + openings | Blender on the 4090 |
| P0 | West casework + sink | Blender on the 4090 |
| P0 | Door and window assemblies | Blender on the 4090 |
| P0 | Ceiling grid / troffers / HVAC | Blender on the 4090 |
| P1 | Exam table | Hunyuan/Blender on the 4090, or rework PR #22 |
| P1 | Parent chair, stool | Hunyuan then Blender on the 4090 |
| P1 | ECG cart, wall BP | Hunyuan then Blender on the 4090 |
| P2 | Computer, dispensers, waste | Hunyuan then Blender on the 4090 |
| Gate 2 light / package | Locked cameras, 1440p/60 | Unreal on the M4 Max |

Do not start P1 until the P0 shell is in the three locked cameras with temporary materials.

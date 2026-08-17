# CardioHospital Wall-Mounted ECG Workstation

Original, unbranded P0 hero prop for Exam Room 3. The workstation includes an articulated wall mount, protected widescreen display, tactile controls, ECG acquisition dock, lead ports, cable management, explicit LODs, and custom collision.

All monitor values and waveforms are synthetic simulation content. No patient identifiers or real patient data are embedded.

## Deliverables

- `CH_WallECG_Production.blend`: editable Blender 5.2 LTS source with LOD, collision, screen-bake, and OptiX render collections.
- `exports/SM_CH_WallECG_01_LOD0.fbx`: 16,350 triangles plus four `UCX_` collision hulls.
- `exports/SM_CH_WallECG_01_LOD1.fbx`: 9,444 triangles.
- `exports/SM_CH_WallECG_01_LOD2.fbx`: 4,390 triangles.
- `exports/SM_CH_WallECG_01_preview.glb`: review-only portable preview.
- `textures/T_CH_WallECG_Screen_*_4K.png`: 4096×2048 sinus rhythm, sinus tachycardia, and lead-contact display states.
- `renders/`: front, mount-profile, and control-detail OptiX validation renders.
- `asset_manifest.json`: dimensions, mounting pivot, LOD statistics, collision names, display states, and Unreal settings.
- `scripts/generate_ecg_screens.py`: deterministic Pillow screen generator.
- `scripts/build_wall_ecg.py`: Blender authoring, export, and OptiX validation-render pipeline.
- `scripts/validate_wall_ecg.py`: fail-fast source and deliverable validator.

## Unreal Engine 5.8 import

1. Import LOD0 into `/Game/Environments/ExamRoom3/Equipment/SM_CH_WallECG_01` with **Combine Meshes** and **Import Normals and Tangents** on. Disable generated lightmap UVs.
2. Confirm the four `UCX_SM_CH_WallECG_01_*` hulls are detected, then disable automatic collision.
3. Add LOD1 and LOD2 in the Static Mesh Editor. Initial distance targets are 7 m and 18 m; tune against the 1440p/60 FPS target.
4. Import all three screen textures with sRGB enabled. Create an opaque unlit/emissive screen material with a texture parameter named `DisplayState`.
5. Create material instances for `Sinus`, `Tachycardia`, and `LeadContact`. Switch the material instance from simulation state only—never from patient data.
6. Use the wall-plate center as the placement pivot. The monitor projects along local `-Y` and uses `Z` up.
7. Nanite is recommended for LOD0, while explicit LODs support reduced scalability tiers.

Final `.uasset` creation and in-engine readability testing remain on the Unreal 5.8 Mac workstation.

## Rebuild

Generate the screen atlases first with Python 3 and Pillow available:

```text
python scripts/generate_ecg_screens.py
blender --background --python scripts/build_wall_ecg.py
blender --background CH_WallECG_Production.blend --python scripts/validate_wall_ecg.py
```

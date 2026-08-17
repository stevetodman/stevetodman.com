# CardioHospital Pediatric Exam Table

Original, unbranded hero prop for the Exam Room 3 vertical slice. The asset is authored at real-world scale and contains no third-party geometry, trademarks, or reference imagery.

## Deliverables

- `CH_PediatricExamTable_Production.blend`: editable Blender 5.2 LTS source with LOD, collision, and render-studio collections.
- `exports/SM_CH_ExamTable_01_LOD0.fbx`: 11,972 triangles plus three `UCX_` collision hulls.
- `exports/SM_CH_ExamTable_01_LOD1.fbx`: 6,914 triangles.
- `exports/SM_CH_ExamTable_01_LOD2.fbx`: 3,334 triangles.
- `exports/SM_CH_ExamTable_01_preview.glb`: review-only portable preview.
- `textures/T_CH_ExamTable_Upholstery_*_4K.png`: original base-color, roughness, and tangent-space normal maps.
- `renders/`: three asset-validation views.
- `asset_manifest.json`: dimensions, origin, LOD statistics, collision names, UV channels, and Unreal import settings.
- `scripts/build_exam_table.py`: deterministic source generator and validation-render pipeline.

## Unreal Engine 5.8 import

1. Import LOD0 into `/Game/Environments/ExamRoom3/Props/SM_CH_ExamTable_01` with **Combine Meshes** on, **Import Normals and Tangents** on, and **Generate Lightmap UVs** off.
2. Confirm Unreal detects the three `UCX_SM_CH_ExamTable_01_*` hulls. Disable auto-generated collision.
3. Add the LOD1 and LOD2 FBX files in the Static Mesh Editor. Suggested screen distances are 6 m and 15 m; tune against the 1440p/60 FPS target.
4. Import the 4K texture set. Set the normal and roughness maps to **Non-Color**, disable sRGB for both, and use the normal map as tangent-space normal data.
5. Create a vinyl material instance with the included maps. The powder coat, ABS, steel, rubber, and coral accent slots use the scalar/color values preserved in the `.blend` and listed in the manifest.
6. Nanite is recommended for LOD0, while the explicit LODs remain available for lower scalability tiers.

The local Windows workstation cannot perform the final `.uasset` import because Unreal Engine 5.8 is not installed and Epic access is network-filtered. That import is intentionally left for the Unreal-equipped Mac workstation.

## Rebuild

From the asset directory, run:

```text
blender --background --python scripts/build_exam_table.py
```

The script replaces its own generated `.blend`, exports, textures, manifest, and validation renders.

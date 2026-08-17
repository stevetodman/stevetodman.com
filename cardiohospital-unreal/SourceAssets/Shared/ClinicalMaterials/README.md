# CardioHospital Clinical Material Library

Original shared 4K PBR materials for CardioHospital hero props and modular clinical environments. The library contains no scans, third-party imagery, trademarks, or patient data.

## Material sets

- `PowderCoat_WarmWhite`: restrained orange-peel finish for equipment housings and cabinetry.
- `BrushedSteel`: directional micro-brushing with full metalness.
- `ABS_Graphite`: fine injection-molded polymer grain.
- `MedicalVinyl_Teal`: embossed pediatric upholstery grain.
- `Rubber_Black`: stippled high-roughness tread and bumper material.
- `AntiGlareGlass`: low-amplitude etched surface response for clinical displays.

Each set contains:

- `BaseColor_4K`: sRGB RGB texture.
- `Normal_4K`: non-color tangent-space normal texture.
- `ORM_4K`: non-color packed map where R=ambient occlusion, G=roughness, and B=metalness.

## Unreal Engine 5.8

1. Import Base Color with sRGB enabled.
2. Import Normal as **Normal Map**, disable sRGB, and use tangent-space normals.
3. Import ORM with sRGB disabled and compression set to **Masks**.
4. Connect ORM R to Ambient Occlusion, G to Roughness, and B to Metallic.
5. Use a scalar texture-coordinate parameter initialized from `material_manifest.json`; retain per-instance control for art direction.
6. Keep clinical wear restrained. These materials describe maintained outpatient equipment, not abandoned or industrial environments.

## Rebuild and validation

```text
python scripts/generate_clinical_materials.py
python scripts/validate_clinical_materials.py
blender --background --python scripts/build_material_preview.py
```

The generator requires Python 3, Pillow, and NumPy. The preview script uses Blender 5.2 and selects RTX OptiX when available.

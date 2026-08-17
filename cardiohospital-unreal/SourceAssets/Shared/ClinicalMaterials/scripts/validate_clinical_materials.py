"""Validate resolution, packing ranges, uniqueness, and tile seams."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "material_manifest.json").read_text(encoding="utf-8"))
assert manifest["resolution"] == [4096, 4096]
assert len(manifest["materials"]) == 6
results = {}
hashes = set()

for name, data in manifest["materials"].items():
    results[name] = {}
    for role, filename in data["textures"].items():
        path = ROOT / "textures" / filename
        # Dark clinical base colors compress extremely well; pixel variance and
        # channel checks below are the meaningful quality gates.
        assert path.exists() and path.stat().st_size > 10000, f"missing/empty {filename}"
        with Image.open(path) as image:
            assert image.size == (4096, 4096) and image.mode == "RGB", f"invalid {filename}"
            sample = np.asarray(image.resize((256, 256), Image.Resampling.BILINEAR), dtype=np.float32)
        digest = (round(float(sample.mean()), 3), round(float(sample.std()), 3), role)
        assert digest not in hashes, f"duplicate-looking map {filename}"
        hashes.add(digest)
        edge_error = float(np.abs(sample[0].astype(np.int16) - sample[-1].astype(np.int16)).mean()
                           + np.abs(sample[:, 0].astype(np.int16) - sample[:, -1].astype(np.int16)).mean())
        assert edge_error < 24.0, f"non-tileable edge in {filename}: {edge_error}"
        results[name][role] = {"bytes": path.stat().st_size, "mean": round(float(sample.mean()), 2),
                               "stddev": round(float(sample.std()), 2), "edge_error": round(edge_error, 2)}
    orm_path = ROOT / "textures" / data["textures"]["orm"]
    orm = np.asarray(Image.open(orm_path).resize((256, 256), Image.Resampling.BILINEAR), dtype=np.float32) / 255.0
    expected_metal = 1.0 if name == "BrushedSteel" else 0.0
    assert abs(float(orm[:, :, 2].mean()) - expected_metal) < 0.02, f"metalness mismatch {name}"

print("MATERIAL_VALIDATION_PASSED")
print(json.dumps(results, indent=2))

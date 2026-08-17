"""Generate the original CardioHospital 4K clinical PBR material library.

Outputs use the production convention BaseColor + tangent Normal + packed ORM:
R=ambient occlusion, G=roughness, B=metalness. All patterns are deterministic,
tileable, restrained, and project-owned.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / "textures"
TEXTURES.mkdir(parents=True, exist_ok=True)
SIZE = 4096


MATERIALS = {
    "PowderCoat_WarmWhite": {
        "base": (0.72, 0.75, 0.76), "roughness": 0.34, "metalness": 0.0,
        "height_strength": 1.6, "scale": 7.0, "profile": "powder",
    },
    "BrushedSteel": {
        "base": (0.43, 0.47, 0.49), "roughness": 0.27, "metalness": 1.0,
        "height_strength": 2.4, "scale": 5.0, "profile": "steel",
    },
    "ABS_Graphite": {
        "base": (0.028, 0.038, 0.048), "roughness": 0.41, "metalness": 0.0,
        "height_strength": 1.8, "scale": 8.0, "profile": "abs",
    },
    "MedicalVinyl_Teal": {
        "base": (0.055, 0.34, 0.38), "roughness": 0.58, "metalness": 0.0,
        "height_strength": 3.0, "scale": 6.0, "profile": "vinyl",
    },
    "Rubber_Black": {
        "base": (0.015, 0.020, 0.024), "roughness": 0.76, "metalness": 0.0,
        "height_strength": 2.5, "scale": 9.0, "profile": "rubber",
    },
    "AntiGlareGlass": {
        "base": (0.025, 0.055, 0.070), "roughness": 0.16, "metalness": 0.0,
        "height_strength": 0.65, "scale": 4.0, "profile": "glass",
    },
}


def periodic_noise(seed, profile):
    rng = np.random.default_rng(seed)
    coordinate = np.arange(SIZE, dtype=np.float32) / SIZE
    x = coordinate[None, :]
    y = coordinate[:, None]
    value = np.zeros((SIZE, SIZE), dtype=np.float32)
    if profile == "steel":
        # Brushing runs horizontally: dense cross-brush variation with sparse
        # long scoring lines, all periodic at the texture boundaries.
        for frequency, amplitude in ((127, 0.32), (263, 0.24), (521, 0.18), (1031, 0.12)):
            value += np.sin(math.tau * frequency * y + rng.uniform(0, math.tau)) * amplitude
        value += np.sin(math.tau * (13 * x + 29 * y) + 0.7) * 0.10
    else:
        profiles = {
            "powder": ((31, 47, .24), (73, 109, .20), (181, 137, .15), (421, 389, .10)),
            "abs": ((17, 23, .18), (89, 67, .18), (251, 307, .16), (643, 521, .10)),
            "vinyl": ((7, 11, .22), (37, 29, .18), (113, 149, .16), (389, 317, .10)),
            "rubber": ((43, 37, .18), (137, 173, .20), (401, 359, .13), (887, 743, .08)),
            "glass": ((23, 19, .16), (97, 83, .12), (283, 251, .08)),
        }
        for fx, fy, amplitude in profiles[profile]:
            phase = rng.uniform(0, math.tau)
            value += np.sin(math.tau * (fx * x + fy * y) + phase) * amplitude
            value += np.cos(math.tau * (fy * x - fx * y) + phase * 0.73) * amplitude * 0.55
        if profile == "vinyl":
            # Broad, shallow crossing grain that reads like embossed medical vinyl.
            value += np.sin(math.tau * (19 * x + 3 * np.sin(math.tau * 5 * y))) * 0.13
            value += np.sin(math.tau * (17 * y + 2 * np.sin(math.tau * 7 * x))) * 0.11
        elif profile == "rubber":
            value += np.cos(math.tau * 96 * x) * np.cos(math.tau * 96 * y) * 0.09
    value -= value.min()
    value /= max(float(value.max()), 1e-6)
    return value


def normal_from_height(height, strength):
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * strength
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * strength
    nx, ny = -dx, -dy
    nz = np.ones_like(height)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack((nx / length * 0.5 + 0.5, ny / length * 0.5 + 0.5, nz / length * 0.5 + 0.5), axis=-1)
    return normal


def save_rgb(path, values):
    pixels = np.clip(values * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(pixels, mode="RGB").save(path, format="PNG", optimize=True, compress_level=7)


def generate_material(index, name, spec):
    height = periodic_noise(2401 + index * 997, spec["profile"])
    centered = height - 0.5
    base = np.empty((SIZE, SIZE, 3), dtype=np.float32)
    tint = np.asarray(spec["base"], dtype=np.float32)
    color_variation = 1.0 + centered[:, :, None] * (0.035 if spec["profile"] != "steel" else 0.07)
    base[:] = np.clip(tint[None, None, :] * color_variation, 0, 1)
    if spec["profile"] == "steel":
        base += centered[:, :, None] * np.asarray((0.025, 0.029, 0.032), dtype=np.float32)

    roughness = np.clip(spec["roughness"] + centered * (0.11 if spec["profile"] != "glass" else 0.035), 0.04, 0.96)
    ao = np.clip(0.985 - np.maximum(0, -centered) * 0.07, 0, 1)
    metalness = np.full_like(height, spec["metalness"])
    orm = np.stack((ao, roughness, metalness), axis=-1)
    normal = normal_from_height(height, spec["height_strength"])

    prefix = f"T_CH_{name}"
    paths = {
        "base_color": TEXTURES / f"{prefix}_BaseColor_4K.png",
        "normal": TEXTURES / f"{prefix}_Normal_4K.png",
        "orm": TEXTURES / f"{prefix}_ORM_4K.png",
    }
    save_rgb(paths["base_color"], base)
    save_rgb(paths["normal"], normal)
    save_rgb(paths["orm"], orm)
    return {key: path.name for key, path in paths.items()}


def main():
    manifest = {
        "schema_version": 1,
        "library": "CardioHospital Clinical Materials",
        "authorship": "Original deterministic project-owned textures",
        "resolution": [4096, 4096],
        "packing": {"ORM_R": "ambient_occlusion", "ORM_G": "roughness", "ORM_B": "metalness"},
        "materials": {},
        "license": "Project-owned original material library; no third-party scans or imagery.",
    }
    for index, (name, spec) in enumerate(MATERIALS.items()):
        manifest["materials"][name] = {
            "textures": generate_material(index, name, spec),
            "tiling_scale": spec["scale"],
            "profile": spec["profile"],
        }
        print(f"Generated {name}")
    (ROOT / "material_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

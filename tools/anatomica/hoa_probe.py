#!/usr/bin/env python3
"""
Lightweight Human Organ Atlas (HOA) feasibility probe for Anatomica.

This experiment intentionally does NOT create or validate anatomical labels.
It verifies remote chunk access, captures provenance, renders low-resolution
orthogonal views, inventories registered high-resolution ROIs, and generates
coarse threshold-derived envelope candidates for later expert review.
"""

from __future__ import annotations

import argparse
import json
import math
import platform
import sys
from dataclasses import asdict, dataclass
from importlib.metadata import version
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import scipy.ndimage as ndi
import trimesh
from skimage import filters, measure

import hoa_tools.dataset
import hoa_tools.inventory


PRIMARY_DATASET = "LADAF-2021-17_heart_complete-organ_19.85um_bm18"
DATASET_PREFIX = "LADAF-2021-17_heart_"
NAMED_VALIDATION_DATASET = "S-20-28_heart_VOI-01-tricuspid-valve_12.02um_bm05"


@dataclass
class SurfaceCandidate:
    name: str
    polarity: str
    threshold_normalized: float
    threshold_raw: float
    volume_fraction: float
    border_fraction: float
    component_count: int
    largest_component_voxels: int
    heuristic_score: float
    vertices: int = 0
    faces: int = 0
    glb: str | None = None
    ply: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("hoa_probe_output"))
    parser.add_argument(
        "--downsample-level",
        type=int,
        default=4,
        help="HOA pyramid level. Level 4 is guaranteed by the official tooling.",
    )
    parser.add_argument(
        "--max-whole-volume-mib",
        type=int,
        default=600,
        help="Abort whole-volume compute above this estimated size.",
    )
    parser.add_argument(
        "--max-mesh-voxels",
        type=int,
        default=24_000_000,
        help="Further stride the downloaded volume before connected-component meshing.",
    )
    parser.add_argument(
        "--max-surface-candidates",
        type=int,
        default=3,
        help="Export only the best non-anatomical threshold candidates.",
    )
    return parser.parse_args()


def jsonable(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, Path):
        return str(value)
    return value


def write_json(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, indent=2, sort_keys=True, default=jsonable) + "\n",
        encoding="utf-8",
    )


def list_matching_datasets() -> tuple[Any, list[str]]:
    inventory = hoa_tools.inventory.load_inventory()
    names = sorted(
        name for name in map(str, inventory.index) if name.startswith(DATASET_PREFIX)
    )
    if PRIMARY_DATASET not in names:
        hoa_tools.dataset.get_dataset(PRIMARY_DATASET)
        names.append(PRIMARY_DATASET)
        names.sort()
    return inventory, names


def dataset_summary(name: str) -> dict[str, Any]:
    dataset = hoa_tools.dataset.get_dataset(name)
    registration = jsonable(dataset.registration) if dataset.registration is not None else None
    return {
        "name": name,
        "donor_id": dataset.donor.id,
        "organ": str(dataset.sample.organ),
        "is_full_organ": bool(dataset.is_full_organ),
        "is_zoom": bool(dataset.is_zoom),
        "voxel_size_um": float(dataset.data.voxel_size_um),
        "beamline": str(dataset.scan.beamline),
        "remote_format": dataset._remote_fmt,
        "registration": registration,
    }


def save_inventory_csv(inventory: Any, names: list[str], path: Path) -> None:
    subset = inventory.loc[names].copy()
    subset.insert(0, "dataset_name", subset.index.astype(str))
    subset.to_csv(path, index=False)


def save_orthogonal_views(data_array: Any, out: Path) -> dict[str, int]:
    z_mid = data_array.shape[0] // 2
    y_mid = data_array.shape[1] // 2
    x_mid = data_array.shape[2] // 2

    slices = {
        "axial_z": (data_array.isel(z=z_mid).compute().values, z_mid),
        "coronal_y": (data_array.isel(y=y_mid).compute().values, y_mid),
        "sagittal_x": (data_array.isel(x=x_mid).compute().values, x_mid),
    }

    for label, (image, index) in slices.items():
        finite = image[np.isfinite(image)]
        if finite.size:
            low, high = np.percentile(finite, [1, 99])
        else:
            low, high = 0.0, 1.0
        fig, ax = plt.subplots(figsize=(7, 7))
        ax.imshow(image, cmap="gray", origin="lower", vmin=low, vmax=high)
        ax.set_title(f"{label} | index {index} | low-resolution QA only")
        ax.set_axis_off()
        fig.tight_layout()
        fig.savefig(out / f"{label}.png", dpi=180, bbox_inches="tight")
        plt.close(fig)

    return {"z": z_mid, "y": y_mid, "x": x_mid}


def save_histogram(volume: np.ndarray, out: Path) -> dict[str, float]:
    finite = volume[np.isfinite(volume)]
    if finite.size == 0:
        raise RuntimeError("Downloaded volume contains no finite voxels.")

    percentiles = {
        f"p{p:g}": float(np.percentile(finite, p))
        for p in (0.1, 1, 5, 25, 50, 75, 95, 99, 99.9)
    }
    low = percentiles["p1"]
    high = percentiles["p99"]
    clipped = finite[(finite >= low) & (finite <= high)]

    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.hist(clipped.ravel(), bins=256)
    ax.set_title("HOA low-resolution intensity histogram (1st-99th percentile)")
    ax.set_xlabel("voxel intensity")
    ax.set_ylabel("count")
    fig.tight_layout()
    fig.savefig(out / "histogram.png", dpi=180)
    plt.close(fig)
    return percentiles


def normalization_parameters(volume: np.ndarray) -> tuple[float, float]:
    finite = volume[np.isfinite(volume)]
    p1, p99 = np.percentile(finite, [1, 99])
    if not np.isfinite(p1) or not np.isfinite(p99) or p99 <= p1:
        p1 = float(np.min(finite))
        p99 = float(np.max(finite))
    if p99 <= p1:
        raise RuntimeError("Intensity range is degenerate; cannot normalize.")
    return float(p1), float(p99)


def coarse_for_meshing(volume: np.ndarray, max_voxels: int) -> tuple[np.ndarray, int]:
    voxel_count = int(np.prod(volume.shape))
    if voxel_count <= max_voxels:
        return volume, 1
    stride = max(1, math.ceil((voxel_count / max_voxels) ** (1 / 3)))
    return volume[::stride, ::stride, ::stride], stride


def border_fraction(mask: np.ndarray) -> float:
    boundary = np.zeros_like(mask, dtype=bool)
    boundary[0, :, :] = True
    boundary[-1, :, :] = True
    boundary[:, 0, :] = True
    boundary[:, -1, :] = True
    boundary[:, :, 0] = True
    boundary[:, :, -1] = True
    denominator = int(boundary.sum())
    if denominator == 0:
        return 1.0
    return float(np.count_nonzero(mask & boundary) / denominator)


def largest_component(mask: np.ndarray) -> tuple[np.ndarray, int, int]:
    labels, count = ndi.label(mask)
    if count == 0:
        return np.zeros_like(mask, dtype=bool), 0, 0
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    largest_label = int(np.argmax(sizes))
    largest = labels == largest_label
    return largest, int(count), int(sizes[largest_label])


def candidate_thresholds(norm: np.ndarray) -> list[float]:
    finite = norm[np.isfinite(norm)]
    sample = finite.ravel()
    if sample.size > 2_000_000:
        step = max(1, sample.size // 2_000_000)
        sample = sample[::step]
    otsu = float(filters.threshold_otsu(sample))
    values = [otsu, 0.30, 0.40, 0.50, 0.60, 0.70]
    deduped: list[float] = []
    for value in values:
        value = float(np.clip(value, 0.02, 0.98))
        if all(abs(value - prior) > 0.015 for prior in deduped):
            deduped.append(value)
    return deduped


def evaluate_surface_candidates(
    coarse: np.ndarray,
    p1: float,
    p99: float,
) -> tuple[list[SurfaceCandidate], dict[str, np.ndarray]]:
    norm = np.clip((coarse.astype(np.float32) - p1) / (p99 - p1), 0.0, 1.0)
    records: list[SurfaceCandidate] = []
    masks: dict[str, np.ndarray] = {}

    for threshold in candidate_thresholds(norm):
        raw_threshold = p1 + threshold * (p99 - p1)
        for polarity in ("high", "low"):
            initial = norm >= threshold if polarity == "high" else norm <= threshold
            component, component_count, component_voxels = largest_component(initial)
            if component_voxels == 0:
                continue

            component = ndi.binary_closing(component, iterations=1)
            component = ndi.binary_fill_holes(component)

            fraction = float(component.mean())
            border = border_fraction(component)
            occupancy_penalty = abs(fraction - 0.22)
            extreme_penalty = 3.0 if fraction < 0.01 or fraction > 0.70 else 0.0
            score = occupancy_penalty + (2.5 * border) + extreme_penalty

            name = f"{polarity}_t{threshold:.3f}".replace(".", "p")
            records.append(
                SurfaceCandidate(
                    name=name,
                    polarity=polarity,
                    threshold_normalized=float(threshold),
                    threshold_raw=float(raw_threshold),
                    volume_fraction=fraction,
                    border_fraction=border,
                    component_count=component_count,
                    largest_component_voxels=component_voxels,
                    heuristic_score=float(score),
                )
            )
            masks[name] = component

    records.sort(key=lambda item: item.heuristic_score)
    return records, masks


def export_surfaces(
    candidates: list[SurfaceCandidate],
    masks: dict[str, np.ndarray],
    out: Path,
    spacing_mm: float,
    limit: int,
) -> list[SurfaceCandidate]:
    exported: list[SurfaceCandidate] = []
    for record in candidates:
        if len(exported) >= limit:
            break
        mask = masks[record.name]
        if mask.mean() < 0.01 or mask.mean() > 0.70:
            continue
        if min(mask.shape) < 3:
            continue

        try:
            verts_zyx, faces, _, _ = measure.marching_cubes(
                mask.astype(np.uint8),
                level=0.5,
                spacing=(spacing_mm, spacing_mm, spacing_mm),
                step_size=2,
                allow_degenerate=False,
            )
        except (RuntimeError, ValueError):
            continue

        vertices_xyz = verts_zyx[:, [2, 1, 0]]
        mesh = trimesh.Trimesh(vertices=vertices_xyz, faces=faces, process=False)
        mesh.remove_unreferenced_vertices()
        mesh.fix_normals()

        glb_name = f"candidate_surface_{record.name}.glb"
        ply_name = f"candidate_surface_{record.name}.ply"
        mesh.export(out / glb_name)
        mesh.export(out / ply_name)

        record.vertices = int(len(mesh.vertices))
        record.faces = int(len(mesh.faces))
        record.glb = glb_name
        record.ply = ply_name
        exported.append(record)
    return exported


def save_mips(volume: np.ndarray, out: Path) -> None:
    for axis, label in enumerate(("z", "y", "x")):
        image = np.max(volume, axis=axis)
        finite = image[np.isfinite(image)]
        low, high = np.percentile(finite, [1, 99]) if finite.size else (0.0, 1.0)
        fig, ax = plt.subplots(figsize=(7, 7))
        ax.imshow(image, cmap="gray", origin="lower", vmin=low, vmax=high)
        ax.set_title(f"Maximum-intensity projection along {label} | QA only")
        ax.set_axis_off()
        fig.tight_layout()
        fig.savefig(out / f"mip_{label}.png", dpi=180, bbox_inches="tight")
        plt.close(fig)


def build_report(
    out: Path,
    manifest: dict[str, Any],
    summaries: list[dict[str, Any]],
    all_candidates: list[SurfaceCandidate],
    exported: list[SurfaceCandidate],
) -> None:
    primary = manifest["primary"]
    zoom_names = [s["name"] for s in summaries if s["is_zoom"]]
    registered_zoom_count = sum(1 for s in summaries if s["is_zoom"] and s["registration"])

    lines = [
        "# Anatomica HOA ingestion probe",
        "",
        "## Result",
        "",
        f"- Primary source: `{primary['dataset']}`.",
        f"- HOA pyramid level fetched: **{primary['downsample_level']}**.",
        f"- Low-resolution array shape: `{tuple(primary['shape_zyx'])}` (z, y, x).",
        f"- Effective voxel spacing: **{primary['effective_voxel_um']:.2f} µm**.",
        f"- Estimated whole-volume payload: **{primary['estimated_mib']:.1f} MiB** before analysis copies.",
        f"- Matching LADAF-2021-17 heart datasets inventoried: **{len(summaries)}**.",
        f"- High-resolution/ROI datasets inventoried: **{len(zoom_names)}**.",
        f"- ROI datasets carrying registration metadata: **{registered_zoom_count}**.",
        f"- Coarse candidate surfaces exported: **{len(exported)}**.",
        "",
        "## Interpretation guardrail",
        "",
        "**No anatomical structure was accepted or validated by this experiment.**",
        "The threshold-derived meshes are only engineering probes that test whether a",
        "compact surface can be extracted from a safely downsampled HOA volume. They",
        "must not be described as myocardium, chambers, valves, vessels, or a production",
        "heart until reviewed against the source volume by an anatomy expert.",
        "",
        "## Generated evidence",
        "",
        "- `heart_datasets.csv` — upstream HOA inventory rows for the donor heart.",
        "- `dataset_manifest.json` — structured metadata and registration inventory.",
        "- `axial_z.png`, `coronal_y.png`, `sagittal_x.png` — central orthogonal slices.",
        "- `mip_z.png`, `mip_y.png`, `mip_x.png` — low-resolution MIP views.",
        "- `histogram.png` — intensity distribution for threshold exploration.",
        "- `surface_candidates.json` — all tested threshold candidates and geometric metrics.",
        "- `candidate_surface_*.glb/.ply` — at most the top few geometric candidates.",
        "",
        "## Surface candidate metrics",
        "",
        "| candidate | polarity | norm threshold | volume fraction | border fraction | score | vertices | faces |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    exported_by_name = {item.name: item for item in exported}
    for candidate in all_candidates[:12]:
        item = exported_by_name.get(candidate.name, candidate)
        lines.append(
            f"| `{item.name}` | {item.polarity} | {item.threshold_normalized:.3f} | "
            f"{item.volume_fraction:.4f} | {item.border_fraction:.4f} | "
            f"{item.heuristic_score:.4f} | {item.vertices or '-'} | {item.faces or '-'} |"
        )

    lines += [
        "",
        "## Next decision",
        "",
        "Proceed to targeted high-resolution ROI work only if the orthogonal images confirm",
        "that the complete-organ source is correctly oriented and the coarse extraction is",
        "useful as an envelope reference. Then inspect registered 6.36 µm and 2.256 µm ROIs",
        "one at a time; do not download every high-resolution volume.",
        "",
        f"Named independent valve reference discovered in the HOA inventory: `{NAMED_VALIDATION_DATASET}`. It is not treated as part of LADAF-2021-17.",
        "",
        "## Acceptance criteria",
        "",
        "- [x] Anonymous HOA access works without private credentials.",
        "- [x] Orthogonal whole-heart slices were fetched from the chunked source.",
        "- [x] The probe used the bounded level-4 volume rather than an unbounded high-resolution download.",
        f"- [{'x' if exported else ' '}] A coarse envelope candidate was extractable; if unchecked, inspect the threshold metrics rather than raising the download cap.",
        f"- [{'x' if registered_zoom_count else ' '}] ROI registration metadata is present for at least one matching high-resolution dataset.",
        "- [x] No anatomical claims are made from automated thresholding alone.",
        "",
    ]
    (out / "REPORT.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    args = parse_args()
    out = args.output
    out.mkdir(parents=True, exist_ok=True)

    inventory, names = list_matching_datasets()
    save_inventory_csv(inventory, names, out / "heart_datasets.csv")
    summaries = [dataset_summary(name) for name in names]

    primary_dataset = hoa_tools.dataset.get_dataset(PRIMARY_DATASET)
    data_array = primary_dataset.data_array(downsample_level=args.downsample_level)
    shape = tuple(int(v) for v in data_array.shape)
    dtype = np.dtype(data_array.dtype)
    estimated_bytes = int(np.prod(shape)) * dtype.itemsize
    estimated_mib = estimated_bytes / (1024**2)

    if estimated_mib > args.max_whole_volume_mib:
        raise RuntimeError(
            f"Refusing whole-volume download: estimated {estimated_mib:.1f} MiB exceeds "
            f"--max-whole-volume-mib={args.max_whole_volume_mib}. "
            "Orthogonal-slice-only mode should be implemented rather than raising this cap."
        )

    midpoint_indices = save_orthogonal_views(data_array, out)

    volume = np.asarray(data_array.compute().values)
    save_mips(volume, out)
    percentiles = save_histogram(volume, out)
    p1, p99 = normalization_parameters(volume)

    coarse, mesh_stride = coarse_for_meshing(volume, args.max_mesh_voxels)
    candidates, masks = evaluate_surface_candidates(coarse, p1, p99)

    base_voxel_um = float(primary_dataset.data.voxel_size_um)
    effective_voxel_um = base_voxel_um * (2**args.downsample_level)
    mesh_spacing_mm = effective_voxel_um * mesh_stride / 1000.0
    exported = export_surfaces(
        candidates,
        masks,
        out,
        spacing_mm=mesh_spacing_mm,
        limit=args.max_surface_candidates,
    )

    manifest = {
        "experiment": "anatomica-hoa-ingestion-probe-v1",
        "generated_with": {
            "python": sys.version,
            "platform": platform.platform(),
            "hoa_tools": version("hoa-tools"),
        },
        "source_policy": {
            "primary_role": "fine-anatomy reference candidate; not sole physiologic geometry",
            "anatomical_validation_performed": False,
            "production_asset_created": False,
            "high_resolution_bulk_download_performed": False,
        },
        "primary": {
            "dataset": PRIMARY_DATASET,
            "base_voxel_um": base_voxel_um,
            "downsample_level": int(args.downsample_level),
            "effective_voxel_um": effective_voxel_um,
            "shape_zyx": list(shape),
            "dtype": str(dtype),
            "estimated_mib": estimated_mib,
            "midpoint_indices_zyx": midpoint_indices,
            "intensity_percentiles": percentiles,
            "mesh_stride_from_downloaded_level": int(mesh_stride),
            "mesh_spacing_mm": mesh_spacing_mm,
        },
        "matching_datasets": summaries,
        "named_independent_validation_dataset": NAMED_VALIDATION_DATASET,
    }
    write_json(out / "dataset_manifest.json", manifest)
    write_json(out / "surface_candidates.json", [asdict(candidate) for candidate in candidates])
    build_report(out, manifest, summaries, candidates, exported)

    print((out / "REPORT.md").read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

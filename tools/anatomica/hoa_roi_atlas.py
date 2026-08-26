#!/usr/bin/env python3
"""Build a bounded, registration-aware ROI atlas for the LADAF-2021-17 heart.

This workflow does localization and review preparation, not anatomical segmentation.
It uses hoa-tools registration transforms to place BM18 zoom datasets into a whole-heart
overview coordinate system when possible, renders overview locator maps, generates
orthogonal previews of each ROI at a safe pyramid level, and emits a blank clinician
review queue for structure identification.

No ROI is automatically labelled as a valve, myocardium, coronary artery, chordae,
papillary muscle, septum, or any other anatomical structure.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import numpy as np

import hoa_tools.dataset
import hoa_tools.inventory
import hoa_tools.voi


DONOR = "LADAF-2021-17"
ORGAN = "heart"
PREFIX = f"{DONOR}_{ORGAN}_"
PRIMARY_OVERVIEW = "LADAF-2021-17_heart_complete-organ_19.85um_bm18"
LEGACY_OVERVIEW = "LADAF-2021-17_heart_complete-organ_25.08um_bm05"


@dataclass
class ROIRecord:
    dataset: str
    roi_group: str
    voxel_size_um: float
    source_shape_zyx: list[int]
    preview_level: int
    preview_effective_voxel_um: float
    registration_target: str | None
    canonical_status: str
    canonical_overview: str | None
    canonical_level: int | None
    x0: float | None = None
    y0: float | None = None
    z0: float | None = None
    x1: float | None = None
    y1: float | None = None
    z1: float | None = None
    direct_status: str | None = None
    direct_overview: str | None = None
    direct_x0: float | None = None
    direct_y0: float | None = None
    direct_z0: float | None = None
    direct_x1: float | None = None
    direct_y1: float | None = None
    direct_z1: float | None = None
    preview_png: str | None = None
    error: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("hoa_roi_atlas_output"))
    parser.add_argument("--locator-level", type=int, default=4)
    parser.add_argument("--preview-level", type=int, default=3)
    parser.add_argument("--max-overview-mib", type=int, default=650)
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
    path.write_text(json.dumps(payload, indent=2, sort_keys=True, default=jsonable) + "\n")


def slug(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", name).strip("-")


def roi_group(name: str) -> str:
    match = re.search(r"_ROI-([0-9]+)(?:\.([0-9]+))?_", name)
    if not match:
        return "unknown"
    return f"ROI-{int(match.group(1)):02d}"


def load_bm18_rois() -> list[Any]:
    inventory = hoa_tools.inventory.load_inventory()
    names = sorted(
        str(name)
        for name in inventory.index
        if str(name).startswith(PREFIX)
        and "_ROI-" in str(name)
        and str(name).endswith("_bm18")
    )
    return [hoa_tools.dataset.get_dataset(name) for name in names]


def array_shape(dataset: Any, level: int) -> list[int]:
    arr = dataset.data_array(downsample_level=level)
    return [int(v) for v in arr.shape]


def full_voi(dataset: Any, level: int) -> hoa_tools.voi.VOI:
    z, y, x = array_shape(dataset, level)
    return hoa_tools.voi.VOI(
        dataset=dataset,
        downsample_level=level,
        lower_corner={"x": 0, "y": 0, "z": 0},
        size={"x": x, "y": y, "z": z},
    )


def coord_dict(value: Any) -> dict[str, float]:
    if hasattr(value, "model_dump"):
        raw = value.model_dump()
        return {k: float(raw[k]) for k in ("x", "y", "z")}
    return {k: float(getattr(value, k)) for k in ("x", "y", "z")}


def transformed_bounds(source: Any, target: Any, level: int) -> dict[str, Any]:
    source_voi = full_voi(source, level)
    transformed = source_voi.transform_to(target)
    if transformed.downsample_level != level:
        transformed = transformed.change_downsample_level(new_downsample_level=level)
    lower = coord_dict(transformed.lower_corner)
    upper = coord_dict(transformed.upper_corner)
    return {
        "level": int(transformed.downsample_level),
        "x0": lower["x"],
        "y0": lower["y"],
        "z0": lower["z"],
        "x1": upper["x"],
        "y1": upper["y"],
        "z1": upper["z"],
    }


def normalize_image(image: np.ndarray) -> tuple[np.ndarray, float, float]:
    image = np.asarray(image)
    finite = image[np.isfinite(image)]
    if finite.size == 0:
        return image, 0.0, 1.0
    lo, hi = np.percentile(finite, [1, 99])
    if not np.isfinite(lo) or not np.isfinite(hi) or hi <= lo:
        lo, hi = float(np.min(finite)), float(np.max(finite))
    if hi <= lo:
        hi = lo + 1.0
    return image, float(lo), float(hi)


def save_roi_preview(dataset: Any, level: int, out: Path) -> tuple[str, list[int]]:
    arr = dataset.data_array(downsample_level=level)
    z, y, x = [int(v) for v in arr.shape]
    slices = [
        ("axial", arr.isel(z=z // 2).compute().values),
        ("coronal", arr.isel(y=y // 2).compute().values),
        ("sagittal", arr.isel(x=x // 2).compute().values),
    ]

    fig, axes = plt.subplots(1, 3, figsize=(12, 4.2))
    for ax, (label, image) in zip(axes, slices):
        image, lo, hi = normalize_image(image)
        ax.imshow(image, cmap="gray", origin="lower", vmin=lo, vmax=hi)
        ax.set_title(label)
        ax.set_axis_off()
    fig.suptitle(
        f"{dataset.name}\nlevel {level} | effective voxel {dataset.data.voxel_size_um * (2 ** level):.3f} µm | QA only",
        fontsize=10,
    )
    fig.tight_layout(rect=(0, 0, 1, 0.91))
    name = f"preview_{slug(dataset.name)}.png"
    fig.savefig(out / name, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return name, [z, y, x]


def load_overview_volume(dataset: Any, level: int, max_mib: float) -> np.ndarray:
    arr = dataset.data_array(downsample_level=level)
    estimated_mib = float(np.prod(arr.shape) * np.dtype(arr.dtype).itemsize / (1024**2))
    if estimated_mib > max_mib:
        raise RuntimeError(
            f"Overview level {level} estimated at {estimated_mib:.1f} MiB, above safety limit {max_mib:.1f} MiB"
        )
    return np.asarray(arr.compute().values)


def projection_specs(volume: np.ndarray) -> dict[str, np.ndarray]:
    return {
        "xy": np.max(volume, axis=0),
        "xz": np.max(volume, axis=1),
        "yz": np.max(volume, axis=2),
    }


def add_record_box(ax: Any, rec: ROIRecord, plane: str, index: int) -> None:
    if rec.x0 is None:
        return
    if plane == "xy":
        x0, a0, x1, a1 = rec.x0, rec.y0, rec.x1, rec.y1
    elif plane == "xz":
        x0, a0, x1, a1 = rec.x0, rec.z0, rec.x1, rec.z1
    else:
        x0, a0, x1, a1 = rec.y0, rec.z0, rec.y1, rec.z1
    assert x1 is not None and a1 is not None
    rect = Rectangle(
        (x0, a0),
        max(x1 - x0, 1),
        max(a1 - a0, 1),
        fill=False,
        linewidth=1.5 if rec.voxel_size_um <= 3 else 1.0,
        alpha=0.9,
    )
    ax.add_patch(rect)
    cx = (x0 + x1) / 2
    cy = (a0 + a1) / 2
    short = re.search(r"ROI-[0-9]+(?:\.[0-9]+)?", rec.dataset)
    ax.text(cx, cy, short.group(0) if short else str(index), fontsize=6, ha="center", va="center")


def save_locator_maps(volume: np.ndarray, records: list[ROIRecord], out: Path) -> list[str]:
    files = []
    for plane, image in projection_specs(volume).items():
        image, lo, hi = normalize_image(image)
        fig, ax = plt.subplots(figsize=(8.5, 8.5))
        ax.imshow(image, cmap="gray", origin="lower", vmin=lo, vmax=hi)
        for idx, rec in enumerate(records, 1):
            if rec.canonical_status == "mapped-primary":
                add_record_box(ax, rec, plane, idx)
        ax.set_title(
            f"LADAF-2021-17 ROI locator — {plane.upper()} projection\n"
            "Boxes are registered ROI extents, not anatomy labels"
        )
        ax.set_axis_off()
        fig.tight_layout()
        name = f"roi_locator_{plane}.png"
        fig.savefig(out / name, dpi=180, bbox_inches="tight")
        plt.close(fig)
        files.append(name)
    return files


def cuboid_edges(rec: ROIRecord) -> list[tuple[tuple[float, float, float], tuple[float, float, float]]]:
    assert None not in (rec.x0, rec.y0, rec.z0, rec.x1, rec.y1, rec.z1)
    x0, y0, z0, x1, y1, z1 = rec.x0, rec.y0, rec.z0, rec.x1, rec.y1, rec.z1
    pts = [
        (x0, y0, z0), (x1, y0, z0), (x0, y1, z0), (x1, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x0, y1, z1), (x1, y1, z1),
    ]
    pairs = [(0,1),(0,2),(1,3),(2,3),(4,5),(4,6),(5,7),(6,7),(0,4),(1,5),(2,6),(3,7)]
    return [(pts[a], pts[b]) for a, b in pairs]


def save_locator_3d(records: list[ROIRecord], primary_shape: list[int], out: Path) -> str:
    zmax, ymax, xmax = primary_shape
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection="3d")
    for rec in records:
        if rec.canonical_status != "mapped-primary" or rec.x0 is None:
            continue
        for p0, p1 in cuboid_edges(rec):
            ax.plot([p0[0], p1[0]], [p0[1], p1[1]], [p0[2], p1[2]], linewidth=0.8)
        cx = (rec.x0 + rec.x1) / 2  # type: ignore[operator]
        cy = (rec.y0 + rec.y1) / 2  # type: ignore[operator]
        cz = (rec.z0 + rec.z1) / 2  # type: ignore[operator]
        label = re.search(r"ROI-[0-9]+(?:\.[0-9]+)?", rec.dataset)
        ax.text(cx, cy, cz, label.group(0) if label else rec.roi_group, fontsize=6)
    ax.set_xlim(0, xmax)
    ax.set_ylim(0, ymax)
    ax.set_zlim(0, zmax)
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.set_zlabel("z")
    ax.set_title("Registered ROI bounding boxes in 19.85 µm whole-heart space (locator level)")
    ax.view_init(elev=22, azim=-55)
    fig.tight_layout()
    name = "roi_locator_3d.png"
    fig.savefig(out / name, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return name


def save_contact_sheet(records: list[ROIRecord], out: Path) -> str:
    ready = [r for r in records if r.preview_png]
    cols = 2
    rows = math.ceil(len(ready) / cols)
    fig, axes = plt.subplots(rows, cols, figsize=(16, max(6, rows * 4.8)))
    axes_arr = np.atleast_1d(axes).ravel()
    for ax in axes_arr:
        ax.set_axis_off()
    for ax, rec in zip(axes_arr, ready):
        image = mpimg.imread(out / str(rec.preview_png))
        ax.imshow(image)
        ax.set_title(f"{rec.dataset} | {rec.canonical_status}", fontsize=8)
        ax.set_axis_off()
    fig.suptitle("LADAF-2021-17 BM18 ROI review contact sheet — anatomy labels intentionally blank", fontsize=14)
    fig.tight_layout(rect=(0, 0, 1, 0.985))
    name = "roi_contact_sheet.png"
    fig.savefig(out / name, dpi=110, bbox_inches="tight")
    plt.close(fig)
    return name


def write_review_queue(records: list[ROIRecord], path: Path) -> None:
    fields = [
        "dataset", "roi_group", "voxel_size_um", "resolution_tier", "canonical_status",
        "canonical_overview", "candidate_structure", "candidate_substructure", "priority",
        "confidence", "review_status", "review_notes",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for rec in records:
            tier = "ultra" if rec.voxel_size_um < 3 else "high"
            writer.writerow({
                "dataset": rec.dataset,
                "roi_group": rec.roi_group,
                "voxel_size_um": rec.voxel_size_um,
                "resolution_tier": tier,
                "canonical_status": rec.canonical_status,
                "canonical_overview": rec.canonical_overview or "",
                "candidate_structure": "",
                "candidate_substructure": "",
                "priority": "",
                "confidence": "",
                "review_status": "pending-clinician-review",
                "review_notes": "",
            })


def write_localization_csv(records: list[ROIRecord], path: Path) -> None:
    keys = list(asdict(records[0]).keys()) if records else []
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        for rec in records:
            writer.writerow(asdict(rec))


def build_report(records: list[ROIRecord], out: Path, locator_level: int, preview_level: int, primary_shape: list[int]) -> None:
    primary_mapped = [r for r in records if r.canonical_status == "mapped-primary"]
    legacy_only = [r for r in records if r.canonical_status == "mapped-direct-only"]
    failed = [r for r in records if r.canonical_status == "unmapped"]
    ultra = [r for r in records if r.voxel_size_um < 3]
    ultra_primary = [r for r in ultra if r.canonical_status == "mapped-primary"]

    lines = [
        "# Anatomica Human Organ Atlas ROI atlas",
        "",
        "## Result",
        "",
        f"- BM18 heart ROI datasets reviewed: **{len(records)}**.",
        f"- Registered into canonical 19.85 µm whole-heart space: **{len(primary_mapped)}**.",
        f"- Localized only to another registered overview: **{len(legacy_only)}**.",
        f"- Unmapped after guarded attempts: **{len(failed)}**.",
        f"- Ultra-high-resolution (~2.256 µm) ROIs: **{len(ultra)}**; canonical mappings: **{len(ultra_primary)}**.",
        f"- Whole-heart locator level: **{locator_level}**; shape `{tuple(primary_shape)}` (z, y, x).",
        f"- ROI preview level: **{preview_level}**. Only central orthogonal slices were fetched.",
        "",
        "## Safety / interpretation boundary",
        "",
        "This workflow **does not assign anatomy labels and does not segment structures**. Bounding boxes represent registered scan extents only. The review queue intentionally leaves structure names blank so that valves, chordae, papillary muscles, myocardium, coronaries, septum, and other targets are not inferred from ROI numbering.",
        "",
        "## Review order",
        "",
        "1. Open `roi_contact_sheet.png` and the three `roi_locator_*.png` images.",
        "2. For any ROI that looks relevant, open its full `preview_*.png` triple view.",
        "3. Fill `roi_review_queue.csv` with the visible structure, confidence, and priority.",
        "4. Only after review, fetch a **cropped** subvolume from the selected 6.36 µm or 2.256 µm ROI at a higher pyramid level.",
        "5. Perform structure-specific segmentation with source-slice QA. Do not return to whole-volume intensity thresholding.",
        "",
        "## Acceptance gate for the next stage",
        "",
        "Proceed to high-resolution segmentation only when at least one ROI is visually confirmed to contain a target structure and its registered location is anatomically plausible in the whole-heart overview.",
        "",
        "## Outputs",
        "",
        "- `roi_atlas.json` — structured localization/provenance records.",
        "- `roi_localization.csv` — machine-readable bounds and mapping status.",
        "- `roi_review_queue.csv` — blank clinician-review worksheet.",
        "- `roi_locator_xy.png`, `roi_locator_xz.png`, `roi_locator_yz.png` — overview MIPs with registered ROI boxes.",
        "- `roi_locator_3d.png` — 3D bounding-box map.",
        "- `roi_contact_sheet.png` — all BM18 ROI triple-view previews.",
        "- `preview_*.png` — per-ROI orthogonal views.",
        "",
    ]
    out.joinpath("ROI_ATLAS_REPORT.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    args = parse_args()
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)

    primary = hoa_tools.dataset.get_dataset(PRIMARY_OVERVIEW)
    legacy = hoa_tools.dataset.get_dataset(LEGACY_OVERVIEW)
    rois = load_bm18_rois()

    records: list[ROIRecord] = []
    for dataset in rois:
        preview_png = None
        error_messages: list[str] = []
        try:
            preview_png, source_shape = save_roi_preview(dataset, args.preview_level, out)
        except Exception as exc:
            source_shape = array_shape(dataset, args.preview_level)
            error_messages.append(f"preview: {type(exc).__name__}: {exc}")

        reg = dataset.registration
        reg_target = str(reg.target_dataset) if reg is not None else None
        rec = ROIRecord(
            dataset=dataset.name,
            roi_group=roi_group(dataset.name),
            voxel_size_um=float(dataset.data.voxel_size_um),
            source_shape_zyx=source_shape,
            preview_level=args.preview_level,
            preview_effective_voxel_um=float(dataset.data.voxel_size_um * (2 ** args.preview_level)),
            registration_target=reg_target,
            canonical_status="unmapped",
            canonical_overview=None,
            canonical_level=None,
            preview_png=preview_png,
        )

        try:
            bounds = transformed_bounds(dataset, primary, args.locator_level)
            rec.canonical_status = "mapped-primary"
            rec.canonical_overview = PRIMARY_OVERVIEW
            rec.canonical_level = bounds["level"]
            for key in ("x0", "y0", "z0", "x1", "y1", "z1"):
                setattr(rec, key, bounds[key])
        except Exception as exc:
            error_messages.append(f"primary-map: {type(exc).__name__}: {exc}")

        if reg_target:
            try:
                target = primary if reg_target == PRIMARY_OVERVIEW else (
                    legacy if reg_target == LEGACY_OVERVIEW else hoa_tools.dataset.get_dataset(reg_target)
                )
                direct = transformed_bounds(dataset, target, args.locator_level)
                rec.direct_status = "mapped"
                rec.direct_overview = reg_target
                for key in ("x0", "y0", "z0", "x1", "y1", "z1"):
                    setattr(rec, f"direct_{key}", direct[key])
                if rec.canonical_status != "mapped-primary":
                    rec.canonical_status = "mapped-direct-only"
                    rec.canonical_overview = reg_target
                    rec.canonical_level = direct["level"]
            except Exception as exc:
                rec.direct_status = "failed"
                error_messages.append(f"direct-map: {type(exc).__name__}: {exc}")

        rec.error = " | ".join(error_messages) if error_messages else None
        records.append(rec)
        print(f"{dataset.name}: {rec.canonical_status}", flush=True)

    primary_arr = primary.data_array(downsample_level=args.locator_level)
    primary_shape = [int(v) for v in primary_arr.shape]
    primary_volume = load_overview_volume(primary, args.locator_level, args.max_overview_mib)
    locator_files = save_locator_maps(primary_volume, records, out)
    locator_3d = save_locator_3d(records, primary_shape, out)
    del primary_volume

    contact = save_contact_sheet(records, out)
    write_review_queue(records, out / "roi_review_queue.csv")
    write_localization_csv(records, out / "roi_localization.csv")

    atlas = {
        "experiment": "anatomica-hoa-roi-atlas-v1",
        "canonical_overview": PRIMARY_OVERVIEW,
        "legacy_overview": LEGACY_OVERVIEW,
        "locator_level": args.locator_level,
        "preview_level": args.preview_level,
        "primary_shape_zyx": primary_shape,
        "locator_files": locator_files + [locator_3d],
        "contact_sheet": contact,
        "records": [asdict(r) for r in records],
        "policy": {
            "anatomy_labels_assigned_automatically": False,
            "structure_segmentation_performed": False,
            "native_resolution_bulk_download_performed": False,
            "next_step": "clinician ROI identification, then bounded high-resolution crop and structure-specific segmentation",
        },
    }
    write_json(out / "roi_atlas.json", atlas)
    build_report(records, out, args.locator_level, args.preview_level, primary_shape)

    print(f"Wrote ROI atlas to {out}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

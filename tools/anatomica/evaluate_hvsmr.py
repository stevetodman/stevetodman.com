#!/usr/bin/env python3
"""Evaluate the ~normal HVSMR-2.0 cases for Anatomica Heart.

Downloads the public Figshare article, identifies the eight cases marked ~Normal,
computes reproducible image/segmentation quality metrics, renders four orthogonal
surface views for each candidate, ranks the candidates with a transparent heuristic,
and exports a semantic GLB of the top candidate's *segmented blood-pool/great-vessel
surfaces*.

Important: HVSMR-2.0 does not provide resolved valve leaflets/chordae/coronaries or a
full epicardial/myocardial segmentation in this release. The exported GLB is therefore
a geometry foundation, not a final anatomically complete heart model.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import sys
import zipfile
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import nibabel as nib
import numpy as np
import pandas as pd
import requests
import trimesh
from matplotlib.patches import Patch
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from scipy import ndimage
from skimage import measure

ARTICLE_ID = 25226360
FIGSHARE_API = f"https://api.figshare.com/v2/articles/{ARTICLE_ID}"

LABELS = {
    1: ("LV", "Left ventricle"),
    2: ("RV", "Right ventricle"),
    3: ("LA", "Left atrium / pulmonary-vein stumps"),
    4: ("RA", "Right atrium"),
    5: ("AO", "Aorta"),
    6: ("PA", "Pulmonary artery"),
    7: ("SVC", "Superior vena cava"),
    8: ("IVC", "Inferior vena cava"),
}

# Deliberately conventional anatomy colors for visual separation only. They do not
# encode oxygen saturation or physiology.
COLORS = {
    1: (0.78, 0.16, 0.20, 0.86),
    2: (0.18, 0.39, 0.73, 0.86),
    3: (0.92, 0.46, 0.48, 0.82),
    4: (0.34, 0.55, 0.82, 0.82),
    5: (0.76, 0.08, 0.12, 0.92),
    6: (0.10, 0.31, 0.64, 0.92),
    7: (0.20, 0.46, 0.76, 0.90),
    8: (0.20, 0.46, 0.76, 0.90),
}


def log(msg: str) -> None:
    print(msg, flush=True)


def get_json(url: str) -> dict:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.json()


def download(url: str, dst: Path, expected_size: int | None = None) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and expected_size and dst.stat().st_size == expected_size:
        log(f"Using cached {dst.name}")
        return
    log(f"Downloading {dst.name} ...")
    with requests.get(url, stream=True, timeout=(30, 600)) as r:
        r.raise_for_status()
        tmp = dst.with_suffix(dst.suffix + ".part")
        with tmp.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8 * 1024 * 1024):
                if chunk:
                    f.write(chunk)
        tmp.replace(dst)
    if expected_size and dst.stat().st_size != expected_size:
        raise RuntimeError(
            f"Size mismatch for {dst}: expected {expected_size}, got {dst.stat().st_size}"
        )


def extract_archives(root: Path) -> None:
    for z in list(root.rglob("*.zip")):
        target = z.with_suffix("")
        marker = target / ".extracted"
        if marker.exists():
            continue
        log(f"Extracting {z.name} ...")
        target.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(z) as archive:
            archive.extractall(target)
        marker.write_text("ok\n")


def truthy(value) -> bool:
    if pd.isna(value):
        return False
    s = str(value).strip().lower()
    return s not in {"", "0", "0.0", "false", "no", "none", "nan", "-"}


def find_clinical_csv(root: Path) -> Path:
    hits = list(root.rglob("hvsmr2_clinical.csv"))
    if not hits:
        hits = [p for p in root.rglob("*.csv") if "clinical" in p.name.lower()]
    if not hits:
        raise FileNotFoundError("Could not locate hvsmr2_clinical.csv")
    return hits[0]


def identify_normal_patients(df: pd.DataFrame) -> Tuple[str, List[str]]:
    normal_candidates = []
    for col in df.columns:
        name = str(col).strip().lower().replace(" ", "")
        if "normal" in name and name not in {"category"}:
            count = int(df[col].map(truthy).sum())
            normal_candidates.append((abs(count - 8), -count, col, count))
    if not normal_candidates:
        raise RuntimeError(f"No column containing 'normal' found. Columns: {list(df.columns)}")
    normal_candidates.sort()
    _, _, col, count = normal_candidates[0]
    rows = df[df[col].map(truthy)].copy()
    if rows.empty:
        raise RuntimeError(f"Normal column {col!r} had no flagged rows")
    pat_col = next((c for c in df.columns if str(c).strip().lower() == "pat"), None)
    if pat_col is None:
        raise RuntimeError("Clinical CSV does not contain Pat column")
    pats = [str(v).strip() for v in rows[pat_col].tolist()]
    log(f"Normal selector column: {col!r}; flagged rows: {len(pats)}; patients: {pats}")
    return col, pats


def normalize_pat_id(v: str) -> str:
    s = str(v).strip()
    # Handle values like 1, 1.0, pat1.
    s = re.sub(r"^pat", "", s, flags=re.I)
    if re.fullmatch(r"\d+\.0", s):
        s = s[:-2]
    return s


def matches_pat(filename: str, pat: str) -> bool:
    p = re.escape(normalize_pat_id(pat))
    return bool(re.search(rf"(^|[/_])pat0*{p}(?:_|\b)", filename, flags=re.I))


def selective_figshare_download(work: Path) -> Tuple[Path, List[str], pd.DataFrame, str]:
    meta = get_json(FIGSHARE_API)
    (work / "figshare_article.json").write_text(json.dumps(meta, indent=2))
    files = meta.get("files", [])
    if not files:
        raise RuntimeError("Figshare API returned no files")

    # First pull CSV/metadata and any archives. If the article is a single archive,
    # we need it before we can know patient IDs. If files are individual, this keeps
    # the first pass small.
    for f in files:
        name = f.get("name", "")
        low = name.lower()
        if low.endswith(".csv") or low.endswith(".json") or low.endswith(".txt") or low.endswith(".zip"):
            download(f["download_url"], work / name, f.get("size"))
    extract_archives(work)

    clinical = find_clinical_csv(work)
    df = pd.read_csv(clinical)
    normal_col, pats = identify_normal_patients(df)

    # If NIfTI files were not inside an archive, fetch just the candidate cases.
    have_nifti = list(work.rglob("*.nii.gz"))
    if not have_nifti:
        wanted = []
        for f in files:
            name = f.get("name", "")
            if name.lower().endswith(".nii.gz") and any(matches_pat(name, p) for p in pats):
                wanted.append(f)
        if not wanted:
            # Some Figshare records package the data in a non-.zip archive name.
            # Fall back to downloading all files from this *orig* article.
            log("No individual candidate NIfTI entries detected; downloading all article files.")
            wanted = files
        for f in wanted:
            name = f.get("name", f"file_{f.get('id')}")
            dst = work / name
            if not dst.exists():
                download(f["download_url"], dst, f.get("size"))
        extract_archives(work)

    return clinical, pats, df, normal_col


def find_case_files(root: Path, pat: str) -> Tuple[Path, Path]:
    pid = normalize_pat_id(pat)
    candidates = [p for p in root.rglob("*.nii.gz") if matches_pat(p.name, pid)]
    segs = [p for p in candidates if "_seg" in p.name.lower() and "endpoint" not in p.name.lower()]
    imgs = [p for p in candidates if "_seg" not in p.name.lower()]
    # Prefer explicitly original-space names.
    segs.sort(key=lambda p: ("_orig_seg" not in p.name.lower(), len(str(p))))
    imgs.sort(key=lambda p: ("_orig" not in p.name.lower(), len(str(p))))
    if not imgs or not segs:
        raise FileNotFoundError(
            f"Missing image/segmentation for patient {pat}. Found: {[p.name for p in candidates]}"
        )
    return imgs[0], segs[0]


def robust_mad(x: np.ndarray) -> float:
    x = np.asarray(x, dtype=float)
    x = x[np.isfinite(x)]
    if x.size == 0:
        return float("nan")
    med = np.median(x)
    return float(np.median(np.abs(x - med)))


def case_metrics(image_path: Path, seg_path: Path) -> Dict[str, float]:
    img_nii = nib.load(str(image_path))
    seg_nii = nib.load(str(seg_path))
    img = np.asarray(img_nii.dataobj, dtype=np.float32)
    seg = np.asarray(seg_nii.dataobj, dtype=np.int16)
    spacing = np.array(seg_nii.header.get_zooms()[:3], dtype=float)
    if img.shape[:3] != seg.shape[:3]:
        raise RuntimeError(f"Image/seg shape mismatch: {img.shape} vs {seg.shape}")

    present = [int(np.any(seg == k)) for k in LABELS]
    cc_fracs = []
    cc_counts = []
    for k in LABELS:
        mask = seg == k
        if not mask.any():
            cc_fracs.append(0.0)
            cc_counts.append(99)
            continue
        lab, n = ndimage.label(mask)
        sizes = np.bincount(lab.ravel())[1:]
        largest = sizes.max() if sizes.size else 0
        cc_fracs.append(float(largest / max(mask.sum(), 1)))
        cc_counts.append(int(n))

    heart = seg > 0
    # Edge-quality proxy: median gradient magnitude along the segmented blood-pool
    # boundary, normalized by robust gradient variability in the near-heart region.
    # This is not a diagnostic image-quality measure; it is only a relative ranking
    # aid across candidate source volumes.
    finite = np.isfinite(img)
    vals = img[finite]
    lo, hi = np.percentile(vals, [1, 99]) if vals.size else (0.0, 1.0)
    scale = max(float(hi - lo), 1e-6)
    norm = np.clip((img - lo) / scale, 0, 1)
    gx = ndimage.sobel(norm, axis=0, mode="nearest") / max(spacing[0], 1e-6)
    gy = ndimage.sobel(norm, axis=1, mode="nearest") / max(spacing[1], 1e-6)
    gz = ndimage.sobel(norm, axis=2, mode="nearest") / max(spacing[2], 1e-6)
    grad = np.sqrt(gx * gx + gy * gy + gz * gz)
    boundary = heart & ~ndimage.binary_erosion(heart, iterations=1)
    near = ndimage.binary_dilation(heart, iterations=4)
    bvals = grad[boundary]
    nvals = grad[near]
    edge = float(np.median(bvals)) if bvals.size else 0.0
    noise = 1.4826 * robust_mad(nvals) if nvals.size else float("nan")
    edge_snr = float(edge / max(noise, 1e-6)) if np.isfinite(noise) else 0.0

    voxel_count = int(heart.sum())
    return {
        "spacing_x_mm": float(spacing[0]),
        "spacing_y_mm": float(spacing[1]),
        "spacing_z_mm": float(spacing[2]),
        "mean_spacing_mm": float(spacing.mean()),
        "max_spacing_mm": float(spacing.max()),
        "isotropy_ratio": float(spacing.max() / max(spacing.min(), 1e-9)),
        "all_8_labels_present": float(sum(present) == 8),
        "labels_present": float(sum(present)),
        "mean_largest_component_fraction": float(np.mean(cc_fracs)),
        "max_components_any_label": float(max(cc_counts)),
        "segmented_voxels": float(voxel_count),
        "edge_quality_proxy": edge_snr,
    }


def flagged_columns(row: pd.Series) -> List[str]:
    keep = []
    skip = {"pat", "age", "category"}
    for col, value in row.items():
        name = str(col).strip()
        if name.lower() in skip or "normal" in name.lower():
            continue
        if truthy(value):
            keep.append(name)
    return keep


def clinical_penalty(flags: Iterable[str]) -> Tuple[float, List[str]]:
    flags = list(flags)
    penalty = 0.0
    reasons = []
    for f in flags:
        s = f.lower()
        p = 0.0
        if "artifact" in s:
            p = 1.0
        elif any(k in s for k in ["fontan", "glenn", "rastelli", "switch", "band", "anastom", "s/p", "surgery"]):
            p = 1.0
        elif any(k in s for k in ["dilat", "marfan", "tortuous", "vsd", "asd", "tga", "dorv", "heterotaxy", "dextro", "mesocardia"]):
            p = 0.75
        elif f:
            p = 0.35
        if p:
            penalty += p
            reasons.append(f)
    return penalty, reasons


def minmax_good(series: pd.Series, lower_is_better: bool = False) -> pd.Series:
    s = pd.to_numeric(series, errors="coerce").astype(float)
    if s.nunique(dropna=True) <= 1:
        out = pd.Series(np.ones(len(s)), index=s.index)
    else:
        mn, mx = s.min(), s.max()
        out = (s - mn) / max(mx - mn, 1e-12)
    if lower_is_better:
        out = 1.0 - out
    return out.fillna(0.0)


def rank_cases(df: pd.DataFrame) -> pd.DataFrame:
    # Transparent heuristic: spatial sampling and structural integrity dominate;
    # image boundary sharpness and absence of clinical/anatomic caveats break ties.
    score = (
        0.25 * minmax_good(df["mean_spacing_mm"], lower_is_better=True)
        + 0.15 * minmax_good(df["isotropy_ratio"], lower_is_better=True)
        + 0.15 * minmax_good(df["segmented_voxels"], lower_is_better=False)
        + 0.15 * minmax_good(df["mean_largest_component_fraction"], lower_is_better=False)
        + 0.10 * minmax_good(df["max_components_any_label"], lower_is_better=True)
        + 0.15 * minmax_good(df["edge_quality_proxy"], lower_is_better=False)
        + 0.05 * df["all_8_labels_present"].astype(float)
    )
    # Clinical flags are a veto-like penalty because a ~Normal connection pattern can
    # coexist with prior intervention, dilation, or acquisition artifact.
    score = score - 0.12 * df["clinical_penalty"].clip(upper=3.0)
    out = df.copy()
    out["heuristic_score"] = score
    out = out.sort_values(["heuristic_score", "mean_spacing_mm"], ascending=[False, True]).reset_index(drop=True)
    out.insert(0, "rank", np.arange(1, len(out) + 1))
    return out


def build_meshes(seg_path: Path, max_faces_per_structure: int = 45000) -> Dict[int, trimesh.Trimesh]:
    nii = nib.load(str(seg_path))
    seg = np.asarray(nii.dataobj, dtype=np.int16)
    meshes: Dict[int, trimesh.Trimesh] = {}
    for label in LABELS:
        mask = seg == label
        if not mask.any():
            continue
        verts, faces, normals, values = measure.marching_cubes(mask.astype(np.uint8), level=0.5)
        verts_world = nib.affines.apply_affine(nii.affine, verts)
        mesh = trimesh.Trimesh(vertices=verts_world, faces=faces, process=False)
        # Keep previews and web-export lightweight. Quadratic decimation is optional
        # in trimesh and may not be available; use deterministic face sampling only
        # for plotting while preserving the full mesh for GLB export.
        meshes[label] = mesh
    return meshes


def set_equal_axes(ax, mins: np.ndarray, maxs: np.ndarray) -> None:
    center = (mins + maxs) / 2
    radius = max(maxs - mins) / 2 * 1.08
    radius = max(radius, 1.0)
    ax.set_xlim(center[0] - radius, center[0] + radius)
    ax.set_ylim(center[1] - radius, center[1] + radius)
    ax.set_zlim(center[2] - radius, center[2] + radius)
    ax.set_box_aspect((1, 1, 1))


def render_case(seg_path: Path, title: str, out_png: Path) -> None:
    meshes = build_meshes(seg_path)
    if not meshes:
        raise RuntimeError(f"No meshes generated for {seg_path}")
    allv = np.vstack([m.vertices for m in meshes.values()])
    mins, maxs = allv.min(axis=0), allv.max(axis=0)

    views = [
        ("Anterior", 0, 90),
        ("Posterior", 0, -90),
        ("Right lateral", 0, 0),
        ("Left lateral", 0, 180),
    ]
    fig = plt.figure(figsize=(13, 11), dpi=150)
    for i, (name, elev, azim) in enumerate(views, 1):
        ax = fig.add_subplot(2, 2, i, projection="3d")
        for label, mesh in meshes.items():
            faces = mesh.faces
            if len(faces) > 35000:
                idx = np.linspace(0, len(faces) - 1, 35000, dtype=int)
                faces = faces[idx]
            tri = mesh.vertices[faces]
            c = COLORS[label]
            poly = Poly3DCollection(tri, facecolor=c[:3], edgecolor="none", alpha=c[3])
            ax.add_collection3d(poly)
        set_equal_axes(ax, mins, maxs)
        ax.view_init(elev=elev, azim=azim)
        ax.set_axis_off()
        ax.set_title(name, fontsize=11)
    legend = [Patch(facecolor=COLORS[k][:3], label=LABELS[k][0]) for k in LABELS if k in meshes]
    fig.legend(handles=legend, loc="lower center", ncol=8, frameon=False, fontsize=9)
    fig.suptitle(title, fontsize=14, y=0.98)
    fig.text(
        0.5,
        0.015,
        "Surfaces represent provided HVSMR-2.0 chamber/great-vessel segmentation labels; not valve leaflets or full myocardium.",
        ha="center",
        fontsize=8,
    )
    fig.tight_layout(rect=(0, 0.04, 1, 0.96))
    out_png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_png, bbox_inches="tight")
    plt.close(fig)


def make_contact_sheet(images: List[Path], labels: List[str], out: Path) -> None:
    from PIL import Image, ImageDraw, ImageFont

    thumbs = []
    for p in images:
        im = Image.open(p).convert("RGB")
        im.thumbnail((900, 760))
        thumbs.append(im.copy())
    cols = 2
    rows = math.ceil(len(thumbs) / cols)
    cell_w, cell_h = 920, 810
    canvas = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
    draw = ImageDraw.Draw(canvas)
    for i, (im, label) in enumerate(zip(thumbs, labels)):
        x = (i % cols) * cell_w + (cell_w - im.width) // 2
        y = (i // cols) * cell_h + 35
        canvas.paste(im, (x, y))
        draw.text(((i % cols) * cell_w + 20, (i // cols) * cell_h + 8), label, fill="black")
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, quality=92)


def export_glb(seg_path: Path, out_glb: Path) -> None:
    meshes = build_meshes(seg_path)
    scene = trimesh.Scene()
    for label, mesh in meshes.items():
        short, long_name = LABELS[label]
        rgba = np.array(COLORS[label]) * 255
        mesh.visual.face_colors = np.tile(rgba.astype(np.uint8), (len(mesh.faces), 1))
        scene.add_geometry(mesh, node_name=short, geom_name=short)
    out_glb.parent.mkdir(parents=True, exist_ok=True)
    payload = scene.export(file_type="glb")
    out_glb.write_bytes(payload)


def write_summary(ranked: pd.DataFrame, normal_col: str, out: Path) -> None:
    best = ranked.iloc[0]
    lines = [
        "# Anatomica Heart — HVSMR-2.0 normal-case evaluation",
        "",
        "## Result",
        "",
        f"**Provisional best source case: patient {best['patient']}** (heuristic score {best['heuristic_score']:.3f}).",
        "",
        "This is a reproducible engineering selection among the cases marked approximately normal in the dataset. It is **not** a clinical diagnosis or a claim that the selected heart is a canonical normal atlas.",
        "",
        "## Selection basis",
        "",
        f"The clinical CSV selector used was `{normal_col}`. Candidates were ranked using spatial resolution, voxel isotropy, segmented sampling density, connected-component integrity, an MRI boundary-sharpness proxy, presence of all eight provided labels, and penalties for flagged artifacts/interventions/anatomic caveats.",
        "",
        "The ranking is intentionally transparent and should be followed by clinician visual review before treating any case as the Anatomica reference geometry.",
        "",
        "## Ranking",
        "",
        "| Rank | Patient | Age | Score | Mean spacing (mm) | Isotropy | 8 labels | Edge proxy | Clinical flags |",
        "|---:|---|---:|---:|---:|---:|---:|---:|---|",
    ]
    for _, r in ranked.iterrows():
        flags = str(r.get("clinical_flags", "")) or "—"
        age = r.get("age", "")
        lines.append(
            f"| {int(r['rank'])} | {r['patient']} | {age} | {r['heuristic_score']:.3f} | {r['mean_spacing_mm']:.3f} | {r['isotropy_ratio']:.3f} | {int(r['all_8_labels_present'])} | {r['edge_quality_proxy']:.3f} | {flags} |"
        )
    lines += [
        "",
        "## Critical limitation",
        "",
        "HVSMR-2.0 provides labels for LV, RV, LA, RA, aorta, pulmonary artery, SVC, and IVC. These are primarily chamber/blood-pool and great-vessel surfaces. This release does **not** provide a complete final heart asset with resolved valve leaflets, chordae, coronary arteries, or a full epicardial/myocardial shell. The generated GLB is therefore named and treated as a **blood-pool/great-vessel foundation**.",
        "",
        "## Recommended next gate",
        "",
        "1. Clinician review of the eight rendered candidates and the top-ranked case in orthogonal views.",
        "2. Verify the selected case has no clinically meaningful residual/postoperative morphology hidden by the broad `~Normal` connection label.",
        "3. Use the chosen case as geometric ground truth for chambers/great vessels, then add separately sourced and reviewed myocardium, valves, subvalvar structures, and coronaries.",
        "4. Preserve source attribution to Pace et al., HVSMR-2.0, CC BY 4.0.",
        "",
    ]
    out.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", type=Path, default=Path(".cache/hvsmr"))
    ap.add_argument("--output", type=Path, default=Path("hvsmr_output"))
    args = ap.parse_args()
    work = args.work.resolve()
    output = args.output.resolve()
    work.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)

    clinical_path, pats, clinical_df, normal_col = selective_figshare_download(work)
    pat_col = next(c for c in clinical_df.columns if str(c).strip().lower() == "pat")
    age_col = next((c for c in clinical_df.columns if str(c).strip().lower() == "age"), None)

    records = []
    render_paths = []
    case_files = {}
    for pat in pats:
        img_path, seg_path = find_case_files(work, pat)
        case_files[normalize_pat_id(pat)] = (img_path, seg_path)
        log(f"Evaluating patient {pat}: {img_path.name} / {seg_path.name}")
        m = case_metrics(img_path, seg_path)
        rowmatch = clinical_df[clinical_df[pat_col].astype(str).map(normalize_pat_id) == normalize_pat_id(pat)]
        crow = rowmatch.iloc[0] if not rowmatch.empty else pd.Series(dtype=object)
        flags = flagged_columns(crow)
        penalty, reasons = clinical_penalty(flags)
        rec = {
            "patient": normalize_pat_id(pat),
            "age": crow.get(age_col, "") if age_col else "",
            "image_file": img_path.name,
            "segmentation_file": seg_path.name,
            "clinical_flags": "; ".join(flags),
            "clinical_penalty": penalty,
            **m,
        }
        records.append(rec)

        png = output / "candidate_renders" / f"patient_{normalize_pat_id(pat)}.png"
        render_case(seg_path, f"HVSMR-2.0 ~Normal candidate — patient {normalize_pat_id(pat)}", png)
        render_paths.append(png)

    raw = pd.DataFrame(records)
    ranked = rank_cases(raw)
    ranked.to_csv(output / "ranking.csv", index=False)
    write_summary(ranked, normal_col, output / "SUMMARY.md")

    labels = []
    order_paths = []
    for _, r in ranked.iterrows():
        p = output / "candidate_renders" / f"patient_{r['patient']}.png"
        order_paths.append(p)
        labels.append(f"Rank {int(r['rank'])}: patient {r['patient']} — score {r['heuristic_score']:.3f}")
    make_contact_sheet(order_paths, labels, output / "contact_sheet.png")

    best_pat = str(ranked.iloc[0]["patient"])
    best_img, best_seg = case_files[best_pat]
    shutil.copy2(output / "candidate_renders" / f"patient_{best_pat}.png", output / "best_candidate_preview.png")
    export_glb(best_seg, output / "best_candidate_blood_pool.glb")
    (output / "best_candidate.json").write_text(
        json.dumps(
            {
                "patient": best_pat,
                "image_file": best_img.name,
                "segmentation_file": best_seg.name,
                "license": "CC BY 4.0",
                "source": "Pace et al. HVSMR-2.0, Figshare article 25226360 v2",
                "doi": "10.6084/m9.figshare.25226360.v2",
                "scope": "Provided chamber/blood-pool and great-vessel segmentation surfaces only; not final myocardium/valve/coronary anatomy.",
            },
            indent=2,
        )
        + "\n"
    )
    log(f"Best provisional candidate: patient {best_pat}")
    log(f"Outputs: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

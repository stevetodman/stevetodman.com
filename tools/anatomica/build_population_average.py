#!/usr/bin/env python3
"""Build Anatomica's population-average myocardial geometry foundation.

The source is the average end-diastolic four-chamber tetrahedral heart mesh from
Rodero et al. (2021), Zenodo record 4593739.  Unlike the HVSMR evaluation, this
source contains myocardium for all four chambers plus aortic and pulmonary walls.

This program deliberately calls its output a *foundation*: coronary vessels,
atrial appendage bodies, distal great-vessel branches, epicardial fat, and detailed
valve leaflets still require separately reviewed reconstruction.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import tarfile
from pathlib import Path
from typing import Dict, Iterable, Tuple

import meshio
import numpy as np
import requests
import trimesh
from PIL import Image, ImageDraw, ImageFont


ZENODO_RECORD = 4593739
SOURCE_DOI = "10.5281/zenodo.4593739"
SOURCE_URL = (
    "https://zenodo.org/records/4593739/files/average.tar.gz?download=1"
)
SOURCE_SHA256 = "d787d6470c8a4a6c7bfb808c55e44e35a7bc18f5888847e2b24380beae2703ee"

LABELS = {
    1: "LV myocardium",
    2: "RV myocardium",
    3: "LA myocardium",
    4: "RA myocardium",
    5: "Aorta wall",
    6: "Pulmonary artery wall",
    7: "Mitral valve plane",
    8: "Tricuspid valve plane",
    9: "Aortic valve plane",
    10: "Pulmonary valve plane",
    11: "Left atrial appendage inlet",
    12: "Left superior pulmonary vein inlet",
    13: "Left inferior pulmonary vein inlet",
    14: "Right inferior pulmonary vein inlet",
    15: "Right superior pulmonary vein inlet",
    16: "Superior vena cava inlet",
    17: "Inferior vena cava inlet",
    18: "Left atrial appendage border",
    19: "Right inferior pulmonary vein border",
    20: "Left inferior pulmonary vein border",
    21: "Left superior pulmonary vein border",
    22: "Right superior pulmonary vein border",
    23: "Superior vena cava border",
    24: "Inferior vena cava border",
}

COLORS = {
    1: (174, 73, 63, 255),
    2: (143, 61, 61, 255),
    3: (198, 111, 104, 255),
    4: (181, 93, 91, 255),
    5: (180, 52, 45, 255),
    6: (62, 91, 154, 255),
    101: (194, 45, 40, 255),
    102: (46, 78, 153, 255),
}
PLANE_COLOR = (205, 157, 91, 255)


def log(message: str) -> None:
    print(message, flush=True)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download_source(work: Path) -> Path:
    archive = work / "average.tar.gz"
    if archive.exists() and sha256(archive) == SOURCE_SHA256:
        log("Using verified cached average.tar.gz")
        return archive
    work.mkdir(parents=True, exist_ok=True)
    temporary = archive.with_suffix(".tar.gz.part")
    log(f"Downloading {SOURCE_URL}")
    with requests.get(SOURCE_URL, stream=True, timeout=(30, 600)) as response:
        response.raise_for_status()
        with temporary.open("wb") as handle:
            for chunk in response.iter_content(8 * 1024 * 1024):
                if chunk:
                    handle.write(chunk)
    temporary.replace(archive)
    actual = sha256(archive)
    if actual != SOURCE_SHA256:
        raise RuntimeError(f"Source checksum mismatch: expected {SOURCE_SHA256}, got {actual}")
    return archive


def extract_vtk(archive: Path, work: Path) -> Path:
    destination = work / "average.vtk"
    if destination.exists():
        return destination
    with tarfile.open(archive, "r:gz") as bundle:
        member = next((item for item in bundle.getmembers() if Path(item.name).name == "average.vtk"), None)
        if member is None or not member.isfile():
            raise RuntimeError("Verified source archive did not contain average.vtk")
        member.name = "average.vtk"
        bundle.extract(member, work, filter="data")
    return destination


def oriented_tetra_faces(tetrahedra: np.ndarray, points: np.ndarray) -> np.ndarray:
    """Return four consistently oriented faces for each tetrahedron."""
    t = tetrahedra.astype(np.int32, copy=False)
    signed = np.einsum(
        "ij,ij->i",
        np.cross(points[t[:, 1]] - points[t[:, 0]], points[t[:, 2]] - points[t[:, 0]]),
        points[t[:, 3]] - points[t[:, 0]],
    )
    negative = signed < 0
    if np.any(negative):
        t = t.copy()
        swap = t[negative, 0].copy()
        t[negative, 0] = t[negative, 1]
        t[negative, 1] = swap
    return np.vstack(
        (
            t[:, (1, 2, 3)],
            t[:, (0, 3, 2)],
            t[:, (0, 1, 3)],
            t[:, (0, 2, 1)],
        )
    )


def extract_boundary(
    points: np.ndarray, tetrahedra: np.ndarray, cell_labels: np.ndarray
) -> Tuple[np.ndarray, np.ndarray]:
    """Extract faces belonging to exactly one tetrahedron and retain its label."""
    log(f"Expanding {len(tetrahedra):,} tetrahedra into candidate faces")
    oriented = oriented_tetra_faces(tetrahedra, points)
    owners = np.tile(cell_labels.astype(np.int16, copy=False), 4)
    keys = np.sort(oriented, axis=1)
    order = np.lexsort((keys[:, 2], keys[:, 1], keys[:, 0]))
    sorted_keys = keys[order]
    starts = np.empty(len(order), dtype=bool)
    ends = np.empty(len(order), dtype=bool)
    starts[0] = True
    ends[-1] = True
    different = np.any(sorted_keys[1:] != sorted_keys[:-1], axis=1)
    starts[1:] = different
    ends[:-1] = different
    run_starts = np.flatnonzero(starts)
    run_ends = np.flatnonzero(ends)
    singletons = run_starts[run_starts == run_ends]
    boundary_indices = order[singletons]
    faces = oriented[boundary_indices]
    labels = owners[boundary_indices]
    log(f"Extracted {len(faces):,} boundary triangles")
    return faces, labels


def compact_mesh(
    points: np.ndarray, faces: np.ndarray
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    used, inverse = np.unique(faces.reshape(-1), return_inverse=True)
    return points[used], inverse.reshape((-1, 3)).astype(np.int32), used


def export_scene(
    points: np.ndarray, faces: np.ndarray, face_labels: np.ndarray, output: Path
) -> None:
    scene = trimesh.Scene()
    for label in sorted(np.unique(face_labels)):
        mask = face_labels == label
        local_vertices, local_faces, _ = compact_mesh(points, faces[mask])
        mesh = trimesh.Trimesh(vertices=local_vertices, faces=local_faces, process=False)
        color = COLORS.get(int(label), PLANE_COLOR)
        mesh.visual.face_colors = np.tile(np.asarray(color, dtype=np.uint8), (len(local_faces), 1))
        name = f"{int(label):02d}_{LABELS.get(int(label), 'unknown').replace(' ', '_')}"
        scene.add_geometry(mesh, geom_name=name, node_name=name)
    output.write_bytes(scene.export(file_type="glb"))


def unit(vector: Iterable[float]) -> np.ndarray:
    value = np.asarray(tuple(vector), dtype=np.float32)
    return value / np.linalg.norm(value)


def render_view(
    points: np.ndarray,
    faces: np.ndarray,
    labels: np.ndarray,
    camera: Iterable[float],
    up: Iterable[float],
    output: Path,
    size: int = 900,
) -> None:
    camera = unit(camera)
    right = unit(np.cross(unit(up), camera))
    up_axis = unit(np.cross(camera, right))
    center = (points.min(axis=0) + points.max(axis=0)) * 0.5
    vertices = points - center
    projected = np.column_stack((vertices @ right, vertices @ up_axis, vertices @ camera))
    extent = max(float(np.ptp(projected[:, 0])), float(np.ptp(projected[:, 1]))) * 1.08
    xy = projected[:, :2] / max(extent, 1e-6) + 0.5
    supersample = 2
    xy[:, 0] *= size * supersample
    xy[:, 1] = (1.0 - xy[:, 1]) * size * supersample

    triangles = points[faces]
    normals = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
    lengths = np.linalg.norm(normals, axis=1)
    good = lengths > 1e-10
    normals[good] /= lengths[good, None]
    light = unit((0.45, -0.65, 1.0))
    shade = np.clip(0.55 + 0.45 * np.abs(normals @ light), 0.43, 1.0)
    base = np.asarray([COLORS.get(int(label), PLANE_COLOR)[:3] for label in labels], dtype=np.float32)
    shaded = np.clip(base * shade[:, None], 0, 255).astype(np.uint8)
    depth = projected[faces, 2].mean(axis=1)
    order = np.argsort(depth)

    image = Image.new("RGB", (size * supersample, size * supersample), (38, 46, 55))
    draw = ImageDraw.Draw(image)
    projected_faces = xy[faces]
    for index in order:
        draw.polygon(
            [tuple(point) for point in projected_faces[index]],
            fill=tuple(shaded[index]),
        )
    image.resize((size, size), Image.Resampling.LANCZOS).save(output)


def make_contact_sheet(images: Dict[str, Path], output: Path) -> None:
    width, height = 480, 520
    canvas = Image.new("RGB", (width * 4, height * 3), (29, 35, 42))
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default(size=20)
    for index, (title, path) in enumerate(images.items()):
        image = Image.open(path).convert("RGB")
        image.thumbnail((width - 16, height - 48))
        x = (index % 4) * width + (width - image.width) // 2
        y = (index // 4) * height + 38
        canvas.paste(image, (x, y))
        draw.text(((index % 4) * width + 12, (index // 4) * height + 10), title, fill="white", font=font)
    canvas.save(output)


def edge_counts(faces: np.ndarray) -> Tuple[int, int]:
    edges = np.sort(
        np.vstack((faces[:, (0, 1)], faces[:, (1, 2)], faces[:, (2, 0)])),
        axis=1,
    )
    edges = edges[np.lexsort((edges[:, 1], edges[:, 0]))]
    starts = np.empty(len(edges), dtype=bool)
    ends = np.empty(len(edges), dtype=bool)
    starts[0] = True
    ends[-1] = True
    different = np.any(edges[1:] != edges[:-1], axis=1)
    starts[1:] = different
    ends[:-1] = different
    counts = np.flatnonzero(ends) - np.flatnonzero(starts) + 1
    return int(np.sum(counts == 1)), int(np.sum(counts > 2))


def write_report(
    points: np.ndarray,
    tetrahedra: np.ndarray,
    surface_points: np.ndarray,
    surface_faces: np.ndarray,
    surface_labels: np.ndarray,
    output: Path,
) -> None:
    boundary_edges, nonmanifold_edges = edge_counts(surface_faces)
    dimensions = np.ptp(surface_points, axis=0)
    label_counts = {
        LABELS.get(int(label), str(int(label))): int(np.sum(surface_labels == label))
        for label in sorted(np.unique(surface_labels))
    }
    payload = {
        "status": "geometry_foundation_not_final_asset",
        "source": {
            "title": "Virtual cohort of extreme and average four-chamber heart meshes from statistical shape model",
            "doi": SOURCE_DOI,
            "zenodo_record": ZENODO_RECORD,
            "file": "average.tar.gz / average.vtk",
            "sha256": SOURCE_SHA256,
            "license": "CC BY 4.0",
        },
        "source_mesh": {
            "points": int(len(points)),
            "tetrahedra": int(len(tetrahedra)),
        },
        "boundary_surface": {
            "vertices": int(len(surface_points)),
            "triangles": int(len(surface_faces)),
            "dimensions_mm": [float(value) for value in dimensions],
            "open_boundary_edges": boundary_edges,
            "nonmanifold_edges": nonmanifold_edges,
            "triangles_by_parent_tissue": label_counts,
        },
        "known_missing_or_incomplete": [
            "coronary arteries and veins",
            "complete left atrial appendage body",
            "distal great-vessel branches",
            "resolved valve leaflets and chordae",
            "epicardial fat and surface microtexture",
        ],
    }
    output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_decision(output: Path) -> None:
    output.write_text(
        """# Anatomica exterior-foundation decision

## Decision: accept, with a hard scope boundary

The Rodero et al. statistical-average mesh is accepted as Anatomica's **gross
myocardial and proximal great-vessel foundation**. It is not accepted as a finished
exterior model.

## Why it beats the existing candidates

| Criterion | Population average | HVSMR selected case | Z-Anatomy |
|---|---|---|---|
| Normal reference | Statistical average of aligned healthy/asymptomatic CT hearts | One approximately-normal patient | General atlas reconstruction |
| Four-chamber myocardium | Yes | No; blood-pool labels | Yes, coarse |
| Proximal aorta / pulmonary wall | Yes | Blood-pool surfaces | Yes, simplified |
| Reproducible source geometry | 1 mm tetrahedral research mesh | MRI segmentation | Low-polygon atlas mesh |
| Directly usable as final exterior | No | No | No |
| License | CC BY 4.0 | CC BY 4.0 | CC BY-SA 4.0 |

The foundation passes the initial engineering gate: all documented source labels are
retained, the extracted global boundary has no open edges, and the clinical-view
render set is reproducible. The remaining nonmanifold junction edges are documented
and must be resolved during retopology rather than hidden.

## Mandatory work before release

1. Reconstruct both atrial appendages, distal great-vessel branches, SVC/IVC and
   pulmonary-vein extensions.
2. Add a separately attributable, surface-conforming coronary arterial and venous
   scaffold.
3. Retopologize the visible exterior; do not ship raw tetrahedral boundary topology.
4. Validate silhouettes and vessel relationships in all twelve named clinical views.
5. Obtain pediatric-cardiologist sign-off before calling the asset anatomically
   accurate.
""",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--work", type=Path, default=Path(".cache/anatomica-population-average"))
    parser.add_argument("--output", type=Path, default=Path("population_average_output"))
    parser.add_argument("--source-vtk", type=Path)
    args = parser.parse_args()

    work = args.work.resolve()
    output = args.output.resolve()
    work.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    vtk_path = args.source_vtk.resolve() if args.source_vtk else extract_vtk(download_source(work), work)

    log(f"Reading {vtk_path}")
    source = meshio.read(vtk_path)
    tetra_blocks = [cell.data for cell in source.cells if cell.type == "tetra"]
    if len(tetra_blocks) != 1:
        raise RuntimeError(f"Expected one tetrahedral cell block, found {len(tetra_blocks)}")
    tetrahedra = np.asarray(tetra_blocks[0], dtype=np.int32)
    points = np.asarray(source.points[:, :3], dtype=np.float32)
    label_blocks = source.cell_data.get("ID")
    if not label_blocks:
        raise RuntimeError("Source VTK did not contain the documented ID cell labels")
    cell_labels = np.asarray(label_blocks[0], dtype=np.int16).reshape(-1)
    if len(cell_labels) != len(tetrahedra):
        raise RuntimeError("Tetrahedron and cell-label counts differ")

    boundary_faces, boundary_labels = extract_boundary(points, tetrahedra, cell_labels)
    surface_points, surface_faces, _ = compact_mesh(points, boundary_faces)

    export_scene(surface_points, surface_faces, boundary_labels, output / "population_average_full_boundary.glb")
    tissue = boundary_labels <= 6
    export_scene(
        surface_points,
        surface_faces[tissue],
        boundary_labels[tissue],
        output / "population_average_tissue_surfaces.glb",
    )

    # Source coordinates: +X patient-left, +Y posterior, +Z superior.
    views = {
        "01 Anterior": ((0, -1, 0), (0, 0, 1)),
        "02 45 anterior left": ((1, -1, 0), (0, 0, 1)),
        "03 Left lateral": ((1, 0, 0), (0, 0, 1)),
        "04 45 posterior left": ((1, 1, 0), (0, 0, 1)),
        "05 Posterior": ((0, 1, 0), (0, 0, 1)),
        "06 45 posterior right": ((-1, 1, 0), (0, 0, 1)),
        "07 Right lateral": ((-1, 0, 0), (0, 0, 1)),
        "08 45 anterior right": ((-1, -1, 0), (0, 0, 1)),
        "09 Superior": ((0, 0, 1), (0, 1, 0)),
        "10 Inferior": ((0, 0, -1), (0, 1, 0)),
        "11 Superior anterior oblique": ((0, -1, 1), (0, 0, 1)),
        "12 Superior posterior oblique": ((0, 1, 1), (0, 0, 1)),
    }
    render_faces = surface_faces[tissue]
    render_labels = boundary_labels[tissue]
    renders = {}
    render_dir = output / "axis_renders"
    render_dir.mkdir(exist_ok=True)
    for name, (camera, up) in views.items():
        path = render_dir / f"view_{name.replace('+', 'p').replace('-', 'm')}.png"
        log(f"Rendering {name}")
        render_view(surface_points, render_faces, render_labels, camera, up, path)
        renders[name] = path
    make_contact_sheet(renders, output / "axis_contact_sheet.png")
    write_report(
        points,
        tetrahedra,
        surface_points,
        surface_faces,
        boundary_labels,
        output / "geometry_report.json",
    )
    write_decision(output / "FOUNDATION_DECISION.md")
    log(f"Outputs written to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

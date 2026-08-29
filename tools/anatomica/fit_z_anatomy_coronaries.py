#!/usr/bin/env python3
"""Fit the open Z-Anatomy coronary scaffold to the population-average heart.

This is an attributable *initial scaffold*, not a claim that atlas centerlines are
patient-level measurements. A similarity transform is solved from the centroids of
the four chambers in both sources. The resulting coronary paths must pass the same
twelve-view clinical review as the myocardial foundation.
"""

from __future__ import annotations

import argparse
import gzip
import json
import re
from pathlib import Path

import meshio
import numpy as np
import trimesh

from build_population_average import (
    COLORS,
    compact_mesh,
    download_source,
    extract_boundary,
    extract_vtk,
    make_contact_sheet,
    render_view,
)


CHAMBERS = ("Left ventricle", "Right ventricle", "Left atrium", "Right atrium")


def umeyama(source: np.ndarray, target: np.ndarray):
    source_center = source.mean(axis=0)
    target_center = target.mean(axis=0)
    centered_source = source - source_center
    centered_target = target - target_center
    covariance = centered_target.T @ centered_source / len(source)
    u, singular, vt = np.linalg.svd(covariance)
    correction = np.eye(3)
    if np.linalg.det(u) * np.linalg.det(vt) < 0:
        correction[-1, -1] = -1
    rotation = u @ correction @ vt
    variance = np.sum(centered_source * centered_source) / len(source)
    scale = float(np.trace(np.diag(singular) @ correction) / variance)
    translation = target_center - scale * (rotation @ source_center)
    return scale, rotation, translation


def transform(points: np.ndarray, scale: float, rotation: np.ndarray, translation: np.ndarray):
    return (scale * (rotation @ points.T)).T + translation


def cubic(p0, p1, p2, p3, samples=8):
    t = np.linspace(0.0, 1.0, samples, endpoint=False)[:, None]
    return (
        (1 - t) ** 3 * p0
        + 3 * (1 - t) ** 2 * t * p1
        + 3 * (1 - t) * t**2 * p2
        + t**3 * p3
    )


def sample_spline(spline):
    if spline["kind"] != "BEZIER":
        return np.asarray(spline["points"], dtype=np.float64)
    controls = spline["points"]
    if len(controls) < 2:
        return np.empty((0, 3), dtype=np.float64)
    segments = []
    last = len(controls) if spline.get("cyclic") else len(controls) - 1
    for index in range(last):
        following = (index + 1) % len(controls)
        segments.append(
            cubic(
                np.asarray(controls[index]["co"]),
                np.asarray(controls[index]["handle_right"]),
                np.asarray(controls[following]["handle_left"]),
                np.asarray(controls[following]["co"]),
            )
        )
    points = np.vstack(segments + [np.asarray(controls[last % len(controls)]["co"])[None, :]])
    keep = np.ones(len(points), dtype=bool)
    keep[1:] = np.linalg.norm(points[1:] - points[:-1], axis=1) > 1e-8
    return points[keep]


def vessel_radius(name: str, system: str) -> float:
    lower = name.lower()
    if "coronary sinus" in lower:
        return 2.0
    if name in {"Left coronary artery", "Right coronary artery"}:
        return 1.55
    if "anterior interventricular" in lower or "circumflex" in lower:
        return 1.2
    if "great cardiac" in lower:
        return 1.35
    if "middle cardiac" in lower:
        return 1.1
    return 0.8 if system == "artery" else 0.9


def tube(points: np.ndarray, radius: float, sides: int = 8) -> trimesh.Trimesh:
    if len(points) < 2:
        raise ValueError("A vessel tube requires at least two points")
    tangents = np.gradient(points, axis=0)
    tangents /= np.maximum(np.linalg.norm(tangents, axis=1, keepdims=True), 1e-9)
    rings = []
    previous_normal = None
    for point, tangent in zip(points, tangents):
        if previous_normal is None:
            reference = np.asarray((0.0, 0.0, 1.0))
            if abs(float(np.dot(reference, tangent))) > 0.9:
                reference = np.asarray((0.0, 1.0, 0.0))
            normal = np.cross(tangent, reference)
        else:
            normal = previous_normal - tangent * np.dot(previous_normal, tangent)
        normal /= max(float(np.linalg.norm(normal)), 1e-9)
        binormal = np.cross(tangent, normal)
        angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)
        rings.append(
            point[None, :]
            + radius * (np.cos(angles)[:, None] * normal + np.sin(angles)[:, None] * binormal)
        )
        previous_normal = normal
    vertices = np.vstack(rings)
    faces = []
    for index in range(len(points) - 1):
        for side in range(sides):
            following = (side + 1) % sides
            a = index * sides + side
            b = index * sides + following
            c = (index + 1) * sides + following
            d = (index + 1) * sides + side
            faces.extend(((a, b, c), (a, c, d)))
    start_center = len(vertices)
    end_center = start_center + 1
    vertices = np.vstack((vertices, points[0], points[-1]))
    final = (len(points) - 1) * sides
    for side in range(sides):
        following = (side + 1) % sides
        faces.append((start_center, following, side))
        faces.append((end_center, final + side, final + following))
    return trimesh.Trimesh(vertices=vertices, faces=faces, process=False)


def safe_name(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_")
    return value or "unnamed_cardiac_vein"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--centerlines", type=Path, required=True)
    parser.add_argument("--source-vtk", type=Path)
    parser.add_argument("--work", type=Path, default=Path(".cache/anatomica-population-average"))
    parser.add_argument("--foundation", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("coronary_scaffold_output"))
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)

    vtk_path = args.source_vtk.resolve() if args.source_vtk else extract_vtk(download_source(args.work.resolve()), args.work.resolve())
    source = meshio.read(vtk_path)
    points = np.asarray(source.points[:, :3], dtype=np.float32)
    tetrahedra = np.asarray(source.cells_dict["tetra"], dtype=np.int32)
    cell_labels = np.asarray(source.cell_data_dict["ID"]["tetra"], dtype=np.int16).reshape(-1)
    if args.centerlines.suffix == ".gz":
        with gzip.open(args.centerlines, "rt", encoding="utf-8") as handle:
            data = json.load(handle)
    else:
        data = json.loads(args.centerlines.read_text(encoding="utf-8"))

    z_landmarks = np.asarray([data["landmarks"][name] for name in CHAMBERS], dtype=np.float64)
    target_landmarks = np.asarray(
        [points[np.unique(tetrahedra[cell_labels == label])].mean(axis=0) for label in range(1, 5)],
        dtype=np.float64,
    )
    scale, rotation, translation = umeyama(z_landmarks, target_landmarks)
    predicted = transform(z_landmarks, scale, rotation, translation)
    errors = np.linalg.norm(predicted - target_landmarks, axis=1)

    vessel_meshes = []
    manifest = []
    for vessel in data["vessels"]:
        display_name = vessel["name"] if set(vessel["name"]) != {"?"} else "Small cardiac vein"
        for spline_index, spline in enumerate(vessel["splines"]):
            sampled = sample_spline(spline)
            if len(sampled) < 2:
                continue
            fitted = transform(sampled, scale, rotation, translation)
            mesh = tube(fitted, vessel_radius(display_name, vessel["system"]))
            color_label = 101 if vessel["system"] == "artery" else 102
            mesh.visual.face_colors = np.tile(
                np.asarray(COLORS[color_label], dtype=np.uint8), (len(mesh.faces), 1)
            )
            name = f"{vessel['system']}_{safe_name(display_name)}_{spline_index:02d}"
            vessel_meshes.append((name, vessel["system"], mesh))
            manifest.append(
                {
                    "name": name,
                    "anatomical_name": display_name,
                    "system": vessel["system"],
                    "radius_mm": vessel_radius(display_name, vessel["system"]),
                    "sampled_centerline_points": int(len(fitted)),
                }
            )

    combined = trimesh.load_scene(args.foundation.resolve())
    coronary_scene = trimesh.Scene()
    for name, system, mesh in vessel_meshes:
        combined.add_geometry(mesh.copy(), geom_name=name, node_name=name)
        coronary_scene.add_geometry(mesh.copy(), geom_name=name, node_name=name)
    (output / "population_average_with_coronary_scaffold.glb").write_bytes(combined.export(file_type="glb"))
    (output / "coronary_scaffold_only.glb").write_bytes(coronary_scene.export(file_type="glb"))

    boundary_faces, boundary_labels = extract_boundary(points, tetrahedra, cell_labels)
    surface_points, surface_faces, _ = compact_mesh(points, boundary_faces)
    tissue = boundary_labels <= 6
    render_vertices = [surface_points]
    render_faces = [surface_faces[tissue]]
    render_labels = [boundary_labels[tissue]]
    offset = len(surface_points)
    for _, system, mesh in vessel_meshes:
        render_vertices.append(np.asarray(mesh.vertices, dtype=np.float32))
        render_faces.append(np.asarray(mesh.faces, dtype=np.int32) + offset)
        render_labels.append(np.full(len(mesh.faces), 101 if system == "artery" else 102, dtype=np.int16))
        offset += len(mesh.vertices)
    render_vertices = np.vstack(render_vertices)
    render_faces = np.vstack(render_faces)
    render_labels = np.concatenate(render_labels)

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
    render_dir = output / "clinical_renders"
    render_dir.mkdir(exist_ok=True)
    renders = {}
    for name, (camera, up) in views.items():
        path = render_dir / f"view_{name[:2]}.png"
        render_view(render_vertices, render_faces, render_labels, camera, up, path)
        renders[name] = path
    make_contact_sheet(renders, output / "clinical_contact_sheet.png")

    report = {
        "status": "provisional_attributable_coronary_scaffold",
        "alignment": {
            "method": "four-chamber-centroid Umeyama similarity transform",
            "scale": scale,
            "rotation": rotation.tolist(),
            "translation": translation.tolist(),
            "landmark_errors_mm": dict(zip(CHAMBERS, errors.tolist())),
            "rms_error_mm": float(np.sqrt(np.mean(errors**2))),
        },
        "sources": [
            {"doi": "10.5281/zenodo.4593739", "license": "CC BY 4.0"},
            data["source"],
        ],
        "license_effect": "Combined coronary scaffold derivative must be distributed under CC BY-SA 4.0.",
        "vessels": manifest,
        "mandatory_review": [
            "coronary ostial positions relative to the aortic root",
            "LAD and great cardiac vein course in the anterior interventricular groove",
            "RCA course in the right atrioventricular groove",
            "circumflex course in the left atrioventricular groove",
            "posterior descending and coronary-sinus relationships",
            "surface penetration or floating segments after statistical-heart fitting",
        ],
    }
    (output / "coronary_alignment_report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

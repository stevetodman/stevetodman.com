"""Build the Exam Room 3 HCM vertical-slice graybox in Unreal Engine 5.8.

Run this inside the Unreal Editor Python environment on the reference M4 Max.
It creates measured graybox geometry, the eligible exam-table proxy, patient and
parent proxies, three locked CineCamera actors, and the C++ runtime controller.
The controller starts `case-hcm` only when Play In Editor begins.

This script intentionally does NOT place CH-WALLECG-001. That asset remains
blocked by the portable fit gate.
"""

from __future__ import annotations

import json
from pathlib import Path

import unreal

PREFIX = "VS_ExamRoom3HCM_"
FOLDER = "CardioHospital/VerticalSlices/ExamRoom3HCM"
CONTRACT_PATH = Path(__file__).with_name("acceptance-contract.json")


def cm(vector_m):
    return tuple(float(value) * 100.0 for value in vector_m)


def load_contract():
    return json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))


def clear_previous_build():
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.get_actor_label().startswith(PREFIX):
            unreal.EditorLevelLibrary.destroy_actor(actor)


def spawn_cube(label, size_cm, location_cm):
    cube = unreal.EditorAssetLibrary.load_asset("/Engine/BasicShapes/Cube.Cube")
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        unreal.StaticMeshActor,
        unreal.Vector(*location_cm),
    )
    actor.set_actor_label(PREFIX + label)
    actor.set_folder_path(FOLDER)
    actor.static_mesh_component.set_static_mesh(cube)
    actor.set_actor_scale3d(
        unreal.Vector(size_cm[0] / 100.0, size_cm[1] / 100.0, size_cm[2] / 100.0)
    )
    return actor


def spawn_proxy(label, location_cm, scale=(0.45, 0.45, 1.7)):
    actor = spawn_cube(label, (100.0, 100.0, 100.0), location_cm)
    actor.set_actor_scale3d(unreal.Vector(*scale))
    return actor


def spawn_camera(camera):
    location = unreal.Vector(*cm(camera["locationMeters"]))
    target = unreal.Vector(*cm(camera["targetMeters"]))
    rotation = unreal.MathLibrary.find_look_at_rotation(location, target)
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        unreal.CineCameraActor,
        location,
        rotation,
    )
    actor.set_actor_label(PREFIX + "Camera_" + camera["id"])
    actor.set_folder_path(FOLDER)
    actor.get_cine_camera_component().set_editor_property(
        "current_focal_length", float(camera["lensMm"])
    )
    return actor


def spawn_room_shell(contract):
    room = contract["architecture"]["roomMeters"]
    width, depth, height = room["width"] * 100.0, room["depth"] * 100.0, room["height"] * 100.0
    wall = 12.0
    floor = 8.0
    door = contract["architecture"]["doorMeters"]
    door_width = door["width"] * 100.0
    door_x = -105.0

    spawn_cube("Floor", (width, depth, floor), (0.0, 0.0, -floor / 2.0))
    spawn_cube("Wall_West", (wall, depth, height), (-width / 2.0, 0.0, height / 2.0))
    spawn_cube("Wall_East", (wall, depth, height), (width / 2.0, 0.0, height / 2.0))
    spawn_cube("Wall_North", (width, wall, height), (0.0, depth / 2.0, height / 2.0))

    left_width = (door_x - door_width / 2.0) - (-width / 2.0)
    right_width = (width / 2.0) - (door_x + door_width / 2.0)
    spawn_cube(
        "Wall_South_Left",
        (left_width, wall, height),
        ((-width / 2.0 + door_x - door_width / 2.0) / 2.0, -depth / 2.0, height / 2.0),
    )
    spawn_cube(
        "Wall_South_Right",
        (right_width, wall, height),
        ((door_x + door_width / 2.0 + width / 2.0) / 2.0, -depth / 2.0, height / 2.0),
    )


def spawn_slice_contents(contract):
    table = contract["zones"]["examTable"]
    spawn_cube("ExamTable_Proxy", cm(table["sizeMeters"]), cm(table["locationMeters"]))

    patient = contract["actors"]["patient"]
    spawn_proxy("Patient_Proxy", cm(patient["proxyLocationMeters"]), (0.42, 0.42, 0.82))

    parent = contract["actors"]["parent"]
    spawn_proxy("Parent_Proxy", cm(parent["proxyLocationMeters"]), (0.42, 0.42, 0.90))

    for camera in contract["cameras"]:
        spawn_camera(camera)


def spawn_runtime_controller(contract):
    controller_class = getattr(unreal, "CardioExamRoom3SliceController", None)
    if controller_class is None:
        raise RuntimeError(
            "CardioExamRoom3SliceController is unavailable. Compile the C++ target before building the slice."
        )

    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        controller_class,
        unreal.Vector(0.0, 0.0, 0.0),
    )
    actor.set_actor_label(PREFIX + "RuntimeController")
    actor.set_folder_path(FOLDER)
    actor.set_editor_property("case_id", contract["caseId"])
    actor.set_editor_property("b_start_case_on_begin_play", True)
    return actor


def main():
    contract = load_contract()
    clear_previous_build()
    spawn_room_shell(contract)
    spawn_slice_contents(contract)
    spawn_runtime_controller(contract)
    unreal.EditorLevelLibrary.save_current_level()
    unreal.log(
        "Exam Room 3 HCM slice built. CH-WALLECG-001 remains blocked. "
        "Enter PIE and verify the runtime controller starts case-hcm."
    )


if __name__ == "__main__":
    main()

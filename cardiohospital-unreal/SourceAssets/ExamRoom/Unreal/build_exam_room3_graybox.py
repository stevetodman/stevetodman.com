"""Unreal Editor Python — measured Exam Room 3 graybox.

Run on the M4 Max inside UE 5.8 after copying this file somewhere the
editor Python path can see (project Content/Python is typical).

    py build_exam_room3_graybox.py

Creates placeholder static meshes in centimetres from the Gate 1 layout.
Does not import the Blender shell and does not touch clinical subsystems.
"""

from __future__ import annotations

# Numbers duplicated on purpose so this file runs inside Unreal without
# importing the Blender-side layout module.
ROOM_W = 427.0
ROOM_D = 396.0
ROOM_H = 274.0
WALL = 12.0
DOOR_W = 91.0
DOOR_H = 213.0
DOOR_X = -105.0
WINDOW_W = 180.0
WINDOW_H = 120.0
WINDOW_X = 55.0
WINDOW_SILL = 95.0


def _spawn_box(name, size, location, folder="/Game/Environments/ExamRoom3/Graybox"):
    import unreal

    loc = unreal.Vector(location[0], location[1], location[2])
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.StaticMeshActor, loc)
    actor.set_actor_label(name)
    # Scale the engine cube (100 cm) to the requested centimetre size.
    actor.set_actor_scale3d(unreal.Vector(size[0] / 100.0, size[1] / 100.0, size[2] / 100.0))
    return actor


def main():
    import unreal

    unreal.log("Building measured Exam Room 3 graybox (cm)")
    _spawn_box("GB_Floor", (ROOM_W, ROOM_D, 8.0), (0, 0, -4))
    _spawn_box("GB_Wall_West", (WALL, ROOM_D, ROOM_H), (-ROOM_W / 2.0, 0, ROOM_H / 2.0))
    _spawn_box("GB_Wall_East", (WALL, ROOM_D, ROOM_H), (ROOM_W / 2.0, 0, ROOM_H / 2.0))
    _spawn_box("GB_Wall_North", (ROOM_W, WALL, ROOM_H), (0, ROOM_D / 2.0, ROOM_H / 2.0))
    # South wall left and right of the door opening.
    left_w = (DOOR_X - DOOR_W / 2.0) - (-ROOM_W / 2.0)
    right_w = (ROOM_W / 2.0) - (DOOR_X + DOOR_W / 2.0)
    _spawn_box(
        "GB_Wall_South_Left",
        (left_w, WALL, ROOM_H),
        ((-ROOM_W / 2.0 + DOOR_X - DOOR_W / 2.0) / 2.0, -ROOM_D / 2.0, ROOM_H / 2.0),
    )
    _spawn_box(
        "GB_Wall_South_Right",
        (right_w, WALL, ROOM_H),
        ((DOOR_X + DOOR_W / 2.0 + ROOM_W / 2.0) / 2.0, -ROOM_D / 2.0, ROOM_H / 2.0),
    )
    _spawn_box("GB_Casework", (62.0, 220.0, 90.0), (-182.5, 25.0, 45.0))
    _spawn_box("GB_Table", (182.0, 72.0, 94.0), (35.0, 147.0, 47.0))
    unreal.log("Exam Room 3 graybox spawned. Walk the 91 cm door and StartCase.")


if __name__ == "__main__":
    main()

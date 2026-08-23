"""Run the native Exam Room 3 HCM acceptance pass inside Unreal Editor 5.8.

This script is intended for UnrealEditor-Cmd with -ExecutePythonScript. It:
1. builds/loads the isolated automation map,
2. captures the three locked editor-camera views,
3. starts PIE,
4. replays the deterministic optimal HCM action path through the real C++ controller,
5. verifies case acceptance,
6. emits machine-readable evidence, and
7. exits the editor.

It does not claim the separate human/manual walkthrough gate or performance gate.
"""

from __future__ import annotations

import json
import os
import sys
import traceback
from pathlib import Path

import unreal

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import build_in_unreal  # noqa: E402

PREFIX = "VS_ExamRoom3HCM_"
EVIDENCE_DIR = Path(os.environ.get("CARDIO_HCM_EVIDENCE_DIR", str(SCRIPT_DIR / "native-evidence"))).resolve()
CAPTURE_DIR = EVIDENCE_DIR / "captures"
RESULT_PATH = EVIDENCE_DIR / "unreal-acceptance.json"
CAPTURE_WIDTH = 2560
CAPTURE_HEIGHT = 1440

OPTIMAL_PATH = [
    ("system.load", {}),
    ("world.enter", {}),
    ("navigate.workroom", {}),
    ("attending.open-assignment", {}),
    ("assignment.accept", {}),
    ("navigate.exam-room", {}),
    ("encounter.introduce", {}),
    ("history.generic", {}),
    ("history.exertional-timing", {}),
    ("history.family-sudden-death", {}),
    ("history.prodrome", {}),
    ("history.finish", {}),
    ("exam.general", {}),
    ("exam.vitals", {}),
    ("exam.auscultation", {}),
    ("exam.finish", {}),
    ("order.ecg", {}),
    ("review.ecg", {}),
    ("order.echo", {}),
    ("review.echo", {}),
    ("testing.finish", {}),
    ("navigate.return-workroom", {}),
    (
        "reasoning.submit",
        {
            "diagnosis": "Hypertrophic Cardiomyopathy",
            "evidence": ["mid-exertional syncope", "family sudden death"],
        },
    ),
    ("reasoning.finish", {}),
    ("management.restrict-sports", {}),
    ("management.finish", {}),
    ("debrief.review", {}),
    ("performance.record", {}),
    ("next-case.begin", {}),
]


def write_result(status: str, **extra):
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "schemaVersion": 1,
        "sliceId": "exam-room3-hcm",
        "caseId": "case-hcm",
        "status": status,
        "manualWalkthroughClaimed": False,
        "performanceClaimed": False,
        **extra,
    }
    RESULT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def fail(error: Exception):
    message = f"{type(error).__name__}: {error}"
    unreal.log_error("Exam Room 3 HCM acceptance failed: " + message)
    write_result(
        "failure",
        error=message,
        traceback=traceback.format_exc(),
    )
    try:
        level_editor = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
        if level_editor.is_in_play_in_editor():
            level_editor.editor_request_end_play()
    except Exception:
        pass
    unreal.EditorPythonScripting.set_keep_python_script_alive(False)


def camera_actors_by_id():
    actors = unreal.EditorLevelLibrary.get_all_level_actors()
    cameras = {}
    for actor in actors:
        label = actor.get_actor_label()
        marker = PREFIX + "Camera_"
        if label.startswith(marker):
            cameras[label[len(marker):]] = actor
    return cameras


def perform_action(controller, action_id: str, payload: dict):
    available = [str(value) for value in controller.get_available_case_actions()]
    if action_id not in available:
        raise RuntimeError(
            f"Action {action_id} is not available. Available actions: {available}"
        )

    raw = controller.perform_case_action(action_id, json.dumps(payload, separators=(",", ":")))
    if isinstance(raw, tuple):
        succeeded = bool(raw[0])
        detail = raw[1] if len(raw) > 1 else None
    else:
        succeeded = bool(raw)
        detail = None
    if not succeeded:
        detail_text = str(detail) if detail is not None else "no result detail"
        raise RuntimeError(f"Action {action_id} failed: {detail_text}")


def acceptance_flow():
    completed_actions = []
    capture_manifest = []

    try:
        EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
        CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
        write_result("running")

        build_in_unreal.main()

        cameras = camera_actors_by_id()
        expected_ids = ["doorway", "patient-side", "provider"]
        missing = [camera_id for camera_id in expected_ids if camera_id not in cameras]
        if missing:
            raise RuntimeError(f"Missing locked camera actors: {missing}")

        for camera_id in expected_ids:
            capture_path = CAPTURE_DIR / f"{camera_id}.png"
            if capture_path.exists():
                capture_path.unlink()
            task = unreal.AutomationLibrary.take_high_res_screenshot(
                CAPTURE_WIDTH,
                CAPTURE_HEIGHT,
                str(capture_path),
                camera=cameras[camera_id],
                force_game_view=True,
            )
            if not task.is_valid_task():
                raise RuntimeError(f"Screenshot task was invalid for camera {camera_id}")
            while not task.is_task_done():
                yield
            if not capture_path.exists() or capture_path.stat().st_size == 0:
                raise RuntimeError(f"Screenshot was not written for camera {camera_id}: {capture_path}")
            capture_manifest.append(
                {
                    "id": camera_id,
                    "path": str(capture_path),
                    "bytes": capture_path.stat().st_size,
                    "width": CAPTURE_WIDTH,
                    "height": CAPTURE_HEIGHT,
                }
            )

        level_editor = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
        level_editor.editor_request_begin_play()

        pie_world = None
        for _ in range(600):
            worlds = unreal.EditorLevelLibrary.get_pie_worlds(False)
            if worlds:
                pie_world = worlds[0]
                break
            yield
        if pie_world is None:
            raise RuntimeError("PIE world did not become available")

        controller_class = getattr(unreal, "CardioExamRoom3SliceController", None)
        if controller_class is None:
            raise RuntimeError("CardioExamRoom3SliceController class is unavailable in PIE")

        controllers = unreal.GameplayStatics.get_all_actors_of_class(pie_world, controller_class)
        controller = controllers[0] if controllers else None
        for _ in range(300):
            if controller is None:
                controllers = unreal.GameplayStatics.get_all_actors_of_class(pie_world, controller_class)
                controller = controllers[0] if controllers else None
            if controller is not None and "system.load" in [str(v) for v in controller.get_available_case_actions()]:
                break
            yield
        if controller is None:
            raise RuntimeError("Runtime controller was not found in PIE")

        for action_id, payload in OPTIMAL_PATH:
            perform_action(controller, action_id, payload)
            completed_actions.append(action_id)

        if not bool(controller.has_passed_case_acceptance()):
            raise RuntimeError("C++ runtime completed the action replay without passing acceptance")

        level_editor.editor_request_end_play()
        for _ in range(300):
            if not level_editor.is_in_play_in_editor():
                break
            yield
        if level_editor.is_in_play_in_editor():
            raise RuntimeError("PIE did not end cleanly")

        write_result(
            "success",
            mapPath=build_in_unreal.MAP_PATH,
            clinicalAcceptancePassed=True,
            completedActions=completed_actions,
            captures=capture_manifest,
            lockedCaptureCount=len(capture_manifest),
            wallEcgPlaced=False,
        )
        unreal.log("Exam Room 3 HCM native acceptance evidence completed successfully.")
        unreal.EditorPythonScripting.set_keep_python_script_alive(False)
    except Exception as error:
        fail(error)


EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
unreal.EditorPythonScripting.set_keep_python_script_alive(True)
unreal.AutomationScheduler.add_latent_command(acceptance_flow)

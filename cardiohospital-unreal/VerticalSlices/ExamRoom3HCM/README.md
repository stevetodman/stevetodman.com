# Exam Room 3 HCM vertical slice

This slice joins the measured Exam Room 3 benchmark to the existing deterministic `case-hcm` runtime. It is deliberately small: one room, one adolescent patient, one parent, one exam table, one case controller, three locked cameras, and one complete HCM reasoning path.

## Architectural boundary

- `UCardioCaseRuntimeSubsystem` owns clinical truth and case progression.
- `ACardioExamRoom3SliceController` is a thin Unreal presentation adapter.
- Room geometry, actor staging, asset eligibility, and cameras live in `acceptance-contract.json`.
- The Unreal Python builder may create presentation actors, but it must not author or mutate clinical facts.
- `CH-WALLECG-001` is intentionally blocked because the current asset exceeds the locked ECG zone on projection and width.

## Portable gate

From the repository root:

```bash
node cardiohospital-unreal/Tools/validate-exam-room3-hcm-slice.mjs
node --test cardiohospital-unreal/Tests/exam-room3-hcm-slice.test.mjs
```

The normal `Cardio Hospital Unreal` workflow also discovers this test through `cardiohospital-unreal/Tests/*.test.mjs`.

## Native UE 5.8 gate on the M4 Max

1. Check out this branch on the reference workstation.
2. Run the existing macOS validation/build path and compile the Editor target.
3. Open the CardioHospital project in UE 5.8.
4. Run `VerticalSlices/ExamRoom3HCM/build_in_unreal.py` in the Unreal Python environment.
5. Enter Play In Editor and confirm the controller starts `case-hcm`.
6. Complete the HCM acceptance path through the existing case runtime.
7. Capture doorway, patient-side, and provider views using the three locked CineCamera actors.
8. Record native compile, automation, walkthrough, camera, and performance evidence before advancing the slice.

## Hard gates

The slice does not advance if any of the following occurs:

- required HCM actions disappear from the deterministic graph;
- presentation code is allowed to own clinical truth;
- the exam table no longer fits its locked zone;
- the current wall ECG is promoted despite its known mismatch;
- any locked camera is removed;
- native Unreal compilation or the real walkthrough fails.

## Evidence boundary

The repository-side work proves the contract, deterministic graph binding, and pre-integration spatial rules. It does **not** prove that UE 5.8 compiles the new controller, that the Python builder executes successfully in the live editor, that the room is visually approved, or that the packaged slice meets the performance target. Those are workstation gates and must be evidenced from the M4 Max run.

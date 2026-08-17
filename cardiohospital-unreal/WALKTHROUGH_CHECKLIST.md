# Packaged vertical-slice walkthrough

This is the Unreal adaptation of section 166 in `LegacyCore/plan.md`. It is a
human acceptance gate, not an automated test. Do not mark it passed from an
Editor session, an unpackaged build, `-NullRHI` automation, screenshots alone,
or a package produced from dirty or unknown source.

## Before the run

1. On the M4 Max, run `./Scripts/check-workstation.sh` as the normal user and
   keep its fresh JSON report under `Saved/WorkstationReports`. The PowerShell
   Monday-preflight script is retained history, not the release gate (ADR-0002).
2. Run portable validation, project generation, Editor compilation, and Unreal
   automation successfully (`./Scripts/run-first-build.sh`).
3. Commit and push the validated source, confirm the worktree is clean, and run
   `./Scripts/package-macos.sh`.
4. Do not edit, replace, or add files in the package directory. Launch the
   `CardioHospital.app` listed in that package's `build-manifest.json`. Do not
   clear quarantine by hand.
5. Use 2560×1440 on the Apple silicon reference workstation. Capture a
   performance artifact such as an Unreal Insights trace or exported CSV.
   `stat fps`, `stat unit`, `stat RHI`, `stat memory`, and `stat streaming`
   can provide the measurements, but a visible overlay by itself is not a
   preserved artifact. No Windows FPS figure may be carried forward.

## Nineteen acceptance steps

Record a step as passed only when it works in the exact packaged `.app`.

1. The packaged executable starts without an Editor or missing-prerequisite error.
2. The learner enters the rendered outpatient cardiology environment.
3. Keyboard-and-mouse movement and camera control work naturally.
4. The learner can find and enter the cardiology team room.
5. Dr. Patel can be engaged with voice, gaze, listening, and facial behavior.
6. Dr. Patel assigns the exertional-syncope patient without changing clinical truth.
7. The learner can navigate to Exam Room 3.
8. The learner can interact with Marcus Chen and the parent.
9. Clinically relevant history can be obtained and recorded.
10. The focused physical examination can be performed and recorded.
11. An ECG can be ordered through the encounter workflow.
12. The deterministic ECG result can be reviewed.
13. Echocardiography can be ordered and reviewed when appropriate.
14. The learner can return to Dr. Patel without leaving the world.
15. The learner can communicate a diagnosis and supporting reasoning.
16. The learner can choose management, including the exercise-safety decision.
17. The learner receives detailed, case-specific deterministic feedback.
18. The attempt and its content version are persisted without patient identifiers.
19. A contrastive next case can begin without leaving the hospital world.

Any failed, blocked, skipped, or unimplemented step means the walkthrough did
not pass. Record a failed run rather than weakening the checklist.

## Performance evidence

The Unreal quality gate is stable 60 FPS at 2560×1440 on the Apple silicon
reference workstation (ADR-0002). The evidence recorder requires:

- average FPS of at least 60;
- 95th-percentile frame time no greater than 16.7 ms;
- observed minimum FPS, draw calls, triangle count, GPU memory, texture memory,
  NPC count, and cold-start time;
- at least one preserved trace, CSV, log, or screenshot artifact containing the
  performance capture; and
- a fresh passing workstation report from the preceding 24 hours.

The minimum-FPS value is preserved for review but is not silently converted
into a different pass threshold. If the run does not feel stable despite the
numeric threshold, record it as failed.

## Record the result

For a failed or incomplete run:

```bash
./Scripts/record-walkthrough-evidence.sh \
  --package-directory "./PackagedBuilds/Mac-Development-..." \
  --workstation-report "./Saved/WorkstationReports/..." \
  --outcome Failed \
  --confirm-exact-package-run \
  --passed-steps 1,2,3,4,7 \
  --notes "Step 5 failed: no packaged voice/face pass."
```

The PowerShell recorder remains as history. Prefer the shell script on the
release machine. If flag names differ after merge, use the script's own
`--help` rather than inventing a pass.

For a passing run, explicitly provide all steps and measured values:

```powershell
./Scripts/Record-WalkthroughEvidence.ps1 `
  -PackageDirectory "./PackagedBuilds/Win64-Development-..." `
  -WorkstationReportPath "./Saved/WorkstationReports/monday-preflight-....json" `
  -Outcome Passed `
  -ConfirmExactPackageRun `
  -ConfirmStudioDriver `
  -PassedAcceptanceStep (1..19) `
  -AverageFps 60.8 `
  -MinimumFps 54.2 `
  -FrameTimeP95Ms 16.5 `
  -DrawCalls 1350 `
  -Triangles 2800000 `
  -GpuMemoryMB 9100 `
  -TextureMemoryMB 3400 `
  -NpcCount 3 `
  -StartupSeconds 8.4 `
  -EvidenceArtifactPath "./Saved/Profiling/cardio-walkthrough.csv"
```

The recorder verifies every existing package hash, rejects unlisted or modified
files, binds the evidence to the package ID, source commit, executable hash, and
workstation report hash, then adds the evidence and capture hashes to the
manifest. Only a complete passing record changes `walkthroughPassed` to true.

Do not put PHI, credentials, operator identity, workstation paths, or
institutional secrets in notes or capture artifacts.

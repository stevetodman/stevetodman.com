# Cardio Hospital Unreal engineering rules

## Scope

Build the team-room-to-exam-room vertical slice before expanding the hospital.
Clinical correctness and a complete learner loop outrank environment breadth.

## Architecture

- Keep immutable clinical truth in `Content/Data/clinical-content.json`.
- Load it through `UCardioClinicalDataSubsystem`.
- Keep scoring deterministic and independent of animation timing.
- Treat MetaHuman actors as presentation adapters, never data stores.
- Prefer C++, JSON, Unreal Python, and commandlets over fragile manual editor work.

## Quality gates

- No primitive placeholder NPC may appear in a production build.
- Dialogue requires voice, gaze behavior, listening behavior, and facial motion.
- Interactions must remain usable with keyboard and mouse without VR hardware.
- Target stable 60 FPS at 2560×1440 on the RTX 4090 development workstation.
- Do not claim a walkthrough passed unless the packaged build was actually run.

## Privacy

- Never add real patient identifiers or PHI.
- Do not upload institutional credentials, tokens, or local workstation details.

## Source control

- Do not commit `Binaries`, `DerivedDataCache`, `Intermediate`, or `Saved`.
- Use Git LFS selectively for approved binary source assets.
- Commit at coherent, reversible milestones.


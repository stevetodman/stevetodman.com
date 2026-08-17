# AAA vertical slice — visual & experience target

> Look-development target for `cardiohospital-unreal` (UE 5.8).  
> Not a claim that this fidelity is already shipped.

## Player experience (5–12 min)

1. **Load into the team room** — Soft daylight, quiet HVAC, conference table, wall ECG with traces. Clinic morning, not a game lobby.
2. **Dr. Patel (MetaHuman)** — Gaze, listen, face, VO. Assigns exertional-syncope case without changing LegacyCore clinical truth.
3. **Corridor** — Short walk to Exam Room 3. No loading screen.
4. **Exam Room 3** — Exam table, stool, wall monitor. Marcus + parent with the same performance bar.
5. **Case work** — History → exam → ECG → optional echo → return to Patel → diagnosis + exercise-safety → deterministic debrief.
6. **Performance** — Stable 60 FPS at 2560×1440 on packaged exe with three MetaHumans in view.

## Visual bar

| Element | Target |
|--------|--------|
| Spaces | Real materials, Lumen GI, clinic not plastic graybox |
| Props | Few hero assets, correct scale (table, ECG wall, workstation first) |
| People | MetaHuman; medical clothing reads at conversation distance |
| UI | Minimal, clinical |
| Audio | Spatial VO, quiet room tone |

## Out of scope until slice passes

- Full multi-floor hospital
- Procedural/primitive NPCs in production builds
- Browser/WebGL as the primary product surface
- Invented structured results to silence authoring warnings

## Definition of done

Matches `WALKTHROUGH_CHECKLIST.md`: packaged executable, 19/19 acceptance steps, recorded performance evidence, `walkthroughPassed` only via `Record-WalkthroughEvidence.ps1`.

## Related docs

- [Unreal + Blender workflow](./UNREAL_BLENDER_WORKFLOW.md)
- [Blender export cheatsheet](./BLENDER_EXPORT_CHEATSHEET.md)
- [Content folder map](./CONTENT_FOLDERS.md)
- [Grok Imagine reference prompts](./IMAGINE_PROMPTS.md)

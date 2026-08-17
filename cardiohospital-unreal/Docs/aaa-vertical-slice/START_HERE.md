# START HERE — AAA outpatient vertical slice

**Goal:** Ship one packaged, measurable experience  
Team room → Dr. Patel assigns HCM/exertional-syncope case → Exam Room 3 → Marcus + parent → debrief  
at **stable 60 FPS @ 2560×1440**, with MetaHuman-grade characters and no clinical lies.

This is the only fidelity target until `walkthroughPassed` is true.

---

## Read in this order (15 minutes)

1. [AAA_VERTICAL_SLICE_TARGET.md](./AAA_VERTICAL_SLICE_TARGET.md) — what “done” looks and feels like  
2. [UNREAL_BLENDER_WORKFLOW.md](./UNREAL_BLENDER_WORKFLOW.md) — phases A→D and tool roles  
3. Root project rules: [`../../AGENTS.md`](../../AGENTS.md)  
4. Acceptance gate: [`../../WALKTHROUGH_CHECKLIST.md`](../../WALKTHROUGH_CHECKLIST.md)

Skim when needed:
- [BLENDER_EXPORT_CHEATSHEET.md](./BLENDER_EXPORT_CHEATSHEET.md)
- [CONTENT_FOLDERS.md](./CONTENT_FOLDERS.md)
- [IMAGINE_PROMPTS.md](./IMAGINE_PROMPTS.md) — 2D refs only, not meshes

---

## Non-negotiables (do not violate)

| Rule | Why |
|------|-----|
| Clinical truth only in LegacyCore → generated `Content/Data/clinical-content.json` | Actors must not own case logic |
| No primitive / mannequin NPCs in a **packaged** build | `AGENTS.md` production bar |
| Dialogue needs voice + gaze + listening + facial motion | Steps 5 and 8 of the walkthrough |
| Never invent structured lab/echo results to silence warnings | Medical integrity |
| No PHI, credentials, workstation paths in notes or captures | Privacy |
| `walkthroughPassed` only via `Record-WalkthroughEvidence.ps1` on a **packaged** exe | No Editor false greens |

---

## What to do this week (single path)

### Day 1–2 — Phase A (playable graybox)
1. Open `cardiohospital-unreal` in **UE 5.8** on Windows (see `IT_PREREQUISITES.md` / `LOCAL_HANDOFF.md`).
2. Create map `Content/Maps/OutpatientClinic_VSlice`.
3. Block out **Team Room**, short **corridor**, **Exam Room 3** with engine primitives (scale in **meters**).
4. Keyboard/mouse move + look; collision so you can enter both rooms.
5. Placeholder interact volumes on Patel / Marcus / parent positions (Editor-only stubs are fine **until** package).
6. Call into `UCardioCaseRuntimeSubsystem` (`StartCase`, `GetAvailableActions`, `PerformAction`) for the HCM path — do not reimplement branching in Blueprint.

**Exit criteria:** You can walk Team Room → Room 3 and trigger the case start without crashing.

### Day 3–4 — Phase B (clinical loop on graybox)
1. Drive the full HCM loop: assignment → history → exam → ECG → optional echo → return → diagnosis/management → debrief.
2. Confirm persistence and content version with **no PHI**.
3. Confirm a second case can start without leaving the world.

**Exit criteria:** Steps 6, 9–19 work in Editor against real LegacyCore data. Art still graybox is OK.

### Day 5+ — Phase C (presentation)
1. In **Blender**: model **P0 only** — exam table, wall ECG, workstation (meters, floor origin).  
   Export FBX per [BLENDER_EXPORT_CHEATSHEET.md](./BLENDER_EXPORT_CHEATSHEET.md).
2. Import into `Content/Environments/TeamRoom` and `ExamRoom3` per [CONTENT_FOLDERS.md](./CONTENT_FOLDERS.md).
3. MetaHuman: Dr. Patel, Marcus Chen, parent — wire VO + gaze + listen + face for dialogue steps.
4. Lumen lighting pass + spatial VO.

**Exit criteria:** Conversation distance looks clinical, not prototype; still must hit gameplay steps.

### Package gate — Phase D
1. Clean git worktree; run `Scripts/Run-FirstBuild.ps1` then package (`-IncludePackage`).
2. Run the **19-step** checklist on the **packaged** `CardioHospital.exe` at 2560×1440.
3. Record evidence with `Scripts/Record-WalkthroughEvidence.ps1` (FPS ≥ 60, p95 frame time ≤ 16.7 ms).
4. Only a full passing record sets `walkthroughPassed`.

---

## Tool roles (avoid thrash)

| Tool | Use for | Do not use for |
|------|---------|----------------|
| **Unreal 5.8** | Product, MetaHuman, lighting, package, gate | Casual web preview |
| **Blender** | Hero props, UVs, simple PBR, FBX | Characters (use MetaHuman) |
| **Grok Imagine** | 2D mood/layout reference | Meshes / final art |
| **Browser R3F (`cardio-hospital-3d`)** | Curriculum preview, interaction experiments | Claiming AAA fidelity |
| **Procedural / Meshy GLBs** | Temporary blockout only | Production package |

---

## If you only have 90 minutes

1. Open UE → verify project builds (`Run-FirstBuild` preflight if unsure).  
2. Create `OutpatientClinic_VSlice` with three volumes (team / corridor / exam).  
3. Walk from team room into exam room with collision.  
4. Stop. Commit. Do not open Blender until Phase A exit criteria pass.

---

## Merge / branch note

These docs live on `agent/unreal-migration-scaffold` under  
`cardiohospital-unreal/Docs/aaa-vertical-slice/`.

When the Unreal scaffold merges to `main`, this folder should travel with it.

---

## Done looks like

A stranger can install the packaged build, complete the HCM encounter with believable people and spaces, receive deterministic feedback, and your evidence script marks the walkthrough passed — without anyone editing clinical JSON by hand or faking performance numbers.

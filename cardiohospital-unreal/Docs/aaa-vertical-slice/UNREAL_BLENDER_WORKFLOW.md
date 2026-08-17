# Cardio Hospital — Unreal + Blender workflow

Target: `cardiohospital-unreal` (UE 5.8) vertical slice  
Team room → Dr. Patel assignment → Exam Room 3 → Marcus Chen + parent → debrief

Browser R3F stays curriculum preview only. This doc is the high-fidelity path.

---

## 1. Blender → UE 5.8 export settings

### Scene setup (do this once per .blend)
- Scene properties → Units: **Metric**, Unit Scale **1.0** (meters)
- All furniture origins: **floor center** (origin at contact with floor)
- Apply all transforms (Ctrl-A → All Transforms) before export
- No real patient data in file names or textures

### Prop priority (only what the vertical slice cameras see)
| Priority | Asset | Notes |
|----------|--------|------|
| P0 | Exam table | Exam Room 3 hero |
| P0 | Wall ECG display | Team room + review |
| P0 | Workstation desk + monitor | Team room |
| P1 | Conference / huddle table | Team room |
| P1 | Office chairs (x6) | Instance one mesh |
| P1 | Rolling stool | Exam room |
| P2 | Door frames, baseboards | Modular kit later |

### FBX export (Blender → Unreal)
File → Export → FBX (.fbx):

**Required**
- Path Mode: **Copy** (embed textures if any)
- Scale: **1.00**
- Apply Scalings: **FBX All**
- Forward: **-Y Forward**
- Up: **Z Up**  (Unreal converts; this is the standard Blender→UE preset)
- Apply Transform: **ON**
- Mesh → Smoothing: **Face**
- Mesh → Apply Modifiers: **ON**
- Armature: only if the asset has one (props usually off)
- Bake Animation: **OFF** for static props
- Leaf Bones: **OFF**

**Materials**
- Prefer simple Principled BSDF (Base Color, Roughness, Metallic, Normal)
- Pack images or use a single `Textures/` folder beside the FBX
- In Unreal, create a Material Instance per prop; avoid unique master mats per mesh

### Import in Unreal
1. Content Browser → Import into the folder map below
2. FBX Import UI:
   - Combined Meshes: **OFF** (keep pieces if you need sockets)
   - Generate Missing Collision: **ON** for static props (or use simplified UCXs you made in Blender)
   - Transform → Convert Scene: **ON**
   - Import Uniform Scale: **1.0**
3. Open static mesh → set LODs later if triangle count climbs
4. Place as Static Mesh Actors or light Blueprint wrappers — **no clinical logic in the mesh**

### MetaHuman (characters — not Blender props)
- Dr. Patel (attending)
- Marcus Chen (patient)
- Parent
- Production rule: no primitive placeholder NPC in a shipping build
- Voice + gaze + listen + facial motion required for dialogue steps

---

## 2. Unreal Content folder map

See [CONTENT_FOLDERS.md](./CONTENT_FOLDERS.md).

Rules
- Clinical truth: only via `UCardioClinicalDataSubsystem` + generated JSON
- World actors call `StartCase` / `GetAvailableActions` / `PerformAction`
- Never branch clinical logic inside environment Blueprints

---

## 3. Grok Imagine prompts (2D reference only)

See [IMAGINE_PROMPTS.md](./IMAGINE_PROMPTS.md).

---

## 4. Vertical-slice task list (ordered)

Aligned to WALKTHROUGH_CHECKLIST 19 steps + AGENTS.md.

### Phase A — Playable graybox (no final art)
- [ ] Persistent map `OutpatientClinic_VSlice` with Team Room + corridor + Exam Room 3 volumes
- [ ] Keyboard/mouse FPS movement + camera (step 3)
- [ ] Collision so player can enter team room and Exam Room 3 (steps 4, 7)
- [ ] Interact prompts on Patel, Marcus, parent (stubs OK only in Editor, not packaged prod)
- [ ] Wire `UCardioCaseRuntimeSubsystem` StartCase / PerformAction for HCM path

### Phase B — Clinical loop (still graybox OK)
- [ ] Patel assigns exertional-syncope case without altering LegacyCore truth (step 6)
- [ ] History actions record into case runtime (step 9)
- [ ] Focused exam actions record (step 10)
- [ ] Order ECG → show deterministic result (steps 11–12)
- [ ] Order echo when appropriate (step 13)
- [ ] Return to Patel, diagnosis + management including exercise safety (steps 14–16)
- [ ] Deterministic debrief feedback (step 17)
- [ ] Persist attempt + content version, no PHI (step 18)
- [ ] Next case can start in-world (step 19)

### Phase C — Presentation upgrade (Blender + MetaHuman)
- [ ] Replace P0 props from Blender FBX into Environments folders
- [ ] MetaHuman Patel with VO + gaze + listen + face for assignment dialogue (step 5)
- [ ] MetaHuman Marcus + parent with same dialogue requirements (step 8)
- [ ] Lumen lighting pass Team Room + Exam Room 3
- [ ] Spatial audio for VO

### Phase D — Package gate
- [ ] Clean worktree, Run-FirstBuild, Package-Windows
- [ ] Full 19-step walkthrough on packaged exe at 2560×1440
- [ ] Record-WalkthroughEvidence with FPS ≥ 60, p95 ≤ 16.7 ms
- [ ] Only then set walkthroughPassed = true

**Rule:** Art never blocks clinical determinism. Clinical never lives in the mesh.

---

## What not to do
- Do not treat procedural GLBs as final Unreal art
- Do not invent structured lab/echo results to silence authoring warnings
- Do not claim medical review until real review is done
- Do not put PHI, credentials, or workstation paths in notes/artifacts

# Cardio Hospital specification traceability

This is the durable, one-row-per-section trace for the authoritative
168-section product plan. The product owner confirmed
`LegacyCore/plan.md` as authoritative on 2026-08-14.

## Baseline identity

- Assessment base checkpoint: `2b9b0ffe13417e436d16985ae318eceab652ecda`
- Assessment scope: that base plus the curriculum and test changes committed in
  the same integration checkpoint as this ledger
- Authoritative source: `LegacyCore/plan.md`
- Source blob: `e89351733c467c694677100b4f82157f6917ba02`
- Source introduction commit: `a2a8ca1a8933ee83e829a91c88103ad99402dbaf`
- Product rebaseline: [`Docs/ADR-0001-unreal-5-8-product-rebaseline.md`](Docs/ADR-0001-unreal-5-8-product-rebaseline.md)

The exact section title is reproduced in every row. The section body in the
source plan remains normative unless the linked ADR explicitly adapts a
platform-specific clause. Statuses describe repository evidence at the
assessment checkpoint, not intent. A future update must change the checkpoint,
status, evidence, and gap together.

## Status vocabulary

| Status | Count | Meaning |
| --- | ---: | --- |
| `TESTED-PORTABLE` | 17 | Renderer-independent behavior is implemented and exercised by portable tests. This never implies Unreal compilation or presentation. |
| `PREVIEW-ONLY` | 22 | Demonstrated only in an inherited browser prototype; it is not an Unreal implementation. |
| `DATA-ONLY` | 23 | Authored data or archived code exists, but no active playable implementation exists. |
| `PARTIAL` | 58 | Some required behavior exists, but material clauses or the native Unreal presentation are incomplete. |
| `MISSING` | 32 | No meaningful implementation evidence was found at the checkpoint. |
| `FUTURE` | 8 | The authoritative plan explicitly defers the item or the approved vertical-slice scope defers it. |
| `SUPERSEDED` | 6 | A platform-specific clause is intentionally adapted by ADR-0001; its underlying product intent remains in force. |
| `WORKSTATION-GATED` | 2 | The requirement can only be verified through a real Unreal/package/hardware run and no passing evidence exists yet. |

## Evidence catalog

- `BH` — inherited static Three.js HCM preview and its Playwright path: `../cardiohospital/app.js`, `../cardiohospital/index.html`, and `../tests/cardiohospital-preview.test.mjs`.
- `BW` — inherited React Three Fiber/Rapier blockout: `../cardio-hospital-3d/README.md` and `../cardio-hospital-3d/src/components/world`.
- `CG` — case truth, graph authoring, deterministic graph compilation, and associated tests under `LegacyCore/src/lib`, `Tools`, and `Tests`.
- `EE` — deterministic case, education, debrief, learner, mastery, and adaptive-selection engines under `Tools`, with tests under `Tests`.
- `SD` — specialty/capstone seeds in `LegacyCore/src/lib/capstone.ts`, `cath-case.ts`, `nicu-case.ts`, `or-case.ts`, and `mri-case.ts`.
- `AR` — inactive legacy stores/content in `LegacyCore/src/lib/longitudinal.ts`, `memory-store.ts`, `pager-store.ts`, and `rotation-store.ts`.
- `UD` — generated schema-v3 content, Unreal data types/loader source, and portable contract tests. Unreal compilation remains unproven.
- `UR` — Unreal case-runtime, education-evaluator, and learner-profile source plus C++ automation-test source. None is credited as compiled until the workstation gate passes.
- `U0` — negative native-content inventory: `Content` contains only `Data/clinical-content.json`, and `Config/DefaultEngine.ini` still selects `/Engine/Maps/Entry`.
- `OPS` — `AGENTS.md`, `README.md`, `LOCAL_HANDOFF.md`, `IT_PREREQUISITES.md`, `WALKTHROUGH_CHECKLIST.md`, and package/evidence workflows.
- `CI` — portable clinical matrix plus the browser-preview Playwright workflow/test; the two browser paths pass locally against Chrome, while GitHub CI remains pending for the integration checkpoint. No Unreal toolchain runs in CI.
- `NONE` — repository search and native-content inventory found no implementation evidence.

## Requirement matrix

<!-- TRACEABILITY_TABLE_START -->
| ID | Source | Exact section title | Status | Evidence | Gap or next gate |
| ---: | --- | --- | --- | --- | --- |
| 1 | `LegacyCore/plan.md:L19` | PRODUCT CONCEPT | `PARTIAL` | `BH`, `CG`, `EE`, `U0` | One browser encounter and portable clinical systems exist; the explorable native hospital and broad physician workflow do not. |
| 2 | `LegacyCore/plan.md:L56` | CORE EXPERIENCE | `PREVIEW-ONLY` | `BH`, `BW` | Browser previews demonstrate one arrival-to-clinic loop; Unreal has no world loop. |
| 3 | `LegacyCore/plan.md:L83` | DESIGN PRINCIPLES | `PARTIAL` | `BH`, `CG`, `EE` | Deterministic clinical systems are testable and one case is spatial in browser; the complete native experience is absent. |
| 4 | `LegacyCore/plan.md:L116` | PLAYER ROLE | `DATA-ONLY` | `CG`, `SD` | Role and tasks are represented in authored content but not as a native player experience. |
| 5 | `LegacyCore/plan.md:L146` | FIRST-PERSON MOVEMENT | `PREVIEW-ONLY` | `BH`, `BW` | WASD and mouse look exist only in browser prototypes. |
| 6 | `LegacyCore/plan.md:L182` | THIRD-PERSON OPTION | `MISSING` | `NONE` | No third-person option exists. |
| 7 | `LegacyCore/plan.md:L199` | HOSPITAL WORLD | `PARTIAL` | `BW`, `U0` | A primitive browser blockout exists; Unreal has no authored hospital map. |
| 8 | `LegacyCore/plan.md:L219` | CARDIOLOGY WORKROOM | `PREVIEW-ONLY` | `BW` | Primitive browser workroom only. |
| 9 | `LegacyCore/plan.md:L255` | OUTPATIENT CLINIC | `PREVIEW-ONLY` | `BW` | Browser corridor and one exam room exist; the specified clinic suite and native version do not. |
| 10 | `LegacyCore/plan.md:L288` | PATIENT ROOM EXPERIENCE | `PARTIAL` | `BH`, `U0` | Browser encounter panels exist, but no patient NPC behavior or native room experience exists. |
| 11 | `LegacyCore/plan.md:L320` | NPC CONVERSATION SYSTEM | `PARTIAL` | `BH`, `CG` | Structured browser choices and authored facts exist; typed, voice, and natural dialogue do not. |
| 12 | `LegacyCore/plan.md:L359` | PATIENT AI ARCHITECTURE | `PARTIAL` | `CG`, `UD`, `UR` | Fixed truth and deterministic actions exist; the AI expression layer is absent and Unreal source is uncompiled. |
| 13 | `LegacyCore/plan.md:L393` | INFORMATION DISCLOSURE RULES | `DATA-ONLY` | `CG` | Facts and prompts exist, but no runtime disclosure gate enforces the complete rules. |
| 14 | `LegacyCore/plan.md:L423` | PERSONALITY MODEL | `MISSING` | `NONE` | No personality model exists. |
| 15 | `LegacyCore/plan.md:L443` | PEDIATRIC PATIENT BEHAVIOR | `DATA-ONLY` | `CG`, `SD` | Pediatric case data exists without a behavior model. |
| 16 | `LegacyCore/plan.md:L468` | CONFIDENTIAL ADOLESCENT INTERVIEW | `TESTED-PORTABLE` | `CG`, `EE` | Adolescent hypertension gates confidential substance-use questions behind a parent-step-out action; native presentation of the interview is still absent. |
| 17 | `LegacyCore/plan.md:L488` | PHYSICAL EXAMINATION | `PARTIAL` | `BH`, `CG`, `UR` | Browser exam actions and deterministic action definitions exist; no native examination actors or presentation exist. |
| 18 | `LegacyCore/plan.md:L524` | STETHOSCOPE SYSTEM | `PREVIEW-ONLY` | `BH` | Four browser auscultation sites and a Valsalva response exist; no native system exists. |
| 19 | `LegacyCore/plan.md:L555` | MURMUR AUDIO ENGINE | `PARTIAL` | `BH`, `AR` | A synthesized HCM browser demonstration exists; no production spatial and phase-aware native engine exists. |
| 20 | `LegacyCore/plan.md:L583` | VITAL SIGNS SYSTEM | `PARTIAL` | `BH`, `CG` | Static vitals and authored four-limb findings exist; no live native vital-sign system exists. |
| 21 | `LegacyCore/plan.md:L608` | CLINICAL TABLET | `MISSING` | `NONE` | No clinical tablet exists. |
| 22 | `LegacyCore/plan.md:L630` | ELECTRONIC MEDICAL RECORD | `DATA-ONLY` | `CG` | Clinical data exists without an EMR interface or runtime. |
| 23 | `LegacyCore/plan.md:L669` | ORDER ENTRY | `PARTIAL` | `BH`, `CG`, `EE` | One browser case and nine tested graphs support orders; no native order-entry UI exists. |
| 24 | `LegacyCore/plan.md:L697` | CONSEQUENCES OF TESTING | `TESTED-PORTABLE` | `CG`, `EE` | Portable tests exercise unnecessary testing, cost, delay, and scoring consequences; native presentation remains pending. |
| 25 | `LegacyCore/plan.md:L716` | ECG ROOM | `PREVIEW-ONLY` | `BH` | Browser ECG overlay only; no physical or native ECG room exists. |
| 26 | `LegacyCore/plan.md:L733` | ECG INTERPRETATION ENGINE | `PARTIAL` | `BH`, `CG` | HCM browser reader and authored patterns exist; no reusable native interpretation engine exists. |
| 27 | `LegacyCore/plan.md:L759` | ECHO LAB | `DATA-ONLY` | `BH`, `CG` | Text echo results exist; no lab environment or imaging interaction exists. |
| 28 | `LegacyCore/plan.md:L783` | INTERACTIVE ECHO PROBE | `MISSING` | `NONE` | No interactive probe exists. |
| 29 | `LegacyCore/plan.md:L804` | CARDIOLOGY ATTENDING AI | `PARTIAL` | `BH`, `CG` | A scripted browser attending and authored prompts exist; attending AI does not. |
| 30 | `LegacyCore/plan.md:L830` | SOCRATIC TEACHING ENGINE | `PARTIAL` | `EE`, `UR` | Deterministic feedback and counterfactuals exist; no conversational Socratic engine exists and Unreal evaluator is uncompiled. |
| 31 | `LegacyCore/plan.md:L854` | ATTENDING PERSONALITIES | `MISSING` | `NONE` | No attending personality system exists. |
| 32 | `LegacyCore/plan.md:L878` | INITIAL CLINIC CASES | `PARTIAL` | `CG` | Nine case truths and nine tested graphs exist, including musculoskeletal chest pain and adolescent hypertension/ABPM; native presentation is still absent. |
| 33 | `LegacyCore/plan.md:L978` | CONTRASTIVE CASE DESIGN | `TESTED-PORTABLE` | `CG`, `EE` | HCM and vasovagal contrast paths and test-restraint behavior are tested. |
| 34 | `LegacyCore/plan.md:L1001` | HOSPITAL EVENT SYSTEM | `DATA-ONLY` | `AR` | Archived pager events exist without an active hospital event system. |
| 35 | `LegacyCore/plan.md:L1017` | TIME SYSTEM | `PREVIEW-ONLY` | `BH` | Browser displays a fixed time; no advancing clock, schedule, or timed event system exists. |
| 36 | `LegacyCore/plan.md:L1040` | CONSULT SYSTEM | `DATA-ONLY` | `SD` | Specialty and capstone consult content exists without playable consult behavior. |
| 37 | `LegacyCore/plan.md:L1058` | PEDIATRIC ICU | `DATA-ONLY` | `SD` | PICU references exist; no PICU world or runtime exists. |
| 38 | `LegacyCore/plan.md:L1081` | PHYSIOLOGIC PATIENT ENGINE | `MISSING` | `NONE` | No dynamic physiologic patient engine exists. |
| 39 | `LegacyCore/plan.md:L1111` | EXAMPLE DYNAMIC EVENT | `MISSING` | `NONE` | The example dynamic deterioration event is not implemented. |
| 40 | `LegacyCore/plan.md:L1145` | TELEMETRY SYSTEM | `MISSING` | `NONE` | No telemetry system exists. |
| 41 | `LegacyCore/plan.md:L1159` | EMERGENCY DEPARTMENT | `DATA-ONLY` | `SD` | ED references exist without an environment or gameplay system. |
| 42 | `LegacyCore/plan.md:L1177` | NEONATAL ICU | `DATA-ONLY` | `SD` | NICU case data exists without an environment or runtime. |
| 43 | `LegacyCore/plan.md:L1193` | CYANOTIC NEWBORN CASE | `DATA-ONLY` | `SD` | A cyanotic-newborn sequence exists as content only. |
| 44 | `LegacyCore/plan.md:L1221` | FETAL-TO-NEONATAL PHYSIOLOGY VISUALIZATION | `MISSING` | `NONE` | No physiology visualization exists. |
| 45 | `LegacyCore/plan.md:L1244` | CARDIAC CATHETERIZATION LAB | `DATA-ONLY` | `SD` | Cath case content exists without a lab environment. |
| 46 | `LegacyCore/plan.md:L1266` | CATHETER NAVIGATION | `MISSING` | `NONE` | No catheter navigation exists. |
| 47 | `LegacyCore/plan.md:L1283` | OPERATING ROOM | `DATA-ONLY` | `SD` | Operating-room content exists without an OR environment. |
| 48 | `LegacyCore/plan.md:L1299` | SURGERY EDUCATION MODE | `DATA-ONLY` | `SD` | Authored surgical steps exist without a playable education mode. |
| 49 | `LegacyCore/plan.md:L1320` | POSTOPERATIVE ICU | `DATA-ONLY` | `SD` | Postoperative references exist without an ICU implementation. |
| 50 | `LegacyCore/plan.md:L1337` | CARDIAC MRI / CT SUITE | `DATA-ONLY` | `SD` | MRI content exists without a suite or scanner interaction. |
| 51 | `LegacyCore/plan.md:L1356` | VASCULAR RING EXPERIENCE | `DATA-ONLY` | `SD` | Vascular-ring content exists without a playable experience. |
| 52 | `LegacyCore/plan.md:L1379` | VIRTUAL CONFERENCE ROOM | `MISSING` | `NONE` | No virtual conference room exists. |
| 53 | `LegacyCore/plan.md:L1395` | CASE DEBRIEF ROOM | `PARTIAL` | `BH`, `EE`, `UR` | Browser debrief and deterministic evaluation exist; no native debrief room or compiled UI exists. |
| 54 | `LegacyCore/plan.md:L1411` | ASSESSMENT PHILOSOPHY | `PARTIAL` | `EE`, `UR` | Ten dimensions are implemented; the specified differential-diagnosis dimension is missing and Unreal evaluator tests are unrun. |
| 55 | `LegacyCore/plan.md:L1436` | EXAMPLE SCORING | `PARTIAL` | `BH`, `EE`, `UR` | Scores and case-specific feedback exist in browser/portable code; native presentation is absent. |
| 56 | `LegacyCore/plan.md:L1457` | INVISIBLE SCORING | `PREVIEW-ONLY` | `BH` | Browser hides scores until debrief; no native learner loop demonstrates this. |
| 57 | `LegacyCore/plan.md:L1476` | CLINICAL ACTION LOG | `TESTED-PORTABLE` | `CG`, `EE`, `UR` | Deterministic action-log preservation is tested portably and mirrored in uncompiled Unreal source. |
| 58 | `LegacyCore/plan.md:L1498` | MISSED OPPORTUNITY ENGINE | `TESTED-PORTABLE` | `EE`, `UR` | Portable tests exercise omissions and missed opportunities; Unreal code remains workstation-gated. |
| 59 | `LegacyCore/plan.md:L1518` | COUNTERFACTUAL FEEDBACK | `TESTED-PORTABLE` | `EE`, `UR` | Case-specific counterfactual feedback is tested portably and represented in Unreal source. |
| 60 | `LegacyCore/plan.md:L1532` | WRONG DECISIONS | `PARTIAL` | `BH`, `EE`, `UR` | Wrong choices affect deterministic scores and feedback, but do not yet create native world consequences. |
| 61 | `LegacyCore/plan.md:L1554` | FAILURE STATES | `TESTED-PORTABLE` | `EE`, `UR` | Critical safety interventions and failed paths are tested portably; no native presentation has run. |
| 62 | `LegacyCore/plan.md:L1574` | WORLD NPC POPULATION | `PREVIEW-ONLY` | `BW` | Two primitive browser clinicians are the only population evidence. |
| 63 | `LegacyCore/plan.md:L1599` | NPC SCHEDULING | `MISSING` | `NONE` | No NPC scheduling exists. |
| 64 | `LegacyCore/plan.md:L1617` | AMBIENT ACTIVITY | `MISSING` | `NONE` | No ambient hospital activity system exists. |
| 65 | `LegacyCore/plan.md:L1634` | AUDIO | `PARTIAL` | `BH`, `AR` | Murmur audio exists in browser/archive only; ambient, voice, and native UI audio are absent. |
| 66 | `LegacyCore/plan.md:L1655` | VISUAL STYLE | `PREVIEW-ONLY` | `BH`, `BW` | Primitive browser visuals provide a blockout, not the approved native visual target. |
| 67 | `LegacyCore/plan.md:L1680` | CHARACTER VISUALS | `PREVIEW-ONLY` | `BW`, `OPS` | Browser primitives exist; MetaHuman direction is approved only as the bounded ADR-0001 quality spike and no native character is committed. |
| 68 | `LegacyCore/plan.md:L1698` | CHARACTER ANIMATION | `MISSING` | `NONE` | No required character animation set exists. |
| 69 | `LegacyCore/plan.md:L1724` | LIP SYNCHRONIZATION | `MISSING` | `NONE` | No generalized speaking animation or lip synchronization exists. |
| 70 | `LegacyCore/plan.md:L1736` | WORLD CONSTRUCTION PIPELINE | `SUPERSEDED` | `BW`, `OPS` | ADR-0001 replaces the terminal GLB-to-Three.js pipeline with Unreal-native modular world construction while retaining blockout and modularity intent. |
| 71 | `LegacyCore/plan.md:L1770` | HOSPITAL STREAMING | `MISSING` | `U0` | No authored native level exists to stream. |
| 72 | `LegacyCore/plan.md:L1793` | LEVEL-OF-DETAIL SYSTEM | `MISSING` | `U0` | No native art or LOD policy is implemented. |
| 73 | `LegacyCore/plan.md:L1808` | COLLISION SYSTEM | `PREVIEW-ONLY` | `BW` | Rapier collision exists only in the browser blockout. |
| 74 | `LegacyCore/plan.md:L1823` | INTERACTION SYSTEM | `PARTIAL` | `BH`, `BW`, `UR` | Browser E-key interactions and a deterministic Unreal action API exist; native world actors do not. |
| 75 | `LegacyCore/plan.md:L1857` | CONTEXT-AWARE CURSOR | `PREVIEW-ONLY` | `BH`, `BW` | Context prompts exist only in browser prototypes. |
| 76 | `LegacyCore/plan.md:L1882` | OBJECT HIGHLIGHTING | `MISSING` | `NONE` | No object-highlighting system exists. |
| 77 | `LegacyCore/plan.md:L1890` | DOOR SYSTEM | `PREVIEW-ONLY` | `BH`, `BW` | One browser door interaction exists; no reusable native door system exists. |
| 78 | `LegacyCore/plan.md:L1904` | ELEVATOR SYSTEM | `MISSING` | `NONE` | No elevator exists. |
| 79 | `LegacyCore/plan.md:L1923` | WORLD MAP | `MISSING` | `NONE` | No world map exists. |
| 80 | `LegacyCore/plan.md:L1933` | QUEST SYSTEM | `TESTED-PORTABLE` | `CG`, `EE`, `UR` | Deterministic case transitions are tested portably and exposed by uncompiled Unreal source. |
| 81 | `LegacyCore/plan.md:L1964` | CASE GRAPH ARCHITECTURE | `TESTED-PORTABLE` | `CG`, `UD`, `UR` | Nine graphs compile, validate, and run deterministically; Unreal ingestion still needs compilation. |
| 82 | `LegacyCore/plan.md:L1986` | CASE AUTHORING SYSTEM | `PARTIAL` | `CG` | Concise code authoring and diagnostics exist; no nonprogrammer editor exists. |
| 83 | `LegacyCore/plan.md:L2010` | CASE TRUTH SEPARATION | `TESTED-PORTABLE` | `CG`, `UD` | Truth, graph actions, and evaluation remain separate and contract-tested. |
| 84 | `LegacyCore/plan.md:L2028` | AI ARCHITECTURE | `PARTIAL` | `CG`, `UD`, `UR` | Deterministic factual layers exist; no generative conversation layer exists. |
| 85 | `LegacyCore/plan.md:L2055` | CONVERSATION MEMORY | `MISSING` | `NONE` | No active conversation-memory system exists. |
| 86 | `LegacyCore/plan.md:L2073` | ATTENDING REASONING EVALUATOR | `PARTIAL` | `EE`, `UR` | Diagnosis payloads and deterministic scoring are evaluated; free-form reasoning quality is not. |
| 87 | `LegacyCore/plan.md:L2091` | VOICE MODE | `MISSING` | `NONE` | No speech-to-text, text-to-speech, or push-to-talk path exists. |
| 88 | `LegacyCore/plan.md:L2109` | SPEECH LATENCY TARGET | `WORKSTATION-GATED` | `NONE` | No speech stack exists to measure; latency cannot pass until a real service/client implementation is instrumented. |
| 89 | `LegacyCore/plan.md:L2121` | PLAYER AVATAR | `MISSING` | `NONE` | No native player avatar exists. |
| 90 | `LegacyCore/plan.md:L2135` | PROCEDURAL HAND INTERACTION | `PREVIEW-ONLY` | `BH`, `BW` | Camera-centered browser interaction matches the plan's initial fallback; hands and native interactions are absent. |
| 91 | `LegacyCore/plan.md:L2149` | SAVE SYSTEM | `PARTIAL` | `BH`, `EE`, `UR` | Browser persistence and portable learner round-trips are tested, and Unreal SaveGame source exists; the native source is uncompiled and no packaged save/load has run. |
| 92 | `LegacyCore/plan.md:L2164` | ROTATION STRUCTURE | `DATA-ONLY` | `AR` | Rotation and longitudinal content exists only in inactive legacy stores; no 10-day campaign exists. |
| 93 | `LegacyCore/plan.md:L2210` | MORNING HUD | `PREVIEW-ONLY` | `BH` | Browser HUD only; no native morning HUD exists. |
| 94 | `LegacyCore/plan.md:L2228` | CAPSTONE | `DATA-ONLY` | `SD` | Capstone content exists without a playable capstone. |
| 95 | `LegacyCore/plan.md:L2243` | LONGITUDINAL PATIENTS | `DATA-ONLY` | `AR` | Archived follow-up content exists without an active longitudinal system. |
| 96 | `LegacyCore/plan.md:L2265` | CONSEQUENCE PERSISTENCE | `DATA-ONLY` | `AR` | Archived consequence stores exist but are not connected to the current runtime. |
| 97 | `LegacyCore/plan.md:L2279` | ACHIEVEMENTS | `PARTIAL` | `EE`, `AR` | Mastery labels and concepts exist; no achievement rules or presentation exists. |
| 98 | `LegacyCore/plan.md:L2297` | MASTERY MODEL | `TESTED-PORTABLE` | `EE`, `UR` | Versioned concept mastery is implemented and tested portably, with equivalent uncompiled Unreal source awaiting the workstation gate. |
| 99 | `LegacyCore/plan.md:L2315` | ADAPTIVE CASE SELECTION | `TESTED-PORTABLE` | `EE`, `UR` | Deterministic adaptive case selection is implemented and tested portably, with equivalent uncompiled Unreal source awaiting the workstation gate. |
| 100 | `LegacyCore/plan.md:L2327` | SPACED REPETITION | `TESTED-PORTABLE` | `EE`, `AR`, `UR` | Portable learner scheduling and concept recurrence are implemented and mirrored in uncompiled Unreal source; no native learner UI exists. |
| 101 | `LegacyCore/plan.md:L2342` | WORLD-FIRST UI | `PREVIEW-ONLY` | `BH`, `BW` | Browser previews keep UI secondary to the world; Unreal has no UI yet. |
| 102 | `LegacyCore/plan.md:L2359` | INTERACTION DESIGN | `PREVIEW-ONLY` | `BH`, `BW` | Browser proximity and E-key interaction only. |
| 103 | `LegacyCore/plan.md:L2382` | DIEGETIC INTERFACES | `PREVIEW-ONLY` | `BH`, `BW` | Browser room and attending interactions are the only diegetic evidence. |
| 104 | `LegacyCore/plan.md:L2396` | NON-DIEGETIC INTERFACES | `PREVIEW-ONLY` | `BH` | Browser briefing, encounter, order, and debrief overlays only. |
| 105 | `LegacyCore/plan.md:L2407` | TUTORIAL | `PARTIAL` | `BH`, `BW` | Control hints exist; no progressive tutorial teaches the clinical loop. |
| 106 | `LegacyCore/plan.md:L2434` | PERFORMANCE TARGETS | `SUPERSEDED` | `OPS`, `U0` | ADR-0001 establishes the 2560x1440, stable-60-FPS RTX quality gate; no measured package exists and lower-spec compatibility remains future work. |
| 107 | `LegacyCore/plan.md:L2459` | RENDERER | `SUPERSEDED` | `BH`, `BW`, `OPS` | ADR-0001 replaces Three.js/WebGPU-WebGL as the production renderer with Unreal Engine 5.8; browser projects remain previews. |
| 108 | `LegacyCore/plan.md:L2469` | RECOMMENDED SOFTWARE STACK | `SUPERSEDED` | `CG`, `OPS` | ADR-0001 replaces the production client stack with Unreal 5.8 while retaining renderer-independent clinical content; backend, AI, and speech remain absent. |
| 109 | `LegacyCore/plan.md:L2498` | ENGINE ARCHITECTURE | `PARTIAL` | `CG`, `EE`, `UD`, `UR` | Clinical, case, and education layers exist; world, character, dialogue, speech, and backend layers do not. |
| 110 | `LegacyCore/plan.md:L2541` | CODEBASE ORGANIZATION | `SUPERSEDED` | `OPS`, `CG`, `UD`, `UR` | ADR-0001 maps the prescribed browser organization to Unreal modules plus LegacyCore; several prescribed systems remain absent. |
| 111 | `LegacyCore/plan.md:L2566` | ENTITY COMPONENT SYSTEM | `MISSING` | `NONE` | The specified ECS architecture is not implemented. |
| 112 | `LegacyCore/plan.md:L2595` | NAVIGATION SYSTEM | `MISSING` | `U0` | No native map, navmesh, pathfinding, or NPC navigation exists. |
| 113 | `LegacyCore/plan.md:L2611` | NPC LEVEL OF SIMULATION | `MISSING` | `NONE` | No NPC simulation tiers exist. |
| 114 | `LegacyCore/plan.md:L2639` | LIGHTING | `PARTIAL` | `BH`, `BW`, `OPS` | Browser dynamic lights and Unreal renderer settings exist; no authored native hybrid-lighting scene has run. |
| 115 | `LegacyCore/plan.md:L2654` | SHADOWS | `PARTIAL` | `BH`, `BW`, `OPS` | Browser shadows and Unreal virtual-shadow settings exist; no scene budget or quality evidence exists. |
| 116 | `LegacyCore/plan.md:L2665` | AUDIO ARCHITECTURE | `MISSING` | `NONE` | No production audio buses, zones, streaming, or native spatial-audio architecture exists. |
| 117 | `LegacyCore/plan.md:L2682` | MUSIC | `MISSING` | `NONE` | No restrained music system exists. |
| 118 | `LegacyCore/plan.md:L2698` | LOAD EXPERIENCE | `PARTIAL` | `BH`, `OPS` | Browser branded entry/error UI exists; no native loading experience exists and institutional branding requires authorization. |
| 119 | `LegacyCore/plan.md:L2714` | ACCESSIBILITY | `PARTIAL` | `BH`, `BW` | Semantic browser controls and reduced-motion CSS exist; full keyboard, contrast, captions, remapping, and native options remain incomplete. |
| 120 | `LegacyCore/plan.md:L2731` | MOTION SICKNESS | `PARTIAL` | `BH`, `BW` | Browser previews avoid forced bob/shake and expose reduced-motion CSS; requested native options do not exist. |
| 121 | `LegacyCore/plan.md:L2754` | MOBILE | `PARTIAL` | `OPS` | The approved first release is desktop-only; tablet/touch support remains unimplemented. |
| 122 | `LegacyCore/plan.md:L2775` | VR | `FUTURE` | `OPS` | Explicitly deferred until after the single-player curriculum; keyboard/mouse remains mandatory. |
| 123 | `LegacyCore/plan.md:L2791` | CONTENT VALIDATION | `PARTIAL` | `CG`, `UD`, `CI` | Author/version/source/review fields and contract gates exist, but formal reviewer attribution is explicitly pending. |
| 124 | `LegacyCore/plan.md:L2806` | MEDICAL SOURCE MODEL | `PARTIAL` | `CG`, `UD` | Case-level citations exist; individual clinical facts are not consistently source-linked. |
| 125 | `LegacyCore/plan.md:L2825` | ANALYTICS | `PARTIAL` | `EE`, `UR` | Educational event types and an action log exist; no consent-aware analytics backend or export exists. |
| 126 | `LegacyCore/plan.md:L2845` | RESEARCH DATA | `FUTURE` | `OPS` | Explicitly future and contingent on consent and approval; no research collection exists. |
| 127 | `LegacyCore/plan.md:L2861` | FACULTY DASHBOARD | `MISSING` | `NONE` | No faculty dashboard exists. |
| 128 | `LegacyCore/plan.md:L2885` | PRIVACY | `PARTIAL` | `CG`, `EE`, `OPS`, `CI` | Current cases are synthetic-looking, PHI is prohibited, metadata is checked, and learner tests are identity-free; synthetic provenance is not machine-enforced end to end. |
| 129 | `LegacyCore/plan.md:L2895` | NETWORK ARCHITECTURE | `TESTED-PORTABLE` | `CG`, `EE`, `OPS` | Current deterministic runtime and learner model are single-player/local as required; no multiplayer dependency exists. |
| 130 | `LegacyCore/plan.md:L2914` | FUTURE MULTIPLAYER | `FUTURE` | `OPS` | Explicitly deferred. |
| 131 | `LegacyCore/plan.md:L2932` | ENVIRONMENT MVP | `PARTIAL` | `BW`, `U0` | Browser has a workroom, corridor, and one exam-room blockout; required additional rooms, ECG, echo, and all native world content are absent. |
| 132 | `LegacyCore/plan.md:L2954` | FIRST VERTICAL SLICE | `PARTIAL` | `BH`, `CG`, `EE`, `U0` | Browser HCM passes locally under Playwright and headless deterministic paths exist; QA teleports replace natural walking and no native packaged HCM exists. |
| 133 | `LegacyCore/plan.md:L2994` | WHY THIS CASE FIRST | `PARTIAL` | `BH`, `CG`, `EE` | HCM exercises portable clinical systems, but natural dialogue, NPCs, physical echo, attending AI, and native world presentation are absent. |
| 134 | `LegacyCore/plan.md:L3015` | SECOND CASE | `PARTIAL` | `CG`, `EE` | Vasovagal contrast behavior is tested; it has no player-facing presentation. |
| 135 | `LegacyCore/plan.md:L3031` | THIRD CASE | `TESTED-PORTABLE` | `CG`, `EE` | The Long-QT case graph completes optimally and exercises its critical safety intervention in portable tests; no native presentation exists. |
| 136 | `LegacyCore/plan.md:L3046` | PHASE 1 — CORE WORLD ENGINE | `PARTIAL` | `BH`, `BW`, `CG`, `EE`, `U0` | Browser movement, door, collision, and blockout plus portable case systems exist; the native world, NPC, animation, dialogue, chart, and save systems are incomplete. |
| 137 | `LegacyCore/plan.md:L3065` | PHASE 2 — CLINIC SIMULATOR | `PARTIAL` | `CG`, `EE`, `BH` | Nine deterministic case graphs and one browser-facing case exist; native playable presentation of the 8–12-case clinic is still absent. |
| 138 | `LegacyCore/plan.md:L3082` | PHASE 3 — INPATIENT HOSPITAL | `DATA-ONLY` | `SD` | PICU, NICU, and ED seeds exist as content only. |
| 139 | `LegacyCore/plan.md:L3097` | PHASE 4 — PROCEDURAL WORLD | `DATA-ONLY` | `SD` | Cath, OR, MRI, and CT seeds exist as content only. |
| 140 | `LegacyCore/plan.md:L3111` | PHASE 5 — DEEP PHYSIOLOGY | `MISSING` | `NONE` | No embedded deep-physiology simulation exists. |
| 141 | `LegacyCore/plan.md:L3123` | PHASE 6 — ADAPTIVE AI CURRICULUM | `PARTIAL` | `EE`, `AR` | Learner mastery and adaptive selection are tested and longitudinal data is archived; no native campaign or automated conversational teaching exists. |
| 142 | `LegacyCore/plan.md:L3134` | PHASE 7 — MULTIPLAYER / VR | `FUTURE` | `OPS` | Explicitly deferred until the single-player curriculum is mature. |
| 143 | `LegacyCore/plan.md:L3140` | WHAT SHOULD NOT BE BUILT FIRST | `SUPERSEDED` | `OPS`, `U0` | Scope restraint is retained; ADR-0001 permits only one bounded Dr. Patel MetaHuman quality spike after baseline gates, not a photorealistic cast-first effort. |
| 144 | `LegacyCore/plan.md:L3157` | FIRST RELEASE TARGET | `PARTIAL` | `CG`, `EE`, `U0` | Nine deterministic graphs are tested, covering the five first-release cases plus Long-QT, coarctation, MSK chest pain, and adolescent HTN; environment, characters, dialogue, and native package are absent. |
| 145 | `LegacyCore/plan.md:L3192` | IDEAL FIRST FIVE CASES | `TESTED-PORTABLE` | `CG`, `EE`, `CI` | Innocent murmur, HCM, vasovagal syncope, WPW, and myocarditis have ready deterministic graphs and complete/unsafe path coverage. |
| 146 | `LegacyCore/plan.md:L3215` | MINIMUM ASSET LIST | `PARTIAL` | `BW`, `U0` | A few primitive browser blockout assets exist; required native environments, characters, props, animation, and audio are overwhelmingly absent. |
| 147 | `LegacyCore/plan.md:L3281` | ESTIMATED MODEL COMPLEXITY | `PREVIEW-ONLY` | `BW` | Browser primitives are conservative; no documented measurements or native asset budgets exist. |
| 148 | `LegacyCore/plan.md:L3301` | CONTENT CREATION PIPELINE | `PARTIAL` | `CG`, `UD` | Case objectives, truth, graph rules, safety, scoring, prompts, and debrief data are validated; dialogue database, world build, and formal medical signoff are incomplete. |
| 149 | `LegacyCore/plan.md:L3334` | DEVELOPER TOOLING | `PREVIEW-ONLY` | `BH`, `OPS` | Browser QA teleports and package metrics workflow exist; required spawn/state/event/dialogue/navmesh/collider debug interfaces do not. |
| 150 | `LegacyCore/plan.md:L3356` | AUTOMATED TESTING | `PARTIAL` | `CI`, `CG`, `EE`, `BH`, `OPS` | Portable unit/integration, workstation wrappers, and both local browser HCM Playwright paths pass; GitHub browser CI, Unreal compile, native world/dialogue/physiology, and packaged tests remain unpassed. |
| 151 | `LegacyCore/plan.md:L3382` | MEDICAL CONSISTENCY TESTS | `PARTIAL` | `CG`, `CI` | Nine graphs are ready with zero blocking errors; 41 disclosed warnings remain and structured-result completeness is not yet enforced for gameplay exposure. |
| 152 | `LegacyCore/plan.md:L3401` | PERFORMANCE TESTING | `WORKSTATION-GATED` | `OPS`, `U0` | Metrics and evidence format are defined; no packaged 2560x1440 run or baseline exists. |
| 153 | `LegacyCore/plan.md:L3420` | DEPLOYMENT | `PARTIAL` | `BH`, `OPS` | Browser preview is deployed and verifiable package scripts exist; no native package or release artifact has passed. |
| 154 | `LegacyCore/plan.md:L3442` | LOADING STRATEGY | `MISSING` | `U0` | No native world/case loading or streaming strategy is implemented. |
| 155 | `LegacyCore/plan.md:L3458` | OFFLINE POSSIBILITY | `FUTURE` | `CG`, `EE`, `OPS` | Deterministic components are local, but a supported offline product is explicitly deferred. |
| 156 | `LegacyCore/plan.md:L3466` | ADMIN MODE | `MISSING` | `NONE` | No admin mode exists. |
| 157 | `LegacyCore/plan.md:L3483` | WORLD EDITOR | `FUTURE` | `NONE` | Explicitly later and unimplemented. |
| 158 | `LegacyCore/plan.md:L3496` | CASE VERSIONING | `TESTED-PORTABLE` | `CG`, `EE`, `UD` | Content versions and learner attempt retention are tested; formal review/signoff remains pending. |
| 159 | `LegacyCore/plan.md:L3513` | ERROR HANDLING | `PARTIAL` | `BH`, `OPS` | Browser WebGL error handling, structured-choice fallback, and build diagnostics exist; AI, speech, cloud, and native asset fallbacks do not. |
| 160 | `LegacyCore/plan.md:L3531` | SYSTEM BOUNDARIES | `PARTIAL` | `CG`, `EE`, `UD`, `UR` | Deterministic truth/scoring boundaries exist; AI and backend boundaries cannot be exercised because those systems are absent. |
| 161 | `LegacyCore/plan.md:L3553` | THE CRITICAL DESIGN RULE | `PARTIAL` | `CG`, `UD`, `OPS` | Fixed truth is never delegated to an LLM; no AI integration exists to prove the full read-only boundary in operation. |
| 162 | `LegacyCore/plan.md:L3581` | WHAT MAKES THIS DIFFERENT | `PARTIAL` | `BH`, `CG`, `EE`, `U0` | One browser HCM encounter approximates the concept; the full world-based product distinction is unproven natively. |
| 163 | `LegacyCore/plan.md:L3616` | THE REAL PRODUCT | `PARTIAL` | `CG`, `EE`, `UD`, `UR` | Reusable case, education, learner, and data systems exist; world, character, and dialogue systems remain incomplete. |
| 164 | `LegacyCore/plan.md:L3630` | FUTURE SPECIALTIES | `FUTURE` | `SD` | Future specialties are deferred; content seeds are not implementation. |
| 165 | `LegacyCore/plan.md:L3651` | HIGHEST-VALUE TECHNICAL ARCHITECTURE | `PARTIAL` | `BW`, `CG`, `EE`, `UD`, `UR` | World preview and clinical/case/education cores exist; character and conversation engines do not. |
| 166 | `LegacyCore/plan.md:L3680` | VERTICAL SLICE ACCEPTANCE TEST | `PARTIAL` | `BH`, `CG`, `EE`, `OPS`, `U0` | Nine graphs model all 19 checkpoints and two local browser Playwright paths pass with persistence, but they use QA teleports and lack free speech, physical attending return, free reasoning, and a different in-world next case; no packaged Unreal step has passed. |
| 167 | `LegacyCore/plan.md:L3710` | RECOMMENDED FIRST BUILD | `PARTIAL` | `BW`, `U0`, `OPS` | Browser workroom, corridor, and one exam room exist; three rooms, ECG, echo, native world, and polished package are absent. |
| 168 | `LegacyCore/plan.md:L3736` | FINAL PRODUCT VISION | `FUTURE` | `SD`, `U0` | This remains the long-term vision; specialty data seeds do not constitute implementation. |
<!-- TRACEABILITY_TABLE_END -->

## Immediate blockers and next evidence

1. Create the first custom Unreal map, player pawn/input, interaction actors,
   team room, corridor, Exam Room 3, and native learner UI. `U0` currently proves
   that none of those assets are present.
2. Run Unreal Header Tool, C++ compilation, automation, cooking, packaging, and
   the exact packaged 19-step walkthrough before upgrading any native status.
3. Connect the deterministic case runtime, evaluator, and learner-profile
   subsystem to world interactions and native debrief UI, then prove the new
   SaveGame, mastery, spaced-repetition, and adaptive-selection source through
   Unreal compilation and packaged persistence.
4. Implement the bounded Dr. Patel character-quality gate with voice, listening
   pose, gaze, blink, and facial motion. Do not expand the cast until the slice
   passes.
5. Musculoskeletal chest-pain and adolescent-hypertension/ABPM graphs are now
   authored and portable-tested. Formal medical review and native presentation
   remain open; do not invent structured results to clear remaining warnings.
6. Resolve the 41 authoring warnings only with sourced, medically reviewed
   results and classification decisions. Do not invent content to obtain zero
   warnings.
7. Obtain and record formal clinical review and permission for any named
   reviewer or institutional branding before making public claims.
8. Keep the two passing browser Playwright paths healthy while treating their
   QA teleports and browser-only persistence as preview evidence, not the
   packaged walkthrough. Obtain the pending GitHub result for the integration
   checkpoint.
9. Capture accessibility and 2560x1440 performance evidence from the packaged
   executable on the approved RTX-class workstation.

## Truthfulness rule

Only `TESTED-PORTABLE` means a behavior has run in the portable test suite.
`UR` is source evidence, not proof of Unreal compilation. `PREVIEW-ONLY` never
counts as native coverage. A checklist or script is evidence of a gate, not
evidence that the gate passed.

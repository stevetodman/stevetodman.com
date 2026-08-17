Correct. I would scope it as a **browser-based 3D hospital simulation game**, with pediatric cardiology as the clinical domain. The player should feel like they are physically present on a cardiology rotation—not like they opened an anatomy app.

Three.js is technically suitable for this architecture: its official first-person `PointerLockControls` is explicitly intended for first-person 3D experiences, its glTF loader supports the standard runtime asset format, and its newer renderer can target WebGPU with a WebGL 2 fallback. ([Three.js](https://threejs.org/docs/pages/PointerLockControls.html?utm_source=chatgpt.com "PointerLockControls – three.js docs"))

# Immersive 3D Pediatric Cardiology Hospital

## Complete Product, Gameplay, Educational, World, AI, Clinical Simulation, and Engineering Specification

**Working title:** Cardio Hospital
**Genre:** First-person immersive clinical simulation / serious game
**Platform:** Desktop web browser first; tablet later; optional VR later
**Rendering:** Three.js
**Primary deployment:** stevetodman.com
**Primary learner:** Pediatric resident rotating through pediatric cardiology
**Secondary learners:** Med-Peds residents, medical students, pediatric cardiology fellows, NICU/PICU trainees

---

# 1. PRODUCT CONCEPT

Build a fully explorable 3D pediatric hospital in which the learner assumes the role of a physician completing a pediatric cardiology rotation.

The learner physically moves through the hospital and performs the work of a physician.

They:

- enter the hospital
- walk through hallways
- use elevators
- enter workrooms
- receive patients
- speak to families
- take histories
- examine patients
- review the chart
- order testing
- walk to the ECG area
- enter the echocardiography lab
- review imaging
- consult the attending
- make diagnoses
- formulate treatment plans
- respond to emergencies
- admit patients
- go to the ICU
- visit the catheterization laboratory
- enter the operating room
- follow patients longitudinally

The 3D hospital is not decorative.

**Space is part of the simulation.**

---

# 2. CORE EXPERIENCE

The basic fantasy is:

> **"I am actually doing a pediatric cardiology rotation."**

A learner should be able to begin with essentially no interface other than:

```
7:42 AM
Pediatric Cardiology
Monday

```

They appear in the hospital.

Their phone or pager vibrates:

> Dr. Patel: Morning. Meet us in the cardiology workroom before clinic.

The learner must navigate there.

That establishes immediately that this is a world rather than a slide deck.

---

# 3. DESIGN PRINCIPLES

## 3.1 Clinical reasoning rather than answer selection

Avoid:

> What is the most likely diagnosis?

A. Vasovagal syncope
B. HCM
C. Seizure
D. Long QT

Instead:

The learner interacts with the patient.

They decide what questions to ask.

They decide whether to:

- examine the patient
- obtain orthostatic vitals
- order ECG
- obtain echocardiography
- restrict exercise
- refer for electrophysiology
- reassure the family

The diagnosis emerges from behavior.

---

# 4. PLAYER ROLE

Initial role:

**Pediatric resident on pediatric cardiology rotation**

This is important because the game can establish realistic boundaries.

The learner is expected to:

- obtain history
- perform examination
- recognize abnormalities
- generate differential diagnoses
- select appropriate testing
- interpret common ECGs
- understand basic echo findings
- recognize emergencies
- know when cardiology escalation is required

They are not expected to independently:

- perform congenital heart surgery
- conduct complex catheter interventions
- independently interpret every advanced congenital echo

The simulation can therefore teach escalation as well as diagnosis.

---

# 5. FIRST-PERSON MOVEMENT

Default desktop control scheme:

```
W — forward
A — strafe left
S — backward
D — strafe right

Mouse — look

Shift — walk faster
E — interact
F — focused examination
Tab — tablet/chart
M — hospital map
Esc — menu

```

Three.js provides `PointerLockControls`, designed specifically for first-person 3D applications. ([Three.js](https://threejs.org/docs/pages/PointerLockControls.html?utm_source=chatgpt.com "PointerLockControls – three.js docs"))

Movement should feel similar to a restrained first-person adventure game rather than an FPS.

No:

- jumping around corridors
- bunny hopping
- weapons-style camera movement
- exaggerated acceleration

Movement should feel deliberate and professional.

---

# 6. THIRD-PERSON OPTION

Optional camera mode:

```
First Person
Third Person
Accessibility Navigation

```

Third-person may be useful for learners susceptible to motion sickness.

Accessibility Navigation can allow point-and-click movement between relevant locations.

---

# 7. HOSPITAL WORLD

The first release should contain one believable pediatric hospital floor plus several specialized areas.

## Main areas

### Hospital entrance

Contains:

- lobby
- elevators
- information desk
- hallways
- signage

Provides environmental realism.

---

# 8. CARDIOLOGY WORKROOM

The workroom becomes the player's operational base.

Objects:

- computers
- workstations
- patient list
- whiteboard
- ECG printouts
- reference materials
- attending desk
- phones
- chairs
- printer

NPCs:

- attending
- fellow
- resident
- nurse practitioner
- medical student

Activities:

- morning briefing
- reviewing patients
- discussing cases
- receiving pages
- teaching
- debriefing

---

# 9. OUTPATIENT CLINIC

Multiple rooms should exist so cases feel like an actual clinic session.

Example:

```
Clinic Hallway
│
├── Room 1
├── Room 2
├── Room 3
├── Room 4
├── ECG Room
├── Echo Lab
├── Nurse Station
└── Workroom

```

Each room contains:

- examination table
- chairs
- computer
- sink
- BP equipment
- stethoscope
- pulse oximeter
- height/weight equipment

---

# 10. PATIENT ROOM EXPERIENCE

The learner enters.

A parent and child may already be present.

NPC behavior should acknowledge entry.

Example:

Parent:

> "Hi, doctor."

Child may:

- look up
- continue playing
- appear anxious
- avoid eye contact
- interact normally

The learner approaches.

Prompt:

> **Talk**

Then natural conversation begins.

---

# 11. NPC CONVERSATION SYSTEM

This is one of the most important systems in the entire project.

The learner should be able to communicate using:

### Mode A

Natural typed language.

### Mode B

Voice conversation.

### Mode C

Suggested clinical prompts.

Example suggestions:

```
Tell me what brought you in today.

Did you pass out during exercise or afterward?

Did you have warning symptoms?

Does anyone in your family have heart problems?

Ask something else...

```

The system must understand semantically equivalent questions.

It should not require predetermined wording.

---

# 12. PATIENT AI ARCHITECTURE

Each patient should possess a **case truth model**.

Example:

```
{
  "age": 14,
  "chiefComplaint": "syncope",
  "diagnosis": "hypertrophic cardiomyopathy",
  "history": {
    "syncope": "during basketball",
    "prodrome": false,
    "chestPain": false,
    "palpitations": true
  },
  "familyHistory": {
    "suddenDeath": true,
    "relative": "maternal uncle",
    "age": 29
  }
}

```

The AI may conversationally express this information.

It may **never change the underlying facts**.

This prevents hallucinated case data.

---

# 13. INFORMATION DISCLOSURE RULES

NPCs should reveal information realistically.

For example:

Learner:

> Any family history?

Parent:

> His grandmother has high blood pressure.

That should not automatically reveal:

> Maternal uncle died suddenly at 29.

The learner may need:

> Has anyone died unexpectedly or at a young age?

Then:

> Actually, my brother died when he was 29.

This makes history-taking skill measurable.

---

# 14. PERSONALITY MODEL

Each NPC should possess behavioral parameters.

Example:

```
anxiety: 0.7
talkativeness: 0.4
healthLiteracy: 0.3
trust: 0.7
irritability: 0.1
recallReliability: 0.8

```

These modify conversation without altering clinical truth.

---

# 15. PEDIATRIC PATIENT BEHAVIOR

Children should behave according to developmental age.

A 4-year-old should not speak like a 16-year-old.

Possible behaviors:

- playing
- hiding
- crying
- watching tablet
- interrupting parent
- answering selectively
- asking what the stethoscope does

Adolescents may:

- provide their own history
- minimize symptoms
- contradict parents
- request privacy

---

# 16. CONFIDENTIAL ADOLESCENT INTERVIEW

Advanced cases may require:

> Would you like your parent to step outside for a few minutes?

This creates opportunities involving:

- stimulant use
- energy drinks
- vaping
- medications
- pregnancy
- eating disorders
- substance exposure

Only clinically relevant scenarios should be included.

---

# 17. PHYSICAL EXAMINATION

The learner should physically approach the patient.

Selecting:

> Examine

enters examination mode.

Possible actions:

```
General appearance
Pulse
Blood pressure
Respiratory rate
Oxygen saturation

Inspect chest
Palpate precordium
Auscultate

Check femoral pulses
Check radial pulses

Look for edema

Examine skin

Assess dysmorphic features

```

---

# 18. STETHOSCOPE SYSTEM

The learner selects the stethoscope.

The cursor becomes a chest location selector.

Sites:

```
RUSB
LUSB
LLSB
Apex
Back
Infraclavicular

```

Moving the chest piece changes the murmur.

The system should support:

- intensity
- timing
- frequency
- radiation
- respiratory variation
- positional variation

---

# 19. MURMUR AUDIO ENGINE

Murmur sources:

- Still murmur
- pulmonary flow murmur
- VSD
- ASD-associated pulmonary flow murmur
- pulmonary stenosis
- aortic stenosis
- mitral regurgitation
- PDA
- HCM
- venous hum
- innocent neonatal murmurs

Dynamic maneuvers:

- standing
- squatting
- Valsalva
- inspiration
- expiration

Where educationally appropriate.

---

# 20. VITAL SIGNS SYSTEM

Vitals should not simply appear automatically.

The learner can:

- review nurse vitals
- repeat BP
- compare limbs
- perform orthostatics
- repeat oxygen saturation

Example:

```
Right arm: 128/68
Left arm: 124/66
Right leg: 96/54

```

This can reveal coarctation.

---

# 21. CLINICAL TABLET

Pressing `Tab` opens an in-world tablet.

Sections:

```
Patients
Schedule
Messages
Results
Orders
Notes
Reference
Tasks

```

The tablet overlays the game but does not exit the world.

---

# 22. ELECTRONIC MEDICAL RECORD

Implement a simplified fictional EHR.

Never duplicate Epic visually.

Include:

### Patient summary

- name
- age
- sex
- vitals
- medications
- allergies
- diagnoses

### Results

- ECG
- echo
- labs
- Holter
- exercise test
- imaging

### Notes

- PCP referral
- previous cardiology visit
- emergency department note

### Orders

Learner selects investigations.

---

# 23. ORDER ENTRY

Possible orders:

```
12-lead ECG
Echocardiogram
Holter
Event monitor
Exercise test
Chest X-ray
CBC
CMP
Troponin
BNP
TSH
Genetics referral
Cardiac MRI
CT angiography

```

Not every order should be appropriate.

Ordering unnecessary tests affects performance.

---

# 24. CONSEQUENCES OF TESTING

There should be explicit tradeoffs.

The learner should learn:

> More testing ≠ better care.

Evaluation can consider:

- diagnostic yield
- cost
- delay
- radiation
- sedation
- false-positive downstream effects

---

# 25. ECG ROOM

The learner can physically walk with the patient to an ECG room.

NPC technician places electrodes.

The ECG appears on screen or paper.

Learner can:

- zoom
- measure intervals
- inspect rhythm
- mark findings

---

# 26. ECG INTERPRETATION ENGINE

Cases should include:

- normal pediatric variants
- sinus bradycardia
- sinus tachycardia
- PAC
- PVC
- SVT
- WPW
- prolonged QT
- AV block
- RVH
- LVH
- RBBB
- postoperative patterns
- myocarditis patterns
- pericarditis

Later expansion:

dynamic electrophysiology visualization.

---

# 27. ECHO LAB

The learner walks to the echocardiography suite.

Environment includes:

- ultrasound machine
- bed
- sonographer
- monitor
- dimmed lighting

Two modes:

### Resident mode

Review predetermined echo clips.

### Advanced mode

Operate virtual probe.

---

# 28. INTERACTIVE ECHO PROBE

Advanced simulation:

The learner moves a probe over a virtual chest.

Probe position determines imaging plane.

Views include:

- parasternal long axis
- parasternal short axis
- apical four chamber
- apical five chamber
- subcostal
- suprasternal

A transparent anatomy overlay can show the imaging plane through the 3D heart.

---

# 29. CARDIOLOGY ATTENDING AI

The attending should function like an actual supervising physician.

The attending must not simply give answers.

Example:

Learner:

> I think this is vasovagal syncope.

Attending:

> What makes you comfortable with that diagnosis?

If learner misses exertional symptoms:

> When exactly did the loss of consciousness occur relative to exercise?

If they recognize danger:

> Good. What are you going to do next?

---

# 30. SOCRATIC TEACHING ENGINE

The attending evaluates the learner's reasoning model.

Instead of:

```
Correct.

```

Prefer:

```
You correctly recognized exertional syncope as a red flag.

However, you did not ask about sudden death in relatives.

What diagnoses make that family history particularly important?

```

---

# 31. ATTENDING PERSONALITIES

Eventually multiple faculty modes:

### Dr. Socratic

Asks questions.

### Dr. Efficient

Focuses on practical decisions.

### Dr. Boards

Emphasizes examination concepts.

### Dr. Physiology

Pushes mechanism.

The underlying clinical truth remains unchanged.

---

# 32. INITIAL CLINIC CASES

Launch set:

## Case 1 — New murmur

Eventually diagnosed as innocent Still murmur.

Learning:

- innocent murmur characteristics
- avoiding unnecessary testing

---

## Case 2 — Syncope

Post-exertional vasovagal episode.

Learning:

- timing relative to exertion
- prodrome
- reassurance

---

## Case 3 — Dangerous syncope

Mid-exertional HCM.

Learning:

- exertional red flags
- family history
- ECG/echo escalation
- exercise restriction

---

## Case 4 — Palpitations

SVT / pre-excitation.

Learning:

- sudden onset/termination
- ECG recognition
- referral

---

## Case 5 — Chest pain

Musculoskeletal chest pain.

Learning:

- prevalence of benign etiologies
- appropriate reassurance

---

## Case 6 — Myocarditis

Postviral chest pain with troponin elevation.

Learning:

- red flags
- ECG
- biomarkers
- admission/escalation

---

## Case 7 — Hypertension

Adolescent hypertension.

Learning:

- measurement technique
- repeat BP
- classification
- ABPM

---

## Case 8 — Coarctation

Upper/lower extremity discrepancy.

Learning:

- pulse examination
- BP discrepancy

---

# 33. CONTRASTIVE CASE DESIGN

Cases should deliberately resemble each other.

Example syncope family:

```
Syncope A — vasovagal
Syncope B — dehydration
Syncope C — HCM
Syncope D — long QT
Syncope E — SVT
Syncope F — seizure mimic
Syncope G — post-exertional benign event

```

The learner discovers discriminating features through history and exam.

This creates genuine clinical reasoning training.

---

# 34. HOSPITAL EVENT SYSTEM

The world continues around the learner.

Potential events:

- nurse pages learner
- new consult arrives
- emergency department calls
- echo result becomes available
- attending requests discussion
- child deteriorates
- clinic schedule falls behind

---

# 35. TIME SYSTEM

World clock should operate faster than real time during selected activities.

Example:

```
07:45 morning meeting
08:00 clinic
10:10 ED consult
12:00 conference
13:00 inpatient consult
15:30 echo review
16:15 debrief

```

Time pressure should be modest initially.

The purpose is prioritization—not stress entertainment.

---

# 36. CONSULT SYSTEM

The learner may receive:

> **NEW CONSULT — PICU**

> 7-year-old with tachycardia and hypotension.

The learner can:

1. review chart
2. walk to PICU
3. examine patient
4. review telemetry
5. intervene

---

# 37. PEDIATRIC ICU

PICU environment contains:

- patient rooms
- monitors
- infusion pumps
- ventilators
- crash cart
- central monitor
- staff

Cases:

- SVT
- myocarditis
- postoperative congenital patient
- pulmonary hypertension crisis
- heart failure
- pericardial effusion

---

# 38. PHYSIOLOGIC PATIENT ENGINE

Hospital patients should have dynamic state.

Example:

```
interface PatientState {
    HR: number
    SBP: number
    DBP: number
    SpO2: number
    RR: number

    preload: number
    contractility: number
    SVR: number
    PVR: number

    cardiacOutput: number

    consciousness: number
}

```

Clinical interventions modify the state.

---

# 39. EXAMPLE DYNAMIC EVENT

SVT patient:

```
HR 242
BP 78/42
SpO2 99%

```

Learner chooses vagal maneuver.

Possible outcome:

```
HR 238

```

Then adenosine.

Heart monitor displays transient AV block followed by sinus rhythm.

```
HR 102
BP 96/58

```

The patient visibly improves.

---

# 40. TELEMETRY SYSTEM

Hospital monitors should display dynamically generated:

- ECG
- HR
- SpO2
- BP
- respiratory rate

Monitor alarms should correspond to the actual physiologic state.

---

# 41. EMERGENCY DEPARTMENT

ED cases:

- syncope
- chest pain
- tachycardia
- cyanosis
- myocarditis
- Kawasaki disease
- infant respiratory distress

The learner receives consultation requests rather than acting as ED physician.

This preserves role authenticity.

---

# 42. NEONATAL ICU

NICU provides some of the most educationally powerful scenarios.

Cases:

- ductal-dependent systemic circulation
- ductal-dependent pulmonary circulation
- TGA
- coarctation
- critical pulmonary stenosis
- HLHS
- PPHN

---

# 43. CYANOTIC NEWBORN CASE

Example:

Newborn:

```
SpO2 68%
minimal respiratory distress
CXR relatively clear

```

Learner evaluates.

Eventually:

> Suspected transposition.

Appropriate action:

- urgent cardiology escalation
- prostaglandin where indicated
- echo
- stabilization

---

# 44. FETAL-TO-NEONATAL PHYSIOLOGY VISUALIZATION

Inside the NICU, the learner can activate an educational visualization.

The patient remains visible.

A floating transparent 3D cardiovascular model appears.

It shows:

- ductus arteriosus
- foramen ovale
- pulmonary circulation
- systemic circulation

The learner can watch flow change after birth.

This is where the physiology simulator belongs:

**inside the hospital experience.**

---

# 45. CARDIAC CATHETERIZATION LAB

Physical cath lab environment:

- cath table
- C-arm
- monitors
- anesthesia equipment
- control room

Learner initially observes.

Advanced mode:

- review saturations
- review pressures
- calculate Qp\:Qs
- calculate PVR
- recognize gradients

---

# 46. CATHETER NAVIGATION

Advanced learners could manipulate a virtual catheter.

Possible procedures:

- right-heart cath
- left-heart cath
- balloon pulmonary valvuloplasty
- ASD device closure
- PDA closure
- coarctation intervention

This should be later-stage development.

---

# 47. OPERATING ROOM

OR environment:

- patient
- surgical table
- surgeon
- anesthesiologist
- perfusionist
- scrub staff
- cardiopulmonary bypass machine

Learner should initially participate as observer/consultant.

---

# 48. SURGERY EDUCATION MODE

During surgery:

> **Pause anatomy**

The operating field transforms into enlarged 3D anatomy.

Example:

Tetralogy repair:

1. VSD identified
2. VSD patch placed
3. RVOT obstruction relieved
4. pulmonary valve/RVOT assessed

The learner sees how each step changes circulation.

---

# 49. POSTOPERATIVE ICU

Cases:

- JET
- low cardiac output
- residual VSD
- RV dysfunction
- pulmonary hypertension
- tamponade
- complete heart block
- coronary compromise after arterial switch

The learner can connect operative anatomy with postoperative physiology.

---

# 50. CARDIAC MRI / CT SUITE

The learner can:

- review images
- scroll slices
- inspect 3D reconstruction
- activate anatomical labels

Possible cases:

- vascular ring
- anomalous coronary artery
- aortic arch anomaly
- repaired TOF
- complex pulmonary artery anatomy

---

# 51. VASCULAR RING EXPERIENCE

This would be unusually effective in immersive 3D.

The learner enters the CT room.

After reviewing images:

> **Enter anatomy**

The screen transitions into a large-scale anatomical space.

The learner can walk around:

- trachea
- esophagus
- aortic arch
- aberrant vessels

Then literally see how the vascular structure encloses the airway.

---

# 52. VIRTUAL CONFERENCE ROOM

Teaching conference occurs inside the hospital.

Features:

- projector
- whiteboard
- ECG display
- echo display
- 3D heart projection

An attending can quiz learners dynamically.

---

# 53. CASE DEBRIEF ROOM

At the end of each case:

The learner walks into a small conference room.

The attending may ask:

> Walk me through what happened.

The learner summarizes.

The system evaluates reasoning.

---

# 54. ASSESSMENT PHILOSOPHY

Do not score only the final diagnosis.

Score the entire clinical process.

Dimensions:

```
History
Physical examination
Recognition of red flags
Differential diagnosis
Test selection
Interpretation
Clinical reasoning
Management
Communication
Efficiency
Safety

```

---

# 55. EXAMPLE SCORING

```
Clinical reasoning       87%
History                   91%
Physical examination     72%
Testing strategy          94%
Safety                   100%
Communication             83%
Efficiency                78%

```

Then:

> You correctly recognized exertional syncope but delayed exercise restriction until after echocardiography.

That feedback is useful.

---

# 56. INVISIBLE SCORING

During gameplay:

**Do not display points.**

No:

```
+10 correct question!

```

This destroys immersion.

Scores appear only during debrief.

---

# 57. CLINICAL ACTION LOG

Every relevant action is recorded.

Example:

```
08:12 Entered exam room
08:13 Asked chief complaint
08:17 Asked exertional timing
08:21 Performed cardiac examination
08:24 Ordered ECG
08:31 Reviewed ECG
08:34 Ordered echocardiogram
08:39 Restricted exercise

```

This enables detailed feedback.

---

# 58. MISSED OPPORTUNITY ENGINE

The system can identify critical omissions.

Example:

```
You never asked whether the syncope occurred during or after exercise.

```

or:

```
You did not assess femoral pulses in a patient with hypertension.

```

---

# 59. COUNTERFACTUAL FEEDBACK

Potentially extremely powerful.

After a case:

> What if the patient had instead told you the episode occurred **during** exercise?

The simulation can branch immediately.

This creates contrastive reasoning.

---

# 60. WRONG DECISIONS

The simulator must allow errors.

Do not block inappropriate actions.

If learner orders unnecessary CT:

The simulation should permit it.

Debrief:

> CT exposed the patient to radiation without changing management.

If learner incorrectly clears HCM patient:

The attending intervenes before actual harm.

Debrief labels it a major safety error.

---

# 61. FAILURE STATES

The simulation should avoid videogame-style:

> GAME OVER

Instead:

```
Attending intervention occurred.

Critical safety event:
You attempted to discharge a patient with exertional syncope and abnormal ECG.

```

Then debrief.

---

# 62. WORLD NPC POPULATION

Hospital NPCs:

- attending cardiologists
- fellows
- residents
- nurses
- sonographers
- ECG technicians
- respiratory therapists
- surgeons
- anesthesiologists
- reception staff
- parents
- children
- adolescents
- siblings

Not every NPC needs generative AI.

Ambient characters can use scripted behaviors.

---

# 63. NPC SCHEDULING

NPCs should move through logical routines.

Example:

```
Sonographer:
08:00 echo lab
12:00 break room
13:00 echo lab

```

This makes the hospital feel inhabited.

---

# 64. AMBIENT ACTIVITY

World should include:

- carts moving
- distant announcements
- footsteps
- doors
- monitors
- conversations
- printers
- rolling equipment

Keep this subtle.

---

# 65. AUDIO

Spatial audio is essential.

Sources:

- conversations
- footsteps
- monitor alarms
- murmur sounds
- overhead paging
- doors
- ventilation ambience
- ultrasound room
- OR
- cath lab

Audio should change by location.

---

# 66. VISUAL STYLE

Target:

**credible modern children's hospital**

Not cartoon.

Not hyperrealistic.

Aim for:

> high-quality architectural visualization + stylized-realistic people.

The visual style should prioritize:

- clarity
- performance
- believable scale
- medical accuracy

over cinematic detail.

---

# 67. CHARACTER VISUALS

Characters need:

- realistic proportions
- pediatric age variation
- facial animation
- gaze behavior
- idle movement
- sitting
- walking
- lying down
- examination poses

Avoid attempting photorealistic human faces initially because uncanny-valley failures are distracting.

---

# 68. CHARACTER ANIMATION

Base animation set:

```
Idle standing
Idle sitting
Walking
Sitting down
Standing up
Talking
Listening
Pointing
Typing
Examining
Walking with child
Lying down
Breathing
Distress

```

Blend animations smoothly.

---

# 69. LIP SYNCHRONIZATION

Later versions should support:

- phoneme-driven mouth movement
- facial expression
- gaze coordination

Initial version can use generalized speaking animation.

---

# 70. WORLD CONSTRUCTION PIPELINE

Recommended:

```
Architectural plan
↓
Blockout
↓
Blender
↓
Modular hospital kit
↓
GLB
↓
Three.js

```

Use modular pieces:

- walls
- doors
- floors
- ceilings
- counters
- exam room furniture

This reduces asset burden.

Three.js supports loading glTF 2.0 scenes and their associated meshes, materials, animations and related extensions through `GLTFLoader`. ([Three.js](https://threejs.org/docs/pages/GLTFLoader.html?utm_source=chatgpt.com "GLTFLoader – three.js docs"))

---

# 71. HOSPITAL STREAMING

Do not keep the entire hospital fully rendered.

Divide into zones:

```
Clinic
PICU
NICU
Cath
OR
Imaging
Lobby

```

Load nearby zones.

Unload distant ones.

---

# 72. LEVEL-OF-DETAIL SYSTEM

Objects should have:

```
LOD0 — close
LOD1 — medium
LOD2 — distant

```

Characters farther away may use simplified models.

---

# 73. COLLISION SYSTEM

Use physics primarily for:

- walls
- doors
- navigation
- interactive objects

Do not simulate physics on every chair and paper cup.

Rapier is a practical WebAssembly physics engine with an existing React Three integration supporting rigid bodies and colliders. ([PMNDers](https://pmndrs.github.io/react-three-rapier/?utm_source=chatgpt.com "@react-three/rapier"))

---

# 74. INTERACTION SYSTEM

Objects implement a common interface:

```
interface Interactable {
    id: string
    label: string

    canInteract(player: Player): boolean

    interact(context: InteractionContext): void
}

```

Examples:

```
Door
Patient
Computer
Stethoscope
Monitor
Elevator
ECG
Echo machine
Chart
Phone

```

---

# 75. CONTEXT-AWARE CURSOR

Looking at an interactive object:

```
[E] Open Door

```

Patient:

```
[E] Talk to Maya

```

Monitor:

```
[E] Review Telemetry

```

---

# 76. OBJECT HIGHLIGHTING

Interactive objects receive subtle edge emphasis when centered.

Do not outline every object constantly.

---

# 77. DOOR SYSTEM

Doors should:

- open appropriately
- close
- respect collision
- support restricted rooms
- optionally require badge access

This seems minor but contributes disproportionately to immersion.

---

# 78. ELEVATOR SYSTEM

Elevator connects hospital areas.

Possible destinations:

```
1 Lobby
2 Clinic
3 Imaging
4 PICU/NICU
5 Cath/OR

```

Loading can occur during elevator travel.

---

# 79. WORLD MAP

The learner can access a hospital directory.

But navigation should initially require some spatial learning.

Useful destinations receive signage.

---

# 80. QUEST SYSTEM

Do not call them quests in the UI.

Internally, however, cases can behave like quest graphs.

Example:

```
See patient
   ↓
History
   ↓
Physical
   ↓
Testing
   ↓
Interpretation
   ↓
Assessment
   ↓
Attending discussion
   ↓
Management

```

Branches depend on learner choices.

---

# 81. CASE GRAPH ARCHITECTURE

Each case should be data-driven.

Example:

```
CaseNode {
    id
    conditions
    triggers
    availableActions
    effects
    transitions
}

```

Cases should not require modifying the game engine.

---

# 82. CASE AUTHORING SYSTEM

Eventually create an internal visual editor.

Faculty should be able to define:

- patient demographics
- history facts
- examination
- vital signs
- tests
- images
- ECG
- diagnosis
- red flags
- teaching objectives
- dialogue constraints
- branching outcomes
- scoring rules

Without writing code.

---

# 83. CASE TRUTH SEPARATION

There must be strict separation between:

### Clinical truth

Immutable.

and:

### Dialogue generation

Flexible.

This is critical for safe AI integration.

---

# 84. AI ARCHITECTURE

Recommended pipeline:

```
Learner speech/text
        ↓
Intent extraction
        ↓
Case truth retrieval
        ↓
Role/personality constraints
        ↓
Response generation
        ↓
Clinical consistency validator
        ↓
NPC speech

```

The LLM does not determine the diagnosis.

The case engine does.

---

# 85. CONVERSATION MEMORY

NPCs remember only relevant conversation during an encounter.

Example:

Learner:

> When did this begin?

Later:

> You said it started last Tuesday?

Patient responds consistently.

---

# 86. ATTENDING REASONING EVALUATOR

The learner may be asked:

> What do you think is going on?

Learner gives free-text reasoning.

An evaluator assesses:

- diagnosis
- evidence
- contradictory evidence
- missing considerations
- safety

---

# 87. VOICE MODE

Ideal final experience:

Learner literally talks.

Example:

> Hi, I'm Dr. Todman. What brought you in today?

Patient NPC responds aloud.

This dramatically increases immersion.

Typed fallback must remain available.

---

# 88. SPEECH LATENCY TARGET

Conversation should feel rapid enough not to break immersion.

Target perceived response start:

**approximately 1–2 seconds where infrastructure permits.**

Use streaming speech where possible.

---

# 89. PLAYER AVATAR

First-person mode does not require full visible body initially.

Provide:

- hands
- optional sleeves
- stethoscope animation

Third-person later requires full avatar.

---

# 90. PROCEDURAL HAND INTERACTION

Later:

- open door
- pick up chart
- use stethoscope
- place echo probe
- press monitor controls

Initial implementation can use camera-centered interaction.

---

# 91. SAVE SYSTEM

Learner progress should persist.

Store:

- completed cases
- scores
- identified weaknesses
- unlocked areas
- current rotation day
- achievements/mastery

---

# 92. ROTATION STRUCTURE

A compelling campaign:

## Day 1

Murmurs + chest pain

## Day 2

Syncope

## Day 3

Arrhythmia

## Day 4

Hypertension

## Day 5

Congenital disease

## Day 6

NICU

## Day 7

PICU

## Day 8

Cath

## Day 9

Surgery

## Day 10

Capstone

---

# 93. MORNING HUD

Beginning of day:

```
PEDIATRIC CARDIOLOGY
Rotation Day 4

08:00 Clinic
12:00 ECG Conference
13:00 Consults

```

Then HUD disappears.

---

# 94. CAPSTONE

Final simulation should combine several patients simultaneously.

Example:

- benign murmur waiting in clinic
- exertional syncope patient
- SVT consult from ED
- PICU myocarditis patient awaiting reassessment

Learner prioritizes appropriately.

---

# 95. LONGITUDINAL PATIENTS

Patients should sometimes return.

Example:

Day 2:

Syncope diagnosis.

Day 5:

Holter results.

Day 8:

Follow-up visit.

This produces continuity.

---

# 96. CONSEQUENCE PERSISTENCE

Earlier decisions can affect later events.

Example:

A learner orders unnecessary imaging.

Later they review an incidental finding.

This can teach downstream consequences.

---

# 97. ACHIEVEMENTS

Avoid arcade-style trophies.

Use competency milestones.

Examples:

```
Syncope: Competent
Murmur Evaluation: Mastered
ECG Recognition: Developing
Pediatric Hypertension: Competent

```

---

# 98. MASTERY MODEL

Track individual concepts.

Example:

```
exertional_syncope_red_flag = 0.92
family_sudden_death = 0.81
orthostatic_vitals = 0.73
coarctation_pulses = 0.54

```

Future cases can preferentially test weaknesses.

---

# 99. ADAPTIVE CASE SELECTION

If learner repeatedly misses femoral pulses:

Future hypertension case should contain coarctation.

If learner over-orders echocardiography:

Future innocent murmur cases test restraint.

---

# 100. SPACED REPETITION

Concepts should reappear across different contexts.

Example:

Long QT:

- syncope clinic
- ECG conference
- medication review
- family screening case

---

# 101. WORLD-FIRST UI

The screen should generally remain clean.

Default HUD:

```
small interaction prompt
pager icon when needed
optional objective

```

No giant permanent health bars, score counters, minimaps, or quest lists.

---

# 102. INTERACTION DESIGN

Example:

Player looks at computer.

```
[E] Open Chart

```

Click.

Camera subtly shifts toward monitor.

EHR appears as a diegetic interface.

Close chart.

Return immediately to world.

---

# 103. DIEGETIC INTERFACES

Where practical, UI should exist inside the hospital:

- ECG on paper
- echo on monitor
- vitals on bedside monitor
- patient list on computer
- pager on phone

This substantially improves immersion.

---

# 104. NON-DIEGETIC INTERFACES

Use overlays only when justified:

- settings
- accessibility
- debrief
- optional tutorial prompts

---

# 105. TUTORIAL

Do not start with a long tutorial.

First day naturally teaches controls.

Example:

```
Walk to Dr. Patel.

WASD — Move
Mouse — Look

```

Then:

```
[E] Talk

```

After demonstrated once, prompts become minimal.

---

# 106. PERFORMANCE TARGETS

Desktop target:

```
60 FPS preferred
30 FPS minimum

```

Typical laptop should be supported.

GPU memory budget should be aggressively managed.

Use:

- instancing
- baked lighting where appropriate
- compressed textures
- occlusion strategy
- LOD
- lazy loading

---

# 107. RENDERER

Use the Three.js renderer abstraction so the application is prepared for WebGPU while preserving broad compatibility.

Current Three.js documentation states that `WebGPURenderer` attempts WebGPU when available and falls back to a WebGL 2 backend otherwise. ([Three.js](https://threejs.org/docs/pages/WebGPURenderer.html?utm_source=chatgpt.com "WebGPURenderer – three.js docs"))

Do not require WebGPU for version 1.

---

# 108. RECOMMENDED SOFTWARE STACK

```
Next.js
React
TypeScript

Three.js
React Three Fiber

Rapier

Zustand

XState or equivalent state-machine architecture

PostgreSQL

Supabase or equivalent backend

LLM API

Speech-to-text
Text-to-speech

```

---

# 109. ENGINE ARCHITECTURE

```
                    HOSPITAL CLIENT

 ┌─────────────────────────────────────────────┐
 │                    UI                       │
 ├─────────────────────────────────────────────┤
 │              Gameplay Systems               │
 │                                             │
 │  Interaction   Navigation   Inventory       │
 │  Dialogue      Case Engine  Assessment      │
 ├─────────────────────────────────────────────┤
 │              Clinical Systems               │
 │                                             │
 │ Patient State | Tests | ECG | Echo | Physio │
 ├─────────────────────────────────────────────┤
 │               World Systems                 │
 │                                             │
 │ NPCs | Time | Audio | Animation | Doors     │
 ├─────────────────────────────────────────────┤
 │                 Three.js                    │
 ├─────────────────────────────────────────────┤
 │             WebGPU / WebGL2                 │
 └─────────────────────────────────────────────┘

                         │
                         ▼

                    BACKEND

          Cases
          Users
          Progress
          Analytics
          AI orchestration
          Media
          Assessments

```

---

# 110. CODEBASE ORGANIZATION

```
/apps
    /hospital

/packages
    /engine
    /world
    /clinical
    /cases
    /characters
    /dialogue
    /assessment
    /ui
    /assets
    /audio
    /shared

```

Clinical logic must remain independent from rendering.

---

# 111. ENTITY COMPONENT SYSTEM

An ECS-style model would be useful even if not implemented as a formal ECS library.

Entity:

```
Patient_004

```

Components:

```
Transform
Renderable
Collider
Character
Dialogue
Patient
VitalSigns
CaseParticipant

```

This makes the hospital scalable.

---

# 112. NAVIGATION SYSTEM

NPCs need navmesh-based movement.

They must navigate:

- hallways
- rooms
- doors
- elevators
- furniture

Characters should avoid each other.

---

# 113. NPC LEVEL OF SIMULATION

Nearby NPC:

```
full model
animation
dialogue
navigation

```

Far NPC:

```
simplified simulation

```

Very distant NPC:

```
schedule state only

```

---

# 114. LIGHTING

Use hybrid lighting.

Recommended:

- baked global illumination for architecture
- limited dynamic lights
- real-time local lighting where necessary
- light probes/environment maps

Hospital fluorescent lighting does not require expensive fully dynamic lighting.

---

# 115. SHADOWS

Restrict high-quality shadows primarily to:

- characters
- nearby interactive objects

Avoid dynamic shadow casting from every architectural object.

---

# 116. AUDIO ARCHITECTURE

Use separate buses:

```
Dialogue
Environment
Medical equipment
UI
Music

```

Learner can independently adjust each.

---

# 117. MUSIC

Very limited.

Do not play constant game music inside clinical environments.

Ambient sound should dominate.

Music may appear:

- title
- transitions
- debrief

---

# 118. LOAD EXPERIENCE

Initial loading screen could resemble:

```
LSU HEALTH SHREVEPORT
Pediatric Cardiology

Loading clinical simulation...

```

Then transition directly into hospital.

---

# 119. ACCESSIBILITY

Must include:

- captions
- transcript
- keyboard remapping
- mouse sensitivity
- motion reduction
- head-bob toggle
- FOV adjustment
- teleport/point navigation
- high-contrast UI
- color-independent clinical cues

---

# 120. MOTION SICKNESS

Particularly important.

Default:

- minimal head bob
- moderate FOV
- no camera shake
- smooth but restrained acceleration

Options:

```
Reduced motion
Snap turn
Teleport
Third person

```

---

# 121. MOBILE

Do not make phone support a launch requirement.

The experience should primarily target:

```
desktop + keyboard + mouse

```

Tablet support may later offer:

- virtual joystick
- touch look
- tap interaction

A complex first-person medical simulator will be substantially better on desktop.

---

# 122. VR

Architect the interaction system so VR can be added later.

Three.js supports an XR ecosystem, but VR should not determine the first release architecture.

VR could eventually be ideal for:

- physical exam
- anatomy
- cath
- echo
- OR

---

# 123. CONTENT VALIDATION

Every clinical case must contain:

```
Author
Medical reviewer
Guideline sources
Version
Last reviewed

```

---

# 124. MEDICAL SOURCE MODEL

Store citations with individual clinical facts when possible.

Example:

```
{
    "concept": "exertionalSyncope",
    "teachingPoint": "...",
    "sources": [...]
}

```

This enables guideline updates.

---

# 125. ANALYTICS

Capture educational events, not merely clicks.

Example:

```
history_question
exam_performed
test_ordered
test_interpreted
diagnosis_submitted
management_action
safety_event
attending_consulted

```

---

# 126. RESEARCH DATA

With appropriate consent/approval, the platform could eventually evaluate:

- diagnostic accuracy
- information gathering
- unnecessary test ordering
- time to recognition
- confidence calibration
- transfer to unfamiliar cases
- retention

This creates a credible medical-education research program.

---

# 127. FACULTY DASHBOARD

Faculty view:

```
Resident             Cases   Accuracy   Safety   Efficiency
-----------------------------------------------------------
Resident A             18       87%       96%        72%
Resident B             14       91%      100%        84%

```

Concept weaknesses:

```
Exertional syncope        82%
Murmur differentiation    91%
Hypertension              66%
ECG interpretation        74%

```

---

# 128. PRIVACY

Do not use real patient information.

All patients should be synthetic.

No PHI should enter case authoring.

---

# 129. NETWORK ARCHITECTURE

Single-player first.

Do **not** start with multiplayer.

Multiplayer introduces:

- synchronization
- networking
- authoritative state
- voice routing
- identity
- abuse controls

without substantially improving the initial educational objective.

---

# 130. FUTURE MULTIPLAYER

Later:

```
Resident
Fellow
Nurse
Attending

```

Multiple learners could manage a deteriorating patient together.

Useful for team training.

---

# 131. ENVIRONMENT MVP

Do **not** build an entire hospital initially.

Build one highly polished vertical slice:

```
Cardiology workroom
        │
        ▼
Clinic hallway
  ├── Room 1
  ├── Room 2
  ├── ECG
  └── Echo

```

This is enough to prove the concept.

---

# 132. FIRST VERTICAL SLICE

The first complete experience should be:

## Exertional Syncope

### Beginning

Learner enters cardiology workroom.

Attending:

> We've got a 14-year-old referred after passing out at basketball practice. Why don't you see him first?

### Learner

Walks to Room 3.

### Encounter

History.

Exam.

### Testing

ECG.

Echo.

### Decision

Learner tells attending assessment.

### Debrief

HCM recognized—or missed.

---

# 133. WHY THIS CASE FIRST

It tests nearly every major engine:

- movement
- NPCs
- natural dialogue
- history
- examination
- ECG
- echo
- clinical reasoning
- attending AI
- decision making
- assessment
- debrief

It therefore functions as the technological vertical slice.

---

# 134. SECOND CASE

Use almost identical environment and assets.

**Post-exertional vasovagal syncope.**

The purpose is contrast.

The learner cannot simply learn:

> Syncope → echocardiogram.

They must discriminate.

---

# 135. THIRD CASE

**Long-QT syndrome**

Again reuse:

- room
- family
- examination
- ECG system

This gives three different etiologies from one clinical presentation.

---

# 136. PHASE 1 — CORE WORLD ENGINE

Build:

- hospital architecture
- first-person movement
- doors
- interaction
- collision
- basic NPCs
- animation
- dialogue
- chart interface
- saving

No sophisticated physiology yet.

---

# 137. PHASE 2 — CLINIC SIMULATOR

Add:

- patient encounters
- physical examination
- orders
- ECG
- echo
- attending
- scoring
- 8–12 clinic cases

At this stage the product is already educationally valuable.

---

# 138. PHASE 3 — INPATIENT HOSPITAL

Add:

```
PICU
NICU
ED

```

Dynamic physiology becomes more important.

---

# 139. PHASE 4 — PROCEDURAL WORLD

Add:

```
Cath
OR
MRI
CT

```

---

# 140. PHASE 5 — DEEP PHYSIOLOGY

Add embedded 3D simulations:

- fetal circulation
- shunts
- Fontan
- pulmonary hypertension
- congenital anatomy

---

# 141. PHASE 6 — ADAPTIVE AI CURRICULUM

Add:

- learner model
- adaptive case selection
- automated teaching
- longitudinal competency tracking

---

# 142. PHASE 7 — MULTIPLAYER / VR

Only after the single-player curriculum is mature.

---

# 143. WHAT SHOULD NOT BE BUILT FIRST

Avoid beginning with:

- full hospital
- operating room
- multiplayer
- VR
- complex surgical simulation
- photorealistic avatars
- CFD
- dozens of diseases

That produces enormous scope without proving the educational core.

---

# 144. FIRST RELEASE TARGET

A credible v1 should feel like:

> **Thirty minutes actually spent on pediatric cardiology rotation.**

It should contain:

```
1 polished clinic environment
1 workroom
1 ECG room
1 echo room

1 attending
1 nurse
1 sonographer

6–10 patient characters

5 contrastive cases

full history-taking
basic physical examination
ECG review
echo review
orders
assessment
management
debrief

```

---

# 145. IDEAL FIRST FIVE CASES

I would use:

1. Innocent murmur
2. Exertional HCM syncope
3. Post-exertional vasovagal syncope
4. WPW/SVT
5. Postviral myocarditis

Why?

Together they test:

- reassurance
- dangerous red flags
- pattern discrimination
- ECG
- echo
- emergency escalation

---

# 146. MINIMUM ASSET LIST

Environment:

```
hallway
workroom
4 exam rooms
ECG room
echo room
bathroom
utility doors
nursing station
elevator facade

```

Props:

```
chairs
exam table
computer
keyboard
BP cuff
pulse ox
stethoscope
ECG machine
echo machine
printer
phone
wall art
trash cans
medical cart

```

Characters:

```
attending
nurse
sonographer
5 children
5 adolescents
6 adults/parents

```

Animations:

```
idle
sit
stand
walk
talk
listen
examine
type
lie down

```

---

# 147. ESTIMATED MODEL COMPLEXITY

Hospital architecture should be modular rather than unique.

Typical visible scene budget should remain conservative.

Prioritize:

- character faces
- patient rooms
- interactive equipment

Reduce fidelity on:

- ceiling systems
- distant furniture
- inaccessible spaces

---

# 148. CONTENT CREATION PIPELINE

For each case:

```
Clinical objective
       ↓
Ground-truth vignette
       ↓
Discriminating features
       ↓
Patient dialogue database
       ↓
Exam findings
       ↓
Tests
       ↓
Management rules
       ↓
Safety rules
       ↓
Scoring
       ↓
Attending prompts
       ↓
Debrief
       ↓
Medical review

```

---

# 149. DEVELOPER TOOLING

Create internal debug interfaces:

```
Teleport
Spawn patient
Change patient state
Trigger event
Skip dialogue
Show case variables
Show NPC navmesh
Show FPS
Show draw calls
Show collider meshes

```

These are mandatory for efficient development.

---

# 150. AUTOMATED TESTING

Tests should include:

### Unit

- case state
- scoring
- physiology
- orders

### Integration

- dialogue → case facts
- test order → result
- intervention → patient state

### Browser

- hospital loads
- movement works
- patient encounter completes
- case completion persists

---

# 151. MEDICAL CONSISTENCY TESTS

Automated case validation should check:

```
Does every ordered test have a result?

Can the learner reach every required diagnostic state?

Are contradictory historical facts present?

Can the case dead-end?

Does any wrong action accidentally receive full score?

```

---

# 152. PERFORMANCE TESTING

Measure:

```
FPS
frame time
draw calls
triangle count
GPU memory
initial bundle
GLB load time
texture memory
NPC count

```

---

# 153. DEPLOYMENT

Suggested:

```
stevetodman.com/cardiohospital

```

or:

```
stevetodman.com/sim

```

Large assets should be CDN-cached.

Code and assets should be versioned independently.

---

# 154. LOADING STRATEGY

Initial download should contain only:

```
core engine
workroom
clinic hallway
first case

```

Other rooms stream when needed.

---

# 155. OFFLINE POSSIBILITY

Later the application could use service-worker caching for repeat educational use.

Not necessary initially.

---

# 156. ADMIN MODE

Faculty should have:

```
Case Editor
Patient Editor
Assessment Editor
Source Manager
Analytics
Version History
Publish

```

---

# 157. WORLD EDITOR

Eventually allow placement of:

- NPCs
- interactive objects
- triggers
- case entry points

without editing source code.

---

# 158. CASE VERSIONING

Cases need explicit versions.

Example:

```
HCM_SYNCOPE
Version 1.4
Reviewed 2026-08

```

Historical learner attempts retain the version used.

---

# 159. ERROR HANDLING

If AI conversation fails:

NPC falls back to structured response choices.

If 3D asset fails:

show placeholder.

If speech fails:

typed dialogue remains available.

No single cloud service should render a case unusable.

---

# 160. SYSTEM BOUNDARIES

The **deterministic engine** controls:

- patient truth
- physiology
- results
- case progression
- scoring
- clinical consequences

AI controls:

- natural language
- conversational variation
- Socratic discussion
- explanation generation

That separation is non-negotiable.

---

# 161. THE CRITICAL DESIGN RULE

Never allow an LLM to decide:

> What is this patient's potassium?

It retrieves:

```
K = 3.7

```

and says:

> "The potassium is 3.7."

Similarly, AI does not invent:

- history
- physical findings
- ECG
- echo
- diagnosis
- treatment response

---

# 162. WHAT MAKES THIS DIFFERENT

Most medical simulation software presents:

```
screen
question
answer
screen
question
answer

```

This system instead presents:

```
PERSON
   ↓
ROOM
   ↓
CONVERSATION
   ↓
EXAMINATION
   ↓
CLINICAL DECISION
   ↓
HOSPITAL ACTION
   ↓
CONSEQUENCE

```

---

# 163. THE REAL PRODUCT

The eventual product is not really:

> a pediatric cardiology simulator.

It is:

> **a reusable clinical-world engine capable of teaching medicine through immersive practice.**

Pediatric cardiology is simply the first curriculum built on it.

---

# 164. FUTURE SPECIALTIES

The exact same hospital could eventually support:

```
Pediatric emergency medicine
NICU
PICU
General pediatrics
Neurology
Pulmonology
Endocrinology
Infectious disease
Genetics

```

No new game engine would be required.

---

# 165. HIGHEST-VALUE TECHNICAL ARCHITECTURE

I would build the system around six independent engines:

```
1. WORLD ENGINE
   hospital, movement, interactions

2. CHARACTER ENGINE
   avatars, animation, navigation

3. CASE ENGINE
   patient truth and branching state

4. CLINICAL ENGINE
   examinations, tests, physiology

5. CONVERSATION ENGINE
   patient/family/staff AI

6. EDUCATION ENGINE
   assessment, tutoring, mastery

```

This separation prevents the codebase from collapsing into one enormous game component.

---

# 166. VERTICAL SLICE ACCEPTANCE TEST

The initial build is successful only if a learner can:

1. Load the application in Chrome.
2. Enter the 3D hospital.
3. Walk naturally through the cardiology unit.
4. Find the workroom.
5. Speak with the attending.
6. Receive a patient assignment.
7. Walk to the exam room.
8. Speak freely with patient and parent.
9. Obtain clinically relevant history.
10. Perform targeted examination.
11. Order an ECG.
12. Review the ECG.
13. Order/review echo when appropriate.
14. Return to the attending.
15. Explain their diagnosis and reasoning.
16. Choose management.
17. Receive detailed case-specific feedback.
18. Have performance recorded.
19. Begin another similar case without leaving the world.

If those nineteen things work well, the project has succeeded.

Everything beyond them is expansion.

---

# 167. RECOMMENDED FIRST BUILD

The first world should therefore be only:

```
               CARDIOLOGY WORKROOM
                       │
                       │
                CLINIC HALLWAY
                       │
       ┌───────────────┼───────────────┐
       │               │               │
     ROOM 1          ROOM 2          ROOM 3
       │
       ├──────── ECG ROOM
       │
       └──────── ECHO LAB

```

But it should feel **extremely polished**.

One convincing hallway and three excellent patient encounters are substantially more valuable than a mediocre eight-floor hospital.

---

# 168. FINAL PRODUCT VISION

Eventually the learner logs in and sees:

> **Pediatric Cardiology — Day 6**

They arrive in the hospital.

A nurse passes them in the hallway.

Their pager sounds.

> **NICU CONSULT — newborn with persistent cyanosis**

They take the elevator upstairs.

The infant has a saturation of 68%.

They speak with the neonatologist.

They examine the baby.

They inspect pre/postductal saturations.

They order an echocardiogram.

They walk into the echo room.

They identify parallel great arteries.

Their attending asks:

> Why is this child's survival dependent on mixing?

The learner activates a 3D anatomy visualization over the bedside.

They manipulate the circulation and see why.

The baby's saturation begins falling.

They must decide what to do.

Later that day they follow the child to the cath lab for balloon atrial septostomy.

The next morning they enter the OR and observe the arterial switch.

Several days later they see the same child recovering in the cardiac ICU.

**That is the target experience.**

Not a website containing 3D models.

Not a collection of cardiology quizzes.

Not a virtual museum.

A **persistent, explorable hospital where medicine actually happens**.
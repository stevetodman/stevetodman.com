# Pediatric Cardiology Education Coverage Map

Scope: content in this repository plus the two externally linked Steve Todman education properties. This is a planning map, not a claim that a topic is absent from every external curriculum.

## Current repository coverage

| Domain | Current surface | Modality |
|---|---|---|
| Newborn critical CHD screening | `/newbornscreen/` | Resident academy + quiz |
| Kawasaki disease | `/kawasaki/` | Resident academy + cases + quiz |
| Pediatric hypertension / ABPM | `/hypertension/`, `/tools/` | Academy + lab + calculator |
| Cardiovascular prevention / dyslipidemia | `/cardiovascular-risk/` | Academy + applied cases |
| Aortopathy | `/aortopathy/` | Academy + pathways + cases |
| Genetics of congenital heart disease | `/genetics-chd/` | Academy + workbench + cases |
| Myocarditis | `/myocarditis/` | Academy + cases + mastery |
| Pediatric resuscitation | `/pals/` | High-acuity cases + retrieval practice |
| Congenital heart surgery | `/pedcardsurg/` | Visual atlas + operative reasoning + mastery |
| Inpatient prioritization / handoff | `/phs/` | Deterministic simulation + debrief |
| Arrhythmias | `arrhythmias.stevetodman.com` | External quiz; not audited in this repository |
| General cardiology rotation curriculum | `curriculum.stevetodman.com` | External curriculum; not audited in this repository |

## Candidate gaps to evaluate before creating new modules

These are **planning candidates**, not an instruction to build them now:

- syncope evaluation;
- murmur evaluation and referral thresholds;
- ECG/QTc fundamentals;
- heart failure and cardiomyopathy;
- pulmonary hypertension;
- infective endocarditis;
- exercise / sports cardiology evaluation;
- core congenital lesion recognition and physiology;
- fetal cardiology fundamentals.

## Rule for new clinical content

Before starting a new academy:

1. confirm the objective is not already met by an existing repository or external module;
2. define the target learner and decisions the module should improve;
3. identify primary guidance/source documents before authoring;
4. add the module to `clinical/content-registry.json` and `site/catalog.json`;
5. add behavioral tests and smoke coverage before promotion to PRODUCTION;
6. record an actual review date only after review occurs.

The current priority is maintaining and integrating existing content, not increasing module count.

# Pediatric Myocarditis ABP Question Bank — Master Plan

**Target:** 500 discrete, evidence-grounded, ABP General Pediatrics–level questions with full answer explanations, production-grade delivery, and explicit human-review gates.

**Working branch:** `content/myocarditis-bank-v3-1`

**Rollback baseline:** v2.1.0-draft on `main`, commit `48ec73716642d9d381e5ca872d2349206e8d8408`.

**Operating rule:** Do not scale a flawed seed. The first 60 questions are the gold-standard template. The bank expands only after the 60-item seed passes medical-evidence, item-writing, duplication, distribution, and UI/engineering gates.

---

## 1. Definition of done

The project is complete only when all of the following are true:

1. **500 unique questions** exist with stable IDs `MYO-001` through `MYO-500`.
2. Every question has exactly five plausible answer options with stable semantic IDs.
3. Every question has one defensible single best answer.
4. Every option has an explanation that states why it is correct or incorrect and, when useful, when the distractor would become appropriate.
5. Every question has a discrete learning objective, board pearl, age group, domain, cognitive level, difficulty, and source mapping.
6. No question depends on an unsupported, fabricated, stale, or mismatched source.
7. Current US pediatric guidance is the default evidence anchor; adult/international sources are explicitly labeled overlays.
8. Time-sensitive recommendations are dated/source-scoped.
9. Question stems and distractors pass adversarial item-writing checks for cueing, absolutes, option-length bias, grammatical cueing, answer-position bias, and implausible distractors.
10. Duplicate and near-duplicate learning objectives are below the project threshold and manually reviewable.
11. Age, domain, cognitive-level, and difficulty distributions are intentionally balanced rather than accidental.
12. All JSON/schema tests pass.
13. Browser/UI tests pass, including answer concealment, stable-ID grading, option shuffling, retake reshuffling, and stack navigation.
14. Automated review never changes medical-review status to published.
15. Final bank remains marked `editorial-review-required` / `draft-medical-review` until independent pediatric cardiology and human item-writer review are documented.

---

## 2. Quality hierarchy

When tradeoffs occur, use this order:

1. Clinical accuracy and patient-safety implications
2. Coverage completeness
3. Question quality / discrimination
4. Low duplication
5. Current evidence fidelity
6. Engineering reliability
7. Production efficiency

A fast question that weakens any higher-ranked criterion is rejected.

---

## 3. Phase structure

### Phase 0 — Freeze and isolate

**Status: complete**

- Preserve deployed v2.1 on `main` as rollback.
- Create feature branch `content/myocarditis-bank-v3-1`.
- Do not replace production directly from the external v3 candidate.
- Treat external v3 files as editorial input, not authority.

**Gate:** branch exists from exact deployed baseline and production is untouched.

### Phase 1 — Evidence registry hardening

**Goal:** source registry must be more reliable than the question bank.

Actions:
- Verify every source identity, year, title, PMID/DOI when available, population, jurisdiction, and role.
- Restore/fix real sources incorrectly removed by editorial review.
- Add new authoritative sources published after the prior evidence cutoff.
- Mark adult/international sources as overlays rather than pediatric US primary guidance.
- Require every time-sensitive claim to resolve to at least one appropriate source.
- Add explicit evidence-strength language where observational associations could be misread as causal.

Immediate corrections:
- Retain `IVIG_PHIS_2026`; populate PMID `41850419` and DOI `10.1016/j.jpeds.2026.115065`.
- Retain `IVIG_META_2026`; preserve the limitation that high-quality randomized pediatric trials are still needed.
- Add the August 6, 2026 AHA scientific statement **Surviving Pediatric Cardiogenic Shock: Clinical Approach, Improving Outcomes, and Future Directions** as the current pediatric shock overlay.
- Re-check `PED_ARRHYTHMIA_OUTCOMES`, `AHA_FULMINANT_2020`, `ECMO_PED_OUTCOMES_2024`, `PED_DSP_2024`, and sports-return references for missing identifiers/metadata.

**Gate 1:** zero unresolved source IDs; no source known to be misidentified; no causal wording supported only by observational association.

### Phase 2 — Rebuild MYO-001..060 into v3.1 gold-standard seed

**Goal:** produce a 60-item reference set suitable for cloning at scale.

Actions:
- Keep the strongest v2.1 infrastructure and strongest v3 editorial improvements.
- Remove the systematic distractor cue identified in v2.1 (absolute/qualifier-heavy wrong answers).
- Reduce repeated meta-concept questions such as “one reassuring domain does not rule out another.”
- Add missing high-yield ABP content: ECG patterns, neonatal/infant myocarditis, mimics, electrical instability, prognosis, recovery, and evidence interpretation.
- Reject content that is too procedural/subspecialty-specific for ABP General Pediatrics unless the resident-level decision is the actual tested objective.
- Re-review all drug/vasoactive wording so physiology-guided options are not presented as universally superior where pediatric evidence does not establish superiority.
- Re-review myocarditis/pericarditis CMR language so edema/inflammation and LGE/injury/fibrosis are not treated as binary synonyms.
- Re-review chronic HF pharmacotherapy so sequencing is not more prescriptive than pediatric evidence supports.
- Require formal diagnostic criteria in stems when a diagnosis depends on them (e.g., acute rheumatic fever evidence of preceding GAS infection unless an accepted exception applies).

Priority item review list:
- `MYO-005`, `010`, `014`, `019`, `020`, `021`, `022`, `023`, `025`, `033`, `037`, `038`, `040`, `041`, `043`, `047`, `048`, `051`, `053`, `056`, `058`, `059`, `060`.

**Gate 2:** all 60 pass medical-source audit, item-writing audit, duplication audit, and distribution audit.

### Phase 3 — Upgrade automated adversarial QA

Add tests for:
- qualifier/absolute-word imbalance between keys and distractors;
- option-length bias;
- repeated key phrase leakage from stem to correct answer;
- grammatical cueing;
- correct-answer positional balance after shuffling simulation;
- duplicate normalized learning objectives;
- semantic near-duplicate stems/concepts;
- overrepresented concept families;
- age distribution, including a deliberate infant/neonatal floor;
- cognitive-level and difficulty tolerances;
- missing/unused source IDs;
- source metadata completeness;
- adult-source claims presented without overlay labeling;
- numerical/timing claims without evidence mappings;
- overly procedural targets inconsistent with the general-pediatrics audience.

**Gate 3:** all static tests pass locally and in GitHub Actions.

### Phase 4 — UI and delivery hardening

Preserve and extend existing browser tests:
- exam mode hides grading metadata;
- grade action disabled until completion;
- stable semantic IDs determine correctness;
- display letters are assigned only after shuffle;
- explanations/pearls/evidence appear after grading;
- retake reshuffles;
- next-stack navigation works;
- 500-item manifest/stack discovery remains performant;
- no client-side assumption depends on canonical answer letters.

**Gate 4:** browser suite passes against the complete seed and again against the 500-item bank.

### Phase 5 — Build the 500-question blueprint before writing the remaining 440

Create a coverage ledger for all 500 slots before authoring them.

Required dimensions:
- presentation/recognition;
- differential diagnosis/mimics;
- ECG/rhythm;
- biomarkers/laboratory testing;
- echocardiography;
- CMR;
- EMB/pathology;
- etiology/infectious/systemic causes;
- acute HF;
- cardiogenic shock;
- arrhythmia/bradycardia/arrest;
- MCS/transfer/disposition at resident level;
- immunotherapy/evidence interpretation;
- neonatal/infant disease;
- adolescent/vaccine-associated disease;
- genetics/cardiomyopathy overlap;
- recovery/follow-up;
- exercise/sports;
- prognosis/recurrence;
- integrated multi-step cases.

Each slot is assigned:
- concept ID;
- learning objective;
- age band;
- cognitive level;
- difficulty;
- primary evidence family;
- intended distractor family;
- “do not duplicate” neighbor concepts.

**Gate 5:** 500-slot blueprint has no obvious coverage holes or redundant clusters before bulk writing begins.

### Phase 6 — Author MYO-061..500 in gated blocks

Use **44 additional 10-question stacks** rather than one large generation event.

For each stack:
1. Draft 10 questions from preassigned blueprint slots.
2. Medical-source check.
3. Independent adversarial item-writing critique.
4. Rewrite failures.
5. Duplicate/near-duplicate scan against all prior accepted items.
6. Distribution check.
7. Schema validation.
8. Browser smoke test after integration.
9. Only then advance to the next stack.

No stack advances merely because JSON is syntactically valid.

**Gate 6:** every 10-question stack individually passes before being added to the cumulative bank.

### Phase 7 — Whole-bank adversarial review

Run bank-level attacks:
- Can a test-taker exploit wording style rather than knowledge?
- Are correct answers longer or more qualified?
- Are some domains disproportionately represented?
- Are “always/never/solely” distractors concentrated in wrong answers?
- Are there repeated patient stories with superficial changes?
- Are multiple items answerable from one memorized meta-rule?
- Do management questions overstate weak pediatric evidence?
- Do adult data silently become pediatric standards?
- Are current 2026 statements actually represented where relevant?
- Are neonatal/infant presentations sufficiently represented?
- Are any board questions testing fellowship-level procedural minutiae instead of resident decisions?

**Gate 7:** zero critical findings; major findings corrected; residual minor findings logged.

### Phase 8 — Release candidate

Produce:
- final `manifest.json` with `question_count: 500` and `stack_count: 50`;
- 50 stack JSON files;
- hardened `sources.json`;
- updated README;
- changelog;
- automated QA report;
- coverage report;
- explicit review-status statement.

Create a draft PR to `main` with all test results and known limitations.

**Gate 8:** CI green; no unresolved critical medical/editorial defects; independent human medical/item-writer review still explicitly required before any “published” status.

---

## 4. Seed-bank acceptance metrics

These are engineering/editorial gates, not claims of psychometric validation.

- 60/60 IDs sequential and unique.
- 5/5 options present for every question.
- 100% option explanations present.
- 100% evidence IDs resolve.
- 0 unsupported source identities.
- 0 known fabricated citations.
- 0 exact duplicate learning objectives.
- 0 throwaway distractors.
- Qualifier/absolute language must not materially predict the wrong answer.
- Correct-option text length must not systematically identify the key.
- General-pediatrics decisions must dominate over advanced procedural trivia.
- Age mix must intentionally include neonatal/infant disease; target for v3.1 seed: at least 8 questions under 12 months, with at least 2 neonatal presentations if clinically justified by the blueprint.
- Cognitive and difficulty mix may deviate from targets only when documented and intentional.

---

## 5. Evidence rules for authoring

1. A source can support only claims within its actual population and scope.
2. Adult guidance may inform physiology but cannot be silently presented as pediatric standard of care.
3. Observational treatment associations must remain associations.
4. Absence of pediatric RCTs must be stated when it materially limits a treatment conclusion.
5. Current AHA/AAP pediatric resuscitation guidance supersedes older resuscitation wording where applicable.
6. The August 2026 AHA pediatric cardiogenic-shock statement must be incorporated into shock recognition/phenotyping concepts written after its publication.
7. Numerical thresholds, timing intervals, doses/energy, and named treatment sequences require explicit source support.
8. Where evidence is heterogeneous, write the question around the robust decision principle rather than force a false single-drug certainty.

---

## 6. Current known defects to close before scale-up

- Candidate v3 mistakenly treated a real 2026 PHIS IVIG study as unverifiable.
- Live v2.1 source record for that study lacks PMID/DOI.
- Both v2.1 and candidate v3 predate incorporation of the August 6, 2026 AHA pediatric cardiogenic-shock statement.
- Candidate v3 has no supplied `stack-04.json`, so it is not a complete drop-in replacement as delivered.
- Candidate v3 improves distractor construction but contains several medical/editorial items that need re-review before deployment.
- Seed age distribution is too heavily weighted toward older children/adolescents.
- Seed content overuses a “reassuring test does not exclude disease” meta-principle.
- Source metadata is incomplete for several references.

---

## 7. Release policy

- Automated success permits **integration**, not publication.
- AI review permits **draft advancement**, not medical sign-off.
- Production deployment must preserve visible `editorial-review-required` status until independent review is documented.
- Any future evidence update that changes a keyed answer triggers re-review of that question and its close conceptual neighbors.

---

## 8. Execution log

- **2026-08-21:** Phase 0 completed. Production v2.1 preserved; `content/myocarditis-bank-v3-1` created from deployed baseline.
- **2026-08-21:** Phase 1 started. Verified 2026 PHIS IVIG study is real (PMID 41850419; DOI 10.1016/j.jpeds.2026.115065). Identified August 6, 2026 AHA pediatric cardiogenic-shock statement as a missing current source.

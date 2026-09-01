# Pediatric Hypertriglyceridemia Decision Tool — source review record

Review date: 2026-09-01

## Evidence boundary

This is an AI-assisted, source-locked implementation review. The project owner supplied the 2026 American Heart Association scientific statement and explicitly designated that statement as the primary source of truth for this tool. This record does **not** claim independent clinician certification, institutional governance approval, or a separate human clinical sign-off.

Primary source:

Peterson AL, Ashraf AP, Bachman J, et al. *Screening, Diagnosis, and Management of Pediatric Hypertriglyceridemia: A Scientific Statement From the American Heart Association.* Arterioscler Thromb Vasc Biol. 2026;46:e000195. doi:10.1161/ATV.0000000000000195.

No other guideline is allowed to override the runtime decision logic in this implementation.

## Implemented source hierarchy

1. Table 1 controls fasting triglyceride severity classification and range-specific lifestyle/pharmacotherapy considerations.
2. Figure 3 controls screening-to-fasting workflow, laboratory/referral branches, and follow-up intervals.
3. Table 3 supplies the secondary-cause checklist.
4. Narrative text expands abbreviated details and clarifies specialist/pharmacotherapy context.

## Clinical rules implemented

- Fasting TG categories: acceptable ≤130 mg/dL; mildly elevated 131–400; moderately elevated 401–885; severely elevated 886–2000; very severely elevated >2000.
- Figure 3 nonfasting triggers: non–HDL-C ≥145 mg/dL or nonfasting TG ≥200 mg/dL → fasting lipid panel pathway.
- Narrative fasting-panel consideration: HDL-C <40 mg/dL.
- Treatment decisions are presented from fasting TG classification.
- Secondary-cause evaluation is surfaced for hypertriglyceridemia and uses the Table 3 cause groups.
- Mild branch: lifestyle targets and 6–12 month fasting-lipid follow-up; if normalized, Figure 3 shows 1–2 year repeat.
- Moderate branch: lifestyle targets, pancreatitis-risk discussion, lipid-specialist consideration, and 3–6 month fasting-lipid follow-up; if normalized, Figure 3 shows 6 month repeat.
- Mild/moderate statin consideration is gated on age ≥8 years, non–HDL-C ≥145 mg/dL, and persistence despite lifestyle changes.
- Moderate fenofibrate/omega-3 consideration is gated on a lifestyle trial/persistence and displayed with specialist involvement.
- Severe/very severe branches surface dietitian referral, pediatric lipid-specialist referral, TSH/ALT/HbA1c evaluation, consideration of genetic testing, and pancreatitis-risk counseling.
- In the severe/very severe branch, pancreatitis symptoms expose Figure 3 laboratory items: amylase, CMP, CBC, GGT, and calcium.
- No medication doses are generated.

## Internal statement discrepancies handled explicitly

- Figure 3 labels the acceptable TG branch as <130 mg/dL, whereas Table 1 defines acceptable as ≤130 mg/dL. The tool uses Table 1 for classification.
- Figure 3 displays a mild-branch sugar target of <6% kcal, whereas Table 1 lists <5% of calories. The tool uses Table 1 for the lifestyle target.

These discrepancies are shown in the tool's Source + implementation tab rather than silently reconciled.

## Software verification

`tests/pediatric-hypertriglyceridemia.test.mjs` includes deterministic checks for:

- all Table 1 category boundaries (130/131, 400/401, 885/886, 2000/>2000);
- non–HDL-C calculation validation;
- Figure 3 nonfasting triggers and narrative HDL trigger;
- age/non–HDL/persistence gating of the statin-consideration branch;
- moderate lifestyle/specialist/pharmacotherapy branch;
- severe and very severe pancreatitis/specialist/laboratory behavior.

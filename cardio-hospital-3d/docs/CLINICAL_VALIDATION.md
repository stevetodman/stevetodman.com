# Pediatric Hospital — Clinical Validation Gate

Last reviewed: 2026-09-03

This document prevents technically successful migration from silently preserving outdated or overconfident medical teaching. The unified app must not merge to production until the clinical-content items below are reconciled deliberately.

## Current primary reference

Ommen SR, Ho CY, Asif IM, et al. **2024 AHA/ACC/AMSSM/HRS/PACES/SCMR Guideline for the Management of Hypertrophic Cardiomyopathy.** J Am Coll Cardiol. 2024;83(23):2324-2405. Circulation. 2024. The AHA guideline hub lists this guideline as current/reaffirmed.

## HCM vertical-slice findings

### 1. Sports teaching needs modernization

The current `case-hcm` text says to "Restrict from competitive sports immediately" and its teaching point can read as a blanket HCM sports prohibition. The 2024 multisociety guideline explicitly rejects universal restriction from vigorous activity or competitive sports for all HCM patients. Competitive participation may be considered after comprehensive expert evaluation and shared decision-making.

**Migration requirement:** distinguish the immediate safety decision for a symptomatic adolescent with unexplained mid-exertional syncope from long-term sports eligibility after HCM evaluation. The simulation may appropriately remove this patient from competition while urgent evaluation is completed, but the debrief must not teach that every patient with HCM is permanently disqualified.

### 2. Cardiac MRI cannot be globally scored as an unnecessary HCM test

The current `case-hcm` lists `Cardiac MRI` under `unnecessaryTests`. Contemporary guidance gives CMR an important role when diagnosis is uncertain and, in children/adolescents with HCM, when sudden-death risk or an ICD decision remains uncertain; late gadolinium enhancement can contribute to pediatric risk stratification.

**Migration requirement:** remove the blanket efficiency penalty for CMR in the HCM case. The scenario can still teach sequencing and timing, but not that CMR is categorically unnecessary.

### 3. Pediatric sudden-death risk assessment must be explicitly pediatric

The 2024 guideline emphasizes that pediatric SCD risk factors have different weights than adult factors and that children/adolescents require age/body-size-aware assessment. For patients younger than 16 years, a validated 5-year pediatric risk estimate using echocardiographic parameters and genotype may be useful in shared ICD decision-making. Ambulatory ECG monitoring is also part of systematic SCD risk assessment.

**Migration requirement:** do not teach absolute wall thickness alone as a complete pediatric severity/risk classification. Preserve the synthetic 22-mm measurement if desired, but pair pediatric interpretation with body-size-aware risk assessment rather than an adult-style binary threshold. Add ambulatory rhythm assessment to the post-diagnosis risk-stratification pathway.

### 4. ICD teaching must be shared-decision and risk-stratification based

The current management item "Refer for electrophysiology / ICD evaluation" is directionally reasonable for this high-risk patient, but the final teaching should not imply automatic ICD implantation from this encounter alone. In children with HCM and conventional risk factors, ICD placement can be reasonable after comprehensive risk assessment while accounting for the relatively high long-term device complication burden in younger patients.

**Migration requirement:** phrase this as referral to pediatric HCM/EP expertise for SCD risk stratification and shared ICD decision-making.

### 5. Diagnostic framing is too absolute before testing

The current teaching phrase "HCM until proven otherwise" overstates diagnostic certainty. Mid-exertional syncope without prodrome plus a family history of premature sudden death is a high-risk cardiac presentation and should trigger urgent structural/arrhythmic evaluation; it is not itself diagnostic of HCM.

**Migration requirement:** teach "high-risk cardiac syncope requiring urgent evaluation for HCM and other arrhythmic/structural causes" until the case's ECG/echo data establish HCM.

## Content-change discipline

- Technical parity work may continue on the isolated branch.
- Do not merge the HCM clinical teaching to production until the items above are corrected and physician-reviewed.
- Make clinical-content corrections in dedicated commits separate from engineering refactors.
- Do not use a clinical-content correction as an excuse to invent new patient-specific data that are absent from the synthetic case definition.
- Re-run the same validation process for each additional case before that case becomes part of the unified production experience.

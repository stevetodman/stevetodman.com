(() => {
  'use strict';

  const freeze = (value) => Object.freeze(value);
  const EVIDENCE_VERSION = '0.2-m1a';

  const sourceLock = freeze({
    status: 'M1B_PENDING_PRIMARY_SOURCE',
    checkedOn: '2026-09-04',
    title: 'Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients',
    identifier: 's00246-026-04444-4 / DOI candidate 10.1007/s00246-026-04444-4',
    statement: 'The exact 2026 full text and supplement are not source-locked in this build. No numeric result, threshold, effect estimate, or model weight from that paper is encoded.',
  });

  const sources = freeze({
    fan2023: freeze({
      short: 'Fan et al., Hospital Pediatrics 2023',
      citation: 'Fan LK, et al. Distinguishing Incomplete Kawasaki and Nonsevere Multisystem Inflammatory Syndrome in Children. Hosp Pediatr. 2023;13(10):e280-e284. doi:10.1542/hpeds.2022-007107.',
      population: '68 non-severe MIS-C patients meeting the 2023 MIS-C definition vs 28 prepandemic iKD patients meeting AHA iKD criteria; ICU care and coronary abnormalities were excluded from both cohorts.',
      design: 'Single-system retrospective cohort; iKD comparator was prepandemic.',
    }),
    aha2024: freeze({
      short: 'AHA Kawasaki Disease scientific statement 2024',
      citation: 'Jone PN, Tremoulet A, Choueiter N, et al. Update on Diagnosis and Management of Kawasaki Disease. Circulation. 2024;150:e481-e500. doi:10.1161/CIR.0000000000001295.',
      population: 'Kawasaki disease diagnostic and management framework.',
      design: 'Scientific statement; not an iKD-vs-MIS-C prediction model.',
    }),
    cdc2023: freeze({
      short: 'CSTE/CDC MIS-C surveillance definition, effective 2023',
      citation: 'Melgar M, Lee EH, Miller AD, et al. CSTE/CDC Surveillance Case Definition for MIS-C Associated With SARS-CoV-2 Infection — United States. MMWR Recomm Rep. 2022;71(4):1-14. doi:10.15585/mmwr.rr7104a1.',
      population: 'Public-health surveillance for persons younger than 21 years.',
      design: 'Surveillance case definition; not individual diagnostic criteria.',
    }),
    walton2023: freeze({
      short: 'Walton et al., Pediatric Cardiology 2023',
      citation: 'Walton M, et al. Cardiac Biomarkers Aid in Differentiation of Kawasaki Disease from Multisystem Inflammatory Syndrome in Children Associated with COVID-19. Pediatr Cardiol. 2023.',
      population: 'International Kawasaki Disease Registry; 118 KD vs 946 MIS-C patients with biomarker and echocardiographic data.',
      design: 'Contemporaneous observational comparison; thresholds are cohort-, timing-, assay-, and unit-dependent.',
    }),
    lee2025: freeze({
      short: 'Lee et al., Journal of the American Heart Association 2025',
      citation: 'Lee S, et al. Spectrum of Coronary Artery Involvement With Multisystem Inflammatory Syndrome in Children Versus Kawasaki Disease. J Am Heart Assoc. 2025.',
      population: 'International Kawasaki Disease Registry; 1,191 MIS-C vs 554 contemporaneous KD patients.',
      design: 'Contemporaneous observational registry comparison; KD cohort was not restricted to incomplete KD.',
    }),
    starnes2024: freeze({
      short: 'Starnes et al., Journal of Hospital Medicine 2024',
      citation: 'Starnes LS, et al. Clinical prediction model: Multisystem inflammatory syndrome in children versus Kawasaki disease. J Hosp Med. 2024.',
      population: '105 MIS-C vs 602 complete/incomplete KD patients.',
      design: 'Prediction model with internal bootstrap validation; external validation required.',
    }),
    lippi2024: freeze({
      short: 'Lippi et al., Diagnosis 2024',
      citation: 'Lippi G, et al. Diagnostic value of D-dimer in differentiating MIS-C from Kawasaki disease: systematic literature review and meta-analysis. Diagnosis (Berl). 2024.',
      population: 'Three multicenter cohorts; 270 MIS-C and 217 KD patients.',
      design: 'Meta-analysis; harmonized diagnostic thresholds were not established.',
    }),
  });

  const item = (value) => freeze(value);

  const evidence = freeze([
    item({
      id: 'fan-platelet150', input: 'platelet150', direction: 'misc', tier: 'Near-exact phenotype', title: 'Platelet count <150,000/µL',
      effect: 'Fan cohort: 27/68 (40%) non-severe MIS-C vs 0/28 (0%) iKD; P<.001.',
      claim: 'Thrombocytopenia at this exact threshold was substantially more frequent in non-severe MIS-C than iKD in the near-exact phenotype cohort.',
      sourceKey: 'fan2023',
      limitation: 'Retrospective single-system study with a prepandemic iKD comparator; this is an association, not a rule-in threshold.'
    }),
    item({
      id: 'fan-alc1000', input: 'alc1000', direction: 'misc', tier: 'Near-exact phenotype', title: 'ALC <1,000/µL',
      effect: 'Fan cohort: 29/68 (43%) non-severe MIS-C vs 5/28 (18%) iKD; P=.021.',
      claim: 'Lymphopenia at this exact threshold was more frequent in non-severe MIS-C than iKD.',
      sourceKey: 'fan2023',
      limitation: 'Association only; timing of the CBC and patient context matter.'
    }),
    item({
      id: 'fan-pyuria10', input: 'pyuria10', direction: 'kd', tier: 'Near-exact phenotype', title: 'Urine WBC >10/HPF',
      effect: 'Fan cohort with documented urinalysis: 12/60 (20%) non-severe MIS-C vs 14/23 (61%) iKD; P<.001.',
      claim: 'Pyuria at the study threshold was more frequent in iKD than non-severe MIS-C.',
      sourceKey: 'fan2023',
      limitation: 'Urinalysis was not available for every patient; pyuria is nonspecific and urinary infection/collection context still matters.'
    }),
    item({
      id: 'fan-wbc15000', input: 'wbc15000', direction: 'kd', tier: 'Near-exact phenotype', title: 'Highest WBC ≥15,000/mm³ before treatment',
      effect: 'Fan cohort: 3/68 (4%) non-severe MIS-C vs 11/28 (39%) iKD; P<.001.',
      claim: 'Leukocytosis at this study threshold was more frequent in iKD.',
      sourceKey: 'fan2023',
      limitation: 'The study used the highest WBC before treatment; do not substitute a differently timed value without clinical judgment.'
    }),
    item({
      id: 'fan-lvef55', input: 'lvef-low', direction: 'misc', tier: 'Near-exact phenotype', title: 'LVEF <55%',
      effect: 'Fan cohort: 15/68 (22%) non-severe MIS-C vs 1/28 (3.6%) iKD; P=.034.',
      claim: 'Reduced LVEF was more frequent in non-severe MIS-C despite exclusion of ICU-level disease.',
      sourceKey: 'fan2023',
      limitation: 'Small number of events and retrospective design; reduced LVEF can occur in KD.'
    }),
    item({
      id: 'starnes-lvef55', input: 'lvef-low', direction: 'misc', tier: 'Prediction-model support', title: 'Reduced LVEF',
      effect: 'Reduced LVEF was retained in the published Starnes MIS-C-versus-KD model.',
      claim: 'The same cardiac direction is supported in a larger, broader MIS-C-vs-KD prediction cohort.',
      sourceKey: 'starnes2024',
      limitation: 'Broader phenotype than the target use case; model requires external validation and is not calculated here.'
    }),
    item({
      id: 'fan-oral', input: 'oral', direction: 'kd', tier: 'Near-exact phenotype', title: 'Oral / lip changes',
      effect: 'Fan cohort: 24/68 (35%) non-severe MIS-C vs 18/28 (64%) iKD; P=.009.',
      claim: 'Oral mucosal changes were more frequent in iKD in the near-exact phenotype cohort.',
      sourceKey: 'fan2023',
      limitation: 'Clinical ascertainment may vary; oral changes can occur in MIS-C.'
    }),
    item({
      id: 'fan-rash', input: 'rash', direction: 'kd', tier: 'Near-exact phenotype', title: 'Polymorphous rash',
      effect: 'Fan cohort: 38/68 (56%) non-severe MIS-C vs 23/28 (82%) iKD; P=.015.',
      claim: 'Rash was more frequent in iKD in the near-exact phenotype cohort.',
      sourceKey: 'fan2023',
      limitation: 'Rash remains common in MIS-C and does not exclude it.'
    }),
    item({
      id: 'fan-gi-overlap', input: 'gi', direction: 'context', tier: 'Near-exact phenotype — non-discriminating', title: 'Gastrointestinal symptoms',
      effect: 'Fan cohort: 62/68 (91.2%) non-severe MIS-C vs 22/28 (78.6%) iKD; P=.102.',
      claim: 'GI symptoms were common in both groups and were not statistically discriminating in this near-exact cohort, despite a broader literature signal toward MIS-C.',
      sourceKey: 'fan2023',
      limitation: 'Do not use GI symptoms alone as a directional iKD-vs-non-severe-MIS-C discriminator.'
    }),
    item({
      id: 'lee-coronary', input: 'coronary-aneurysm', direction: 'kd', tier: 'Contemporaneous IKDR', title: 'Coronary aneurysm / max Z ≥2.5',
      effect: 'IKDR: coronary aneurysm 16% in MIS-C vs 25% in KD; medium/large aneurysm 1.2% vs 9.6%, respectively.',
      claim: 'Coronary aneurysm was less prevalent and less severe in contemporaneous MIS-C than KD.',
      sourceKey: 'lee2025',
      limitation: 'Coronary aneurysm occurred in MIS-C; this finding does not exclude MIS-C. KD comparator was not restricted to incomplete KD.'
    }),
    item({
      id: 'walton-ntprobnp', input: 'ntprobnp', direction: 'misc', tier: 'Contemporaneous IKDR', title: 'NT-proBNP ≥1500 ng/L',
      effect: 'Reported specificity for MIS-C versus KD: 77% in the study cohort.',
      claim: 'This presentation threshold was associated with MIS-C versus KD in contemporaneous IKDR data.',
      sourceKey: 'walton2023',
      limitation: 'Not a universal diagnostic cutoff. Confirm assay, units, timing, renal context, and laboratory method.'
    }),
    item({
      id: 'walton-tni', input: 'troponin-i', direction: 'misc', tier: 'Contemporaneous IKDR', title: 'Troponin I ≥20 ng/L',
      effect: 'Reported specificity for MIS-C versus KD: 89% in the study cohort.',
      claim: 'This presentation threshold was associated with MIS-C versus KD in contemporaneous IKDR data.',
      sourceKey: 'walton2023',
      limitation: 'Not a universal diagnostic cutoff. Troponin assay, units, timing, and myocardial injury context matter.'
    }),
    item({
      id: 'lippi-ddimer', input: 'ddimer', direction: 'misc', tier: 'Adjacent meta-analysis', title: 'Marked D-dimer elevation by local context',
      effect: 'Across three multicenter cohorts, D-dimer was higher in MIS-C than KD; no harmonized discriminator threshold was established.',
      claim: 'Marked D-dimer elevation can add directional context toward MIS-C, but the application deliberately encodes no numeric cutoff.',
      sourceKey: 'lippi2024',
      limitation: 'Qualitative input only; assay and reporting units vary and the evidence is not specific to non-severe MIS-C versus confirmed iKD.'
    }),

    item({ id: 'aha-rash', input: 'rash', direction: 'context', tier: 'Guideline phenotype', title: 'Polymorphous rash', effect: 'Principal Kawasaki phenotype feature.', claim: 'Part of the KD phenotype framework and also seen in MIS-C.', sourceKey: 'aha2024', limitation: 'The application does not count KD criteria or diagnose complete/incomplete KD.' }),
    item({ id: 'aha-conjunctivitis', input: 'conjunctivitis', direction: 'context', tier: 'Guideline phenotype', title: 'Bilateral non-exudative conjunctival injection', effect: 'Principal Kawasaki phenotype feature.', claim: 'Part of the KD phenotype framework and also seen in MIS-C.', sourceKey: 'aha2024', limitation: 'The application does not count KD criteria.' }),
    item({ id: 'aha-oral', input: 'oral', direction: 'context', tier: 'Guideline phenotype', title: 'Oral / lip changes', effect: 'Principal Kawasaki phenotype feature.', claim: 'Part of the KD phenotype framework and also seen in MIS-C.', sourceKey: 'aha2024', limitation: 'The application does not count KD criteria.' }),
    item({ id: 'aha-extremity', input: 'extremity', direction: 'context', tier: 'Guideline phenotype', title: 'Extremity changes', effect: 'Principal Kawasaki phenotype feature.', claim: 'Part of the KD phenotype framework.', sourceKey: 'aha2024', limitation: 'The application does not count KD criteria.' }),
    item({ id: 'aha-nodes', input: 'nodes', direction: 'context', tier: 'Guideline phenotype', title: 'Cervical lymphadenopathy', effect: 'Principal Kawasaki phenotype feature.', claim: 'Part of the KD phenotype framework.', sourceKey: 'aha2024', limitation: 'The application does not count KD criteria.' }),

    item({ id: 'cdc-hospitalized', input: 'hospitalized', direction: 'context', tier: 'Surveillance context', title: 'Hospitalization', effect: 'Hospitalization or death is part of the current surveillance clinical criteria.', claim: 'Displayed as public-health surveillance context only.', sourceKey: 'cdc2023', limitation: 'Surveillance definition — not diagnostic criteria.' }),
    item({ id: 'cdc-crp', input: 'crp3', direction: 'context', tier: 'Surveillance context', title: 'CRP ≥3.0 mg/dL (30 mg/L)', effect: 'Systemic-inflammation threshold in the current surveillance definition.', claim: 'This threshold is shown only as a surveillance component.', sourceKey: 'cdc2023', limitation: 'Not an iKD-vs-MIS-C diagnostic cutoff.' }),
    item({ id: 'fan-crp-overlap', input: 'crp3', direction: 'context', tier: 'Near-exact phenotype — non-discriminating', title: 'CRP overlap', effect: 'Fan cohort median CRP: 12.5 mg/dL in non-severe MIS-C vs 10.9 mg/dL in iKD; P=.162.', claim: 'CRP magnitude did not significantly distinguish the two groups in this cohort.', sourceKey: 'fan2023', limitation: 'A high CRP supports systemic inflammation but should not be treated as a discriminator between these two phenotypes.' }),
    item({ id: 'cdc-sarscov2', input: 'sarscov2', direction: 'context', tier: 'Surveillance context', title: 'SARS-CoV-2 laboratory / epidemiologic evidence', effect: 'Qualifying laboratory evidence or epidemiologic linkage is part of surveillance classification.', claim: 'Displayed as context only.', sourceKey: 'cdc2023', limitation: 'Background seroprevalence and prior infection can reduce discriminatory value; surveillance evidence is not diagnostic proof.' }),
    item({ id: 'cdc-shock', input: 'shock', direction: 'context', tier: 'Surveillance context', title: 'Shock', effect: 'Shock is a distinct surveillance organ-system category.', claim: 'Displayed individually without organ-category counting.', sourceKey: 'cdc2023', limitation: 'This tool targets non-severe MIS-C; shock should prompt reconsideration of whether the target phenotype applies.' }),
    item({ id: 'cdc-platelet', input: 'platelet150', direction: 'context', tier: 'Surveillance context', title: 'Platelet count <150,000/µL', effect: 'One hematologic component of the current surveillance definition.', claim: 'The same raw finding is shown separately from its Fan comparative association.', sourceKey: 'cdc2023', limitation: 'The application does not determine whether the surveillance definition is met.' }),
    item({ id: 'cdc-alc', input: 'alc1000', direction: 'context', tier: 'Surveillance context', title: 'ALC <1,000/µL', effect: 'One hematologic component of the current surveillance definition.', claim: 'The same raw finding is shown separately from its Fan comparative association.', sourceKey: 'cdc2023', limitation: 'The application does not determine whether the surveillance definition is met.' }),
  ]);

  const studySignals = freeze([
    item({ title: 'Age', direction: 'MIS-C-associated at group level', detail: 'Median 8 years (IQR 5-10) in non-severe MIS-C vs 4 years (IQR 2-7.25) in iKD; P<.001.', whyNoInput: 'No validated age cutoff was derived from this comparison, so the workbench does not turn age into a threshold.' }),
    item({ title: 'Fever before treatment', direction: 'Longer in iKD at group level', detail: 'Median 6 days (IQR 5-7) in non-severe MIS-C vs 8 days (IQR 5-10) in iKD; P<.001.', whyNoInput: 'Treatment timing is not encoded as a diagnostic cutoff.' }),
    item({ title: 'Highest WBC before treatment', direction: 'Higher in iKD at group level', detail: 'Median 9.07 vs 13.3 ×10³/µL; P<.001. The exact ≥15,000/mm³ binary finding is separately available above.', whyNoInput: 'Continuous values are not discretized beyond a directly published threshold.' }),
    item({ title: 'ANC', direction: 'Higher in iKD at group level', detail: 'Median 6.66 vs 9.39 ×10³/mm³; P<.001.', whyNoInput: 'No validated bedside ANC cutoff was established in the study.' }),
    item({ title: 'CRP', direction: 'Overlap / non-discriminating in Fan cohort', detail: 'Median 12.5 vs 10.9 mg/dL; P=.162.', whyNoInput: 'High inflammation is common to both syndromes.' }),
    item({ title: 'ALT', direction: 'Overlap / non-discriminating in Fan cohort', detail: 'Median 35 vs 72 U/L; P=.306; ALT ≥45 U/L: P=.167.', whyNoInput: 'No directional threshold is encoded.' }),
    item({ title: 'Albumin', direction: 'Overlap / non-discriminating in Fan cohort', detail: 'Median 3.10 vs 3.00 g/dL; P=.443; albumin ≤3 g/dL: P=.562.', whyNoInput: 'No directional threshold is encoded.' }),
    item({ title: 'GI symptoms', direction: 'Common in both groups', detail: '91.2% vs 78.6%; P=.102.', whyNoInput: 'Shown as overlap/context rather than directional evidence in the near-exact cohort.' }),
  ]);

  const excludedFromBedsideEncoding = freeze([
    'Race and ethnicity differences are not encoded as diagnostic inputs because transportability, social/epidemiologic confounding, and risk of bias make bedside weighting inappropriate without validated modeling.',
    'Treatment received is not used as a diagnostic predictor because it occurs downstream of clinician judgment and can introduce incorporation bias.',
    'The prior Godfred-Cato likelihood score is not reproduced: in the Fan near-exact phenotype cohort it correctly classified only 71%-74% of cases and was inconclusive or discordant in more than one quarter.',
  ]);

  window.KDMiscEvidence = freeze({ EVIDENCE_VERSION, sourceLock, sources, evidence, studySignals, excludedFromBedsideEncoding });
})();
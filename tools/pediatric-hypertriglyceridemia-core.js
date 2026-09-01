export const SOURCE = Object.freeze({
  title: 'Screening, Diagnosis, and Management of Pediatric Hypertriglyceridemia: A Scientific Statement From the American Heart Association',
  citation: 'Peterson AL, Ashraf AP, Bachman J, et al. Arterioscler Thromb Vasc Biol. 2026;46:e000195.',
  doi: '10.1161/ATV.0000000000000195',
  reviewed: '2026-09-01',
  sourceOfTruth: true,
});

export const TG_BANDS = Object.freeze([
  Object.freeze({
    id: 'acceptable',
    label: 'Acceptable',
    min: 0,
    max: 130,
    rangeLabel: '≤130 mg/dL',
    lipoprotein: 'VLDL',
    goal: 'Prevent ASCVD',
    tone: 'good',
    lifestyle: [
      'Promote routine healthy behaviors.',
      'Reduce sugar and refined carbohydrates, especially sugar-sweetened beverages.',
    ],
    pharmacotherapy: ['No pharmacotherapy needed.'],
    followUp: 'Repeat lipid panel in 5 years (Figure 3).',
  }),
  Object.freeze({
    id: 'mild',
    label: 'Mildly elevated',
    min: 131,
    max: 400,
    rangeLabel: '131–400 mg/dL',
    lipoprotein: 'VLDL',
    goal: 'Prevent ASCVD',
    tone: 'watch',
    lifestyle: [
      'Engage in moderate-to-vigorous physical activity.',
      'Manage overweight or obesity when present.',
      'Reduce sugar to <5% of calories and reduce refined carbohydrates, especially sugar-sweetened beverages.',
      'Reduce dietary fat to 25%–30% of daily kcal.',
      'Discuss ASCVD risk.',
    ],
    pharmacotherapy: [
      'Pharmacotherapy is generally not needed.',
      'If non–HDL-C is persistently ≥145 mg/dL despite lifestyle changes, statin therapy may be considered in youth ≥8 years of age.',
    ],
    followUp: 'Repeat fasting lipid panel in 6–12 months; if normalized, Figure 3 shows repeat in 1–2 years.',
  }),
  Object.freeze({
    id: 'moderate',
    label: 'Moderately elevated',
    min: 401,
    max: 885,
    rangeLabel: '401–885 mg/dL',
    lipoprotein: 'VLDL',
    goal: 'Prevent ASCVD',
    tone: 'caution',
    lifestyle: [
      'Engage in moderate-to-vigorous physical activity.',
      'Manage overweight or obesity when present.',
      'Reduce sugar to <5% of kcal and reduce refined carbohydrates, especially sugar-sweetened beverages.',
      'Reduce dietary fat to 20%–25% of total kcal.',
      'Discuss ASCVD and pancreatitis risk.',
    ],
    pharmacotherapy: [
      'After a trial of lifestyle management, consider fenofibrate or omega-3 fatty acids with specialist involvement.',
      'If non–HDL-C is persistently ≥145 mg/dL despite lifestyle changes, statin therapy may be considered in youth ≥8 years of age.',
    ],
    followUp: 'Repeat fasting lipid panel in 3–6 months; if normalized, Figure 3 shows repeat in 6 months.',
  }),
  Object.freeze({
    id: 'severe',
    label: 'Severely elevated',
    min: 886,
    max: 2000,
    rangeLabel: '886–2000 mg/dL',
    lipoprotein: 'VLDL + chylomicrons',
    goal: 'Prevent pancreatitis',
    tone: 'danger',
    lifestyle: [
      'Engage in moderate-to-vigorous physical activity.',
      'Manage overweight or obesity when present.',
      'Restrict dietary fat to 10%–15% of total daily kcal; the statement notes this may equate to 15–20 g fat/day.',
      'Discuss pancreatitis risk.',
    ],
    pharmacotherapy: [
      'After a trial of lifestyle management, treatment with fenofibrate or omega-3 fatty acids may be considered with a pediatric lipid specialist.',
    ],
    followUp: 'Figure 3 directs lipid-specialist referral rather than a routine outpatient recheck interval.',
  }),
  Object.freeze({
    id: 'very-severe',
    label: 'Very severely elevated',
    min: 2000.0000001,
    max: Infinity,
    rangeLabel: '>2000 mg/dL',
    lipoprotein: 'Mainly chylomicrons',
    goal: 'Prevent pancreatitis',
    tone: 'critical',
    lifestyle: [
      'Engage in moderate-to-vigorous physical activity.',
      'Manage overweight or obesity when present.',
      'A no-fat or extremely low-fat diet is very effective in lowering triglycerides; the narrative describes a very-low- or no-fat approach.',
      'Discuss pancreatitis risk.',
    ],
    pharmacotherapy: [
      'The statement notes that these patients do not necessarily benefit from triglyceride-lowering medication; management should be directed by a pediatric lipid specialist and the underlying disorder.',
    ],
    followUp: 'Figure 3 directs lipid-specialist referral rather than a routine outpatient recheck interval.',
  }),
]);

export const SECONDARY_CAUSES = Object.freeze([
  Object.freeze({
    group: 'Obesity / obesity-related',
    items: ['BMI ≥85th percentile', 'Metabolic syndrome'],
  }),
  Object.freeze({
    group: 'Endocrine-related',
    items: ['Inadequately controlled type 1 or type 2 diabetes', 'Hypothyroidism', 'Hypercortisolemia', 'Lipodystrophy (primary genetic or acquired)'],
  }),
  Object.freeze({
    group: 'Drug / exposure',
    items: [
      'Alcohol use', 'Retinoids, including isotretinoin', 'Anabolic steroids', 'Glucocorticoids', 'Oral estrogens',
      'Estrogen-receptor blockers', 'First- and second-generation antipsychotics', 'Tricyclic antidepressants',
      'Selective serotonin reuptake inhibitors', 'Bile acid sequestrants / bile acid-binding resins', 'β-Blockers',
      'Thiazide and loop diuretics', 'Protease inhibitors', 'Immunosuppressants (rapamycin/sirolimus, tacrolimus, cyclosporine, azathioprine, mycophenolate mofetil)',
      'Pegylated conjugate of L-asparaginase', 'Tamoxifen', 'Cyclophosphamide', 'Rosiglitazone', 'Type 1 kinase inhibitors',
    ],
  }),
  Object.freeze({
    group: 'Other',
    items: ['Pregnancy (especially third trimester)', 'Acute and chronic infection', 'Glycogen storage disorders', 'Renal disease', 'Autoimmune/chronic inflammatory diseases', 'Parenteral nutrition / intravenous lipid emulsions', 'Other liver diseases'],
  }),
]);

export const IMPLEMENTATION_NOTES = Object.freeze([
  'Table 1 is used for triglyceride severity cut points. Figure 3 labels the acceptable branch as <130 mg/dL, whereas Table 1 lists ≤130 mg/dL; this tool uses the Table 1 classification.',
  'Table 1 is used for lifestyle targets. Figure 3 displays <6% kcal from sugar in the mildly elevated branch, whereas Table 1 lists <5%; this tool uses the Table 1 target.',
  'Figure 3 is used for workflow, laboratory, referral, and follow-up branches; narrative text is used to expand abbreviated details.',
]);

function finiteNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function calculateNonHDL(totalCholesterol, hdl) {
  const tc = finiteNumber(totalCholesterol);
  const h = finiteNumber(hdl);
  if (tc === null || h === null || tc < 0 || h < 0 || tc < h) return null;
  return tc - h;
}

export function classifyFastingTG(value) {
  const tg = finiteNumber(value);
  if (tg === null || tg < 0) return null;
  if (tg <= 130) return TG_BANDS[0];
  if (tg <= 400) return TG_BANDS[1];
  if (tg <= 885) return TG_BANDS[2];
  if (tg <= 2000) return TG_BANDS[3];
  return TG_BANDS[4];
}

export function assessNonfastingScreen({ triglycerides, totalCholesterol, hdl }) {
  const tg = finiteNumber(triglycerides);
  const h = finiteNumber(hdl);
  const nonHDL = calculateNonHDL(totalCholesterol, hdl);
  const figure3Reasons = [];
  const narrativeReasons = [];

  if (nonHDL !== null && nonHDL >= 145) figure3Reasons.push('non–HDL-C ≥145 mg/dL');
  if (tg !== null && tg >= 200) figure3Reasons.push('nonfasting TG ≥200 mg/dL');
  if (h !== null && h < 40) narrativeReasons.push('HDL-C <40 mg/dL');

  return Object.freeze({
    nonHDL,
    figure3Reasons,
    narrativeReasons,
    considerFastingPanel: figure3Reasons.length > 0 || narrativeReasons.length > 0,
  });
}

function persistentThresholdState({ persistentAfterLifestyle, nonHDL, age }) {
  const thresholdKnown = nonHDL !== null && Number.isFinite(Number(age));
  const thresholdMet = thresholdKnown && nonHDL >= 145 && Number(age) >= 8;
  if (!thresholdKnown) return 'insufficient-data';
  if (!thresholdMet) return 'not-met';
  if (persistentAfterLifestyle === 'yes') return 'met-and-persistent';
  if (persistentAfterLifestyle === 'no') return 'met-not-persistent';
  return 'met-persistence-unknown';
}

export function buildFastingPlan({
  age,
  triglycerides,
  totalCholesterol,
  hdl,
  persistentAfterLifestyle = 'unknown',
  pancreatitisSymptoms = false,
}) {
  const band = classifyFastingTG(triglycerides);
  if (!band) return null;
  const nonHDL = calculateNonHDL(totalCholesterol, hdl);
  const steps = [];
  const conditional = [];
  const labs = [];

  if (band.id !== 'acceptable') {
    steps.push('Evaluate for secondary causes and other ASCVD risk factors; optimize identified secondary causes while lifestyle management is initiated.');
  }
  steps.push(...band.lifestyle);

  if (band.id === 'moderate') {
    steps.push('Consider referral to a pediatric lipid specialist, pediatric preventive cardiologist, or pediatric endocrinologist if pharmacotherapy is being considered.');
  }

  if (band.id === 'severe' || band.id === 'very-severe') {
    steps.push('Dietitian consultation for a very-low-fat dietary plan.');
    steps.push('Refer to a pediatric lipid specialist.');
    steps.push('Consider genetic testing for a primary lipid disorder.');
    labs.push('TSH', 'ALT', 'HbA1c');
    if (pancreatitisSymptoms) labs.push('amylase', 'CMP', 'CBC', 'GGT', 'calcium');
  }

  const statinState = persistentThresholdState({ persistentAfterLifestyle, nonHDL, age });
  if (band.id === 'mild' || band.id === 'moderate') {
    if (statinState === 'met-and-persistent') {
      conditional.push('Non–HDL-C is ≥145 mg/dL, age is ≥8 years, and persistence after lifestyle is confirmed: the statement says statin therapy may be considered.');
    } else if (statinState === 'met-persistence-unknown') {
      conditional.push('Non–HDL-C and age meet the statement\'s statin-consideration threshold; confirm persistence despite lifestyle changes before applying that branch.');
    } else if (statinState === 'insufficient-data') {
      conditional.push('Enter age, total cholesterol, and HDL-C to evaluate the statement\'s non–HDL-C/statin consideration branch.');
    }
  }

  if (band.id === 'moderate') {
    if (persistentAfterLifestyle === 'yes') {
      conditional.push('Persistent moderate hypertriglyceridemia after lifestyle trial: consider fenofibrate or omega-3 fatty acids with pediatric lipid-specialist involvement.');
    } else {
      conditional.push('Fenofibrate/omega-3 consideration in this range follows a trial of lifestyle management; persistence is not yet confirmed in the entered data.');
    }
  }

  if (band.id === 'severe') {
    conditional.push('The statement allows consideration of fenofibrate or omega-3 fatty acids after a lifestyle trial; pharmacotherapy should be coordinated with a pediatric lipid specialist.');
  }

  if (band.id === 'very-severe') {
    conditional.push('The statement notes that very severe hypertriglyceridemia does not necessarily benefit from triglyceride-lowering medication; clarify the underlying disorder with a lipid specialist.');
  }

  return Object.freeze({
    band,
    nonHDL,
    steps,
    conditional,
    labs,
    followUp: band.followUp,
    statinState,
    pancreatitisSymptoms: Boolean(pancreatitisSymptoms),
  });
}

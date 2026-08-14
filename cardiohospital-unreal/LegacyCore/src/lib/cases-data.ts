// Immutable clinical case truth. Never mutated at runtime.
// Each case defines patient demographics, history facts (with disclosure gates),
// exam findings, test results, correct diagnosis, and teaching points.

export type DiscloseKey =
  | "generic"
  | "exertional_timing"
  | "family_sudden_death"
  | "prodrome"
  | "palpitations"
  | "triggers"
  | "pmh"
  | "meds"
  | "viral_illness"
  | "activity_level"
  | "stimulant_use" // confidential adolescent interview only
  | "substance_use" // confidential adolescent interview only
  | "sexual_history"; // confidential adolescent interview only

export interface HistoryFact {
  question: string;
  answer: string;
  redFlag?: boolean;
  key: DiscloseKey;
  /** Only revealed when the parent has stepped out. */
  confidential?: boolean;
}

export interface AuscultationFinding {
  site: "RUSB" | "LUSB" | "LLSB" | "Apex";
  description: string;
}

export interface ExamFindings {
  general: string;
  vitals: {
    HR: number;
    BP: string;
    RR: number;
    SpO2: number;
    fourLimbBP?: { RA: string; LA: string; RL: string; LL: string };
  };
  auscultation: AuscultationFinding[];
  femoralPulses: string;
  extras: string[];
}

export interface EcgFindings {
  rhythm: string;
  rate: number;
  intervals: { PR: string; QRS: string; QTc: string };
  axis: string;
  keyFindings: string[];
  pattern: "normal" | "lvh" | "wpw" | "longqt" | "myocarditis";
}

export interface EchoFindings {
  summary: string;
  keyFindings: string[];
  anomaly: "none" | "hcm" | "myocarditis" | "normal" | "coarctation";
}

export interface ClinicalCase {
  id: string;
  patientName: string;
  age: number;
  sex: "M" | "F";
  chiefComplaint: string;
  room: string;
  vibe: string;
  parentPresent: boolean;
  /** If true, an "Ask parent to step out" prompt is offered for confidential history. */
  allowConfidentialInterview?: boolean;
  correctDiagnosis: string;
  differentials: string[];
  history: HistoryFact[];
  exam: ExamFindings;
  ecg: EcgFindings;
  echo: EchoFindings;
  appropriateTests: string[];
  unnecessaryTests: string[];
  correctManagement: string[];
  redFlagKeys: DiscloseKey[];
  teachingPoint: string;
  missedOpportunityTemplate: Record<string, string>;
  attendingSocratic: string[];
}

export const CASES: ClinicalCase[] = [
  {
    id: "case-hcm",
    patientName: "Marcus Chen",
    age: 14,
    sex: "M",
    chiefComplaint: "Passed out at basketball practice",
    room: "Room 3",
    vibe:
      "A tall, athletic 14-year-old sits on the exam table in a basketball jersey. His mother sits beside him, arms crossed anxiously. He glances up briefly as you enter.",
    parentPresent: true,
    allowConfidentialInterview: true,
    correctDiagnosis: "Hypertrophic Cardiomyopathy",
    differentials: [
      "Hypertrophic Cardiomyopathy",
      "Vasovagal syncope",
      "Long QT syndrome",
      "Seizure",
      "Dehydration",
    ],
    history: [
      { key: "generic", question: "What brought you in today?", answer: "He collapsed at basketball practice yesterday. Coach said he just went down." },
      { key: "exertional_timing", question: "Did the fainting happen during or after exercise?", answer: "It was right in the middle of a sprint drill. He didn't even slow down first.", redFlag: true },
      { key: "prodrome", question: "Did you feel any warning — lightheaded, nauseous, hot?", answer: "No. One second I was running, then I woke up on the floor.", redFlag: true },
      { key: "palpitations", question: "Have you had racing heartbeats or chest pain with exercise?", answer: "Sometimes my chest feels tight when I really push. I didn't say anything." },
      { key: "family_sudden_death", question: "Has anyone in the family died suddenly or young?", answer: "...actually, my brother died at 29. They never really figured out why. He was healthy.", redFlag: true },
      { key: "triggers", question: "Anything unusual that day — sick, dehydrated, new meds?", answer: "No, he was totally normal that morning." },
      { key: "activity_level", question: "How competitive is his sport participation?", answer: "He's on varsity basketball. Practice five days a week, games on weekends." },
      { key: "stimulant_use", question: "Any stimulant medications or ADHD treatment?", answer: "He tried a friend's Adderall a couple times before big games. I never told my mom.", confidential: true, redFlag: true },
    ],
    exam: {
      general: "Well-appearing, tall, muscular adolescent. NAD.",
      vitals: { HR: 68, BP: "118/72", RR: 14, SpO2: 99 },
      auscultation: [
        { site: "RUSB", description: "Normal S1, S2. No murmur." },
        { site: "LUSB", description: "Soft systolic murmur, grade 2/6." },
        { site: "LLSB", description: "Harsh crescendo-decrescendo systolic murmur, grade 3/6. Louder with Valsalva." },
        { site: "Apex", description: "S1 normal. Faint holosystolic murmur." },
      ],
      femoralPulses: "2+ bilaterally, symmetric.",
      extras: ["No dysmorphic features.", "No edema.", "Prominent PMI."],
    },
    ecg: { rhythm: "Sinus rhythm", rate: 66, intervals: { PR: "148 ms", QRS: "94 ms", QTc: "432 ms" }, axis: "Left axis deviation", keyFindings: ["Prominent LVH by voltage criteria", "Deep, narrow Q waves in lateral leads (I, aVL, V5-V6)", "T-wave inversion in lateral leads"], pattern: "lvh" },
    echo: { summary: "Asymmetric septal hypertrophy consistent with HCM.", keyFindings: ["Septal wall thickness 22 mm (severe)", "LVOT gradient 45 mmHg at rest, 78 mmHg with Valsalva", "Systolic anterior motion of the mitral valve", "Preserved LV systolic function"], anomaly: "hcm" },
    appropriateTests: ["ECG", "Echocardiogram", "Genetics referral"],
    unnecessaryTests: ["Cardiac MRI", "CT angiography", "Troponin", "BNP"],
    correctManagement: ["Restrict from competitive sports immediately", "Refer for electrophysiology / ICD evaluation", "Family screening (first-degree relatives)", "Genetics consultation"],
    redFlagKeys: ["exertional_timing", "family_sudden_death", "prodrome"],
    teachingPoint: "Syncope DURING exertion + family history of sudden death is HCM until proven otherwise. Exercise restriction should occur BEFORE diagnostic completion.",
    missedOpportunityTemplate: {
      exertional_timing: "You never asked whether the syncope occurred during or after exercise. Mid-exertional syncope is a red flag for structural heart disease.",
      family_sudden_death: "You did not ask about premature sudden death in relatives. This history dramatically changes pretest probability for HCM and channelopathies.",
      prodrome: "You did not clarify prodromal symptoms. Absence of prodrome argues against vasovagal etiology.",
    },
    attendingSocratic: [
      "What makes you comfortable with that diagnosis?",
      "What specifically about the timing of the syncope concerns you?",
      "Before we finish testing, what does he need to stop doing today?",
    ],
  },
  {
    id: "case-vasovagal",
    patientName: "Ava Rodriguez",
    age: 15,
    sex: "F",
    chiefComplaint: "Fainted after cross-country race",
    room: "Room 1",
    vibe: "A slender 15-year-old sits with her father. She's on her phone but looks up politely. She seems relaxed.",
    parentPresent: true,
    allowConfidentialInterview: true,
    correctDiagnosis: "Post-exertional vasovagal syncope",
    differentials: ["Post-exertional vasovagal syncope", "Hypertrophic Cardiomyopathy", "Dehydration", "Long QT syndrome"],
    history: [
      { key: "generic", question: "What brought you in today?", answer: "I passed out at a cross-country meet last week. My coach freaked out." },
      { key: "exertional_timing", question: "Did it happen during the race or after you finished?", answer: "After. I finished, walked to the water table, and about a minute later I felt weird and went down." },
      { key: "prodrome", question: "Did you feel warning symptoms before?", answer: "Yeah — I got really hot, tunnel vision, kind of nauseous. Then I remember waking up." },
      { key: "triggers", question: "Had you eaten or drunk enough that day?", answer: "Honestly not really. I was nervous, skipped breakfast, and it was hot." },
      { key: "family_sudden_death", question: "Any family history of sudden death or heart problems young?", answer: "No, everyone's healthy." },
      { key: "palpitations", question: "Any chest pain or racing heart with exercise normally?", answer: "No, I feel fine when I run." },
      { key: "substance_use", question: "Any vaping, energy drinks, or other substances?", answer: "I vape sometimes. And I had two big energy drinks before the meet. Please don't tell my dad.", confidential: true, redFlag: true },
    ],
    exam: {
      general: "Well-appearing, athletic build.",
      vitals: { HR: 58, BP: "108/64", RR: 12, SpO2: 100 },
      auscultation: [
        { site: "RUSB", description: "Normal S1, S2." },
        { site: "LUSB", description: "Normal S1, S2. No murmur." },
        { site: "LLSB", description: "Normal S1, S2. No murmur." },
        { site: "Apex", description: "Normal S1, S2. No murmur." },
      ],
      femoralPulses: "2+ bilaterally, symmetric.",
      extras: ["No dysmorphic features.", "No edema."],
    },
    ecg: { rhythm: "Sinus bradycardia (athletic)", rate: 54, intervals: { PR: "156 ms", QRS: "88 ms", QTc: "418 ms" }, axis: "Normal", keyFindings: ["Sinus bradycardia consistent with athletic training", "No LVH criteria", "Normal repolarization"], pattern: "normal" },
    echo: { summary: "Structurally normal heart.", keyFindings: ["Normal chamber sizes", "Preserved biventricular function", "No valvular abnormality"], anomaly: "normal" },
    appropriateTests: ["ECG"],
    unnecessaryTests: ["Echocardiogram", "Cardiac MRI", "Holter", "Troponin", "BNP"],
    correctManagement: ["Reassurance", "Hydration and nutrition counseling", "Continue competitive sports", "Return precautions"],
    redFlagKeys: ["exertional_timing", "prodrome", "triggers"],
    teachingPoint: "POST-exertional syncope with a prodrome and dehydration risk factors is classic vasovagal. Extensive workup is unnecessary and can lead to inappropriate activity restriction.",
    missedOpportunityTemplate: {
      exertional_timing: "You did not clarify the timing relative to exercise. During vs. after exercise is the single most important discriminating feature.",
      prodrome: "You did not ask about prodromal symptoms. A clear prodrome strongly supports a vasovagal mechanism.",
      triggers: "You did not screen for dehydration, fasting, or heat exposure — all reversible contributors.",
    },
    attendingSocratic: [
      "What features here point away from a structural cardiac cause?",
      "How would your workup change if the episode had been mid-run?",
      "What are you telling the family about future activity?",
    ],
  },
  {
    id: "case-innocent-murmur",
    patientName: "Liam Foster",
    age: 5,
    sex: "M",
    chiefComplaint: "Murmur heard at well-child visit",
    room: "Room 2",
    vibe: "A 5-year-old sits on the floor with a toy dinosaur. His mother is patient and unhurried. He looks up and grins at you.",
    parentPresent: true,
    correctDiagnosis: "Still's murmur (innocent)",
    differentials: ["Still's murmur (innocent)", "Small VSD", "Pulmonary flow murmur", "Mild aortic stenosis"],
    history: [
      { key: "generic", question: "What brings you in today?", answer: "His pediatrician heard a murmur at his 5-year check-up." },
      { key: "activity_level", question: "How's his activity level and growth?", answer: "He runs around like a maniac. Grows just fine." },
      { key: "palpitations", question: "Any chest pain, shortness of breath with play, or fainting?", answer: "Nothing like that. He's a totally normal kid." },
      { key: "family_sudden_death", question: "Family history of congenital heart disease or sudden death?", answer: "No, no one." },
      { key: "viral_illness", question: "Any recent illnesses?", answer: "He had a cold two weeks ago, otherwise well." },
    ],
    exam: {
      general: "Well-appearing, active preschooler.",
      vitals: { HR: 92, BP: "98/60", RR: 20, SpO2: 100 },
      auscultation: [
        { site: "RUSB", description: "Normal S1, S2." },
        { site: "LUSB", description: "Soft I/VI systolic murmur." },
        { site: "LLSB", description: "Grade II/VI musical, vibratory systolic ejection murmur. Softer when standing." },
        { site: "Apex", description: "Normal S1, S2." },
      ],
      femoralPulses: "2+ bilaterally, symmetric.",
      extras: ["No cyanosis.", "No hepatomegaly.", "Normal growth curve."],
    },
    ecg: { rhythm: "Sinus rhythm", rate: 90, intervals: { PR: "128 ms", QRS: "78 ms", QTc: "402 ms" }, axis: "Normal", keyFindings: ["Normal pediatric ECG"], pattern: "normal" },
    echo: { summary: "Not indicated based on classic innocent murmur features.", keyFindings: ["N/A"], anomaly: "none" },
    appropriateTests: [],
    unnecessaryTests: ["ECG", "Echocardiogram", "CXR", "BNP"],
    correctManagement: ["Reassure family — classic innocent murmur", "No activity restriction", "Routine pediatric follow-up"],
    redFlagKeys: ["activity_level", "palpitations"],
    teachingPoint: "Still's murmur is classic: musical, vibratory, position-dependent, in an asymptomatic thriving child. No workup needed. Ordering an echo teaches the family the murmur is scary — it isn't.",
    missedOpportunityTemplate: {
      activity_level: "You did not confirm normal activity and growth — the strongest bedside evidence against pathology.",
      palpitations: "You did not screen for symptoms. An asymptomatic murmur in a thriving child rarely requires imaging.",
    },
    attendingSocratic: [
      "What features of this murmur point to innocence?",
      "If you order an echo here, what have you taught the family?",
      "How do you counsel them today?",
    ],
  },
  {
    id: "case-wpw",
    patientName: "Sofia Patel",
    age: 12,
    sex: "F",
    chiefComplaint: "Recurrent palpitations with sudden onset",
    room: "Room 4",
    vibe: "A poised 12-year-old sits with her father. She looks well but describes her episodes matter-of-factly.",
    parentPresent: true,
    correctDiagnosis: "Wolff-Parkinson-White syndrome",
    differentials: ["Wolff-Parkinson-White syndrome", "Sinus tachycardia", "Anxiety", "POTS"],
    history: [
      { key: "generic", question: "Tell me about the episodes.", answer: "My heart just suddenly starts racing. Like a switch flipped. It's happened four times now." },
      { key: "triggers", question: "Anything triggers them?", answer: "Not really — once during math class, once while running, once just sitting on the couch." },
      { key: "palpitations", question: "How long do they last, and how do they stop?", answer: "About 10 to 20 minutes. They just suddenly stop — same way they start.", redFlag: true },
      { key: "prodrome", question: "Any chest pain, fainting, or dizziness?", answer: "I get dizzy sometimes but I haven't passed out." },
      { key: "family_sudden_death", question: "Family history of arrhythmia or sudden death?", answer: "No." },
    ],
    exam: {
      general: "Well-appearing, in NSR currently.",
      vitals: { HR: 82, BP: "110/68", RR: 14, SpO2: 100 },
      auscultation: [
        { site: "RUSB", description: "Normal S1, S2." },
        { site: "LUSB", description: "Normal S1, S2." },
        { site: "LLSB", description: "Normal S1, S2." },
        { site: "Apex", description: "Normal S1, S2." },
      ],
      femoralPulses: "2+ bilaterally.",
      extras: ["No dysmorphic features."],
    },
    ecg: { rhythm: "Sinus rhythm with pre-excitation", rate: 78, intervals: { PR: "98 ms (short)", QRS: "128 ms (wide)", QTc: "420 ms" }, axis: "Normal", keyFindings: ["Short PR interval (< 120 ms)", "Delta wave slurring the upstroke of the QRS", "Widened QRS", "Consistent with WPW pattern"], pattern: "wpw" },
    echo: { summary: "Structurally normal heart.", keyFindings: ["Normal chambers and function"], anomaly: "normal" },
    appropriateTests: ["ECG", "Echocardiogram", "Holter"],
    unnecessaryTests: ["Cardiac MRI", "CT angiography", "BNP"],
    correctManagement: ["Refer to electrophysiology", "Counsel on vagal maneuvers", "Discuss risk stratification and ablation"],
    redFlagKeys: ["palpitations", "prodrome"],
    teachingPoint: "Sudden-onset, sudden-offset palpitations = paroxysmal SVT. On the ECG, short PR + delta wave = WPW. EP referral is required; ablation is often curative.",
    missedOpportunityTemplate: {
      palpitations: "You did not clarify onset and offset. Abrupt on/off is the hallmark of paroxysmal SVT.",
      prodrome: "You did not ask about associated syncope. Syncope with WPW markedly changes urgency.",
    },
    attendingSocratic: [
      "What on the ECG makes this WPW rather than plain SVT?",
      "Why does the on/off pattern matter?",
      "What's the disposition and follow-up plan?",
    ],
  },
  {
    id: "case-myocarditis",
    patientName: "Ethan Kim",
    age: 16,
    sex: "M",
    chiefComplaint: "Chest pain and fatigue after viral illness",
    room: "Room 2",
    vibe: "A 16-year-old sits slightly hunched, looking tired. His mother watches him with concern. He winces when he shifts position.",
    parentPresent: true,
    allowConfidentialInterview: true,
    correctDiagnosis: "Postviral myocarditis",
    differentials: ["Postviral myocarditis", "Musculoskeletal chest pain", "Pericarditis", "Anxiety"],
    history: [
      { key: "generic", question: "What's been going on?", answer: "I had a bad cold two weeks ago, and since then I've felt exhausted. My chest has been aching for four days." },
      { key: "viral_illness", question: "Tell me about the illness — fever, aches?", answer: "High fever for three days, body aches, sore throat. It was rough.", redFlag: true },
      { key: "activity_level", question: "Any exercise intolerance now?", answer: "I got winded walking upstairs yesterday. I'm normally a swimmer. That's not right.", redFlag: true },
      { key: "palpitations", question: "Any palpitations, dizziness, or syncope?", answer: "My heart feels weird sometimes — like it skips. No fainting." },
      { key: "prodrome", question: "Any chest pain characteristics — sharp, positional, radiating?", answer: "Dull, in the middle. Worse when I lie flat. Not really positional otherwise." },
      { key: "substance_use", question: "Any substance use I should know about — vaping, THC, cocaine, other?", answer: "I vape. I tried a cousin's cocaine once at a party three months ago. Just once.", confidential: true },
    ],
    exam: {
      general: "Ill-appearing, fatigued adolescent.",
      vitals: { HR: 118, BP: "98/62", RR: 20, SpO2: 96 },
      auscultation: [
        { site: "RUSB", description: "Normal S1, S2." },
        { site: "LUSB", description: "S1, S2 present. Possible S3 gallop." },
        { site: "LLSB", description: "Faint holosystolic murmur (functional MR)." },
        { site: "Apex", description: "Displaced PMI. S3 gallop." },
      ],
      femoralPulses: "2+ bilaterally, symmetric but thready.",
      extras: ["Mild JVD.", "No peripheral edema.", "Warm and well-perfused."],
    },
    ecg: { rhythm: "Sinus tachycardia", rate: 118, intervals: { PR: "162 ms", QRS: "96 ms", QTc: "448 ms" }, axis: "Normal", keyFindings: ["Sinus tachycardia", "Diffuse low-voltage QRS", "Non-specific ST-T wave changes", "Occasional PVCs"], pattern: "myocarditis" },
    echo: { summary: "Mildly dilated LV with reduced systolic function.", keyFindings: ["LVEF 42%", "Mild LV dilation", "Trivial pericardial effusion", "Functional MR"], anomaly: "myocarditis" },
    appropriateTests: ["ECG", "Echocardiogram", "Troponin", "BNP", "CBC", "CMP", "Cardiac MRI"],
    unnecessaryTests: ["CT angiography", "Holter", "TSH"],
    correctManagement: ["Admit to cardiology / CICU", "Exercise restriction", "Serial troponin and BNP", "Consider cardiac MRI", "Supportive heart failure care as needed"],
    redFlagKeys: ["viral_illness", "activity_level", "palpitations"],
    teachingPoint: "Postviral chest pain + new exercise intolerance + tachycardia + low-voltage ECG = suspect myocarditis. This is a can't-miss admission, not a reassurance visit.",
    missedOpportunityTemplate: {
      viral_illness: "You did not connect the recent viral illness to the current presentation — the strongest historical clue.",
      activity_level: "You did not ask about new exercise intolerance — a red flag for cardiac involvement.",
      palpitations: "You did not screen for arrhythmic symptoms.",
    },
    attendingSocratic: [
      "What is the constellation here pointing toward?",
      "Is this a reassurance visit or an admission?",
      "What are you monitoring and why?",
    ],
  },
  {
    id: "case-longqt",
    patientName: "Maya Johnson",
    age: 13,
    sex: "F",
    chiefComplaint: "Fainted diving into a swimming pool",
    room: "Room 1",
    vibe: "A 13-year-old sits with her mother. She looks embarrassed. Her mother is quiet, holding a folder of medical records.",
    parentPresent: true,
    correctDiagnosis: "Long QT syndrome",
    differentials: [
      "Long QT syndrome",
      "Vasovagal syncope",
      "Hypertrophic Cardiomyopathy",
      "Breath-holding spell",
      "Seizure",
    ],
    history: [
      { key: "generic", question: "Tell me what happened.", answer: "She dove into the pool at swim practice and never came up. Her coach pulled her out. She was blue for a few seconds and then came around." },
      { key: "triggers", question: "Anything special about the moment? A loud noise, being startled, water?", answer: "She dove in headfirst on the starter's whistle. That was the exact moment.", redFlag: true },
      { key: "prodrome", question: "Did she have any warning symptoms before?", answer: "No warning. It was just the whistle, the dive, and then she wasn't moving.", redFlag: true },
      { key: "palpitations", question: "Any prior palpitations, chest pain, or near-fainting?", answer: "She has had a couple of 'weird spells' when she got surprised. We just brushed it off." },
      { key: "family_sudden_death", question: "Any family history of sudden death, drowning, or unexplained death young?", answer: "My sister drowned when she was 19 — they said she 'just went under.' Nobody could explain it.", redFlag: true },
      { key: "meds", question: "Any medications she's on — including azithromycin, ondansetron, ADHD meds?", answer: "She was on azithromycin for strep last week.", redFlag: true },
      { key: "activity_level", question: "Baseline activity?", answer: "Competitive swimmer. She's fine at practice normally." },
    ],
    exam: {
      general: "Well-appearing, wet hair, wrapped in a hospital blanket.",
      vitals: { HR: 72, BP: "104/64", RR: 14, SpO2: 100 },
      auscultation: [
        { site: "RUSB", description: "Normal S1, S2." },
        { site: "LUSB", description: "Normal S1, S2. No murmur." },
        { site: "LLSB", description: "Normal S1, S2. No murmur." },
        { site: "Apex", description: "Normal S1, S2." },
      ],
      femoralPulses: "2+ bilaterally, symmetric.",
      extras: ["No dysmorphic features.", "No sensorineural hearing loss reported."],
    },
    ecg: { rhythm: "Sinus rhythm", rate: 72, intervals: { PR: "152 ms", QRS: "90 ms", QTc: "512 ms" }, axis: "Normal", keyFindings: ["Prolonged QTc (512 ms)", "Notched T waves in the lateral leads", "No arrhythmia captured"], pattern: "longqt" },
    echo: { summary: "Structurally normal heart.", keyFindings: ["Normal biventricular size and function", "No structural abnormality"], anomaly: "normal" },
    appropriateTests: ["ECG", "Echocardiogram", "Holter", "Genetics referral"],
    unnecessaryTests: ["Cardiac MRI", "CT angiography", "BNP", "TSH"],
    correctManagement: [
      "Restrict from competitive swimming and startle-trigger activities",
      "Refer to electrophysiology",
      "Stop QT-prolonging medication (azithromycin)",
      "Family screening (first-degree relatives)",
      "Genetics consultation",
    ],
    redFlagKeys: ["triggers", "family_sudden_death", "meds"],
    teachingPoint: "Startle-triggered or swimming-triggered syncope + family history of unexplained drowning + a QT-prolonging medication = long QT syndrome (often LQT1/LQT2). Stop offending drug, restrict swimming and adrenergic triggers, EP referral, family screening.",
    missedOpportunityTemplate: {
      triggers: "You did not clarify the trigger (auditory startle, diving into water). LQT2 loves auditory triggers; LQT1 loves swimming.",
      family_sudden_death: "You did not ask about unexplained drowning or premature sudden death — the highest-yield question in this presentation.",
      meds: "You did not review medications. Azithromycin (and dozens of others) prolongs QT.",
    },
    attendingSocratic: [
      "What single feature of this history should have made you calculate a QTc immediately?",
      "How is 'swimming' relevant to long QT?",
      "What activity restrictions and meds do you counsel today?",
    ],
  },
  {
    id: "case-coarctation",
    patientName: "Diego Alvarez",
    age: 11,
    sex: "M",
    chiefComplaint: "Elevated blood pressure at sports physical",
    room: "Room 3",
    vibe: "An 11-year-old sits patiently on the exam table. His father, a nurse, is present and asks smart questions.",
    parentPresent: true,
    correctDiagnosis: "Coarctation of the aorta",
    differentials: [
      "Coarctation of the aorta",
      "Primary hypertension",
      "Renovascular hypertension",
      "White-coat hypertension",
    ],
    history: [
      { key: "generic", question: "What brings you in?", answer: "His BP was 148/82 at his sports physical. The pediatrician was worried." },
      { key: "activity_level", question: "How's his energy? Any leg cramps with running?", answer: "He gets tired legs when he runs long. He thought it was just being out of shape.", redFlag: true },
      { key: "palpitations", question: "Any headaches, nosebleeds, chest pain, or shortness of breath?", answer: "He gets headaches after PE class. Frequent for the last year." },
      { key: "family_sudden_death", question: "Family history of congenital heart disease, bicuspid aortic valve, or hypertension?", answer: "His paternal uncle had 'a bicuspid valve' and needed heart surgery.", redFlag: true },
      { key: "pmh", question: "Any past medical history — murmur as an infant, growth issues?", answer: "He was told he had a 'soft murmur' as a baby but it 'went away.'" },
      { key: "viral_illness", question: "Any recent illnesses?", answer: "No, well." },
    ],
    exam: {
      general: "Well-appearing pre-teen. Athletic build.",
      vitals: {
        HR: 78,
        BP: "148/82",
        RR: 14,
        SpO2: 100,
        fourLimbBP: { RA: "152/86", LA: "148/82", RL: "94/58", LL: "92/56" },
      },
      auscultation: [
        { site: "RUSB", description: "Normal S1, S2." },
        { site: "LUSB", description: "Grade 2/6 systolic ejection murmur." },
        { site: "LLSB", description: "Grade 2/6 systolic murmur radiating to the back." },
        { site: "Apex", description: "Normal S1, S2." },
      ],
      femoralPulses: "Diminished and delayed compared to brachials (radial-femoral delay).",
      extras: [
        "Prominent brachial pulses.",
        "Delayed femoral pulses on palpation.",
        "Systolic murmur audible over the mid-back.",
      ],
    },
    ecg: { rhythm: "Sinus rhythm", rate: 76, intervals: { PR: "144 ms", QRS: "88 ms", QTc: "408 ms" }, axis: "Left axis deviation", keyFindings: ["LVH by voltage criteria", "No repolarization abnormality"], pattern: "lvh" },
    echo: { summary: "Discrete narrowing of the descending aorta just distal to the left subclavian artery, with a peak gradient of 42 mmHg. Bicuspid aortic valve.", keyFindings: ["Discrete juxtaductal coarctation", "Peak gradient 42 mmHg", "Bicuspid aortic valve", "Mild LVH"], anomaly: "coarctation" },
    appropriateTests: ["ECG", "Echocardiogram", "Cardiac MRI"],
    unnecessaryTests: ["Holter", "Troponin", "BNP", "TSH"],
    correctManagement: [
      "Refer for cardiac catheterization / surgical evaluation",
      "Antihypertensive therapy while awaiting definitive repair",
      "Restrict from isometric / high-static-load activities",
      "Family screening (first-degree relatives) for bicuspid aortic valve",
    ],
    redFlagKeys: ["activity_level", "family_sudden_death"],
    teachingPoint: "Any adolescent hypertension deserves FOUR-LIMB blood pressures and femoral pulses. Coarctation is missed for years when clinicians settle for an upper-extremity BP. Radial-femoral delay + LVH on ECG + a systolic murmur radiating to the back is the classic triad.",
    missedOpportunityTemplate: {
      activity_level: "You did not ask about leg claudication or fatigue with exertion — a coarctation-specific complaint.",
      family_sudden_death: "You did not ask about bicuspid aortic valve in the family (associated with coarctation).",
    },
    attendingSocratic: [
      "What single physical exam maneuver should you never omit in a hypertensive adolescent?",
      "How does that finding change your differential?",
      "What imaging is definitive here, and what are the next steps?",
    ],
  },
];

export function getCase(id: string): ClinicalCase | undefined {
  return CASES.find((c) => c.id === id);
}
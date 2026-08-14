// Compiled deterministic encounter graphs for the Unreal migration.
// Clinical truth remains in cases-data.ts; these authoring records define only
// progression, available actions, safety rules, and contrastive teaching.

import {
  compileOutpatientCaseGraph,
  type CaseGraphDefinition,
  type OutpatientCaseAuthoring,
} from "./case-graph-authoring.ts";

const HCM_AUTHORING: OutpatientCaseAuthoring = {
  caseId: "case-hcm",
  version: "1.0",
  roomTarget: "room-3",
  encounterTarget: "marcus-and-parent",
  history: [
    { key: "generic", acceptance: true },
    { key: "exertional_timing", acceptance: true },
    { key: "family_sudden_death", acceptance: true },
    { key: "prodrome", acceptance: true },
    { key: "palpitations" },
    { key: "triggers" },
    { key: "activity_level" },
    { key: "stimulant_use" },
  ],
  examAcceptanceTargets: ["general", "vitals", "auscultation"],
  orders: [
    { id: "ecg", target: "ECG", reviewable: true, acceptance: true },
    { id: "echo", target: "Echocardiogram", reviewable: true, acceptance: true },
    { id: "ct-angiography", target: "CT angiography" },
    { id: "troponin", target: "Troponin" },
  ],
  management: [
    { id: "restrict-sports", target: "Restrict from competitive sports immediately", acceptance: true },
    { id: "ep-referral", target: "Refer for electrophysiology / ICD evaluation" },
    { id: "family-screening", target: "Family screening (first-degree relatives)" },
    { id: "genetics", target: "Genetics consultation" },
    { id: "clear-sports", target: "Clear for competitive sports" },
    { id: "reassure", target: "Reassurance only" },
  ],
  safetyRules: [
    {
      id: "hcm-exercise-restriction",
      severity: "critical",
      requiredActions: ["management.restrict-sports"],
      prohibitedActions: ["management.clear-sports"],
      message: "Exercise restriction was not established for a patient with exertional syncope and abnormal cardiac testing.",
      intervention: "The attending stops discharge and restricts competitive sports before the patient leaves.",
    },
  ],
  counterfactuals: [
    {
      id: "during-versus-after-exercise",
      prompt: "What if the episode had occurred after exercise with warmth, nausea, and tunnel vision instead of during a sprint without prodrome?",
      alternateCaseId: "case-vasovagal",
      triggerMissingActions: ["history.exertional-timing", "history.prodrome"],
    },
  ],
};

const VASOVAGAL_AUTHORING: OutpatientCaseAuthoring = {
  caseId: "case-vasovagal",
  version: "1.0",
  roomTarget: "room-1",
  encounterTarget: "ava-and-parent",
  history: [
    { key: "generic", acceptance: true },
    { key: "exertional_timing", acceptance: true },
    { key: "prodrome", acceptance: true },
    { key: "triggers", acceptance: true },
    { key: "family_sudden_death" },
    { key: "palpitations" },
    { key: "substance_use" },
  ],
  examAcceptanceTargets: ["general", "vitals", "auscultation"],
  orders: [
    { id: "ecg", target: "ECG", reviewable: true, acceptance: true },
    { id: "echo", target: "Echocardiogram", reviewable: true },
    { id: "cardiac-mri", target: "Cardiac MRI" },
    { id: "holter", target: "Holter" },
    { id: "troponin", target: "Troponin" },
    { id: "bnp", target: "BNP" },
  ],
  management: [
    { id: "reassure", target: "Reassurance", acceptance: true },
    { id: "hydration", target: "Hydration and nutrition counseling", acceptance: true },
    { id: "continue-sports", target: "Continue competitive sports", acceptance: true },
    { id: "return-precautions", target: "Return precautions", acceptance: true },
    { id: "restrict-sports", target: "Restrict from sports" },
  ],
  safetyRules: [
    {
      id: "vasovagal-unnecessary-restriction",
      severity: "major",
      requiredActions: [],
      prohibitedActions: ["management.restrict-sports"],
      message: "A benign post-exertional vasovagal presentation was given unnecessary sports restriction.",
      intervention: "The attending corrects the plan and counsels the family that continued activity is appropriate.",
    },
  ],
  counterfactuals: [
    {
      id: "after-versus-during-exercise",
      prompt: "What if the episode had occurred during a sprint without warning and the family reported premature sudden death?",
      alternateCaseId: "case-hcm",
      triggerMissingActions: ["history.exertional-timing", "history.prodrome"],
    },
  ],
};

const INNOCENT_MURMUR_AUTHORING: OutpatientCaseAuthoring = {
  caseId: "case-innocent-murmur",
  version: "1.0",
  roomTarget: "room-2",
  encounterTarget: "liam-and-parent",
  history: [
    { key: "generic", acceptance: true },
    { key: "activity_level", acceptance: true },
    { key: "palpitations", acceptance: true },
    { key: "family_sudden_death" },
    { key: "viral_illness" },
  ],
  examAcceptanceTargets: ["general", "vitals", "auscultation", "femoralPulses"],
  orders: [
    { id: "ecg", target: "ECG", reviewable: true },
    { id: "echo", target: "Echocardiogram", reviewable: true },
    { id: "cxr", target: "CXR" },
    { id: "bnp", target: "BNP" },
  ],
  management: [
    { id: "reassure-family", target: "Reassure family — classic innocent murmur", acceptance: true },
    { id: "no-activity-restriction", target: "No activity restriction", acceptance: true },
    { id: "routine-follow-up", target: "Routine pediatric follow-up", acceptance: true },
    { id: "restrict-sports", target: "Restrict from sports" },
  ],
  safetyRules: [
    {
      id: "innocent-murmur-unnecessary-restriction",
      severity: "major",
      requiredActions: ["management.no-activity-restriction"],
      prohibitedActions: ["management.restrict-sports"],
      message: "A classic innocent murmur was treated as heart disease with unnecessary activity restriction.",
      intervention: "The attending corrects the plan and reassures the family that normal activity is appropriate.",
    },
  ],
  counterfactuals: [],
};

const WPW_AUTHORING: OutpatientCaseAuthoring = {
  caseId: "case-wpw",
  version: "1.0",
  roomTarget: "room-4",
  encounterTarget: "sofia-and-parent",
  history: [
    { key: "generic", acceptance: true },
    { key: "triggers" },
    { key: "palpitations", acceptance: true },
    { key: "prodrome", acceptance: true },
    { key: "family_sudden_death" },
  ],
  examAcceptanceTargets: ["general", "vitals", "auscultation"],
  orders: [
    { id: "ecg", target: "ECG", reviewable: true, acceptance: true },
    { id: "echo", target: "Echocardiogram", reviewable: true, acceptance: true },
    { id: "holter", target: "Holter", acceptance: true },
    { id: "cardiac-mri", target: "Cardiac MRI" },
    { id: "ct-angiography", target: "CT angiography" },
    { id: "bnp", target: "BNP" },
  ],
  management: [
    { id: "ep-referral", target: "Refer to electrophysiology", acceptance: true },
    { id: "vagal-maneuvers", target: "Counsel on vagal maneuvers", acceptance: true },
    { id: "risk-stratification-ablation", target: "Discuss risk stratification and ablation", acceptance: true },
    { id: "reassure", target: "Reassurance only" },
  ],
  safetyRules: [
    {
      id: "wpw-electrophysiology-referral",
      severity: "major",
      requiredActions: ["management.ep-referral"],
      prohibitedActions: ["management.reassure"],
      message: "Symptomatic WPW was not referred for electrophysiology risk stratification.",
      intervention: "The attending corrects the disposition and places the electrophysiology referral.",
    },
  ],
  counterfactuals: [],
};

const MYOCARDITIS_AUTHORING: OutpatientCaseAuthoring = {
  caseId: "case-myocarditis",
  version: "1.0",
  roomTarget: "room-2",
  encounterTarget: "ethan-and-parent",
  history: [
    { key: "generic", acceptance: true },
    { key: "viral_illness", acceptance: true },
    { key: "activity_level", acceptance: true },
    { key: "palpitations", acceptance: true },
    { key: "prodrome" },
    { key: "substance_use" },
  ],
  examAcceptanceTargets: ["general", "vitals", "auscultation", "femoralPulses"],
  orders: [
    { id: "ecg", target: "ECG", reviewable: true, acceptance: true },
    { id: "echo", target: "Echocardiogram", reviewable: true, acceptance: true },
    { id: "troponin", target: "Troponin", acceptance: true },
    { id: "bnp", target: "BNP", acceptance: true },
    { id: "cbc", target: "CBC", acceptance: true },
    { id: "cmp", target: "CMP", acceptance: true },
    { id: "cardiac-mri", target: "Cardiac MRI", acceptance: true },
    { id: "ct-angiography", target: "CT angiography" },
    { id: "holter", target: "Holter" },
    { id: "tsh", target: "TSH" },
  ],
  management: [
    { id: "admit", target: "Admit to cardiology / CICU", acceptance: true },
    { id: "exercise-restriction", target: "Exercise restriction", acceptance: true },
    { id: "serial-biomarkers", target: "Serial troponin and BNP", acceptance: true },
    { id: "cardiac-mri", target: "Consider cardiac MRI", acceptance: true },
    { id: "supportive-hf-care", target: "Supportive heart failure care as needed", acceptance: true },
    { id: "reassure", target: "Reassurance only" },
    { id: "discharge", target: "Discharge from clinic" },
  ],
  safetyRules: [
    {
      id: "myocarditis-admission",
      severity: "critical",
      requiredActions: ["management.admit", "management.exercise-restriction"],
      prohibitedActions: ["management.reassure", "management.discharge"],
      message: "A patient with suspected myocarditis and ventricular dysfunction was not admitted and restricted from exercise.",
      intervention: "The attending stops discharge and arranges monitored cardiology admission.",
    },
  ],
  counterfactuals: [],
};

export const HCM_CASE_GRAPH = compileOutpatientCaseGraph(HCM_AUTHORING);
export const VASOVAGAL_CASE_GRAPH = compileOutpatientCaseGraph(VASOVAGAL_AUTHORING);
export const INNOCENT_MURMUR_CASE_GRAPH = compileOutpatientCaseGraph(INNOCENT_MURMUR_AUTHORING);
export const WPW_CASE_GRAPH = compileOutpatientCaseGraph(WPW_AUTHORING);
export const MYOCARDITIS_CASE_GRAPH = compileOutpatientCaseGraph(MYOCARDITIS_AUTHORING);
export const CASE_GRAPHS: CaseGraphDefinition[] = [
  HCM_CASE_GRAPH,
  VASOVAGAL_CASE_GRAPH,
  INNOCENT_MURMUR_CASE_GRAPH,
  WPW_CASE_GRAPH,
  MYOCARDITIS_CASE_GRAPH,
];

import { CASES } from "./cases-data";
import { getConceptMastery, getRotation } from "./rotation-store";

interface ConceptWeight {
  caseId: string;
  concepts: string[];
}

const CASE_CONCEPTS: ConceptWeight[] = [
  { caseId: "case-hcm", concepts: ["Exertional syncope red flags", "Family sudden death history", "ECG interpretation (WPW / LVH / low voltage)"] },
  { caseId: "case-vasovagal", concepts: ["Exertional syncope red flags", "Test selection restraint"] },
  { caseId: "case-innocent-murmur", concepts: ["Murmur differentiation", "Test selection restraint"] },
  { caseId: "case-wpw", concepts: ["ECG interpretation (WPW / LVH / low voltage)"] },
  { caseId: "case-myocarditis", concepts: ["Postviral cardiac red flags", "ECG interpretation (WPW / LVH / low voltage)"] },
  { caseId: "case-longqt", concepts: ["Family sudden death history", "ECG interpretation (WPW / LVH / low voltage)"] },
  { caseId: "case-coarctation", concepts: ["Test selection restraint", "Murmur differentiation"] },
];

export interface AdaptivePick {
  caseId: string;
  reason: string;
  kind: "first" | "weakness" | "contrast" | "longitudinal";
}

export function pickNextCase(): AdaptivePick | null {
  const state = getRotation();
  const completed = new Set(state.completedCaseIds);

  if (completed.size === 0) {
    return { caseId: "case-hcm", reason: "Recommended vertical-slice case — exercises the full loop.", kind: "first" };
  }

  const remaining = CASES.filter((clinicalCase) => !completed.has(clinicalCase.id));
  if (remaining.length === 0) return null;

  const masteryMap = new Map(getConceptMastery().map((item) => [item.concept, item.mastery]));
  let best: { caseId: string; score: number; concept: string } | null = null;

  for (const clinicalCase of remaining) {
    const entry = CASE_CONCEPTS.find((item) => item.caseId === clinicalCase.id);
    if (!entry) continue;
    const scores = entry.concepts.map((concept) => masteryMap.get(concept) ?? 0).filter((value) => value > 0);
    const weakestTouched = scores.length ? Math.min(...scores) : 100;
    const priority = 100 - weakestTouched;
    if (!best || priority > best.score) {
      const concept = entry.concepts.find((item) => (masteryMap.get(item) ?? 100) === weakestTouched);
      best = { caseId: clinicalCase.id, score: priority, concept: concept ?? entry.concepts[0] };
    }
  }

  if (best && best.score > 0) {
    return { caseId: best.caseId, reason: `Prioritized because your mastery of “${best.concept}” is developing.`, kind: "weakness" };
  }

  const last = state.attempts[state.attempts.length - 1];
  if (last?.caseId === "case-hcm" && remaining.some((item) => item.id === "case-vasovagal")) {
    return { caseId: "case-vasovagal", reason: "Contrastive case: post-exertional syncope with prodrome.", kind: "contrast" };
  }
  if (last?.caseId === "case-vasovagal" && remaining.some((item) => item.id === "case-longqt")) {
    return { caseId: "case-longqt", reason: "Contrastive case: startle-triggered syncope with prolonged QT.", kind: "contrast" };
  }
  return { caseId: remaining[0].id, reason: "Next case in the rotation queue.", kind: "contrast" };
}

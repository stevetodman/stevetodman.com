// Longitudinal patient return visits (Spec §95–96).
// After the initial encounter, patients "return" for follow-up. The follow-up
// content is generated deterministically from the learner's prior attempt
// (their diagnosis, management, and missed opportunities) so early decisions
// have visible downstream consequences.

import { getCase } from "./cases-data";
import { getRotation } from "./rotation-store";

export interface FollowUp {
    caseId: string;
    patientName: string;
    daysLater: number;
    scene: string;
    parentDialogue: string;
    findings: string[];
    outcome: string;
    consequence: "good" | "neutral" | "warning";
}

export function getFollowUps(): FollowUp[] {
    const state = getRotation();
    const followUps: FollowUp[] = [];

    for (const attempt of state.attempts) {
        const c = getCase(attempt.caseId);
        if (!c) continue;

        const dxCorrect = attempt.submittedDiagnosis === c.correctDiagnosis;
        const overOrdered = c.unnecessaryTests.filter((t) => attempt.orderedTests.includes(t));
        const missedRedFlags = c.redFlagKeys.filter((k) => !attempt.askedHistoryKeys.includes(k));

        if (c.id === "case-hcm") {
            if (dxCorrect) {
                followUps.push({
                    caseId: c.id,
                    patientName: c.patientName,
                    daysLater: 30,
                    scene:
                        "Marcus returns to clinic in street clothes rather than a jersey. His mother looks less anxious. He is alive because you restricted him.",
                    parentDialogue:
                        "\u201CThe electrophysiologist placed his ICD last week. His cousin was screened — also positive. Thank you for being blunt with us.\u201D",
                    findings: [
                        "Post-ICD placement, doing well",
                        "Family screening initiated — first-degree relatives being evaluated",
                        "Sports restriction sustained",
                    ],
                    outcome:
                        "Longitudinal outcome: correct early recognition prevented a likely sudden cardiac death event.",
                    consequence: "good",
                });
            } else {
                followUps.push({
                    caseId: c.id,
                    patientName: c.patientName,
                    daysLater: 21,
                    scene:
                        "You are paged to the ED. Marcus collapsed during another practice. CPR was initiated on the court.",
                    parentDialogue:
                        "\u201CYou said he could keep playing. Why did you say he could keep playing?\u201D",
                    findings: [
                        "ROSC after 6 minutes of CPR and one shock",
                        "Post-arrest ECG: LVH with lateral T-wave inversions (unchanged)",
                        "Echo: unchanged asymmetric septal hypertrophy",
                    ],
                    outcome:
                        "Missed diagnosis led to a preventable arrest. This is the counterfactual weight of exercise restriction.",
                    consequence: "warning",
                });
            }
        }

        if (c.id === "case-vasovagal" && overOrdered.length > 0) {
            followUps.push({
                caseId: c.id,
                patientName: c.patientName,
                daysLater: 14,
                scene:
                    "Ava returns anxious. She stopped running because you ordered an echo and she thought that meant something was wrong. Her father is upset.",
                parentDialogue:
                    "\u201CThe echo was normal. Was it necessary? She hasn't run in two weeks and the team benched her.\u201D",
                findings: [
                    "Normal echocardiogram",
                    "Deconditioning secondary to unnecessary restriction",
                    "Family anxiety about 'heart disease' despite normal results",
                ],
                outcome:
                    "Downstream cost of unnecessary imaging: iatrogenic anxiety and inappropriate activity restriction.",
                consequence: "warning",
            });
        }

        if (c.id === "case-innocent-murmur" && overOrdered.length > 0) {
            followUps.push({
                caseId: c.id,
                patientName: c.patientName,
                daysLater: 30,
                scene:
                    "Liam's mother returns anxious. She has been avoiding play dates because she is worried about his 'heart problem.'",
                parentDialogue:
                    "\u201CThe echo was normal but I still feel scared. Is it really nothing?\u201D",
                findings: [
                    "Normal echo",
                    "Family anxiety and behavior change from unnecessary workup",
                ],
                outcome:
                    "You demonstrated that ordering unnecessary tests teaches families that the finding is scary.",
                consequence: "warning",
            });
        }

        if (c.id === "case-wpw") {
            followUps.push({
                caseId: c.id,
                patientName: c.patientName,
                daysLater: 45,
                scene:
                    "Sofia is back after her EP consult. She had a successful ablation and hasn't had an episode since.",
                parentDialogue:
                    "\u201CEP said the accessory pathway was posterior. She is cured. She goes back to soccer next week.\u201D",
                findings: [
                    "Post-ablation ECG normalized — no delta wave",
                    "No recurrent SVT",
                    "Full activity clearance",
                ],
                outcome:
                    "A well-handled referral pathway; ablation is often curative for accessory-pathway SVT.",
                consequence: "good",
            });
        }

        if (c.id === "case-myocarditis" && dxCorrect) {
            followUps.push({
                caseId: c.id,
                patientName: c.patientName,
                daysLater: 90,
                scene:
                    "Ethan returns to the outpatient CV clinic three months after discharge. He looks well.",
                parentDialogue:
                    "\u201CThe cardiac MRI was clean at follow-up. They said his function normalized.\u201D",
                findings: [
                    "LVEF normalized to 62%",
                    "No arrhythmia on Holter",
                    "Gradual return-to-play protocol underway",
                ],
                outcome:
                    "Correct admission and monitoring preserved recovery potential. Return-to-play should be staged.",
                consequence: "good",
            });
        }

        if (c.id === "case-longqt") {
            if (dxCorrect) {
                followUps.push({
                    caseId: c.id,
                    patientName: c.patientName,
                    daysLater: 60,
                    scene:
                        "Maya returns from EP. Her mother says quietly, 'I keep thinking about my sister.'",
                    parentDialogue:
                        "\u201CShe's on a beta-blocker. Her brother is being screened. They said her sister's drowning was probably the same thing.\u201D",
                    findings: [
                        "Genetic testing: KCNQ1 pathogenic variant (LQT1)",
                        "On propranolol",
                        "Swimming permanently restricted",
                        "Sister's death case retrospectively attributed to the family channelopathy",
                    ],
                    outcome:
                        "Correct recognition may have altered outcomes for two additional family members. This is why we screen.",
                    consequence: "good",
                });
            } else {
                followUps.push({
                    caseId: c.id,
                    patientName: c.patientName,
                    daysLater: 40,
                    scene:
                        "You are paged — Maya is in the ED after another event, this time not survived without CPR at the pool deck.",
                    parentDialogue:
                        "\u201CShe was cleared to swim again. Why was she cleared?\u201D",
                    findings: [
                        "Cardiac arrest with ROSC after 4 minutes CPR",
                        "ED ECG: QTc 528 ms",
                        "Now on beta-blocker and pending ICD",
                    ],
                    outcome:
                        "Missing the trigger + family history + medication contribution had a preventable, near-fatal downstream cost.",
                    consequence: "warning",
                });
            }
        }

        if (c.id === "case-coarctation") {
            const gotFemorals = attempt.performedExamActions.some((a) => a.startsWith("femoralPulses") || a === "fourLimbBP");
            if (dxCorrect && gotFemorals) {
                followUps.push({
                    caseId: c.id,
                    patientName: c.patientName,
                    daysLater: 75,
                    scene:
                        "Diego returns after successful percutaneous coarctation intervention. His BP is normal in all four limbs.",
                    parentDialogue:
                        "\u201CHis PE cramps are gone. First time in a year he could finish the mile without stopping.\u201D",
                    findings: [
                        "Post-intervention peak gradient 6 mmHg",
                        "Four-limb BP now symmetric",
                        "Family screening: paternal uncle's bicuspid AV noted; family echo ordered",
                    ],
                    outcome: "The femoral pulse exam changed a life. Habit reinforced.",
                    consequence: "good",
                });
            } else {
                followUps.push({
                    caseId: c.id,
                    patientName: c.patientName,
                    daysLater: 90,
                    scene:
                        "Diego's pediatrician calls: BP still 150s despite two antihypertensives.",
                    parentDialogue:
                        "\u201CWe've been giving the meds. Nothing helps. Should we see cardiology after all?\u201D",
                    findings: [
                        "Persistent HTN despite therapy",
                        "Coarctation still not addressed",
                        "Continued LVH by ECG",
                    ],
                    outcome:
                        "Anatomic hypertension does not respond to antihypertensives. Femoral pulses matter.",
                    consequence: "warning",
                });
            }
        }

        if (missedRedFlags.length > 0 && dxCorrect) {
            followUps.push({
                caseId: c.id,
                patientName: c.patientName,
                daysLater: 7,
                scene: `The attending stops you in the hallway with the ${c.patientName} chart in hand.`,
                parentDialogue: `\u201CYou got the diagnosis right, but you didn't ask about ${missedRedFlags.length} key thing${
                    missedRedFlags.length === 1 ? "" : "s"
                }. On a slightly different presentation that would have burned you.\u201D`,
                findings: ["Diagnosis correct, information gathering incomplete", "Attending flagged for teaching moment"],
                outcome: "Correct outcome, incomplete process. Habits compound — build the reflex now.",
                consequence: "neutral",
            });
        }
    }

    return followUps;
}
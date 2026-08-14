export interface CapstonePatient {
  id: string;
  location: string;
  label: string;
  summary: string;
  urgency: "critical" | "urgent" | "routine";
  correctFirst?: boolean;
  correctOrder?: number;
  debrief: string;
}

export const CAPSTONE_PATIENTS: CapstonePatient[] = [
  {
    id: "cap-picu",
    location: "PICU Room 4B",
    label: "PICU — postop tachyarrhythmia",
    summary: "Recent Tetralogy repair, HR 220s, hypotensive despite bolus. Nurse just paged.",
    urgency: "critical",
    correctFirst: true,
    correctOrder: 1,
    debrief: "Hemodynamic compromise with tachyarrhythmia in a postop congenital patient is the correct first stop. Any delay risks cardiac arrest.",
  },
  {
    id: "cap-nicu",
    location: "NICU Bed 12",
    label: "NICU — desaturating newborn",
    summary: "Term baby, SpO₂ falling from 82 to 68% overnight, PGE1 running. Fellow at bedside.",
    urgency: "urgent",
    correctOrder: 2,
    debrief: "Second stop. Fellow is already at the bedside; you should be there quickly, but the PICU patient is more unstable in the moment.",
  },
  {
    id: "cap-clinic",
    location: "Clinic Room 3",
    label: "Clinic — exertional syncope teen",
    summary: "14 y/o waiting to be seen with mid-exertional syncope. Family is here.",
    urgency: "urgent",
    correctOrder: 3,
    debrief: "Important, but he is stable, in a room, and not deteriorating. See him after the two unstable patients.",
  },
  {
    id: "cap-followup",
    location: "Workroom message",
    label: "Follow-up visit — Sofia (WPW post-ablation)",
    summary: "Post-ablation follow-up in 20 minutes. Doing well by report.",
    urgency: "routine",
    correctOrder: 4,
    debrief: "Routine, wait. Reschedule if needed — clinical acuity takes precedence.",
  },
];

export const CAPSTONE_TEACHING = `The point of the capstone is prioritization. Every hospital day looks like this: multiple patients competing for your attention, with different levels of instability. The correct sequence is: critically unstable first (PICU tachyarrhythmia), then desaturating newborn (fellow already there), then the stable clinic patient with a red flag, then the routine follow-up.`;

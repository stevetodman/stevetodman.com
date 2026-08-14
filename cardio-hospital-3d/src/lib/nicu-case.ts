export interface NicuStep {
  id: string;
  label: string;
  detail: string;
  ductus: "closing" | "open" | "reopening";
  spo2Pre: number;
  spo2Post: number;
  narration: string;
}

export const NICU_STEPS: NicuStep[] = [
  {
    id: "arrival",
    label: "Arrival at bedside",
    detail: "Term newborn, day of life 1, cyanotic despite good respiratory effort. Pre-ductal SpO₂ 68%, post-ductal 66%. Otherwise vigorous.",
    ductus: "closing",
    spo2Pre: 68,
    spo2Post: 66,
    narration: "The baby looks blue. Respiratory effort is unlabored. That mismatch — profound cyanosis without respiratory distress — is the tell.",
  },
  {
    id: "pre-post",
    label: "Check pre- and post-ductal saturations",
    detail: "Right-hand SpO₂ 68%. Right-foot SpO₂ 66%. Nearly equal (no reversed differential). Consistent with TGA rather than a critical LSOL lesion.",
    ductus: "closing",
    spo2Pre: 68,
    spo2Post: 66,
    narration: "In TGA, mixing depends on shunts. Without a large PDA or ASD, the parallel circulations don’t exchange oxygen.",
  },
  {
    id: "echo",
    label: "Bedside echocardiogram",
    detail: "Parallel great arteries: aorta arises from the RV, PA from the LV. Small PFO, closing PDA. Diagnosis: D-TGA.",
    ductus: "closing",
    spo2Pre: 62,
    spo2Post: 60,
    narration: "You can see the two great arteries running in parallel rather than crossing. That’s D-transposition.",
  },
  {
    id: "pge",
    label: "Start Prostaglandin E1 infusion",
    detail: "PGE1 0.05 mcg/kg/min IV. Purpose: reopen and maintain the ductus arteriosus to permit mixing.",
    ductus: "reopening",
    spo2Pre: 78,
    spo2Post: 82,
    narration: "PGE1 relaxes the ductal smooth muscle. Watch the saturations climb as mixing improves.",
  },
  {
    id: "septostomy",
    label: "Balloon atrial septostomy in cath lab",
    detail: "A catheter is advanced across the PFO, balloon inflated, and pulled back to enlarge the atrial-level communication. Mixing improves dramatically.",
    ductus: "open",
    spo2Pre: 88,
    spo2Post: 88,
    narration: "Atrial-level mixing is the stable long-term mixing site until surgery. Pre/post saturations are now essentially equal and high 80s.",
  },
  {
    id: "switch",
    label: "Arterial switch operation (days later)",
    detail: "The great arteries are transected above the valves, switched, and coronaries reimplanted. Post-op the anatomy is corrected.",
    ductus: "open",
    spo2Pre: 98,
    spo2Post: 98,
    narration: "The child returns to the CICU with normal-in-series circulation. You’ll follow him longitudinally in later cases.",
  },
];

export const NICU_TEACHING = `Cyanosis without respiratory distress in a newborn = suspect ductal-dependent congenital heart disease. TGA specifically depends on MIXING (PDA and PFO/ASD) rather than on the direction of ductal flow. PGE1 first, echo confirmation, urgent cardiology, and often balloon atrial septostomy before the arterial switch.`;

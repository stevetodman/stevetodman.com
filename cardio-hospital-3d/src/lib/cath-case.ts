export interface CathPressure {
  site: string;
  o2Sat: number;
  pressure: string;
  highlight?: boolean;
}

export const CATH_CASE = {
  id: "case-cath-asd",
  patient: "Priya Nair",
  age: 6,
  diagnosis: "Secundum atrial septal defect (ASD) with significant left-to-right shunt",
  scenario: "6-year-old with a fixed split S2 and RV heave. Echo showed a large secundum ASD. You are observing (and later participating in) the diagnostic catheterization.",
  goals: [
    "Confirm the anatomy and shunt magnitude",
    "Measure pulmonary vascular resistance",
    "Determine candidacy for device closure vs surgical closure",
  ],
  pressures: [
    { site: "SVC", o2Sat: 71, pressure: "a5 v3 mean 3" },
    { site: "IVC", o2Sat: 74, pressure: "a5 v3 mean 3" },
    { site: "RA", o2Sat: 87, pressure: "a5 v3 mean 4", highlight: true },
    { site: "RV", o2Sat: 87, pressure: "38 / 4 (edp 4)" },
    { site: "PA", o2Sat: 87, pressure: "36 / 14 mean 22", highlight: true },
    { site: "PCW", o2Sat: 98, pressure: "mean 8" },
    { site: "LV", o2Sat: 98, pressure: "104 / 8" },
    { site: "Ao", o2Sat: 98, pressure: "104 / 62 mean 76" },
  ] as CathPressure[],
  truth: {
    qpQs: 2.4,
    pvrWoodUnitsM2: 1.8,
    recommendation: "Percutaneous device closure is appropriate: shunt is significant, PVR is low, and anatomy is favorable.",
  },
  teaching: "Step-up in oxygen saturation from mixed venous (~72%) to RA (87%) localizes a left-to-right shunt at the atrial level. Qp:Qs > 1.5 with low PVR supports closure. Device closure is chosen when the rim of tissue around the ASD is adequate; surgical closure otherwise.",
};

export interface MriSlice {
  z: number;
  label: string;
  keyFinding?: string;
  vessels: {
    rightArch: boolean;
    leftArch: boolean;
    tracheaCompressed: boolean;
  };
}

export const MRI_SLICES: MriSlice[] = [
  { z: 0, label: "Thoracic inlet", vessels: { rightArch: true, leftArch: true, tracheaCompressed: false } },
  { z: 1, label: "Upper mediastinum", keyFinding: "Two arches identified encircling the airway", vessels: { rightArch: true, leftArch: true, tracheaCompressed: true } },
  { z: 2, label: "Aortic arch level", keyFinding: "Complete vascular ring: dominant right + smaller left arch", vessels: { rightArch: true, leftArch: true, tracheaCompressed: true } },
  { z: 3, label: "Carina", keyFinding: "Persistent tracheal narrowing distal to the ring", vessels: { rightArch: false, leftArch: false, tracheaCompressed: true } },
  { z: 4, label: "Descending aorta", vessels: { rightArch: false, leftArch: false, tracheaCompressed: false } },
];

export const MRI_HISTORY = {
  patient: "Ellie Vaughn",
  age: 2,
  sex: "F" as const,
  chief: "Noisy breathing since infancy, recurrent 'croup,' and choking with solid foods.",
  referral: "Referred by pulmonology after two episodes of stridor requiring ED visits. Barium swallow suggested a posterior indentation on the esophagus.",
};

export const MRI_ANATOMY_LABELS: { id: string; label: string; detail: string }[] = [
  { id: "trachea", label: "Trachea", detail: "The airway sits centrally within the ring. Note the anterior indentation from the right arch and posterior from the descending aorta." },
  { id: "esophagus", label: "Esophagus", detail: "Immediately posterior to the trachea. Compression here explains the choking on solids and the barium swallow indentation." },
  { id: "right-arch", label: "Right (dominant) aortic arch", detail: "Passes anterior and to the right of the trachea. In a double aortic arch, this is typically the larger of the two." },
  { id: "left-arch", label: "Left (smaller) aortic arch", detail: "Passes anterior and to the left, then joins the right arch posteriorly to form a complete ring around the trachea and esophagus." },
  { id: "descending-aorta", label: "Descending aorta", detail: "Continues inferiorly on the left. The junction posteriorly closes the ring." },
];

export const MRI_TEACHING = `A complete vascular ring — most commonly a double aortic arch — encircles both the trachea AND esophagus. The clinical clue is stridor + dysphagia ("choking on solids") in a young child, often misdiagnosed as recurrent croup or reflux. Cross-sectional imaging is diagnostic; surgical division of the smaller arch is curative.`;

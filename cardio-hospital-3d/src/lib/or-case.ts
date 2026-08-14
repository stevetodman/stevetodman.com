export interface OrStep {
  label: string;
  detail: string;
  anatomyNote: string;
  circulationChange: string;
}

export const OR_CASE = {
  id: "case-or-tof",
  patient: "Noah Williams",
  age: 0.75,
  diagnosis: "Tetralogy of Fallot (TOF) — complete surgical repair",
  scenario: "9-month-old with TOF is on cardiopulmonary bypass. Dr. Bello is opening the RVOT. You are observing as consultant.",
  steps: [
    {
      label: "1. On cardiopulmonary bypass, atriotomy",
      detail: "Right atrial approach exposes the tricuspid valve and VSD from the RA.",
      anatomyNote: "Large peri-membranous VSD visualized. Overriding aorta above the septal defect.",
      circulationChange: "Systemic and pulmonary circuits supported by CPB.",
    },
    {
      label: "2. VSD patch closure",
      detail: "Bovine pericardial patch sutured to close the peri-membranous VSD, avoiding the conduction system.",
      anatomyNote: "Overriding aorta now committed to the LV — aortic root no longer straddles the septum.",
      circulationChange: "Systemic and pulmonary circulations separated. No more mixing at ventricular level.",
    },
    {
      label: "3. RVOT muscle resection",
      detail: "Hypertrophied infundibular muscle is resected to relieve subvalvular obstruction.",
      anatomyNote: "Subvalvular RVOT diameter increases.",
      circulationChange: "Reduced dynamic RVOT gradient; forward flow improves.",
    },
    {
      label: "4. Pulmonary valve / annulus enlargement",
      detail: "If annulus is small, transannular patch used; if adequate, valve-sparing approach.",
      anatomyNote: "Pulmonary valve preserved when possible — impacts long-term PR burden.",
      circulationChange: "Relieves fixed obstruction. Trade-off: transannular patch → chronic PR.",
    },
    {
      label: "5. Weaning from bypass",
      detail: "Rewarm, de-air, wean from CPB. Assess RV function and residual shunt with TEE.",
      anatomyNote: "Confirm no residual VSD; RV function; PR grade.",
      circulationChange: "RV pressure now approaches normal; systemic circulation independent.",
    },
  ] as OrStep[],
  teaching: "TOF repair does two things: closes the VSD (separating circulations) and relieves RVOT obstruction. Residual PR from a transannular patch is the dominant long-term issue and drives the need for future pulmonary valve replacement.",
};

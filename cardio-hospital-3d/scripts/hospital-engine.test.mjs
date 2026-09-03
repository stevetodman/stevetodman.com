import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialHospitalState,
  getActiveEncounter,
  getHospitalWorkflowPhase,
  reduceHospitalState,
} from "../src/lib/hospital-engine.ts";

function apply(state, ...events) {
  return events.reduce((next, event) => reduceHospitalState(next, event), state);
}

test("canonical workflow survives completion and replay without overwriting the prior encounter", () => {
  let hospital = createInitialHospitalState({ startMinute: 462, location: "workroom" });

  hospital = apply(
    hospital,
    { type: "SHIFT_STARTED", shiftId: "shift-test", day: 1, startMinute: 462, location: "workroom" },
    { type: "PATIENT_ARRIVED", patientId: "patient-case-hcm", caseId: "case-hcm", location: "clinic-room-3" },
    { type: "TASK_CREATED", taskId: "task-case-hcm", kind: "consult", caseId: "case-hcm", patientId: "patient-case-hcm", location: "clinic-room-3" }
  );

  assert.equal(getHospitalWorkflowPhase(hospital), "arrival");
  assert.equal(hospital.patients["patient-case-hcm"].disposition, "waiting");
  assert.equal(hospital.tasks["task-case-hcm"].status, "available");

  hospital = reduceHospitalState(hospital, { type: "TASK_ASSIGNED", taskId: "task-case-hcm" });
  assert.equal(getHospitalWorkflowPhase(hospital), "assigned");

  hospital = reduceHospitalState(hospital, {
    type: "ENCOUNTER_STARTED",
    encounterId: "encounter-case-hcm-1",
    taskId: "task-case-hcm",
    patientId: "patient-case-hcm",
    caseId: "case-hcm",
    location: "clinic-room-3",
  });
  hospital = reduceHospitalState(hospital, {
    type: "CONFIDENTIAL_INTERVIEW_STARTED",
    encounterId: "encounter-case-hcm-1",
  });

  assert.equal(getHospitalWorkflowPhase(hospital), "encounter");
  assert.equal(getActiveEncounter(hospital)?.encounterId, "encounter-case-hcm-1");
  assert.equal(hospital.patients["patient-case-hcm"].disposition, "in-encounter");
  assert.equal(hospital.encounters["encounter-case-hcm-1"].confidentialInterviewDone, true);

  hospital = reduceHospitalState(hospital, {
    type: "ENCOUNTER_COMPLETED",
    encounterId: "encounter-case-hcm-1",
  });

  assert.equal(getHospitalWorkflowPhase(hospital), "complete");
  assert.equal(getActiveEncounter(hospital), undefined);
  assert.equal(hospital.encounters["encounter-case-hcm-1"].stage, "complete");
  assert.equal(hospital.patients["patient-case-hcm"].disposition, "complete");
  assert.equal(hospital.tasks["task-case-hcm"].status, "complete");

  hospital = apply(
    hospital,
    { type: "TASK_ASSIGNED", taskId: "task-case-hcm" },
    {
      type: "ENCOUNTER_STARTED",
      encounterId: "encounter-case-hcm-2",
      taskId: "task-case-hcm",
      patientId: "patient-case-hcm",
      caseId: "case-hcm",
      location: "clinic-room-3",
    }
  );

  assert.equal(getHospitalWorkflowPhase(hospital), "encounter");
  assert.equal(getActiveEncounter(hospital)?.encounterId, "encounter-case-hcm-2");
  assert.equal(hospital.encounters["encounter-case-hcm-1"].stage, "complete");
  assert.equal(hospital.encounters["encounter-case-hcm-2"].stage, "history");
  assert.equal(hospital.encounters["encounter-case-hcm-2"].confidentialInterviewDone, false);
  assert.equal(hospital.patients["patient-case-hcm"].activeEncounterId, "encounter-case-hcm-2");
  assert.equal(hospital.tasks["task-case-hcm"].status, "in-progress");
  assert.equal(hospital.timeline.at(-1).sequence, hospital.revision);
});

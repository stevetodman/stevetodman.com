import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../src/lib/cases-data.ts";
import { VASOVAGAL_TEACHING_POLICY } from "../src/lib/clinical-policy/vasovagal-2026.ts";
import {
  createInitialHospitalState,
  getActiveEncounter,
  getOpenTasks,
  reduceHospitalState,
} from "../src/lib/hospital-engine.ts";
import { scoreCanonicalEncounter } from "../src/lib/hospital-scoring.ts";
import { VASOVAGAL_CONSULT_PAGE_ID } from "../src/lib/hospital-pages.ts";
import { reconcileHospitalSchedule } from "../src/lib/hospital-schedule.ts";
import { WORKROOM_HANDOFF_TASK_ID } from "../src/lib/hospital-work.ts";
import {
  HCM_CASE_ID,
  HCM_PATIENT_ID,
  HCM_ROOM,
  HCM_TASK_ID,
  VASOVAGAL_CASE_ID,
  VASOVAGAL_PATIENT_ID,
  VASOVAGAL_ROOM,
  VASOVAGAL_TASK_ID,
} from "../src/lib/scenario-ids.ts";

const vasovagalCase = CASES.find((clinicalCase) => clinicalCase.id === VASOVAGAL_CASE_ID);

function apply(state, ...events) {
  return events.reduce((next, event) => reduceHospitalState(next, event), state);
}

test("second consult releases only after the first HCM consult completes, remains idempotent, and does not consume competing work", () => {
  let hospital = createInitialHospitalState({ startMinute: 462, location: "workroom" });
  hospital = apply(
    hospital,
    { type: "SHIFT_STARTED", shiftId: "shift-second-consult", day: 1, startMinute: 462, location: "workroom" },
    { type: "PATIENT_ARRIVED", patientId: HCM_PATIENT_ID, caseId: HCM_CASE_ID, location: HCM_ROOM },
    { type: "TASK_CREATED", taskId: HCM_TASK_ID, kind: "consult", caseId: HCM_CASE_ID, patientId: HCM_PATIENT_ID, location: HCM_ROOM, priority: "urgent" }
  );
  hospital = reconcileHospitalSchedule(hospital);

  assert.equal(Boolean(hospital.tasks[VASOVAGAL_TASK_ID]), false);
  assert.equal(Boolean(hospital.patients[VASOVAGAL_PATIENT_ID]), false);
  assert.equal(hospital.pager.receivedIds.includes(VASOVAGAL_CONSULT_PAGE_ID), false);
  assert.equal(hospital.tasks[WORKROOM_HANDOFF_TASK_ID].status, "available");

  hospital = apply(
    hospital,
    { type: "TASK_ASSIGNED", taskId: HCM_TASK_ID },
    { type: "ENCOUNTER_STARTED", encounterId: "encounter-case-hcm-1", taskId: HCM_TASK_ID, patientId: HCM_PATIENT_ID, caseId: HCM_CASE_ID, location: HCM_ROOM },
    { type: "ENCOUNTER_COMPLETED", encounterId: "encounter-case-hcm-1" }
  );
  hospital = reconcileHospitalSchedule(hospital);

  assert.equal(hospital.tasks[HCM_TASK_ID].status, "complete");
  assert.equal(hospital.tasks[VASOVAGAL_TASK_ID].status, "available");
  assert.equal(hospital.tasks[VASOVAGAL_TASK_ID].priority, "routine");
  assert.equal(hospital.tasks[VASOVAGAL_TASK_ID].location, VASOVAGAL_ROOM);
  assert.equal(hospital.patients[VASOVAGAL_PATIENT_ID].disposition, "waiting");
  assert.equal(hospital.patients[VASOVAGAL_PATIENT_ID].currentLocation, VASOVAGAL_ROOM);
  assert.equal(hospital.pager.receivedIds.includes(VASOVAGAL_CONSULT_PAGE_ID), true);
  assert.equal(hospital.tasks[WORKROOM_HANDOFF_TASK_ID].status, "available");
  assert.deepEqual(
    getOpenTasks(hospital).map((task) => task.taskId),
    [WORKROOM_HANDOFF_TASK_ID, VASOVAGAL_TASK_ID]
  );

  const revisionAfterRelease = hospital.revision;
  const timelineAfterRelease = hospital.timeline.length;
  hospital = reconcileHospitalSchedule(hospital);
  assert.equal(hospital.revision, revisionAfterRelease);
  assert.equal(hospital.timeline.length, timelineAfterRelease);

  hospital = apply(
    hospital,
    { type: "TASK_ASSIGNED", taskId: VASOVAGAL_TASK_ID },
    { type: "ENCOUNTER_STARTED", encounterId: "encounter-case-vasovagal-1", taskId: VASOVAGAL_TASK_ID, patientId: VASOVAGAL_PATIENT_ID, caseId: VASOVAGAL_CASE_ID, location: VASOVAGAL_ROOM },
    { type: "CONFIDENTIAL_INTERVIEW_STARTED", encounterId: "encounter-case-vasovagal-1" },
    { type: "ENCOUNTER_COMPLETED", encounterId: "encounter-case-vasovagal-1" }
  );

  assert.equal(hospital.encounters["encounter-case-hcm-1"].stage, "complete");
  assert.equal(hospital.encounters["encounter-case-vasovagal-1"].stage, "complete");
  assert.equal(hospital.patients[VASOVAGAL_PATIENT_ID].disposition, "complete");
  assert.equal(hospital.tasks[WORKROOM_HANDOFF_TASK_ID].status, "available");
  assert.deepEqual(getOpenTasks(hospital).map((task) => task.taskId), [WORKROOM_HANDOFF_TASK_ID]);

  hospital = apply(
    hospital,
    { type: "TASK_ASSIGNED", taskId: VASOVAGAL_TASK_ID },
    { type: "ENCOUNTER_STARTED", encounterId: "encounter-case-vasovagal-2", taskId: VASOVAGAL_TASK_ID, patientId: VASOVAGAL_PATIENT_ID, caseId: VASOVAGAL_CASE_ID, location: VASOVAGAL_ROOM }
  );
  assert.equal(getActiveEncounter(hospital)?.encounterId, "encounter-case-vasovagal-2");
  assert.equal(hospital.encounters["encounter-case-vasovagal-1"].stage, "complete");
  assert.equal(hospital.encounters["encounter-case-vasovagal-2"].stage, "history");
  assert.equal(hospital.encounters["encounter-case-hcm-1"].stage, "complete");
  assert.equal(hospital.tasks[WORKROOM_HANDOFF_TASK_ID].status, "available");
});

test("Ava scoring uses the physician-approved phenotype instead of legacy exact-match teaching", () => {
  assert.ok(vasovagalCase);
  let hospital = createInitialHospitalState({ startMinute: 500, location: VASOVAGAL_ROOM });
  hospital = apply(
    hospital,
    { type: "SHIFT_STARTED", shiftId: "shift-ava-score", day: 1, startMinute: 500, location: VASOVAGAL_ROOM },
    { type: "PATIENT_ARRIVED", patientId: VASOVAGAL_PATIENT_ID, caseId: VASOVAGAL_CASE_ID, location: VASOVAGAL_ROOM },
    { type: "TASK_CREATED", taskId: VASOVAGAL_TASK_ID, kind: "consult", caseId: VASOVAGAL_CASE_ID, patientId: VASOVAGAL_PATIENT_ID, location: VASOVAGAL_ROOM, priority: "routine" },
    { type: "TASK_ASSIGNED", taskId: VASOVAGAL_TASK_ID },
    { type: "ENCOUNTER_STARTED", encounterId: "encounter-ava-score", taskId: VASOVAGAL_TASK_ID, patientId: VASOVAGAL_PATIENT_ID, caseId: VASOVAGAL_CASE_ID, location: VASOVAGAL_ROOM },
    { type: "CONFIDENTIAL_INTERVIEW_STARTED", encounterId: "encounter-ava-score" }
  );

  for (const key of VASOVAGAL_TEACHING_POLICY.requiredHistoryKeys) {
    hospital = reduceHospitalState(hospital, { type: "HISTORY_ASKED", encounterId: "encounter-ava-score", key });
  }
  hospital = apply(
    hospital,
    { type: "EXAM_PERFORMED", encounterId: "encounter-ava-score", action: "general" },
    { type: "EXAM_PERFORMED", encounterId: "encounter-ava-score", action: "vitals" },
    { type: "EXAM_PERFORMED", encounterId: "encounter-ava-score", action: "auscultation:LLSB" },
    { type: "EXAM_PERFORMED", encounterId: "encounter-ava-score", action: "femoralPulses" },
    { type: "TEST_ORDERED", encounterId: "encounter-ava-score", test: "ECG" },
    { type: "RESULT_REVIEWED", encounterId: "encounter-ava-score", result: "ECG" },
    { type: "ECG_INTERPRETATION_COMMITTED", encounterId: "encounter-ava-score", selectedFindings: ["athletic_sinus_bradycardia", "normal_intervals", "normal_repolarization"], score: 100 },
    { type: "TEST_ORDERED", encounterId: "encounter-ava-score", test: "Echocardiogram" },
    { type: "RESULT_REVIEWED", encounterId: "encounter-ava-score", result: "Echocardiogram" },
    { type: "DIAGNOSIS_COMMITTED", encounterId: "encounter-ava-score", diagnosis: VASOVAGAL_TEACHING_POLICY.preferredDiagnosis },
    { type: "MANAGEMENT_SELECTED", encounterId: "encounter-ava-score", management: [...VASOVAGAL_TEACHING_POLICY.correctManagement] }
  );

  const encounter = hospital.encounters["encounter-ava-score"];
  const policy = {
    appropriateTests: VASOVAGAL_TEACHING_POLICY.requiredInitialTests,
    unnecessaryTests: [],
    correctManagement: VASOVAGAL_TEACHING_POLICY.correctManagement,
    acceptedDiagnoses: VASOVAGAL_TEACHING_POLICY.acceptableDiagnosisLabels,
    requiredHistoryKeys: VASOVAGAL_TEACHING_POLICY.requiredHistoryKeys,
  };
  const score = scoreCanonicalEncounter(encounter, vasovagalCase, policy);

  assert.equal(score.diagnosisCorrect, true);
  assert.deepEqual(score.missedHistoryKeys, []);
  assert.deepEqual(score.unnecessaryTests, []);
  assert.equal(score.dimensions.History, 100);
  assert.equal(score.dimensions["Test Selection"], 100);
  assert.ok(score.dimensions.Efficiency < 100, "non-routine echo should affect efficiency without being mislabeled universally unnecessary");

  const legacyLabelScore = scoreCanonicalEncounter(
    { ...encounter, diagnosis: "Post-exertional vasovagal syncope" },
    vasovagalCase,
    policy
  );
  assert.equal(legacyLabelScore.diagnosisCorrect, true);

  const dehydrationOnlyScore = scoreCanonicalEncounter(
    { ...encounter, diagnosis: "Dehydration" },
    vasovagalCase,
    policy
  );
  assert.equal(dehydrationOnlyScore.diagnosisCorrect, false);
});

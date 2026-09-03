import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialHospitalState,
  getActiveEncounter,
  getHospitalWorkflowPhase,
  getOpenTasks,
  hasTaskMissedDeadline,
  isTaskOverdue,
  reduceHospitalState,
} from "../src/lib/hospital-engine.ts";
import { reconcileHospitalConsequences } from "../src/lib/hospital-consequences.ts";
import { migratePersistedHospitalState } from "../src/lib/hospital-persistence.ts";
import { reconcileHospitalSchedule } from "../src/lib/hospital-schedule.ts";
import { WORKROOM_HANDOFF_DURATION_MINUTES } from "../src/lib/hospital-work.ts";

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
  assert.equal(hospital.tasks["task-case-hcm"].completedAtMinute, 462);

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
  assert.equal(hospital.tasks["task-case-hcm"].completedAtMinute, undefined);
  assert.equal(hospital.timeline.at(-1).sequence, hospital.revision);
});

test("pager receipt and acknowledgement are idempotent canonical events", () => {
  let hospital = createInitialHospitalState({ startMinute: 462, location: "workroom" });
  hospital = reduceHospitalState(hospital, { type: "PAGE_RECEIVED", pageId: "service-pager-active" });
  const revisionAfterReceipt = hospital.revision;
  const timelineAfterReceipt = hospital.timeline.length;

  hospital = reduceHospitalState(hospital, { type: "PAGE_RECEIVED", pageId: "service-pager-active" });
  assert.equal(hospital.revision, revisionAfterReceipt);
  assert.equal(hospital.timeline.length, timelineAfterReceipt);
  assert.deepEqual(hospital.pager.receivedIds, ["service-pager-active"]);

  hospital = reduceHospitalState(hospital, { type: "PAGE_ACKNOWLEDGED", pageId: "service-pager-active" });
  const revisionAfterAcknowledge = hospital.revision;
  const timelineAfterAcknowledge = hospital.timeline.length;

  hospital = reduceHospitalState(hospital, { type: "PAGE_ACKNOWLEDGED", pageId: "service-pager-active" });
  assert.equal(hospital.revision, revisionAfterAcknowledge);
  assert.equal(hospital.timeline.length, timelineAfterAcknowledge);
  assert.deepEqual(hospital.pager.acknowledgedIds, ["service-pager-active"]);
});

test("work tasks can compete with the consult without hijacking the clinical workflow selector", () => {
  let hospital = createInitialHospitalState({ startMinute: 462, location: "workroom" });
  hospital = reduceHospitalState(hospital, {
    type: "TASK_CREATED",
    taskId: "work-overnight-handoff",
    kind: "work",
    location: "workroom",
  });

  assert.equal(getHospitalWorkflowPhase(hospital), "arrival");
  assert.equal(getOpenTasks(hospital).length, 1);
  assert.equal(hospital.tasks["work-overnight-handoff"].status, "available");

  hospital = apply(
    hospital,
    { type: "TASK_ASSIGNED", taskId: "work-overnight-handoff" },
    { type: "TASK_STARTED", taskId: "work-overnight-handoff" },
    { type: "TASK_COMPLETED", taskId: "work-overnight-handoff" }
  );

  assert.equal(hospital.tasks["work-overnight-handoff"].status, "complete");
  assert.equal(getOpenTasks(hospital).length, 0);
  assert.equal(getHospitalWorkflowPhase(hospital), "arrival");
});

test("open tasks sort deterministically by priority, due time, creation time, and task id", () => {
  let hospital = createInitialHospitalState({ startMinute: 462, location: "workroom" });
  hospital = apply(
    hospital,
    { type: "TASK_CREATED", taskId: "routine-later", kind: "work", location: "workroom", priority: "routine", dueAtMinute: 720 },
    { type: "TASK_CREATED", taskId: "routine-sooner", kind: "work", location: "workroom", priority: "routine", dueAtMinute: 600 },
    { type: "TASK_CREATED", taskId: "urgent-z", kind: "work", location: "workroom", priority: "urgent" },
    { type: "TASK_CREATED", taskId: "urgent-a", kind: "work", location: "workroom", priority: "urgent" }
  );

  assert.deepEqual(
    getOpenTasks(hospital).map((task) => task.taskId),
    ["urgent-a", "urgent-z", "routine-sooner", "routine-later"]
  );

  hospital = reduceHospitalState(hospital, { type: "TIME_ADVANCED", minutes: 139 });
  assert.equal(hospital.shift.clockMinutes, 601);
  assert.equal(isTaskOverdue(hospital, hospital.tasks["routine-sooner"]), true);
  assert.equal(isTaskOverdue(hospital, hospital.tasks["routine-later"]), false);
});

test("scheduled hospital work releases only when canonical simulation time reaches the release time", () => {
  let hospital = createInitialHospitalState({ startMinute: 461, location: "workroom" });
  hospital = reduceHospitalState(hospital, {
    type: "SHIFT_STARTED",
    shiftId: "shift-schedule-test",
    day: 1,
    startMinute: 461,
    location: "workroom",
  });

  hospital = reconcileHospitalSchedule(hospital);
  assert.equal(hospital.pager.receivedIds.includes("overnight-handoff-review"), false);
  assert.equal(Boolean(hospital.tasks["work-overnight-handoff"]), false);

  hospital = reduceHospitalState(hospital, { type: "TIME_ADVANCED", minutes: 1 });
  hospital = reconcileHospitalSchedule(hospital);
  assert.equal(hospital.shift.clockMinutes, 462);
  assert.equal(hospital.pager.receivedIds.includes("overnight-handoff-review"), true);
  assert.equal(hospital.tasks["work-overnight-handoff"].status, "available");
  assert.equal(hospital.tasks["work-overnight-handoff"].dueAtMinute, 720);
  assert.equal(hospital.tasks["work-overnight-handoff"].durationMinutes, WORKROOM_HANDOFF_DURATION_MINUTES);

  const revisionAfterRelease = hospital.revision;
  const timelineAfterRelease = hospital.timeline.length;
  hospital = reconcileHospitalSchedule(hospital);
  assert.equal(hospital.revision, revisionAfterRelease);
  assert.equal(hospital.timeline.length, timelineAfterRelease);
});

test("work duration consumes canonical time explicitly and persists a late-completion consequence", () => {
  let hospital = createInitialHospitalState({ startMinute: 715, location: "workroom" });
  hospital = apply(
    hospital,
    { type: "SHIFT_STARTED", shiftId: "shift-duration", day: 1, startMinute: 715, location: "workroom" },
    {
      type: "TASK_CREATED",
      taskId: "work-duration-test",
      kind: "work",
      location: "workroom",
      dueAtMinute: 720,
      durationMinutes: 12,
    },
    { type: "TASK_ASSIGNED", taskId: "work-duration-test" },
    { type: "TASK_STARTED", taskId: "work-duration-test" },
    { type: "TIME_ADVANCED", minutes: 12 }
  );
  hospital = reconcileHospitalConsequences(hospital);

  assert.equal(hospital.shift.clockMinutes, 727);
  assert.equal(hospital.tasks["work-duration-test"].deadlineMissedAtMinute, 727);
  assert.equal(hasTaskMissedDeadline(hospital.tasks["work-duration-test"]), true);
  assert.equal(hospital.timeline.at(-1).event.type, "TASK_DEADLINE_MISSED");

  const revisionAfterMiss = hospital.revision;
  hospital = reconcileHospitalConsequences(hospital);
  assert.equal(hospital.revision, revisionAfterMiss);

  hospital = reduceHospitalState(hospital, { type: "TASK_COMPLETED", taskId: "work-duration-test" });
  assert.equal(hospital.tasks["work-duration-test"].status, "complete");
  assert.equal(hospital.tasks["work-duration-test"].completedAtMinute, 727);
  assert.equal(hospital.tasks["work-duration-test"].deadlineMissedAtMinute, 727);
});

test("on-time work completion does not create a missed-deadline consequence", () => {
  let hospital = createInitialHospitalState({ startMinute: 700, location: "workroom" });
  hospital = apply(
    hospital,
    { type: "SHIFT_STARTED", shiftId: "shift-on-time", day: 1, startMinute: 700, location: "workroom" },
    { type: "TASK_CREATED", taskId: "work-on-time", kind: "work", location: "workroom", dueAtMinute: 720, durationMinutes: 12 },
    { type: "TASK_ASSIGNED", taskId: "work-on-time" },
    { type: "TASK_STARTED", taskId: "work-on-time" },
    { type: "TIME_ADVANCED", minutes: 12 },
    { type: "TASK_COMPLETED", taskId: "work-on-time" }
  );
  hospital = reconcileHospitalConsequences(hospital);

  assert.equal(hospital.shift.clockMinutes, 712);
  assert.equal(hospital.tasks["work-on-time"].completedAtMinute, 712);
  assert.equal(hospital.tasks["work-on-time"].deadlineMissedAtMinute, undefined);
});

test("schema-v2 saves migrate explicitly and recover deterministic work duration", () => {
  const current = createInitialHospitalState({ startMinute: 462, location: "workroom" });
  const legacyTask = {
    taskId: "work-overnight-handoff",
    kind: "work",
    location: "workroom",
    status: "assigned",
    priority: "routine",
    createdAtMinute: 462,
    dueAtMinute: 720,
  };
  const legacyState = {
    ...current,
    schemaVersion: 2,
    tasks: { "work-overnight-handoff": legacyTask },
  };

  const migrated = migratePersistedHospitalState({ schemaVersion: 2, state: legacyState });
  assert.equal(migrated?.schemaVersion, 3);
  assert.equal(migrated?.tasks["work-overnight-handoff"].durationMinutes, WORKROOM_HANDOFF_DURATION_MINUTES);
  assert.equal(migrated?.tasks["work-overnight-handoff"].deadlineMissedAtMinute, undefined);
});

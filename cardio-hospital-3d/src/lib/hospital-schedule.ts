import { reduceHospitalState, type HospitalState, type TaskPriority } from "./hospital-engine.ts";
import { HANDOFF_REVIEW_PAGE_ID, VASOVAGAL_CONSULT_PAGE_ID } from "./hospital-pages.ts";
import {
  HCM_CASE_ID,
  HCM_TASK_ID,
  VASOVAGAL_CASE_ID,
  VASOVAGAL_PATIENT_ID,
  VASOVAGAL_ROOM,
  VASOVAGAL_TASK_ID,
} from "./scenario-ids.ts";
import { WORKROOM_HANDOFF_DURATION_MINUTES, WORKROOM_HANDOFF_TASK_ID } from "./hospital-work.ts";

interface ScheduledWorkRelease {
  scheduleId: string;
  day: number;
  releaseAtMinute: number;
  pageId: string;
  task: {
    taskId: string;
    kind: "work";
    location: string;
    priority: TaskPriority;
    dueAtMinute?: number;
    durationMinutes?: number;
  };
}

const HOSPITAL_SCHEDULE: ScheduledWorkRelease[] = [
  {
    scheduleId: "day-1-overnight-handoff",
    day: 1,
    releaseAtMinute: 7 * 60 + 42,
    pageId: HANDOFF_REVIEW_PAGE_ID,
    task: {
      taskId: WORKROOM_HANDOFF_TASK_ID,
      kind: "work",
      location: "workroom",
      priority: "routine",
      dueAtMinute: 12 * 60,
      durationMinutes: WORKROOM_HANDOFF_DURATION_MINUTES,
    },
  },
];

function reconcileSecondConsult(state: HospitalState): HospitalState {
  if (state.shift.day !== 1) return state;
  const hcmComplete = state.tasks[HCM_TASK_ID]?.status === "complete"
    || state.learner.completedCaseIds.includes(HCM_CASE_ID);
  if (!hcmComplete) return state;

  let next = state;
  if (!next.patients[VASOVAGAL_PATIENT_ID]) {
    next = reduceHospitalState(next, {
      type: "PATIENT_ARRIVED",
      patientId: VASOVAGAL_PATIENT_ID,
      caseId: VASOVAGAL_CASE_ID,
      location: VASOVAGAL_ROOM,
    });
  }
  if (!next.pager.receivedIds.includes(VASOVAGAL_CONSULT_PAGE_ID)) {
    next = reduceHospitalState(next, { type: "PAGE_RECEIVED", pageId: VASOVAGAL_CONSULT_PAGE_ID });
  }
  if (!next.tasks[VASOVAGAL_TASK_ID]) {
    next = reduceHospitalState(next, {
      type: "TASK_CREATED",
      taskId: VASOVAGAL_TASK_ID,
      kind: "consult",
      caseId: VASOVAGAL_CASE_ID,
      patientId: VASOVAGAL_PATIENT_ID,
      location: VASOVAGAL_ROOM,
      priority: "routine",
    });
  }
  return next;
}

/**
 * Materialize every scheduled or state-conditioned release that is due in
 * canonical simulation state. This function is deterministic and idempotent:
 * it never reads wall-clock time, and reducers ignore duplicate releases on
 * reload or repeated reconciliation.
 */
export function reconcileHospitalSchedule(state: HospitalState): HospitalState {
  if (state.shift.status !== "active") return state;

  let next = state;
  for (const release of HOSPITAL_SCHEDULE) {
    if (release.day !== next.shift.day || next.shift.clockMinutes < release.releaseAtMinute) continue;

    if (!next.pager.receivedIds.includes(release.pageId)) {
      next = reduceHospitalState(next, { type: "PAGE_RECEIVED", pageId: release.pageId });
    }

    if (!next.tasks[release.task.taskId]) {
      next = reduceHospitalState(next, {
        type: "TASK_CREATED",
        taskId: release.task.taskId,
        kind: release.task.kind,
        location: release.task.location,
        priority: release.task.priority,
        dueAtMinute: release.task.dueAtMinute,
        durationMinutes: release.task.durationMinutes,
      });
    }
  }

  return reconcileSecondConsult(next);
}

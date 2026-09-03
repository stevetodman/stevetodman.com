import { reduceHospitalState, type HospitalState, type TaskPriority } from "./hospital-engine";
import { HANDOFF_REVIEW_PAGE_ID } from "./hospital-pages";
import { WORKROOM_HANDOFF_TASK_ID } from "./hospital-work";

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
    },
  },
];

/**
 * Materialize every scheduled release that is due in canonical simulation time.
 * This function is deterministic and idempotent: it never reads wall-clock time,
 * and the reducer ignores page/task duplicates on reload or repeated reconciliation.
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
      });
    }
  }

  return next;
}

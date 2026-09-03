import { reduceHospitalState, type HospitalState } from "./hospital-engine.ts";

/**
 * Persist deadline consequences that are implied by canonical simulation time.
 * No wall-clock time is read. Reconciliation is idempotent because the reducer
 * refuses duplicate or premature TASK_DEADLINE_MISSED events.
 */
export function reconcileHospitalConsequences(state: HospitalState): HospitalState {
  if (state.shift.status !== "active") return state;

  let next = state;
  const tasks = Object.values(next.tasks).sort((left, right) => left.taskId.localeCompare(right.taskId));
  for (const task of tasks) {
    if (task.status === "complete" || typeof task.deadlineMissedAtMinute === "number") continue;
    if (typeof task.dueAtMinute !== "number" || next.shift.clockMinutes <= task.dueAtMinute) continue;
    next = reduceHospitalState(next, { type: "TASK_DEADLINE_MISSED", taskId: task.taskId });
  }

  return next;
}

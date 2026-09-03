import type { HospitalLocation } from "./hospital-engine";

export type WorkPriority = "routine" | "urgent";

export interface HospitalWorkDefinition {
  taskId: string;
  title: string;
  description: string;
  location: HospitalLocation;
  priority: WorkPriority;
  durationMinutes: number;
}

export const WORKROOM_HANDOFF_TASK_ID = "work-overnight-handoff";
export const WORKROOM_HANDOFF_DURATION_MINUTES = 12;

const WORK_DEFINITIONS: Record<string, HospitalWorkDefinition> = {
  [WORKROOM_HANDOFF_TASK_ID]: {
    taskId: WORKROOM_HANDOFF_TASK_ID,
    title: "Review overnight cardiology handoff",
    description: "Open the service handoff list at a team-room workstation before noon conference.",
    location: "workroom",
    priority: "routine",
    durationMinutes: WORKROOM_HANDOFF_DURATION_MINUTES,
  },
};

export function getHospitalWorkDefinition(taskId: string): HospitalWorkDefinition | undefined {
  return WORK_DEFINITIONS[taskId];
}

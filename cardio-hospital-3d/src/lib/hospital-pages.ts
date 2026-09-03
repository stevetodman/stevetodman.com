import type { HospitalLocation, HospitalState } from "./hospital-engine";
import { WORKROOM_HANDOFF_TASK_ID } from "./hospital-work";

export type HospitalPagePriority = "routine" | "urgent";

export interface HospitalPageDefinition {
  pageId: string;
  title: string;
  message: string;
  from: string;
  priority: HospitalPagePriority;
  location?: HospitalLocation;
  taskId?: string;
}

export interface ReceivedHospitalPage extends HospitalPageDefinition {
  receivedAtMinute: number;
  acknowledged: boolean;
}

export const SERVICE_PAGER_PAGE_ID = "service-pager-active";
export const HANDOFF_REVIEW_PAGE_ID = "overnight-handoff-review";

const PAGE_DEFINITIONS: Record<string, HospitalPageDefinition> = {
  [SERVICE_PAGER_PAGE_ID]: {
    pageId: SERVICE_PAGER_PAGE_ID,
    title: "Service pager active",
    message: "You are carrying the pediatric cardiology consult pager. New requests will appear here during the shift.",
    from: "Dr. Patel",
    priority: "routine",
    location: "workroom",
  },
  [HANDOFF_REVIEW_PAGE_ID]: {
    pageId: HANDOFF_REVIEW_PAGE_ID,
    title: "Overnight handoff review",
    message: "One overnight cardiology handoff item is waiting at the team-room workstation. Review the handoff before noon conference.",
    from: "Dr. Patel",
    priority: "routine",
    location: "workroom",
    taskId: WORKROOM_HANDOFF_TASK_ID,
  },
};

export function getHospitalPageDefinition(pageId: string): HospitalPageDefinition | undefined {
  return PAGE_DEFINITIONS[pageId];
}

export function getReceivedHospitalPages(state: HospitalState): ReceivedHospitalPage[] {
  const receivedAtById = new Map<string, number>();
  for (const entry of state.timeline) {
    if (entry.event.type === "PAGE_RECEIVED" && !receivedAtById.has(entry.event.pageId)) {
      receivedAtById.set(entry.event.pageId, entry.atMinute);
    }
  }

  return state.pager.receivedIds
    .map((pageId) => {
      const definition = getHospitalPageDefinition(pageId);
      if (!definition) return undefined;
      return {
        ...definition,
        receivedAtMinute: receivedAtById.get(pageId) ?? state.shift.clockMinutes,
        acknowledged: state.pager.acknowledgedIds.includes(pageId),
      };
    })
    .filter((page): page is ReceivedHospitalPage => Boolean(page))
    .sort((left, right) => right.receivedAtMinute - left.receivedAtMinute);
}

export function getUnreadPagerCount(state: HospitalState): number {
  return state.pager.receivedIds.filter((pageId) => !state.pager.acknowledgedIds.includes(pageId)).length;
}

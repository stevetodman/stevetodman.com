import type { HospitalLocation, HospitalState } from "./hospital-engine";

export type HospitalPagePriority = "routine" | "urgent";

export interface HospitalPageDefinition {
  pageId: string;
  title: string;
  message: string;
  from: string;
  priority: HospitalPagePriority;
  location?: HospitalLocation;
}

export interface ReceivedHospitalPage extends HospitalPageDefinition {
  receivedAtMinute: number;
  acknowledged: boolean;
}

export const SERVICE_PAGER_PAGE_ID = "service-pager-active";

const PAGE_DEFINITIONS: Record<string, HospitalPageDefinition> = {
  [SERVICE_PAGER_PAGE_ID]: {
    pageId: SERVICE_PAGER_PAGE_ID,
    title: "Service pager active",
    message: "You are carrying the pediatric cardiology consult pager. New requests will appear here during the shift.",
    from: "Dr. Patel",
    priority: "routine",
    location: "workroom",
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

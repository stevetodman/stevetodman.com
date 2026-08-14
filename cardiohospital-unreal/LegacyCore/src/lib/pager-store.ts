import { memory } from "./memory-store";

export interface PagerEvent {
  id: string;
  title: string;
  message: string;
  from: string;
  time: string;
  path?: string;
  read: boolean;
  urgent?: boolean;
}

const KEY = "pager";

export function getPagerEvents(): PagerEvent[] {
  return memory.ensure<PagerEvent[]>(KEY, () => [
    {
      id: "nicu-cyanosis",
      title: "NICU CONSULT — URGENT",
      message: "Term newborn, DOL 1, persistent cyanosis (SpO₂ 68%), minimal respiratory distress. Please evaluate at bedside.",
      from: "Dr. Alvarez (Neonatology)",
      time: "09:22",
      path: "/nicu",
      read: false,
      urgent: true,
    },
    {
      id: "picu-svt",
      title: "PICU CONSULT — URGENT",
      message: "7-year-old with sustained tachycardia HR 240s, BP 78/42. Room 4B. Please come now.",
      from: "Dr. Nguyen (PICU fellow)",
      time: "09:14",
      path: "/picu",
      read: false,
      urgent: true,
    },
    {
      id: "mri-vascular",
      title: "Imaging review request",
      message: "Please review Ellie Vaughn's CT angiogram in Room 5B — pulmonology is asking about a vascular ring.",
      from: "Dr. Chen (Radiology)",
      time: "08:58",
      path: "/mri",
      read: false,
    },
    {
      id: "echo-back",
      title: "Echo read complete",
      message: "Marcus Chen's echo has been finalized and is ready for review.",
      from: "Sonographer — Echo Lab",
      time: "08:52",
      path: "/echo/case-hcm",
      read: false,
    },
    {
      id: "huddle",
      title: "Morning huddle reminder",
      message: "Case conference at noon in the workroom. Bring your notes.",
      from: "Dr. Patel",
      time: "07:48",
      path: "/workroom",
      read: true,
    },
  ]);
}

export function markPagerRead(id: string) {
  memory.put(KEY, getPagerEvents().map((event) => event.id === id ? { ...event, read: true } : event));
}

export function markAllRead() {
  memory.put(KEY, getPagerEvents().map((event) => ({ ...event, read: true })));
}

export function unreadCount(): number {
  return getPagerEvents().filter((event) => !event.read).length;
}

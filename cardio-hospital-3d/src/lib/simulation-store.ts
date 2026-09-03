import { create } from "zustand";

export type SimulationPhase = "arrival" | "briefing" | "assigned" | "encounter";

interface SimulationState {
  entered: boolean;
  controlsLocked: boolean;
  phase: SimulationPhase;
  prompt: string | null;
  briefingOpen: boolean;
  setEntered: (entered: boolean) => void;
  setControlsLocked: (locked: boolean) => void;
  setPrompt: (prompt: string | null) => void;
  beginBriefing: () => void;
  acceptAssignment: () => void;
  startEncounter: () => void;
  resumeWorld: () => void;
  closeBriefing: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  entered: false,
  controlsLocked: false,
  phase: "arrival",
  prompt: null,
  briefingOpen: false,
  setEntered: (entered) => set({ entered }),
  setControlsLocked: (controlsLocked) => set({ controlsLocked }),
  setPrompt: (prompt) => set({ prompt }),
  beginBriefing: () => set({ phase: "briefing", briefingOpen: true, controlsLocked: false }),
  acceptAssignment: () => set({ phase: "assigned", briefingOpen: false }),
  startEncounter: () => set({ phase: "encounter", controlsLocked: false }),
  resumeWorld: () => set({ phase: "assigned", prompt: null }),
  closeBriefing: () => set({ briefingOpen: false }),
}));

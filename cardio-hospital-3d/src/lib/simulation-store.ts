import { create } from "zustand";

/**
 * Transient UI state only. Domain workflow (patient arrival, assignment,
 * encounter progress, completion) belongs to hospital-engine.ts.
 */
interface SimulationUiState {
  entered: boolean;
  controlsLocked: boolean;
  prompt: string | null;
  briefingOpen: boolean;
  encounterOpen: boolean;
  setEntered: (entered: boolean) => void;
  setControlsLocked: (locked: boolean) => void;
  setPrompt: (prompt: string | null) => void;
  openBriefing: () => void;
  closeBriefing: () => void;
  openEncounter: () => void;
  closeEncounter: () => void;
}

export const useSimulationStore = create<SimulationUiState>((set) => ({
  entered: false,
  controlsLocked: false,
  prompt: null,
  briefingOpen: false,
  encounterOpen: false,
  setEntered: (entered) => set({ entered }),
  setControlsLocked: (controlsLocked) => set({ controlsLocked }),
  setPrompt: (prompt) => set({ prompt }),
  openBriefing: () => set({ briefingOpen: true, controlsLocked: false }),
  closeBriefing: () => set({ briefingOpen: false }),
  openEncounter: () => set({ encounterOpen: true, controlsLocked: false }),
  closeEncounter: () => set({ encounterOpen: false, prompt: null }),
}));

import { create } from "zustand";

/**
 * Transient UI/input state only. Domain workflow (patient arrival, assignment,
 * encounter progress, completion) belongs to hospital-engine.ts.
 */
interface SimulationUiState {
  entered: boolean;
  controlsLocked: boolean;
  prompt: string | null;
  briefingOpen: boolean;
  encounterOpen: boolean;
  mobileMove: { x: number; y: number };
  interactSequence: number;
  setEntered: (entered: boolean) => void;
  setControlsLocked: (locked: boolean) => void;
  setPrompt: (prompt: string | null) => void;
  openBriefing: () => void;
  closeBriefing: () => void;
  openEncounter: () => void;
  closeEncounter: () => void;
  setMobileMove: (x: number, y: number) => void;
  requestInteract: () => void;
}

export const useSimulationStore = create<SimulationUiState>((set) => ({
  entered: false,
  controlsLocked: false,
  prompt: null,
  briefingOpen: false,
  encounterOpen: false,
  mobileMove: { x: 0, y: 0 },
  interactSequence: 0,
  setEntered: (entered) => set({ entered }),
  setControlsLocked: (controlsLocked) => set({ controlsLocked }),
  setPrompt: (prompt) => set({ prompt }),
  openBriefing: () => set({ briefingOpen: true, controlsLocked: false, mobileMove: { x: 0, y: 0 } }),
  closeBriefing: () => set({ briefingOpen: false }),
  openEncounter: () => set({ encounterOpen: true, controlsLocked: false, mobileMove: { x: 0, y: 0 } }),
  closeEncounter: () => set({ encounterOpen: false, prompt: null }),
  setMobileMove: (x, y) => set({ mobileMove: { x, y } }),
  requestInteract: () => set((state) => ({ interactSequence: state.interactSequence + 1 })),
}));

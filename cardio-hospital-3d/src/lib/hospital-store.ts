import { create } from "zustand";
import {
  createInitialHospitalState,
  reduceHospitalState,
  type HospitalEvent,
  type HospitalState,
  type InitialHospitalOptions,
} from "./hospital-engine";
import {
  clearHospitalState,
  loadHospitalState,
  saveHospitalState,
} from "./hospital-persistence";

interface HospitalStoreState {
  hospital: HospitalState;
  hydrated: boolean;
  dispatch: (event: HospitalEvent) => void;
  hydrate: () => void;
  reset: (options?: InitialHospitalOptions) => void;
}

const initialHospital = createInitialHospitalState();

export const useHospitalStore = create<HospitalStoreState>((set, get) => ({
  hospital: initialHospital,
  hydrated: false,

  dispatch(event) {
    const current = get().hospital;
    const next = reduceHospitalState(current, event);
    if (next === current) return;
    set({ hospital: next });
    saveHospitalState(next);
  },

  hydrate() {
    if (get().hydrated) return;
    const persisted = loadHospitalState();
    set({
      hospital: persisted ?? get().hospital,
      hydrated: true,
    });
  },

  reset(options) {
    const hospital = createInitialHospitalState(options);
    clearHospitalState();
    set({ hospital, hydrated: true });
  },
}));

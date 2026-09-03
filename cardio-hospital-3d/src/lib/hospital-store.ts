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
import { reconcileHospitalSchedule } from "./hospital-schedule";

interface HospitalStoreState {
  hospital: HospitalState;
  hydrated: boolean;
  dispatch: (event: HospitalEvent) => void;
  hydrate: () => void;
  reset: (options?: InitialHospitalOptions) => void;
}

const initialHospital = createInitialHospitalState();

function applyCanonicalEvent(state: HospitalState, event: HospitalEvent): HospitalState {
  return reconcileHospitalSchedule(reduceHospitalState(state, event));
}

export const useHospitalStore = create<HospitalStoreState>((set, get) => ({
  hospital: initialHospital,
  hydrated: false,

  dispatch(event) {
    const current = get().hospital;
    const next = applyCanonicalEvent(current, event);
    if (next === current) return;
    set({ hospital: next });
    saveHospitalState(next);
  },

  hydrate() {
    if (get().hydrated) return;
    const persisted = loadHospitalState();
    const source = persisted ?? get().hospital;
    const hospital = reconcileHospitalSchedule(source);
    set({ hospital, hydrated: true });
    if (hospital !== source) saveHospitalState(hospital);
  },

  reset(options) {
    const hospital = createInitialHospitalState(options);
    clearHospitalState();
    set({ hospital, hydrated: true });
  },
}));

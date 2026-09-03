import {
  HOSPITAL_SCHEMA_VERSION,
  type HospitalState,
} from "./hospital-engine";

export const HOSPITAL_STORAGE_KEY = "cardio_hospital:unified:state";

interface PersistedHospitalEnvelopeV1 {
  schemaVersion: 1;
  state: HospitalState;
}

function storageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHospitalStateV1(value: unknown): value is HospitalState {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== HOSPITAL_SCHEMA_VERSION) return false;
  if (typeof value.revision !== "number") return false;
  if (!isRecord(value.shift) || !isRecord(value.world)) return false;
  if (!isRecord(value.learner) || !isRecord(value.pager)) return false;
  if (!isRecord(value.patients) || !isRecord(value.encounters)) return false;
  if (!Array.isArray(value.timeline)) return false;
  return true;
}

export function migratePersistedHospitalState(
  input: unknown
): HospitalState | undefined {
  if (!isRecord(input)) return undefined;

  switch (input.schemaVersion) {
    case 1: {
      const envelope = input as unknown as PersistedHospitalEnvelopeV1;
      return isHospitalStateV1(envelope.state) ? envelope.state : undefined;
    }
    default:
      return undefined;
  }
}

export function loadHospitalState(): HospitalState | undefined {
  if (!storageAvailable()) return undefined;
  try {
    const raw = window.localStorage.getItem(HOSPITAL_STORAGE_KEY);
    if (!raw) return undefined;
    return migratePersistedHospitalState(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function saveHospitalState(state: HospitalState): void {
  if (!storageAvailable()) return;
  const envelope: PersistedHospitalEnvelopeV1 = {
    schemaVersion: HOSPITAL_SCHEMA_VERSION,
    state,
  };
  try {
    window.localStorage.setItem(
      HOSPITAL_STORAGE_KEY,
      JSON.stringify(envelope)
    );
  } catch {
    // The simulation remains usable in memory if storage is unavailable/full.
  }
}

export function clearHospitalState(): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(HOSPITAL_STORAGE_KEY);
  } catch {
    // Ignore storage failures; callers may still reset their in-memory store.
  }
}

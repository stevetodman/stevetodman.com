import {
  HOSPITAL_SCHEMA_VERSION,
  type HospitalState,
} from "./hospital-engine";

export const HOSPITAL_STORAGE_KEY = "cardio_hospital:unified:state";

type LegacyHospitalStateV1 = Omit<HospitalState, "schemaVersion" | "tasks"> & {
  schemaVersion: 1;
};

interface PersistedHospitalEnvelope {
  schemaVersion: number;
  state: unknown;
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

function hasCommonHospitalShape(value: Record<string, unknown>): boolean {
  if (typeof value.revision !== "number") return false;
  if (!isRecord(value.shift) || !isRecord(value.world)) return false;
  if (!isRecord(value.learner) || !isRecord(value.pager)) return false;
  if (!isRecord(value.patients) || !isRecord(value.encounters)) return false;
  if (!Array.isArray(value.timeline)) return false;
  return true;
}

function isHospitalStateV1(value: unknown): value is LegacyHospitalStateV1 {
  return isRecord(value) && value.schemaVersion === 1 && hasCommonHospitalShape(value);
}

function isHospitalStateV2(value: unknown): value is HospitalState {
  return isRecord(value)
    && value.schemaVersion === HOSPITAL_SCHEMA_VERSION
    && hasCommonHospitalShape(value)
    && isRecord(value.tasks);
}

function migrateV1(state: LegacyHospitalStateV1): HospitalState {
  return {
    ...state,
    schemaVersion: HOSPITAL_SCHEMA_VERSION,
    tasks: {},
  };
}

export function migratePersistedHospitalState(input: unknown): HospitalState | undefined {
  if (!isRecord(input)) return undefined;
  const envelope = input as unknown as PersistedHospitalEnvelope;

  if (envelope.schemaVersion === 1 && isHospitalStateV1(envelope.state)) {
    return migrateV1(envelope.state);
  }
  if (envelope.schemaVersion === HOSPITAL_SCHEMA_VERSION && isHospitalStateV2(envelope.state)) {
    return envelope.state;
  }
  return undefined;
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
  const envelope: PersistedHospitalEnvelope = {
    schemaVersion: HOSPITAL_SCHEMA_VERSION,
    state,
  };
  try {
    window.localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(envelope));
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

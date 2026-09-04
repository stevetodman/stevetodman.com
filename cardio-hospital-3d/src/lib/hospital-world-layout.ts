import type { HospitalLocation } from "./hospital-engine";

interface WorldLocationZone {
  location: HospitalLocation;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const PLAYER_START_WORLD_POSITION: [number, number, number] = [0, 0.95, 5.4];
export const HCM_PATIENT_WORLD_POSITION: [number, number, number] = [7.15, 0.82, -3.55];
export const HCM_PARENT_WORLD_POSITION: [number, number, number] = [5.65, 0.55, -2.25];
export const VASOVAGAL_PATIENT_WORLD_POSITION: [number, number, number] = [-7.15, 0.82, -3.55];
export const VASOVAGAL_PARENT_WORLD_POSITION: [number, number, number] = [-5.65, 0.55, -2.25];

export const WORLD_LOCATION_ZONES: readonly WorldLocationZone[] = [
  { location: "workroom", minX: -4.9, maxX: 4.9, minZ: 4.2, maxZ: 11.9 },
  { location: "clinic-room-1", minX: -8.5, maxX: -2.2, minZ: -6.1, maxZ: 0.1 },
  { location: "clinic-room-3", minX: 2.2, maxX: 8.5, minZ: -6.1, maxZ: 0.1 },
  { location: "clinic-corridor", minX: -2.4, maxX: 2.4, minZ: -8.1, maxZ: 4.2 },
] as const;

export function locationForWorldPosition(x: number, z: number): HospitalLocation | null {
  const zone = WORLD_LOCATION_ZONES.find(
    (candidate) => x > candidate.minX && x < candidate.maxX && z > candidate.minZ && z < candidate.maxZ
  );
  return zone?.location ?? null;
}

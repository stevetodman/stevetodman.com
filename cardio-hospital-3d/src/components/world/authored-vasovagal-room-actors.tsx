"use client";

import { useMemo } from "react";
import { getPatient } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { VASOVAGAL_PARENT_WORLD_POSITION, VASOVAGAL_PATIENT_WORLD_POSITION } from "@/lib/hospital-world-layout";
import { VASOVAGAL_CASE_ID, VASOVAGAL_PATIENT_ID, VASOVAGAL_ROOM } from "@/lib/scenario-ids";
import { AuthoredCharacter } from "./authored-character";

/** Canonical state projected into the Phase-1 authored character family. */
export function AuthoredVasovagalRoomActors() {
  const patient = useHospitalStore((state) => getPatient(state.hospital, VASOVAGAL_PATIENT_ID));
  const encounters = useHospitalStore((state) => state.hospital.encounters);
  const currentEncounter = useMemo(() => {
    if (patient?.activeEncounterId) return encounters[patient.activeEncounterId];
    return Object.values(encounters)
      .filter((encounter) => encounter.caseId === VASOVAGAL_CASE_ID)
      .sort((left, right) => right.startedAtMinute - left.startedAtMinute)[0];
  }, [encounters, patient?.activeEncounterId]);

  if (!patient || patient.disposition === "complete" || patient.currentLocation !== VASOVAGAL_ROOM) return null;
  const parentInRoom = !currentEncounter?.confidentialInterviewDone;

  return (
    <group userData={{ room: VASOVAGAL_ROOM, canonicalPatientId: VASOVAGAL_PATIENT_ID }}>
      <AuthoredCharacter
        model="adolescent"
        position={[VASOVAGAL_PATIENT_WORLD_POSITION[0], 0, VASOVAGAL_PATIENT_WORLD_POSITION[2]]}
        rotation={[0, Math.PI / 2, 0]}
        topColor="#486b78"
        animationPhase={0.35}
        userData={{ entityType: "patient", patientId: VASOVAGAL_PATIENT_ID, caseId: VASOVAGAL_CASE_ID }}
      />
      {parentInRoom && (
        <AuthoredCharacter
          model="adult"
          position={[VASOVAGAL_PARENT_WORLD_POSITION[0], 0, VASOVAGAL_PARENT_WORLD_POSITION[2]]}
          rotation={[0, -Math.PI * 0.82, 0]}
          topColor="#675849"
          animationPhase={1.45}
          userData={{ entityType: "family", relatedPatientId: VASOVAGAL_PATIENT_ID }}
        />
      )}
    </group>
  );
}

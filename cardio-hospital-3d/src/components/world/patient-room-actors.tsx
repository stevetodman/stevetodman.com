"use client";

import { useMemo } from "react";
import { getPatient } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { Box, Cylinder } from "./primitives";

const HCM_PATIENT_ID = "patient-case-hcm";
const HCM_CASE_ID = "case-hcm";

function Head({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[0.19, 18, 14]} />
      <meshStandardMaterial color="#b97b5a" roughness={0.8} />
    </mesh>
  );
}

function SeatedAdolescent() {
  return (
    <group
      position={[7.15, 0.82, -3.55]}
      rotation={[0, -Math.PI / 2, 0]}
      userData={{ entityType: "patient", patientId: HCM_PATIENT_ID, caseId: HCM_CASE_ID }}
    >
      <Cylinder radius={0.2} height={0.72} position={[0, 0.46, 0]} color="#7b2d38" />
      <Box size={[0.46, 0.13, 0.22]} position={[0, 0.74, 0]} color="#efe8dc" roughness={0.8} />
      <Head position={[0, 1.04, 0]} />

      <Cylinder radius={0.055} height={0.58} position={[-0.25, 0.43, 0]} rotation={[0, 0, -0.18]} color="#b97b5a" />
      <Cylinder radius={0.055} height={0.58} position={[0.25, 0.43, 0]} rotation={[0, 0, 0.18]} color="#b97b5a" />

      <Cylinder radius={0.07} height={0.72} position={[-0.13, -0.05, 0.17]} rotation={[Math.PI / 2.6, 0, 0]} color="#252b32" />
      <Cylinder radius={0.07} height={0.72} position={[0.13, -0.05, 0.17]} rotation={[Math.PI / 2.6, 0, 0]} color="#252b32" />
      <Box size={[0.16, 0.09, 0.31]} position={[-0.13, -0.37, 0.46]} color="#e4e7e7" roughness={0.72} />
      <Box size={[0.16, 0.09, 0.31]} position={[0.13, -0.37, 0.46]} color="#e4e7e7" roughness={0.72} />
    </group>
  );
}

function ParentActor() {
  return (
    <group
      position={[5.65, 0.55, -2.25]}
      rotation={[0, Math.PI * 0.82, 0]}
      userData={{ entityType: "family", relatedPatientId: HCM_PATIENT_ID }}
    >
      <Cylinder radius={0.19} height={0.68} position={[0, 0.38, 0]} color="#395d68" />
      <Head position={[0, 0.92, 0]} scale={0.95} />
      <Cylinder radius={0.05} height={0.5} position={[-0.22, 0.37, 0]} rotation={[0, 0, -0.2]} color="#b97b5a" />
      <Cylinder radius={0.05} height={0.5} position={[0.22, 0.37, 0]} rotation={[0, 0, 0.2]} color="#b97b5a" />
      <Cylinder radius={0.065} height={0.62} position={[-0.1, -0.1, 0.09]} rotation={[Math.PI / 2.8, 0, 0]} color="#2c3236" />
      <Cylinder radius={0.065} height={0.62} position={[0.1, -0.1, 0.09]} rotation={[Math.PI / 2.8, 0, 0]} color="#2c3236" />
    </group>
  );
}

/**
 * Room actors are visual projections of the canonical hospital state.
 * They never own encounter facts. In particular, the parent's presence is
 * driven by CONFIDENTIAL_INTERVIEW_STARTED, so the world reflects the same
 * state used by the clinical interface when the learner returns to the room.
 */
export function HcmRoomActors() {
  const patient = useHospitalStore((state) => getPatient(state.hospital, HCM_PATIENT_ID));
  const encounters = useHospitalStore((state) => state.hospital.encounters);

  const currentEncounter = useMemo(() => {
    if (patient?.activeEncounterId) return encounters[patient.activeEncounterId];
    return Object.values(encounters)
      .filter((encounter) => encounter.caseId === HCM_CASE_ID)
      .sort((left, right) => right.startedAtMinute - left.startedAtMinute)[0];
  }, [encounters, patient?.activeEncounterId]);

  const parentInRoom = !currentEncounter?.confidentialInterviewDone;

  return (
    <group userData={{ room: "clinic-room-3", canonicalPatientId: HCM_PATIENT_ID }}>
      <SeatedAdolescent />
      {parentInRoom && <ParentActor />}
    </group>
  );
}

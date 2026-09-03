"use client";

import { useMemo } from "react";
import { getPatient } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import {
  HCM_CASE_ID,
  HCM_PATIENT_ID,
  HCM_ROOM,
  VASOVAGAL_CASE_ID,
  VASOVAGAL_PATIENT_ID,
  VASOVAGAL_ROOM,
} from "@/lib/scenario-ids";
import { Box, Cylinder } from "./primitives";

function Head({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[0.19, 18, 14]} />
      <meshStandardMaterial color="#b97b5a" roughness={0.8} />
    </mesh>
  );
}

interface PatientActorProps {
  position: [number, number, number];
  rotation: [number, number, number];
  patientId: string;
  caseId: string;
  shirtColor: string;
}

function SeatedAdolescent({ position, rotation, patientId, caseId, shirtColor }: PatientActorProps) {
  return (
    <group
      position={position}
      rotation={rotation}
      userData={{ entityType: "patient", patientId, caseId }}
    >
      <Cylinder radius={0.2} height={0.72} position={[0, 0.46, 0]} color={shirtColor} />
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

interface ParentActorProps {
  position: [number, number, number];
  rotation: [number, number, number];
  patientId: string;
  shirtColor: string;
}

function ParentActor({ position, rotation, patientId, shirtColor }: ParentActorProps) {
  return (
    <group
      position={position}
      rotation={rotation}
      userData={{ entityType: "family", relatedPatientId: patientId }}
    >
      <Cylinder radius={0.19} height={0.68} position={[0, 0.38, 0]} color={shirtColor} />
      <Head position={[0, 0.92, 0]} scale={0.95} />
      <Cylinder radius={0.05} height={0.5} position={[-0.22, 0.37, 0]} rotation={[0, 0, -0.2]} color="#b97b5a" />
      <Cylinder radius={0.05} height={0.5} position={[0.22, 0.37, 0]} rotation={[0, 0, 0.2]} color="#b97b5a" />
      <Cylinder radius={0.065} height={0.62} position={[-0.1, -0.1, 0.09]} rotation={[Math.PI / 2.8, 0, 0]} color="#2c3236" />
      <Cylinder radius={0.065} height={0.62} position={[0.1, -0.1, 0.09]} rotation={[Math.PI / 2.8, 0, 0]} color="#2c3236" />
    </group>
  );
}

interface RoomActorProjectionProps {
  patientId: string;
  caseId: string;
  room: string;
  patientPosition: [number, number, number];
  patientRotation: [number, number, number];
  parentPosition: [number, number, number];
  parentRotation: [number, number, number];
  patientShirt: string;
  parentShirt: string;
}

/** Room actors are projections of canonical state and never own clinical truth. */
function RoomActorProjection(props: RoomActorProjectionProps) {
  const patient = useHospitalStore((state) => getPatient(state.hospital, props.patientId));
  const encounters = useHospitalStore((state) => state.hospital.encounters);

  const currentEncounter = useMemo(() => {
    if (patient?.activeEncounterId) return encounters[patient.activeEncounterId];
    return Object.values(encounters)
      .filter((encounter) => encounter.caseId === props.caseId)
      .sort((left, right) => right.startedAtMinute - left.startedAtMinute)[0];
  }, [encounters, patient?.activeEncounterId, props.caseId]);

  if (!patient || patient.disposition === "complete" || patient.currentLocation !== props.room) return null;
  const parentInRoom = !currentEncounter?.confidentialInterviewDone;

  return (
    <group userData={{ room: props.room, canonicalPatientId: props.patientId }}>
      <SeatedAdolescent
        position={props.patientPosition}
        rotation={props.patientRotation}
        patientId={props.patientId}
        caseId={props.caseId}
        shirtColor={props.patientShirt}
      />
      {parentInRoom && (
        <ParentActor
          position={props.parentPosition}
          rotation={props.parentRotation}
          patientId={props.patientId}
          shirtColor={props.parentShirt}
        />
      )}
    </group>
  );
}

export function HcmRoomActors() {
  return (
    <RoomActorProjection
      patientId={HCM_PATIENT_ID}
      caseId={HCM_CASE_ID}
      room={HCM_ROOM}
      patientPosition={[7.15, 0.82, -3.55]}
      patientRotation={[0, -Math.PI / 2, 0]}
      parentPosition={[5.65, 0.55, -2.25]}
      parentRotation={[0, Math.PI * 0.82, 0]}
      patientShirt="#7b2d38"
      parentShirt="#395d68"
    />
  );
}

export function VasovagalRoomActors() {
  return (
    <RoomActorProjection
      patientId={VASOVAGAL_PATIENT_ID}
      caseId={VASOVAGAL_CASE_ID}
      room={VASOVAGAL_ROOM}
      patientPosition={[-7.15, 0.82, -3.55]}
      patientRotation={[0, Math.PI / 2, 0]}
      parentPosition={[-5.65, 0.55, -2.25]}
      parentRotation={[0, -Math.PI * 0.82, 0]}
      patientShirt="#486b78"
      parentShirt="#675849"
    />
  );
}

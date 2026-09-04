"use client";

import { useMemo } from "react";
import { getPatient } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import {
  HCM_PARENT_WORLD_POSITION,
  HCM_PATIENT_WORLD_POSITION,
  VASOVAGAL_PARENT_WORLD_POSITION,
  VASOVAGAL_PATIENT_WORLD_POSITION,
} from "@/lib/hospital-world-layout";
import {
  HCM_CASE_ID,
  HCM_PATIENT_ID,
  HCM_ROOM,
  VASOVAGAL_CASE_ID,
  VASOVAGAL_PATIENT_ID,
  VASOVAGAL_ROOM,
} from "@/lib/scenario-ids";
import { Box, Cylinder } from "./primitives";

const SKIN = "#b97b5a";
const HAIR = "#2e211c";

function Head({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow scale={[0.88, 1.08, 0.92]}>
        <sphereGeometry args={[0.19, 16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.11, 0.015]} scale={[0.92, 0.48, 0.94]} castShadow>
        <sphereGeometry args={[0.19, 14, 10]} />
        <meshStandardMaterial color={HAIR} roughness={0.92} />
      </mesh>
      <Box size={[0.035, 0.025, 0.022]} position={[-0.058, 0.018, -0.17]} color="#24201f" />
      <Box size={[0.035, 0.025, 0.022]} position={[0.058, 0.018, -0.17]} color="#24201f" />
      <Box size={[0.055, 0.016, 0.018]} position={[0, -0.065, -0.175]} color="#7a4b40" />
    </group>
  );
}

function SeatedBody({ shirtColor, adult = false }: { shirtColor: string; adult?: boolean }) {
  const torsoHeight = adult ? 0.72 : 0.65;
  const shoulderWidth = adult ? 0.5 : 0.46;
  return (
    <>
      <Cylinder radius={adult ? 0.205 : 0.19} height={torsoHeight} position={[0, 0.47, 0]} color={shirtColor} />
      <Box size={[shoulderWidth, 0.12, 0.24]} position={[0, 0.72, 0]} color={shirtColor} roughness={0.75} />
      <Cylinder radius={0.07} height={0.12} position={[0, 0.86, 0]} color={SKIN} />
    </>
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
      <SeatedBody shirtColor={shirtColor} />
      <Head position={[0, 1.04, 0]} />
      <Cylinder radius={0.052} height={0.48} position={[-0.27, 0.48, 0.03]} rotation={[0.08, 0, -0.23]} color={SKIN} />
      <Cylinder radius={0.052} height={0.48} position={[0.27, 0.48, 0.03]} rotation={[0.08, 0, 0.23]} color={SKIN} />
      <mesh position={[-0.3, 0.27, 0.07]} castShadow><sphereGeometry args={[0.065, 10, 8]} /><meshStandardMaterial color={SKIN} roughness={0.8} /></mesh>
      <mesh position={[0.3, 0.27, 0.07]} castShadow><sphereGeometry args={[0.065, 10, 8]} /><meshStandardMaterial color={SKIN} roughness={0.8} /></mesh>
      <Box size={[0.42, 0.16, 0.28]} position={[0, 0.08, 0.04]} color="#252b32" roughness={0.88} />
      <Cylinder radius={0.075} height={0.63} position={[-0.13, -0.19, 0.2]} rotation={[Math.PI / 2.55, 0, 0]} color="#252b32" />
      <Cylinder radius={0.075} height={0.63} position={[0.13, -0.19, 0.2]} rotation={[Math.PI / 2.55, 0, 0]} color="#252b32" />
      <Box size={[0.18, 0.105, 0.34]} position={[-0.13, -0.48, 0.49]} color="#e4e7e7" roughness={0.72} />
      <Box size={[0.18, 0.105, 0.34]} position={[0.13, -0.48, 0.49]} color="#e4e7e7" roughness={0.72} />
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
      <SeatedBody shirtColor={shirtColor} adult />
      <Head position={[0, 1.05, 0]} scale={1.04} />
      <Cylinder radius={0.055} height={0.5} position={[-0.28, 0.48, 0.02]} rotation={[0.05, 0, -0.2]} color={SKIN} />
      <Cylinder radius={0.055} height={0.5} position={[0.28, 0.48, 0.02]} rotation={[0.05, 0, 0.2]} color={SKIN} />
      <mesh position={[-0.3, 0.25, 0.06]} castShadow><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color={SKIN} roughness={0.8} /></mesh>
      <mesh position={[0.3, 0.25, 0.06]} castShadow><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color={SKIN} roughness={0.8} /></mesh>
      <Box size={[0.44, 0.17, 0.29]} position={[0, 0.05, 0.03]} color="#2c3236" />
      <Cylinder radius={0.075} height={0.62} position={[-0.12, -0.22, 0.17]} rotation={[Math.PI / 2.7, 0, 0]} color="#2c3236" />
      <Cylinder radius={0.075} height={0.62} position={[0.12, -0.22, 0.17]} rotation={[Math.PI / 2.7, 0, 0]} color="#2c3236" />
      <Box size={[0.18, 0.1, 0.32]} position={[-0.12, -0.5, 0.43]} color="#343638" roughness={0.82} />
      <Box size={[0.18, 0.1, 0.32]} position={[0.12, -0.5, 0.43]} color="#343638" roughness={0.82} />
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
      patientPosition={HCM_PATIENT_WORLD_POSITION}
      patientRotation={[0, -Math.PI / 2, 0]}
      parentPosition={HCM_PARENT_WORLD_POSITION}
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
      patientPosition={VASOVAGAL_PATIENT_WORLD_POSITION}
      patientRotation={[0, Math.PI / 2, 0]}
      parentPosition={VASOVAGAL_PARENT_WORLD_POSITION}
      parentRotation={[0, -Math.PI * 0.82, 0]}
      patientShirt="#486b78"
      parentShirt="#675849"
    />
  );
}

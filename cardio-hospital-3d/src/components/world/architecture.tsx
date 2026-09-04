import { RigidBody } from "@react-three/rapier";
import { Box, Cylinder } from "./primitives";
import { ConferenceTable, ExamTable, OfficeChair, Stool, Workstation } from "./furniture";
import { HcmRoomActors } from "./patient-room-actors";

function StaticBox(props: React.ComponentProps<typeof Box>) {
  return (
    <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0.9}>
      <Box {...props} />
    </RigidBody>
  );
}

function CeilingLights({ positions }: { positions: [number, number, number][] }) {
  return (
    <>
      {positions.map(([x, y, z]) => (
        <group key={`${x}-${z}`} position={[x, y, z]}>
          <Box size={[1.15, 0.025, 0.42]} color="#f7f5ea" roughness={0.18} />
          <pointLight position={[0, -0.18, 0]} intensity={6.5} distance={5.2} decay={2} color="#fff8df" />
        </group>
      ))}
    </>
  );
}

function AcousticPanel({ position }: { position: [number, number, number] }) {
  return <Box size={[1.05, 0.72, 0.07]} position={position} color="#7790a0" roughness={0.92} />;
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder radius={0.24} height={0.42} position={[0, 0.21, 0]} color="#9d8c77" />
      <Cylinder radius={0.045} height={1.25} position={[0, 0.85, 0]} color="#5e4b3c" />
      {[-0.45, -0.2, 0.05, 0.3, 0.55].map((y, index) => (
        <mesh key={y} position={[index % 2 ? 0.18 : -0.16, 1.05 + y, 0]} rotation={[0, 0, index % 2 ? -0.55 : 0.55]} castShadow>
          <sphereGeometry args={[0.32, 12, 8]} />
          <meshStandardMaterial color={index % 2 ? "#416846" : "#355a3c"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function Clinician({ position, coat = true }: { position: [number, number, number]; coat?: boolean }) {
  return (
    <group position={position}>
      <Cylinder radius={0.23} height={0.92} position={[0, 0.93, 0]} color={coat ? "#eef1ef" : "#3f8ca4"} />
      <mesh position={[0, 1.58, 0]} castShadow>
        <sphereGeometry args={[0.23, 20, 16]} />
        <meshStandardMaterial color="#b97858" roughness={0.76} />
      </mesh>
      <Box size={[0.14, 0.08, 0.03]} position={[0, 1.1, -0.23]} color="#184c65" />
      <Box size={[0.11, 0.44, 0.11]} position={[-0.28, 1.0, 0]} rotation={[0, 0, -0.16]} color={coat ? "#eef1ef" : "#3f8ca4"} />
      <Box size={[0.11, 0.44, 0.11]} position={[0.28, 1.0, 0]} rotation={[0, 0, 0.16]} color={coat ? "#eef1ef" : "#3f8ca4"} />
    </group>
  );
}

export function TeamRoom() {
  const chairs: { position: [number, number, number]; rotation: [number, number, number] }[] = [
    { position: [-1.5, 0, 6.65], rotation: [0, 0, 0] },
    { position: [0, 0, 6.65], rotation: [0, 0, 0] },
    { position: [1.5, 0, 6.65], rotation: [0, 0, 0] },
    { position: [-1.5, 0, 9.35], rotation: [0, Math.PI, 0] },
    { position: [0, 0, 9.35], rotation: [0, Math.PI, 0] },
    { position: [1.5, 0, 9.35], rotation: [0, Math.PI, 0] },
  ];

  return (
    <group>
      <StaticBox size={[10, 0.12, 8]} position={[0, -0.06, 8]} color="#5b5d5b" roughness={0.94} />
      <StaticBox size={[10, 3, 0.16]} position={[0, 1.5, 12]} color="#e9e6df" />
      <StaticBox size={[0.16, 3, 8]} position={[-5, 1.5, 8]} color="#e9e6df" />
      <StaticBox size={[0.16, 3, 8]} position={[5, 1.5, 8]} color="#7a8a95" />
      <StaticBox size={[3.8, 3, 0.16]} position={[-3.1, 1.5, 4]} color="#e9e6df" />
      <StaticBox size={[3.8, 3, 0.16]} position={[3.1, 1.5, 4]} color="#e9e6df" />

      <ConferenceTable position={[0, 0, 8]} />
      {chairs.map((chair, index) => <OfficeChair key={index} {...chair} />)}
      <Workstation position={[-4.45, 0, 9.5]} rotation={[0, Math.PI / 2, 0]} />
      <Workstation position={[-4.45, 0, 7.8]} rotation={[0, Math.PI / 2, 0]} />
      <Workstation position={[-4.45, 0, 6.1]} rotation={[0, Math.PI / 2, 0]} />

      <Box size={[4.15, 1.18, 0.08]} position={[0, 1.85, 11.86]} color="#10191e" metalness={0.18} />
      <Box size={[3.95, 0.98, 0.025]} position={[0, 1.85, 11.81]} color="#164d60" roughness={0.25} />
      {[[-1.28, 1.9], [-0.55, 1.62], [0.3, 1.87], [1.15, 1.68]].map(([x, y], index) => (
        <Box key={index} size={[0.52, 0.018, 0.01]} position={[x, y, 11.78]} color="#78d3dd" />
      ))}
      <Plant position={[4.25, 0, 11.15]} />
      <AcousticPanel position={[4.9, 2.08, 6.1]} />
      <AcousticPanel position={[4.9, 2.08, 8]} />
      <AcousticPanel position={[4.9, 2.08, 9.9]} />
      <Clinician position={[0, 0, 10.55]} />
      <CeilingLights positions={[[-2.8, 2.92, 6.2], [0, 2.92, 6.2], [2.8, 2.92, 6.2], [-2.8, 2.92, 9.8], [0, 2.92, 9.8], [2.8, 2.92, 9.8]]} />
    </group>
  );
}

export function ClinicCorridor() {
  return (
    <group>
      <StaticBox size={[4.5, 0.12, 12]} position={[0, -0.06, -2]} color="#d9dedc" roughness={0.82} />
      <StaticBox size={[0.16, 3, 5.1]} position={[-2.25, 1.5, 1.45]} color="#f0eee8" />
      <StaticBox size={[0.16, 3, 3.7]} position={[-2.25, 1.5, -6.15]} color="#f0eee8" />
      <StaticBox size={[0.16, 3, 5.1]} position={[2.25, 1.5, 1.45]} color="#f0eee8" />
      <StaticBox size={[0.16, 3, 3.7]} position={[2.25, 1.5, -6.15]} color="#f0eee8" />
      <StaticBox size={[4.5, 3, 0.16]} position={[0, 1.5, -8]} color="#f0eee8" />
      <Box size={[0.13, 0.18, 5]} position={[-2.12, 1.0, 1.45]} color="#89979c" metalness={0.42} />
      <Box size={[0.13, 0.18, 3.6]} position={[-2.12, 1.0, -6.15]} color="#89979c" metalness={0.42} />
      <Box size={[0.13, 0.18, 5]} position={[2.12, 1.0, 1.45]} color="#89979c" metalness={0.42} />
      <Box size={[0.13, 0.18, 3.6]} position={[2.12, 1.0, -6.15]} color="#89979c" metalness={0.42} />
      <Box size={[0.08, 2.35, 1.65]} position={[-2.28, 1.18, -3]} color="#b58b54" roughness={0.62} />
      <Box size={[0.05, 0.11, 0.58]} position={[-2.22, 1.02, -3]} color="#6b7376" metalness={0.5} />
      <Box size={[0.08, 2.35, 1.65]} position={[2.28, 1.18, -3]} color="#b58b54" roughness={0.62} />
      <Box size={[0.05, 0.11, 0.58]} position={[2.22, 1.02, -3]} color="#6b7376" metalness={0.5} />
      <CeilingLights positions={[[0, 2.92, 2.8], [0, 2.92, 0.3], [0, 2.92, -2.2], [0, 2.92, -4.7], [0, 2.92, -7]]} />
    </group>
  );
}

export function ExamRoomOne() {
  return (
    <group>
      <StaticBox size={[6.2, 0.12, 6]} position={[-5.35, -0.06, -3]} color="#cfc6b9" roughness={0.9} />
      <StaticBox size={[6.2, 3, 0.16]} position={[-5.35, 1.5, 0]} color="#e9eee8" />
      <StaticBox size={[6.2, 3, 0.16]} position={[-5.35, 1.5, -6]} color="#d9e7ea" />
      <StaticBox size={[0.16, 3, 6]} position={[-8.45, 1.5, -3]} color="#d9e7ea" />
      <StaticBox size={[0.16, 3, 2.1]} position={[-2.25, 1.5, -1.05]} color="#e9eee8" />
      <StaticBox size={[0.16, 3, 2.1]} position={[-2.25, 1.5, -4.95]} color="#e9eee8" />

      <ExamTable position={[-7.25, 0, -3.7]} rotation={[0, Math.PI, 0]} />
      <Stool position={[-5.65, 0, -2.25]} />
      <StaticBox size={[2.65, 0.86, 0.68]} position={[-6.4, 0.43, -5.55]} color="#5d666a" />
      <Box size={[2.55, 0.72, 0.05]} position={[-6.4, 1.18, -5.83]} color="#e6e0d5" />
      <Box size={[1.75, 0.09, 0.75]} position={[-4.05, 0.76, -5.45]} color="#59636b" />
      <Box size={[0.75, 0.52, 0.06]} position={[-4.05, 1.15, -5.72]} color="#10181c" />
      <Box size={[0.65, 0.42, 0.025]} position={[-4.05, 1.15, -5.68]} color="#224f5d" roughness={0.24} />
      <Box size={[0.42, 0.56, 0.2]} position={[-8.25, 1.65, -1.1]} color="#edf0eb" />
      <Box size={[0.22, 0.34, 0.1]} position={[-8.12, 1.65, -0.98]} color="#1f2528" />
      <CeilingLights positions={[[ -4.2, 2.92, -1.4], [-6.9, 2.92, -1.4], [-4.2, 2.92, -4.6], [-6.9, 2.92, -4.6]]} />
    </group>
  );
}

export function ExamRoom() {
  return (
    <group>
      <StaticBox size={[6.2, 0.12, 6]} position={[5.35, -0.06, -3]} color="#cfc6b9" roughness={0.9} />
      <StaticBox size={[6.2, 3, 0.16]} position={[5.35, 1.5, 0]} color="#e9eee8" />
      <StaticBox size={[6.2, 3, 0.16]} position={[5.35, 1.5, -6]} color="#d9e7ea" />
      <StaticBox size={[0.16, 3, 6]} position={[8.45, 1.5, -3]} color="#d9e7ea" />
      <StaticBox size={[0.16, 3, 2.1]} position={[2.25, 1.5, -1.05]} color="#e9eee8" />
      <StaticBox size={[0.16, 3, 2.1]} position={[2.25, 1.5, -4.95]} color="#e9eee8" />

      <ExamTable position={[7.25, 0, -3.7]} />
      <Stool position={[5.65, 0, -2.25]} />
      <HcmRoomActors />
      <StaticBox size={[2.65, 0.86, 0.68]} position={[6.4, 0.43, -5.55]} color="#5d666a" />
      <Box size={[2.55, 0.72, 0.05]} position={[6.4, 1.18, -5.83]} color="#e6e0d5" />
      <Box size={[1.75, 0.09, 0.75]} position={[4.05, 0.76, -5.45]} color="#59636b" />
      <Box size={[0.75, 0.52, 0.06]} position={[4.05, 1.15, -5.72]} color="#10181c" />
      <Box size={[0.65, 0.42, 0.025]} position={[4.05, 1.15, -5.68]} color="#224f5d" roughness={0.24} />
      <Box size={[0.42, 0.56, 0.2]} position={[8.25, 1.65, -1.1]} color="#edf0eb" />
      <Box size={[0.22, 0.34, 0.1]} position={[8.12, 1.65, -0.98]} color="#1f2528" />
      <CeilingLights positions={[[4.2, 2.92, -1.4], [6.9, 2.92, -1.4], [4.2, 2.92, -4.6], [6.9, 2.92, -4.6]]} />
    </group>
  );
}

export function HospitalArchitecture() {
  return (
    <>
      <TeamRoom />
      <ClinicCorridor />
      <ExamRoomOne />
      <ExamRoom />
    </>
  );
}

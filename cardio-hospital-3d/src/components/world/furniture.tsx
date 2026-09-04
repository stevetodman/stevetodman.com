import { RigidBody } from "@react-three/rapier";
import { Box, Cylinder } from "./primitives";

function SolidFurniture({ children }: { children: React.ReactNode }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0.9}>
      {children}
    </RigidBody>
  );
}

export function ConferenceTable({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <SolidFurniture>
      <group position={position}>
        <Box size={[4.6, 0.12, 1.75]} position={[0, 0.84, 0]} color="#eee9de" roughness={0.42} />
        {[-1.75, 1.75].flatMap((x) => [-0.55, 0.55].map((z) => (
          <Cylinder key={`${x}-${z}`} radius={0.055} height={0.78} position={[x, 0.42, z]} color="#899096" />
        )))}
        <Box size={[0.58, 0.025, 0.23]} position={[0.8, 0.92, 0.12]} color="#18222c" metalness={0.22} />
        <Box size={[0.32, 0.03, 0.22]} position={[-0.65, 0.92, -0.1]} color="#303841" />
      </group>
    </SolidFurniture>
  );
}

export function OfficeChair({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <SolidFurniture>
      <group position={position} rotation={rotation}>
        <Box size={[0.52, 0.09, 0.48]} position={[0, 0.52, 0]} color="#171a1c" roughness={0.55} />
        <Box size={[0.52, 0.76, 0.1]} position={[0, 0.9, 0.2]} color="#171a1c" roughness={0.55} />
        <Cylinder radius={0.035} height={0.45} position={[0, 0.27, 0]} color="#62696e" />
        {[0, 1.26, 2.51, 3.77, 5.03].map((angle) => (
          <Box
            key={angle}
            size={[0.38, 0.035, 0.035]}
            position={[Math.cos(angle) * 0.17, 0.08, Math.sin(angle) * 0.17]}
            rotation={[0, -angle, 0]}
            color="#51575b"
            metalness={0.35}
          />
        ))}
      </group>
    </SolidFurniture>
  );
}

export function Workstation({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <SolidFurniture>
      <group position={position} rotation={rotation}>
        <Box size={[1.45, 0.08, 0.62]} position={[0, 0.76, 0]} color="#59636b" />
        <Box size={[1.35, 0.7, 0.08]} position={[0, 0.39, 0.25]} color="#434b51" />
        <Box size={[0.7, 0.43, 0.06]} position={[0, 1.08, 0.12]} color="#11181d" metalness={0.15} />
        <Box size={[0.6, 0.33, 0.015]} position={[0, 1.08, 0.085]} color="#194a5c" roughness={0.28} />
        <Box size={[0.58, 0.025, 0.18]} position={[0, 0.84, -0.12]} color="#242a2e" />
      </group>
    </SolidFurniture>
  );
}

export function ExamTable({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <SolidFurniture>
      <group position={position} rotation={rotation}>
        <Box size={[0.82, 0.62, 1.9]} position={[0, 0.46, 0]} color="#dedbd4" />
        <Box size={[0.88, 0.15, 1.93]} position={[0, 0.82, 0]} color="#b4a08e" roughness={0.82} />
        <Box size={[0.88, 0.15, 0.7]} position={[0, 1.17, 0.6]} rotation={[-0.38, 0, 0]} color="#b4a08e" roughness={0.82} />
        {[-0.2, 0.2].map((y) => (
          <Box key={y} size={[0.68, 0.14, 0.42]} position={[0, 0.34 + y, -0.38]} color="#f2f0eb" />
        ))}
      </group>
    </SolidFurniture>
  );
}

export function Stool({ position }: { position: [number, number, number] }) {
  return (
    <SolidFurniture>
      <group position={position}>
        <Cylinder radius={0.32} height={0.12} position={[0, 0.58, 0]} color="#a79383" />
        <Cylinder radius={0.045} height={0.48} position={[0, 0.3, 0]} color="#525b61" />
        {[-0.25, 0.25].flatMap((x) => [-0.25, 0.25].map((z) => (
          <Box key={`${x}-${z}`} size={[0.04, 0.04, 0.35]} position={[x / 2, 0.08, z / 2]} rotation={[0, Math.atan2(x, z), 0]} color="#4c5358" />
        )))}
      </group>
    </SolidFurniture>
  );
}

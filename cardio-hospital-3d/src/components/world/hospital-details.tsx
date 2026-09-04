import { Box, Cylinder } from "./primitives";

function DoorFrame({ x, side }: { x: number; side: -1 | 1 }) {
  const wallX = side * 2.24;
  return (
    <group>
      <Box size={[0.09, 2.45, 0.08]} position={[wallX, 1.23, -2.22]} color="#7f8a8f" metalness={0.35} />
      <Box size={[0.09, 2.45, 0.08]} position={[wallX, 1.23, -3.78]} color="#7f8a8f" metalness={0.35} />
      <Box size={[0.09, 0.09, 1.64]} position={[wallX, 2.43, -3]} color="#7f8a8f" metalness={0.35} />
      <Box size={[0.045, 0.13, 0.62]} position={[side * 2.17, 1.02, -3]} color="#586268" metalness={0.7} />
      <Box size={[0.03, 0.03, 0.14]} position={[side * 2.13, 1.02, -2.69]} color="#d8dde0" metalness={0.8} />
    </group>
  );
}

function CorridorRail({ side }: { side: -1 | 1 }) {
  const x = side * 2.1;
  return (
    <>
      <Box size={[0.08, 0.11, 4.7]} position={[x, 0.93, 1.35]} color="#7f8d92" roughness={0.55} />
      <Box size={[0.08, 0.11, 3.25]} position={[x, 0.93, -6.25]} color="#7f8d92" roughness={0.55} />
      {[3.3, 0.3, -5.1, -7.2].map((z) => (
        <Box key={z} size={[0.13, 0.28, 0.12]} position={[x, 0.93, z]} color="#d6dcdd" roughness={0.72} />
      ))}
    </>
  );
}

function ClinicalHeadwall({ roomX, side }: { roomX: number; side: -1 | 1 }) {
  const x = roomX + side * 2.73;
  return (
    <group>
      <Box size={[0.06, 0.58, 1.35]} position={[x, 1.62, -4.1]} color="#e7e8e2" roughness={0.5} />
      <Box size={[0.025, 0.16, 1.12]} position={[x + side * 0.04, 1.72, -4.1]} color="#bfc9ca" metalness={0.25} />
      <Cylinder radius={0.065} height={0.035} position={[x + side * 0.07, 1.72, -4.42]} rotation={[0, 0, Math.PI / 2]} color="#f4f5f0" />
      <Cylinder radius={0.065} height={0.035} position={[x + side * 0.07, 1.72, -4.1]} rotation={[0, 0, Math.PI / 2]} color="#d9ebd5" />
      <Cylinder radius={0.065} height={0.035} position={[x + side * 0.07, 1.72, -3.78]} rotation={[0, 0, Math.PI / 2]} color="#f1d8d5" />
      <Box size={[0.035, 0.18, 0.22]} position={[x + side * 0.07, 1.42, -4.36]} color="#f7f8f4" />
      <Box size={[0.035, 0.18, 0.22]} position={[x + side * 0.07, 1.42, -3.84]} color="#f7f8f4" />
    </group>
  );
}

function SinkStation({ roomX, side }: { roomX: number; side: -1 | 1 }) {
  const x = roomX + side * 2.55;
  return (
    <group>
      <Box size={[0.58, 0.12, 0.72]} position={[x, 0.86, -1.15]} color="#d7d9d5" metalness={0.1} />
      <Box size={[0.48, 0.045, 0.55]} position={[x, 0.93, -1.15]} color="#b8c1c3" metalness={0.55} />
      <Cylinder radius={0.035} height={0.31} position={[x, 1.1, -1.15]} color="#7f888c" metalness={0.85} />
      <Box size={[0.12, 0.2, 0.09]} position={[x + side * 0.28, 1.4, -1.34]} color="#e9ece9" />
      <Box size={[0.12, 0.25, 0.1]} position={[x + side * 0.28, 1.38, -0.95]} color="#d8e4e6" />
      <Box size={[0.16, 0.22, 0.09]} position={[x + side * 0.28, 1.72, -1.34]} color="#f1c4a5" />
    </group>
  );
}

function SharpsAndGloves({ roomX, side }: { roomX: number; side: -1 | 1 }) {
  const x = roomX - side * 2.68;
  return (
    <group>
      <Box size={[0.1, 0.28, 0.36]} position={[x, 1.65, -5.12]} color="#d5a838" roughness={0.6} />
      <Box size={[0.08, 0.22, 0.4]} position={[x, 1.95, -5.12]} color="#edf0ed" />
      <Box size={[0.08, 0.22, 0.4]} position={[x, 2.2, -5.12]} color="#edf0ed" />
    </group>
  );
}

function PrivacyCurtain({ roomX }: { roomX: number }) {
  return (
    <group>
      <Box size={[2.1, 0.035, 0.035]} position={[roomX, 2.65, -2.35]} color="#8c9699" metalness={0.5} />
      <Box size={[0.035, 2.1, 0.035]} position={[roomX - 1.02, 1.62, -2.35]} color="#8c9699" metalness={0.5} />
      <Box size={[0.035, 2.1, 0.035]} position={[roomX + 1.02, 1.62, -2.35]} color="#8c9699" metalness={0.5} />
      {[-0.72, -0.36, 0, 0.36, 0.72].map((offset) => (
        <Box key={offset} size={[0.34, 1.7, 0.018]} position={[roomX + offset, 1.65, -2.33]} color="#c9dfe0" roughness={0.96} />
      ))}
    </group>
  );
}

function FloorWayfinding() {
  return (
    <>
      <Box size={[0.045, 0.006, 10.5]} position={[-0.48, 0.007, -2.2]} color="#2d7f8b" roughness={0.75} />
      <Box size={[0.045, 0.006, 10.5]} position={[0.48, 0.007, -2.2]} color="#c1843d" roughness={0.75} />
    </>
  );
}

export function HospitalClinicalDetails() {
  return (
    <group>
      <CorridorRail side={-1} />
      <CorridorRail side={1} />
      <DoorFrame x={0} side={-1} />
      <DoorFrame x={0} side={1} />
      <FloorWayfinding />

      <ClinicalHeadwall roomX={-5.35} side={-1} />
      <ClinicalHeadwall roomX={5.35} side={1} />
      <SinkStation roomX={-5.35} side={-1} />
      <SinkStation roomX={5.35} side={1} />
      <SharpsAndGloves roomX={-5.35} side={-1} />
      <SharpsAndGloves roomX={5.35} side={1} />
      <PrivacyCurtain roomX={-5.35} />
      <PrivacyCurtain roomX={5.35} />
    </group>
  );
}

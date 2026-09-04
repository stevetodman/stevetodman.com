import { Box, Cylinder } from "./primitives";

function ClinicianEnhancement({
  position,
  coat = true,
  scrubColor = "#3f8ca4",
}: {
  position: [number, number, number];
  coat?: boolean;
  scrubColor?: string;
}) {
  const outer = coat ? "#eef1ef" : scrubColor;
  const skin = "#b97858";
  return (
    <group position={position}>
      {/* shoulders / tapered torso overlays preserve the existing low-cost body */}
      <Box size={[0.52, 0.16, 0.28]} position={[0, 1.28, 0]} color={outer} roughness={0.78} />
      <Box size={[0.38, 0.18, 0.25]} position={[0, 0.58, 0]} color={coat ? scrubColor : outer} roughness={0.82} />

      {/* neck, hair, ears and face detail */}
      <Cylinder radius={0.09} height={0.14} position={[0, 1.38, 0]} color={skin} />
      <mesh position={[0, 1.71, 0.015]} castShadow>
        <sphereGeometry args={[0.235, 16, 12]} />
        <meshStandardMaterial color="#2c2421" roughness={0.92} />
      </mesh>
      <Box size={[0.25, 0.09, 0.06]} position={[0, 1.73, -0.205]} color="#2c2421" roughness={0.92} />
      <Cylinder radius={0.035} height={0.07} position={[-0.235, 1.59, 0]} rotation={[0, 0, Math.PI / 2]} color={skin} />
      <Cylinder radius={0.035} height={0.07} position={[0.235, 1.59, 0]} rotation={[0, 0, Math.PI / 2]} color={skin} />
      <Box size={[0.045, 0.018, 0.02]} position={[-0.075, 1.62, -0.222]} color="#1c2528" />
      <Box size={[0.045, 0.018, 0.02]} position={[0.075, 1.62, -0.222]} color="#1c2528" />
      <Box size={[0.085, 0.015, 0.018]} position={[0, 1.51, -0.225]} color="#7e473e" />

      {/* forearms / hands */}
      <Cylinder radius={0.055} height={0.38} position={[-0.33, 0.78, -0.02]} rotation={[0.12, 0, -0.08]} color={skin} />
      <Cylinder radius={0.055} height={0.38} position={[0.33, 0.78, -0.02]} rotation={[0.12, 0, 0.08]} color={skin} />
      <mesh position={[-0.35, 0.57, -0.035]}><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color={skin} roughness={0.8} /></mesh>
      <mesh position={[0.35, 0.57, -0.035]}><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color={skin} roughness={0.8} /></mesh>

      {/* trousers and shoes */}
      <Cylinder radius={0.09} height={0.72} position={[-0.12, 0.18, 0]} color="#253139" />
      <Cylinder radius={0.09} height={0.72} position={[0.12, 0.18, 0]} color="#253139" />
      <Box size={[0.2, 0.1, 0.34]} position={[-0.12, -0.18, -0.08]} color="#25292b" roughness={0.88} />
      <Box size={[0.2, 0.1, 0.34]} position={[0.12, -0.18, -0.08]} color="#25292b" roughness={0.88} />

      {/* badge + stethoscope cues */}
      <Box size={[0.13, 0.17, 0.018]} position={[0.16, 1.2, -0.17]} color="#f5f7f5" />
      <Box size={[0.09, 0.03, 0.021]} position={[0.16, 1.24, -0.182]} color="#2b7990" />
      <Cylinder radius={0.018} height={0.36} position={[-0.105, 1.15, -0.17]} rotation={[0, 0, -0.45]} color="#26343a" />
      <Cylinder radius={0.018} height={0.36} position={[0.105, 1.15, -0.17]} rotation={[0, 0, 0.45]} color="#26343a" />
      <mesh position={[0, 0.98, -0.19]}><torusGeometry args={[0.07, 0.018, 8, 16]} /><meshStandardMaterial color="#26343a" roughness={0.55} /></mesh>
    </group>
  );
}

function VitalSignsMonitor({ position, mirrored = false }: { position: [number, number, number]; mirrored?: boolean }) {
  const side = mirrored ? -1 : 1;
  return (
    <group position={position}>
      <Box size={[0.64, 0.5, 0.12]} position={[0, 1.46, 0]} color="#20292e" metalness={0.18} />
      <Box size={[0.54, 0.38, 0.025]} position={[0, 1.47, -0.073]} color="#08191d" roughness={0.2} />
      {[[-0.18, 1.5, 0.16], [-0.04, 1.44, 0.1], [0.08, 1.53, 0.18], [0.2, 1.46, 0.12]].map(([x, y, w], i) => (
        <Box key={i} size={[w, 0.018, 0.008]} position={[x, y, -0.09]} color={i % 2 ? "#f0bd59" : "#67d8b0"} />
      ))}
      <Cylinder radius={0.035} height={0.9} position={[0, 0.82, 0]} color="#687379" />
      <Box size={[0.62, 0.045, 0.42]} position={[0, 0.36, 0]} color="#7d888d" />
      {[-0.24, 0.24].flatMap((x) => [-0.15, 0.15].map((z) => (
        <Cylinder key={`${x}-${z}`} radius={0.045} height={0.07} position={[x, 0.28, z]} color="#30373a" />
      )))}
      <Box size={[0.05, 0.05, 0.65]} position={[side * 0.36, 1.05, -0.1]} rotation={[0.12, 0.2, 0]} color="#4b585e" />
    </group>
  );
}

function WallOtoscopeStation({ position, mirrored = false }: { position: [number, number, number]; mirrored?: boolean }) {
  const side = mirrored ? -1 : 1;
  return (
    <group position={position}>
      <Box size={[0.08, 0.58, 0.5]} position={[0, 0, 0]} color="#f1f2ed" roughness={0.62} />
      <Box size={[0.1, 0.38, 0.09]} position={[side * 0.08, 0.05, -0.12]} color="#2e373b" />
      <Cylinder radius={0.045} height={0.3} position={[side * 0.09, 0.06, -0.19]} color="#343e43" />
      <Box size={[0.06, 0.28, 0.08]} position={[side * 0.08, -0.12, 0.12]} color="#343e43" />
      <Cylinder radius={0.02} height={0.36} position={[side * 0.12, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} color="#535f64" />
    </group>
  );
}

function ExamRoomEquipment({ roomX, mirrored = false }: { roomX: number; mirrored?: boolean }) {
  const side = mirrored ? -1 : 1;
  return (
    <group>
      <VitalSignsMonitor position={[roomX + side * 1.9, 0, -4.92]} mirrored={mirrored} />
      <WallOtoscopeStation position={[roomX - side * 2.92, 1.65, -2.0]} mirrored={mirrored} />
      {/* rolling supply cart */}
      <Box size={[0.82, 0.72, 0.54]} position={[roomX + side * 1.65, 0.46, -1.0]} color="#dfe5e3" roughness={0.62} />
      {[0.28, 0.48, 0.68].map((y) => <Box key={y} size={[0.7, 0.035, 0.04]} position={[roomX + side * 1.65, y, -1.275]} color="#8d999c" />)}
      {[-0.31, 0.31].flatMap((x) => [-0.2, 0.2].map((z) => (
        <Cylinder key={`${x}-${z}`} radius={0.045} height={0.07} position={[roomX + side * 1.65 + x, 0.065, -1 + z]} color="#30383b" />
      )))}
      {/* waste / linen receptacles */}
      <Cylinder radius={0.22} height={0.52} position={[roomX - side * 2.48, 0.26, -4.95]} color="#9aa7a7" />
      <Box size={[0.46, 0.06, 0.46]} position={[roomX - side * 2.48, 0.54, -4.95]} color="#697577" />
    </group>
  );
}

export function HospitalRealismPass2() {
  return (
    <group>
      <ClinicianEnhancement position={[0, 0, 10.55]} coat />
      <ClinicianEnhancement position={[2.6, 0, 8.8]} coat={false} scrubColor="#3f8ca4" />
      <ExamRoomEquipment roomX={-5.35} mirrored />
      <ExamRoomEquipment roomX={5.35} />
    </group>
  );
}

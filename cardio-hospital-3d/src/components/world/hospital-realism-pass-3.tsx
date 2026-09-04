import { Box, Cylinder } from "./primitives";

function CorridorCeilingGrid() {
  const zLines = [3.7, 2.2, 0.7, -0.8, -2.3, -3.8, -5.3, -6.8];
  return (
    <group>
      <Box size={[4.46, 0.035, 11.8]} position={[0, 2.965, -2]} color="#f3f2ec" roughness={0.93} />
      {zLines.map((z) => (
        <Box key={z} size={[4.3, 0.018, 0.025]} position={[0, 2.94, z]} color="#b9c0c1" roughness={0.8} />
      ))}
      {[-1.45, 0, 1.45].map((x) => (
        <Box key={x} size={[0.025, 0.018, 11.3]} position={[x, 2.94, -2]} color="#b9c0c1" roughness={0.8} />
      ))}
      {[-5.5, -1.0, 3.2].map((z) => (
        <group key={z}>
          <Box size={[0.54, 0.03, 0.54]} position={[1.38, 2.925, z]} color="#e3e6e3" roughness={0.72} />
          <Cylinder radius={0.075} height={0.035} position={[-1.38, 2.925, z]} color="#d9dedd" />
        </group>
      ))}
    </group>
  );
}

function CorridorBaseboardsAndBumpers() {
  return (
    <group>
      {[-1, 1].map((side) => {
        const x = side * 2.16;
        return (
          <group key={side}>
            <Box size={[0.07, 0.16, 5.0]} position={[x, 0.08, 1.45]} color="#7e898d" roughness={0.58} />
            <Box size={[0.07, 0.16, 3.58]} position={[x, 0.08, -6.16]} color="#7e898d" roughness={0.58} />
            <Box size={[0.085, 0.22, 4.95]} position={[x, 0.68, 1.45]} color="#c5d0cf" roughness={0.8} />
            <Box size={[0.085, 0.22, 3.5]} position={[x, 0.68, -6.16]} color="#c5d0cf" roughness={0.8} />
          </group>
        );
      })}
    </group>
  );
}

function PediatricWallArt({ position, colors }: { position: [number, number, number]; colors: string[] }) {
  return (
    <group position={position}>
      <Box size={[1.45, 0.92, 0.045]} position={[0, 0, 0]} color="#f4f4ef" roughness={0.8} />
      <Box size={[1.34, 0.8, 0.018]} position={[0, 0, -0.032]} color="#d7ebe8" roughness={0.92} />
      {colors.map((color, i) => (
        <mesh key={color} position={[-0.42 + i * 0.28, -0.05 + (i % 2) * 0.18, -0.055]}>
          <sphereGeometry args={[0.12 + (i % 2) * 0.025, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.86} />
        </mesh>
      ))}
      <Box size={[0.65, 0.06, 0.015]} position={[0.18, -0.29, -0.06]} color="#5c8c8a" />
    </group>
  );
}

function ExamRoomFinishes({ roomX, mirrored = false }: { roomX: number; mirrored?: boolean }) {
  const side = mirrored ? -1 : 1;
  return (
    <group>
      {/* baseboards */}
      <Box size={[5.9, 0.14, 0.06]} position={[roomX, 0.07, -5.91]} color="#768487" roughness={0.62} />
      <Box size={[5.9, 0.14, 0.06]} position={[roomX, 0.07, -0.09]} color="#768487" roughness={0.62} />
      <Box size={[0.06, 0.14, 5.7]} position={[roomX + side * 3.0, 0.07, -3]} color="#768487" roughness={0.62} />

      {/* wall clock */}
      <mesh position={[roomX - side * 2.72, 2.18, -1.48]} rotation={[0, side * Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.045, 18]} />
        <meshStandardMaterial color="#f5f5f1" roughness={0.7} />
      </mesh>
      <Box size={[0.012, 0.14, 0.014]} position={[roomX - side * 2.745, 2.22, -1.48]} rotation={[0, 0, 0.4]} color="#283136" />
      <Box size={[0.012, 0.1, 0.014]} position={[roomX - side * 2.745, 2.16, -1.48]} rotation={[0, 0, -0.85]} color="#283136" />

      {/* pediatric art on rear wall */}
      <PediatricWallArt
        position={[roomX + side * 0.75, 1.88, -5.94]}
        colors={mirrored ? ["#5f9da2", "#e6a75e", "#7eb07d", "#d47f8c"] : ["#6f8fb4", "#d98a62", "#75a9a4", "#d7ba5e"]}
      />

      {/* privacy / infection-control notices */}
      <Box size={[0.58, 0.75, 0.035]} position={[roomX - side * 2.9, 1.7, -4.5]} color="#edf1ec" roughness={0.8} />
      {[0.18, 0.02, -0.14].map((y) => (
        <Box key={y} size={[0.38, 0.025, 0.012]} position={[roomX - side * 2.92, 1.7 + y, -4.5]} color="#5b7e83" />
      ))}

      {/* floor boundary stripe near exam zone */}
      <Box size={[2.5, 0.008, 0.045]} position={[roomX, 0.009, -2.3]} color={mirrored ? "#5c9ea5" : "#c68b4d"} roughness={0.8} />
    </group>
  );
}

function TeamRoomFinishes() {
  return (
    <group>
      <Box size={[9.7, 0.14, 0.07]} position={[0, 0.07, 11.9]} color="#59666b" roughness={0.65} />
      <Box size={[9.7, 0.14, 0.07]} position={[0, 0.07, 4.1]} color="#59666b" roughness={0.65} />
      <Box size={[0.07, 0.14, 7.6]} position={[-4.9, 0.07, 8]} color="#59666b" roughness={0.65} />
      <Box size={[0.07, 0.14, 7.6]} position={[4.9, 0.07, 8]} color="#59666b" roughness={0.65} />
      <Box size={[1.15, 0.68, 0.045]} position={[3.9, 1.9, 11.88]} color="#f0eee7" />
      {[1.72, 1.88, 2.04].map((y, i) => (
        <Box key={y} size={[0.78 - i * 0.12, 0.025, 0.012]} position={[3.9, y, 11.84]} color={i === 0 ? "#a65b52" : "#5b7f8a"} />
      ))}
      <Cylinder radius={0.08} height={0.035} position={[-4.83, 1.55, 10.8]} rotation={[0, 0, Math.PI / 2]} color="#d9ddda" />
    </group>
  );
}

export function HospitalRealismPass3() {
  return (
    <group>
      <CorridorCeilingGrid />
      <CorridorBaseboardsAndBumpers />
      <ExamRoomFinishes roomX={-5.35} mirrored />
      <ExamRoomFinishes roomX={5.35} />
      <TeamRoomFinishes />
    </group>
  );
}

import type { ThreeElements } from "@react-three/fiber";

type BoxProps = ThreeElements["mesh"] & {
  size: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
};

export function Box({ size, color, roughness = 0.72, metalness = 0, ...props }: BoxProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

export function Cylinder({
  radius,
  height,
  color,
  ...props
}: ThreeElements["mesh"] & { radius: number; height: number; color: string }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[radius, radius, height, 24]} />
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
  );
}

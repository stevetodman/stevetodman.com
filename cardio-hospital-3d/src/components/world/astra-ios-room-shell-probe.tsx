"use client";

/**
 * Diagnostic control after the physical-iPhone static glTF probe blanked the 3D world.
 *
 * This deliberately adds one tiny native R3F/Three mesh only. There is no asset
 * fetch, useGLTF, Suspense, lightmap, animation, collision, lighting change, or
 * clinical-state ownership. If the physical iPhone renders and moves normally
 * with this control, the regression is narrowed to the glTF loader/asset path.
 */
export function AstraIosRoomShellProbe() {
  return (
    <mesh position={[-5.35, 1.15, -3]} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      <meshStandardMaterial color="#4d858b" roughness={0.65} metalness={0} />
    </mesh>
  );
}

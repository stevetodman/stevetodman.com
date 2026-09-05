"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo } from "react";
import { LinearSRGBColorSpace, Mesh, MeshStandardMaterial, Object3D } from "three";
import { PROOF_ROOM_LIGHTMAP_DATA_URI } from "./proof-room-lightmap-data";

const ROOM_ASSET = "/hospital/assets/hospital/astra-proof/proof-room-one.gltf";
const ROOM_ORIGIN: [number, number, number] = [-5.35, 0, -3];

type HalfExtents = [number, number, number];
type Vec3 = [number, number, number];

function world(local: Vec3): Vec3 {
  return [ROOM_ORIGIN[0] + local[0], ROOM_ORIGIN[1] + local[1], ROOM_ORIGIN[2] + local[2]];
}

function FixedCuboid({ position, halfExtents }: { position: Vec3; halfExtents: HalfExtents }) {
  return (
    <RigidBody type="fixed" colliders={false} restitution={0} friction={0.9} position={position}>
      <CuboidCollider args={halfExtents} />
    </RigidBody>
  );
}

/**
 * Phase-1 authored-hybrid proof room.
 * Visual geometry is loaded from an offline-authored glTF. Collision remains explicit,
 * simple Rapier geometry so a visual asset edit cannot silently change traversal.
 */
export function AuthoredProofRoomOne() {
  const source = useGLTF(ROOM_ASSET);
  const lightMap = useTexture(PROOF_ROOM_LIGHTMAP_DATA_URI);
  const room = useMemo(() => source.scene.clone(true), [source.scene]);

  useEffect(() => {
    lightMap.channel = 1;
    lightMap.flipY = false;
    lightMap.colorSpace = LinearSRGBColorSpace;
    lightMap.needsUpdate = true;

    room.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = false;
      object.receiveShadow = object.name === "lm_floor";
      const receivesBake = object.name.startsWith("lm_");
      const configure = (material: MeshStandardMaterial) => {
        const next = material.clone();
        if (receivesBake) {
          next.lightMap = lightMap;
          next.lightMapIntensity = 1.05;
        }
        next.needsUpdate = true;
        return next;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => configure(material as MeshStandardMaterial))
        : configure(object.material as MeshStandardMaterial);
    });
  }, [lightMap, room]);

  return (
    <>
      <primitive object={room} position={ROOM_ORIGIN} />

      {/* Room shell: same accepted world bounds and doorway as the canonical layout. */}
      <FixedCuboid position={world([0, -0.05, 0])} halfExtents={[3.1, 0.05, 3]} />
      <FixedCuboid position={world([0, 1.5, 3])} halfExtents={[3.1, 1.5, 0.06]} />
      <FixedCuboid position={world([0, 1.5, -3])} halfExtents={[3.1, 1.5, 0.06]} />
      <FixedCuboid position={world([-3.1, 1.5, 0])} halfExtents={[0.06, 1.5, 3]} />
      <FixedCuboid position={world([3.1, 1.5, 1.95])} halfExtents={[0.06, 1.5, 1.05]} />
      <FixedCuboid position={world([3.1, 1.5, -1.95])} halfExtents={[0.06, 1.5, 1.05]} />

      {/* Major fixed furniture only; decorative/detail meshes never drive collision. */}
      <FixedCuboid position={world([-1.9, 0.45, -0.7])} halfExtents={[0.46, 0.45, 0.96]} />
      <FixedCuboid position={world([-1.05, 0.43, -2.55])} halfExtents={[1.3, 0.43, 0.34]} />
    </>
  );
}

/** One bounded real-time key for people/material response; static room illumination is baked. */
export function AuthoredProofRoomLighting() {
  const target = useMemo(() => {
    const object = new Object3D();
    object.position.set(-6.35, 0.9, -3.5);
    return object;
  }, []);

  return (
    <>
      <primitive object={target} />
      <spotLight
        target={target}
        position={[-5.35, 2.82, -2.7]}
        intensity={2.15}
        distance={5.4}
        decay={2}
        angle={0.82}
        penumbra={0.72}
        color="#fff0d5"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.15}
        shadow-camera-far={6}
        shadow-bias={-0.0004}
      />
    </>
  );
}

useGLTF.preload(ROOM_ASSET);

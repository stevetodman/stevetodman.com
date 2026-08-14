import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const WALK_SPEED = 2.25;
const FAST_SPEED = 3.6;

export function PlayerController() {
  const body = useRef<RapierRigidBody>(null);
  const keys = useRef<Record<string, boolean>>({});
  const { camera } = useThree();
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
    };
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame(() => {
    const rigidBody = body.current;
    if (!rigidBody) return;
    const velocity = rigidBody.linvel();
    const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? FAST_SPEED : WALK_SPEED;

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    movement.current.set(0, 0, 0);
    if (keys.current.KeyW || keys.current.ArrowUp) movement.current.add(forward.current);
    if (keys.current.KeyS || keys.current.ArrowDown) movement.current.sub(forward.current);
    if (keys.current.KeyD || keys.current.ArrowRight) movement.current.sub(right.current);
    if (keys.current.KeyA || keys.current.ArrowLeft) movement.current.add(right.current);
    if (movement.current.lengthSq() > 0) movement.current.normalize().multiplyScalar(speed);

    rigidBody.setLinvel({ x: movement.current.x, y: velocity.y, z: movement.current.z }, true);
    const position = rigidBody.translation();
    camera.position.set(position.x, position.y + 0.62, position.z);
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[0, 0.95, 8.65]}
      enabledRotations={[false, false, false]}
      mass={70}
      friction={0.2}
      linearDamping={6}
      canSleep={false}
    >
      <CapsuleCollider args={[0.48, 0.31]} />
    </RigidBody>
  );
}

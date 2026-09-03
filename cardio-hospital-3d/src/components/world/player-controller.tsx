import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { HospitalLocation } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";

const WALK_SPEED = 2.25;
const FAST_SPEED = 3.6;

function locationForPosition(x: number, z: number): HospitalLocation | null {
  if (x > -4.9 && x < 4.9 && z > 4.2 && z < 11.9) return "workroom";
  if (x > 2.2 && x < 8.5 && z > -6.1 && z < 0.1) return "clinic-room-3";
  if (x > -2.4 && x < 2.4 && z > -8.1 && z <= 4.2) return "clinic-corridor";
  return null;
}

export function PlayerController() {
  const body = useRef<RapierRigidBody>(null);
  const keys = useRef<Record<string, boolean>>({});
  const lastLocation = useRef<HospitalLocation | null>(null);
  const { camera } = useThree();
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());
  const shiftStatus = useHospitalStore((state) => state.hospital.shift.status);
  const dispatch = useHospitalStore((state) => state.dispatch);

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

    if (shiftStatus === "active") {
      const location = locationForPosition(position.x, position.z);
      if (location && location !== lastLocation.current) {
        lastLocation.current = location;
        dispatch({ type: "LOCATION_CHANGED", location });
      }
    }
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

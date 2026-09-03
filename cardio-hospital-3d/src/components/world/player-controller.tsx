import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { HospitalLocation } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { locationForWorldPosition } from "@/lib/hospital-world-layout";
import { useSimulationStore } from "@/lib/simulation-store";

const WALK_SPEED = 2.25;
const FAST_SPEED = 3.6;
const MOBILE_DEAD_ZONE = 0.08;

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
    const ui = useSimulationStore.getState();
    const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? FAST_SPEED : WALK_SPEED;

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    movement.current.set(0, 0, 0);
    const keyboardActive =
      keys.current.KeyW || keys.current.ArrowUp ||
      keys.current.KeyS || keys.current.ArrowDown ||
      keys.current.KeyD || keys.current.ArrowRight ||
      keys.current.KeyA || keys.current.ArrowLeft;

    if (!ui.briefingOpen && !ui.encounterOpen) {
      if (keyboardActive) {
        if (keys.current.KeyW || keys.current.ArrowUp) movement.current.add(forward.current);
        if (keys.current.KeyS || keys.current.ArrowDown) movement.current.sub(forward.current);
        if (keys.current.KeyD || keys.current.ArrowRight) movement.current.add(right.current);
        if (keys.current.KeyA || keys.current.ArrowLeft) movement.current.sub(right.current);
        if (movement.current.lengthSq() > 0) movement.current.normalize().multiplyScalar(speed);
      } else {
        const { x, y } = ui.mobileMove;
        const magnitude = Math.min(1, Math.hypot(x, y));
        if (magnitude > MOBILE_DEAD_ZONE) {
          movement.current.addScaledVector(forward.current, y);
          movement.current.addScaledVector(right.current, x);
          if (movement.current.lengthSq() > 1) movement.current.normalize();
          movement.current.multiplyScalar(speed);
        }
      }
    }

    rigidBody.setLinvel({ x: movement.current.x, y: velocity.y, z: movement.current.z }, true);
    const position = rigidBody.translation();
    camera.position.set(position.x, position.y + 0.62, position.z);

    if (shiftStatus === "active") {
      const location = locationForWorldPosition(position.x, position.z);
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

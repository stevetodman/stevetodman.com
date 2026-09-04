import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulation-store";

const LOOK_SPEED_YAW = 1.85;
const LOOK_SPEED_PITCH = 1.35;
const MAX_PITCH = Math.PI * 0.43;
const LOOK_DEAD_ZONE = 0.1;

/**
 * Mobile camera look is driven by the dedicated right joystick. Desktop mouse
 * look remains owned by PointerLockControls. This never changes domain state.
 */
export function TouchLookControls() {
  const { camera } = useThree();
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  useFrame((_, delta) => {
    const ui = useSimulationStore.getState();
    if (!ui.entered || ui.briefingOpen || ui.encounterOpen) return;

    const { x, y } = ui.mobileLook;
    if (Math.hypot(x, y) < LOOK_DEAD_ZONE) return;

    euler.current.setFromQuaternion(camera.quaternion, "YXZ");
    euler.current.y -= x * LOOK_SPEED_YAW * delta;
    euler.current.x = THREE.MathUtils.clamp(
      euler.current.x + y * LOOK_SPEED_PITCH * delta,
      -MAX_PITCH,
      MAX_PITCH,
    );
    euler.current.z = 0;
    camera.quaternion.setFromEuler(euler.current);
  });

  return null;
}

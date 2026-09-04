import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/simulation-store";

const LOOK_SENSITIVITY_X = 0.0022;
const LOOK_SENSITIVITY_Y = 0.0018;
const MAX_PITCH = Math.PI * 0.43;
const LOOK_ZONE_START = 0.5;
const MAX_POINTER_DELTA_PX = 34;

/**
 * Touch/pen camera look for mobile devices. Desktop mouse look remains owned
 * by PointerLockControls. This controller never changes simulation/domain state.
 */
export function TouchLookControls() {
  const { camera, gl } = useThree();
  const activePointer = useRef<number | null>(null);
  const lastPoint = useRef({ x: 0, y: 0 });
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  useEffect(() => {
    const canvas = gl.domElement;

    const canLook = () => {
      const ui = useSimulationStore.getState();
      return ui.entered && !ui.briefingOpen && !ui.encounterOpen;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || !event.isPrimary || !canLook()) return;
      if (activePointer.current !== null) return;

      const rect = canvas.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      if (relativeX < rect.width * LOOK_ZONE_START) return;

      event.preventDefault();
      activePointer.current = event.pointerId;
      lastPoint.current = { x: event.clientX, y: event.clientY };
      euler.current.setFromQuaternion(camera.quaternion, "YXZ");
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Some iOS/WebKit versions may reject capture; move/up still work.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (activePointer.current !== event.pointerId || !canLook()) return;
      event.preventDefault();

      const rawDx = event.clientX - lastPoint.current.x;
      const rawDy = event.clientY - lastPoint.current.y;
      lastPoint.current = { x: event.clientX, y: event.clientY };

      // WebKit can occasionally report a large pointer jump after capture or
      // browser-chrome changes. Clamp one-frame deltas so camera movement stays
      // predictable without making normal drags feel sluggish.
      const dx = THREE.MathUtils.clamp(rawDx, -MAX_POINTER_DELTA_PX, MAX_POINTER_DELTA_PX);
      const dy = THREE.MathUtils.clamp(rawDy, -MAX_POINTER_DELTA_PX, MAX_POINTER_DELTA_PX);

      euler.current.y -= dx * LOOK_SENSITIVITY_X;
      euler.current.x = THREE.MathUtils.clamp(
        euler.current.x - dy * LOOK_SENSITIVITY_Y,
        -MAX_PITCH,
        MAX_PITCH
      );
      euler.current.z = 0;
      camera.quaternion.setFromEuler(euler.current);
    };

    const releasePointer = (event: PointerEvent) => {
      if (activePointer.current !== event.pointerId) return;
      activePointer.current = null;
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore pointer-capture cleanup differences across browsers.
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", releasePointer);
    canvas.addEventListener("pointercancel", releasePointer);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", releasePointer);
      canvas.removeEventListener("pointercancel", releasePointer);
    };
  }, [camera, gl]);

  return null;
}

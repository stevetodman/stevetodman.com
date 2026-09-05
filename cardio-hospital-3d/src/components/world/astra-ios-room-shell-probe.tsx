"use client";

import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ROOM_SHELL_ASSET = "/hospital/assets/hospital/astra-probe/room-shell-only.gltf";
const ROOM_SHELL_BASE = "/hospital/assets/hospital/astra-probe/";

/**
 * Diagnostic step after physical iPhone confirmed that direct fetch + JSON.parse
 * of the exact glTF is healthy.
 *
 * This fetches the same text, then asks Three's GLTFLoader to parse it, but never
 * inserts the resulting scene into React Three Fiber. There is no useGLTF,
 * Suspense, animation, lightmap, collision, or parsed-scene rendering.
 */
export function AstraIosRoomShellProbe() {
  useEffect(() => {
    const controller = new AbortController();

    void fetch(ROOM_SHELL_ASSET, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Astra probe HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => {
        if (controller.signal.aborted) return;

        const loader = new GLTFLoader();
        loader.parse(
          text,
          ROOM_SHELL_BASE,
          () => {
            if (!controller.signal.aborted) {
              console.info("Astra iOS GLTFLoader.parse probe passed.");
            }
          },
          (error) => {
            if (!controller.signal.aborted) {
              console.error("Astra iOS GLTFLoader.parse probe failed.", error);
            }
          },
        );
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Astra iOS glTF parser probe fetch failed.", error);
      });

    return () => controller.abort();
  }, []);

  return (
    <mesh position={[-5.35, 1.15, -3]} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      <meshStandardMaterial color="#4d858b" roughness={0.65} metalness={0} />
    </mesh>
  );
}

"use client";

import { useEffect } from "react";

const ROOM_SHELL_ASSET = "/hospital/assets/hospital/astra-probe/room-shell-only.gltf";

/**
 * Diagnostic control after the physical-iPhone static useGLTF probe blanked the
 * 3D world while a native R3F mesh worked normally.
 *
 * This step requests the exact glTF file and parses only its JSON with the browser.
 * It deliberately does NOT invoke useGLTF/GLTFLoader, Suspense, textures, animation,
 * collision, or render anything from the asset. The tiny native mesh remains as a
 * harmless scene-insertion control.
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
        JSON.parse(text);
        console.info("Astra iOS glTF fetch/JSON probe passed.");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Astra iOS glTF fetch/JSON probe failed.", error);
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

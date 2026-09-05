"use client";

import { useEffect, useState } from "react";
import type { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ROOM_SHELL_ASSET = "/hospital/assets/hospital/astra-probe/room-shell-only.gltf";
const ROOM_SHELL_BASE = "/hospital/assets/hospital/astra-probe/";
const ROOM_ORIGIN: [number, number, number] = [-5.35, 0, -3];

/**
 * Diagnostic step after physical iPhone confirmed GLTFLoader.parse is healthy.
 *
 * This manually fetches + parses the exact glTF and then inserts only the parsed
 * Three scene with <primitive>. There is still no Drei useGLTF, Suspense,
 * preloading, animation, lightmap, or collision change.
 */
export function AstraIosRoomShellProbe() {
  const [parsedScene, setParsedScene] = useState<Group | null>(null);

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
          (gltf) => {
            if (!controller.signal.aborted) {
              console.info("Astra iOS manual glTF scene-render probe parsed.");
              setParsedScene(gltf.scene);
            }
          },
          (error) => {
            if (!controller.signal.aborted) {
              console.error("Astra iOS manual glTF scene-render probe failed.", error);
            }
          },
        );
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Astra iOS manual glTF scene-render fetch failed.", error);
      });

    return () => controller.abort();
  }, []);

  return (
    <>
      <mesh position={[-5.35, 1.15, -3]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial color="#4d858b" roughness={0.65} metalness={0} />
      </mesh>
      {parsedScene ? <primitive object={parsedScene} position={ROOM_ORIGIN} /> : null}
    </>
  );
}

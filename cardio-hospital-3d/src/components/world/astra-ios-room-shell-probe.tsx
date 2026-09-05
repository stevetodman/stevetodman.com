"use client";

import { useEffect, useState } from "react";
import type { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ROOM_SHELL_ASSET = "/hospital/assets/hospital/astra-probe/room-shell-only.gltf";
const ROOM_SHELL_BASE = "/hospital/assets/hospital/astra-probe/";
const ROOM_ORIGIN: [number, number, number] = [-5.35, 0, -3];

/**
 * First permanent Astra authored-visual slice.
 *
 * Physical-iPhone isolation established that the asset, network request,
 * GLTFLoader.parse(), and manual <primitive> rendering are healthy, while every
 * suspend-based hook path tested (R3F useLoader and Drei useGLTF variants) blanked
 * the world and disabled touch movement. Keep authored HospitalSim assets off the
 * suspend-based loader path until that behavior is explicitly re-qualified.
 *
 * Failure is intentionally contained: until parsing succeeds, the legacy hospital
 * remains fully rendered and interactive; a fetch/parse failure only logs and never
 * throws into the live R3F tree.
 */
export function AuthoredRoomShell() {
  const [scene, setScene] = useState<Group | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(ROOM_SHELL_ASSET, { signal: controller.signal, cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Authored room shell HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => {
        if (controller.signal.aborted) return;

        const loader = new GLTFLoader();
        loader.parse(
          text,
          ROOM_SHELL_BASE,
          (gltf) => {
            if (!controller.signal.aborted) setScene(gltf.scene);
          },
          (error) => {
            if (!controller.signal.aborted) {
              console.error("Authored room shell parse failed; legacy visuals retained.", error);
            }
          },
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Authored room shell load failed; legacy visuals retained.", error);
        }
      });

    return () => controller.abort();
  }, []);

  return scene ? <primitive object={scene} position={ROOM_ORIGIN} /> : null;
}

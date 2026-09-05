"use client";

import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ROOM_SHELL_ASSET = "/hospital/assets/hospital/astra-probe/room-shell-only.gltf";
const ROOM_SHELL_BASE = "/hospital/assets/hospital/astra-probe/";
const ROOM_ORIGIN: [number, number, number] = [-5.35, 0, -3];

type ProbeMode = "manual" | "use-loader" | "use-gltf" | "use-gltf-clone" | "use-gltf-suspense";

function probeModeFromLocation(): ProbeMode {
  if (typeof window === "undefined") return "manual";
  const value = new URLSearchParams(window.location.search).get("astraProbe");
  if (
    value === "use-loader" ||
    value === "use-gltf" ||
    value === "use-gltf-clone" ||
    value === "use-gltf-suspense"
  ) {
    return value;
  }
  return "manual";
}

function ControlMarker() {
  return (
    <mesh position={[-5.35, 1.15, -3]} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      <meshStandardMaterial color="#4d858b" roughness={0.65} metalness={0} />
    </mesh>
  );
}

function ManualParsedScene() {
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
            if (!controller.signal.aborted) setParsedScene(gltf.scene);
          },
          (error) => {
            if (!controller.signal.aborted) console.error("Astra manual parser probe failed.", error);
          },
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error("Astra manual parser probe fetch failed.", error);
      });

    return () => controller.abort();
  }, []);

  return parsedScene ? <primitive object={parsedScene} position={ROOM_ORIGIN} /> : null;
}

function FiberUseLoaderScene() {
  const gltf = useLoader(GLTFLoader, ROOM_SHELL_ASSET);
  return <primitive object={gltf.scene} position={ROOM_ORIGIN} />;
}

function DreiUseGltfScene() {
  const gltf = useGLTF(ROOM_SHELL_ASSET);
  return <primitive object={gltf.scene} position={ROOM_ORIGIN} />;
}

function DreiUseGltfCloneScene() {
  const gltf = useGLTF(ROOM_SHELL_ASSET);
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={cloned} position={ROOM_ORIGIN} />;
}

/**
 * One-deploy physical-iPhone harness. Each query-param mode changes exactly one
 * loader/render integration variable while preserving the same glTF asset and
 * surrounding hospital scene.
 *
 * Supported URLs:
 *   ?astraProbe=manual
 *   ?astraProbe=use-loader
 *   ?astraProbe=use-gltf
 *   ?astraProbe=use-gltf-clone
 *   ?astraProbe=use-gltf-suspense
 */
export function AstraIosRoomShellProbe() {
  const [mode, setMode] = useState<ProbeMode>("manual");

  useEffect(() => {
    setMode(probeModeFromLocation());
  }, []);

  let probe: React.ReactNode;
  switch (mode) {
    case "use-loader":
      probe = <FiberUseLoaderScene />;
      break;
    case "use-gltf":
      probe = <DreiUseGltfScene />;
      break;
    case "use-gltf-clone":
      probe = <DreiUseGltfCloneScene />;
      break;
    case "use-gltf-suspense":
      probe = (
        <Suspense fallback={null}>
          <DreiUseGltfScene />
        </Suspense>
      );
      break;
    default:
      probe = <ManualParsedScene />;
  }

  return (
    <>
      <ControlMarker />
      {probe}
    </>
  );
}

"use client";

import { useGLTF } from "@react-three/drei";
import { Component, Suspense, useMemo, type ErrorInfo, type ReactNode } from "react";
import { Group } from "three";

const ROOM_SHELL_ASSET = "/hospital/assets/hospital/astra-probe/room-shell-only.gltf";
const ROOM_ORIGIN: [number, number, number] = [-5.35, 0, -3];

class ProbeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Astra iOS room-shell probe failed; legacy HospitalSim remains active.", error, info);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function RoomShellAsset() {
  const source = useGLTF(ROOM_SHELL_ASSET);
  const room = useMemo(() => source.scene.clone(true) as Group, [source.scene]);
  return <primitive object={room} position={ROOM_ORIGIN} />;
}

/**
 * Diagnostic slice 1 for the Astra visual pipeline.
 *
 * Deliberately tests only a tiny static glTF room shell. It does not preload, add
 * lightmaps, replace characters, change animation, modify lighting, or own collision.
 * The accepted legacy room/colliders remain underneath as a fail-safe baseline.
 */
export function AstraIosRoomShellProbe() {
  return (
    <ProbeErrorBoundary>
      <Suspense fallback={null}>
        <RoomShellAsset />
      </Suspense>
    </ProbeErrorBoundary>
  );
}

"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import HospitalWorld from "./hospital-world";

export default function HospitalWorldCanvas() {
  return (
    <Canvas
      id="simulation-canvas"
      shadows
      dpr={[1, 1.65]}
      camera={{ fov: 68, near: 0.05, far: 75, position: [0, 1.57, 8.65] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}><HospitalWorld /></Suspense>
    </Canvas>
  );
}

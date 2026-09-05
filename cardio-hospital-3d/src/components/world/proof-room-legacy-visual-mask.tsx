"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Group, Mesh, Vector3 } from "three";

/**
 * Temporary Phase-1 isolation mask. Legacy detail passes still serve the corridor,
 * team room, and comparison room; meshes inside Clinic Room 1 are hidden so the
 * authored proof is not contaminated by duplicate procedural decoration.
 * Delete this component when progressive replacement reaches those legacy passes.
 */
export function ProofRoomLegacyVisualMask({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);

  useLayoutEffect(() => {
    const point = new Vector3();
    group.current?.updateWorldMatrix(true, true);
    group.current?.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.getWorldPosition(point);
      const insideProofRoom = point.x < -2.2 && point.x > -8.6 && point.z > -6.1 && point.z < 0.1;
      if (insideProofRoom) object.visible = false;
    });
  }, []);

  return <group ref={group}>{children}</group>;
}

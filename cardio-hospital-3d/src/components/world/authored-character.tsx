"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const CHARACTER_ASSETS = {
  adolescent: "/hospital/assets/hospital/astra-proof/proof-character-adolescent.gltf",
  adult: "/hospital/assets/hospital/astra-proof/proof-character-adult.gltf",
} as const;

type Vec3 = [number, number, number];

interface AuthoredCharacterProps {
  model: keyof typeof CHARACTER_ASSETS;
  position: Vec3;
  rotation: Vec3;
  topColor: string;
  bottomColor?: string;
  skinColor?: string;
  animationPhase?: number;
  userData?: Record<string, unknown>;
}

function tintMaterial(material: MeshStandardMaterial, topColor: string, bottomColor: string, skinColor: string) {
  const next = material.clone();
  if (next.name === "top") next.color.set(topColor);
  if (next.name === "bottom") next.color.set(bottomColor);
  if (next.name === "skin") next.color.set(skinColor);
  next.needsUpdate = true;
  return next;
}

/**
 * Minimum Phase-1 character family: coherent skinned adult/adolescent meshes with the
 * same skeleton naming convention and a restrained asynchronous seated idle clip.
 * Clinical visibility remains owned by the canonical hospital store, not animation.
 */
export function AuthoredCharacter({
  model,
  position,
  rotation,
  topColor,
  bottomColor = "#252b32",
  skinColor = "#a86f51",
  animationPhase = 0,
  userData,
}: AuthoredCharacterProps) {
  const source = useGLTF(CHARACTER_ASSETS[model]);
  const actor = useMemo(() => {
    const copied = clone(source.scene) as Group;
    copied.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => tintMaterial(material as MeshStandardMaterial, topColor, bottomColor, skinColor))
        : tintMaterial(object.material as MeshStandardMaterial, topColor, bottomColor, skinColor);
    });
    return copied;
  }, [bottomColor, skinColor, source.scene, topColor]);
  const { actions } = useAnimations(source.animations, actor);

  useEffect(() => {
    Object.assign(actor.userData, userData ?? {});
  }, [actor, userData]);

  useEffect(() => {
    const idle = actions["idle-seated"];
    if (!idle) return;
    idle.reset();
    idle.time = animationPhase;
    idle.setEffectiveTimeScale(0.92);
    idle.fadeIn(0.2).play();
    return () => {
      idle.fadeOut(0.15);
      idle.stop();
    };
  }, [actions, animationPhase]);

  return <primitive object={actor} position={position} rotation={rotation} />;
}

useGLTF.preload(CHARACTER_ASSETS.adolescent);
useGLTF.preload(CHARACTER_ASSETS.adult);

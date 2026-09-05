"use client";

import { useEffect, useState } from "react";
import {
  DataTexture,
  Float32BufferAttribute,
  LinearSRGBColorSpace,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  RGBAFormat,
  UnsignedByteType,
  type Group,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ROOM_SHELL_ASSET = "/hospital/assets/hospital/astra-probe/room-shell-only.gltf";
const ROOM_SHELL_BASE = "/hospital/assets/hospital/astra-probe/";
const ROOM_ORIGIN: [number, number, number] = [-5.35, 0, -3];

const FACE_LIGHT_LEVELS = [
  224, // east-facing
  198, // west-facing
  236, // ceiling-facing
  154, // floor-facing
  208, // north-facing
  176, // south-facing
] as const;

function createBakedRoomLightMap() {
  const data = new Uint8Array(
    FACE_LIGHT_LEVELS.flatMap((level) => [level, level, level, 255]),
  );
  const texture = new DataTexture(data, 3, 2, RGBAFormat, UnsignedByteType);
  texture.name = "astra_room_shell_baked_lightmap";
  texture.colorSpace = LinearSRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.channel = 1;
  texture.needsUpdate = true;
  return texture;
}

function addFaceAtlasUv1(mesh: Mesh) {
  const position = mesh.geometry.getAttribute("position");
  if (!position || position.count !== 24 || mesh.geometry.getAttribute("uv1")) return;

  const centers: [number, number][] = [
    [1 / 6, 1 / 4],
    [3 / 6, 1 / 4],
    [5 / 6, 1 / 4],
    [1 / 6, 3 / 4],
    [3 / 6, 3 / 4],
    [5 / 6, 3 / 4],
  ];
  const uv1 = centers.flatMap(([u, v]) => [u, v, u, v, u, v, u, v]);
  mesh.geometry.setAttribute("uv1", new Float32BufferAttribute(uv1, 2));
}

function applyAuthoredRoomLook(scene: Group, lightMap: DataTexture) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;

    addFaceAtlasUv1(object);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial)) continue;

      material.metalness = 0;
      if (material.name === "wall_paint_probe") {
        material.color.set("#d6e1df");
        material.roughness = 0.74;
      } else if (material.name === "floor_probe") {
        material.color.set("#b9ada0");
        material.roughness = 0.9;
      }
      material.lightMap = lightMap;
      material.lightMapIntensity = 0.72;
      material.needsUpdate = true;
    }
  });
}

/**
 * Authored HospitalSim room-shell proof using the physical-iPhone-qualified loader path.
 *
 * Slice 2 adds only a small shared PBR material treatment and a precomputed six-face
 * light atlas. The baked values are static data: no texture request, Suspense, runtime
 * GI, or additional loader is introduced. This isolates Three's lightMap/material path
 * before a production lightmap image/export recipe is adopted.
 *
 * Failure remains contained: the legacy hospital is already rendered underneath, and
 * a fetch/parse failure only logs instead of throwing into the live R3F tree.
 */
export function AuthoredRoomShell() {
  const [scene, setScene] = useState<Group | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let lightMap: DataTexture | null = null;

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
            if (controller.signal.aborted) return;
            lightMap = createBakedRoomLightMap();
            applyAuthoredRoomLook(gltf.scene, lightMap);
            setScene(gltf.scene);
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

    return () => {
      controller.abort();
      lightMap?.dispose();
    };
  }, []);

  return scene ? <primitive object={scene} position={ROOM_ORIGIN} /> : null;
}

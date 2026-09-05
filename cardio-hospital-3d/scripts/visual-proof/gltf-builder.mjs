import { writeFileSync } from "node:fs";

export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, scalar) => [a[0] * scalar, a[1] * scalar, a[2] * scalar];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const normalize = (vector) => {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
};

export class GltfBuilder {
  constructor(assetExtras = {}) {
    this.bytes = [];
    this.gltf = {
      asset: {
        version: "2.0",
        generator: "HospitalSim Astra Phase 1 build-time asset compiler",
        extras: assetExtras,
      },
      scene: 0,
      scenes: [{ nodes: [] }],
      nodes: [],
      meshes: [],
      materials: [],
      skins: [],
      animations: [],
      accessors: [],
      bufferViews: [],
      buffers: [],
    };
  }

  material(name, color, roughness = 0.7, metallic = 0, emissive = null) {
    const rgb = hexRgb(color);
    const material = {
      name,
      pbrMetallicRoughness: {
        baseColorFactor: [...rgb, 1],
        roughnessFactor: roughness,
        metallicFactor: metallic,
      },
    };
    if (emissive) material.emissiveFactor = hexRgb(emissive);
    this.gltf.materials.push(material);
    return this.gltf.materials.length - 1;
  }

  accessor(typed, componentType, type, target = null, includeBounds = false) {
    while (this.bytes.length % 4) this.bytes.push(0);
    const byteOffset = this.bytes.length;
    const raw = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
    for (const byte of raw) this.bytes.push(byte);

    const view = { buffer: 0, byteOffset, byteLength: raw.byteLength };
    if (target) view.target = target;
    const viewIndex = this.gltf.bufferViews.push(view) - 1;

    const componentCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const count = typed.length / componentCount;
    const accessor = { bufferView: viewIndex, componentType, count, type };
    if (includeBounds) {
      const min = Array(componentCount).fill(Infinity);
      const max = Array(componentCount).fill(-Infinity);
      for (let index = 0; index < count; index++) {
        for (let component = 0; component < componentCount; component++) {
          const value = typed[index * componentCount + component];
          min[component] = Math.min(min[component], value);
          max[component] = Math.max(max[component], value);
        }
      }
      accessor.min = min;
      accessor.max = max;
    }
    this.gltf.accessors.push(accessor);
    return this.gltf.accessors.length - 1;
  }

  finalize(path) {
    const raw = Uint8Array.from(this.bytes);
    this.gltf.buffers = [{
      byteLength: raw.byteLength,
      uri: `data:application/octet-stream;base64,${Buffer.from(raw).toString("base64")}`,
    }];
    writeFileSync(path, JSON.stringify(this.gltf));
  }
}

function hexRgb(color) {
  const hex = color.replace("#", "");
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
}

export function boxGeometry(center, size, withUv = false) {
  const [cx, cy, cz] = center;
  const [hx, hy, hz] = size.map((value) => value / 2);
  const faces = [
    [[1, 0, 0], [[hx, -hy, -hz], [hx, -hy, hz], [hx, hy, hz], [hx, hy, -hz]]],
    [[-1, 0, 0], [[-hx, -hy, hz], [-hx, -hy, -hz], [-hx, hy, -hz], [-hx, hy, hz]]],
    [[0, 1, 0], [[-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]]],
    [[0, -1, 0], [[-hx, -hy, hz], [hx, -hy, hz], [hx, -hy, -hz], [-hx, -hy, -hz]]],
    [[0, 0, 1], [[hx, -hy, hz], [-hx, -hy, hz], [-hx, hy, hz], [hx, hy, hz]]],
    [[0, 0, -1], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz]]],
  ];
  const positions = [];
  const normals = [];
  const uv = [];
  const indices = [];
  for (const [normal, vertices] of faces) {
    const base = positions.length / 3;
    for (let index = 0; index < 4; index++) {
      positions.push(vertices[index][0] + cx, vertices[index][1] + cy, vertices[index][2] + cz);
      normals.push(...normal);
      if (withUv) uv.push(index === 0 || index === 3 ? 0 : 1, index < 2 ? 0 : 1);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions, normals, uv, indices };
}

export function cylinderGeometry(center, radius, height, sides = 20) {
  const [cx, cy, cz] = center;
  const positions = [];
  const normals = [];
  const indices = [];
  const bottom = [];
  const top = [];

  for (let index = 0; index < sides; index++) {
    const angle = index / sides * Math.PI * 2;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    bottom.push(positions.length / 3);
    positions.push(cx + x * radius, cy - height / 2, cz + z * radius);
    normals.push(x, 0, z);
    top.push(positions.length / 3);
    positions.push(cx + x * radius, cy + height / 2, cz + z * radius);
    normals.push(x, 0, z);
  }

  for (let index = 0; index < sides; index++) {
    const next = (index + 1) % sides;
    indices.push(bottom[index], bottom[next], top[next], bottom[index], top[next], top[index]);
  }

  const bottomCenter = positions.length / 3;
  positions.push(cx, cy - height / 2, cz);
  normals.push(0, -1, 0);
  const topCenter = positions.length / 3;
  positions.push(cx, cy + height / 2, cz);
  normals.push(0, 1, 0);
  for (let index = 0; index < sides; index++) {
    const next = (index + 1) % sides;
    indices.push(bottomCenter, bottom[next], bottom[index], topCenter, top[index], top[next]);
  }
  return { positions, normals, uv: [], indices };
}

export function addStaticMesh(builder, name, geometry, material, lightmapped = false) {
  const position = builder.accessor(new Float32Array(geometry.positions), 5126, "VEC3", 34962, true);
  const normal = builder.accessor(new Float32Array(geometry.normals), 5126, "VEC3", 34962);
  const indexData = geometry.positions.length / 3 > 65535
    ? new Uint32Array(geometry.indices)
    : new Uint16Array(geometry.indices);
  const indices = builder.accessor(indexData, indexData instanceof Uint32Array ? 5125 : 5123, "SCALAR", 34963);
  const attributes = { POSITION: position, NORMAL: normal };
  if (geometry.uv.length) {
    const uv = builder.accessor(new Float32Array(geometry.uv), 5126, "VEC2", 34962);
    attributes.TEXCOORD_0 = uv;
    if (lightmapped) attributes.TEXCOORD_1 = uv;
  }
  const mesh = builder.gltf.meshes.push({ name, primitives: [{ attributes, indices, material }] }) - 1;
  const node = builder.gltf.nodes.push({ name, mesh }) - 1;
  builder.gltf.scenes[0].nodes.push(node);
}

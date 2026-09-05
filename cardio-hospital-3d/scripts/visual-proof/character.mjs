import { resolve } from "node:path";
import { GltfBuilder, add, cross, dot, lerp, mul, normalize, sub } from "./gltf-builder.mjs";

function bucket() {
  return { positions: [], normals: [], joints: [], weights: [], morph: [], indices: [] };
}

function pushVertex(geometry, position, normal, joints, weights, morph = [0, 0, 0]) {
  const index = geometry.positions.length / 3;
  geometry.positions.push(...position);
  geometry.normals.push(...normal);
  geometry.joints.push(...joints);
  geometry.weights.push(...weights);
  geometry.morph.push(...morph);
  return index;
}

const oneJoint = (joint) => [[joint, 0, 0, 0], [1, 0, 0, 0]];
const twoJoints = (a, b, t) => [[a, b, 0, 0], [1 - t, t, 0, 0]];

function appendEllipsoid(geometry, center, radii, joint, uSegments, vSegments, morph = null) {
  const rows = [];
  for (let v = 0; v <= vSegments; v++) {
    const phi = v / vSegments * Math.PI;
    const row = [];
    for (let u = 0; u <= uSegments; u++) {
      const theta = u / uSegments * Math.PI * 2;
      const local = [
        Math.sin(phi) * Math.cos(theta) * radii[0],
        Math.cos(phi) * radii[1],
        Math.sin(phi) * Math.sin(theta) * radii[2],
      ];
      const position = add(center, local);
      const normal = normalize([
        local[0] / (radii[0] * radii[0]),
        local[1] / (radii[1] * radii[1]),
        local[2] / (radii[2] * radii[2]),
      ]);
      const [joints, weights] = oneJoint(joint);
      row.push(pushVertex(geometry, position, normal, joints, weights, morph ? morph(position) : [0, 0, 0]));
    }
    rows.push(row);
  }
  for (let v = 0; v < vSegments; v++) {
    for (let u = 0; u < uSegments; u++) {
      const a = rows[v][u];
      const b = rows[v][u + 1];
      const c = rows[v + 1][u + 1];
      const d = rows[v + 1][u];
      geometry.indices.push(a, b, c, a, c, d);
    }
  }
}

function appendTube(geometry, start, end, startRadius, endRadius, startJoint, endJoint, sides, rings, morph = null) {
  const axis = normalize(sub(end, start));
  const reference = Math.abs(dot(axis, [0, 1, 0])) > 0.88 ? [1, 0, 0] : [0, 1, 0];
  const uAxis = normalize(cross(axis, reference));
  const vAxis = normalize(cross(axis, uAxis));
  const grid = [];

  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    const center = [lerp(start[0], end[0], t), lerp(start[1], end[1], t), lerp(start[2], end[2], t)];
    const radius = lerp(startRadius, endRadius, t);
    const row = [];
    for (let side = 0; side <= sides; side++) {
      const theta = side / sides * Math.PI * 2;
      const normal = normalize(add(mul(uAxis, Math.cos(theta)), mul(vAxis, Math.sin(theta))));
      const position = add(center, mul(normal, radius));
      const [joints, weights] = twoJoints(startJoint, endJoint, t);
      row.push(pushVertex(geometry, position, normal, joints, weights, morph ? morph(position) : [0, 0, 0]));
    }
    grid.push(row);
  }

  for (let ring = 0; ring < rings; ring++) {
    for (let side = 0; side < sides; side++) {
      const a = grid[ring][side];
      const b = grid[ring][side + 1];
      const c = grid[ring + 1][side + 1];
      const d = grid[ring + 1][side];
      geometry.indices.push(a, b, c, a, c, d);
    }
  }
}

function appendTorso(geometry, hipY, chestY, hipWidth, shoulderWidth, pelvisJoint, chestJoint, morph) {
  const sides = 36;
  const rings = 20;
  const grid = [];
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    const smooth = t * t * (3 - 2 * t);
    const y = lerp(hipY, chestY, t);
    const radiusX = lerp(hipWidth, shoulderWidth, smooth);
    const radiusZ = lerp(0.20, 0.23, Math.sin(t * Math.PI));
    const row = [];
    for (let side = 0; side <= sides; side++) {
      const theta = side / sides * Math.PI * 2;
      const position = [Math.cos(theta) * radiusX, y, Math.sin(theta) * radiusZ];
      const normal = normalize([
        Math.cos(theta) / radiusX,
        0.08 * Math.sin((t - 0.5) * Math.PI),
        Math.sin(theta) / radiusZ,
      ]);
      const [joints, weights] = twoJoints(pelvisJoint, chestJoint, t);
      row.push(pushVertex(geometry, position, normal, joints, weights, morph(position)));
    }
    grid.push(row);
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let side = 0; side < sides; side++) {
      const a = grid[ring][side];
      const b = grid[ring][side + 1];
      const c = grid[ring + 1][side + 1];
      const d = grid[ring + 1][side];
      geometry.indices.push(a, b, c, a, c, d);
    }
  }
}

export function buildProofCharacter(kind, outDir) {
  const adult = kind === "adult";
  const builder = new GltfBuilder({
    units: "meters",
    family: "proof-human-v1",
    role: kind,
    source: "scripts/visual-proof/character.mjs",
  });
  const materials = [
    builder.material("skin", "#8c5238", 0.72),
    builder.material("top", adult ? "#586b63" : "#486f80", 0.74),
    builder.material("bottom", "#1f272e", 0.82),
    builder.material("hair", "#171311", 0.90),
    builder.material("shoes", "#292b2c", 0.78),
  ];

  // Adult and adolescent proportions are authored independently; this is not uniform scaling.
  const shoulder = adult ? 0.44 : 0.39;
  const hipWidth = adult ? 0.33 : 0.29;
  const hipY = adult ? 0.96 : 0.92;
  const chestY = adult ? 1.58 : 1.50;
  const neckY = adult ? 1.70 : 1.61;
  const headY = adult ? 1.91 : 1.80;
  const shoulderY = chestY - 0.08;
  const joints = [
    ["root", null, [0, 0, 0]],
    ["pelvis", "root", [0, hipY, 0]],
    ["spine", "pelvis", [0, (hipY + chestY) / 2, 0]],
    ["chest", "spine", [0, chestY, 0]],
    ["neck", "chest", [0, neckY, 0]],
    ["head", "neck", [0, headY, 0]],
    ["l_clavicle", "chest", [-shoulder * 0.55, shoulderY, 0]],
    ["l_upperarm", "l_clavicle", [-shoulder * 0.95, shoulderY, 0]],
    ["l_forearm", "l_upperarm", [-shoulder - 0.07, 1.20, 0.05]],
    ["l_hand", "l_forearm", [-0.27, 0.92, 0.30]],
    ["r_clavicle", "chest", [shoulder * 0.55, shoulderY, 0]],
    ["r_upperarm", "r_clavicle", [shoulder * 0.95, shoulderY, 0]],
    ["r_forearm", "r_upperarm", [shoulder + 0.07, 1.20, 0.05]],
    ["r_hand", "r_forearm", [0.27, 0.92, 0.30]],
    ["l_thigh", "pelvis", [-hipWidth * 0.56, 0.91, 0.04]],
    ["l_shin", "l_thigh", [-0.17, 0.57, 0.43]],
    ["l_foot", "l_shin", [-0.17, 0.13, 0.56]],
    ["r_thigh", "pelvis", [hipWidth * 0.56, 0.91, 0.04]],
    ["r_shin", "r_thigh", [0.17, 0.57, 0.43]],
    ["r_foot", "r_shin", [0.17, 0.13, 0.56]],
  ];
  const jointIndex = Object.fromEntries(joints.map((joint, index) => [joint[0], index]));
  const geometry = materials.map(() => bucket());
  const breathingMorph = (position) => {
    const envelope = Math.exp(-Math.pow((position[1] - 1.40) / 0.25, 2));
    const radial = normalize([position[0], 0, position[2]]);
    return [radial[0] * 0.006 * envelope, 0.004 * envelope, radial[2] * 0.006 * envelope];
  };

  appendTorso(geometry[1], hipY, chestY, hipWidth, shoulder, jointIndex.pelvis, jointIndex.chest, breathingMorph);
  appendTube(geometry[0], [0, chestY - 0.02, 0], [0, neckY, 0], 0.083, 0.078, jointIndex.chest, jointIndex.neck, 28, 10, breathingMorph);
  appendEllipsoid(geometry[0], [0, headY, -0.01], adult ? [0.17, 0.215, 0.18] : [0.16, 0.20, 0.17], jointIndex.head, 34, 22);
  appendEllipsoid(geometry[3], [0, headY + 0.10, 0.018], adult ? [0.174, 0.13, 0.184] : [0.164, 0.12, 0.174], jointIndex.head, 32, 14);
  appendEllipsoid(geometry[0], [0, headY - 0.015, -0.175], [0.045, 0.055, 0.065], jointIndex.head, 18, 12);

  for (const side of [-1, 1]) {
    const prefix = side < 0 ? "l" : "r";
    const shoulderPoint = [side * shoulder * 0.95, shoulderY, 0];
    const elbow = [side * (shoulder + 0.07), 1.20, 0.05];
    const hand = [side * 0.27, 0.92, 0.30];
    appendTube(geometry[1], shoulderPoint, elbow, adult ? 0.082 : 0.075, adult ? 0.078 : 0.071,
      jointIndex[`${prefix}_upperarm`], jointIndex[`${prefix}_forearm`], 28, 12, breathingMorph);
    appendTube(geometry[0], elbow, hand, adult ? 0.074 : 0.067, adult ? 0.063 : 0.058,
      jointIndex[`${prefix}_forearm`], jointIndex[`${prefix}_hand`], 28, 12);
    appendEllipsoid(geometry[0], hand, [0.075, 0.055, 0.105], jointIndex[`${prefix}_hand`], 24, 14);

    const hip = [side * hipWidth * 0.56, 0.91, 0.04];
    const knee = [side * 0.17, 0.57, 0.43];
    const ankle = [side * 0.17, 0.13, 0.56];
    const foot = [side * 0.17, 0.07, 0.72];
    appendTube(geometry[2], hip, knee, adult ? 0.118 : 0.108, adult ? 0.103 : 0.094,
      jointIndex[`${prefix}_thigh`], jointIndex[`${prefix}_shin`], 30, 14);
    appendTube(geometry[2], knee, ankle, adult ? 0.103 : 0.094, adult ? 0.084 : 0.078,
      jointIndex[`${prefix}_shin`], jointIndex[`${prefix}_foot`], 28, 13);
    appendEllipsoid(geometry[4], foot, [0.11, 0.075, 0.20], jointIndex[`${prefix}_foot`], 26, 14);
  }

  const primitives = [];
  for (let material = 0; material < geometry.length; material++) {
    const part = geometry[material];
    if (!part.indices.length) continue;
    const position = builder.accessor(new Float32Array(part.positions), 5126, "VEC3", 34962, true);
    const normal = builder.accessor(new Float32Array(part.normals), 5126, "VEC3", 34962);
    const jointsAccessor = builder.accessor(new Uint16Array(part.joints), 5123, "VEC4", 34962);
    const weights = builder.accessor(new Float32Array(part.weights), 5126, "VEC4", 34962);
    const morph = builder.accessor(new Float32Array(part.morph), 5126, "VEC3", 34962);
    const indexData = part.positions.length / 3 > 65535 ? new Uint32Array(part.indices) : new Uint16Array(part.indices);
    const indices = builder.accessor(indexData, indexData instanceof Uint32Array ? 5125 : 5123, "SCALAR", 34963);
    primitives.push({
      attributes: { POSITION: position, NORMAL: normal, JOINTS_0: jointsAccessor, WEIGHTS_0: weights },
      indices,
      material,
      targets: [{ POSITION: morph }],
    });
  }

  const meshIndex = builder.gltf.meshes.push({ name: `${kind}_body`, primitives, weights: [0] }) - 1;
  builder.gltf.nodes.push({ name: `${kind}_actor`, children: [1, 2] });
  builder.gltf.nodes.push({ name: "body", mesh: meshIndex, skin: 0 });
  const nodeByName = {};
  for (const [name, parent, position] of joints) {
    const parentPosition = parent ? joints.find((joint) => joint[0] === parent)[2] : [0, 0, 0];
    nodeByName[name] = builder.gltf.nodes.push({ name, translation: sub(position, parentPosition) }) - 1;
  }
  for (const [name] of joints) {
    const children = joints.filter((joint) => joint[1] === name).map((joint) => nodeByName[joint[0]]);
    if (children.length) builder.gltf.nodes[nodeByName[name]].children = children;
  }
  builder.gltf.nodes[0].children = [1, nodeByName.root];
  builder.gltf.scenes[0].nodes = [0];

  // glTF matrices are column-major. Each inverse bind matrix removes the joint's bind translation.
  const inverseBindMatrices = [];
  for (const [, , position] of joints) {
    inverseBindMatrices.push(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -position[0], -position[1], -position[2], 1,
    );
  }
  const inverseBindAccessor = builder.accessor(new Float32Array(inverseBindMatrices), 5126, "MAT4");
  builder.gltf.skins.push({
    name: "proof-human-v1",
    joints: joints.map((joint) => nodeByName[joint[0]]),
    inverseBindMatrices: inverseBindAccessor,
    skeleton: nodeByName.root,
  });

  const time = builder.accessor(new Float32Array([0, 1.6, 3.2]), 5126, "SCALAR", null, true);
  const morphWeights = builder.accessor(new Float32Array([0, 1, 0]), 5126, "SCALAR");
  const angle = 2.2 * Math.PI / 180;
  const headRotation = builder.accessor(new Float32Array([
    0, 0, 0, 1,
    0, Math.sin(angle / 2), 0, Math.cos(angle / 2),
    0, 0, 0, 1,
  ]), 5126, "VEC4");
  builder.gltf.animations.push({
    name: "idle-seated",
    samplers: [
      { input: time, output: morphWeights, interpolation: "LINEAR" },
      { input: time, output: headRotation, interpolation: "LINEAR" },
    ],
    channels: [
      { sampler: 0, target: { node: 1, path: "weights" } },
      { sampler: 1, target: { node: nodeByName.head, path: "rotation" } },
    ],
  });

  builder.finalize(resolve(outDir, `proof-character-${kind}.gltf`));
  return geometry.reduce((total, part) => total + part.indices.length / 3, 0);
}

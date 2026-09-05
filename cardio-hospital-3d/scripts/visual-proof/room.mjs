import { resolve } from "node:path";
import { GltfBuilder, addStaticMesh, boxGeometry, cylinderGeometry } from "./gltf-builder.mjs";

export function buildProofRoom(outDir) {
  const builder = new GltfBuilder({
    units: "meters",
    proof: "phase1-room-one",
    source: "scripts/visual-proof/room.mjs",
  });
  const materials = {
    paint: builder.material("paint", "#e6ece9", 0.78),
    accent: builder.material("accent", "#cddfe1", 0.78),
    floor: builder.material("floor", "#c8beb1", 0.88),
    laminate: builder.material("laminate", "#e4ded2", 0.48),
    cabinet: builder.material("cabinet", "#6f777b", 0.58),
    upholstery: builder.material("upholstery", "#8d7868", 0.74),
    plastic: builder.material("plastic", "#e8ece9", 0.50),
    dark: builder.material("dark", "#1b252a", 0.38, 0.08),
    screen: builder.material("screen", "#0a2027", 0.18, 0, "#123d48"),
    metal: builder.material("metal", "#7d878c", 0.36, 0.58),
    teal: builder.material("teal", "#4d858b", 0.62),
    amber: builder.material("amber", "#c28a4d", 0.66),
    white: builder.material("white", "#f3f4f0", 0.72),
    fixture: builder.material("fixture", "#f4f1e5", 0.30, 0, "#fff0c9"),
  };
  const box = (name, size, center, material, lightmapped = false) => {
    addStaticMesh(builder, name, boxGeometry(center, size, lightmapped), materials[material], lightmapped);
  };
  const cylinder = (name, radius, height, center, material, sides = 20) => {
    addStaticMesh(builder, name, cylinderGeometry(center, radius, height, sides), materials[material]);
  };

  // Authored shell. lm_* meshes carry TEXCOORD_1 for Three.js lightMap sampling.
  box("lm_floor", [6.2, 0.10, 6], [0, -0.05, 0], "floor", true);
  box("lm_wall_north", [6.2, 3, 0.12], [0, 1.5, 3], "paint", true);
  box("lm_wall_south", [6.2, 3, 0.12], [0, 1.5, -3], "accent", true);
  box("lm_wall_west", [0.12, 3, 6], [-3.1, 1.5, 0], "accent", true);
  box("lm_wall_east_n", [0.12, 3, 2.10], [3.1, 1.5, 1.95], "paint", true);
  box("lm_wall_east_s", [0.12, 3, 2.10], [3.1, 1.5, -1.95], "paint", true);
  box("lm_door_header", [0.12, 0.55, 1.75], [3.1, 2.725, 0], "paint", true);
  box("lm_ceiling", [6.08, 0.04, 5.88], [0, 2.98, 0], "white", true);

  // Door trim and baseboards create readable highlights rather than perfectly sharp wall boxes.
  box("door_trim_a", [0.10, 2.46, 0.10], [3.04, 1.23, -0.87], "metal");
  box("door_trim_b", [0.10, 2.46, 0.10], [3.04, 1.23, 0.87], "metal");
  box("door_trim_top", [0.10, 0.10, 1.84], [3.04, 2.43, 0], "metal");
  box("baseboard_n", [5.95, 0.13, 0.06], [0, 0.065, 2.91], "metal");
  box("baseboard_s", [5.95, 0.13, 0.06], [0, 0.065, -2.91], "metal");
  box("baseboard_w", [0.06, 0.13, 5.75], [-3.01, 0.065, 0], "metal");

  // Exam surface: layered silhouette, upholstery and drawer cues.
  box("exam_table_base", [0.88, 0.54, 1.92], [-1.90, 0.48, -0.70], "plastic");
  box("exam_table_cushion", [0.94, 0.15, 1.22], [-1.90, 0.82, -0.93], "upholstery");
  box("exam_table_head", [0.94, 0.15, 0.78], [-1.90, 1.04, -0.08], "upholstery");
  box("exam_table_drawer", [0.66, 0.18, 0.42], [-1.90, 0.28, -1.14], "white");

  // Family seating is placed at the canonical parent anchor.
  box("guest_chair_seat", [0.62, 0.12, 0.58], [-0.30, 0.72, 0.75], "teal");
  box("guest_chair_back", [0.62, 0.72, 0.12], [-0.30, 1.08, 1.00], "teal");
  for (const x of [-0.25, 0.25]) {
    for (const z of [0.58, 0.92]) cylinder(`guest_leg_${x}_${z}`, 0.025, 0.68, [-0.30 + x, 0.34, z], "metal", 12);
  }

  // Rear cabinetry/counter and workstation form a believable clinician working zone.
  box("cabinet_run", [2.55, 0.82, 0.62], [-1.05, 0.43, -2.55], "cabinet");
  box("counter", [2.65, 0.08, 0.72], [-1.05, 0.88, -2.55], "laminate");
  for (const x of [-1.82, -1.05, -0.28]) box(`cabinet_reveal_${x}`, [0.025, 0.60, 0.03], [x, 0.45, -2.875], "metal");
  box("work_surface", [1.45, 0.08, 0.62], [1.30, 0.77, -2.43], "cabinet");
  box("monitor_frame", [0.72, 0.46, 0.08], [1.30, 1.15, -2.68], "dark");
  box("monitor_screen", [0.62, 0.36, 0.02], [1.30, 1.15, -2.725], "screen");
  box("keyboard", [0.54, 0.025, 0.18], [1.30, 0.83, -2.32], "dark");

  // Hand hygiene and focused outpatient equipment. No decorative patient physiology is encoded.
  box("sink_counter", [0.64, 0.14, 0.74], [-2.74, 0.88, 1.82], "laminate");
  box("sink_basin", [0.50, 0.05, 0.54], [-2.73, 0.95, 1.82], "metal");
  cylinder("faucet_stem", 0.027, 0.28, [-2.72, 1.11, 1.96], "metal", 14);
  box("faucet_spout", [0.05, 0.05, 0.22], [-2.72, 1.23, 1.86], "metal");
  box("soap_dispenser", [0.12, 0.24, 0.10], [-2.99, 1.46, 1.68], "plastic");
  box("diagnostic_station", [0.16, 0.60, 0.56], [-2.94, 1.70, -1.95], "plastic");
  box("otoscope_handle", [0.12, 0.36, 0.10], [-2.84, 1.72, -2.08], "dark");
  box("supply_cart", [0.82, 0.72, 0.54], [1.42, 0.46, 1.72], "plastic");
  for (const y of [0.29, 0.49, 0.69]) box(`cart_pull_${y}`, [0.68, 0.025, 0.03], [1.42, y, 1.44], "metal");
  cylinder("waste_bin", 0.22, 0.48, [-2.55, 0.24, -2.26], "metal", 20);

  // Privacy and pediatric warmth stay subordinate to the room's functional hierarchy.
  box("curtain_rail", [2.05, 0.03, 0.03], [-0.20, 2.62, 0.45], "metal");
  [-1.08, -0.64, -0.20, 0.24, 0.68].forEach((x, index) => {
    box(`curtain_panel_${index}`, [0.30, 1.65, 0.018], [x, 1.72, 0.46], "accent");
  });
  box("wall_art_frame", [1.50, 0.98, 0.05], [0.75, 1.90, -2.91], "white");
  box("wall_art_field", [1.36, 0.84, 0.018], [0.75, 1.90, -2.945], "accent");
  [[0.33, 2.0, "teal"], [0.65, 1.82, "amber"], [0.97, 2.04, "teal"], [1.23, 1.78, "amber"]]
    .forEach(([x, y, material], index) => cylinder(`art_dot_${index}`, 0.11, 0.02, [x, y, -2.97], material, 14));

  // Fixtures are emissive-looking geometry; static illumination is supplied by the baked map.
  for (const x of [-1.35, 1.35]) {
    for (const z of [-1.55, 1.55]) box(`fixture_${x}_${z}`, [1.15, 0.035, 0.44], [x, 2.94, z], "fixture");
  }

  builder.finalize(resolve(outDir, "proof-room-one.gltf"));
  return builder.gltf.meshes.reduce((total, mesh) => total + mesh.primitives.reduce(
    (meshTotal, primitive) => meshTotal + builder.gltf.accessors[primitive.indices].count / 3,
    0,
  ), 0);
}

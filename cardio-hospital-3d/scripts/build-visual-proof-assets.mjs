import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { buildProofCharacter } from "./visual-proof/character.mjs";
import { clamp } from "./visual-proof/gltf-builder.mjs";
import { buildProofRoom } from "./visual-proof/room.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptsDir, "..");
const outDir = resolve(appRoot, "public/assets/hospital/astra-proof");
mkdirSync(outDir, { recursive: true });

const roomTriangles = buildProofRoom(outDir);
const adolescentTriangles = buildProofCharacter("adolescent", outDir);
const adultTriangles = buildProofCharacter("adult", outDir);
writeLightmap(resolve(outDir, "proof-room-lightmap.png"));

for (const [label, triangles] of [["adolescent", adolescentTriangles], ["adult", adultTriangles]]) {
  if (triangles < 12000 || triangles > 25000) {
    throw new Error(`${label} proof character is outside the Astra 12k-25k triangle envelope: ${triangles}`);
  }
}

writeFileSync(resolve(outDir, "provenance.json"), JSON.stringify({
  schemaVersion: 1,
  program: "HospitalSim Astra Phase 1 visual proof",
  generatedBy: "scripts/build-visual-proof-assets.mjs",
  sourceLicense: "repository-owned generated proof assets",
  externalAssets: [],
  triangleCounts: {
    room: roomTriangles,
    adolescent: adolescentTriangles,
    adult: adultTriangles,
  },
  notes: [
    "Generated assets are build outputs; edit the compiler rather than the glTF/PNG files.",
    "Clinical state, interaction anchors, and collision remain separate from visual asset content.",
  ],
}, null, 2));

console.log(
  `Astra visual proof assets generated: ${roomTriangles} room tris, `
  + `${adolescentTriangles} adolescent tris, ${adultTriangles} adult tris`,
);

function writeLightmap(path) {
  const width = 128;
  const height = 128;
  const scanlineBytes = width * 3 + 1;
  const raw = Buffer.alloc(scanlineBytes * height);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x++) {
      let illumination = 0.46;
      for (const [centerX, centerY] of [[38, 38], [90, 38], [38, 90], [90, 90]]) {
        const dx = (x - centerX) / 38;
        const dy = (y - centerY) / 38;
        illumination += 0.28 * Math.exp(-(dx * dx + dy * dy));
      }
      const edge = Math.min(x / width, (width - 1 - x) / width, y / height, (height - 1 - y) / height);
      illumination *= 0.78 + 0.35 * clamp(edge * 4, 0, 1);
      illumination = clamp(illumination, 0, 1);
      raw[offset++] = Math.round(illumination * 255);
      raw[offset++] = Math.round(illumination * 246);
      raw[offset++] = Math.round(illumination * 226);
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const png = Buffer.concat([
    signature,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type);
  const body = Buffer.from(data);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, body])));
  return Buffer.concat([length, typeBytes, body, crc]);
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

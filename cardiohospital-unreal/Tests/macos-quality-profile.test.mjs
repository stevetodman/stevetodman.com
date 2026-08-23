import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const engine = readFileSync(path.join(root, "Config", "DefaultEngine.ini"), "utf8");
const user = readFileSync(path.join(root, "Config", "DefaultGameUserSettings.ini"), "utf8");

function requireLine(text, line) {
  assert.match(text, new RegExp(`^${line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"));
}

test("Mac release profile keeps hardware ray tracing disabled for the first slice", () => {
  requireLine(engine, "r.RayTracing=False");
});

test("balanced 1440p defaults preserve output resolution while reducing GPU-heavy groups", () => {
  requireLine(user, "ResolutionSizeX=2560");
  requireLine(user, "ResolutionSizeY=1440");
  requireLine(user, "sg.ResolutionQuality=85");
  requireLine(user, "sg.ViewDistanceQuality=3");
  requireLine(user, "sg.AntiAliasingQuality=3");
  requireLine(user, "sg.TextureQuality=3");
  requireLine(user, "sg.ShadowQuality=2");
  requireLine(user, "sg.GlobalIlluminationQuality=2");
  requireLine(user, "sg.ReflectionQuality=2");
  requireLine(user, "sg.PostProcessQuality=2");
  requireLine(user, "sg.EffectsQuality=2");
  requireLine(user, "sg.ShadingQuality=2");
});

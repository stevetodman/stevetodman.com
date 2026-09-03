import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const cloudSource = await readFile(new URL("math/assets/math-cloud.js", root), "utf8");

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function loadCloud(initialData = {}) {
  const localStorage = makeStorage({ "mathmission.m1.v1": JSON.stringify(initialData) });
  const window = { addEventListener() {}, dispatchEvent() {} };
  const document = { hidden: false, addEventListener() {}, querySelectorAll() { return []; } };
  const context = {
    window,
    document,
    localStorage,
    location: { protocol: "file:", hostname: "", hash: "", pathname: "/math/", search: "", origin: "https://stevetodman.com" },
    history: { replaceState() {} },
    navigator: {},
    alert() {},
    prompt() {},
    fetch() { throw new Error("fetch should not run in local-mode cloud tests"); },
    setInterval() { return 1; },
    clearTimeout() {},
    setTimeout() { return 1; },
    CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
    Promise,
    Set,
    Map,
    JSON,
    Math,
    Number,
    String,
    Array,
    Object,
    RegExp
  };
  vm.createContext(context);
  vm.runInContext(cloudSource, context, { filename: "math-cloud.js" });
  return { cloud: context.window.MathMissionCloud, localStorage };
}

function readData(storage) {
  return JSON.parse(storage.getItem("mathmission.m1.v1") || "{}");
}

test("progressive diagnostic v3 completion survives cloud payload/apply round trip", () => {
  const source = loadCloud({
    luke: {
      diagnostic: true,
      diagnosticVersion: 3,
      sessions: 1,
      attempts: [
        { skill: "place", micro: "powers_multiply", correct: true, assisted: false, recovery: false, difficulty: 2, transfer: false, date: "2026-09-02", at: 1788311000000 },
        { skill: "place", micro: "powers_divide", correct: true, assisted: false, recovery: false, difficulty: 2, transfer: false, date: "2026-09-02", at: 1788311000001 }
      ]
    }
  });

  const payload = source.cloud.payload();
  const remote = payload["math-mission-luke"].stateStats;
  assert.equal(remote.math1diagnostic3.mastered, true);
  assert.equal(remote.math1diagnostic2, undefined);

  const target = loadCloud({});
  target.cloud.apply(payload);
  const restored = readData(target.localStorage).luke;
  assert.equal(restored.diagnostic, true);
  assert.equal(restored.diagnosticVersion, 3);
  assert.deepEqual(restored.attempts.map(attempt => attempt.micro), ["powers_multiply", "powers_divide"]);
});

test("coexisting cloud diagnostic markers keep the highest completed version", () => {
  const target = loadCloud({});
  target.cloud.apply({
    "math-mission-luke": {
      stateStats: {
        math1diagnostic3: { mastered: true },
        math1diagnostic2: { mastered: true },
        math1diagnostic: { mastered: true }
      }
    }
  });

  const restored = readData(target.localStorage).luke;
  assert.equal(restored.diagnostic, true);
  assert.equal(restored.diagnosticVersion, 3);
});

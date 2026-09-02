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
  const document = {
    hidden: false,
    addEventListener() {},
    querySelectorAll() { return []; }
  };
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

test("adaptive v2 attempts survive a cloud payload/apply round trip", () => {
  const sourceAttempt = {
    skill: "addsub",
    micro: "decimal_add",
    correct: true,
    assisted: false,
    recovery: true,
    difficulty: 3,
    transfer: true,
    date: "2026-08-31",
    at: 1788138000000
  };
  const source = loadCloud({
    luke: { diagnostic: true, diagnosticVersion: 2, attempts: [sourceAttempt], sessions: 4 },
    samantha: { diagnostic: false, diagnosticVersion: 0, attempts: [], sessions: 1 }
  });

  const payload = source.cloud.payload();
  const lukeRemote = payload["math-mission-luke"];
  assert.ok(lukeRemote);
  const attemptKey = Object.keys(lukeRemote.stateStats).find(key => key.startsWith("math1b|"));
  assert.ok(attemptKey, "v2 adaptive attempt should serialize as math1b");
  assert.match(attemptKey, /^math1b\|addsub\|decimal_add\|1\|0\|1\|3\|1\|2026-08-31\|1788138000000\|/);
  assert.equal(lukeRemote.stateStats.math1diagnostic2.mastered, true);
  assert.equal(lukeRemote.stateStats.math1sessions.correct, 4);

  const target = loadCloud({});
  target.cloud.apply(payload);
  const restored = readData(target.localStorage).luke;

  assert.equal(restored.diagnostic, true);
  assert.equal(restored.diagnosticVersion, 2);
  assert.equal(restored.sessions, 4);
  assert.equal(restored.attempts.length, 1);
  assert.deepEqual(
    {
      skill: restored.attempts[0].skill,
      micro: restored.attempts[0].micro,
      correct: restored.attempts[0].correct,
      assisted: restored.attempts[0].assisted,
      recovery: restored.attempts[0].recovery,
      difficulty: restored.attempts[0].difficulty,
      transfer: restored.attempts[0].transfer,
      date: restored.attempts[0].date,
      at: restored.attempts[0].at
    },
    sourceAttempt
  );
  assert.ok(restored.attempts[0].cloudId);
});

test("misconception evidence survives a cloud payload/apply round trip", () => {
  const source = loadCloud({
    luke: {
      attempts: [{
        skill: "place", micro: "powers_divide", correct: false, assisted: false,
        recovery: false, recheck: false, difficulty: 2, transfer: false,
        misconception: "wrong_direction", date: "2026-09-02", at: 1788310800000
      }]
    }
  });
  const payload = source.cloud.payload();
  const key = Object.keys(payload["math-mission-luke"].stateStats).find(item => item.startsWith("math1d|"));
  assert.match(key, /^math1d\|place\|powers_divide\|0\|0\|0\|2\|0\|0\|wrong_direction\|2026-09-02\|1788310800000\|/);

  const target = loadCloud({});
  target.cloud.apply(payload);
  const restored = readData(target.localStorage).luke.attempts[0];
  assert.equal(restored.micro, "powers_divide");
  assert.equal(restored.correct, false);
  assert.equal(restored.misconception, "wrong_direction");
});

test("applying the same remote state twice does not duplicate attempts", () => {
  const source = loadCloud({
    luke: {
      diagnostic: true,
      diagnosticVersion: 2,
      sessions: 2,
      attempts: [{
        skill: "divide",
        micro: "decimal_divide",
        correct: false,
        assisted: true,
        recovery: false,
        difficulty: 2,
        transfer: false,
        date: "2026-08-31",
        at: 1788139000000
      }]
    }
  });
  const payload = source.cloud.payload();
  const target = loadCloud({});

  target.cloud.apply(payload);
  target.cloud.apply(payload);

  const restored = readData(target.localStorage).luke;
  assert.equal(restored.attempts.length, 1);
  assert.equal(restored.attempts[0].micro, "decimal_divide");
  assert.equal(restored.attempts[0].correct, false);
  assert.equal(restored.attempts[0].assisted, true);
});

test("a completed repair recheck is retained across devices", () => {
  const source = loadCloud({
    luke: {
      attempts: [{
        skill: "place", micro: "powers_multiply", correct: true, assisted: false,
        recovery: false, recheck: true, difficulty: 2, transfer: false,
        date: "2026-09-01", at: 1788224400000
      }]
    }
  });
  const payload = source.cloud.payload();
  const key = Object.keys(payload["math-mission-luke"].stateStats).find(item => item.startsWith("math1c|"));
  assert.match(key, /^math1c\|place\|powers_multiply\|1\|0\|0\|2\|0\|1\|2026-09-01\|1788224400000\|/);

  const target = loadCloud({});
  target.cloud.apply(payload);
  const restored = readData(target.localStorage).luke.attempts[0];
  assert.equal(restored.recheck, true);
  assert.equal(restored.micro, "powers_multiply");
});

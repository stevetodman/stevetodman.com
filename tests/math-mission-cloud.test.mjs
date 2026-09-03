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

function loadCloud(initialData = {}, initialGame = {}) {
  const localStorage = makeStorage({
    "mathmission.m1.v1": JSON.stringify(initialData),
    "mathmission.starship.v1": JSON.stringify(initialGame)
  });
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

function readGame(storage) {
  return JSON.parse(storage.getItem("mathmission.starship.v1") || "{}");
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

test("starship purchases and equipped cosmetics survive a cloud round trip", () => {
  const source = loadCloud(
    { luke: { attempts: [], sessions: 3 } },
    {
      version: 1,
      profiles: {
        luke: {
          version: 1,
          purchases: { "meteor-wake": { at: 1788397000000 }, "orbit-bot": { at: 1788397100000 } },
          equipped: { hull: "comet-scout", trail: "meteor-wake", companion: "orbit-bot" },
          updatedAt: 1788397100000
        }
      }
    }
  );

  const payload = source.cloud.payload();
  const stats = payload["math-mission-luke"].stateStats;
  assert.ok(Object.keys(stats).some(key => key === "mathstar1p|meteor-wake|1788397000000"));
  assert.ok(Object.keys(stats).some(key => key === "mathstar1p|orbit-bot|1788397100000"));
  assert.ok(Object.keys(stats).some(key => key === "mathstar1e|1788397100000|comet-scout|meteor-wake|orbit-bot"));

  const target = loadCloud({});
  target.cloud.apply(payload);
  const restored = readGame(target.localStorage).profiles.luke;
  assert.equal(restored.purchases["meteor-wake"].at, 1788397000000);
  assert.equal(restored.purchases["orbit-bot"].at, 1788397100000);
  assert.deepEqual(restored.equipped, { hull: "comet-scout", trail: "meteor-wake", companion: "orbit-bot" });
  assert.equal(restored.updatedAt, 1788397100000);
});

test("latest starship loadout wins while purchases remain monotonic", () => {
  const target = loadCloud(
    {},
    {
      version: 1,
      profiles: {
        luke: {
          version: 1,
          purchases: { "orbit-bot": { at: 100 } },
          equipped: { hull: "comet-scout", trail: "ion-wake", companion: "orbit-bot" },
          updatedAt: 150
        }
      }
    }
  );
  const mastered = { streak: 1, correct: 1, wrong: 0, mastered: true };
  target.cloud.apply({
    "math-mission-luke": {
      stateStats: {
        "mathstar1p|meteor-wake|120": mastered,
        "mathstar1e|100|comet-scout|meteor-wake|orbit-bot": mastered,
        "mathstar1e|200|comet-scout|meteor-wake|none": mastered
      },
      masteredOrder: []
    }
  });

  const restored = readGame(target.localStorage).profiles.luke;
  assert.equal(restored.purchases["orbit-bot"].at, 100);
  assert.equal(restored.purchases["meteor-wake"].at, 120);
  assert.deepEqual(restored.equipped, { hull: "comet-scout", trail: "meteor-wake", companion: "none" });
  assert.equal(restored.updatedAt, 200);
});

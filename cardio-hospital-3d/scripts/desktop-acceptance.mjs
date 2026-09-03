import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const ARTIFACT_DIR = "acceptance-artifacts";
const STORAGE_KEY = "cardio_hospital:unified:state";
const BASE_URL = "http://127.0.0.1:3000";
const evidence = [];
const browserErrors = [];

function pass(message) {
  evidence.push(`PASS: ${message}`);
  console.log(`PASS: ${message}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${ARTIFACT_DIR}/${name}.png`, fullPage: true });
}

async function move(page, key, milliseconds) {
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(milliseconds);
  } finally {
    await page.keyboard.up(key);
  }
  await page.waitForTimeout(250);
}

async function assertTextIncludes(locator, expected) {
  const text = (await locator.innerText()).trim();
  assert.ok(
    text.includes(expected),
    `Expected text to include ${JSON.stringify(expected)} but got ${JSON.stringify(text)}`,
  );
}

async function waitForPrompt(page, expected, timeout = 10000) {
  const prompt = page.locator(".interaction-prompt");
  await prompt.waitFor({ state: "visible", timeout });
  await assertTextIncludes(prompt, expected);
}

async function persistedState(page) {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  assert.ok(raw, "Expected canonical hospital state in localStorage");
  const envelope = JSON.parse(raw);
  assert.equal(envelope.schemaVersion, 3, "Expected persisted schema v3");
  return envelope.state;
}

async function clickFirstHistoryQuestions(page, count) {
  const buttons = page.locator(".clinical-action-grid .clinical-action");
  assert.ok((await buttons.count()) >= count, `Expected at least ${count} history choices`);
  for (let index = 0; index < count; index += 1) {
    await buttons.nth(index).click();
  }
}

async function completeAvaFromHistory(page) {
  const historyFooter = page.locator(".clinical-stage-footer").first();
  const footerText = await historyFooter.innerText();
  const askedMatch = footerText.match(/(\d+) questions? asked/);
  const alreadyAsked = askedMatch ? Number(askedMatch[1]) : 0;
  if (alreadyAsked < 4) {
    await clickFirstHistoryQuestions(page, 4);
  }
  await page.getByRole("button", { name: "Continue to examination" }).click();

  await page.getByRole("button", { name: /^Auscultate / }).first().click();
  await page.getByRole("button", { name: "Check femoral pulses" }).click();
  await page.getByRole("button", { name: "Choose diagnostic tests" }).click();

  await page.getByRole("button", { name: "Order + review 12-lead ECG" }).click();
  for (const label of [
    "Sinus bradycardia compatible with athletic training",
    "PR, QRS, and QTc are within the supplied reassuring range",
    "No LVH criteria and normal repolarization",
  ]) {
    await page.getByText(label, { exact: true }).click();
  }
  await page
    .getByRole("button", { name: /Commit ECG interpretation|Update ECG interpretation/ })
    .click();
  await page.getByRole("button", { name: "Commit assessment and plan" }).click();

  await page.locator(".diagnosis-choice").first().click();
  await page.locator(".management-grid label").first().click();
  await page.getByRole("button", { name: "Present to Dr. Patel" }).click();
  await page.getByText("Attending debrief", { exact: true }).waitFor({ state: "visible" });
}

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-gl=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--disable-dev-shm-usage",
  ],
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Enter the hospital" })
    .waitFor({ state: "visible", timeout: 15000 });
  await page.getByRole("button", { name: "Enter the hospital" }).click();
  await waitForPrompt(page, "Speak with Dr. Patel");
  pass("Entered hospital and Dr. Patel proximity interaction is available.");

  await page.keyboard.press("e");
  await page.getByRole("dialog", { name: "Morning briefing" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Accept patient" }).click();
  pass("Accepted Marcus Chen from the morning briefing.");

  await move(page, "w", 5000);
  await move(page, "d", 300);
  await waitForPrompt(page, "Enter Clinic Room 3");
  await page.keyboard.press("e");
  await page
    .getByRole("region", { name: "Marcus Chen clinical encounter" })
    .waitFor({ state: "visible" });
  pass("Navigated through the hospital to the Marcus encounter interaction zone.");

  await clickFirstHistoryQuestions(page, 3);
  await page.getByRole("button", { name: "Continue to examination" }).click();
  await page.getByRole("button", { name: "Check femoral pulses" }).click();
  await page.getByRole("button", { name: "Palpate the PMI" }).click();
  await page.getByRole("button", { name: "Choose diagnostic tests" }).click();
  await page.getByRole("button", { name: "Order echocardiogram" }).click();
  await page.getByRole("button", { name: "Commit assessment and plan" }).click();
  await page.getByRole("button", { name: "Hypertrophic Cardiomyopathy" }).click();
  await page.locator(".management-grid label").first().click();
  await page.getByRole("button", { name: "Present to Dr. Patel" }).click();
  await page.getByText("Attending debrief", { exact: true }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Complete encounter and return to hospital" }).click();
  pass("Completed the Marcus HCM consult through debrief and returned to the 3D hospital.");

  let state = await persistedState(page);
  assert.equal(state.tasks["task-case-hcm"]?.status, "complete");
  assert.equal(state.patients["patient-case-hcm"]?.disposition, "complete");
  assert.ok(state.tasks["task-case-vasovagal"], "Ava consult should be released after HCM completion");
  assert.ok(
    state.patients["patient-case-vasovagal"],
    "Ava patient should be released after HCM completion",
  );
  pass("Marcus completion released Ava and left Marcus canonically complete.");
  await screenshot(page, "01-after-marcus-complete");

  await page.getByRole("button", { name: /Pager/ }).click();
  const avaPage = page
    .locator("article.pager-message")
    .filter({ hasText: "New clinic consult · Room 1" });
  await avaPage.waitFor({ state: "visible" });
  await avaPage.getByRole("button", { name: "Accept task" }).click();
  await page.getByRole("button", { name: /Pager/ }).click();

  await page.getByRole("button", { name: /Worklist/ }).click();
  const worklist = page.locator("#hospital-work-queue");
  await worklist.waitFor({ state: "visible" });
  await assertTextIncludes(worklist, "Ava Rodriguez · Cardiology consult");
  await assertTextIncludes(worklist, "Review overnight cardiology handoff");
  assert.equal(
    await worklist.locator("article.work-queue-item").count(),
    2,
    "Expected exactly Ava + unfinished overnight handoff",
  );
  pass("Worklist simultaneously shows Ava and the unfinished overnight handoff.");
  await screenshot(page, "02-worklist-ava-plus-handoff");
  await page.getByRole("button", { name: /Worklist/ }).click();

  await move(page, "a", 2600);
  assert.equal(
    await page.locator(".interaction-prompt").count(),
    0,
    "Room 1 prompt should disappear after moving deep into Room 1",
  );
  pass("Room 1 doorway permits corridor-to-room passage.");

  await move(page, "d", 1500);
  await waitForPrompt(page, "Enter Clinic Room 1");
  pass("Room 1 doorway permits room-to-corridor passage and reacquires the interaction prompt.");
  await screenshot(page, "03-room1-doorway-return");

  await page.keyboard.press("e");
  const avaEncounter = page.getByRole("region", { name: "Ava Rodriguez clinical encounter" });
  await avaEncounter.waitFor({ state: "visible" });
  pass("E interaction opens the Ava encounter from Room 1 proximity.");

  await page.getByRole("button", { name: "Ask parent to step out" }).click();
  await page
    .getByText("Ava is being interviewed privately.", { exact: false })
    .waitFor({ state: "visible" });
  pass("Confidential interview transitions the canonical Ava encounter to private history.");

  await page.getByRole("button", { name: "Return to the 3D hospital" }).click();
  await waitForPrompt(page, "Continue Ava Rodriguez encounter");
  await page.keyboard.press("e");
  await avaEncounter.waitFor({ state: "visible" });
  await page
    .getByText("Ava is being interviewed privately.", { exact: false })
    .waitFor({ state: "visible" });
  pass("Leaving and re-entering Room 1 preserves the active Ava encounter and confidentiality state.");

  await clickFirstHistoryQuestions(page, 4);
  const preReloadState = await persistedState(page);
  const preAvaEncounters = Object.values(preReloadState.encounters).filter(
    (encounter) => encounter.caseId === "case-vasovagal",
  );
  assert.equal(preAvaEncounters.length, 1, "Expected one Ava encounter before reload");
  const preEncounter = preAvaEncounters[0];
  assert.equal(preEncounter.stage, "history");
  assert.equal(preEncounter.confidentialInterviewDone, true);
  assert.ok(preEncounter.askedHistoryKeys.length >= 4);
  const preEncounterId = preEncounter.encounterId;
  const preAsked = JSON.stringify(preEncounter.askedHistoryKeys);
  await screenshot(page, "04-ava-before-reload");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Resume patient" })
    .waitFor({ state: "visible", timeout: 15000 });
  await page.getByRole("button", { name: "Resume patient" }).click();
  await page
    .getByRole("region", { name: "Ava Rodriguez clinical encounter" })
    .waitFor({ state: "visible" });
  await page
    .getByText("Ava is being interviewed privately.", { exact: false })
    .waitFor({ state: "visible" });

  state = await persistedState(page);
  const postAvaEncounters = Object.values(state.encounters).filter(
    (encounter) => encounter.caseId === "case-vasovagal",
  );
  assert.equal(postAvaEncounters.length, 1, "Reload must not duplicate the Ava encounter");
  assert.equal(postAvaEncounters[0].encounterId, preEncounterId, "Reload must resume same Ava encounter id");
  assert.equal(postAvaEncounters[0].stage, "history", "Reload must resume the same stage");
  assert.equal(
    JSON.stringify(postAvaEncounters[0].askedHistoryKeys),
    preAsked,
    "Reload must preserve prior history work",
  );
  assert.equal(
    postAvaEncounters[0].confidentialInterviewDone,
    true,
    "Reload must preserve confidentiality transition",
  );
  assert.equal(
    Object.values(state.encounters).filter((encounter) => encounter.caseId === "case-hcm").length,
    1,
    "Reload must not duplicate Marcus encounters",
  );
  assert.equal(
    state.patients["patient-case-hcm"]?.disposition,
    "complete",
    "Reload must not resurrect completed Marcus",
  );
  assert.equal(
    new Set(state.pager.receivedIds).size,
    state.pager.receivedIds.length,
    "Reload must not duplicate pager entries",
  );
  assert.equal(
    state.tasks["task-case-vasovagal"]?.status,
    "in-progress",
    "Ava task should remain in progress after reload",
  );
  pass(
    "Reload resumes the exact Ava encounter/stage/work and creates no duplicate encounter, patient/task, or page state.",
  );
  await screenshot(page, "05-ava-after-reload");

  await page.getByRole("button", { name: "Return to the 3D hospital" }).click();
  await waitForPrompt(page, "Continue Ava Rodriguez encounter");
  await page.getByRole("button", { name: /Worklist/ }).click();
  const hydratedWorklist = page.locator("#hospital-work-queue");
  await assertTextIncludes(hydratedWorklist, "Ava Rodriguez · Cardiology consult");
  await assertTextIncludes(hydratedWorklist, "Review overnight cardiology handoff");
  assert.equal(await hydratedWorklist.locator("article.work-queue-item").count(), 2);
  await page.getByRole("button", { name: /Worklist/ }).click();
  pass("Ava + unfinished handoff Worklist invariant survives reload.");
  await page.keyboard.press("e");
  await avaEncounter.waitFor({ state: "visible" });

  await completeAvaFromHistory(page);
  pass("Ava progressed through history, exam, ECG/testing, assessment/management, and debrief.");

  await page.getByRole("button", { name: "Replay this case" }).click();
  await page
    .getByRole("region", { name: "Ava Rodriguez clinical encounter" })
    .waitFor({ state: "visible" });
  await page.getByText("Her father is still in the room.", { exact: false }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Ask parent to step out" }).waitFor({ state: "visible" });
  state = await persistedState(page);
  const replayAttempts = Object.values(state.encounters).filter(
    (encounter) => encounter.caseId === "case-vasovagal",
  );
  assert.equal(
    replayAttempts.length,
    2,
    "Replay should preserve the first attempt and create exactly one fresh attempt",
  );
  const activeReplay = replayAttempts.find((encounter) => encounter.stage !== "complete");
  assert.ok(activeReplay, "Replay should create a fresh active encounter");
  assert.equal(activeReplay.confidentialInterviewDone, false, "Replay must restore parent/confidential state");
  assert.equal(activeReplay.askedHistoryKeys.length, 0, "Replay must reset history work");
  pass("Replay creates a fresh Ava attempt with father/confidential state reset.");
  await screenshot(page, "06-ava-replay-fresh");

  await completeAvaFromHistory(page);
  await page.getByRole("button", { name: "Complete encounter and return to hospital" }).click();
  state = await persistedState(page);
  assert.equal(
    state.patients["patient-case-vasovagal"]?.disposition,
    "complete",
    "Ava should be removed from world projection after completion",
  );
  assert.equal(state.tasks["task-case-vasovagal"]?.status, "complete");
  assert.equal(state.learner.activeCaseId, undefined);
  assert.equal(
    Object.values(state.encounters).filter((encounter) => encounter.caseId === "case-vasovagal").length,
    2,
  );
  await page.getByText("Clinical consults complete", { exact: false }).waitFor({ state: "visible" });
  pass("Final Ava completion leaves no active consult; canonical disposition removes Ava from world projection.");
  await screenshot(page, "07-final-hospital-state");

  if (browserErrors.length > 0) {
    throw new Error(`Browser page errors occurred:\n${browserErrors.join("\n")}`);
  }

  fs.writeFileSync(`${ARTIFACT_DIR}/acceptance.txt`, `${evidence.join("\n")}\n`);
} catch (error) {
  fs.writeFileSync(
    `${ARTIFACT_DIR}/acceptance.txt`,
    `${evidence.join("\n")}\nFAIL: ${error?.stack ?? error}\n${browserErrors.join("\n")}\n`,
  );
  throw error;
} finally {
  await browser.close();
}

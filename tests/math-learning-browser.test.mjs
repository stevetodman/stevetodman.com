import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { getChromium, startServer, watchForErrors } from "./helpers/harness.mjs";

let server, browser;
before(async () => { server = await startServer(); browser = await (await getChromium()).launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function activeQuestion(page) {
  return page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("mathmission.m1.v1")).luke;
    return profile.activeSession.queue[profile.activeSession.index];
  });
}

async function answerCurrent(page, correct = true) {
  const question = await activeQuestion(page);
  if (question.components?.length) {
    for (const part of question.components) {
      const expected = String(question.correctResponse[part.id]);
      if (part.options) {
        const selected = correct ? expected : String(part.options.find(option => String(option) !== expected) ?? part.options[0]);
        await page.locator(`.component-choice[data-component-id="${part.id}"]`).evaluateAll((buttons, value) => buttons.find(button => button.dataset.componentValue === value)?.click(), selected);
      } else await page.locator(`.component-input[data-component-id="${part.id}"]`).fill(correct ? expected : "999");
    }
  } else if (question.options) {
    const selected = correct ? String(question.answer) : String(question.options.find(option => String(option) !== String(question.answer)) ?? question.options[0]);
    await page.locator(".choice[data-value]").evaluateAll((buttons, value) => buttons.find(button => button.dataset.value === value)?.click(), selected);
  } else await page.locator("#answer-input").fill(correct ? String(question.answer) : "999");
  await page.locator("#check-button").click();
}

test("390px learning smoke: repair resumes and Test Run stays neutral until complete", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage(), errors = watchForErrors(page);
  await page.addInitScript(() => localStorage.setItem("mathmission.m1.v1", JSON.stringify({ luke: { diagnostic: true, diagnosticVersion: 3, attempts: [], sessions: 0, recheckVersion: 2, rechecks: {} } })));
  const response = await page.goto(`${server.origin}/math/`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  try {
    await page.locator('[data-profile="luke"]').click();
    await page.locator('[data-start="practice"]').click();
    await answerCurrent(page, false);
    await page.locator("#feedback.bad").waitFor();
    assert.match(await page.locator("#feedback").innerText(), /Review the idea/i);

    await page.locator("[data-next]").click();
    assert.equal(await page.locator("#question-title").innerText(), "Quick fix");
    await answerCurrent(page, true);
    await page.locator("[data-next]").click();
    assert.match(await page.locator("#session-mode").innerText(), /Guided step/i);
    await answerCurrent(page, true);
    await page.locator("[data-next]").click();

    const beforeExit = (await activeQuestion(page)).questionId;
    await page.locator('[data-action="quit"]').click();
    await page.locator('[data-action="confirm-exit"]').click();
    assert.match(await page.locator("#primary-card").innerText(), /Continue today’s mission/i);
    await page.locator("[data-resume]").click();
    assert.equal((await activeQuestion(page)).questionId, beforeExit, "resume must not reroll the pending item");
    await page.locator('[data-action="quit"]').click();
    await page.locator('[data-action="confirm-exit"]').click();
    await page.locator("[data-discard-session]").click();

    await page.locator('[data-start="test"]').click();
    assert.equal(await page.locator("#session-mode").innerText(), "Independent test");
    let sawModel = false;
    for (let index = 0; index < 12; index += 1) {
      sawModel ||= await page.locator(".division-model").count() > 0;
      await answerCurrent(page, index !== 0);
      const feedback = await page.locator("#feedback").innerText();
      assert.match(feedback, /Answer recorded.*Results come at the end/is);
      assert.doesNotMatch(feedback, /correct|incorrect|not yet|yes\./i);
      assert.equal(await page.locator("#live-mission:visible").count(), 0);
      assert.equal(await page.locator(".ss-toast:visible").count(), 0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px`);
      await page.locator("[data-next]").click();
    }
    assert.equal(sawModel, true, "Test Run must render the essential place-value model");
    assert.match(await page.locator("#result-title").innerText(), /Test run complete/i);
    assert.match(await page.locator("#result-analysis").innerText(), /Your answer:.*Correct:/is);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("mathmission.m1.v1")).luke);
    assert.equal(stored.activeSession, null);
    assert.equal(stored.testRuns, 1);
    assert.ok(stored.attempts.some(attempt => attempt.repairOnly && attempt.assisted && attempt.recoveryOf), "repair evidence must retain its source failure");
    assert.ok(stored.attempts.some(attempt => attempt.testRun && !attempt.correct && attempt.reviewedAt));
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join("\n")}`);
  } finally { await context.close(); }
});

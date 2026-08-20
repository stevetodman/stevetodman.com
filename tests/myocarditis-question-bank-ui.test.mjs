import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openBank() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  const response = await page.goto(server.origin + '/myocarditis/question-bank/', { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  return { context, page, errors };
}

describe('database-backed myocarditis question bank', () => {
  test('loads the editorial manifest and six core stacks', async () => {
    const { context, page, errors } = await openBank();
    assert.match(await page.locator('#bank-version').innerText(), /2\.0\.0-draft/i);
    assert.match(await page.locator('#bank-status').innerText(), /editorial review required/i);
    assert.equal(await page.locator('#stack-select option').count(), 6);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('renders ten randomized-label questions without grading content', async () => {
    const { context, page, errors } = await openBank();
    await page.locator('#start-stack').click();
    assert.equal(await page.locator('.bank-question').count(), 10);
    assert.equal(await page.locator('.bank-question').first().locator('input[type="radio"]').count(), 5);
    assert.equal(await page.locator('.bank-feedback').count(), 0);
    assert.equal(await page.locator('.bank-pearl').count(), 0);

    const firstValues = await page.locator('.bank-question').first().locator('input[type="radio"]').evaluateAll(nodes => nodes.map(node => node.value));
    assert.equal(firstValues.every(value => !/^[A-E]$/.test(value)), true);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('grades against stable option ids and reveals complete explanations only afterward', async () => {
    const stack = JSON.parse(fs.readFileSync(path.join(repoRoot, 'myocarditis', 'question-bank', 'stack-01.json'), 'utf8'));
    const answers = new Map(stack.questions.map(question => [question.id, question.correct_option_id]));
    const { context, page, errors } = await openBank();
    await page.locator('#start-stack').click();

    for (const [questionId, optionId] of answers) {
      await page.locator(`[data-question-id="${questionId}"] input[value="${optionId}"]`).check();
    }
    await page.locator('#bank-form button[type="submit"]').click();
    assert.match(await page.locator('#bank-score h2').innerText(), /10\/10/);
    assert.equal(await page.locator('.bank-feedback').count(), 10);
    assert.equal(await page.locator('.bank-pearl').count(), 10);
    assert.equal(await page.locator('.bank-question').first().locator('.bank-explanations details').count(), 5);
    assert.deepEqual(errors, []);
    await context.close();
  });
});

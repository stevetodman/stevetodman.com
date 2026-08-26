import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

describe('Unit 1 Word Mission', () => {
  test('keeps the active assignment focused and archives old activities', async () => {
    const page = await browser.newPage();
    await page.goto(server.origin + '/study/');
    assert.equal(await page.locator('.assignment').count(), 1);
    assert.match(await page.locator('.assignment').innerText(), /Unit 1 Vocabulary & Spelling/);
    assert.equal(await page.locator('a[href="archive/"]').count(), 1);
    await page.close();
  });

  test('contains all 12 teacher words and marks unassigned antonyms honestly', async () => {
    const page = await browser.newPage();
    const errors = watchForErrors(page);
    await page.goto(server.origin + '/study/unit-1/');
    await page.locator('[data-profile="learner-1"]').click();
    await page.locator('[data-mode="learn"]').click();
    const words = await page.locator('.word-card h3').allTextContents();
    assert.deepEqual(words, [
      'blunder','cancel','continuous','distribute','document','fragile',
      'myth','reject','scuffle','solitary','temporary','veteran'
    ]);
    assert.match(await page.locator('.word-card').filter({ hasText:'document' }).innerText(), /Not assigned on the worksheet/);
    assert.match(await page.locator('.word-card').filter({ hasText:'scuffle' }).innerText(), /Not assigned on the worksheet/);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('offers all four required domains and stores learner progress separately', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(server.origin + '/study/unit-1/');
    await page.locator('[data-profile="learner-1"]').click();
    const dashboard = await page.locator('#app').innerText();
    for (const label of ['Definitions','Synonyms','Antonyms','Spelling']) assert.match(dashboard, new RegExp(label));

    await page.locator('[data-mode="definitions"]').click();
    const input = page.locator('#answer-input');
    if (await input.count()) {
      await input.fill('test answer');
      await page.locator('#answer-form').evaluate(form => form.requestSubmit());
    } else {
      await page.locator('.choice').first().click();
    }
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('studyhub-word-mission-unit1-v2')));
    assert.ok(Object.keys(saved.learners[0].stats).length > 0);
    assert.equal(Object.keys(saved.learners[1].stats).length, 0);
    await context.close();
  });

  test('spelling practice dictates a word and accepts typed answers', async () => {
    const page = await browser.newPage();
    await page.goto(server.origin + '/study/unit-1/');
    await page.locator('[data-profile="learner-1"]').click();
    await page.locator('[data-mode="spelling"]').click();
    assert.equal(await page.locator('#listen').count(), 1);
    assert.equal(await page.locator('#answer-input').count(), 1);
    assert.match(await page.locator('.q-prompt').innerText(), /exact spelling/i);
    await page.close();
  });

  test('fits a narrow iPhone viewport without horizontal scrolling', async () => {
    const context = await browser.newContext({ viewport:{ width:375, height:812 } });
    const page = await context.newPage();
    await page.goto(server.origin + '/study/unit-1/');
    await page.locator('[data-profile="learner-1"]').click();
    const widths = await page.evaluate(() => ({ scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth }));
    assert.ok(widths.scroll <= widths.client + 2, `${widths.scroll}px content in ${widths.client}px viewport`);
    await context.close();
  });
});

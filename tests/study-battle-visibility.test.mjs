import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await getChromium().then(engine => engine.launch());
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test('weapons and monsters remain visibly in the fight on mobile and desktop', async () => {
  const viewports = [
    { name:'iphone-tiny', width:390, height:420 },
    { name:'iphone-short', width:390, height:520 },
    { name:'iphone-portrait', width:390, height:844 },
    { name:'desktop', width:1024, height:844 },
    { name:'desktop-wide', width:1440, height:900 },
  ];
  const evidence = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'study-evidence');
  fs.mkdirSync(evidence, { recursive:true });

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport:{ width:viewport.width, height:viewport.height } });
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await page.goto(server.origin + '/study/');
    await page.locator('[data-profile="Luke"]').click();

    const stage = page.locator('.battle-stage');
    const mission = page.locator('.mission-head');
    const hero = page.locator('.hero-fighter > svg');
    const enemy = page.locator('.enemy-fighter > svg');
    const question = page.locator('.question-card');

    assert.equal(await stage.count(), 1, `${viewport.name}: battle stage exists`);
    assert.equal(await stage.isVisible(), true, `${viewport.name}: battle stage is visible before any software keyboard is opened`);
    assert.equal(await mission.isVisible(), true, `${viewport.name}: question heading is visible`);
    assert.equal(await hero.isVisible(), true, `${viewport.name}: hero is visible`);
    assert.equal(await enemy.isVisible(), true, `${viewport.name}: monster is visible`);
    assert.equal(await question.isVisible(), true, `${viewport.name}: question remains visible`);

    const stageBox = await stage.boundingBox();
    assert.ok(stageBox && stageBox.width > 250 && stageBox.height >= 60, `${viewport.name}: combat has a usable visible area`);
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      stageTop: document.querySelector('.battle-stage')?.getBoundingClientRect().top,
      questionTop: document.querySelector('.question-card')?.getBoundingClientRect().top,
    }));
    assert.ok(layout.scrollWidth <= layout.clientWidth + 2, `${viewport.name}: no horizontal overflow`);
    assert.ok(layout.questionTop > layout.stageTop, `${viewport.name}: fight remains above the question`);
    assert.deepEqual(errors, [], `${viewport.name}: no page errors`);

    if (viewport.name === 'iphone-short' || viewport.name === 'desktop') {
      await page.screenshot({ path:path.join(evidence, `${viewport.name}-battle-visible.png`), fullPage:true });
    }
    await context.close();
  }
});

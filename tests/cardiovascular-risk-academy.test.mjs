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

async function openAcademy() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  await page.goto(server.origin + '/cardiovascular-risk/', { waitUntil: 'networkidle' });
  return { context, page, errors };
}

describe('cardiovascular prevention academy', () => {
  test('age rail rebuilds the preventive visit', async () => {
    const { context, page, errors } = await openAcademy();
    await page.check('#b3');
    assert.equal(await page.textContent('#visitTitle'), 'This visit: 9 to 11 years');
    assert.match(await page.textContent('#visitCards'), /Universal lipid screen/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('screening tool applies the 2026 age pivots', async () => {
    const { context, page, errors } = await openAcademy();
    await page.fill('#s-age', '9');
    await page.click('#f-screen button[type="submit"]');
    assert.match(await page.textContent('#o-screen'), /Universal screening window/i);

    await page.fill('#s-age', '19');
    await page.click('#f-screen button[type="submit"]');
    assert.match(await page.textContent('#o-screen'), /adult prevention pathway/i);
    assert.match(await page.textContent('#o-screen'), /every 5 years/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('FH treatment rule reflects the 2026 pediatric threshold', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-lipid');
    await page.fill('#l-age', '11');
    await page.selectOption('#l-stage', 'post');
    await page.fill('#l-ldl', '168');
    await page.check('#l-fhx');
    await page.click('#f-lipid button[type="submit"]');
    assert.match(await page.textContent('#o-lipid'), /Statin recommended/i);
    assert.match(await page.textContent('#o-lipid'), /2026 pediatric FH treatment threshold/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('eight applied cases score and explain immediately', async () => {
    const { context, page, errors } = await openAcademy();
    assert.equal(await page.locator('#quiz .case').count(), 8);
    await page.check('input[name="q0"][value="1"]');
    assert.match(await page.textContent('#fb0'), /Correct/i);
    assert.equal(await page.textContent('#score'), 'Answered 1 of 8');
    assert.match(await page.textContent('#fb0'), /9 to 11/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('superseded BP and obesity calculators are replaced by current bridges', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-bp');
    assert.equal(await page.locator('#f-bp').count(), 0);
    assert.match(await page.textContent('#p-bp'), /2017 AAP office pathway/i);

    await page.click('#tab-obes');
    assert.equal(await page.locator('#f-obes').count(), 0);
    assert.match(await page.textContent('#p-obes'), /26.*face-to-face hours/s);
    assert.deepEqual(errors, []);
    await context.close();
  });
});

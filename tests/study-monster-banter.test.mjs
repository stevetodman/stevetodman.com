import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await getChromium().then(engine => engine.launch());
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function currentWord(page){
  return page.evaluate(() => {
    const key=Object.keys(localStorage).find(k=>k.startsWith('studyhub-word-expedition-round-unit1-v1-'));
    const round=JSON.parse(localStorage.getItem(key));
    return round.questions[round.index].word.word;
  });
}

test('banter stays silly without insulting the child or owning learning state', () => {
  const source=fs.readFileSync(path.join(repoRoot,'study/unit-1/monster-banter.js'),'utf8');
  const html=fs.readFileSync(path.join(repoRoot,'study/unit-1/index.html'),'utf8');
  assert.match(html, /monster-banter\.css/);
  assert.match(html, /monster-banter\.js/);
  assert.ok(html.indexOf('aaa-polish.js') < html.indexOf('monster-banter.js'));
  assert.match(source, /Correct answers taste TERRIBLE/);
  assert.match(source, /question got offended/);
  assert.match(source, /person with a juice box/);
  for(const personalInsult of [
    'brain is smaller','toenail clippings smarter','walking mistake','go cry into your juice box',
    'tail is smarter than your whole head','not the sharpest tooth','funny when you fail'
  ]) assert.equal(source.toLowerCase().includes(personalInsult),false,`must not ship personal insult: ${personalInsult}`);
  for(const forbidden of ['recordResult(','saveState(','scheduleRetry(','nextQuestion(','SESSION_LENGTH','ROUND_KEY','session.']) {
    assert.equal(source.includes(forbidden),false,`banter layer must not own ${forbidden}`);
  }
  assert.doesNotMatch(source, /setTimeout\s*\(/, 'banter must not add delay to the learning cadence');
});

test('a wrong vocabulary answer gets a playful roast with no extra interaction step', async () => {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const errors=watchForErrors(page);
  await page.goto(server.origin+'/study/unit-1/',{waitUntil:'networkidle'});
  await page.locator('[data-profile="Luke"]').click();
  assert.notEqual(await page.locator('.q-domain').getAttribute('data-domain'),'spelling');
  const word=await currentWord(page);
  const labels=await page.locator('.choice').allTextContents();
  const wrongIndex=labels.findIndex(label=>label.trim()!==word);
  assert.ok(wrongIndex>=0);
  await page.locator('.choice').nth(wrongIndex).click();
  const roast=page.locator('.monster-roast');
  await roast.waitFor({state:'visible'});
  assert.ok((await roast.locator('p:last-child').innerText()).length>10);
  assert.equal(await roast.locator('button').count(),0,'banter itself must never require a tap');
  assert.equal(await page.locator('#continue').count(),1,'existing correction flow remains the only action');
  assert.deepEqual(errors,[]);
  await context.close();
});

test('a correct vocabulary answer makes the monster a frustrated loser without delaying Next', async () => {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const errors=watchForErrors(page);
  await page.goto(server.origin+'/study/unit-1/',{waitUntil:'networkidle'});
  await page.locator('[data-profile="Samantha"]').click();
  assert.notEqual(await page.locator('.q-domain').getAttribute('data-domain'),'spelling');
  const word=await currentWord(page);
  await page.getByRole('button',{name:word,exact:true}).click();
  const reaction=page.locator('.monster-frustrated');
  await reaction.waitFor({state:'visible'});
  assert.ok((await reaction.locator('p:last-child').innerText()).length>10);
  assert.equal(await reaction.locator('button').count(),0,'frustrated-loser line must be presentation only');
  assert.equal(await page.locator('#next-question').count(),1,'existing Next remains immediately available');
  assert.equal(await page.locator('.feedback.good').count(),1);
  assert.deepEqual(errors,[]);
  await context.close();
});

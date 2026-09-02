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

async function pinPreVocabDate(page){
  await page.addInitScript(() => {
    const RealDate=Date;
    const fixed='2026-08-31T12:00:00-05:00';
    class FixedDate extends RealDate {
      constructor(...args){super(...(args.length?args:[fixed]));}
      static now(){return new RealDate(fixed).getTime();}
    }
    FixedDate.parse=RealDate.parse;
    FixedDate.UTC=RealDate.UTC;
    window.Date=FixedDate;
  });
}

test('banter stays silly without insulting the child or owning learning state', () => {
  const source=fs.readFileSync(path.join(repoRoot,'study/unit-1/monster-banter.js'),'utf8');
  const unitHtml=fs.readFileSync(path.join(repoRoot,'study/unit-1/index.html'),'utf8');
  assert.match(unitHtml, /monster-banter\.css/,'study/unit-1/index.html must load banter styles');
  assert.match(unitHtml, /monster-banter\.js/,'study/unit-1/index.html must load banter behavior');
  assert.match(unitHtml, /aaa-collection\.js/,'study/unit-1/index.html must load the monster collection');
  assert.ok(unitHtml.indexOf('aaa-polish.js') < unitHtml.indexOf('monster-banter.js'),'study/unit-1/index.html must load banter after combat polish');

  const hubHtml=fs.readFileSync(path.join(repoRoot,'study/index.html'),'utf8');
  assert.match(hubHtml, /href="\/study\/unit-1\/"/,'Study hub must route to Word Expedition');
  assert.doesNotMatch(hubHtml, /monster-banter\.(?:css|js)|aaa-collection\.js/,'Study hub must not duplicate the Word Expedition presentation runtime');

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

test('Word Expedition gives a wrong-answer roast, counterattack, and recovered hit', async () => {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await pinPreVocabDate(page);
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
  assert.match(await page.locator('#battle-status').innerText(),/sweeps|launches|slams|casts/,'a miss must trigger the monster counterattack');
  assert.equal(await page.locator('.shield-segment.cleared').count(),0,'a miss alone must not clear a shield point');
  await page.locator('#continue').click();
  assert.equal(await page.locator('.shield-segment.cleared').count(),1,'the correction must land the recovered hit');
  assert.deepEqual(errors,[]);
  await context.close();
});

test('Word Expedition correct answer lands a hit and makes the monster a frustrated loser without delaying Next', async () => {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await pinPreVocabDate(page);
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
  assert.equal(await page.locator('.shield-segment.cleared').count(),1,'a correct answer must land exactly one hit');
  assert.deepEqual(errors,[]);
  await context.close();
});
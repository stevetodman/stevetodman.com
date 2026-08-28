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

async function fastContext(options = {}) {
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    const nativeTimeout = window.setTimeout;
    window.setTimeout = (fn, ms, ...args) => nativeTimeout(fn, Number(ms)<1000?Math.min(Number(ms)||0,20):ms, ...args);
    const nativeNow=performance.now.bind(performance);let readingTime=0;
    performance.now=()=>nativeNow()+readingTime;
    document.addEventListener('submit',()=>{readingTime+=15000;},true);
    document.addEventListener('click',event=>{if(event.target.closest('.choice'))readingTime+=15000;},true);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel = () => {};
  });
  return context;
}

async function answerCurrentQuestion(page) {
  if (await page.locator('#answer-input').count()) {
    await page.locator('#answer-input').fill('definitely wrong');
    await page.locator('#answer-form').evaluate(form => form.requestSubmit());
    const correction = page.locator('#correction-input');
    const answer = await page.locator('#correction-form strong').innerText();
    await correction.fill(answer);
    await page.locator('#correction-form').evaluate(form => form.requestSubmit());
  } else {
    await page.locator('.choice').first().click();
    if (await page.locator('#continue').count()) await page.locator('#continue').click();
    else if (await page.locator('#next-question').count()) await page.locator('#next-question').click();
  }
  await page.waitForTimeout(35);
}

const schoolAnswers = {
  blunder:{ definition:'to make a foolish or careless mistake', synonym:'err', antonym:'triumph' },
  cancel:{ definition:'to call off or do away with; to cross out so it cannot be used again', synonym:'stop', antonym:'renew' },
  continuous:{ definition:'going on without a stop or break', synonym:'ongoing', antonym:'broken' },
  distribute:{ definition:'to give out in shares; to scatter or spread', synonym:'divide', antonym:'gather' },
  document:{ definition:'a written or printed record that gives information or proof', synonym:'certificate' },
  fragile:{ definition:'easily broken or damaged; requiring special handling or care', synonym:'weak', antonym:'sturdy' },
  myth:{ definition:'an old story that explains why something is or how it came to be; something imaginary', synonym:'legend', antonym:'fact' },
  reject:{ definition:'to refuse to accept, agree to, believe, or use', synonym:'deny', antonym:'take' },
  scuffle:{ definition:'to fight or struggle closely with', synonym:'tussle' },
  solitary:{ definition:'living or being alone; being the only one', synonym:'single', antonym:'sociable' },
  temporary:{ definition:'lasting or used for a limited time', synonym:'short-term', antonym:'lasting' },
  veteran:{ definition:'a former member of the armed forces; an experienced person', synonym:'expert', antonym:'beginner' },
};

async function answerCorrectly(page, advance = true) {
  const domain = await page.locator('.q-domain').getAttribute('data-domain');
  const prompt = await page.locator('.q-prompt').innerText();
  let word;
  if (domain === 'definition' && await page.locator('#answer-input').count()) {
    word = Object.keys(schoolAnswers).find(name => prompt.includes(schoolAnswers[name].definition.split(';')[0]));
  } else {
    word = (await page.locator('.q-prompt .target').innerText()).trim();
  }
  assert.ok(word && schoolAnswers[word], `could not resolve ${domain} question: ${prompt}`);
  const answer = domain === 'definition' && await page.locator('#answer-input').count()
    ? word
    : schoolAnswers[word][domain];
  assert.ok(answer, `no ${domain} answer recorded for ${word}`);
  if (await page.locator('#answer-input').count()) {
    await page.locator('#answer-input').fill(answer);
    await page.locator('#answer-form').evaluate(form => form.requestSubmit());
  } else {
    await page.locator('.choice').filter({ hasText:answer }).first().click();
  }
  if(advance)await page.locator('#next-question').click();
  await page.waitForTimeout(35);
}

describe('Unit 1 Word Expedition', () => {
  test('puts Luke and Samantha one tap from the first question', async () => {
    const page = await browser.newPage();
    const errors = watchForErrors(page);
    await page.goto(server.origin + '/study/');

    assert.equal(await page.locator('.assignment').count(), 0);
    assert.equal(await page.locator('[data-profile="Luke"]').count(), 1);
    assert.equal(await page.locator('[data-profile="Samantha"]').count(), 1);
    assert.equal(await page.getByText('Parent center').count(), 0);
    assert.equal(await page.locator('[data-mode]').count(), 0);

    await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('.question-card').count(), 1);
    assert.equal(await page.locator('.pip').count(), 10);
    assert.equal(await page.locator('.shield-segment').count(), 10);
    assert.equal(await page.locator('.hero-fighter > svg').count(), 1);
    assert.equal(await page.locator('.enemy-fighter > svg').count(), 1);
    assert.match(await page.locator('.question-count').innerText(), /1 \/ 10/);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('contains all 12 teacher words and marks unassigned antonyms honestly', async () => {
    const page = await browser.newPage();
    await page.goto(server.origin + '/study/unit-1/');
    await page.locator('#word-list').click();
    const words = await page.locator('.word-card h3').allTextContents();
    assert.deepEqual(words, [
      'blunder','cancel','continuous','distribute','document','fragile',
      'myth','reject','scuffle','solitary','temporary','veteran'
    ]);
    assert.match(await page.locator('.word-card').filter({ hasText:'document' }).innerText(), /Not assigned on the worksheet/);
    assert.match(await page.locator('.word-card').filter({ hasText:'scuffle' }).innerText(), /Not assigned on the worksheet/);
    await page.close();
  });

  test('keeps each twin’s progress separate and never extends a session', async () => {
    const context = await fastContext();
    const page = await context.newPage();
    await page.goto(server.origin + '/study/');
    await page.locator('[data-profile="Luke"]').click();
    await answerCurrentQuestion(page);

    assert.equal(await page.locator('.pip').count(), 10);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')));
    assert.ok(Object.keys(saved.learners.Luke.stats).length > 0);
    assert.equal(Object.keys(saved.learners.Samantha.stats).length, 0);

    await page.locator('#profile-chip').click();
    await page.locator('[data-profile="Samantha"]').click();
    assert.equal(await page.locator('.question-card').count(), 1);
    const stillSeparate = await page.evaluate(() => JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')));
    assert.equal(Object.keys(stillSeparate.learners.Samantha.stats).length, 0);
    await context.close();
  });

  test('rotates automatically into spelling with audio, typing, and optional tiles', async () => {
    const context = await fastContext();
    const page = await context.newPage();
    await page.goto(server.origin + '/study/unit-1/');
    await page.locator('[data-profile="Luke"]').click();
    for (let i = 0; i < 7; i++) await answerCorrectly(page);

    assert.equal(await page.locator('.q-domain').getAttribute('data-domain'), 'spelling');
    assert.equal(await page.locator('#listen').count(), 1);
    assert.equal(await page.locator('#answer-input').count(), 1);
    assert.equal(await page.locator('#tile-toggle').count(), 1);
    await page.locator('#tile-toggle').click();
    assert.ok(await page.locator('.letter-tile').count() >= 4);
    await context.close();
  });

  test('contains cloud autosave with a device-local offline fallback', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'study/unit-1/app.js'), 'utf8');
    assert.match(source, /studyhub-save/);
    assert.match(source, /studyhubCloudToken/);
    assert.match(source, /scheduleCloudPush/);
    assert.match(source, /Saved on this device/);
    assert.match(source, /word-mission-unit1-luke/);
    assert.match(source, /word-mission-unit1-samantha/);
  });

  test('awards study coins, previews, spends, equips, persists, and isolates progress', async () => {
    const context = await fastContext();
    const page = await context.newPage();
    await page.goto(server.origin + '/study/');
    await page.locator('[data-profile="Luke"]').click();

    for (let i = 0; i < 10; i++) await answerCurrentQuestion(page);
    assert.equal(await page.locator('.game-summary').count(), 1);
    assert.match(await page.locator('.reward-row').innerText(), /\+20[\s\S]*Level 2/);

    let game = await page.evaluate(() => JSON.parse(localStorage.getItem('studyhub-word-expedition-game-unit1-v1')));
    assert.equal(Object.keys(game.learners.Luke.rewards).length, 1);
    assert.equal(Object.keys(game.learners.Samantha.rewards).length, 0);

    await page.locator('#visit-shop').click();
    await page.locator('[data-item="copper-blade"]').click();
    await page.getByRole('button', { name:'Use 8 coins' }).click();
    assert.equal(await page.locator('.shop-card.equipped').filter({ hasText:'Copper Blade' }).count(), 1);

    await page.reload();
    await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('.hero-fighter .gear.weapon.copper').count(), 1);
    await page.locator('#profile-chip').click();
    await page.locator('[data-profile="Samantha"]').click();
    assert.match(await page.locator('.level-chip').innerText(), /^level 1$/i);
    assert.equal(await page.locator('.hero-fighter .gear.weapon.starter').count(), 1);
    await context.close();
  });

  test('fits supported phone, tablet, and desktop widths without horizontal scrolling', async () => {
    for (const width of [320, 375, 390, 768, 1024]) {
      const context = await browser.newContext({ viewport:{ width, height:844 } });
      const page = await context.newPage();
      await page.goto(server.origin + '/study/');
      await page.locator('[data-profile="Luke"]').click();
      const sizes = await page.evaluate(() => ({ scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth }));
      assert.ok(sizes.scroll <= sizes.client + 2, `${sizes.scroll}px content in ${sizes.client}px viewport at ${width}px`);
      await context.close();
    }
  });

  test('reload resumes a pending correction without duplicating learning attempts', async () => {
    const context=await fastContext();const page=await context.newPage();
    await page.goto(server.origin+'/study/');await page.locator('[data-profile="Luke"]').click();
    await page.locator('#answer-input').fill('not the answer');await page.locator('#answer-input').press('Enter');
    await page.locator('#correction-input').waitFor();
    const expected=await page.locator('#correction-form strong').innerText();
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')).learners.Luke.stats);
    await page.reload();assert.match(await page.locator('[data-profile="Luke"]').innerText(),/Resume adventure/);
    await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('#correction-form strong').innerText(),expected);
    await page.locator('#correction-input').fill(expected);await page.locator('#correction-input').press('Enter');
    await page.waitForTimeout(40);
    assert.match(await page.locator('.question-count').innerText(),/2 \/ 10/);
    const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')).learners.Luke.stats);
    assert.deepEqual(after,before);
    await context.close();
  });

  test('reload preserves a correct answer awaiting Next and the same round ID', async () => {
    const context=await fastContext();const page=await context.newPage();
    await page.goto(server.origin+'/study/');await page.locator('[data-profile="Samantha"]').click();
    await answerCorrectly(page,false);
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-round-unit1-v1-Samantha')));
    await page.reload();await page.locator('[data-profile="Samantha"]').click();
    assert.equal(await page.locator('#next-question').count(),1);
    assert.match(await page.locator('.shield-row').getAttribute('aria-label'),/^1 of 10/);
    await page.locator('#next-question').click();
    const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-round-unit1-v1-Samantha')));
    assert.equal(after.id,before.id);assert.equal(after.results.length,1);assert.equal(after.index,1);
    await context.close();
  });

  test('gear preview never spends coins; starter gear and purchases remain available', async () => {
    const context=await fastContext();const page=await context.newPage();
    await page.goto(server.origin+'/study/');await page.locator('[data-profile="Luke"]').click();
    for(let i=0;i<10;i++)await answerCurrentQuestion(page);
    await page.locator('#visit-shop').click();await page.locator('[data-item="copper-blade"]').click();
    let game=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-game-unit1-v1')).learners.Luke);
    assert.deepEqual(game.purchases,{});assert.equal(game.equipped.weapon,'starter-sword');
    await page.locator('#cancel-gear').click();
    await page.locator('[data-item="copper-blade"]').click();await page.locator('#confirm-gear').click();
    await page.locator('#starter-gear').click();
    game=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-game-unit1-v1')).learners.Luke);
    assert.equal(game.equipped.weapon,'starter-sword');assert.ok(game.purchases['copper-blade']);
    await page.locator('[data-item="copper-blade"]').click();assert.equal(await page.locator('#confirm-gear').innerText(),'Equip this');
    await context.close();
  });

  test('tenth answer resumes safely and completion is awarded once', async () => {
    const context=await fastContext();const page=await context.newPage();
    await page.goto(server.origin+'/study/');await page.locator('[data-profile="Luke"]').click();
    for(let i=0;i<9;i++)await answerCurrentQuestion(page);
    await page.reload();await page.locator('[data-profile="Luke"]').click();
    assert.match(await page.locator('.question-count').innerText(),/10 \/ 10/);
    await answerCurrentQuestion(page);await page.locator('.game-summary').waitFor();
    await page.reload();
    const game=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-game-unit1-v1')).learners.Luke);
    assert.equal(Object.keys(game.rewards).length,1);assert.equal(game.sessionsCompleted,1);
    assert.match(await page.locator('[data-profile="Luke"]').innerText(),/Start adventure/);
    await context.close();
  });

  test('post-session time is saved and the short reward break stays within 10 percent', async () => {
    const context=await fastContext();const page=await context.newPage();
    await page.goto(server.origin+'/study/');await page.locator('[data-profile="Luke"]').click();
    for(let i=0;i<10;i++)await answerCurrentQuestion(page);
    await page.locator('#visit-shop').click();await page.locator('#shop-done').click();
    const entry=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')).learners.Luke.sessions[0]);
    assert.ok(entry.timing.learning>=150000,'fixture explicitly simulates reading before each answer');
    assert.ok(entry.timing.play>0);
    assert.ok(entry.timing.play/(entry.timing.learning+entry.timing.play)<=0.1);
    await context.close();
  });

  test('home, question, correction, summary and shop pass serious accessibility checks', async () => {
    const context=await fastContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page=await context.newPage();await page.goto(server.origin+'/study/');
    const axeModule=await import('axe-core');await page.addScriptTag({content:(axeModule.default||axeModule).source});
    async function scan(label){
      const violations=await page.evaluate(async()=>{
        const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
        return result.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
      });
      assert.deepEqual(violations,[],label);
    }
    await scan('home');await page.locator('[data-profile="Luke"]').click();await scan('question');
    await page.locator('#answer-input').fill('wrong');await page.locator('#answer-input').press('Enter');await scan('correction');
    await page.locator('#correction-input').fill(await page.locator('#correction-form strong').innerText());await page.locator('#correction-input').press('Enter');await page.waitForTimeout(35);
    for(let i=1;i<10;i++)await answerCurrentQuestion(page);
    await scan('summary');await page.locator('#visit-shop').click();await scan('shop');
    await context.close();
  });
});

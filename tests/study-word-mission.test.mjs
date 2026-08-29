import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  const engine=process.env.STUDY_BROWSER==='webkit'?(await import('playwright')).webkit:await getChromium();
  browser = await engine.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function fastContext(options = {}) {
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    const NativeDate=Date,fixtureDate=new NativeDate('2026-08-28T12:00:00').getTime();
    window.Date=class extends NativeDate {
      constructor(...args){super(...(args.length?args:[fixtureDate]));}
      static now(){return fixtureDate;}
    };
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

async function seedSavedCoins(context) {
  await context.addInitScript(()=>{
    const key='studyhub-word-expedition-game-unit1-v1';
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,learners:{Luke:{rewards:{_legacy:{xp:0,coins:8}}}}}));
  });
}

async function answerCurrentQuestion(page) {
  const question=await page.locator('.question-count').innerText();
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
  await page.waitForFunction(previous=>document.querySelector('.game-summary')||document.querySelector('.question-count')?.textContent!==previous,question);
}

async function advanceToSpelling(page) {
  for (let i=0;i<10;i++) {
    if (await page.locator('.q-domain').getAttribute('data-domain') === 'spelling') return;
    await answerCurrentQuestion(page);
  }
  throw new Error('Session did not reach a spelling question');
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
  const word=await page.evaluate(()=>{
    const key=Object.keys(localStorage).find(key=>key.startsWith('studyhub-word-expedition-round-unit1-v1-'));
    const round=JSON.parse(localStorage.getItem(key));return round.questions[round.index].word.word;
  });
  assert.ok(word && schoolAnswers[word], `could not resolve ${domain} question for ${word}`);
  if (domain === 'spelling') {
    await page.locator('#answer-input').fill(word); await page.locator('#answer-form').evaluate(form => form.requestSubmit());
  } else {
    assert.equal(await page.locator('.choice').count(),12,'vocabulary uses the complete 12-word bank');
    await page.getByRole('button', { name:word, exact:true }).click();
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
    assert.match(await page.locator('[data-profile="Luke"] .journey-line').innerText(),/Adventure 1 of 12/);
    assert.equal(await page.locator('.hero-frame').count(),0,'picker does not include attack images');
    assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(entry=>entry.name.includes('hero-poses.webp'))),false);
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

  test('uses the full teacher word bank for vocabulary clues', async () => {
    const context = await fastContext(); const page = await context.newPage();
    await page.goto(server.origin + '/study/unit-1/'); await page.locator('[data-profile="Luke"]').click();
    assert.notEqual(await page.locator('.q-domain').getAttribute('data-domain'),'spelling');
    const choices=(await page.locator('.choice').allTextContents()).sort();
    assert.deepEqual(choices,['blunder','cancel','continuous','distribute','document','fragile','myth','reject','scuffle','solitary','temporary','veteran'].sort());
    assert.match(await page.locator('.q-prompt').innerText(),/Which vocabulary word/); await context.close();
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
    const context = await fastContext();await seedSavedCoins(context);
    const page = await context.newPage();
    await page.goto(server.origin + '/study/');
    await page.locator('[data-profile="Luke"]').click();

    for (let i = 0; i < 10; i++) await answerCurrentQuestion(page);
    assert.equal(await page.locator('.game-summary').count(), 1);
    assert.match(await page.locator('.round-review').innerText(),/recalled on the first try/);
    assert.match(await page.locator('.reward-row').innerText(), /\+20[\s\S]*Level 2/);

    let game = await page.evaluate(() => JSON.parse(localStorage.getItem('studyhub-word-expedition-game-unit1-v1')));
    assert.equal(Object.keys(game.learners.Luke.rewards).filter(id=>id!=='_legacy').length, 1);
    assert.equal(Object.keys(game.learners.Samantha.rewards).length, 0);

    await page.locator('#visit-shop').click();
    await page.locator('[data-item="copper-blade"]').click();
    await page.getByRole('button', { name:'Use 8 coins' }).click();
    assert.equal(await page.locator('.shop-card.equipped').filter({ hasText:'Copper Blade' }).count(), 1);

    await page.reload();
    await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('.hero-fighter [data-item-art="copper-blade"]').count(), 1);
    await page.locator('#profile-chip').click();
    await page.locator('[data-profile="Samantha"]').click();
    assert.match(await page.locator('.level-chip').innerText(), /^level 1$/i);
    assert.equal(await page.locator('.hero-fighter [data-item-art="starter-sword"]').count(), 1);
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
    await advanceToSpelling(page);
    const currentNumber=Number((await page.locator('.question-count').innerText()).split('/')[0].trim());
    await page.locator('#answer-input').fill('not the answer');await page.locator('#answer-input').press('Enter');
    await page.locator('#correction-input').waitFor();
    const expected=await page.locator('#correction-form strong').innerText();
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')).learners.Luke.stats);
    await page.reload();assert.match(await page.locator('[data-profile="Luke"]').innerText(),/Resume adventure/);
    await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('#correction-form strong').innerText(),expected);
    await page.locator('#correction-input').fill(expected);await page.locator('#correction-input').press('Enter');
    await page.locator('.question-count').filter({hasText:String(currentNumber+1)+' / 10'}).waitFor();
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
    const context=await fastContext();await seedSavedCoins(context);const page=await context.newPage();
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

  test('post-session time is saved after a short store visit', async () => {
    const context=await fastContext();const page=await context.newPage();
    await page.goto(server.origin+'/study/');await page.locator('[data-profile="Luke"]').click();
    for(let i=0;i<10;i++)await answerCurrentQuestion(page);
    await page.locator('#visit-shop').click();await page.locator('#shop-done').click();
    const entry=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')).learners.Luke.sessions[0]);
    assert.ok(entry.timing.learning>=150000,'fixture explicitly simulates reading before each answer');
    assert.ok(entry.timing.play>0);
    assert.ok(Number.isFinite(entry.timing.play));
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
    await advanceToSpelling(page);await scan('spelling question');
    await page.locator('#answer-input').fill('wrong');await page.locator('#answer-input').press('Enter');await scan('correction');
    await page.locator('#correction-input').fill(await page.locator('#correction-form strong').innerText());await page.locator('#correction-input').press('Enter');await page.waitForTimeout(35);
    for(let guard=0;guard<10&&!(await page.locator('.game-summary').count());guard++)await answerCurrentQuestion(page);
    assert.equal(await page.locator('.game-summary').count(),1);
    await scan('summary');await page.locator('#visit-shop').click();await scan('shop');
    await context.close();
  });

  for(const failure of ['event','exception'])test('audio '+failure+' failure has a visible model and tile recovery stays assisted', async () => {
    const context=await fastContext();
    await context.addInitScript(failure=>{
      // Replace the complete API boundary: native WebKit method wrappers are
      // not a portable fault-injection surface. The fallback must still render.
      Object.defineProperties(window,{
        SpeechSynthesisUtterance:{configurable:true,value:class {constructor(text){this.text=text;}}},
        speechSynthesis:{configurable:true,value:{
          getVoices(){if(failure==='exception')throw new Error('Voice service unavailable');return [];},
          cancel(){if(failure==='exception')throw new Error('Voice service unavailable');},
          speak(utterance){if(failure==='exception')throw new Error('Voice service unavailable');utterance.onerror?.({error:'synthesis-unavailable'});}
        }}
      });
    },failure);
    const page=await context.newPage();const errors=watchForErrors(page);await page.goto(server.origin+'/study/');
    await page.locator('[data-profile="Luke"]').click();
    await answerCorrectly(page);
    assert.equal(await page.locator('#listen').count(),0,'word-bank vocabulary clues are readable and do not depend on speech');
    assert.equal(await page.locator('.choice').count(),12,'vocabulary keeps the complete assigned word bank visible');
    for(let i=1;i<7;i++)await answerCorrectly(page);
    await page.locator('#listen').click();
    assert.match(await page.locator('.audio-note').innerText(),/Audio is unavailable/);
    await page.locator('#tile-toggle').click();
    const word=await page.locator('.tile-model strong').innerText();
    await page.locator('.letter-tile').filter({hasText:new RegExp('^'+word[0]+'$')}).first().click();
    await page.reload();await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('.tile-model strong').innerText(),word);
    assert.equal(await page.locator('.built-word').innerText(),word[0]);
    assert.equal(await page.locator('#answer-input').count(),0,'reload cannot turn a scaffold into unassisted mastery');
    for(const letter of word.slice(1))await page.locator('.letter-tile').filter({hasText:new RegExp('^'+letter+'$')}).first().click();
    await page.locator('#tile-check').click();
    assert.match(await page.locator('#feedback-area').innerText(),/Built correctly/);
    const stats=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')).learners.Luke.stats);
    const spelling=Object.entries(stats).find(([key])=>key.includes(word)&&key.includes('spelling'))?.[1];
    assert.equal(spelling.assisted,1);assert.deepEqual(spelling.correctDays,[]);
    assert.deepEqual(errors,[],'unavailable audio never breaks starting, advancing or resuming');
    await context.close();
  });

  test('weapons and monsters render audible effects and device mute survives reload', async () => {
    const context=await browser.newContext();const page=await context.newPage();
    await page.goto(server.origin+'/study/');
    const source=fs.readFileSync(path.join(repoRoot,'study/unit-1/app.js'),'utf8');
    const renderSource=source.slice(source.indexOf('  function renderWeaponSound('),source.indexOf('  function playWeaponSound('));
    const creatureSource=source.slice(source.indexOf('  function renderCreatureSound('),source.indexOf('  function playCreatureSound('));
    const rendered=await page.evaluate(async ({code,creatureCode})=>{
      const render=new Function('ART',code+';return renderWeaponSound;')(window.WordExpeditionArt);
      const renderCreature=new Function('ART',creatureCode+';return renderCreatureSound;')(window.WordExpeditionArt);
      const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
      const results=[];
      for(const weapon of ['starter-sword',...window.WordExpeditionArt.catalog.map(item=>item.id),'mossling','wisp','sentinel','boss']){
        const ctx=new Offline(1,31200,48000);
        if(['mossling','wisp','sentinel','boss'].includes(weapon))renderCreature(ctx,weapon,'guardian-mail');else render(ctx,weapon);
        const samples=(await ctx.startRendering()).getChannelData(0);
        let energy=0,peak=0;
        for(const sample of samples){energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
        results.push({weapon,rms:Math.sqrt(energy/samples.length),peak});
      }
      return results;
    },{code:renderSource,creatureCode:creatureSource});
    for(const sound of rendered){
      assert.ok(sound.rms>.001,sound.weapon+' produces audible energy');
      assert.ok(sound.peak<.5,sound.weapon+' has headroom and does not clip');
    }
    assert.equal(rendered.length,29);
    await page.locator('#cloud-button').click();await page.locator('#weapon-sounds').click();
    await page.reload();await page.locator('#cloud-button').click();
    assert.equal(await page.locator('#weapon-sounds').getAttribute('aria-pressed'),'false');
    await context.close();
  });

  test('monsters counterattack without penalties and spelling starts promptly with a local voice', async () => {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(()=>{
      window.heard=[];
      window.SpeechSynthesisUtterance=function(text){this.text=text;};
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
        cancel(){},resume(){},getVoices(){return [{name:'Remote',lang:'en-US',localService:false},{name:'Local',lang:'en-US',localService:true}];},
        speak(utterance){window.heard.push({text:utterance.text,voice:utterance.voice.name,rate:utterance.rate,at:performance.now()});}
      }});
    });
    const page=await context.newPage();await page.clock.install({time:new Date('2026-08-28T12:00:00')});
    await page.goto(server.origin+'/study/');await page.locator('[data-profile="Luke"]').click();
    await answerCorrectly(page,false);await page.clock.runFor(460);
    assert.equal(await page.locator('#battle-stage').getAttribute('data-state'),'counter');
    assert.equal(await page.locator('.shield-segment.cleared').count(),1,'counterattack cannot erase a correct answer');
    assert.equal(await page.locator('.question-count').innerText(),'1 / 10');
    await page.locator('#next-question').click();
    assert.equal(await page.locator('.monster-dialogue').count(),0,'gameplay presentation cannot add alternate vocabulary instruction');
    assert.equal(await page.locator('.choice').count(),12,'meaning practice uses the complete teacher word bank');
    assert.match(await page.locator('.q-prompt').innerText(),/Which vocabulary word/);
    for(let i=1;i<7;i++)await answerCorrectly(page);
    assert.equal(await page.locator('.q-domain').getAttribute('data-domain'),'spelling');
    const speech=await page.evaluate(()=>({last:window.heard.at(-1),age:performance.now()-window.heard.at(-1).at}));
    assert.equal(speech.last.voice,'Local');assert.equal(speech.last.rate,1);
    assert.ok(speech.age<220,'speech starts on render, without the former 220ms timer');
    assert.equal(await page.locator('.question-count').innerText(),'8 / 10');
    assert.equal(await page.locator('.monster-dialogue,.monster-taunt').count(),0,'spelling gets no story clue before the attempt');
    await page.locator('#answer-input').fill('definitely wrong');await page.locator('#answer-form').evaluate(form=>form.requestSubmit());
    assert.match(await page.locator('.monster-taunt').innerText(),/soggy turnip/);
    assert.equal(await page.locator('.monster-taunt .target').count(),0,'monster flavor never models or teaches the missed word');

    // Four representative battles in the existing smoke check; no exhaustive gear matrix.
    const scenes=[
      ['starter-sword','starter-cloak',0,'mossling','weapon-slash','hero-evade'],
      ['ember-hammer','iron-shield',2,'sentinel','weapon-overhead','hero-brace'],
      ['hunter-bow','guardian-mail',1,'wisp','weapon-draw','hero-brace'],
      ['crystal-wand','star-mantle',11,'boss','weapon-cast','hero-barrier'],
    ];
    const directory=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'study-evidence');fs.mkdirSync(directory,{recursive:true});
    for(const [weapon,armor,rounds,enemy,weaponMotion,defenseMotion] of scenes){
      await page.locator('#profile-chip').click();
      await page.evaluate(({weapon,armor,rounds})=>{
        localStorage.removeItem('studyhub-word-expedition-round-unit1-v1-Luke');
        localStorage.setItem('studyhub-word-expedition-game-unit1-v1',JSON.stringify({version:1,learners:{Luke:{sessionsCompleted:rounds,owned:[weapon,armor],equipped:{weapon,armor}}}}));
      },{weapon,armor,rounds});
      await page.reload();await page.locator('[data-profile="Luke"]').click();
      await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
      const stage=page.locator('#battle-stage');
      assert.equal(await stage.getAttribute('data-enemy'),enemy);
      assert.equal(await stage.locator('.hero-fighter').evaluate(el=>getComputedStyle(el).mixBlendMode),'normal','hero colors do not depend on screen blending');
      assert.equal(await stage.locator('.monster-cutout').evaluate(el=>getComputedStyle(el).maskImage),'none','transparent monsters must not have a circular fade');
      const gameBefore=await page.evaluate(()=>localStorage.getItem('studyhub-word-expedition-game-unit1-v1'));
      await answerCorrectly(page,false);
      const motion=await stage.evaluate(el=>({
        weapon:getComputedStyle(el.querySelector('.weapon-motion')).animationName,
        contact:Number.parseFloat(el.style.getPropertyValue('--contact')),
        hitDelay:Number.parseFloat(getComputedStyle(el.querySelector('.hit-mark')).animationDelay),
        nextEnabled:!document.querySelector('#next-question').disabled
      }));
      assert.equal(motion.weapon,weaponMotion,weapon);
      assert.equal(motion.hitDelay,motion.contact,'hit effect waits for weapon contact');
      assert.equal(motion.nextEnabled,true,'combat never locks Next');
      assert.equal(await page.locator('.shield-segment.cleared').count(),1);
      for(const [fraction,frame] of [[.1,'windup'],[1.1,'contact'],[1.5,'recover']]){
        const visible=await stage.evaluate((el,time)=>{
          for(const animation of el.getAnimations({subtree:true})){animation.pause();animation.currentTime=time;}
          return [...el.querySelectorAll('.hero-frame')].filter(frame=>Number(getComputedStyle(frame).opacity)===1).map(frame=>frame.classList[1]);
        },motion.contact*1000*fraction);
        assert.deepEqual(visible,['frame-'+frame],'one actual body pose is visible at each phase');
      }
      assert.ok(Number.parseFloat(await stage.evaluate(el=>el.style.getPropertyValue('--lunge')))>=0,'contact uses the current layout');
      if(weapon==='ember-hammer'||weapon==='crystal-wand'){
        await stage.evaluate((el,contact)=>{for(const animation of el.getAnimations({subtree:true})){animation.pause();animation.currentTime=contact*1000+70;}},motion.contact);
        await page.screenshot({path:path.join(directory,'390-combat-'+weapon+'.png'),fullPage:true,animations:'allow'});
      }
      await page.clock.runFor(Math.max(450,motion.contact*2000)+10);
      assert.equal(await stage.getAttribute('data-state'),'counter');
      assert.equal(await stage.locator('.hero-fighter').evaluate(el=>getComputedStyle(el).animationName),defenseMotion);
      const counter=await stage.locator('.enemy-fighter').evaluate(el=>getComputedStyle(el).animationName);
      assert.equal(counter,({mossling:'troll-swipe',sentinel:'golem-slam',wisp:'wisp-dart',boss:'owl-cast'})[enemy]);
      assert.equal(await page.locator('.shield-segment.cleared').count(),1,'every monster preserves the earned hit');
      assert.equal(await page.evaluate(()=>localStorage.getItem('studyhub-word-expedition-game-unit1-v1')),gameBefore,'combat cannot change currency or equipment');
      await page.locator('#next-question').click();
      await page.clock.runFor(650);
      assert.equal(await stage.getAttribute('data-state'),'ready','old counter cannot leak into the next question');
      assert.equal(await page.locator('.question-count').innerText(),'2 / 10');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await answerCorrectly(page,false);
    assert.equal(await page.locator('.weapon-motion').evaluate(el=>getComputedStyle(el).animationName),'none');
    assert.equal(await page.locator('.shield-segment.cleared').count(),2,'reduced motion preserves earned hits');
    assert.equal(await page.locator('.hero-idle').evaluate(el=>getComputedStyle(el).opacity),'1','reduced motion keeps the idle hero visible');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#next-question').click();
    for(let i=2;i<9;i++)await answerCorrectly(page);
    await answerCorrectly(page,false);
    assert.equal(await page.locator('#battle-stage').getAttribute('data-state'),'victory');
    assert.equal(await page.locator('.enemy-fighter').evaluate(el=>getComputedStyle(el).animationName),'owl-vanish');
    assert.equal(await page.locator('.finish-burst i').first().evaluate(el=>getComputedStyle(el).animationName),'finish-scatter');
    await page.locator('#next-question').click();
    assert.equal(await page.locator('#visit-shop').count(),1,'finishing animation never delays the summary');
    await context.close();
  });

  test('both learners get 50 seconds in the store after fast rounds and an unhurried summary', async () => {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.clock.install({time:new Date('2026-08-28T12:00:00')});
    for(const name of ['Luke','Samantha']){
      await page.goto(server.origin+'/study/');
      assert.equal(await page.locator('#monster-book').count(),0,'book is not a home-screen distraction');
      // Two perfect rounds earn the cheapest item; one round is no longer enough.
      for(let round=0;round<2;round++){
        await page.locator('[data-profile="'+name+'"]').click();
        assert.equal(await page.locator('#monster-book').count(),0,'no book while learning');
        for(let i=0;i<10;i++)await answerCorrectly(page);
        assert.equal(await page.locator('#monster-book').count(),0,'results do not unlock untimed browsing');
        if(round===0){
          await page.locator('#visit-shop').click();await page.locator('#monster-book').click();
          assert.equal(await page.locator('.monster-card.collected').count(),1,name+' has an independent collection');
          assert.equal(await page.locator('.monster-card.undiscovered').count(),3);
          assert.equal(await page.locator('[data-monster="mossling"] .monster-count').innerText(),'Battles completed: 1');
          await page.locator('[data-roar="mossling"]').click();await page.locator('#book-back').click();
          await page.locator('[data-item="copper-blade"]').click();
          assert.equal(await page.locator('.wallet strong').innerText(),'4');
          assert.equal(await page.locator('#confirm-gear').isDisabled(),true,'cannot buy before earning the price');
          await page.locator('#shop-done').click();
        }
      }
      await page.locator('#visit-shop').waitFor({state:'visible'});
      await page.clock.fastForward(60000);
      assert.equal(await page.locator('#visit-shop').isEnabled(),true,'results reading cannot consume store time');
      await page.locator('#visit-shop').click();
      const directory=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'study-evidence');fs.mkdirSync(directory,{recursive:true});
      await page.screenshot({path:path.join(directory,'390-expanded-shop.png'),fullPage:true});
      const ids=[];for(let shelf=0;shelf<4;shelf++){
        ids.push(...await page.locator('[data-item]').evaluateAll(items=>items.map(item=>item.dataset.item)));
        if(shelf<3)await page.locator('#shop-next').click();
      }
      assert.equal(new Set(ids).size,24);
      await page.locator('[data-item="sun-charm"]').click();
      assert.equal(await page.locator('#gear-preview [data-item-art="sun-charm"]').count(),1);
      await page.screenshot({path:path.join(directory,'390-expanded-shop-last-shelf.png'),fullPage:true});
      for(let shelf=0;shelf<3;shelf++)await page.locator('#shop-prev').click();
      assert.equal(Number(await page.locator('#reward-break-progress').getAttribute('max')),50000);
      assert.equal(await page.locator('.wallet strong').innerText(),'8');
      const beforeWait=Number(await page.locator('#reward-break-progress').getAttribute('value'));
      await page.locator('#monster-book').click();
      assert.equal(await page.locator('.monster-card.collected').count(),2);
      await page.screenshot({path:path.join(directory,'390-monster-book.png'),fullPage:true});
      await page.clock.fastForward(25000);
      const remaining=Number(await page.locator('#reward-break-progress').getAttribute('value'));
      assert.ok(Math.abs(remaining-(beforeWait-25000))<1500&&remaining>0,'book browsing uses the same store deadline');
      await page.locator('#book-back').click();
      await page.locator('[data-item="copper-blade"]').click();
      await page.locator('#confirm-gear').click();
      assert.equal(await page.locator('.wallet strong').innerText(),'0');
      await page.locator('#monster-book').click();
      await page.clock.fastForward(26000);
      await page.locator('[data-profile="'+name+'"]').waitFor({state:'visible'});
      await page.reload();
      const game=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-game-unit1-v1')).learners);
      assert.equal(game[name].equipped.weapon,'copper-blade','purchase survives timeout and reload');
      assert.deepEqual(Object.values(game[name].rewards).map(reward=>reward.monster).sort(),['mossling','wisp'],'collection survives store expiry and reload');
      if(name==='Luke'){
        assert.deepEqual(game.Samantha.purchases,{});
        assert.equal(game.Samantha.equipped.weapon,'starter-sword');
      }
    }
    await context.close();
  });

  test('reward countdown survives preview navigation and expires without spending', async () => {
    const context=await fastContext();await seedSavedCoins(context);const page=await context.newPage();
    // Exercise the real browser deadline. Installing a second fake clock over
    // fastContext's reading-time fixture changes timer initialization order.
    await page.goto(server.origin+'/study/');
    await page.locator('[data-profile="Luke"]').click();
    for(let i=0;i<10;i++)await answerCurrentQuestion(page);
    await page.locator('#visit-shop').click();
    const first=Number(await page.locator('#reward-break-progress').getAttribute('value'));
    assert.match(await page.locator('#reward-break-note').innerText(),/Coins and gear stay saved/);
    await page.waitForTimeout(3000);
    await page.locator('[data-item="copper-blade"]').click();await page.locator('#cancel-gear').click();
    const second=Number(await page.locator('#reward-break-progress').getAttribute('value'));
    assert.ok(second<=first-2900,'reopening the shop does not restart its allowance');
    await page.locator('[data-item="copper-blade"]').click();
    await page.locator('[data-profile="Luke"]').waitFor({state:'visible',timeout:60000});
    assert.equal(await page.locator('[data-profile="Luke"]').count(),1);
    const game=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-game-unit1-v1')).learners.Luke);
    assert.deepEqual(game.purchases,{});assert.equal(game.equipped.weapon,'starter-sword');
    assert.ok(Object.values(game.rewards).reduce((sum,r)=>sum+r.coins,0)>=10);
    const draftKey='studyhub-word-expedition-gear-draft-unit1-v1-Luke';
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).item,draftKey),'copper-blade');
    assert.match(await page.locator('#toast').innerText(),/Choice saved/);
    await page.reload();await page.locator('[data-profile="Samantha"]').click();
    assert.equal(await page.locator('#gear-preview').count(),0,'a saved choice never interrupts practice');
    assert.equal(await page.evaluate(()=>localStorage.getItem('studyhub-word-expedition-gear-draft-unit1-v1-Samantha')),null);
    await page.locator('#profile-chip').click();await page.locator('[data-profile="Luke"]').click();
    for(let i=0;i<10;i++)await answerCurrentQuestion(page);
    await page.locator('#visit-shop').click();
    assert.match(await page.locator('#gear-preview').innerText(),/Your saved choice[\s\S]*Copper Blade/);
    const beforePurchase=Number(await page.locator('.wallet strong').innerText());
    assert.ok(beforePurchase>=12,'saved coins and both rounds remain available');
    await page.locator('#cancel-gear').click();
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).item,draftKey),null);
    await page.locator('[data-item="copper-blade"]').click();await page.locator('#confirm-gear').click();
    assert.equal(Number(await page.locator('.wallet strong').innerText()),beforePurchase-8);
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).item,draftKey),null,'confirmation clears the bookmark');
    await context.close();
  });

  test('Hear word stays on one line with a full touch target at phone and desktop widths', async () => {
    const directory=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'study-evidence');fs.mkdirSync(directory,{recursive:true});
    for(const width of [320,390,1024]){
      const context=await fastContext({viewport:{width,height:844}});const page=await context.newPage();
      await page.goto(server.origin+'/study/');await page.locator('[data-profile="Luke"]').click();
      await advanceToSpelling(page);
      const size=await page.locator('#listen').evaluate(el=>{
        const range=document.createRange();range.selectNodeContents(el);
        const box=el.getBoundingClientRect();
        return {lines:range.getClientRects().length,width:box.width,height:box.height,overflow:el.scrollWidth>el.clientWidth};
      });
      assert.equal(size.lines,1);assert.equal(size.overflow,false);assert.ok(size.width>=44&&size.height>=44);
      await page.screenshot({path:path.join(directory,width+'-audio-control.png'),fullPage:true});
      await context.close();
    }
  });

  test('small keyboard viewport keeps the prompt and typing control reachable', async () => {
    const context=await fastContext({viewport:{width:390,height:420}});
    const page=await context.newPage();await page.goto(server.origin+'/study/');
    await page.locator('[data-profile="Luke"]').click();await advanceToSpelling(page);await page.locator('#answer-input').focus();
    assert.equal(await page.locator('.battle-stage').isVisible(),false);
    for(const selector of ['.q-prompt','#answer-input']){
      const box=await page.locator(selector).boundingBox();
      assert.ok(box&&box.y>=0&&box.y+box.height<=420,selector+' stays above the simulated keyboard');
    }
    await context.close();
  });

  test('blocked device storage remains playable and never reports a false saved status', async () => {
    const context=await fastContext();
    await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};});
    const page=await context.newPage();await page.goto(server.origin+'/study/');
    await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('#save-warning').isVisible(),true);
    assert.match(await page.locator('#save-warning').innerText(),/not saving/);
    for(let i=0;i<10;i++)await answerCurrentQuestion(page);
    assert.equal(await page.locator('.game-summary').count(),1,'storage failure does not block practice');
    await page.locator('#summary-done').click();
    assert.equal(await page.locator('#cloud-status').innerText(),'Device save unavailable');
    assert.equal(await page.locator('#save-warning').isVisible(),true);
    await context.close();
  });

  test('a damaged device-link fragment cannot prevent local practice', async () => {
    const page=await browser.newPage();const errors=watchForErrors(page);
    await page.goto(server.origin+'/study/#k=%E0%A4%A');
    await page.locator('[data-profile="Luke"]').click();
    assert.equal(await page.locator('.question-card').count(),1);assert.deepEqual(errors,[]);
    await page.close();
  });

  test('records rendered evidence and opens the final adventure without perfect mastery', async () => {
    const directory=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'study-evidence');
    fs.mkdirSync(directory,{recursive:true});
    for(const width of [320,390,1024]){
      const context=await fastContext({viewport:{width,height:844},reducedMotion:'reduce'});
      await context.addInitScript(()=>{
        localStorage.setItem('studyhub-word-expedition-game-unit1-v1',JSON.stringify({version:1,learners:{Luke:{sessionsCompleted:11,rewards:{seed:{xp:220,coins:88}}}}}));
      });
      const page=await context.newPage();await page.goto(server.origin+'/study/');
      async function capture(screen){
        const sizes=await page.evaluate(()=>({content:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
        assert.ok(sizes.content<=sizes.viewport+2,screen+' has no horizontal overflow');
        await page.screenshot({path:path.join(directory,width+'-'+screen+'.png'),fullPage:true});
      }
      await capture('home');await page.locator('[data-profile="Luke"]').click();
      assert.match(await page.locator('.enemy-name').innerText(),/^The Word Keeper$/i);
      assert.equal(await page.locator('.question-count').innerText(),'1 / 10');
      await capture('boss-question');
      for(let i=0;i<10;i++)await answerCurrentQuestion(page);
      assert.match(await page.locator('.game-summary h2').innerText(),/castle is yours/);
      assert.match(await page.locator('.victory-lockup').innerText(),/words that still need a mastery seal/);
      await capture('boss-complete');await page.locator('#visit-shop').click();await capture('shop');
      if(width<=390){
        const done=await page.locator('#shop-done').boundingBox();
        assert.ok(done.y+done.height<=844,'all six items and Done fit on the '+width+'px phone');
      }
      assert.equal(await page.locator('#toast').isVisible(),false,'audio errors from the finished question do not cover reward controls');
      await page.locator('[data-item="guardian-mail"]').click();await capture('armor-preview');
      if(width<=390){
        const done=await page.locator('#shop-done').boundingBox();
        assert.ok(done.y+done.height<=844,'preview, all six items and Done fit on the '+width+'px phone');
      }
      await page.locator('#cancel-gear').click();await page.locator('#shop-done').click();
      const entry=await page.evaluate(()=>JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')).learners.Luke.sessions[0]);
      fs.writeFileSync(path.join(directory,width+'-simulated-timing.json'),JSON.stringify({evidence:'Automated interaction with simulated reading; not a child playtest',...entry.timing},null,2));
      await page.goto(server.origin+'/tests/fixtures/study-art-gallery.html');await capture('equipment-gallery');
      await context.close();
    }
  });
});
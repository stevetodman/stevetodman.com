import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const read = p => fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
function model(audio) {
  const storage=new Map();
  const context={window:{AudioContext:audio},document:{getElementById:()=>({})},location:{protocol:'http:',hostname:'localhost'},performance:{now:()=>0},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>0,clearTimeout:()=>{}};
  vm.runInNewContext(read('study/unit-1/game-art.js'),context);
  vm.runInNewContext(read('study/unit-1/quality-core.js'),context);
  const source=read('study/unit-1/app.js');
  vm.runInNewContext(source.slice(0,source.indexOf("  chip.setAttribute('aria-label'"))+`
    window.test={sanitizeGameProfile,applyCloudGame,gameProfile,gameXp,coinBalance,makeQuestion,isAccepted,WORDS,savedRound,savedGearChoice,recordResult,
      playWeaponSound,sessionCoinAward,monsterCounts,questionPromptHTML,monsterTauntHTML,journeySentence,practiceSuggestions,roundReviewHTML,meaningTypo,cloudToken,
      setSession:(value)=>{session=value;activeName='Luke';},stats:()=>profile('Luke').stats};
  })();`,context);
  return {...context.window.test,storage,quality:context.window.WordExpeditionQuality};
}
const rewards=(start,count)=>Object.fromEntries(Array.from({length:count},(_,i)=>['session-'+(start+i),{xp:20,coins:8}]));

test('lifetime XP and coins survive 1000 sessions and normalization',()=>{
  const m=model(),clean=m.sanitizeGameProfile({rewards:rewards(0,1000)});
  assert.equal(Object.keys(clean.rewards).length,1000);
  assert.equal(Object.values(clean.rewards).reduce((s,r)=>s+r.xp,0),20000);
  assert.equal(clean.sessionsCompleted,1000);
  assert.deepEqual(JSON.parse(JSON.stringify(m.sanitizeGameProfile(clean))),JSON.parse(JSON.stringify(clean)));
});
test('cloud union keeps disjoint sessions and never lowers a duplicate reward',()=>{
  const m=model();
  m.applyCloudGame('Luke',{rewards:rewards(0,100)});
  m.applyCloudGame('Luke',{rewards:{...rewards(100,100),'session-0':{xp:1,coins:1}}});
  assert.equal(m.gameXp('Luke'),4000);assert.equal(m.coinBalance('Luke'),1600);
  assert.equal(m.gameProfile('Luke').sessionsCompleted,200);
  m.applyCloudGame('Luke',{rewards:rewards(0,200)});
  assert.equal(m.gameXp('Luke'),4000);assert.equal(m.gameXp('Samantha'),0);
  m.applyCloudGame('Luke',{rewards:{'session-0':{xp:20,coins:8,monster:'mossling'},'session-1':{xp:20,coins:8,monster:'mossling'}}});
  m.applyCloudGame('Luke',{rewards:{'session-0':{xp:1,coins:1}}});
  assert.equal(m.monsterCounts('Luke').mossling,2,'repeat battles count once each despite stale cloud writes');
  assert.equal(m.monsterCounts('Samantha').mossling,0);
  assert.match(m.journeySentence('Luke'),/one final adventure/);
  assert.match(m.journeySentence('Samantha'),/Adventure 1 of 12/);
});
test('legacy totals survive normalization and unsafe reward keys are ignored',()=>{
  const m=model();
  const clean=m.sanitizeGameProfile(JSON.parse('{"rewards":{"_legacy":{"xp":5000,"coins":1200},"__proto__":{"xp":100}}}'));
  assert.equal(clean.rewards._legacy.xp,5000);assert.equal(Object.keys(clean.rewards).length,1);
  m.applyCloudGame('Luke',{bossDefeatedAt:'2026-08-28T12:00:00Z',rewards:{old:{xp:20,coins:8},bad:{monster:'unknown'}}});
  assert.equal(m.monsterCounts('Luke').boss,1,'explicit historical boss victory stays collected');
  assert.match(m.journeySentence('Luke'),/^Castle reached!/);
  assert.equal(m.monsterCounts('Luke').mossling,0,'do not invent monsters for old unclassified battles');
});
test('server merge retains >160 entries and is commutative for reward values',()=>{
  const source=read('study/supabase/functions/studyhub-save/index.ts');
  const code=stripTypeScriptTypes(source.slice(source.indexOf('function isObj'),source.indexOf('function mergeProfile')));
  const context={};vm.runInNewContext(code+';this.merge=mergeGame;',context);
  const a={rewards:rewards(0,150)},b={rewards:rewards(100,150)};
  const ab=context.merge(a,b),ba=context.merge(b,a);
  assert.equal(Object.keys(ab.rewards).length,250);assert.equal(ab.sessionsCompleted,250);
  for(const id of Object.keys(ab.rewards))assert.deepEqual({...ab.rewards[id]},{...ba.rewards[id]});
  assert.equal(context.merge(ab,ab).sessionsCompleted,250);
  assert.equal(context.merge({rewards:{_legacy:{xp:5000,coins:2000}}},{}).rewards._legacy.xp,5000);
  const collected={rewards:{battle:{xp:20,coins:4,monster:'wisp'}}},stale={rewards:{battle:{xp:1,coins:1}}};
  assert.deepEqual({...context.merge(collected,stale).rewards.battle},{xp:20,coins:4,monster:'wisp'});
  assert.deepEqual({...context.merge(stale,collected).rewards.battle},{xp:20,coins:4,monster:'wisp'});
});
test('cloud saves reject unprovisioned tokens and oversized writes without losing existing data',async()=>{
  let row=null,handler,writes=0;
  const sql=async(strings,...values)=>{
    const query=strings.join('?');
    if(/select data, revision/.test(query))return row?[row]:[];
    assert.match(query,/update studyhub\.saves/,'public handler must never insert a save');
    writes++;row={data:values[0],revision:row.revision+1};return [row];
  };
  sql.begin=fn=>fn(sql);sql.json=value=>value;
  const source=read('study/supabase/functions/studyhub-save/index.ts');
  vm.runInNewContext(stripTypeScriptTypes(source.slice(source.indexOf('const MAX_BODY_BYTES'))),{
    sql,Request,Response,TextEncoder,TextDecoder,crypto,console,Deno:{serve:fn=>{handler=fn;}}
  });
  const request=body=>handler(new Request('https://example.test',{method:'POST',body:typeof body==='string'?body:JSON.stringify(body)}));
  const token='synthetic-unit-token-not-a-family';
  assert.equal((await request({token,action:'push',data:{}})).status,403);assert.equal(writes,0);
  assert.equal((await request('null')).status,400);
  assert.equal((await request({token,padding:'é'.repeat(140000)})).status,413,'limit is bytes, not characters');
  row={data:{Luke:{stateStats:{old:{correct:2}}}},revision:1};
  assert.equal((await request({token,action:'push',data:{Luke:{stateStats:{new:{correct:1}}}}})).status,200);
  assert.equal(row.data.Luke.stateStats.old.correct,2);assert.equal(row.data.Luke.stateStats.new.correct,1);
  const pull=await (await request({token,action:'pull'})).json();assert.equal(pull.revision,2);
  row.data.Luke.padding='x'.repeat(1024*1024);const before=JSON.stringify(row);
  assert.equal((await request({token,action:'push',data:{}})).status,413);
  assert.equal(JSON.stringify(row),before,'capacity rejection must leave the previous save intact');
});
test('every teacher-listed relation is accepted in ordinary and correction grading',()=>{
  const m=model();
  for(const word of m.WORDS)for(const domain of ['synonym','antonym']){
    const list=word[domain==='synonym'?'synonyms':'antonyms'];if(!list.length)continue;
    const q=m.makeQuestion({word,domain},0,true);
    for(const answer of list)assert.equal(m.isAccepted(q,answer.toUpperCase()),true,word.word+':'+answer);
  }
  for(const word of m.WORDS){
    const practice=m.makeQuestion({word,domain:'definition'},1,false);
    for(const enemy of ['mossling','wisp','sentinel','boss'])assert.ok(m.questionPromptHTML(practice,enemy).includes('<span class="target">'+word.word+'</span>'),enemy+': '+word.word);
    for(const q of [m.makeQuestion({word,domain:'spelling'},1,false),m.makeQuestion({word,domain:'definition'},0,false),m.makeQuestion({word,domain:'definition'},9,false),m.makeQuestion({word,domain:'definition'},1,true)])assert.doesNotMatch(m.questionPromptHTML(q,'boss'),/monster-dialogue/);
  }
  const word=m.WORDS[0],practice=m.makeQuestion({word,domain:'synonym'},1,false);
  assert.equal(m.practiceSuggestions('Luke').length,0,'new learners do not get an arbitrary first-three-word list');
  const continuous=m.WORDS.find(w=>w.word==='continuous');
  const meaning=m.makeQuestion({word:continuous,domain:'definition'},0,true);
  assert.equal(m.meaningTypo(meaning,'continuos'),true);
  assert.equal(m.meaningTypo(meaning,'continuouss'),true);
  assert.equal(m.meaningTypo(meaning,'cancel'),false);
  assert.equal(m.meaningTypo(m.makeQuestion({word:continuous,domain:'spelling'},0,true),'continuos'),false);
  assert.equal(m.meaningTypo(m.makeQuestion({word:m.WORDS.find(w=>w.word==='myth'),domain:'definition'},0,true),'math'),false);
  m.setSession({id:'recent-miss',index:0,results:[]});m.recordResult(meaning,false,false);
  assert.equal(m.practiceSuggestions('Luke')[0].word,'continuous');
  assert.equal(m.practiceSuggestions('Luke')[0].domain,'definition');
  assert.equal(m.practiceSuggestions('Samantha').length,0);
  m.setSession({id:'recalled',index:0,results:[]});m.recordResult(meaning,true,false);
  assert.notEqual(m.practiceSuggestions('Luke')[0].domain,'definition','a successful recall clears the urgent miss');
  assert.match(m.roundReviewHTML([{word:'continuous',domain:'spelling',correct:false}]),/continuous — spelling/);
  assert.equal(m.cloudToken(true),null,'fresh devices do not mint unprovisioned family credentials');
  m.setSession({id:'story',index:0,enemy:'mossling',results:[]});m.recordResult(practice,true,false);
  assert.equal(m.stats()['blunder|synonym'].correct,1);assert.equal(m.stats()['blunder|synonym'].correctDays.length,0,'context clues do not earn mastery days');
  m.setSession({id:'recall',index:0,enemy:'mossling',results:[]});m.recordResult(m.makeQuestion({word,domain:'synonym'},0,true),true,false);
  assert.equal(m.stats()['blunder|synonym'].correctDays.length,1,'ordinary recall still earns mastery');
  const spelling=m.makeQuestion({word,domain:'spelling'},1,false);
  assert.equal(m.monsterTauntHTML(spelling),'','no taunt can reveal a word before an attempt');
  m.setSession({id:'miss',index:0,enemy:'mossling',results:[{correct:false}]});
  assert.match(m.monsterTauntHTML(spelling),/soggy turnip/);assert.ok(m.monsterTauntHTML(spelling).includes('<span class="target">blunder</span>'));
  assert.match(read('study/unit-1/app.js'),/if\(!isAccepted\(q,input.value\)\)/);
});
test('round recovery keeps question order and rejects malformed data without clearing storage',()=>{
  const m=model(),word=m.WORDS[0];
  const raw={version:1,id:'round-1',index:3,questions:Array.from({length:10},(_,i)=>m.makeQuestion({word,domain:'synonym'},i,false)),results:[{},{},{}],strengthened:['blunder'],battleDamage:3,draftValue:'goof'};
  m.storage.set('studyhub-word-expedition-round-unit1-v1-Luke',JSON.stringify(raw));
  const restored=m.savedRound('Luke');assert.equal(restored.index,3);assert.equal(restored.draftValue,'goof');
  assert.deepEqual([...restored.questions[1].choices],[...raw.questions[1].choices]);
  assert.equal(m.savedRound('Samantha'),null);
  m.storage.set('studyhub-word-expedition-round-unit1-v1-Luke','{"version":1}');
  assert.equal(m.savedRound('Luke'),null);assert.equal(m.storage.size,1);
});
test('active time counts learning/play once, excludes hidden/idle, and uses L/9',()=>{
  const m=model();let now=0;const clock=m.quality.createClock(()=>now);
  now=5000;clock.mode('learning');now=15000;clock.activity();now=20000;clock.visibility(false);
  now=80000;clock.visibility(true);now=90000;clock.mode('play');now=100000;
  const t=clock.snapshot();assert.equal(t.learning,25000);assert.equal(t.play,15000);assert.equal(t.idle,60000);
  assert.equal(m.quality.playBudget({learning:240000,play:0}),240000/9);
  assert.equal(m.quality.playBudget({learning:240000,play:30000}),0);
  now=200000;const idle=clock.snapshot();assert.equal(idle.play,25000);assert.equal(idle.idle,150000);
});

test('paid currency, real-money checkout and payment integrations are absent',()=>{
  const source=read('study/unit-1/app.js');
  assert.match(source,/Study coins only\. No real money/);
  assert.doesNotMatch(source,/stripe|paypal|paymentRequest|buyCurrency|buyCoins|billing|subscription/i);
  assert.match(source,/function previewGear/);assert.match(source,/if\(coinBalance\(activeName\)<item.price\)return/);
});

test('unconfirmed gear choices are validated and isolated by learner',()=>{
  const m=model(),key='studyhub-word-expedition-gear-draft-unit1-v1-';
  m.storage.set(key+'Luke',JSON.stringify({version:1,item:'copper-blade'}));
  assert.equal(m.savedGearChoice('Luke'),'copper-blade');
  assert.equal(m.savedGearChoice('Samantha'),null);
  assert.equal(m.coinBalance('Luke'),0);assert.deepEqual({...m.gameProfile('Luke').purchases},{});
  for(const value of ['{',JSON.stringify({version:2,item:'copper-blade'}),JSON.stringify({version:1,item:'constructor'}),JSON.stringify({version:1,item:null})]){
    m.storage.set(key+'Luke',value);assert.equal(m.savedGearChoice('Luke'),null);
  }
});


test('unavailable or blocked weapon audio never interrupts learning',()=>{
  assert.doesNotThrow(()=>model().playWeaponSound('star-wand'));
  assert.doesNotThrow(()=>model(function(){throw new Error('Audio blocked');}).playWeaponSound('moon-blade'));
  const source=read('study/unit-1/app.js');
  assert.match(source,/playWeaponSound\(gameProfile\(activeName\)\.equipped\.weapon\)/);
});


test('coins require sustained practice and new mastery without changing historical wallets',()=>{
  const m=model();
  assert.equal(m.sessionCoinAward(0,0,false),2);
  assert.equal(m.sessionCoinAward(4,0,false),3);
  assert.equal(m.sessionCoinAward(10,0,false),4);
  assert.equal(m.sessionCoinAward(10,1,true),15);
  m.applyCloudGame('Luke',{rewards:{old:{xp:20,coins:8}}});
  assert.equal(m.coinBalance('Luke'),8);
});

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
      playWeaponSound,sessionCoinAward,
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
});
test('legacy totals survive normalization and unsafe reward keys are ignored',()=>{
  const m=model();
  const clean=m.sanitizeGameProfile(JSON.parse('{"rewards":{"_legacy":{"xp":5000,"coins":1200},"__proto__":{"xp":100}}}'));
  assert.equal(clean.rewards._legacy.xp,5000);assert.equal(Object.keys(clean.rewards).length,1);
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
});
test('every teacher-listed relation is accepted in ordinary and correction grading',()=>{
  const m=model();
  for(const word of m.WORDS)for(const domain of ['synonym','antonym']){
    const list=word[domain==='synonym'?'synonyms':'antonyms'];if(!list.length)continue;
    const q=m.makeQuestion({word,domain},0,true);
    for(const answer of list)assert.equal(m.isAccepted(q,answer.toUpperCase()),true,word.word+':'+answer);
  }
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

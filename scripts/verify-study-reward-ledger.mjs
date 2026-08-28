import assert from 'node:assert/strict';

// Public synthetic canary only. Never use a real family's credential or profile.
const url=process.env.STUDY_CLOUD_URL||'https://lpjvsjezjjasgpkvjjlq.supabase.co/functions/v1/studyhub-save';
const token='studyhub-public-canary-v1-20260826-stable-token';
const profile='synthetic-reward-ledger-v1';
const rewards=(start,end)=>Object.fromEntries(Array.from({length:end-start},(_,i)=>['ledger-'+(start+i),{xp:20,coins:8}]));
async function request(body){
  const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,...body}),signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,'synthetic ledger request must succeed');
  return response.json();
}
await request({action:'push',data:{[profile]:{game:{version:1,rewards:{...rewards(0,175),_legacy:{xp:5000,coins:2000}}}}}});
await request({action:'push',data:{[profile]:{game:{version:1,rewards:{...rewards(125,250),'ledger-0':{xp:1,coins:1},_legacy:{xp:1,coins:1}}}}}});
const result=await request({action:'pull'});
const game=result.data?.[profile]?.game;
assert.ok(game,'synthetic ledger must round-trip');
assert.equal(Object.keys(game.rewards).length,251,'all 250 sessions and legacy totals survive');
assert.equal(game.sessionsCompleted,250);
assert.equal(game.rewards._legacy.xp,5000);assert.equal(game.rewards._legacy.coins,2000);
for(let i=0;i<250;i++)assert.deepEqual(game.rewards['ledger-'+i],{xp:20,coins:8},'duplicate/stale writes cannot lower rewards');
console.log('Study reward ledger canary passed: 250 sessions, legacy totals, stale-write merge and pull. Synthetic data only.');

'use strict';

function readRanking(prefix){const ranking={};for(const id of state.patientOrder)ranking[id]=Number($(`${prefix}-${id}`).value)||0;return ranking;}
function validRanking(ranking){const values=Object.values(ranking);return values.every(v=>v>=1&&v<=4)&&new Set(values).size===4;}
function startSimulation(){
  const ranking=readRanking('initial-rank');if(!validRanking(ranking)){$('rankingError').textContent='Use each rank from 1 through 4 exactly once.';return;}
  state.mode=document.querySelector('input[name="runMode"]:checked')?.value||'assessment';state.initialRanking=ranking;state.started=true;state.running=true;state.time=0;
  for(const p of Object.values(state.patients))p.observedVitals.push({time:0,source:'Pre-shift charted vital signs',...clone(p.initial)});
  addTimeline(`Initial ranking committed: ${state.patientOrder.map(id=>`${state.patients[id].name} ${ranking[id]}`).join(', ')}.`);addTimeline(`Run started in ${state.mode} mode.`);$('intro').classList.add('hidden');$('rankingError').textContent='';renderAll();
}
function togglePause(){if(!state.started||state.ended)return;state.running=!state.running;if(!state.running)state.pauseCount+=1;addTimeline(state.running?'Scenario resumed.':`Scenario paused in ${state.mode} mode.`);renderAll();}
function openFinal(){if(!state.started||state.ended)return;state.running=false;$('finalModal').classList.remove('hidden');renderAll();}
function completeFinal(){
  const ranking=readRanking('final-rank');if(!validRanking(ranking)){$('finalError').textContent='Use each rank from 1 through 4 exactly once.';return;}
  const handoffs={};let complete=true;for(const id of state.patientOrder){handoffs[id]={};for(const key of ['illness','summary','actions','pending','contingency']){const value=$(`handoff-${id}-${key}`).value.trim();handoffs[id][key]=value;if(value.length<8)complete=false;}}
  if(!complete){$('finalError').textContent='Complete all five I-PASS elements for every patient.';return;}
  state.finalRanking=ranking;state.handoffs=handoffs;state.running=false;state.ended=true;state.endReason='Shift completed with receiver-facing handoff.';addTimeline('Final acuity ranking and I-PASS handoff completed.');$('finalModal').classList.add('hidden');$('finalError').textContent='';showDebrief();
}
function switchTab(tab){document.querySelectorAll('[role="tab"]').forEach(btn=>{const active=btn.dataset.tab===tab;btn.setAttribute('aria-selected',String(active));});document.querySelectorAll('.tab-panel').forEach(panel=>{const active=panel.id===`panel-${tab}`;panel.hidden=!active;panel.classList.toggle('active',active);});}

$('startBtn').onclick=startSimulation;$('pauseBtn').onclick=togglePause;$('resetBtn').onclick=()=>resetSimulation(state?.variantIndex||0);$('endBtn').onclick=openFinal;$('cancelEndBtn').onclick=()=>{$('finalModal').classList.add('hidden');state.running=true;renderAll();};$('completeShiftBtn').onclick=completeFinal;
$('askHistoryBtn').onclick=askHistory;$('repeatVitalsBtn').onclick=repeatVitals;$('commitReasoningBtn').onclick=commitReasoning;$('sendTeamBtn').onclick=sendTeamMessage;$('confirmReadbackBtn').onclick=confirmReadback;$('commitNoraJudgmentBtn').onclick=commitNoraJudgment;
$('confidence').oninput=e=>$('confidenceValue').textContent=`${e.target.value}%`;$('orderSearch').oninput=()=>{if(state.selectedId)renderOrders();applyInteractionGate();};document.querySelectorAll('[role="tab"]').forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab));
$('variantBtn').onclick=()=>resetSimulation((state.variantIndex+1)%PHS_DATA.variants.length);$('restartBtn').onclick=()=>resetSimulation(state.variantIndex);
window.__PHS_TEST__={getState:()=>state,startWithRanking:(mode='assessment')=>{state.mode=mode;state.initialRanking={maya:1,eli:2,nora:3,jamal:4};state.started=true;state.running=true;for(const p of Object.values(state.patients))p.observedVitals.push({time:0,source:'Test baseline',...clone(p.initial)});$('intro').classList.add('hidden');renderAll();},advance:seconds=>{advanceScenario(seconds,false);renderAll();},select:id=>{state.selectedId=id;renderAll();},order:id=>placeOrder(id),exam:id=>performExam(id),pause:()=>togglePause()};
resetSimulation(0);

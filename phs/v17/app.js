'use strict';

async function loadAuditRemediation(){
  if(window.__PHS_AUDIT_REMEDIATION_LOADED__)return;
  const modules=['integrity-base.js','integrity-engine.js','integrity-ui.js','integrity-assessment.js'];
  for(const module of modules){
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=`v17/${module}?v=18`;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`PHS v1.8 module failed to load: ${module}`));
      document.head.appendChild(script);
    });
  }
  window.__PHS_AUDIT_REMEDIATION_LOADED__=true;
}

async function init(){
  try{
    await loadAuditRemediation();
    const caseData=await loadCase();
    state=createState(caseData,chooseInitialVariant(caseData),'assessment');
    timerId=setInterval(realTimeTick,250);
    bindEvents();renderAll();showPrebrief();
  }catch(error){
    console.error(error);document.body.innerHTML=`<main class="panel" style="margin:2rem"><h1>Simulator failed to load</h1><p>${esc(error.message)}</p></main>`;
  }
}

function bindEvents(){
  $('startBtn').onclick=()=>{const ranking=readRanking('initial');if(!validRanking(ranking)){$('prebriefError').textContent='Use each rank from 1 through 4 exactly once.';return;}const mode=document.querySelector('input[name=mode]:checked').value;startShift(ranking,mode);};
  $('pauseBtn').onclick=togglePause;
  $('resetBtn').onclick=()=>resetSimulation(state.caseData,state.variant.id,state.mode);
  $('endBtn').onclick=openEndShift;
  $('cancelEndBtn').onclick=()=>{if(state.flags.handoffForced)return;$('endModal').classList.add('hidden');state.running=true;renderAll();};
  $('completeBtn').onclick=()=>{const ranking=readRanking('final'),handoffs=readHandoffs();if(!validRanking(ranking)){$('endError').textContent='Use each final rank from 1 through 4 exactly once.';return;}completeShift(ranking,handoffs);};
  $('askBtn').onclick=()=>{askHistory($('historyInput').value,$('historySource').value);$('historyInput').value='';};
  $('historyInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('askBtn').click();}};
  $('repeatVitalsBtn').onclick=repeatVitals;
  $('confidenceInput').oninput=e=>$('confidenceLabel').textContent=`${e.target.value}%`;
  $('commitBtn').onclick=()=>{const ok=commitReasoning({problem:$('problemInput').value.trim(),diagnosis:$('diagnosisSelect').value,alternatives:$('alternativesInput').value.trim(),plan:$('planInput').value.trim(),confidence:Number($('confidenceInput').value)});if(ok){$('problemInput').value='';$('alternativesInput').value='';$('planInput').value='';}};
  $('orderSearch').oninput=renderOrders;
  $('sendTeamBtn').onclick=()=>{sendTeamMessage(state.teamRole,$('teamMessage').value);$('teamMessage').value='';};
  $('readbackBtn').onclick=confirmReadback;
  document.querySelectorAll('.tabs [role=tab]').forEach(btn=>btn.onclick=()=>{state.activeTab=btn.dataset.tab;renderTabs();});
  $('nextAttemptBtn').onclick=nextAttempt;
  $('repeatBtn').onclick=repeatCurrent;
  $('clearHistoryBtn').onclick=()=>{learnerRecord=clearLearnerRecord();renderAttemptHistory();};
}

document.addEventListener('DOMContentLoaded',init);

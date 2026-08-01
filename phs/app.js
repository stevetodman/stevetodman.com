'use strict';

$('startBtn').addEventListener('click',startShift);
$('pauseBtn').addEventListener('click',()=>{if(!state.started||state.ended)return;state.running=!state.running;renderDynamic();});
$('resetBtn').addEventListener('click',()=>resetSimulation(state.variantIndex));
$('endBtn').addEventListener('click',openEndShift);
$('askHistoryBtn').addEventListener('click',askHistory);
$('historyInput').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();askHistory();}});
$('commitReasoningBtn').addEventListener('click',commitReasoning);
$('confidence').addEventListener('input',()=>{$('confidenceValue').textContent=`${$('confidence').value}%`;});
$('orderSearch').addEventListener('input',searchOrders);
$('sendTeamBtn').addEventListener('click',sendTeamMessage);
$('confirmReadbackBtn').addEventListener('click',confirmReadback);
$('completeShiftBtn').addEventListener('click',completeShift);
$('cancelEndBtn').addEventListener('click',cancelEnd);
$('variantBtn').addEventListener('click',()=>resetSimulation((state.variantIndex+1)%VARIANTS.length));
$('restartBtn').addEventListener('click',()=>resetSimulation(state.variantIndex));
document.querySelectorAll('[role="tab"]').forEach(button=>button.addEventListener('click',()=>activateTab(button.dataset.tab)));

resetSimulation(0);
window.__PHS_READY__=true;

'use strict';

function renderAll(){
  renderDynamic();renderBoard();renderWorkspace();renderPages();renderResults();renderAttention();renderTimeline();renderStaff();
}

function renderDynamic(){
  $('clock').textContent=fmtTime(state.time);
  $('runState').textContent=state.ended?'Complete':state.running?'Running':state.started?'Paused':'Not started';
  $('pauseBtn').textContent=state.running?'Pause':'Resume';
  if(state.started&&state.selectedId){renderVitals();renderTrajectory();renderPlacedOrders();}
  renderPages();renderResults();renderStaff();
}

function renderSignoutAndRankings(){
  $('signoutCards').innerHTML=state.patientOrder.map(id=>`<article class="signout-card"><h3>${esc(state.patients[id].name)} · ${esc(state.patients[id].room)}</h3><p>${esc(state.patients[id].signout)}</p></article>`).join('');
  renderRankingGrid('initialRanking');
}

function renderRankingGrid(containerId){
  $(containerId).innerHTML=state.patientOrder.map(id=>`<div class="rank-item"><label for="${containerId}-${id}">${esc(state.patients[id].name)}</label><select id="${containerId}-${id}" data-rank-patient="${id}"><option value="">Select</option>${[1,2,3,4].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></div>`).join('');
}

function renderFinalRanking(){renderRankingGrid('finalRanking');$('handoffText').value=state.handoff||'';}

function readRanking(containerId){
  const values={};const used=[];
  for(const id of state.patientOrder){const el=$(`${containerId}-${id}`);const value=Number(el?.value);if(!value)return null;values[id]=value;used.push(value);}
  if(new Set(used).size!==4) return null;
  return values;
}

function renderBoard(){
  $('boardInstruction').textContent=state.started?'Select a patient. Direct attention, delegated work, and background processes all affect the timeline.':'Commit an initial acuity ranking before the clinical workspace unlocks.';
  $('patientBoard').innerHTML=state.patientOrder.map(id=>{
    const p=state.patients[id];const open=state.pages.some(page=>page.patientId===id&&!page.ack);
    return `<button class="patient-card ${state.selectedId===id?'active':''}" data-patient="${id}" ${!state.started||state.ended?'disabled':''}>${open?'<span class="page-dot" aria-label="Open page"></span>':''}<b>${esc(p.name)}</b><span>${esc(p.age)} · ${esc(p.room)}</span><span>${esc(p.chief)}</span><span>${p.reviewed?'Reviewed':'Not yet reviewed'}</span></button>`;
  }).join('');
  document.querySelectorAll('[data-patient]').forEach(button=>button.addEventListener('click',()=>selectPatient(button.dataset.patient)));
  const openCount=state.pages.filter(x=>!x.ack).length;$('openPagesBadge').textContent=`${openCount} open page${openCount===1?'':'s'}`;
}

function renderWorkspace(){
  const patientId=state.selectedId;
  $('patientWorkspace').classList.toggle('muted-workspace',!patientId);
  const controls=['askHistoryBtn','commitReasoningBtn','sendTeamBtn'];
  for(const id of controls) $(id).disabled=!patientId||state.ended;
  if(!patientId){
    $('patientTitle').textContent='No patient selected';$('patientSubtitle').textContent='Select a patient after committing your initial ranking.';$('patientState').textContent='Unreviewed';$('vitals').innerHTML='';$('trajectory').textContent='No trajectory available.';
    $('historyTranscript').innerHTML='<p class="placeholder">No patient selected.</p>';$('examMenu').innerHTML='';$('examFindings').innerHTML='<p class="placeholder">No examination findings yet.</p>';$('diagnosisChoice').innerHTML='<option value="">Select a patient first</option>';$('orderResults').innerHTML='<p class="placeholder">Select a patient first.</p>';$('placedOrders').innerHTML='<p class="placeholder">No orders placed.</p>';$('teamRoles').innerHTML='';$('delegationMenu').innerHTML='';return;
  }
  const p=state.patients[patientId];
  $('patientTitle').textContent=`${p.name} — ${p.room}`;$('patientSubtitle').textContent=`${p.age} · ${p.chief}`;
  $('patientState').textContent=patientStatusText(patientId);
  renderVitals();renderTrajectory();renderHistory();renderExam();renderReasoning();renderOrderSearch();renderPlacedOrders();renderTeam();
}

function patientStatusText(patientId){
  const p=state.patients[patientId];
  if(patientId==='maya'){if(p.flags.arrest)return'Cardiac arrest';if(p.flags.critical)return'Critical';if(p.flags.responding)return'Responding';if(p.flags.worsened)return'Deteriorating';return'Concerning';}
  if(patientId==='eli') return Number(p.vitals.SpO2)<88?'Deteriorating':p.flags.oxygenStarted?'Improving':'Needs review';
  if(patientId==='nora') return p.flags.worsened?'Deteriorating':state.flags.noraCulturePositive?'Positive culture':'Needs review';
  return p.flags.discharged?'Discharged':'Stable';
}

function renderVitals(){
  const p=state.patients[state.selectedId];if(!p)return;
  const values=[['HR',Math.round(Number(p.vitals.HR))],['RR',Math.round(Number(p.vitals.RR))],['SpO₂',`${Math.round(Number(p.vitals.SpO2))}%`],['BP',p.vitals.BP],['Temp',`${Number(p.vitals.Temp).toFixed(1)} °C`],['Lactate',Number(p.vitals.Lactate).toFixed(1)]];
  $('vitals').innerHTML=values.map(([k,v])=>`<div><small>${k}</small><strong>${esc(v)}</strong></div>`).join('');
}

function renderTrajectory(){
  const id=state.selectedId;const p=state.patients[id];if(!p)return;
  let text='No response trend has been established.';
  if(id==='maya'){
    if(p.flags.arrest) text='Profound collapse after untreated progressive systemic hypoperfusion.';
    else if(p.flags.responding) text=`Perfusion is improving after therapy, but residual lactate is ${Number(p.vitals.Lactate).toFixed(1)} mmol/L.`;
    else if(p.flags.worsened) text=`Tachycardia, hypotension, and lactate ${Number(p.vitals.Lactate).toFixed(1)} mmol/L indicate worsening systemic perfusion.`;
    else text='The inherited feeding explanation has not yet accounted for all available physiology.';
  }else if(id==='eli') text=p.flags.oxygenStarted||p.flags.suctioned?'Respiratory support is producing partial improvement.':'Oxygenation and work of breathing require serial reassessment.';
  else if(id==='nora') text=state.flags.noraCulturePositive?'A positive culture has changed the risk profile; reassessment and treatment decisions are time-sensitive.':'Current appearance is reassuring, but cultures and age keep risk unresolved.';
  else text='Current physiology is stable; history and red flags determine the appropriate scope of workup.';
  $('trajectory').textContent=text;
}

function renderHistory(){
  const p=state.patients[state.selectedId];if(!p)return;
  $('historyTranscript').innerHTML=p.historyLog.length?p.historyLog.map(turn=>`<div class="turn"><small>${fmtTime(turn.time)} · ${esc(turn.source)}</small><p><b>You:</b> ${esc(turn.question)}</p><p><b>Response:</b> ${esc(turn.answer)}</p></div>`).join(''):'<p class="placeholder">No questions asked for this patient.</p>';
}

function renderExam(){
  const p=state.patients[state.selectedId];if(!p)return;
  $('examMenu').innerHTML=p.exams.map(item=>`<button type="button" data-exam="${item.id}" ${state.ended?'disabled':''}><b>${esc(item.label)}</b><small>Attention ${fmtTime(item.cost)}${p.examCounts[item.id]?` · performed ${p.examCounts[item.id]}×`:''}</small></button>`).join('');
  document.querySelectorAll('[data-exam]').forEach(button=>button.addEventListener('click',()=>performExam(button.dataset.exam)));
  $('examFindings').innerHTML=p.examLog.length?p.examLog.map(item=>`<div class="finding"><small>${fmtTime(item.time)}${item.delegated?' · delegated':''}</small><p>${esc(item.finding)}</p></div>`).join(''):'<p class="placeholder">No examination findings documented.</p>';
}

function renderReasoning(){
  const p=state.patients[state.selectedId];if(!p)return;
  const current=$('diagnosisChoice').value;
  $('diagnosisChoice').innerHTML=`<option value="">Select a leading diagnosis</option>${p.diagnosisChoices.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}`;
  if(p.diagnosisChoices.includes(current)) $('diagnosisChoice').value=current;
  $('reasoningHistory').innerHTML=p.reasoning.length?p.reasoning.map(c=>`<div class="commit"><small>${fmtTime(c.time)} · confidence ${c.confidence}%</small><p><b>${esc(c.diagnosis)}</b></p><p>${esc(c.representation)}</p><p><strong>Alternatives:</strong> ${esc(c.alternatives||'None recorded')}</p><p><strong>Plan:</strong> ${esc(c.plan)}</p></div>`).join(''):'<p class="placeholder">No reasoning commitment yet.</p>';
}

function renderOrderSearch(){
  const p=state.patients[state.selectedId];if(!p)return;
  const query=$('orderSearch').value.trim().toLowerCase();
  if(query.length<2){$('orderResults').innerHTML='<p class="placeholder">Type at least two characters.</p>';return;}
  const matches=p.orderCatalog.filter(order=>order.name.toLowerCase().includes(query)||order.type.toLowerCase().includes(query));
  $('orderResults').innerHTML=matches.length?matches.map(order=>`<div class="order-card"><div><b>${esc(order.name)}</b><span>${esc(order.type)} · attention ${fmtTime(order.attention)} · process ${fmtTime(order.process)}</span></div><button type="button" data-order="${order.id}" ${state.ended?'disabled':''}>Place</button></div>`).join(''):'<p class="placeholder">No matching option for this patient.</p>';
  document.querySelectorAll('[data-order]').forEach(button=>button.addEventListener('click',()=>placeOrder(button.dataset.order)));
}

function renderPlacedOrders(){
  const p=state.patients[state.selectedId];if(!p)return;
  $('placedOrders').innerHTML=p.orders.length?p.orders.map(order=>`<div class="placed-card"><b>${esc(order.name)}</b><span>Placed ${fmtTime(order.placedAt)} · ${order.status==='pending'?`due ${fmtTime(order.due)}`:`completed ${fmtTime(order.completedAt??order.placedAt)}`}</span></div>`).join(''):'<p class="placeholder">No orders placed.</p>';
}

function renderTeam(){
  const patientId=state.selectedId;if(!patientId)return;
  $('teamRoles').innerHTML=TEAM_ROLES.map(role=>`<button type="button" class="team-role ${state.teamRole===role.id?'active':''}" data-role="${role.id}"><b>${esc(role.label)}</b><small>${esc(role.sub)}</small></button>`).join('');
  document.querySelectorAll('[data-role]').forEach(button=>button.addEventListener('click',()=>chooseTeamRole(button.dataset.role)));
  $('sendTeamBtn').disabled=!state.teamRole||state.ended;
  $('confirmReadbackBtn').classList.toggle('hidden',!state.pendingReadback);
  const msgs=state.teamMessages.filter(x=>x.patientId===patientId);
  $('teamTranscript').innerHTML=msgs.length?msgs.map(m=>`<div class="turn"><small>${fmtTime(m.time)} · ${esc(TEAM_ROLES.find(r=>r.id===m.role).label)}</small><p><b>You:</b> ${esc(m.message)}</p><p><b>Response:</b> ${esc(m.response)}</p></div>`).join(''):'<p class="placeholder">Select a team member and communicate directly.</p>';
  $('delegationMenu').innerHTML=delegationOptions(patientId).map(task=>{const staff=state.staff[task.staff];const busy=staff.busyUntil>state.time;return `<button type="button" data-delegate="${task.id}" ${busy||state.ended?'disabled':''}><b>${esc(task.label)}</b><small>${task.staff==='nurse'?'RN':'Intern'} · your attention ${fmtTime(task.attention)} · completes in ${fmtTime(task.process)}${busy?` · busy until ${fmtTime(staff.busyUntil)}`:''}</small></button>`;}).join('');
  document.querySelectorAll('[data-delegate]').forEach(button=>button.addEventListener('click',()=>delegateTask(button.dataset.delegate)));
}

function renderPages(){
  const open=state.pages.filter(x=>!x.ack);$('pageCount').textContent=`${open.length} open`;
  $('pages').innerHTML=state.pages.length?state.pages.map(page=>`<div class="page-card ${page.urgent?'urgent':''}"><small>${fmtTime(page.time)} · ${esc(state.patients[page.patientId].name)}</small><h3>${esc(page.title)}</h3><p>${esc(page.text)}</p><button type="button" data-page="${page.id}" ${page.ack||state.ended?'disabled':''}>${page.ack?'Acknowledged':'Acknowledge · 0:10'}</button></div>`).join(''):'<p class="placeholder">No pages yet.</p>';
  document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>acknowledgePage(button.dataset.page)));
}

function renderResults(){
  const all=[];
  for(const [id,p] of Object.entries(state.patients)) for(const result of p.results) all.push({...result,patientId:id});
  all.sort((a,b)=>b.time-a.time);
  const pending=state.processes.filter(x=>x.status==='pending');$('pendingCount').textContent=`${pending.length} pending`;
  $('results').innerHTML=all.length?all.map(r=>`<div class="result-card ${r.tone}"><small>${fmtTime(r.time)} · ${esc(state.patients[r.patientId].name)}</small><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join(''):'<p class="placeholder">No results available.</p>';
}

function renderAttention(){
  $('attentionTotal').textContent=`${fmtTime(state.totalAttention)} used`;
  $('attentionLedger').innerHTML=state.ledger.length?state.ledger.map(row=>`<div class="ledger-row"><small>${fmtTime(row.start)}–${fmtTime(row.end)}</small><div>${row.patientId?`<b>${esc(state.patients[row.patientId].name)}:</b> `:''}${esc(row.label)}</div><strong>${fmtTime(row.seconds)}</strong></div>`).join(''):'<p class="placeholder">No learner attention spent.</p>';
}

function renderTimeline(){
  $('eventCount').textContent=`${state.timeline.length} events`;
  $('timeline').innerHTML=state.timeline.length?state.timeline.map(e=>`<div class="timeline-row"><small>${fmtTime(e.time)}</small><div>${e.patientId?`<b>${esc(state.patients[e.patientId].name)}:</b> `:''}${esc(e.text)}</div></div>`).join(''):'<p class="placeholder">The shift has not started.</p>';
}

function renderStaff(){
  const parts=['nurse','intern'].map(id=>{const staff=state.staff[id];return `${id==='nurse'?'RN':'Intern'} ${staff.busyUntil>state.time?`busy to ${fmtTime(staff.busyUntil)}`:'ready'}`;});
  $('staffState').textContent=parts.join(' · ');
}

function activateTab(tabName){
  document.querySelectorAll('[role="tab"]').forEach(button=>{const active=button.dataset.tab===tabName;button.setAttribute('aria-selected',String(active));});
  document.querySelectorAll('.tab-panel').forEach(panel=>{const active=panel.id===`panel-${tabName}`;panel.hidden=!active;panel.classList.toggle('active',active);});
}


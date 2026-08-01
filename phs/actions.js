'use strict';

function startShift(){
  const ranking=readRanking('initialRanking');
  if(!ranking){$('rankingError').textContent='Use each rank exactly once.';return;}
  state.initialRanking=ranking;
  state.started=true;state.running=true;
  $('intro').classList.add('hidden');
  $('pauseBtn').disabled=false;$('endBtn').disabled=false;
  addTimeline(`Sign-out accepted after committing an initial acuity ranking. Variant: ${state.variant.label}.`,null,'system');
  renderAll();
}

function selectPatient(patientId){
  if(!state.started||state.ended) return;
  state.selectedId=patientId;
  state.patients[patientId].reviewed=true;
  state.teamRole='';state.pendingReadback=null;
  resetPatientInputs();
  renderAll();
}

function resetPatientInputs(){
  for(const id of ['historyInput','problemRepresentation','alternatives','immediatePlan','orderSearch','teamMessage']) if($(id)) $(id).value='';
  if($('confidence')) $('confidence').value='50';
  if($('confidenceValue')) $('confidenceValue').textContent='50%';
}

function askHistory(){
  const patientId=state.selectedId;if(!patientId) return;
  const question=$('historyInput').value.trim();if(!question) return;
  const source=$('historySource').value;
  const p=state.patients[patientId];
  const text=question.toLowerCase();
  let matched=null;
  for(const [key,item] of Object.entries(p.history)) if(hasAny(text,item.terms)){matched={key,item};break;}
  if(!spendAttention(20,`Asked ${source} a focused history question`,patientId)) return;
  const answer=matched?matched.item[source]:(source==='nurse'?'The nurse has no additional information responsive to that question.':'The parent is not sure how to answer that question.');
  if(matched&&!p.historyCategories.includes(matched.key)) p.historyCategories.push(matched.key);
  p.historyLog.push({time:state.time,source,question,answer,category:matched?.key||'unmatched'});
  $('historyInput').value='';
  renderHistory();
}

function performExam(examId){
  const patientId=state.selectedId;if(!patientId) return;
  const p=state.patients[patientId];const component=p.exams.find(x=>x.id===examId);if(!component) return;
  if(!spendAttention(component.cost,`Performed ${component.label}`,patientId)) return;
  let finding=component.finding;
  if(patientId==='maya'&&p.flags.pgeStartedAt&&(examId==='pulses'||examId==='appearance'||examId==='respiratory')){
    finding=p.flags.responding?'After treatment, pulses and perfusion are improving but remain abnormal; respiratory effort is less pronounced.':'Treatment has started, but no clear bedside improvement is yet established.';
    p.flags.reassessedAfterPge=true;
  }
  p.examCounts[examId]=(p.examCounts[examId]||0)+1;
  p.examLog.push({id:examId,time:state.time,finding});
  renderExam();
}

function commitReasoning(){
  const patientId=state.selectedId;if(!patientId) return;
  const representation=$('problemRepresentation').value.trim();
  const diagnosis=$('diagnosisChoice').value;
  const alternatives=$('alternatives').value.trim();
  const plan=$('immediatePlan').value.trim();
  const confidence=Number($('confidence').value);
  if(!representation||!diagnosis||!plan){addResult(patientId,'Reasoning not committed','Complete the problem representation, leading diagnosis, and immediate plan.','warn');renderResults();return;}
  if(!spendAttention(30,'Committed a diagnostic reasoning checkpoint',patientId)) return;
  state.patients[patientId].reasoning.push({time:state.time,representation,diagnosis,alternatives,plan,confidence});
  for(const id of ['problemRepresentation','alternatives','immediatePlan']) $(id).value='';
  renderReasoning();
}

function searchOrders(){renderOrderSearch();}

function placeOrder(orderId){
  const patientId=state.selectedId;if(!patientId) return;
  const p=state.patients[patientId];const definition=p.orderCatalog.find(x=>x.id===orderId);if(!definition) return;
  if(p.ordersPlaced?.includes(orderId)||p.orders.some(x=>x.id===orderId&&x.status!=='cancelled')){addResult(patientId,'Order not repeated','That order is already active or complete.','neutral');renderResults();return;}
  if(definition.requiresCommit&&!latestCommit(patientId)){
    addResult(patientId,'Diagnostic commitment required','Commit a provisional diagnosis before initiating this disease-specific treatment or disposition. Generic stabilization remains available.','warn');
    activateTab('reasoning');renderResults();return;
  }
  if(!spendAttention(definition.attention,`Entered order: ${definition.name}`,patientId)) return;
  const order={...definition,placedAt:state.time,status:'pending',due:state.time+definition.process};
  p.orders.push(order);
  if(definition.process>0) scheduleProcess({kind:'order',patientId,orderId,due:order.due});
  else {order.completedAt=state.time;completeOrder(patientId,orderId);}
  addTimeline(`Order placed: ${definition.name}. Process time ${fmtTime(definition.process)}.`,patientId,'order');
  $('orderSearch').value='';
  renderAll();
}

function chooseTeamRole(roleId){state.teamRole=roleId;state.pendingReadback=null;renderTeam();}

function sendTeamMessage(){
  const patientId=state.selectedId;if(!patientId||!state.teamRole) return;
  const message=$('teamMessage').value.trim();if(!message) return;
  if(!spendAttention(30,`Communicated with ${TEAM_ROLES.find(r=>r.id===state.teamRole).label}`,patientId)) return;
  const lower=message.toLowerCase();
  const quality={
    urgency:hasAny(lower,['urgent','immediate','now','critical','unstable','shock']),
    assessment:hasAny(lower,['concern','think','suspect','assessment','coarct','ductal','bronchiol','infection','chest pain']),
    request:hasAny(lower,['please','need','request','come','start','obtain','call','transfer','evaluate']),
    confirmation:hasAny(lower,['read back','confirm','repeat back','let me know when'])
  };
  const response=teamResponse(state.teamRole,patientId,quality);
  state.teamMessages.push({time:state.time,patientId,role:state.teamRole,message,response,quality});
  state.pendingReadback={patientId,role:state.teamRole,response};
  if(state.teamRole==='cardiology') state.patients[patientId].flags.cardiologyCalled=true;
  if(state.teamRole==='attending') state.patients[patientId].flags.attendingCalled=true;
  if(state.teamRole==='parent') state.patients[patientId].flags.familyUpdated=true;
  $('teamMessage').value='';
  renderTeam();
}

function teamResponse(role,patientId,quality){
  const p=state.patients[patientId];
  const gap=[];if(!quality.urgency) gap.push('urgency');if(!quality.assessment) gap.push('assessment');if(!quality.request) gap.push('specific request');
  const suffix=gap.length?` I need clarification about the ${gap.join(', ')}.`:' I will repeat the plan back now.';
  if(role==='nurse') return `Nurse: I understand this concerns ${p.name}.${suffix}`;
  if(role==='intern') return `Intern: I can take a parallel task for ${p.name}.${suffix}`;
  if(role==='attending') return `Attending: I am coming to review ${p.name}.${suffix}`;
  if(role==='cardiology') return patientId==='maya'?`Cardiology: Treat this as possible ductal-dependent systemic circulation while we mobilize.${suffix}`:`Cardiology: I need the cardiac findings and reason for urgent consultation.${suffix}`;
  return `Caregiver: Thank you. Please tell me what you are most worried about and what happens next.${suffix}`;
}

function confirmReadback(){
  if(!state.pendingReadback) return;
  const {patientId,role}=state.pendingReadback;
  if(!spendAttention(10,'Confirmed closed-loop read-back',patientId)) return;
  state.readbacks.push({time:state.time,patientId,role});
  state.pendingReadback=null;
  renderTeam();
}

function delegationOptions(patientId){
  const common=[
    {id:'repeatVitals',staff:'nurse',label:'Repeat full vital signs',attention:15,process:60},
    {id:'focusedHistory',staff:'intern',label:'Obtain focused collateral history',attention:15,process:90},
    {id:'reviewChart',staff:'intern',label:'Review prior records and pending results',attention:15,process:120}
  ];
  const specific={
    maya:[{id:'ivmonitor',staff:'nurse',label:'Establish monitoring and vascular access',attention:15,process:90},{id:'fourbp',staff:'nurse',label:'Obtain four-limb blood pressures',attention:15,process:90}],
    eli:[{id:'suction',staff:'nurse',label:'Perform nasal suction and repositioning',attention:15,process:60}],
    nora:[{id:'urine',staff:'nurse',label:'Collect catheterized urine specimen',attention:15,process:120}],
    jamal:[{id:'ecg',staff:'nurse',label:'Obtain 12-lead ECG',attention:15,process:90}]
  };
  return [...specific[patientId],...common];
}

function delegateTask(taskId){
  const patientId=state.selectedId;if(!patientId) return;
  const task=delegationOptions(patientId).find(x=>x.id===taskId);if(!task) return;
  const staff=state.staff[task.staff];
  if(staff.busyUntil>state.time){addResult(patientId,'Delegation unavailable',`${task.staff==='nurse'?'The bedside nurse':'The intern'} is still completing ${staff.task}.`,'warn');renderResults();return;}
  if(!spendAttention(task.attention,`Delegated: ${task.label}`,patientId)) return;
  staff.busyUntil=state.time+task.process;staff.task=task.label;
  scheduleProcess({kind:'delegation',patientId,taskId,staff:task.staff,label:task.label,due:staff.busyUntil});
  addTimeline(`${task.label} delegated to ${task.staff}; expected in ${fmtTime(task.process)}.`,patientId,'delegation');
  renderAll();
}

function acknowledgePage(pageId){
  const page=state.pages.find(x=>x.id===pageId);if(!page||page.ack) return;
  if(!spendAttention(10,`Acknowledged page: ${page.title}`,page.patientId)) return;
  page.ack=true;selectPatient(page.patientId);
}

function openEndShift(){
  if(!state.started||state.ended) return;
  renderFinalRanking();
  $('finalModal').classList.remove('hidden');
}

function completeShift(){
  const ranking=readRanking('finalRanking');
  const handoff=$('handoffText').value.trim();
  if(!ranking){$('finalError').textContent='Use each rank exactly once.';return;}
  if(handoff.length<40){$('finalError').textContent='Provide a receiver-facing handoff with illness severity, active problems, and next steps.';return;}
  state.finalRanking=ranking;state.handoff=handoff;state.ended=true;state.running=false;state.endReason='Shift completed by learner.';
  $('finalModal').classList.add('hidden');
  addTimeline('Shift ended and handoff submitted.',null,'system');
  showDebrief();
}

function cancelEnd(){
  $('finalModal').classList.add('hidden');
  $('finalError').textContent='';
}


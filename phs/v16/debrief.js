'use strict';

const orderDone=(pid,id)=>state.patients[pid].orders.some(o=>o.id===id&&(['available','reviewed','interpreted'].includes(o.status)||o.availableAt!==null));
const orderPlaced=(pid,id)=>state.patients[pid].orders.some(o=>o.id===id);
const resultFor=(pid,id)=>state.patients[pid].results.find(r=>r.orderId===id);
const reviewed=(pid,id)=>!!resultFor(pid,id)?.reviewedAt;
const interpreted=(pid,id)=>!!resultFor(pid,id)?.interpretedAt;
const examCount=(pid,id)=>state.patients[pid].examCounts[id]||0;
const correctReasoning=pid=>state.patients[pid].reasoning.some(r=>r.diagnosis===state.patients[pid].correctDiagnosis);
const communicated=(pid,role)=>state.teamMessages.some(m=>m.patientId===pid&&m.role===role);
const readback=(pid,role)=>state.readbacks.some(r=>r.patientId===pid&&r.role===role);
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));

function scoreMaya(){
  const p=state.patients.maya,misses=[],strengths=[];let score=0;
  const add=(condition,points,label,rationale,consequence)=>{if(condition){score+=points;strengths.push(label);}else misses.push({label,rationale,consequence});};
  add(examCount('maya','pulses')>0,8,'Compared upper and lower extremity perfusion','Pulse and perfusion asymmetry is a high-value clue to obstructed systemic blood flow.','The inherited feeding/sepsis frame remained harder to overturn.');
  add(examCount('maya','fourbp')>0||examCount('maya','ductalsats')>0,6,'Obtained targeted bedside comparisons','Four-limb pressures and pre/postductal measurements refine the hemodynamic pattern.','A bedside opportunity to recognize systemic outflow obstruction was missed.');
  add(correctReasoning('maya'),8,'Committed to the cardiac mechanism','Diagnosis and management are assessed separately; correct mechanism supports targeted escalation.','Management may have been correct without demonstrating diagnostic understanding.');
  add(orderDone('maya','monitoriv'),6,'Established monitoring and access','A crashing neonate requires continuous monitoring and reliable vascular access.','Deterioration and treatment complications were less safely managed.');
  add(orderDone('maya','glucose'),5,'Checked rapid bedside glucose','Hypoglycemia is a reversible mimic and contributor in a poorly feeding sick neonate.','A reversible metabolic cause was not rapidly excluded.');
  add(orderDone('maya','culture')&&orderDone('maya','antibiotics'),8,'Covered neonatal sepsis in parallel','Cardiac disease and sepsis cannot be safely separated at initial presentation in a critically ill neonate.','The simulation recorded premature closure on a cardiac-only pathway.');
  add(orderDone('maya','airway'),6,'Prepared for airway complications','Prostaglandin initiation requires respiratory monitoring and immediate ventilatory capability.','Airway support was not prepared before a treatment with a known apnea risk.');
  const pgeAt=p.flags.pgeStartedAt;if(pgeAt){score+=pgeAt<=240?20:pgeAt<=360?14:8;strengths.push(`Started prostaglandin at ${fmtTime(pgeAt)}`);}else misses.push({label:'Prostaglandin was not started',rationale:'Ductal patency is the time-critical bridge for ductal-dependent systemic circulation.',consequence:p.flags.arrest?'Maya progressed to arrest.':'Systemic hypoperfusion continued.'});
  add(reviewed('maya','echo')&&interpreted('maya','echo'),8,'Reviewed and interpreted echocardiography','Ordering alone does not demonstrate recognition or action on a critical result.','The definitive result was not fully incorporated into the learner’s model.');
  const reassessed=pgeAt&&(p.observedVitals.some(v=>v.time>pgeAt)||p.examLog.some(e=>e.time>pgeAt));add(reassessed,8,'Reassessed after treatment','Response in systemic pressure, perfusion, respiratory status, pH and lactate must guide ongoing care.','Treatment response was assumed rather than observed.');
  add(communicated('maya','cardiology')&&readback('maya','cardiology'),7,'Used closed-loop cardiac escalation','Time-critical transfer and specialty mobilization require a clear synthesis and confirmed plan.','Escalation lacked confirmed closed-loop communication.');
  add(communicated('maya','parent'),4,'Updated Maya’s caregiver','Families need an honest explanation during rapid escalation.','Caregiver communication was absent from the documented pathway.');
  if(p.flags.bigBolus){score-=10;misses.push({label:'Rapid large-volume fluid expansion worsened congestion',rationale:'Obstructed systemic outflow with ventricular dysfunction requires cautious, response-guided resuscitation.',consequence:'Respiratory effort, hepatic congestion and lactate worsened.'});}
  if(p.flags.pgeApnea){score-=8;misses.push({label:'Prostaglandin-associated apnea occurred without airway readiness',rationale:'Immediate ventilatory assistance should be available when starting prostaglandin.',consequence:'Maya developed apnea, bradycardia and severe desaturation.'});}
  return {score:clamp(score),misses,strengths};
}

function scoreEli(){
  const p=state.patients.eli,misses=[],strengths=[];let score=0;const add=(c,pts,label,why,cons)=>{if(c){score+=pts;strengths.push(label);}else misses.push({label,rationale:why,consequence:cons});};
  add(examCount('eli','respiratory')>0,15,'Assessed respiratory effort','Work of breathing and aeration determine escalation.','Respiratory severity was not directly characterized.');
  add(p.observedVitals.length>=2,15,'Repeated oxygenation assessment','Bronchiolitis management depends on trajectory and response.','The learner did not document a trend.');
  add(orderDone('eli','suction'),15,'Used suction and positioning','Upper-airway obstruction can materially worsen infant work of breathing.','A low-risk supportive intervention was omitted.');
  add(orderDone('eli','oxygen')||orderDone('eli','hfnc'),20,'Escalated respiratory support','Persistent hypoxemia requires supportive escalation based on response.','Desaturation continued without adequate support.');
  add(orderDone('eli','hydration'),15,'Addressed hydration','Reduced intake and respiratory effort increase dehydration risk.','Hydration support was not addressed.');
  add(!orderPlaced('eli','steroids'),10,'Avoided routine corticosteroids','Routine systemic corticosteroids do not address uncomplicated bronchiolitis physiology.','A low-value therapy consumed attention.');
  add(!orderPlaced('eli','albuterol')||examCount('eli','respiratory')>1,10,'Avoided or reassessed a bronchodilator trial','Any trial should have an explicit response assessment and be stopped if ineffective.','The response to a low-yield trial was not reassessed.');
  return {score:clamp(score),misses,strengths};
}

function scoreNora(){
  const p=state.patients.nora,misses=[],strengths=[];let score=0;const add=(c,pts,label,why,cons)=>{if(c){score+=pts;strengths.push(label);}else misses.push({label,rationale:why,consequence:cons});};
  add(examCount('nora','appearance')>0&&p.observedVitals.length>=1,10,'Reassessed Nora after microbiology escalation','A preliminary positive culture must be interpreted in the patient’s current clinical context.','Culture data were separated from bedside reassessment.');
  add(reviewed('nora','reviewculture'),10,'Reviewed collection details and time to positivity','Collection quality and time to positivity inform—but do not settle—pathogen probability.','The preliminary result was not critically appraised.');
  add(!!state.noraJudgment,10,'Committed to a provisional pathogen/contaminant judgment','Uncertainty should be made explicit before definitive speciation.','The reasoning step was bypassed.');
  add(reviewed('nora','speciation')&&interpreted('nora','speciation'),10,'Reviewed and interpreted definitive GBS identification','Definitive organism identification changes meningitis evaluation and treatment planning.','The critical microbiology result was not fully incorporated.');
  add(orderDone('nora','antibiotics'),20,'Started parenteral antibiotics','Confirmed invasive GBS disease requires prompt therapy.','Treatment of invasive bacterial infection was delayed or omitted.');
  add(orderDone('nora','lp'),20,'Obtained CSF studies','GBS bacteremia in a young infant carries clinically important meningitis risk and CSF findings change duration and follow-up.','Possible meningitis remained unclassified.');
  add(reviewed('nora','lp')&&interpreted('nora','lp'),10,'Interpreted CSF findings','Performing the procedure without reviewing the result does not complete the diagnostic task.','Abnormal CSF could remain unactioned.');
  add(orderDone('nora','admit'),10,'Established monitored disposition','Invasive infection requires clear ownership and monitored therapy.','Disposition and ownership remained unsafe.');
  return {score:clamp(score),misses,strengths};
}

function scoreJamal(){
  const p=state.patients.jamal,misses=[],strengths=[];let score=0;const add=(c,pts,label,why,cons)=>{if(c){score+=pts;strengths.push(label);}else misses.push({label,rationale:why,consequence:cons});};
  add(p.historyCategories.includes('exertion')&&p.historyCategories.includes('family')&&p.historyCategories.includes('clot'),15,'Elicited chest-pain red flags','Exertional symptoms, family history and thromboembolic risk shape testing.','Risk assessment remained incomplete.');
  add(examCount('jamal','cardiac')>0&&examCount('jamal','chestwall')>0,15,'Performed focused cardiac and chest-wall examination','Reproducibility and normal cardiovascular findings support the working diagnosis.','The benign mechanism was not directly demonstrated.');
  add(orderDone('jamal','ecg')&&reviewed('jamal','ecg'),15,'Reviewed an ECG','A focused initial test can address important cardiac red flags without broad imaging.','The result was ordered or absent without documented review.');
  add(orderDone('jamal','analgesia'),15,'Treated and reassessed pain','Response to simple therapy supports safe disposition.','Symptom response was not assessed.');
  add(orderDone('jamal','family'),15,'Addressed caregiver concern directly','Communication should explain why additional testing is or is not indicated.','Anxiety was not managed with transparent risk communication.');
  add(orderDone('jamal','discharge'),15,'Completed safe disposition','Return precautions and follow-up are part of the clinical decision.','The encounter lacked a documented disposition.');
  add(!orderPlaced('jamal','chestct')&&!orderPlaced('jamal','echo')&&!orderPlaced('jamal','cardiology'),10,'Avoided unnecessary escalation','Low-pretest-probability testing consumes time and can cause downstream harm.','Low-value escalation diverted attention from higher-acuity patients.');
  return {score:clamp(score),misses,strengths};
}

function scorePages(){return state.pages.map(page=>({title:page.title,patientId:page.patientId,createdAt:page.createdAt,ackLatency:page.ackAt===null?null:page.ackAt-page.createdAt,responseLatency:page.responseAt===null?null:page.responseAt-page.createdAt,resolved:page.resolvedAt!==null,urgent:page.urgent}));}
function scoreHandoffs(){
  const required=['illness','summary','actions','pending','contingency'];let total=0,max=0,details=[];
  for(const id of Object.keys(state.patients)){const h=state.handoffs[id]||{};let patientScore=0;for(const key of required){max+=1;if((h[key]||'').trim().length>=8){total+=1;patientScore+=1;}}details.push({id,score:patientScore,max:required.length});}
  return {score:max?Math.round(total/max*100):0,details};
}
function unreviewedResults(){return Object.values(state.patients).flatMap(p=>p.results.filter(r=>r.reviewedAt===null).map(r=>({patient:p.name,title:r.title,time:r.availableAt})));}
function pendingOrders(){return Object.entries(state.patients).flatMap(([id,p])=>p.orders.filter(o=>o.status==='pending'&&!(state.handoffs[id]?.pending||'').trim()).map(o=>({patient:p.name,name:o.name,placedAt:o.placedAt})));}

function buildDebrief(){
  const patients={maya:scoreMaya(),eli:scoreEli(),nora:scoreNora(),jamal:scoreJamal()};const overall=Math.round(patients.maya.score*.5+patients.eli.score*.15+patients.nora.score*.2+patients.jamal.score*.15);const pages=scorePages(),handoff=scoreHandoffs();
  const criticalFailure=!state.patients.maya.flags.pgeStartedAt||state.patients.maya.flags.arrest;const mastery=!criticalFailure&&overall>=80&&patients.nora.score>=70&&handoff.score>=70&&state.mode==='assessment';
  return {patients,overall,pages,handoff,criticalFailure,mastery,unreviewed:unreviewedResults(),pending:pendingOrders()};
}

function showDebrief(){
  state.running=false;state.ended=true;const d=buildDebrief();$('debriefSection').classList.remove('hidden');
  $('debriefOutcome').textContent=state.endReason||'Shift completed.';$('masteryBadge').textContent=state.mode==='practice'?'Practice run — not comparable':d.mastery?'Formative mastery standard met':'Mastery standard not met';$('masteryBadge').className=`mastery ${d.mastery?'goodText':'warnText'}`;
  const initial=state.initialRanking||{},final=state.finalRanking||{};$('debriefRanking').innerHTML=`<h3>Acuity calibration</h3>${Object.keys(state.patients).map(id=>`<p><b>${esc(state.patients[id].name)}</b>: initial ${initial[id]||'—'}, final ${final[id]||'—'}, reference ${PHS_DATA.correctRanking[id]}</p>`).join('')}`;
  const totals={};for(const row of state.ledger){const key=row.patientId||'system';totals[key]=(totals[key]||0)+row.seconds;}$('debriefAttention').innerHTML=`<h3>Attention allocation</h3><p>Total scored attention: <b>${fmtTime(state.totalAttention)}</b>. Pauses: <b>${state.pauseCount}</b>. Coached-pause actions: <b>${state.coachedPauseActions}</b>.</p>${Object.entries(totals).map(([id,sec])=>`<p>${id==='system'?'System':esc(state.patients[id].name)}: ${fmtTime(sec)}</p>`).join('')}`;
  $('debriefScore').innerHTML=`<h3>Weighted performance</h3><div class="score-grid"><div class="score-card"><b>Overall</b><span>${d.overall}%</span></div>${Object.entries(d.patients).map(([id,x])=>`<div class="score-card"><b>${esc(state.patients[id].name)}</b><span>${x.score}%</span></div>`).join('')}</div><p class="fineprint">Maya 50%; Nora 20%; Eli 15%; Jamal 15%. Ordering alone does not earn result-review credit.</p>`;
  const misses=Object.entries(d.patients).flatMap(([id,x])=>x.misses.map(m=>({...m,patient:state.patients[id].name})));$('debriefMisses').innerHTML=`<h3>Specific gaps and teaching points</h3>${misses.length?misses.map(m=>`<div class="miss"><b>${esc(m.patient)} — ${esc(m.label)}</b><p>${esc(m.rationale)}</p><p><strong>Observed consequence:</strong> ${esc(m.consequence)}</p></div>`).join(''):'<p>No scored omissions.</p>'}${d.unreviewed.length?`<h4>Unreviewed results</h4>${d.unreviewed.map(x=>`<p class="miss">${esc(x.patient)}: ${esc(x.title)} available at ${fmtTime(x.time)}</p>`).join('')}`:''}${d.pending.length?`<h4>Pending without completed ownership</h4>${d.pending.map(x=>`<p class="miss">${esc(x.patient)}: ${esc(x.name)}</p>`).join('')}`:''}`;
  const mayaReason=state.patients.maya.reasoning;$('debriefReasoning').innerHTML=`<h3>Reasoning replay</h3><div class="score-grid"><div class="score-card"><b>Learner commitments</b>${mayaReason.length?mayaReason.map(r=>`<p>${fmtTime(r.time)} — ${esc(r.diagnosis)} (${r.confidence}%)<br>${esc(r.problem)}</p>`).join(''):'<p>None recorded.</p>'}</div><div class="score-card"><b>Expert representation</b><p>Six-day-old term infant with progressive poor feeding, tachypnea, oliguria, upper–lower extremity perfusion disparity, weak femoral pulses, hepatomegaly and rising lactate—shock from ductal-dependent systemic circulation until proven otherwise, while sepsis and metabolic causes are covered in parallel.</p></div></div>`;
  $('debriefPages').innerHTML=`<h3>Interruptions and escalation</h3>${d.pages.length?d.pages.map(p=>`<p class="${p.urgent&&(p.ackLatency===null||p.ackLatency>60)?'miss':''}"><b>${esc(state.patients[p.patientId].name)}:</b> ${esc(p.title)} — acknowledged ${p.ackLatency===null?'never':`after ${fmtTime(p.ackLatency)}`}; clinical response ${p.responseLatency===null?'not documented':`after ${fmtTime(p.responseLatency)}`}; ${p.resolved?'resolved':'unresolved'}.</p>`).join(''):'<p>No pages occurred.</p>'}`;
  $('debriefHandoff').innerHTML=`<h3>I-PASS handoff</h3><p>Completeness score: <b>${d.handoff.score}%</b></p>${d.handoff.details.map(x=>`<p>${esc(state.patients[x.id].name)}: ${x.score}/${x.max} required elements documented.</p>`).join('')}`;
  $('debriefTimeline').innerHTML=`<h3>Timeline reconstruction</h3>${state.timeline.slice().reverse().map(e=>`<p><b>${fmtTime(e.time)}</b> ${e.patientId?`${esc(state.patients[e.patientId].name)} — `:''}${esc(e.text)}</p>`).join('')}`;
}

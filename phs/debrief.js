'use strict';

function showDebrief(){
  state.running=false;
  $('pauseBtn').disabled=true;$('endBtn').disabled=true;
  const report=buildDebrief();
  $('debriefOutcome').textContent=state.endReason;
  $('masteryBadge').textContent=report.criticalFailure?'Critical action missed':report.total>=80?'Provisional mastery met':'Remediation indicated';
  $('debriefRanking').innerHTML=report.rankingHtml;
  $('debriefAttention').innerHTML=report.attentionHtml;
  $('debriefScore').innerHTML=report.scoreHtml;
  $('debriefMisses').innerHTML=report.missesHtml;
  $('debriefReasoning').innerHTML=report.reasoningHtml;
  $('debriefHandoff').innerHTML=report.handoffHtml;
  $('debriefTimeline').innerHTML=report.timelineHtml;
  $('debriefSection').classList.remove('hidden');
}

function buildDebrief(){
  const p=state.patients.maya;
  const firstMayaCommit=p.reasoning[0];
  const correctCommit=p.reasoning.find(x=>x.diagnosis===p.correctDiagnosis);
  const pgeOrder=p.orders.find(x=>x.id==='pge');
  const pgeAt=p.flags.pgeStartedAt;
  const attention=attentionByPatient();
  const domains={prioritization:0,information:0,exam:0,reasoning:0,stabilization:0,teamwork:0,reassessment:0,handoff:0};
  if(state.initialRanking?.maya===1) domains.prioritization+=8;
  if(state.initialRanking?.eli<=2) domains.prioritization+=2;
  domains.information=Math.min(10,p.historyCategories.filter(x=>['feeding','urine','onset','color','breathing','fever'].includes(x)).length*1.5+(Object.values(state.patients).filter(x=>x.reviewed).length-1));
  if(p.examCounts.pulses) domains.exam+=5;if(p.examCounts.fourbp) domains.exam+=4;if(p.examCounts.appearance) domains.exam+=2;if(p.examCounts.respiratory) domains.exam+=2;if(p.examCounts.abdomen) domains.exam+=2;
  if(correctCommit) domains.reasoning+=10;
  if(correctCommit&&correctCommit.time<(pgeOrder?.placedAt??Infinity)) domains.reasoning+=3;
  if(firstMayaCommit?.alternatives&&hasAny(firstMayaCommit.alternatives.toLowerCase(),['sepsis','infection','myocard','metabolic','inborn'])) domains.reasoning+=2;
  if(patientHasOrder('maya','monitoriv')||p.flags.monitoring) domains.stabilization+=5;
  if(pgeAt){domains.stabilization+=pgeAt<=240?20:pgeAt<=360?15:8;}
  if(patientHasOrder('maya','airway')) domains.stabilization+=3;
  if(p.flags.bigBolus) domains.stabilization=Math.max(0,domains.stabilization-8);
  if(p.flags.cardiologyCalled) domains.teamwork+=5;if(p.flags.attendingCalled) domains.teamwork+=3;if(p.flags.familyUpdated) domains.teamwork+=2;
  if(state.readbacks.some(x=>x.patientId==='maya')) domains.teamwork+=3;
  if(state.processes.some(x=>x.kind==='delegation'&&x.patientId==='maya')) domains.teamwork+=2;
  if(p.flags.reassessedAfterPge) domains.reassessment+=6;
  if(p.flags.delegatedRepeatVitals) domains.reassessment+=2;
  if(p.reasoning.length>=2) domains.reassessment+=2;
  if(state.handoff){const h=state.handoff.toLowerCase();if(hasAny(h,['unstable','critical','watcher'])) domains.handoff+=3;if(hasAny(h,['coarct','ductal','systemic'])) domains.handoff+=3;if(hasAny(h,['pending','repeat','reassess','contingency','if'])) domains.handoff+=4;}
  const total=Math.round(Object.values(domains).reduce((a,b)=>a+b,0));
  const criticalFailure=!pgeAt||p.flags.arrest;

  const misses=[];
  if(state.initialRanking?.maya!==1) misses.push({critical:false,title:'Initial prioritization did not place Maya first',why:'The central task was recognizing time-sensitive shock despite reassuring inherited framing.',consequence:`Maya was initially ranked ${state.initialRanking?.maya??'not ranked'}.`});
  if(!p.examCounts.pulses) misses.push({critical:false,title:'Upper-versus-lower extremity pulses and perfusion were not examined',why:'Differential perfusion is a discriminating bedside clue in obstructed systemic blood flow.',consequence:'The debrief cannot show that this clue informed your reasoning.'});
  if(!p.examCounts.fourbp) misses.push({critical:false,title:'Four-limb blood pressures were not obtained',why:'An upper-to-lower extremity pressure difference can strengthen concern for arch obstruction.',consequence:'A high-yield discriminating data point remained unavailable.'});
  if(!correctCommit) misses.push({critical:false,title:'No committed diagnosis identified ductal-dependent systemic circulation',why:'Safe management and diagnostic understanding are assessed separately.',consequence:pgeAt?'Treatment was initiated without documenting the correct leading mechanism.':'The correct mechanism was neither committed nor treated.'});
  if(!pgeAt) misses.push({critical:true,title:'Prostaglandin therapy was not started',why:'The scenario models progressive loss of ductal-dependent systemic blood flow.',consequence:p.flags.arrest?'Maya progressed to pulseless collapse.':`The shift ended with lactate ${Number(p.vitals.Lactate).toFixed(1)} mmol/L and persistent shock.`});
  else if(pgeAt>360) misses.push({critical:true,title:'Prostaglandin therapy was severely delayed',why:'Late rescue cannot erase the physiologic burden accumulated during untreated shock.',consequence:`Therapy began at ${fmtTime(pgeAt)}; residual lactate is ${Number(p.vitals.Lactate).toFixed(1)} mmol/L.`});
  else if(pgeAt>240) misses.push({critical:false,title:'Prostaglandin therapy was delayed',why:'Earlier stabilization reduces the duration of systemic hypoperfusion.',consequence:`Therapy began at ${fmtTime(pgeAt)}, leaving a slower and incomplete recovery trajectory.`});
  if(!p.flags.cardiologyCalled) misses.push({critical:false,title:'Cardiology/cardiac ICU escalation was not completed',why:'Definitive care requires specialist mobilization and transfer planning.',consequence:'The receiving specialty team was not activated.'});
  if(pgeAt&&!p.flags.reassessedAfterPge) misses.push({critical:false,title:'No focused bedside reassessment followed treatment',why:'A treatment order is not the endpoint; response and deterioration must be observed.',consequence:'The simulator has no evidence that you verified treatment effect.'});
  if(p.flags.bigBolus) misses.push({critical:false,title:'Rapid large-volume fluid was administered',why:'The scenario includes impaired ventricular function and pulmonary congestion.',consequence:'Respiratory effort and congestion worsened after the bolus.'});
  const jamalBeforePge=state.ledger.filter(x=>x.patientId==='jamal'&&x.start<(pgeAt??p.thresholds.terminal)).reduce((a,b)=>a+b.seconds,0);
  if(jamalBeforePge>=120) misses.push({critical:false,title:'Substantial attention was spent on stable chest pain before Maya was stabilized',why:'The educational target is opportunity-cost recognition across simultaneous patients.',consequence:`You spent ${fmtTime(jamalBeforePge)} on Jamal before ${pgeAt?`Maya received prostaglandin at ${fmtTime(pgeAt)}`:`Maya’s modeled window closed at ${fmtTime(p.thresholds.terminal)}`}.`});

  const rankingRows=state.patientOrder.map(id=>`<tr><td>${esc(state.patients[id].name)}</td><td>${state.initialRanking?.[id]??'—'}</td><td>${state.finalRanking?.[id]??'Not submitted'}</td><td>${CORRECT_RANKING[id]}</td></tr>`).join('');
  const rankingHtml=`<h3>Acuity ranking: commitment before reveal</h3><table><thead><tr><th>Patient</th><th>Initial</th><th>Final</th><th>Reference</th></tr></thead><tbody>${rankingRows}</tbody></table>`;

  const maxAttention=Math.max(1,...Object.values(attention));
  const attentionBars=state.patientOrder.map(id=>`<div class="attention-bar"><b>${esc(state.patients[id].name.split(' ')[0])}</b><div class="bar-track"><div class="bar-fill" style="width:${Math.round(attention[id]/maxAttention*100)}%"></div></div><span>${fmtTime(attention[id])}</span></div>`).join('');
  const beforeSentence=`${jamalBeforePge?`You spent ${fmtTime(jamalBeforePge)} attending to Jamal before Maya’s definitive stabilization. `:''}${pgeAt?`Prostaglandin started at ${fmtTime(pgeAt)}.`:`Maya never received prostaglandin before the modeled closing window at ${fmtTime(p.thresholds.terminal)}.`}`;
  const attentionHtml=`<h3>Attention and opportunity cost</h3><div class="attention-bars">${attentionBars}</div><p>${beforeSentence}</p><p class="muted">Laboratory, imaging, consultant, and delegated processes continued in parallel; only direct learner attention is counted here.</p>`;

  const maxByDomain={prioritization:10,information:10,exam:15,reasoning:15,stabilization:28,teamwork:15,reassessment:10,handoff:10};
  const scoreCells=Object.entries(domains).map(([key,value])=>`<div class="score-cell"><b>${key[0].toUpperCase()+key.slice(1)}</b><span>${Math.round(value)} / ${maxByDomain[key]}</span></div>`).join('');
  const scoreHtml=`<h3>Weighted formative performance</h3><div class="score-grid">${scoreCells}</div><p><b>Total: ${total}/113</b>${criticalFailure?' · Critical-action rule not met':''}</p>`;

  const missesHtml=`<h3>Specific gaps, rationale, and consequence</h3>${misses.length?misses.map(m=>`<div class="miss ${m.critical?'critical':''}"><b>${esc(m.title)}</b><p><strong>Why it matters:</strong> ${esc(m.why)}</p><p><strong>Observed consequence:</strong> ${esc(m.consequence)}</p></div>`).join(''):'<p>No major predefined gap was detected. Review the timeline for efficiency and communication quality.</p>'}`;

  const mayaCommits=p.reasoning.length?p.reasoning.map(c=>`<div class="commit"><small>${fmtTime(c.time)} · confidence ${c.confidence}%</small><p><b>${esc(c.diagnosis)}</b></p><p>${esc(c.representation)}</p><p><strong>Alternatives:</strong> ${esc(c.alternatives||'None recorded')}</p><p><strong>Plan:</strong> ${esc(c.plan)}</p></div>`).join(''):'<p>No Maya reasoning commitment was recorded.</p>';
  const reasoningHtml=`<h3>Reasoning evolution</h3><div class="comparison"><div><h4>Your recorded model</h4>${mayaCommits}</div><div><h4>Expert problem representation</h4><p>Term neonate with progressive feeding intolerance, tachypnea, oliguria, hepatomegaly, and upper-to-lower extremity perfusion and pressure differences, concerning for cardiogenic shock from ductal-dependent systemic blood flow as the ductus closes.</p><p><strong>Reasonable alternatives:</strong> neonatal sepsis, myocarditis, and metabolic disease remain relevant until discriminating findings and investigations narrow the differential.</p></div></div>`;

  const handoffAssessment=state.handoff?evaluateHandoff(state.handoff):['No final handoff was submitted because the encounter auto-ended.'];
  const handoffHtml=`<h3>End-of-shift handoff</h3>${state.handoff?`<blockquote>${esc(state.handoff)}</blockquote>`:''}<ul>${handoffAssessment.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;

  const timelineItems=[...state.timeline].reverse().map(e=>`<div class="timeline-row"><small>${fmtTime(e.time)}</small><div>${e.patientId?`<b>${esc(state.patients[e.patientId].name)}:</b> `:''}${esc(e.text)}</div></div>`).join('');
  const timelineHtml=`<h3>Reconstruction</h3><div class="timeline">${timelineItems}</div>`;
  return {total,criticalFailure,rankingHtml,attentionHtml,scoreHtml,missesHtml,reasoningHtml,handoffHtml,timelineHtml};
}

function evaluateHandoff(text){
  const lower=text.toLowerCase();const feedback=[];
  feedback.push(hasAny(lower,['unstable','critical','watcher'])?'Illness severity was stated.':'Illness severity was not stated explicitly.');
  feedback.push(hasAny(lower,['coarct','ductal','systemic'])?'The leading mechanism was included.':'The leading mechanism was not included.');
  feedback.push(hasAny(lower,['pending','echo','culture','result'])?'Pending work was identified.':'Pending tests or tasks were not clearly identified.');
  feedback.push(hasAny(lower,['if','contingency','reassess','call','return'])?'A contingency or reassessment plan was included.':'No clear contingency or reassessment plan was included.');
  return feedback;
}

function attentionByPatient(){
  const totals={maya:0,eli:0,nora:0,jamal:0};
  for(const row of state.ledger) if(row.patientId) totals[row.patientId]+=row.seconds;
  return totals;
}


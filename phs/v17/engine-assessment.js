'use strict';
function finalizeAttempt(){
  state.analytics=computeDiagnosticAnalytics(state);state.score=scoreAttempt();const weakest=Object.entries(state.score.objectiveScores).sort((a,b)=>a[1]-b[1])[0]?.[0]||'O1';state.nextVariantId=getNextVariantId(learnerRecord,state.caseData,state.variant.id,weakest);
  const attempt={id:uid('attempt'),caseId:state.caseData.id,caseVersion:state.caseData.version,completedAt:new Date().toISOString(),variantId:state.variant.id,mode:state.mode,durationSeconds:state.time,overallScore:state.score.overall,objectiveScores:state.score.objectiveScores,mastery:state.score.mastery,criticalFailure:state.score.criticalFailure,weakestObjectiveId:weakest,nextVariantId:state.nextVariantId,analytics:state.analytics};
  learnerRecord=appendAttempt(learnerRecord,attempt);hideEndModal();showDebrief();renderAll();
}
function evaluateCondition(c){const p=c.patientId?state.patients[c.patientId]:null;switch(c.type){
  case'ranking':return state[`${c.phase}Ranking`]?.[c.patientId]===c.rank;
  case'allUrgentPagesResponded':return state.pages.filter(x=>x.urgent).every(x=>x.responseAt!=null&&x.responseAt-x.createdAt<=c.within);
  case'firstDisconfirmingBefore':{const e=state.timeline.filter(x=>x.patientId==='maya'&&x.meta?.disconfirming).sort((a,b)=>a.time-b.time)[0];return!!e&&e.time<=c.seconds;}
  case'correctReasoning':return p.reasoning.some(r=>r.diagnosis===state.caseData.patients[c.patientId].correctDiagnosis);
  case'flag':return state.flags[c.flag]===c.value||p?.flags?.[c.flag]===c.value;
  case'orderCompleted':return orderCompleted(c.patientId,c.orderId);
  case'bothOrdersCompleted':return c.orderIds.every(id=>orderCompleted(c.patientId,id));
  case'orderBeforeOrWithin':{const a=orderRecord(c.patientId,c.first),b=orderRecord(c.patientId,c.second);return!!a&&!!b&&a.availableAt!=null&&b.availableAt!=null&&a.availableAt<=b.availableAt+c.within;}
  case'orderBeforeVariantThreshold':{const o=orderRecord(c.patientId,c.orderId);return!!o&&o.availableAt!=null&&o.availableAt<=threshold(c.threshold);}
  case'reassessmentAfterOrder':{const o=orderRecord(c.patientId,c.orderId);return!!o?.availableAt&&(p.observedVitals.some(v=>v.time>o.availableAt)||p.examLog.some(e=>e.time>o.availableAt));}
  case'resultInterpreted':return p.results.some(r=>r.orderId===c.orderId&&r.interpretedAt!=null);
  case'allResultsInterpreted':return c.orderIds.every(id=>p.results.some(r=>r.orderId===id&&r.interpretedAt!=null));
  case'teamReadback':return p.teamMessages.some(m=>c.roles.includes(m.role)&&m.readback);
  case'teamMessage':return p.teamMessages.some(m=>m.role===c.role);
  case'jamalCommunicationWithoutLowValue':return state.patients.jamal.flags.familyUpdated&&!state.patients.jamal.flags.lowValueEscalation;
  case'handoffCompleteness':return handoffCompleteness()>=c.minimum;
  case'pendingOwnership':return pendingOwnershipComplete();default:return false;}}
function handoffCompleteness(){const fields=['illness','summary','actions','pending','contingency'];let ok=0,total=0;for(const id of Object.keys(state.patients)){const h=state.handoffs[id]||{};for(const f of fields){total++;if((h[f]||'').trim().length>=8)ok++;}}return total?ok/total:0;}
function pendingOwnershipComplete(){for(const [id,p] of Object.entries(state.patients)){const pending=p.ordersPlaced.some(o=>o.status==='pending')||p.results.some(r=>r.reviewedAt==null)||state.pages.some(pg=>pg.patientId===id&&pg.resolvedAt==null);if(pending&&!(state.handoffs[id]?.pending||'').trim())return false;}return true;}
function scoreAttempt(){const results=state.caseData.rubric.map(item=>({...item,met:evaluateCondition(item.condition)})),objectiveScores={};for(const objective of state.caseData.objectives){const items=results.filter(r=>r.objectiveId===objective.id),earned=items.filter(r=>r.met).reduce((s,r)=>s+r.points,0),possible=items.reduce((s,r)=>s+r.points,0);objectiveScores[objective.id]=possible?Math.round(earned/possible*100):0;}const earned=results.filter(r=>r.met).reduce((s,r)=>s+r.points,0),possible=results.reduce((s,r)=>s+r.points,0),overall=possible?Math.round(earned/possible*100):0,criticalFailure=state.caseData.mastery.criticalItems.some(id=>!results.find(r=>r.id===id)?.met),objectivePass=Object.entries(state.caseData.mastery.objectiveMinimums).every(([id,min])=>(objectiveScores[id]||0)>=min),mastery=state.mode==='assessment'&&!criticalFailure&&objectivePass&&overall>=state.caseData.mastery.overallMinimum;return{results,objectiveScores,overall,criticalFailure,mastery};}
function nextAttempt(){resetSimulation(state.caseData,state.nextVariantId,state.mode);}
function repeatCurrent(){resetSimulation(state.caseData,state.variant.id,state.mode);}
function showUrgent(text){const b=$('urgentBanner');b.textContent=text;b.classList.remove('hidden');setTimeout(()=>b.classList.add('hidden'),4500);}

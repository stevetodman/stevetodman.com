'use strict';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmtTime = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
const clone = value => JSON.parse(JSON.stringify(value));
const hasTerms = (text,terms) => terms.some(term=>text.includes(term));
let state;
let timerId;

function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function patientOrder(){const order=shuffle(Object.keys(PHS_DATA.patients));if(order[0]==='maya')order.push(order.shift());return order;}
function acuityText(patient){if(patient.flags.arrest)return'Cardiac arrest';if(patient.flags.critical)return'Critical';if(patient.flags.worsened)return'Deteriorating';if(patient.flags.stabilized)return'Stabilizing';return'Unreviewed';}
function acuityClass(patient){if(patient.flags.arrest||patient.flags.critical)return'critical';if(patient.flags.worsened)return'warning';return'stable';}

function createPatient(id,variantIndex){
  const source=clone(PHS_DATA.patients[id]);
  if(id==='maya'){source.signout=PHS_DATA.variants[variantIndex].mayaSignout;source.thresholds=clone(PHS_DATA.variants[variantIndex].thresholds);}
  source.catalog=source.orders;source.orders=[];source.vitals=clone(source.initial);source.historyLog=[];source.historyCategories=[];source.examLog=[];source.examCounts={};source.reasoning=[];source.results=[];source.flags={};source.observedVitals=[];source.physiologyHistory=[];source.reviewed=false;
  return source;
}
function freshState(variantIndex=0){
  const patients={};for(const id of Object.keys(PHS_DATA.patients))patients[id]=createPatient(id,variantIndex);
  return {variantIndex,variant:PHS_DATA.variants[variantIndex],mode:'assessment',patients,patientOrder:patientOrder(),selectedId:null,started:false,running:false,ended:false,endReason:'',time:0,initialRanking:null,finalRanking:null,handoffs:{},timeline:[],ledger:[],pages:[],processes:[],staff:{nurse:{busyUntil:0,task:''},intern:{busyUntil:0,task:''}},teamRole:'',teamMessages:[],pendingReadback:null,readbacks:[],totalAttention:0,flags:{},pauseCount:0,coachedPauseActions:0,noraJudgment:null,finalPrompted:false};
}
function resetSimulation(variantIndex=state?.variantIndex??0){
  state=freshState(variantIndex);clearInterval(timerId);timerId=setInterval(realTimeTick,1000);
  $('intro').classList.remove('hidden');$('finalModal').classList.add('hidden');$('noraJudgmentModal').classList.add('hidden');$('debriefSection').classList.add('hidden');$('urgentBanner').classList.add('hidden');$('pauseBanner').classList.add('hidden');
  resetInputs();renderSignoutAndRankings();renderAll();
}
function resetInputs(){
  for(const id of ['historyInput','problemRepresentation','alternatives','immediatePlan','orderSearch','teamMessage','futureCommitment','noraJudgmentRationale'])if($(id))$(id).value='';
  if($('historySource'))$('historySource').value='parent';if($('confidence'))$('confidence').value='50';if($('confidenceValue'))$('confidenceValue').textContent='50%';if($('rankingError'))$('rankingError').textContent='';if($('finalError'))$('finalError').textContent='';if($('noraJudgmentError'))$('noraJudgmentError').textContent='';if($('noraCultureJudgment'))$('noraCultureJudgment').value='';
}
function addTimeline(text,patientId=null,kind='event'){state.timeline.unshift({time:state.time,text,patientId,kind});}
function addPage(patientId,title,text,urgent=false,key=''){
  if(key&&state.pages.some(page=>page.key===key))return;
  const page={id:`page-${Date.now()}-${Math.random()}`,key,patientId,title,text,urgent,createdAt:state.time,ackAt:null,responseAt:null,resolvedAt:null};state.pages.unshift(page);addTimeline(`Page received: ${title}.`,patientId,'page');
}
function markPageResponse(patientId){
  const page=state.pages.find(item=>item.patientId===patientId&&!item.responseAt&&item.ackAt!==null);if(page){page.responseAt=state.time;addTimeline(`Clinical response documented for page: ${page.title}.`,patientId,'page-response');}
}
function resolvePagesFor(patientId){for(const page of state.pages){if(page.patientId===patientId&&page.responseAt!==null&&page.resolvedAt===null)page.resolvedAt=state.time;}}
function addResult(patientId,orderId,title,text,tone='neutral',requiresInterpretation=false){
  const result={id:`result-${Date.now()}-${Math.random()}`,patientId,orderId,title,text,tone,availableAt:state.time,reviewedAt:null,interpretedAt:null,requiresInterpretation};state.patients[patientId].results.unshift(result);addTimeline(`Result available: ${title}.`,patientId,'result-available');addPage(patientId,`Result available: ${title}`,'A new result requires review.',tone==='bad'||tone==='critical',`result-${patientId}-${orderId}-${state.time}`);return result;
}
function canInteract(){return state.started&&!state.ended&&(state.running||state.mode==='practice');}
function spendAttention(seconds,label,patientId=null){
  if(!canInteract())return false;
  const start=state.time;let actual=seconds;
  if(state.running){advanceScenario(seconds,false);actual=Math.max(0,state.time-start);}else{state.coachedPauseActions+=1;actual=0;}
  state.totalAttention+=actual;state.ledger.unshift({start,end:state.time,seconds:actual,label,patientId,paused:!state.running});addTimeline(`${label}${state.running?` consumed ${fmtTime(actual)} of attention`:' performed during coached practice pause'}.`,patientId,'attention');renderAll();return !state.ended;
}
function realTimeTick(){if(!state.running||state.ended)return;advanceScenario(1,true);renderDynamic();}
function advanceScenario(seconds,background){for(let i=0;i<seconds;i++){if(state.ended)break;state.time+=1;updatePhysiology();fireScheduledEvents();completeDueProcesses();if(state.time%30===0)recordPhysiology();}if(!background)renderDynamic();}
function recordPhysiology(){for(const [id,p] of Object.entries(state.patients))p.physiologyHistory.push({time:state.time,...clone(p.vitals)});}
function observeVitals(patientId,source='repeat vital signs'){const p=state.patients[patientId];p.observedVitals.push({time:state.time,source,...clone(p.vitals)});addTimeline(`${source}: vital signs recorded.`,patientId,'observation');markPageResponse(patientId);}
function scheduleProcess(process){state.processes.push({...process,status:'pending'});}
function patientHasOrder(patientId,id,status=null){return state.patients[patientId].orders.some(order=>order.id===id&&(!status||order.status===status));}
function latestReasoning(patientId){const list=state.patients[patientId].reasoning;return list[list.length-1]||null;}
function updatePhysiology(){updateMaya();updateEli();updateNora();if(state.time>=900&&!state.ended)autoEnd('The scheduled shift interval ended.');}
function updateMaya(){
  const p=state.patients.maya,t=state.time,th=p.thresholds,pgeAt=p.flags.pgeStartedAt;
  if(!pgeAt){if(t>120)p.vitals.Lactate=Math.min(7.8,Number(p.vitals.Lactate)+0.006);if(t>=th.worsening){p.vitals.HR=Math.min(196,Number(p.vitals.HR)+0.035);p.vitals.RR=Math.min(78,Number(p.vitals.RR)+0.02);p.vitals.BP=t>=th.severe?'48/26':'56/32';p.vitals.SpO2=Math.max(88,Number(p.vitals.SpO2)-0.004);p.flags.worsened=true;}if(t>=th.severe)p.flags.critical=true;if(t>=th.terminal&&!p.flags.arrest){p.vitals.HR=58;p.vitals.BP='unobtainable';p.vitals.SpO2=72;p.vitals.Lactate=Math.max(7.5,Number(p.vitals.Lactate));p.flags.arrest=true;addTimeline('Maya develops profound bradycardia and pulseless collapse after progressive ductal closure.','maya','critical');autoEnd('Maya arrested before ductal-dependent systemic perfusion was restored.');}}
  else{const since=t-pgeAt,target=pgeAt<=240?2.5:pgeAt<=360?3.7:5.0;if(since>0){p.vitals.Lactate=Math.max(target,Number(p.vitals.Lactate)-0.008);p.vitals.HR=Math.max(pgeAt<=360?150:164,Number(p.vitals.HR)-0.045);p.vitals.SpO2=Math.min(96,Number(p.vitals.SpO2)+0.005);}if(since>=60){p.vitals.BP=pgeAt<=240?'70/44':pgeAt<=360?'64/38':'58/34';p.flags.responding=true;}if(since>=120)p.flags.stabilized=true;}
}
function updateEli(){const p=state.patients.eli;if(!p.flags.oxygenStarted&&!p.flags.hfncStarted&&state.time>180){p.vitals.SpO2=Math.max(85,Number(p.vitals.SpO2)-0.006);p.vitals.RR=Math.min(66,Number(p.vitals.RR)+0.012);p.flags.worsened=Number(p.vitals.SpO2)<89;}if(p.flags.suctioned)p.vitals.SpO2=Math.min(93,Number(p.vitals.SpO2)+0.002);if(p.flags.oxygenStarted)p.vitals.SpO2=Math.min(95,Number(p.vitals.SpO2)+0.008);if(p.flags.hfncStarted){p.vitals.SpO2=Math.min(97,Number(p.vitals.SpO2)+0.012);p.vitals.RR=Math.max(42,Number(p.vitals.RR)-0.02);p.flags.stabilized=true;}}
function updateNora(){const p=state.patients.nora;if(state.flags.noraPreliminary&&!p.flags.antibioticsStarted&&state.time>600){p.vitals.HR=Math.min(182,Number(p.vitals.HR)+0.018);p.vitals.Temp=Math.min(39.2,Number(p.vitals.Temp)+0.001);p.flags.worsened=true;}if(p.flags.antibioticsStarted&&p.flags.admitted)p.flags.stabilized=true;}
function fireScheduledEvents(){
  if(state.time>=210&&!state.flags.eliPage){state.flags.eliPage=true;addPage('eli','Ward nurse: Eli is desaturating','SpO₂ is persistently below the prior target despite repositioning.',true,'eli-desat');}
  if(state.time>=300&&!state.flags.noraPreliminary){state.flags.noraPreliminary=true;addPage('nora','Microbiology: positive blood culture','Preliminary blood culture is growing gram-positive cocci. Review collection details, reassess Nora, and make a provisional interpretation.',true,'nora-prelim');}
  if(state.time>=450&&!state.flags.noraSpeciationScheduled){state.flags.noraSpeciationScheduled=true;scheduleProcess({kind:'special',special:'nora-speciation',due:state.time+90});}
  if(state.time>=360&&!state.flags.jamalPage){state.flags.jamalPage=true;addPage('jamal','Jamal’s caregiver requests an update','His mother is asking whether a CT scan is being ordered.',false,'jamal-family');}
}
function completeDueProcesses(){for(const process of state.processes){if(process.status==='pending'&&process.due<=state.time){process.status='complete';completeProcess(process);}}}
function completeProcess(process){if(process.staff){state.staff[process.staff].busyUntil=state.time;state.staff[process.staff].task='';}if(process.kind==='order')completeOrder(process.patientId,process.orderId);if(process.kind==='delegation')completeDelegation(process);if(process.kind==='special')completeSpecial(process.special);}
function completeSpecial(special){
  if(special==='nora-speciation'&&!state.flags.noraSpeciated){state.flags.noraSpeciated=true;addResult('nora','speciation','Blood-culture speciation','Streptococcus agalactiae (group B Streptococcus) identified from the blood-culture bottle.','bad',true);addPage('nora','Microbiology: GBS identified','Definitive organism identification is available and requires action.',true,'nora-gbs');}
  if(special==='pge-apnea'&&!state.flags.pgeApneaResolved){const p=state.patients.maya;if(!p.flags.airwayReady){p.flags.pgeApnea=true;p.flags.critical=true;p.vitals.SpO2=68;p.vitals.HR=88;addTimeline('Maya develops apnea and bradycardia shortly after prostaglandin initiation without airway support immediately ready.','maya','critical');addPage('maya','Bedside emergency: apnea after prostaglandin','Maya is apneic with bradycardia and requires immediate ventilatory support.',true,'maya-apnea');}else addTimeline('Airway support was immediately available during prostaglandin initiation.','maya','safety');}
}
function autoEnd(reason){if(state.ended)return;state.running=false;state.ended=true;state.endReason=reason;renderAll();showDebrief();}
function currentOrder(patientId,orderId){return state.patients[patientId].orders.find(order=>order.id===orderId);}

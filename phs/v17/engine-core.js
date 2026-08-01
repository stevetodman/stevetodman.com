'use strict';
const $=id=>document.getElementById(id);
const clone=v=>JSON.parse(JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtTime=s=>`${String(Math.floor((s||0)/60)).padStart(2,'0')}:${String(Math.floor((s||0)%60)).padStart(2,'0')}`;
const hasTerms=(text,terms)=>terms.some(t=>text.includes(t));
const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
let state=null,timerId=null,learnerRecord=loadLearnerRecord();
const TEAM_ROLES=[{id:'nurse',label:'Bedside nurse'},{id:'intern',label:'Intern'},{id:'attending',label:'Supervising attending'},{id:'cardiology',label:'Cardiology / cardiac ICU'},{id:'parent',label:'Parent or caregiver'}];

async function loadCase(){
  if(window.__PHS_CASE__)return clone(window.__PHS_CASE__);
  const paths=['manifest','patients/maya','patients/eli','patients/nora','patients/jamal'];
  const responses=await Promise.all(paths.map(p=>fetch(`v17/cases/${p}.json?v=17`)));
  const failed=responses.find(r=>!r.ok);if(failed)throw new Error(`Case load failed: ${failed.status}`);
  const [manifest,maya,eli,nora,jamal]=await Promise.all(responses.map(r=>r.json()));
  return {...manifest,patients:{maya,eli,nora,jamal}};
}
function buildPatients(caseData,variant){
  const patients=clone(caseData.patients);
  for(const [id,p] of Object.entries(patients)){
    if(variant.signoutOverrides?.[id])p.signout=variant.signoutOverrides[id];
    p.vitals=clone(p.initialVitals);p.flags={};p.historyLog=[];p.examLog=[];p.examCounts={};p.reasoning=[];p.ordersPlaced=[];p.results=[];p.teamMessages=[];
    p.observedVitals=[{time:0,source:'Initial displayed vital signs',...clone(p.initialVitals)}];p.physiologyHistory=[{time:0,...clone(p.initialVitals)}];
  }return patients;
}
function shuffledPatientOrder(){const ids=['maya','eli','nora','jamal'];for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}if(ids[0]==='maya')ids.push(ids.shift());return ids;}
function createState(caseData,variantId,mode='assessment'){
  const variant=caseData.variants.find(v=>v.id===variantId)||caseData.variants[0];
  return {caseData,variant,mode,attemptNumber:learnerRecord.attempts.length+1,patients:buildPatients(caseData,variant),patientOrder:shuffledPatientOrder(),selectedId:null,activeTab:'history',teamRole:'',pendingReadback:null,started:false,running:false,ended:false,endReason:'',time:0,totalAttention:0,pauseCount:0,coachedPauseActions:0,initialRanking:null,finalRanking:null,handoffs:{},timeline:[],ledger:[],pages:[],processes:[],flags:{},noraJudgment:null,score:null,analytics:null,nextVariantId:null};
}
function chooseInitialVariant(caseData){if(learnerRecord.assignedVariant&&caseData.variants.some(v=>v.id===learnerRecord.assignedVariant))return learnerRecord.assignedVariant;return caseData.variants[learnerRecord.attempts.length%caseData.variants.length].id;}
function resetSimulation(caseData=state?.caseData,variantId=null,mode=null){if(timerId)clearInterval(timerId);state=createState(caseData,variantId||chooseInitialVariant(caseData),mode||state?.mode||'assessment');timerId=setInterval(realTimeTick,1000);renderAll();showPrebrief();}
function canInteract(){return state.started&&!state.ended&&(state.running||state.mode==='practice');}
function addTimeline(text,patientId=null,kind='event',meta={}){state.timeline.push({id:uid('event'),time:state.time,text,patientId,kind,meta});}
function spendAttention(seconds,label,patientId=null){
  if(!canInteract())return false;const start=state.time,pausedPractice=!state.running&&state.mode==='practice';let actual=0;
  if(pausedPractice)state.coachedPauseActions+=1;else{advanceScenario(seconds,false);actual=Math.max(0,state.time-start);state.totalAttention+=actual;}
  state.ledger.push({start,end:state.time,seconds:actual,label,patientId,pausedPractice});addTimeline(pausedPractice?`${label} performed during coached practice pause.`:`${label} consumed ${fmtTime(actual)} of learner attention.`,patientId,'attention');renderAll();return !state.ended;
}
function realTimeTick(){if(!state?.running||state.ended)return;advanceScenario(1,true);renderDynamic();}
function advanceScenario(seconds,background){for(let i=0;i<seconds;i++){if(state.ended)break;state.time+=1;updatePhysiology();fireScheduledEvents();completeProcesses();if(state.time%30===0)recordPhysiology();}if(!background)renderDynamic();}
function recordPhysiology(){for(const p of Object.values(state.patients))p.physiologyHistory.push({time:state.time,...clone(p.vitals)});}
function threshold(name){return state.variant.timingOverrides?.[name]??({mayaWorsening:180,mayaSevere:330,mayaTerminal:480}[name]);}
function orderRecord(pid,id){return state.patients[pid].ordersPlaced.find(o=>o.id===id)||null;}
function orderCompleted(pid,id){const o=orderRecord(pid,id);return !!o&&['available','reviewed','interpreted','complete'].includes(o.status);}
function updatePhysiology(){updateMaya();updateEli();updateNora();if(state.time>=900&&!state.ended)autoEnd('The scheduled shift interval ended.');}
function updateMaya(){
  const p=state.patients.maya,pgeAt=p.flags.pgeStartedAt;
  if(!pgeAt){if(state.time>120)p.vitals.Lactate=Math.min(7.8,Number(p.vitals.Lactate)+.006);if(state.time>=threshold('mayaWorsening')){p.flags.deteriorating=true;p.vitals.HR=Math.min(196,Number(p.vitals.HR)+.035);p.vitals.RR=Math.min(78,Number(p.vitals.RR)+.02);p.vitals.SpO2=Math.max(88,Number(p.vitals.SpO2)-.004);p.vitals.BP=state.time>=threshold('mayaSevere')?'48/26':'56/32';}if(state.time>=threshold('mayaSevere'))p.flags.critical=true;if(state.time>=threshold('mayaTerminal')&&!p.flags.arrest){p.flags.arrest=true;p.vitals={...p.vitals,HR:58,SpO2:72,BP:'unobtainable',Lactate:Math.max(7.5,Number(p.vitals.Lactate))};addTimeline('Maya develops profound bradycardia and pulseless collapse after progressive ductal closure.','maya','critical');autoEnd('Maya arrested before ductal-dependent systemic perfusion was restored.');}}
  else{const since=state.time-pgeAt,target=pgeAt<=240?2.5:pgeAt<=360?3.7:5;p.flags.postTreatment=true;p.vitals.Lactate=Math.max(target,Number(p.vitals.Lactate)-.008);p.vitals.HR=Math.max(pgeAt<=360?150:164,Number(p.vitals.HR)-.045);p.vitals.SpO2=Math.min(96,Number(p.vitals.SpO2)+.005);if(since>=60){p.vitals.BP=pgeAt<=240?'70/44':pgeAt<=360?'64/38':'58/34';p.flags.responding=true;}if(since>=120)p.flags.stabilized=true;}
}
function updateEli(){const p=state.patients.eli;if(state.time>180&&!p.flags.oxygenStarted&&!p.flags.hfncStarted){p.flags.deteriorating=true;p.vitals.SpO2=Math.max(85,Number(p.vitals.SpO2)-.006);p.vitals.RR=Math.min(66,Number(p.vitals.RR)+.012);}if(p.flags.oxygenStarted)p.vitals.SpO2=Math.min(95,Number(p.vitals.SpO2)+.008);if(p.flags.hfncStarted){p.flags.postTreatment=true;p.flags.stabilized=true;p.vitals.SpO2=Math.min(97,Number(p.vitals.SpO2)+.012);p.vitals.RR=Math.max(42,Number(p.vitals.RR)-.02);}}
function updateNora(){const p=state.patients.nora;if(state.flags.noraPreliminary&&!p.flags.antibioticsStarted&&state.time>600){p.flags.deteriorating=true;p.vitals.HR=Math.min(182,Number(p.vitals.HR)+.018);p.vitals.Temp=Math.min(39.2,Number(p.vitals.Temp)+.001);}if(p.flags.antibioticsStarted&&p.flags.admitted){p.flags.postTreatment=true;p.flags.stabilized=true;}}
function fireScheduledEvents(){if(state.time>=210&&!state.flags.eliPage){state.flags.eliPage=true;addPage('eli','Ward nurse: Eli is desaturating','SpO2 is persistently below the prior target despite repositioning.',true,'eli-desat');}if(state.time>=300&&!state.flags.noraPreliminary){state.flags.noraPreliminary=true;addPage('nora','Microbiology: positive blood culture','Preliminary blood culture is growing gram-positive cocci. Review collection details, reassess Nora, and make a provisional interpretation.',true,'nora-prelim');}if(state.time>=360&&!state.flags.jamalPage){state.flags.jamalPage=true;addPage('jamal','Jamal caregiver requests an update','His mother is asking whether a CT scan is being ordered.',false,'jamal-family');}}
function addPage(patientId,title,text,urgent=false,key=null){if(key&&state.pages.some(p=>p.key===key))return;state.pages.push({id:uid('page'),key,patientId,title,text,urgent,createdAt:state.time,ackAt:null,responseAt:null,resolvedAt:null});addTimeline(`Page received: ${title}.`,patientId,'page');}
function acknowledgePage(pageId){if(!canInteract())return;const page=state.pages.find(p=>p.id===pageId);if(!page||page.ackAt!=null)return;if(!spendAttention(10,`Acknowledge page: ${page.title}`,page.patientId))return;page.ackAt=state.time;selectPatient(page.patientId);addTimeline(`Page acknowledged: ${page.title}.`,page.patientId,'page-ack');renderAll();}
function markPageResponse(pid){for(const page of state.pages)if(page.patientId===pid&&page.responseAt==null){page.responseAt=state.time;addTimeline(`Clinical response began for page: ${page.title}.`,pid,'page-response');}}
function resolvePages(pid){for(const page of state.pages)if(page.patientId===pid&&page.responseAt!=null&&page.resolvedAt==null)page.resolvedAt=state.time;}
function scheduleProcess(process){state.processes.push({...process,id:uid('process'),status:'pending'});}
function completeProcesses(){for(const process of state.processes)if(process.status==='pending'&&process.due<=state.time){process.status='complete';if(process.kind==='order')completeOrder(process.patientId,process.orderId);if(process.kind==='special')completeSpecial(process.special);}}
function completeSpecial(special){if(special==='nora-speciation'&&!state.flags.noraSpeciated){state.flags.noraSpeciated=true;addResult('nora','speciation','Blood-culture speciation','Streptococcus agalactiae (group B Streptococcus) identified from the blood-culture bottle.','bad',true);addPage('nora','Microbiology: GBS identified','Definitive organism identification is available and requires action.',true,'nora-gbs');}if(special==='pge-apnea'&&!state.flags.pgeApneaResolved){const p=state.patients.maya;if(!p.flags.airwayReady){p.flags.pgeApnea=true;p.flags.critical=true;p.vitals.SpO2=68;p.vitals.HR=88;addTimeline('Maya develops apnea and bradycardia shortly after prostaglandin initiation without airway support immediately ready.','maya','critical');addPage('maya','Bedside emergency: apnea after prostaglandin','Maya is apneic with bradycardia and requires immediate ventilatory support.',true,'maya-apnea');}else addTimeline('Airway support was immediately available during prostaglandin initiation.','maya','safety');}}
function addResult(patientId,orderId,title,text,tone='neutral',requiresInterpretation=false){const result={id:uid('result'),patientId,orderId,title,text,tone,availableAt:state.time,reviewedAt:null,interpretedAt:null,actedAt:null,requiresInterpretation};state.patients[patientId].results.unshift(result);addTimeline(`Result available: ${title}.`,patientId,'result-available');addPage(patientId,`Result available: ${title}`,'A new result requires review.',tone==='bad',`result-${patientId}-${orderId}`);return result;}

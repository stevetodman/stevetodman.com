'use strict';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmtTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`;
const hasAny = (text, terms) => terms.some(term => text.includes(term));
const deepClone = value => JSON.parse(JSON.stringify(value));

const TEAM_ROLES = [
  {id:'nurse',label:'Bedside nurse',sub:'Updates and bedside tasks'},
  {id:'intern',label:'Intern',sub:'Parallel information gathering'},
  {id:'attending',label:'Supervising attending',sub:'Escalation and shared decisions'},
  {id:'cardiology',label:'Cardiology / cardiac ICU',sub:'Critical cardiac consultation'},
  {id:'parent',label:'Parent or caregiver',sub:'Explanation and shared plan'}
];

const CORRECT_RANKING = {maya:1,eli:2,nora:3,jamal:4};
let state;
let timerId;

function shuffle(items){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}

function createPatients(variantIndex){
  const patients=deepClone(BASE_PATIENTS);
  const variant=VARIANTS[variantIndex];
  patients.maya.signout=variant.mayaSignout;
  patients.maya.initial=deepClone(variant.mayaInitial);
  patients.maya.thresholds=deepClone(variant.mayaThresholds);
  for(const patient of Object.values(patients)){
    patient.orderCatalog=patient.orders;
    patient.orders=[];
    patient.vitals=deepClone(patient.initial);
    patient.historyLog=[];
    patient.historyCategories=[];
    patient.examLog=[];
    patient.examCounts={};
    patient.reasoning=[];
    patient.results=[];
    patient.flags={};
    patient.reviewed=false;
  }
  return patients;
}

function buildPatientOrder(){
  const order=shuffle(['maya','eli','nora','jamal']);
  if(order[0]==='maya') order.push(order.shift());
  return order;
}

function freshState(variantIndex=0){
  return {
    variantIndex,
    variant:VARIANTS[variantIndex],
    patients:createPatients(variantIndex),
    patientOrder:buildPatientOrder(),
    selectedId:null,
    started:false,
    running:false,
    ended:false,
    endReason:'',
    time:0,
    initialRanking:null,
    finalRanking:null,
    handoff:'',
    timeline:[],
    ledger:[],
    pages:[],
    processes:[],
    staff:{nurse:{busyUntil:0,task:''},intern:{busyUntil:0,task:''}},
    teamRole:'',
    teamMessages:[],
    pendingReadback:null,
    readbacks:[],
    totalAttention:0,
    flags:{},
    finalPrompted:false
  };
}

function resetSimulation(variantIndex=state?.variantIndex??0){
  state=freshState(variantIndex);
  clearInterval(timerId);
  timerId=setInterval(realTimeTick,1000);
  $('intro').classList.remove('hidden');
  $('finalModal').classList.add('hidden');
  $('debriefSection').classList.add('hidden');
  $('urgentBanner').classList.add('hidden');
  resetInputs();
  renderSignoutAndRankings();
  renderAll();
}

function resetInputs(){
  for(const id of ['historyInput','problemRepresentation','alternatives','immediatePlan','orderSearch','teamMessage','handoffText','futureCommitment']) if($(id)) $(id).value='';
  if($('historySource')) $('historySource').value='parent';
  if($('confidence')) $('confidence').value='50';
  if($('confidenceValue')) $('confidenceValue').textContent='50%';
  if($('rankingError')) $('rankingError').textContent='';
  if($('finalError')) $('finalError').textContent='';
}

function addTimeline(text,patientId=null,kind='event'){
  state.timeline.unshift({time:state.time,text,patientId,kind});
}

function addResult(patientId,title,text,tone='neutral'){
  const patient=state.patients[patientId];
  patient.results.unshift({time:state.time,title,text,tone});
}

function addPage(patientId,title,text,urgent=false){
  if(state.pages.some(page=>page.title===title)) return;
  state.pages.unshift({id:`page-${Date.now()}-${Math.random()}`,patientId,title,text,urgent,ack:false,time:state.time});
  addTimeline(`Page received: ${title}.`,patientId,'page');
}

function spendAttention(seconds,label,patientId=null){
  if(!state.started||state.ended) return false;
  const start=state.time;
  advanceScenario(seconds,false);
  const actual=Math.max(0,state.time-start);
  state.totalAttention+=actual;
  state.ledger.unshift({start,end:state.time,seconds:actual,label,patientId});
  addTimeline(`${label} consumed ${fmtTime(actual)} of learner attention.`,patientId,'attention');
  renderAll();
  return !state.ended;
}

function realTimeTick(){
  if(!state.running||state.ended) return;
  advanceScenario(1,true);
  renderDynamic();
}

function advanceScenario(seconds,background){
  for(let i=0;i<seconds;i++){
    if(state.ended) break;
    state.time+=1;
    updatePhysiology();
    fireScheduledPages();
    completeDueProcesses();
  }
  if(!background) renderDynamic();
}

function mayaHasOrder(id){return state.patients.maya.orders.some(order=>order.id===id&&order.status!=='cancelled');}
function patientHasOrder(patientId,id){return state.patients[patientId].orders.some(order=>order.id===id&&order.status!=='cancelled');}
function latestCommit(patientId){const list=state.patients[patientId].reasoning;return list[list.length-1]||null;}

function updatePhysiology(){
  updateMaya();
  updateEli();
  updateNora();
  if(state.time>=900&&!state.ended) autoEnd('The scheduled shift interval ended.');
}

function updateMaya(){
  const p=state.patients.maya;
  const t=state.time;
  const th=p.thresholds;
  const pgeAt=p.flags.pgeStartedAt;
  if(!pgeAt){
    if(t>120){p.vitals.Lactate=Math.min(7.8,Number(p.vitals.Lactate)+0.006);}
    if(t>=th.worsening){
      p.vitals.HR=Math.min(196,Number(p.vitals.HR)+0.035);
      p.vitals.RR=Math.min(78,Number(p.vitals.RR)+0.02);
      p.vitals.BP=t>=th.severe?'48/26':'56/32';
      p.vitals.SpO2=Math.max(88,Number(p.vitals.SpO2)-0.004);
      p.flags.worsened=true;
    }
    if(t>=th.severe){p.flags.critical=true;}
    if(t>=th.terminal){
      p.vitals.HR=58;p.vitals.BP='unobtainable';p.vitals.SpO2=72;p.vitals.Lactate=Math.max(7.5,Number(p.vitals.Lactate));
      p.flags.arrest=true;
      addTimeline('Maya develops profound bradycardia and pulseless collapse after progressive ductal closure.', 'maya','critical');
      autoEnd('Maya arrested before ductal-dependent systemic perfusion was restored.');
    }
  }else{
    const since=t-pgeAt;
    const target=pgeAt<=240?2.5:pgeAt<=360?3.7:5.0;
    if(since>0){
      p.vitals.Lactate=Math.max(target,Number(p.vitals.Lactate)-0.008);
      p.vitals.HR=Math.max(pgeAt<=360?150:164,Number(p.vitals.HR)-0.045);
      p.vitals.SpO2=Math.min(96,Number(p.vitals.SpO2)+0.005);
    }
    if(since>=60){
      p.vitals.BP=pgeAt<=240?'70/44':pgeAt<=360?'64/38':'58/34';
      p.flags.responding=true;
    }
    if(since>=120) p.flags.stabilized=true;
  }
}

function updateEli(){
  const p=state.patients.eli;
  if(!p.flags.suctioned&&!p.flags.oxygenStarted&&state.time>180){
    p.vitals.SpO2=Math.max(85,Number(p.vitals.SpO2)-0.006);
    p.vitals.RR=Math.min(66,Number(p.vitals.RR)+0.012);
  }
  if(p.flags.suctioned) p.vitals.SpO2=Math.min(93,Number(p.vitals.SpO2)+0.002);
  if(p.flags.oxygenStarted) p.vitals.SpO2=Math.min(96,Number(p.vitals.SpO2)+0.01);
}

function updateNora(){
  const p=state.patients.nora;
  if(state.flags.noraCulturePositive&&!p.flags.antibioticsStarted&&state.time>600){
    p.vitals.HR=Math.min(178,Number(p.vitals.HR)+0.015);
    p.vitals.Temp=Math.min(39.1,Number(p.vitals.Temp)+0.001);
    p.flags.worsened=true;
  }
}

function fireScheduledPages(){
  if(state.time>=210&&!state.flags.eliPage){
    state.flags.eliPage=true;
    addPage('eli','Ward nurse: Eli is desaturating','SpO₂ is now persistently below the prior target despite repositioning.',true);
  }
  if(state.time>=300&&!state.flags.noraCulture){
    state.flags.noraCulture=true;
    state.flags.noraCulturePositive=true;
    addPage('nora','Microbiology: positive blood culture','Preliminary blood culture is growing gram-positive cocci. Clinical correlation and reassessment are required.',true);
  }
  if(state.time>=360&&!state.flags.jamalPage){
    state.flags.jamalPage=true;
    addPage('jamal','Jamal’s caregiver requests an update','His mother is asking whether a CT scan is being ordered.',false);
  }
}

function scheduleProcess(process){
  state.processes.push({...process,status:'pending'});
}

function completeDueProcesses(){
  for(const process of state.processes){
    if(process.status==='pending'&&process.due<=state.time){
      process.status='complete';
      completeProcess(process);
    }
  }
}

function completeProcess(process){
  if(process.staff){
    state.staff[process.staff].busyUntil=state.time;
    state.staff[process.staff].task='';
  }
  if(process.kind==='order') completeOrder(process.patientId,process.orderId);
  if(process.kind==='delegation') completeDelegation(process);
}

function completeOrder(patientId,orderId){
  const p=state.patients[patientId];
  const order=p.orders.find(item=>item.id===orderId&&item.status==='pending');
  if(!order) return;
  order.status='complete';
  order.completedAt=state.time;
  const lactate=Number(p.vitals.Lactate).toFixed(1);
  const messages={
    maya:{
      monitoriv:['Monitoring and access','Continuous monitoring is active and vascular access is established.','good'],
      gas:['Blood gas and lactate',`Metabolic acidosis with lactate ${lactate} mmol/L.`,`bad`],
      cbc:['CBC and metabolic panel','No single laboratory pattern explains the differential perfusion; glucose is available and not profoundly low.','neutral'],
      culture:['Blood culture','Culture is collected; no immediate organism information is available.','neutral'],
      ecg:['Electrocardiogram','Sinus tachycardia with nonspecific repolarization changes.','neutral'],
      cxr:['Chest radiograph','Cardiomegaly with pulmonary vascular congestion.','warn'],
      echo:['Urgent echocardiogram','Critical narrowing of the aortic arch with restrictive ductal flow and impaired left-ventricular function.','bad'],
      pge:['Prostaglandin infusion','Infusion has started. Physiologic response will evolve over the next several minutes.','good'],
      smallfluid:['Cautious fluid aliquot','A small aliquot is complete. Perfusion requires immediate reassessment.','neutral'],
      bigbolus:['Rapid fluid bolus','Respiratory effort and hepatic congestion worsen after rapid volume expansion.','bad'],
      oxygen:['Supplemental oxygen','Saturation increases slightly; systemic perfusion remains impaired.','neutral'],
      antibiotics:['Empiric antibiotics','Antibiotics have started while bacterial infection remains in the differential.','neutral'],
      airway:['Airway readiness','Airway equipment and respiratory support are at the bedside.','good']
    },
    eli:{
      suction:['Nasal suction','Secretions are removed; aeration and saturation improve modestly.','good'],
      oxygen:['Supplemental oxygen','SpO₂ improves on low-flow oxygen.','good'],
      hydration:['Hydration support','Hydration support is established.','good'],
      viral:['Respiratory viral test','Respiratory syncytial virus detected.','neutral'],
      cxr:['Chest radiograph','Hyperinflation and peribronchial thickening without focal lobar consolidation.','neutral'],
      albuterol:['Bronchodilator trial','No sustained improvement in work of breathing.','neutral'],
      steroids:['Systemic corticosteroid','No immediate clinical change is observed.','neutral'],
      antibiotics:['Empiric antibiotics','Antibiotics have started. No focal bacterial source has yet been established.','neutral']
    },
    nora:{
      reviewculture:['Culture review','The positive culture is confirmed as a current specimen; contamination is not yet established.','warn'],
      cbcmarkers:['CBC and inflammatory markers','Inflammatory markers are elevated.','warn'],
      urine:['Urine studies','Urinalysis is concerning for infection; urine culture is pending.','warn'],
      lp:['CSF studies','CSF is obtained; cell count and culture are pending.','neutral'],
      antibiotics:['Empiric antibiotics','Antibiotics have started after cultures.','good'],
      observe:['Repeat observation','Vital signs and appearance are reassessed.','neutral']
    },
    jamal:{
      ecg:['Electrocardiogram','Normal sinus rhythm without ischemic or inflammatory changes.','good'],
      troponin:['High-sensitivity troponin','Troponin is not elevated.','good'],
      cxr:['Chest radiograph','No pneumothorax, focal opacity, or acute cardiopulmonary abnormality.','good'],
      chestct:['CT pulmonary angiography','No pulmonary embolism or acute thoracic abnormality.','neutral'],
      echo:['Echocardiogram','Normal ventricular function and no pericardial effusion.','good'],
      analgesia:['Analgesia reassessment','Pain improves and remains reproducible with chest-wall movement.','good'],
      discharge:['Discharge process','Counseling and return precautions are completed.','good']
    }
  };
  const [title,text,tone]=messages[patientId][orderId]||['Task complete','The requested task is complete.','neutral'];
  addResult(patientId,title,text,tone);
  addTimeline(`${title}: ${text}`,patientId,'result');
  applyOrderEffect(patientId,orderId);
}

function applyOrderEffect(patientId,orderId){
  const p=state.patients[patientId];
  if(patientId==='maya'){
    if(orderId==='pge'){p.flags.pgeStartedAt=state.time;p.flags.pgeOrdered=true;}
    if(orderId==='monitoriv') p.flags.monitoring=true;
    if(orderId==='bigbolus'){p.flags.bigBolus=true;p.vitals.RR=Math.min(82,Number(p.vitals.RR)+8);p.vitals.BP='54/30';p.vitals.Lactate=Math.min(8,Number(p.vitals.Lactate)+0.5);}
    if(orderId==='smallfluid') p.flags.smallFluid=true;
    if(orderId==='oxygen') p.vitals.SpO2=Math.min(99,Number(p.vitals.SpO2)+2);
    if(orderId==='antibiotics') p.flags.antibioticsStarted=true;
  }
  if(patientId==='eli'){
    if(orderId==='suction'){p.flags.suctioned=true;p.vitals.SpO2=Math.min(94,Number(p.vitals.SpO2)+2);p.vitals.RR=Math.max(40,Number(p.vitals.RR)-4);}
    if(orderId==='oxygen'){p.flags.oxygenStarted=true;p.vitals.SpO2=Math.min(97,Number(p.vitals.SpO2)+4);}
    if(orderId==='hydration') p.flags.hydration=true;
  }
  if(patientId==='nora'&&orderId==='antibiotics') p.flags.antibioticsStarted=true;
  if(patientId==='jamal'&&orderId==='discharge') p.flags.discharged=true;
}

function completeDelegation(process){
  const p=state.patients[process.patientId];
  if(process.taskId==='repeatVitals'){
    p.flags.delegatedRepeatVitals=true;
    addResult(process.patientId,'Delegated repeat vital signs',formatVitalsSentence(p),'neutral');
  }
  if(process.taskId==='ivmonitor'){
    p.flags.monitoring=true;
    addResult(process.patientId,'Delegated monitoring and access','The nurse establishes monitoring and vascular access.','good');
  }
  if(process.taskId==='fourbp'){
    p.examLog.push({id:'fourbp',time:state.time,finding:p.exams.find(x=>x.id==='fourbp').finding,delegated:true});
    p.examCounts.fourbp=(p.examCounts.fourbp||0)+1;
    addResult(process.patientId,'Delegated four-limb blood pressures',p.exams.find(x=>x.id==='fourbp').finding,'warn');
  }
  if(process.taskId==='focusedHistory'){
    const key=process.patientId==='maya'?'feeding':Object.keys(p.history)[0];
    if(!p.historyCategories.includes(key)) p.historyCategories.push(key);
    p.historyLog.push({time:state.time,source:'intern',question:'Delegated focused history',answer:p.history[key].parent});
    addResult(process.patientId,'Intern history update',p.history[key].parent,'neutral');
  }
  if(process.taskId==='reviewChart'){
    addResult(process.patientId,'Intern chart review',`The intern confirms the documented sign-out and identifies no prior definitive diagnosis for ${p.name}.`,'neutral');
  }
  if(process.taskId==='suction'){
    p.flags.suctioned=true;p.vitals.SpO2=Math.min(94,Number(p.vitals.SpO2)+2);
    addResult(process.patientId,'Delegated nasal suction','Secretions are removed and saturation improves modestly.','good');
  }
  if(process.taskId==='urine') addResult(process.patientId,'Delegated urine collection','Catheterized urine has been collected and sent.','neutral');
  if(process.taskId==='ecg') addResult(process.patientId,'Delegated ECG','ECG is available for review and shows sinus rhythm.','good');
  addTimeline(`${process.staff==='nurse'?'Bedside nurse':'Intern'} completed: ${process.label}.`,process.patientId,'delegation');
}

function autoEnd(reason){
  if(state.ended) return;
  state.ended=true;state.running=false;state.endReason=reason;
  $('urgentBanner').textContent=reason;$('urgentBanner').classList.remove('hidden');
  renderDynamic();
  showDebrief();
}

function formatVitalsSentence(p){
  return `HR ${Math.round(Number(p.vitals.HR))}, RR ${Math.round(Number(p.vitals.RR))}, SpO₂ ${Math.round(Number(p.vitals.SpO2))}%, BP ${p.vitals.BP}, temperature ${Number(p.vitals.Temp).toFixed(1)} °C.`;
}


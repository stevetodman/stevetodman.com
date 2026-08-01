'use strict';

function askHistory(){
  const patientId=state.selectedId;if(!patientId||!canInteract())return;
  const input=$('historyInput'),text=input.value.trim().toLowerCase();if(!text)return;
  const source=$('historySource').value,p=state.patients[patientId];if(!spendAttention(20,`Focused ${source} history`,patientId))return;
  let answer='I do not have additional information about that.';let category='other';
  for(const [key,item] of Object.entries(p.history)){if(hasTerms(text,item.terms)){answer=item[source]||item.parent;category=key;break;}}
  p.historyLog.push({time:state.time,source,question:input.value.trim(),answer,category});if(category!=='other'&&!p.historyCategories.includes(category))p.historyCategories.push(category);p.reviewed=true;input.value='';markPageResponse(patientId);renderAll();
}

function dynamicExamFinding(patientId,examId){
  const p=state.patients[patientId];
  if(patientId==='maya'){
    const post=!!p.flags.pgeStartedAt,critical=p.flags.critical,apnea=p.flags.pgeApnea;
    const map={
      appearance:apnea?'Apneic newborn with poor tone and minimal response to stimulation.':critical?'Gray, lethargic newborn with weak cry and markedly reduced feeding endurance.':post&&p.flags.responding?'More alert newborn with improved cry; feeding remains deferred during stabilization.':'Ill-appearing but responsive newborn with weak cry and poor feeding endurance.',
      respiratory:apnea?'No effective respiratory effort; assisted ventilation is required.':post?'Tachypnea persists but work of breathing is beginning to improve; lungs remain mostly clear.':'Tachypnea with mild subcostal retractions; lungs are mostly clear without focal crackles or wheeze.',
      cardiac:critical?'Marked tachycardia with gallop and a soft systolic murmur.':post?'Regular rhythm; gallop is less prominent after improved systemic perfusion.':'Tachycardic regular rhythm with a soft systolic murmur and gallop.',
      pulses:post&&p.flags.responding?'Femoral pulses are now palpable but remain weaker than brachial pulses; feet are warmer and capillary refill is improving.':critical?'Brachial pulses are present; femoral pulses are not palpable. Feet are cold and mottled with capillary refill over 5 seconds.':'Brachial pulses are 2+; femoral pulses are faint. Feet are cool and mottled with delayed capillary refill.',
      abdomen:post?'Liver edge remains enlarged but is no longer increasing.':'Liver edge is enlarged below the right costal margin; abdomen otherwise soft.',
      neuro:apnea?'Profoundly reduced responsiveness during apnea.':critical?'Lethargic with reduced tone and weak response to handling.':post?'Responsiveness and tone are improving with perfusion.':'Responsive to handling but tires quickly; tone is mildly reduced during feeding.',
      fourbp:post&&p.flags.responding?'Arm pressure 72/44; leg pressure 58/34. A residual gradient remains after ductal support.':critical?'Arm pressure 52/30; leg pressure unobtainable by cuff.':'Right arm 68/42, left arm 66/40, right leg 48/28, left leg 46/26.',
      ductalsats:post?'Right hand 96%; foot 94%. Saturation difference has narrowed, but perfusion remains the key response measure.':'Right hand 95%; foot 91%. The difference is present but is not diagnostic by itself.'
    };return map[examId];
  }
  if(patientId==='eli'){
    const improved=p.flags.hfncStarted||p.flags.oxygenStarted;const map={appearance:improved?'Arousable infant with improved interaction and less fatigue.':'Tired but arousable infant who tracks briefly and then settles.',respiratory:improved?'Retractions are milder with improved aeration; diffuse crackles remain.':'Moderate subcostal retractions with diffuse crackles and intermittent wheeze; aeration is reduced at the bases.',hydration:p.flags.hydration?'Mucous membranes are moist and perfusion is normalizing.':'Mucous membranes are mildly dry; capillary refill is about 2 seconds.',airway:p.flags.suctioned?'Nasal passages are temporarily clear after suction.':'Copious nasal secretions partially obstruct the nares.',neuro:improved?'More alert with improved endurance.':'Arouses to examination but tires quickly; no focal neurologic deficit.'};return map[examId];
  }
  if(patientId==='nora'){
    const worse=p.flags.worsened;const map={appearance:worse?'Febrile, irritable infant who is less easily consoled.':'Febrile but arousable infant with a strong cry and preserved interaction.',perfusion:worse?'Warm extremities with tachycardia and capillary refill near 3 seconds.':'Warm extremities, capillary refill under 2 seconds, mildly dry lips.',fontanelle:p.flags.csfAbnormal?'Fontanelle remains soft; subtle irritability is present without focal deficit.':'Anterior fontanelle is soft; tone is appropriate; no focal deficit.',skin:'No vesicles, petechiae, or focal cellulitis.',respiratory:'No retractions; lungs are clear.'};return map[examId];
  }
  const map={appearance:'Comfortable adolescent speaking in full sentences without distress.',cardiac:'Regular rhythm; no murmur, rub, or gallop.',respiratory:'Clear breath sounds without increased work of breathing.',chestwall:'Pain is reproduced with focal chest-wall palpation and trunk rotation.',legs:'No unilateral swelling, tenderness, or asymmetry.'};return map[examId];
}

function performExam(examId){
  const patientId=state.selectedId;if(!patientId||!canInteract())return;const p=state.patients[patientId],exam=p.exams.find(x=>x.id===examId);if(!exam)return;
  if(!spendAttention(exam.cost,`${exam.label}${p.examCounts[examId]? ' reassessment':''}`,patientId))return;
  const finding=dynamicExamFinding(patientId,examId);p.examCounts[examId]=(p.examCounts[examId]||0)+1;p.examLog.push({time:state.time,id:examId,label:exam.label,finding,count:p.examCounts[examId]});p.reviewed=true;markPageResponse(patientId);renderAll();
}
function repeatVitals(){const patientId=state.selectedId;if(!patientId||!canInteract())return;if(!spendAttention(20,'Repeat full vital signs',patientId))return;observeVitals(patientId,'Repeat vital signs');renderAll();}

function commitReasoning(){
  const patientId=state.selectedId;if(!patientId||!canInteract())return;
  const problem=$('problemRepresentation').value.trim(),diagnosis=$('diagnosisChoice').value,alternatives=$('alternatives').value.trim(),plan=$('immediatePlan').value.trim(),confidence=Number($('confidence').value);
  if(!problem||!diagnosis||!plan){showUrgent('Complete the problem representation, leading diagnosis, and immediate plan.');return;}
  if(!spendAttention(30,'Diagnostic reasoning commitment',patientId))return;
  state.patients[patientId].reasoning.push({time:state.time,problem,diagnosis,alternatives,plan,confidence});addTimeline(`Reasoning committed: ${diagnosis} (${confidence}% confidence).`,patientId,'reasoning');renderAll();
}

function orderVisible(patientId,item){if(patientId==='nora'&&item.id==='reviewculture'&&!state.flags.noraPreliminary)return false;return true;}
function placeOrder(orderId){
  const patientId=state.selectedId;if(!patientId||!canInteract())return;const p=state.patients[patientId],item=p.catalog.find(x=>x.id===orderId);if(!item||!orderVisible(patientId,item))return;
  if(currentOrder(patientId,orderId)){showUrgent(`${item.name} has already been ordered.`);return;}
  if(item.requiresCommit&&!latestReasoning(patientId)){showUrgent('Commit a provisional diagnosis and immediate plan before disease-specific treatment.');return;}
  if(!spendAttention(item.attention,`Order: ${item.name}`,patientId))return;
  const order={...clone(item),placedAt:state.time,status:'pending',availableAt:null,reviewedAt:null,interpretedAt:null,actedAt:null};p.orders.push(order);scheduleProcess({kind:'order',patientId,orderId,due:state.time+item.process});addTimeline(`Order placed: ${item.name}.`,patientId,'order');p.reviewed=true;markPageResponse(patientId);renderAll();
}

function completeOrder(patientId,orderId){
  const p=state.patients[patientId],order=p.orders.find(item=>item.id===orderId&&item.status==='pending');if(!order)return;order.status='available';order.availableAt=state.time;
  let title='Task complete',text='The requested task is complete.',tone='neutral',interpret=false;
  if(patientId==='maya'){
    const lactate=Number(p.vitals.Lactate).toFixed(1);const map={
      monitoriv:['Monitoring and access','Continuous cardiorespiratory monitoring is active and vascular access is established.','good',false],
      glucose:['Point-of-care glucose','Bedside glucose is 58 mg/dL. Hypoglycemia does not explain the current shock pattern.','good',true],
      gas:['Blood gas and lactate',`Metabolic acidosis is present; lactate is ${lactate} mmol/L.`,`bad`,true],
      cbc:['CBC and metabolic panel','CBC is nonspecific. Electrolytes do not establish a metabolic cause of shock.','neutral',true],
      culture:['Blood culture','Adequate-volume blood culture was collected before antibiotics; organism data are pending.','neutral',false],
      ecg:['Electrocardiogram','Sinus tachycardia with nonspecific repolarization changes.','neutral',true],
      cxr:['Chest radiograph','Cardiomegaly with pulmonary vascular congestion.','warn',true],
      echo:['Urgent echocardiogram','Severe discrete aortic coarctation with restrictive ductal flow, impaired left-ventricular function, and systemic hypoperfusion.','bad',true],
      pge:['Prostaglandin infusion','Infusion has started. Systemic pressure, perfusion, pH, and respiratory status require close reassessment.','good',false],
      antibiotics:['Empiric antibiotics','Empiric neonatal sepsis coverage has started while infection remains in the differential.','good',false],
      airway:['Airway readiness','Airway equipment and respiratory support are immediately available at bedside.','good',false],
      smallfluid:['Cautious fluid aliquot','A small aliquot is complete; perfusion and respiratory status require immediate reassessment.','neutral',false],
      bigbolus:['Rapid fluid bolus','Respiratory effort and hepatic congestion worsen after rapid volume expansion.','bad',false],
      oxygen:['Supplemental oxygen','Saturation increases slightly; systemic perfusion remains impaired.','neutral',false]
    };[title,text,tone,interpret]=map[orderId]||[title,text,tone,interpret];
  }else if(patientId==='eli'){
    const map={suction:['Nasal suction','Secretions are removed; aeration and saturation improve modestly.','good',false],oxygen:['Supplemental oxygen','SpO₂ improves on low-flow oxygen.','good',false],hfnc:['High-flow nasal cannula','Work of breathing and oxygenation begin to improve.','good',false],hydration:['Hydration support','Hydration support is established.','good',false],viral:['Respiratory viral test','Respiratory syncytial virus detected.','neutral',true],cxr:['Chest radiograph','Hyperinflation and peribronchial thickening without focal lobar consolidation.','neutral',true],albuterol:['Bronchodilator trial','No sustained improvement in work of breathing.','neutral',true],steroids:['Systemic corticosteroid','No immediate clinical change is observed.','neutral',true],antibiotics:['Empiric antibiotics','Antibiotics have started. No focal bacterial source is established.','neutral',false]};[title,text,tone,interpret]=map[orderId]||[title,text,tone,interpret];
  }else if(patientId==='nora'){
    const map={reviewculture:['Culture collection review','Single peripheral pediatric bottle; adequate volume documented; time to positivity 16 hours; preliminary gram-positive cocci. This information raises concern but does not alone determine pathogen versus contaminant.','warn',true],cbcmarkers:['CBC and inflammatory markers','Inflammatory markers are elevated.','warn',true],urine:['Urine studies','Catheterized urinalysis is not strongly suggestive of UTI; urine culture remains pending.','neutral',true],lp:['CSF studies','CSF shows pleocytosis with elevated protein; Gram stain is negative and culture is pending.','bad',true],antibiotics:['Empiric antibiotics','Parenteral antibiotics have started after cultures.','good',false],admit:['Admission','Nora is admitted for monitored parenteral therapy and pending culture management.','good',false],idconsult:['Infectious diseases consultation','Consultation is queued; recommendations will depend on organism and CSF findings.','neutral',false]};[title,text,tone,interpret]=map[orderId]||[title,text,tone,interpret];
  }else{
    const map={ecg:['Electrocardiogram','Normal sinus rhythm without ischemic or inflammatory changes.','good',true],troponin:['High-sensitivity troponin','Troponin is not elevated.','good',true],cxr:['Chest radiograph','No pneumothorax, focal opacity, or acute cardiopulmonary abnormality.','good',true],analgesia:['Analgesia reassessment','Pain improves and remains reproducible with chest-wall movement.','good',false],family:['Caregiver discussion','Risk assessment, uncertainty, and return precautions are explained.','good',false],discharge:['Discharge process','Follow-up and explicit return precautions are documented.','good',false],chestct:['CT pulmonary angiography','No pulmonary embolism or acute thoracic abnormality.','neutral',true],echo:['Echocardiogram','Normal ventricular function and no pericardial effusion.','good',true],cardiology:['Cardiology consultation','No indication for cardiac admission is identified from the available data.','neutral',true]};[title,text,tone,interpret]=map[orderId]||[title,text,tone,interpret];
  }
  addResult(patientId,orderId,title,text,tone,interpret);applyOrderEffect(patientId,orderId);renderAll();
}

function applyOrderEffect(patientId,orderId){
  const p=state.patients[patientId];
  if(patientId==='maya'){
    if(orderId==='monitoriv')p.flags.monitoring=true;
    if(orderId==='glucose')p.flags.glucoseChecked=true;
    if(orderId==='culture')p.flags.cultureCollected=true;
    if(orderId==='antibiotics')p.flags.antibioticsStarted=true;
    if(orderId==='airway'){p.flags.airwayReady=true;if(p.flags.pgeApnea){p.flags.pgeApnea=false;p.flags.critical=false;p.vitals.SpO2=92;p.vitals.HR=148;state.flags.pgeApneaResolved=true;addTimeline('Immediate ventilatory support resolves the prostaglandin-associated apnea.','maya','rescue');resolvePagesFor('maya');}}
    if(orderId==='pge'){p.flags.pgeStartedAt=state.time;p.flags.pgeOrdered=true;markResultActed('maya',['echo','gas']);if(!p.flags.airwayReady)scheduleProcess({kind:'special',special:'pge-apnea',due:state.time+45});}
    if(orderId==='bigbolus'){p.flags.bigBolus=true;p.vitals.RR=Math.min(82,Number(p.vitals.RR)+8);p.vitals.BP='54/30';p.vitals.Lactate=Math.min(8,Number(p.vitals.Lactate)+0.5);}
    if(orderId==='smallfluid')p.flags.smallFluid=true;
    if(orderId==='oxygen')p.flags.oxygenStarted=true;
  }
  if(patientId==='eli'){if(orderId==='suction')p.flags.suctioned=true;if(orderId==='oxygen')p.flags.oxygenStarted=true;if(orderId==='hfnc')p.flags.hfncStarted=true;if(orderId==='hydration')p.flags.hydration=true;}
  if(patientId==='nora'){if(orderId==='lp')p.flags.csfAbnormal=true;if(orderId==='antibiotics'){p.flags.antibioticsStarted=true;markResultActed('nora',['reviewculture','speciation']);}if(orderId==='admit')p.flags.admitted=true;}
  if(patientId==='jamal'){if(orderId==='chestct'||orderId==='echo'||orderId==='cardiology')p.flags.lowValueEscalation=true;if(orderId==='family')p.flags.familyUpdated=true;if(orderId==='discharge')p.flags.discharged=true;}
}
function markResultActed(patientId,orderIds){for(const result of state.patients[patientId].results){if(orderIds.includes(result.orderId)&&result.actedAt==null)result.actedAt=state.time;}}

function reviewResult(patientId,resultId){
  if(!canInteract())return;const result=state.patients[patientId].results.find(x=>x.id===resultId);if(!result||result.reviewedAt!==null)return;if(!spendAttention(10,`Review result: ${result.title}`,patientId))return;result.reviewedAt=state.time;const order=currentOrder(patientId,result.orderId);if(order)order.reviewedAt=state.time;state.pages.filter(p=>p.patientId===patientId&&p.title.includes(result.title)).forEach(p=>{if(p.ackAt===null)p.ackAt=state.time;if(p.responseAt===null)p.responseAt=state.time;p.resolvedAt=state.time;});addTimeline(`Result reviewed: ${result.title}.`,patientId,'result-review');if(patientId==='nora'&&result.orderId==='reviewculture'&&!state.noraJudgment)$('noraJudgmentModal').classList.remove('hidden');renderAll();
}
function interpretResult(patientId,resultId){
  if(!canInteract())return;const result=state.patients[patientId].results.find(x=>x.id===resultId);if(!result||result.reviewedAt===null||result.interpretedAt!==null)return;if(!spendAttention(10,`Interpret result: ${result.title}`,patientId))return;result.interpretedAt=state.time;const order=currentOrder(patientId,result.orderId);if(order)order.interpretedAt=state.time;addTimeline(`Result interpretation documented: ${result.title}.`,patientId,'result-interpret');renderAll();
}
function commitNoraJudgment(){
  if(!canInteract())return;const judgment=$('noraCultureJudgment').value,rationale=$('noraJudgmentRationale').value.trim();if(!judgment||!rationale){$('noraJudgmentError').textContent='Choose an interpretation and document your reasoning.';return;}if(!spendAttention(20,'Preliminary culture interpretation','nora'))return;state.noraJudgment={time:state.time,judgment,rationale};addTimeline(`Preliminary culture classified as ${judgment}.`,'nora','reasoning');$('noraJudgmentModal').classList.add('hidden');$('noraJudgmentError').textContent='';renderAll();
}

function selectTeamRole(roleId){state.teamRole=roleId;renderAll();}
function sendTeamMessage(){
  const patientId=state.selectedId,role=state.teamRole,message=$('teamMessage').value.trim();if(!patientId||!role||!message||!canInteract())return;if(!spendAttention(30,`Communicate with ${role}`,patientId))return;
  const reply=teamReply(role,patientId,message);state.teamMessages.push({time:state.time,patientId,role,message,reply});state.pendingReadback={patientId,role,reply};$('teamMessage').value='';markPageResponse(patientId);addTimeline(`Message sent to ${role}.`,patientId,'communication');renderAll();
}
function teamReply(role,patientId,message){
  const p=state.patients[patientId];if(role==='nurse')return`I heard your concern about ${p.name}. Please confirm the immediate bedside task and when you want me to call back.`;if(role==='intern')return`I can work in parallel. Please confirm the exact task, urgency, and what result needs escalation.`;if(role==='attending')return`Give me the illness severity, working diagnosis, immediate stabilization, and what decision you need from me.`;if(role==='cardiology')return patientId==='maya'?'I am treating this as a time-critical ductal-dependent systemic circulation concern. Confirm monitoring, airway readiness, prostaglandin status, and transfer plan.':'Tell me the specific cardiac red flags and what focused question you need answered.';return`Please explain what is happening, what you are doing now, and what changes should make me call for help.`;
}
function confirmReadback(){if(!state.pendingReadback||!canInteract())return;const {patientId,role}=state.pendingReadback;if(!spendAttention(10,`Confirm closed-loop read-back with ${role}`,patientId))return;state.readbacks.push({time:state.time,patientId,role});state.pendingReadback=null;addTimeline(`Closed-loop read-back confirmed with ${role}.`,patientId,'communication');renderAll();}

function delegationOptions(patientId){
  const common=[{id:'vitals',label:'Repeat and report vital signs',staff:'nurse',duration:45},{id:'history',label:'Obtain focused collateral history',staff:'intern',duration:90}];
  if(patientId==='maya')common.push({id:'airway',label:'Bring airway equipment to bedside',staff:'nurse',duration:30});
  if(patientId==='eli')common.push({id:'suction',label:'Perform nasal suction and report response',staff:'nurse',duration:35});
  return common;
}
function delegateTask(taskId){
  const patientId=state.selectedId;if(!patientId||!canInteract())return;const task=delegationOptions(patientId).find(x=>x.id===taskId);if(!task)return;const staff=state.staff[task.staff];if(staff.busyUntil>state.time){showUrgent(`${task.staff} is currently occupied.`);return;}if(!spendAttention(15,`Delegate: ${task.label}`,patientId))return;staff.busyUntil=state.time+task.duration;staff.task=task.label;scheduleProcess({kind:'delegation',patientId,taskId,staff:task.staff,due:staff.busyUntil,label:task.label});addTimeline(`${task.label} delegated to ${task.staff}.`,patientId,'delegation');renderAll();
}
function completeDelegation(process){
  const p=state.patients[process.patientId];if(process.taskId==='vitals'){observeVitals(process.patientId,'Delegated vital signs');addResult(process.patientId,'delegated-vitals','Delegated vital signs',`Current observations: HR ${Math.round(Number(p.vitals.HR))}, RR ${Math.round(Number(p.vitals.RR))}, SpO₂ ${Math.round(Number(p.vitals.SpO2))}%, BP ${p.vitals.BP}.`,'neutral',true);}if(process.taskId==='history'){const unseen=Object.keys(p.history).find(key=>!p.historyCategories.includes(key));if(unseen){p.historyCategories.push(unseen);p.historyLog.push({time:state.time,source:'intern',question:'Delegated focused collateral history',answer:p.history[unseen].nurse||p.history[unseen].parent,category:unseen});addResult(process.patientId,'delegated-history','Intern collateral history',p.history[unseen].nurse||p.history[unseen].parent,'neutral',false);}}
  if(process.taskId==='airway'){p.flags.airwayReady=true;addResult(process.patientId,'delegated-airway','Airway readiness','Airway equipment and respiratory support are at bedside.','good',false);}
  if(process.taskId==='suction'){p.flags.suctioned=true;addResult(process.patientId,'delegated-suction','Nasal suction','Secretions removed; saturation improves modestly.','good',false);}
  addTimeline(`Delegated task complete: ${process.label}.`,process.patientId,'delegation-result');renderAll();
}

function acknowledgePage(pageId){if(!canInteract())return;const page=state.pages.find(x=>x.id===pageId);if(!page||page.ackAt!==null)return;if(!spendAttention(5,`Acknowledge page: ${page.title}`,page.patientId))return;page.ackAt=state.time;state.selectedId=page.patientId;state.patients[page.patientId].reviewed=true;addTimeline(`Page acknowledged: ${page.title}.`,page.patientId,'page-ack');observeVitals(page.patientId,'Page-triggered bedside review');renderAll();}

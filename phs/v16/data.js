'use strict';

const PHS_DATA = {
  variants: [
    {id:'A',label:'Inherited reassurance',mayaSignout:'Six-day-old transferred for slow feeds and tachypnea. Mom is very worried, but the daytime team thought this was mostly feeding adjustment. She can probably be watched overnight.',thresholds:{worsening:180,severe:330,terminal:480}},
    {id:'B',label:'Inherited sepsis frame',mayaSignout:'Six-day-old with poor feeding and tachypnea. The referring team was worried about early sepsis, although she has not had a fever. Cultures have not yet been drawn.',thresholds:{worsening:210,severe:360,terminal:510}}
  ],
  correctRanking:{maya:1,eli:2,nora:3,jamal:4},
  patients:{
    maya:{
      name:'Maya Carter',age:'6-day-old',weight:'3.4 kg',room:'NICU 4',chief:'Poor feeding and tachypnea',correctDiagnosis:'Ductal-dependent systemic circulation / critical coarctation',
      diagnosisChoices:['Ductal-dependent systemic circulation / critical coarctation','Neonatal sepsis','Inborn error of metabolism','Myocarditis','Primary feeding difficulty'],
      initial:{HR:168,RR:62,SpO2:94,BP:'62/38',Temp:36.7,Lactate:3.1},
      history:{
        feeding:{terms:['feed','bottle','breast','eat','intake','sweat'],parent:'She takes less than half a bottle, sweats, and falls asleep during feeds.',nurse:'Intake is below half expected and she fatigues quickly.'},
        urine:{terms:['urine','wet diaper','diaper','pee','output'],parent:'Only one wet diaper since this morning.',nurse:'Urine output has fallen over several hours.'},
        onset:{terms:['when','start','onset','how long','progress','yesterday','today'],parent:'She seemed well after discharge, then became sleepier and breathed faster over about 12 hours.',nurse:'The decline has been progressive.'},
        color:{terms:['color','blue','cyan','pale','dusky','cold','cool','mottl'],parent:'Her feet look pale and feel colder than her hands. Her lips have stayed pink.',nurse:'Lower extremities are cooler and more mottled than upper extremities.'},
        breathing:{terms:['breath','respir','cough','congestion','wheeze'],parent:'She breathes fast during feeds but has no cough or congestion.',nurse:'Tachypnea is present without wheeze or prominent secretions.'},
        fever:{terms:['fever','temperature','infection','sick contact'],parent:'No fever at home and no sick contacts.',nurse:'She has remained afebrile.'},
        birth:{terms:['birth','pregnan','delivery','gestation','term','prenatal'],parent:'Born at 39 weeks after an uncomplicated pregnancy and delivery.',nurse:'Term newborn with an uncomplicated nursery course.'},
        screen:{terms:['screen','pulse ox','newborn test','heart test'],parent:'We were told the newborn oxygen screen was normal.',nurse:'Routine pulse-ox screening was documented as passed.'},
        family:{terms:['family','sudden death','heart disease','congenital'],parent:'No close relative has congenital heart disease or unexplained sudden death.',nurse:'No relevant family history is documented.'},
        meds:{terms:['medication','medicine','drug','allerg'],parent:'Only vitamin D. No known allergies.',nurse:'Only vitamin D; no known allergies.'}
      },
      exams:[
        {id:'appearance',label:'General appearance and feeding effort',cost:45},
        {id:'respiratory',label:'Respiratory examination',cost:40},
        {id:'cardiac',label:'Cardiac auscultation',cost:45},
        {id:'pulses',label:'Pulses, temperature, and perfusion',cost:50},
        {id:'abdomen',label:'Abdominal and liver examination',cost:35},
        {id:'neuro',label:'Neurologic responsiveness and tone',cost:30},
        {id:'fourbp',label:'Four-limb blood pressures',cost:45},
        {id:'ductalsats',label:'Preductal and postductal saturations',cost:30}
      ],
      orders:[
        {id:'monitoriv',name:'Cardiorespiratory monitoring and vascular access',attention:20,process:45,type:'Task'},
        {id:'glucose',name:'Point-of-care blood glucose',attention:10,process:5,type:'Laboratory'},
        {id:'gas',name:'Blood gas and lactate',attention:20,process:75,type:'Laboratory'},
        {id:'cbc',name:'Complete blood count and metabolic panel',attention:20,process:110,type:'Laboratory'},
        {id:'culture',name:'Blood culture before antibiotics',attention:20,process:150,type:'Laboratory'},
        {id:'ecg',name:'12-lead electrocardiogram',attention:20,process:75,type:'Diagnostic'},
        {id:'cxr',name:'Chest radiograph',attention:20,process:100,type:'Imaging'},
        {id:'echo',name:'Urgent transthoracic echocardiogram',attention:30,process:165,type:'Imaging'},
        {id:'pge',name:'Prostaglandin E1 infusion per neonatal critical-CHD protocol',attention:30,process:45,type:'Medication',requiresCommit:true},
        {id:'antibiotics',name:'Empiric neonatal sepsis antibiotics per institutional protocol',attention:30,process:50,type:'Medication',requiresCommit:true},
        {id:'airway',name:'Airway equipment and respiratory support to bedside',attention:15,process:25,type:'Task'},
        {id:'smallfluid',name:'Small cautious isotonic fluid aliquot with reassessment',attention:30,process:20,type:'Treatment'},
        {id:'bigbolus',name:'Rapid large-volume isotonic fluid bolus',attention:30,process:20,type:'Treatment'},
        {id:'oxygen',name:'Supplemental oxygen',attention:20,process:10,type:'Treatment'}
      ]
    },
    eli:{
      name:'Eli Ramirez',age:'8-month-old',weight:'8.1 kg',room:'Ward 3',chief:'Bronchiolitis with increasing work of breathing',signout:'Eight-month-old admitted with bronchiolitis. He finally fell asleep. He was around 90% on room air earlier; the floor team thinks he may just need time.',correctDiagnosis:'Bronchiolitis with hypoxemia and evolving respiratory distress',
      diagnosisChoices:['Bronchiolitis with hypoxemia and evolving respiratory distress','Bacterial pneumonia','Reactive airway disease','Foreign-body aspiration','Normal post-viral recovery'],initial:{HR:148,RR:48,SpO2:90,BP:'86/52',Temp:37.8,Lactate:1.5},
      history:{
        onset:{terms:['when','start','onset','days'],parent:'Congestion started three days ago; breathing worsened today.',nurse:'Work of breathing has increased during the evening.'},
        feeding:{terms:['feed','bottle','intake','drink','hydration'],parent:'He is taking about half his bottles.',nurse:'Oral intake is reduced and urine output is borderline.'},
        apnea:{terms:['apnea','stop breathing','blue','cyan'],parent:'No pauses or blue spells.',nurse:'No documented apnea.'},
        suction:{terms:['suction','secretions','nose'],parent:'Suctioning helps briefly.',nurse:'Nasal secretions reaccumulate quickly.'},
        fever:{terms:['fever','temperature'],parent:'Low fever yesterday, none very high.',nurse:'Temperature has remained below 38.5 °C.'},
        history:{terms:['premature','birth','heart','lung','medical'],parent:'Born at term with no heart or lung disease.',nurse:'No prematurity or chronic cardiopulmonary disease.'}
      },
      exams:[{id:'appearance',label:'General appearance and interaction',cost:35},{id:'respiratory',label:'Respiratory effort and auscultation',cost:45},{id:'hydration',label:'Hydration and perfusion',cost:35},{id:'airway',label:'Nasal airway and secretions',cost:25},{id:'neuro',label:'Fatigue and neurologic status',cost:30}],
      orders:[
        {id:'suction',name:'Nasal suction and repositioning',attention:30,process:10,type:'Treatment'},
        {id:'oxygen',name:'Low-flow supplemental oxygen',attention:20,process:10,type:'Treatment'},
        {id:'hfnc',name:'Escalate to high-flow nasal cannula',attention:30,process:40,type:'Treatment',requiresCommit:true},
        {id:'hydration',name:'Enteral or IV hydration support',attention:30,process:40,type:'Treatment'},
        {id:'viral',name:'Respiratory viral testing',attention:20,process:100,type:'Laboratory'},
        {id:'cxr',name:'Chest radiograph',attention:20,process:100,type:'Imaging'},
        {id:'albuterol',name:'Bronchodilator trial',attention:20,process:15,type:'Medication'},
        {id:'steroids',name:'Systemic corticosteroid',attention:20,process:15,type:'Medication'},
        {id:'antibiotics',name:'Empiric parenteral antibiotics',attention:30,process:50,type:'Medication',requiresCommit:true}
      ]
    },
    nora:{
      name:'Nora Williams',age:'5-week-old',weight:'4.6 kg',room:'ED 8',chief:'Fever with cultures pending',signout:'Five-week-old with fever, currently well appearing. The ED sent cultures and is waiting. I would not disturb her unless something results.',correctDiagnosis:'Febrile young infant with possible invasive bacterial infection',
      diagnosisChoices:['Febrile young infant with possible invasive bacterial infection','Viral syndrome','Urinary tract infection','Meningitis','Environmental overheating'],initial:{HR:156,RR:38,SpO2:98,BP:'78/46',Temp:38.2,Lactate:1.8},
      history:{
        onset:{terms:['when','start','onset','fever'],parent:'The fever started this afternoon and reached 38.4 °C rectally.',nurse:'Fever was confirmed in the ED.'},
        feeding:{terms:['feed','bottle','intake'],parent:'Still feeding, but less vigorously.',nurse:'Oral intake is mildly reduced.'},
        urine:{terms:['urine','diaper','pee'],parent:'Wet diapers are still present.',nurse:'Urine output is preserved.'},
        behavior:{terms:['behavior','sleep','irritable','letharg'],parent:'Sleepier but wakes for feeds.',nurse:'Arousable and consolable.'},
        birth:{terms:['birth','pregnan','delivery','gestation'],parent:'Born at term without complications.',nurse:'No perinatal complications documented.'},
        exposure:{terms:['sick','contact','herpes','rash'],parent:'Older brother has a runny nose. No cold sores at home.',nurse:'No documented HSV risk factors.'}
      },
      exams:[{id:'appearance',label:'General appearance and consolability',cost:35},{id:'perfusion',label:'Perfusion and hydration',cost:30},{id:'fontanelle',label:'Fontanelle and neurologic examination',cost:35},{id:'skin',label:'Skin and mucosal examination',cost:30},{id:'respiratory',label:'Respiratory examination',cost:30}],
      orders:[
        {id:'reviewculture',name:'Review blood-culture collection details',attention:20,process:10,type:'Information'},
        {id:'cbcmarkers',name:'CBC and inflammatory markers',attention:20,process:75,type:'Laboratory'},
        {id:'urine',name:'Catheterized urinalysis and urine culture',attention:30,process:100,type:'Laboratory'},
        {id:'lp',name:'Lumbar puncture with CSF studies',attention:180,process:150,type:'Procedure',requiresCommit:true},
        {id:'antibiotics',name:'Empiric parenteral antibiotics',attention:30,process:50,type:'Medication',requiresCommit:true},
        {id:'admit',name:'Admit for monitored parenteral therapy',attention:30,process:45,type:'Disposition'},
        {id:'idconsult',name:'Infectious diseases consultation',attention:20,process:120,type:'Consultation'}
      ]
    },
    jamal:{
      name:'Jamal Brooks',age:'15-year-old',weight:'62 kg',room:'ED 11',chief:'Chest pain with distressed caregiver',signout:'Fifteen-year-old with chest pain. His mother is very anxious and is asking for a scan. The pain sounds musculoskeletal, but they may need reassurance.',correctDiagnosis:'Likely musculoskeletal chest pain without current high-risk features',
      diagnosisChoices:['Likely musculoskeletal chest pain without current high-risk features','Myocarditis or pericarditis','Pulmonary embolism','Pneumothorax','Acute coronary syndrome'],initial:{HR:104,RR:20,SpO2:99,BP:'124/72',Temp:37.0,Lactate:1.2},
      history:{
        pain:{terms:['pain','describe','quality','sharp','pressure'],parent:'He says it is sharp and worse when he twists.',nurse:'Pain is reproducible with movement and palpation.'},
        exertion:{terms:['exercise','exert','sport','running','syncope','faint'],parent:'It did not start with exercise, and he has not fainted.',nurse:'No exertional syncope or collapse.'},
        breathing:{terms:['breath','shortness','dyspnea','cough'],parent:'He is not short of breath and has no cough.',nurse:'Respiratory status is normal.'},
        infection:{terms:['fever','viral','sick','covid'],parent:'Mild cold two weeks ago but no current fever.',nurse:'No current infectious symptoms.'},
        clot:{terms:['travel','clot','leg','immobil','estrogen'],parent:'No long travel, leg swelling, surgery, or clot history.',nurse:'No thromboembolic risk factor identified.'},
        family:{terms:['family','sudden death','heart'],parent:'No sudden unexplained death or inherited heart disease.',nurse:'Family cardiac history is noncontributory.'}
      },
      exams:[{id:'appearance',label:'General appearance',cost:25},{id:'cardiac',label:'Cardiac examination',cost:35},{id:'respiratory',label:'Respiratory examination',cost:30},{id:'chestwall',label:'Chest-wall palpation and range of motion',cost:30},{id:'legs',label:'Lower-extremity examination',cost:25}],
      orders:[
        {id:'ecg',name:'12-lead electrocardiogram',attention:20,process:60,type:'Diagnostic'},
        {id:'troponin',name:'High-sensitivity troponin',attention:20,process:90,type:'Laboratory'},
        {id:'cxr',name:'Chest radiograph',attention:20,process:100,type:'Imaging'},
        {id:'analgesia',name:'Analgesia and reassessment',attention:20,process:30,type:'Treatment'},
        {id:'family',name:'Explain risk assessment and return precautions',attention:60,process:10,type:'Communication'},
        {id:'discharge',name:'Discharge with follow-up and return precautions',attention:45,process:30,type:'Disposition',requiresCommit:true},
        {id:'chestct',name:'CT pulmonary angiography',attention:90,process:240,type:'Imaging',requiresCommit:true},
        {id:'echo',name:'Echocardiogram',attention:25,process:180,type:'Imaging'},
        {id:'cardiology',name:'Cardiology admission consultation',attention:30,process:180,type:'Consultation'}
      ]
    }
  }
};

(()=>{
  'use strict';

  const questions=window.PEDCARD_DATA?.QUESTIONS;
  if(!Array.isArray(questions))return;

  const byId=id=>questions.find(question=>question.id===id);

  const ebsteinRepair=byId(28);
  if(ebsteinRepair){
    ebsteinRepair.wrong={
      1:'The Lecompte maneuver is used during an arterial switch operation to bring the pulmonary arteries anterior to the aorta; it does not reconstruct the tricuspid valve.',
      2:'The Warden procedure repairs selected partial anomalous pulmonary venous return patterns involving the superior vena cava; it is not an Ebstein valve repair.',
      3:'The Damus–Kaye–Stansel procedure connects the pulmonary root to the aorta in selected single-ventricle or systemic-outflow-obstruction pathways; it does not repair the tricuspid valve.'
    };
  }

  const truncusReintervention=byId(12);
  if(truncusReintervention){
    Object.assign(truncusReintervention,{
      o:[
        'The fixed-size RV–PA conduit can become relatively small as the child grows and may degenerate; truncal-valve and branch-pulmonary-artery disease can also evolve',
        'Routine coronary-artery reimplantation at neonatal truncus repair predisposes survivors to progressive coronary ostial stenosis',
        'VSD closure after truncus repair leaves an obligatory residual left-to-right shunt that predictably worsens with growth',
        'The embryologic failure of conotruncal septation commonly recurs and reopens the repaired truncal defect'
      ],
      a:0,
      e:'Later procedures are common because the RV–PA conduit does not grow and can stenose or become insufficient. Truncal-valve regurgitation and branch-pulmonary-artery stenosis may also progress, so even an excellent neonatal result requires lifelong surveillance.'
    });
    truncusReintervention.wrong={
      1:'Coronary transfer is a key part of an arterial switch operation, not routine truncus arteriosus repair. Coronary ostial stenosis is therefore not the usual mechanism driving later procedures after truncus repair.',
      2:'A well-repaired VSD should not leave an obligatory residual shunt. A residual VSD can occur, but it is not an expected consequence that progressively worsens with somatic growth.',
      3:'The developmental error that produces truncus arteriosus does not recur after surgical repair. Late procedures address acquired or residual structural problems, especially the RV–PA conduit, truncal valve, or branch pulmonary arteries.'
    };
  }

  const atrialSwitch=byId(42);
  if(atrialSwitch){
    atrialSwitch.o[2]='The tricuspid valve remains a low-pressure pulmonary atrioventricular valve, so progressive tricuspid regurgitation is not a major late concern';
    atrialSwitch.wrong={
      ...(atrialSwitch.wrong||{}),
      2:'After an atrial switch, the morphologic RV is the systemic ventricle and its tricuspid valve is the systemic atrioventricular valve. Systemic tricuspid regurgitation is an important late complication, not a trivial low-pressure lesion.'
    };
  }

  const rossProcedure=byId(23);
  if(rossProcedure){
    rossProcedure.o=[
      'The patient’s pulmonary autograft',
      'A cryopreserved pulmonary homograft',
      'A mechanical prosthetic aortic valve',
      'A stented bioprosthetic aortic valve'
    ];
    rossProcedure.wrong={
      1:'A pulmonary homograft commonly reconstructs the RV outflow tract after the native pulmonary root has been moved. It does not become the new aortic valve in a Ross procedure.',
      2:'A mechanical prosthesis is an alternative form of aortic valve replacement, but implanting one is not a Ross procedure.',
      3:'A stented bioprosthesis is also an alternative aortic valve replacement strategy, not the defining autograft transfer of a Ross procedure.'
    };
  }

  const yasuiOperation=byId(21);
  if(yasuiOperation){
    yasuiOperation.o=[
      'A Rastelli repair that routes LV output through the VSD directly to the native aorta and uses an RV–PA conduit',
      'Biventricular LVOT bypass using VSD-to-pulmonary-root/neoaortic pathway plus RV-PA conduit in suitable anatomy',
      'A Norwood-based single-ventricle pathway that creates a neoaorta and supplies pulmonary blood flow with a shunt or RV–PA conduit',
      'A Ross–Konno operation using a pulmonary autograft and aortoventriculoplasty to enlarge the native LVOT'
    ];
    yasuiOperation.wrong={
      0:'Rastelli directs LV blood through the VSD to the native aorta. Yasui instead bypasses a critically small or atretic native LVOT by directing LV output to the pulmonary root/neoaorta pathway.',
      2:'Norwood is a single-ventricle palliation pathway. Yasui is selected when anatomy permits preservation of a biventricular circulation despite severe LVOT obstruction.',
      3:'Ross–Konno enlarges the native LVOT and replaces the aortic root with a pulmonary autograft. Yasui creates an alternate systemic outflow pathway and includes RV–PA reconstruction.'
    };
  }

  const pdaLigation=byId(36);
  if(pdaLigation){
    pdaLigation.o=[
      'When closure is indicated but catheter/medical strategies are unsuitable or unsuccessful',
      'For a hemodynamically significant PDA with anatomy readily amenable to transcatheter device closure and no contraindication to catheter therapy',
      'For a duct-dependent congenital lesion before another reliable source of systemic or pulmonary blood flow has been established',
      'For a small, hemodynamically insignificant PDA solely because a continuous murmur is audible'
    ];
    pdaLigation.wrong={
      1:'When device closure is anatomically feasible and there is no reason to avoid a catheter approach, transcatheter closure is generally favored over surgery. Surgical ligation is reserved for selected circumstances.',
      2:'In duct-dependent circulation, the PDA may be essential for systemic or pulmonary blood flow. Closing it before definitive stabilization or repair can cause rapid cardiovascular collapse.',
      3:'The presence of a murmur alone does not establish that surgery is needed. Decisions about PDA closure consider hemodynamic effect, anatomy, patient population, and the suitability of less invasive options.'
    };
  }

  const coarctationSurveillance=byId(7);
  if(coarctationSurveillance){
    Object.assign(coarctationSurveillance,{
      q:'After coarctation repair, which coexisting or late aortic concern warrants lifelong surveillance?',
      o:[
        'A congenital bicuspid aortic valve, if present, with potential valve dysfunction and ascending-aortic dilation',
        'Isolated tricuspid atresia as an expected late complication of arch repair',
        'ALCAPA developing in nearly every patient after coarctation repair',
        'Obligate total anomalous pulmonary venous return after the repaired arch'
      ],
      a:0,
      e:'A bicuspid aortic valve is congenital—not acquired after repair—and commonly coexists with coarctation. If present, its valve function and associated aortopathy require longitudinal surveillance; repaired coarctation also warrants ongoing arch and blood-pressure follow-up.'
    });
    coarctationSurveillance.wrong={
      1:'Tricuspid atresia is a distinct congenital lesion and is not an expected late consequence of coarctation repair.',
      2:'ALCAPA is a separate congenital coronary anomaly. It does not develop as a typical late complication after coarctation repair.',
      3:'TAPVR is a separate congenital pulmonary venous anomaly, not an obligatory finding after repair of coarctation.'
    };
  }

  const completeAvsd=byId(3);
  if(completeAvsd){
    completeAvsd.o=[
      'A common atrioventricular junction with a shared atrioventricular valve',
      'Separate atrioventricular junctions with independent mitral and tricuspid valves',
      'A malaligned ventricular septum with aortic override and infundibular narrowing',
      'Pulmonary venous drainage through an extracardiac confluence before left-atrial entry'
    ];
    completeAvsd.wrong={
      1:'Separate atrioventricular junctions with distinct mitral and tricuspid valves describe the usual valve anatomy in an isolated ASD plus VSD, not complete AVSD.',
      2:'Malalignment VSD, aortic override, and infundibular narrowing are the defining anatomic features of tetralogy of Fallot.',
      3:'An extracardiac pulmonary venous confluence before left-atrial entry is characteristic of total anomalous pulmonary venous return.'
    };
  }

  const septalMyectomy=byId(39);
  if(septalMyectomy){
    septalMyectomy.o=[
      'Dynamic LV outflow tract obstruction from hypertrophied septal myocardium',
      'Fixed valvar aortic stenosis caused by commissural fusion at the aortic valve',
      'Primary mitral regurgitation from leaflet prolapse without septal obstruction',
      'Diastolic dysfunction from diffuse myocardial fibrosis without a significant LVOT gradient'
    ];
    septalMyectomy.wrong={
      1:'Myectomy removes septal muscle and does not treat fixed valvar aortic stenosis. Valvar disease requires valve-directed evaluation and treatment.',
      2:'When mitral regurgitation is caused by primary leaflet prolapse without obstructive septal anatomy, valve repair rather than septal myectomy addresses the lesion.',
      3:'Myectomy relieves dynamic LVOT obstruction; it does not reverse diffuse fibrosis or treat nonobstructive diastolic dysfunction in the absence of a meaningful gradient.'
    };
  }

  const criticalCoarctation=byId(6);
  if(criticalCoarctation){
    criticalCoarctation.o=[
      'Treat presumed sepsis with fluid boluses and defer prostaglandin until diagnostic studies are complete',
      'Begin prostaglandin E1 to maintain ductal patency while preparing definitive arch repair',
      'Perform balloon atrial septostomy to improve interatrial mixing and systemic oxygen delivery',
      'Administer indomethacin to reduce ductal flow and limit pulmonary overcirculation'
    ];
    criticalCoarctation.wrong={
      0:'Sepsis evaluation and cautious resuscitation may be appropriate, but a critically ill neonate with suspected ductal-dependent systemic flow should receive prostaglandin without waiting for a complete diagnostic workup.',
      2:'Balloon atrial septostomy is used to improve mixing in selected lesions such as d-TGA. It does not restore lower-body systemic flow across a critically obstructed arch.',
      3:'Indomethacin promotes ductal constriction. In critical coarctation, the ductus may supply essential systemic blood flow, so it should be maintained rather than closed.'
    };
  }

  const norwoodOutflow=byId(13);
  if(norwoodOutflow){
    norwoodOutflow.o[2]='Create a restrictive atrial septum to limit atrial-level mixing';
    norwoodOutflow.wrong={
      ...(norwoodOutflow.wrong||{}),
      2:'In Norwood physiology, unobstructed atrial mixing and egress are essential. A restrictive atrial septum can impair pulmonary venous return and worsen hemodynamics rather than create systemic outflow.'
    };
  }

  const wardenProcedure=byId(11);
  if(wardenProcedure){
    Object.assign(wardenProcedure,{
      q:'Which pulmonary venous anatomy is most appropriately repaired with a Warden procedure rather than a standard TAPVR repair?',
      o:[
        'Right upper pulmonary veins entering the high SVC with a superior sinus venosus ASD',
        'All pulmonary veins joining a supracardiac confluence that drains through a vertical vein',
        'All pulmonary veins draining to the coronary sinus through a common venous confluence',
        'An isolated left upper pulmonary vein draining to the innominate vein without SVC involvement'
      ],
      a:0,
      e:'The Warden procedure is designed for PAPVR entering the high SVC, usually with a superior sinus venosus ASD. It baffles anomalous pulmonary venous flow to the left atrium while reconnecting the SVC to the right atrial appendage. TAPVR instead requires connection of the pulmonary venous confluence to the left atrium.'
    });
    wardenProcedure.wrong={
      1:'This is supracardiac TAPVR. Repair connects the common pulmonary venous confluence to the left atrium and addresses the vertical-vein pathway; a Warden procedure is not the standard repair.',
      2:'This is cardiac TAPVR draining through the coronary sinus. The surgical goal is to establish normal pulmonary venous drainage to the left atrium, not to perform a high-SVC Warden repair.',
      3:'This is a left-sided PAPVR pattern without high-SVC involvement. It may require another tailored repair strategy, but it does not evoke the classic Warden anatomy.'
    };
  }

  const aorticStenosis=byId(38);
  if(aorticStenosis){
    aorticStenosis.o=[
      'Valvar stenosis may undergo balloon valvuloplasty, whereas a discrete subaortic membrane usually needs surgical resection',
      'Balloon dilation is the preferred initial treatment for either lesion because postoperative recurrence is uncommon',
      'Surgical valve replacement is indicated for either lesion because both obstructions arise at the aortic valve',
      'Subaortic membrane can be observed long term because it rarely progresses or recurs after surgical resection'
    ];
    aorticStenosis.wrong={
      1:'Balloon valvuloplasty is often useful for congenital valvar aortic stenosis, but a discrete subaortic membrane is an anatomic subvalvar obstruction that generally requires surgical resection. Recurrence after membrane resection is a recognized concern.',
      2:'A discrete subaortic membrane lies below an otherwise separate aortic valve. Valve replacement is not its usual treatment; resection targets the subvalvar obstruction.',
      3:'Subaortic membrane may progress and can recur after resection, so longitudinal surveillance is important rather than simple observation.'
    };
  }

  const doubleAorticArch=byId(26);
  if(doubleAorticArch){
    doubleAorticArch.o=[
      'Divide the non-dominant arch segment completing the ring and release airway/esophageal compression',
      'Resect the dominant arch segment and reconstruct the remaining arch as the sole systemic outflow pathway',
      'Perform posterior aortopexy as the initial operation without dividing either arch segment',
      'Place an endovascular stent across one arch segment to enlarge the vascular ring'
    ];
    doubleAorticArch.wrong={
      1:'The dominant arch supplies the primary systemic pathway and is usually preserved. Dividing the non-dominant arch breaks the ring while maintaining reliable systemic perfusion.',
      2:'Posterior aortopexy can be considered for selected persistent airway compression or tracheobronchomalacia, but it does not by itself divide the vascular ring formed by a double aortic arch.',
      3:'A double aortic arch is an external vascular ring rather than a focal intraluminal stenosis. Standard repair releases compression by surgical division of the non-dominant arch.'
    };
  }

  const tofObjectives=byId(4);
  if(tofObjectives){
    tofObjectives.o=[
      'Relieve RV outflow obstruction but intentionally leave the malalignment VSD open to decompress the RV',
      'Close the VSD to commit LV output to the aorta and adequately relieve RV outflow obstruction',
      'Close the VSD and accept significant residual RV outflow obstruction to preserve the pulmonary annulus at all costs',
      'Use a transannular patch routinely even when a competent pulmonary valve can be preserved'
    ];
    tofObjectives.a=1;
    tofObjectives.e='Complete TOF repair closes the malalignment VSD and relieves multilevel RV outflow obstruction. Contemporary strategy also aims to limit ventriculotomy and preserve pulmonary-valve competence when anatomy permits, but significant fixed residual obstruction should not be accepted solely to spare the valve.';
  }

  const stagedPalliation=byId(41);
  if(stagedPalliation){
    stagedPalliation.o=[
      'Staged palliation rather than restoration of normal two-ventricle anatomy',
      'A staged ventricular-recruitment strategy intended to convert the circulation to routine biventricular anatomy',
      'A sequence in which Glenn routes both caval returns to the pulmonary arteries and Fontan later restores a subpulmonary ventricle',
      'A progressive anatomic repair that returns both ventricles to normal serial pumping'
    ];
    stagedPalliation.a=0;
    stagedPalliation.e='The Norwood–Glenn–Fontan pathway is staged single-ventricle palliation. Glenn directs SVC return to the pulmonary arteries; Fontan later adds IVC/hepatic venous return. Neither stage recreates a normal subpulmonary ventricle or routine biventricular anatomy.';
  }

  const synthesis=byId(44);
  if(synthesis){
    Object.assign(synthesis,{
      cat:'TOF',
      q:'During complete tetralogy of Fallot repair, the pulmonary annulus is borderline small. Which principle best guides RVOT reconstruction?',
      o:[
        'Preserve the pulmonary valve at all costs, even if significant fixed RVOT obstruction remains',
        'Achieve adequate RVOT relief while limiting ventriculotomy and preserving pulmonary-valve competence when anatomy permits',
        'Use an RV-PA conduit routinely because it eliminates future RVOT reintervention',
        'Leave the VSD partially open to reduce postoperative RV pressure'
      ],
      a:1,
      e:'Contemporary TOF repair balances adequate relief of RV outflow obstruction with preservation of RV myocardium and pulmonary-valve competence when feasible. Significant fixed residual obstruction should not be accepted solely to spare the valve; transannular patching, valve reconstruction, or conduit strategies depend on anatomy.'
    });
  }
})();

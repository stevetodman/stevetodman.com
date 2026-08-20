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

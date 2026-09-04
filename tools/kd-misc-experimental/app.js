(() => {
  'use strict';

  const EVIDENCE_VERSION = '0.1';

  const evidenceRegistry = Object.freeze([
    Object.freeze({
      id: 'fan-gi', input: 'gi', direction: 'misc', title: 'Gastrointestinal involvement',
      claim: 'Gastrointestinal symptoms were more prominent in MIS-C than Kawasaki disease in comparative literature and remain a useful phenotype discriminator.',
      source: 'Fan et al., Hospital Pediatrics 2023; AHA KD update 2024',
      population: 'Non-severe MIS-C vs prepandemic iKD without coronary involvement; broader KD vs MIS-C evidence reviewed by AHA.',
      limitation: 'Association, not a rule-in finding; gastrointestinal symptoms can occur in KD.'
    }),
    Object.freeze({
      id: 'fan-thrombocytopenia', input: 'thrombocytopenia', direction: 'misc', title: 'Thrombocytopenia',
      claim: 'Thrombocytopenia was more frequent in non-severe MIS-C than iKD in the Fan cohort.',
      source: 'Fan et al., Hospital Pediatrics 2023',
      population: '68 non-severe MIS-C vs 28 prepandemic iKD patients without coronary involvement.',
      limitation: 'The study was retrospective and the iKD comparator was prepandemic.'
    }),
    Object.freeze({
      id: 'fan-lymphopenia', input: 'lymphopenia', direction: 'misc', title: 'Lymphopenia',
      claim: 'Lymphopenia was more frequent in non-severe MIS-C than iKD in the Fan cohort.',
      source: 'Fan et al., Hospital Pediatrics 2023',
      population: '68 non-severe MIS-C vs 28 prepandemic iKD patients without coronary involvement.',
      limitation: 'Use the treating laboratory context; this workbench does not invent a diagnostic lymphocyte cutoff.'
    }),
    Object.freeze({
      id: 'fan-pyuria', input: 'pyuria', direction: 'kd', title: 'Pyuria',
      claim: 'Pyuria was more frequent in iKD than non-severe MIS-C in the Fan cohort.',
      source: 'Fan et al., Hospital Pediatrics 2023',
      population: '68 non-severe MIS-C vs 28 prepandemic iKD patients without coronary involvement.',
      limitation: 'Pyuria is nonspecific and does not establish iKD.'
    }),
    Object.freeze({
      id: 'starnes-lvef', input: 'lvef-low', direction: 'misc', title: 'LVEF <55%',
      claim: 'Reduced LVEF was more frequent in MIS-C and was retained in the published Starnes MIS-C-versus-KD prediction model.',
      source: 'Starnes et al., Journal of Hospital Medicine 2024',
      population: '105 MIS-C vs 602 complete/incomplete KD patients.',
      limitation: 'The model was internally validated and requires external validation; this tool does not calculate its probability.'
    }),
    Object.freeze({
      id: 'lee-coronary', input: 'coronary-aneurysm', direction: 'kd', title: 'Coronary aneurysm / max Z ≥2.5',
      claim: 'Coronary aneurysms were more prevalent and more severe in contemporaneous KD than MIS-C in the IKDR cohort.',
      source: 'Lee et al., Journal of the American Heart Association 2025',
      population: '1,191 MIS-C vs 554 contemporaneous KD patients in the International Kawasaki Disease Registry.',
      limitation: 'Coronary involvement also occurred in MIS-C; this finding does not exclude MIS-C.'
    }),
    Object.freeze({
      id: 'walton-ntprobnp', input: 'ntprobnp', direction: 'misc', title: 'NT-proBNP ≥1500 ng/L',
      claim: 'This threshold at presentation was associated with MIS-C versus KD in a contemporaneous IKDR biomarker study.',
      source: 'Walton et al., Pediatric Cardiology 2023',
      population: '118 KD vs 946 MIS-C patients with cardiac biomarker testing and echocardiography.',
      limitation: 'Reported specificity was 77% in that cohort. Units, timing, assay context, and population matter; this is not a universal diagnostic cutoff.'
    }),
    Object.freeze({
      id: 'walton-tni', input: 'troponin-i', direction: 'misc', title: 'Troponin I ≥20 ng/L',
      claim: 'This threshold at presentation was associated with MIS-C versus KD in a contemporaneous IKDR biomarker study.',
      source: 'Walton et al., Pediatric Cardiology 2023',
      population: '118 KD vs 946 MIS-C patients with cardiac biomarker testing and echocardiography.',
      limitation: 'Reported specificity was 89% in that cohort. Troponin assay and units must be appropriate; this is not a universal diagnostic cutoff.'
    }),
    Object.freeze({
      id: 'lippi-ddimer', input: 'ddimer', direction: 'misc', title: 'Marked D-dimer elevation',
      claim: 'A meta-analysis found D-dimer values higher in MIS-C than KD across included multicenter cohorts.',
      source: 'Lippi et al., Diagnosis (Berl) 2024',
      population: 'Three multicenter cohorts; 270 MIS-C and 217 KD patients.',
      limitation: 'No harmonized diagnostic discriminator threshold was established; this input is deliberately qualitative.'
    }),
    Object.freeze({
      id: 'aha-rash', input: 'rash', direction: 'context', title: 'Polymorphous rash',
      claim: 'Principal Kawasaki phenotype feature; also overlaps with MIS-C.',
      source: 'AHA Kawasaki Disease scientific statement update 2024',
      population: 'Kawasaki disease diagnostic framework.',
      limitation: 'Displayed as phenotype context only; the application does not count KD criteria.'
    }),
    Object.freeze({
      id: 'aha-conjunctivitis', input: 'conjunctivitis', direction: 'context', title: 'Bilateral non-exudative conjunctival injection',
      claim: 'Principal Kawasaki phenotype feature; also overlaps with MIS-C.',
      source: 'AHA Kawasaki Disease scientific statement update 2024',
      population: 'Kawasaki disease diagnostic framework.',
      limitation: 'Displayed as phenotype context only; the application does not count KD criteria.'
    }),
    Object.freeze({
      id: 'aha-oral', input: 'oral', direction: 'context', title: 'Oral / lip changes',
      claim: 'Principal Kawasaki phenotype feature; also overlaps with MIS-C.',
      source: 'AHA Kawasaki Disease scientific statement update 2024',
      population: 'Kawasaki disease diagnostic framework.',
      limitation: 'Displayed as phenotype context only; the application does not count KD criteria.'
    }),
    Object.freeze({
      id: 'aha-extremity', input: 'extremity', direction: 'context', title: 'Extremity changes',
      claim: 'Principal Kawasaki phenotype feature; also overlaps with MIS-C.',
      source: 'AHA Kawasaki Disease scientific statement update 2024',
      population: 'Kawasaki disease diagnostic framework.',
      limitation: 'Displayed as phenotype context only; the application does not count KD criteria.'
    }),
    Object.freeze({
      id: 'aha-nodes', input: 'nodes', direction: 'context', title: 'Cervical lymphadenopathy',
      claim: 'Principal Kawasaki phenotype feature.',
      source: 'AHA Kawasaki Disease scientific statement update 2024',
      population: 'Kawasaki disease diagnostic framework.',
      limitation: 'Displayed as phenotype context only; the application does not count KD criteria.'
    }),
    Object.freeze({
      id: 'cdc-hospitalized', input: 'hospitalized', direction: 'context', title: 'Hospitalization',
      claim: 'Clinical severity requiring hospitalization or resulting in death is a component of the current CSTE/CDC MIS-C surveillance definition.',
      source: 'CSTE/CDC MIS-C surveillance definition, effective 2023',
      population: 'Public-health surveillance for persons younger than 21 years.',
      limitation: 'The CDC definition is for surveillance, not individual diagnosis or management.'
    }),
    Object.freeze({
      id: 'cdc-crp', input: 'crp3', direction: 'context', title: 'CRP ≥3.0 mg/dL (30 mg/L)',
      claim: 'This CRP threshold is a systemic-inflammation component of the current CSTE/CDC MIS-C surveillance definition.',
      source: 'CSTE/CDC MIS-C surveillance definition, effective 2023',
      population: 'Public-health surveillance for persons younger than 21 years.',
      limitation: 'The CDC definition is for surveillance; this threshold is not an iKD-versus-MIS-C diagnostic cutoff.'
    }),
    Object.freeze({
      id: 'cdc-sarscov2', input: 'sarscov2', direction: 'context', title: 'SARS-CoV-2 laboratory / epidemiologic evidence',
      claim: 'SARS-CoV-2 laboratory evidence or qualifying epidemiologic linkage is part of current MIS-C surveillance classification.',
      source: 'CSTE/CDC MIS-C surveillance definition, effective 2023',
      population: 'Public-health surveillance for persons younger than 21 years.',
      limitation: 'Prior infection/seropositivity can coexist with alternative diagnoses; surveillance evidence is not diagnostic proof.'
    }),
    Object.freeze({
      id: 'cdc-shock', input: 'shock', direction: 'context', title: 'Shock',
      claim: 'Shock is a distinct organ-system category in the current CSTE/CDC MIS-C surveillance definition.',
      source: 'CSTE/CDC MIS-C surveillance definition, effective 2023',
      population: 'Public-health surveillance for persons younger than 21 years.',
      limitation: 'Displayed individually; this application does not count organ-system categories.'
    }),
    Object.freeze({
      id: 'cdc-platelet', input: 'platelet150', direction: 'context', title: 'Platelet count <150,000/µL',
      claim: 'This threshold is one hematologic component of the current CSTE/CDC MIS-C surveillance definition.',
      source: 'CSTE/CDC MIS-C surveillance definition, effective 2023',
      population: 'Public-health surveillance for persons younger than 21 years.',
      limitation: 'Displayed individually; this application does not determine whether the surveillance definition is met.'
    }),
    Object.freeze({
      id: 'cdc-alc', input: 'alc1000', direction: 'context', title: 'ALC <1,000/µL',
      claim: 'This threshold is one hematologic component of the current CSTE/CDC MIS-C surveillance definition.',
      source: 'CSTE/CDC MIS-C surveillance definition, effective 2023',
      population: 'Public-health surveillance for persons younger than 21 years.',
      limitation: 'Displayed individually; this application does not determine whether the surveillance definition is met.'
    })
  ]);

  const evidenceInputs = [...document.querySelectorAll('[data-evidence-input]')];
  const modelInputs = [...document.querySelectorAll('[data-model-input]')];
  const miscContainer = document.getElementById('misc-evidence');
  const kdContainer = document.getElementById('kd-evidence');
  const contextContainer = document.getElementById('context-evidence');
  const stateElement = document.getElementById('evidence-state');
  const modelStatus = document.getElementById('model-status');
  const form = document.getElementById('workbench-form');

  function selectedYes(inputId) {
    const control = document.getElementById(inputId);
    return control && control.value === 'yes';
  }

  function makeEvidenceCard(item) {
    const article = document.createElement('article');
    article.className = 'evidence-card';
    article.dataset.evidenceId = item.id;

    const heading = document.createElement('h4');
    heading.textContent = item.title;
    article.appendChild(heading);

    const claim = document.createElement('p');
    claim.textContent = item.claim;
    article.appendChild(claim);

    const meta = document.createElement('div');
    meta.className = 'evidence-meta';

    const source = document.createElement('span');
    const sourceLabel = document.createElement('strong');
    sourceLabel.textContent = 'Source: ';
    source.append(sourceLabel, item.source);
    meta.appendChild(source);

    const population = document.createElement('span');
    const populationLabel = document.createElement('strong');
    populationLabel.textContent = 'Population: ';
    population.append(populationLabel, item.population);
    meta.appendChild(population);

    const limitation = document.createElement('span');
    const limitationLabel = document.createElement('strong');
    limitationLabel.textContent = 'Limit: ';
    limitation.append(limitationLabel, item.limitation);
    meta.appendChild(limitation);

    article.appendChild(meta);
    return article;
  }

  function renderList(container, items, emptyText) {
    container.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }
    for (const item of items) container.appendChild(makeEvidenceCard(item));
  }

  function updateSelectState(select) {
    select.dataset.state = select.value;
  }

  function renderEvidence() {
    const selected = evidenceRegistry.filter((item) => selectedYes(item.input));
    const misc = selected.filter((item) => item.direction === 'misc');
    const kd = selected.filter((item) => item.direction === 'kd');
    const context = selected.filter((item) => item.direction === 'context');

    renderList(miscContainer, misc, 'No source-attributed MIS-C-associated findings selected.');
    renderList(kdContainer, kd, 'No source-attributed iKD/KD-associated findings selected.');
    renderList(contextContainer, context, 'No context findings selected.');

    stateElement.className = 'evidence-state';
    if (misc.length && kd.length) {
      stateElement.textContent = 'DISCORDANT EVIDENCE — BOTH PHENOTYPES REPRESENTED';
      stateElement.classList.add('discordant');
    } else if (misc.length || kd.length) {
      stateElement.textContent = 'ONE-SIDED PUBLISHED ASSOCIATIONS PRESENT — NOT A DIAGNOSIS';
      stateElement.classList.add('one-sided');
    } else {
      stateElement.textContent = 'INSUFFICIENT DISCRIMINATING DATA';
    }
  }

  function renderModelAvailability() {
    const labels = new Map([
      ['model-age', 'age'],
      ['model-sodium', 'sodium'],
      ['model-platelet', 'platelet count'],
      ['model-alt', 'ALT'],
      ['model-crp', 'CRP'],
      ['model-lvef', 'LVEF classification']
    ]);

    const available = [];
    const notAvailable = [];
    const unknown = [];

    for (const input of modelInputs) {
      const label = labels.get(input.id) || input.id;
      if (input.value === 'available') available.push(label);
      else if (input.value === 'unavailable') notAvailable.push(label);
      else unknown.push(label);
    }

    modelStatus.replaceChildren();
    const prefix = document.createElement('strong');
    prefix.textContent = 'Input-availability audit only. ';
    modelStatus.appendChild(prefix);

    const details = document.createElement('span');
    const parts = [];
    parts.push(`Available: ${available.length ? available.join(', ') : 'none marked'}.`);
    parts.push(`Not available: ${notAvailable.length ? notAvailable.join(', ') : 'none marked'}.`);
    parts.push(`Unknown: ${unknown.length ? unknown.join(', ') : 'none'}.`);
    details.textContent = `${parts.join(' ')} No model result is calculated.`;
    modelStatus.appendChild(details);
  }

  function renderAll() {
    evidenceInputs.forEach(updateSelectState);
    modelInputs.forEach(updateSelectState);
    renderEvidence();
    renderModelAvailability();
  }

  evidenceInputs.forEach((input) => input.addEventListener('change', renderAll));
  modelInputs.forEach((input) => input.addEventListener('change', renderAll));

  form.addEventListener('reset', (event) => {
    event.preventDefault();
    for (const input of evidenceInputs) input.value = 'unknown';
    for (const input of modelInputs) input.value = 'unknown';
    renderAll();
  });

  document.documentElement.dataset.evidenceVersion = EVIDENCE_VERSION;
  renderAll();
})();

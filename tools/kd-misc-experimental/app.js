(() => {
  'use strict';

  const registry = window.KDMiscEvidence;
  if (!registry) throw new Error('KD/MIS-C evidence registry failed to load.');

  const {
    EVIDENCE_VERSION,
    sourceLock,
    sources,
    evidence: evidenceRegistry,
    studySignals,
    excludedFromBedsideEncoding,
  } = registry;

  const evidenceInputs = [...document.querySelectorAll('[data-evidence-input]')];
  const modelInputs = [...document.querySelectorAll('[data-model-input]')];
  const miscContainer = document.getElementById('misc-evidence');
  const kdContainer = document.getElementById('kd-evidence');
  const contextContainer = document.getElementById('context-evidence');
  const signalContainer = document.getElementById('study-signals');
  const exclusionContainer = document.getElementById('excluded-encoding');
  const sourceLockElement = document.getElementById('source-lock-status');
  const stateElement = document.getElementById('evidence-state');
  const modelStatus = document.getElementById('model-status');
  const form = document.getElementById('workbench-form');

  function selectedYes(inputId) {
    const control = document.getElementById(inputId);
    return control && control.value === 'yes';
  }

  function addMetaRow(meta, label, text) {
    const row = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    row.append(strong, text);
    meta.appendChild(row);
  }

  function makeEvidenceCard(item) {
    const source = sources[item.sourceKey];
    const article = document.createElement('article');
    article.className = 'evidence-card';
    article.dataset.evidenceId = item.id;

    const heading = document.createElement('h4');
    heading.textContent = item.title;
    article.appendChild(heading);

    const tier = document.createElement('p');
    tier.className = 'evidence-tier';
    tier.textContent = item.tier;
    article.appendChild(tier);

    const effect = document.createElement('p');
    const effectLabel = document.createElement('strong');
    effectLabel.textContent = 'Published result: ';
    effect.append(effectLabel, item.effect);
    article.appendChild(effect);

    const claim = document.createElement('p');
    claim.textContent = item.claim;
    article.appendChild(claim);

    const meta = document.createElement('div');
    meta.className = 'evidence-meta';
    addMetaRow(meta, 'Source', source.short);
    addMetaRow(meta, 'Population', source.population);
    addMetaRow(meta, 'Design', source.design);
    addMetaRow(meta, 'Limit', item.limitation);
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

  function renderStudySignals() {
    signalContainer.replaceChildren();
    for (const signal of studySignals) {
      const article = document.createElement('article');
      article.className = 'evidence-card';
      const heading = document.createElement('h4');
      heading.textContent = signal.title;
      const direction = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${signal.direction}. `;
      direction.append(strong, signal.detail);
      const note = document.createElement('p');
      note.className = 'section-note';
      note.textContent = signal.whyNoInput;
      article.append(heading, direction, note);
      signalContainer.appendChild(article);
    }
  }

  function renderExclusions() {
    exclusionContainer.replaceChildren();
    for (const text of excludedFromBedsideEncoding) {
      const li = document.createElement('li');
      li.textContent = text;
      exclusionContainer.appendChild(li);
    }
  }

  function renderSourceLock() {
    sourceLockElement.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = 'M1B exact-paper lock: ';
    sourceLockElement.append(strong, sourceLock.statement);
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
    renderList(contextContainer, context, 'No overlap, guideline, or surveillance context selected.');

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
      ['model-lvef', 'LVEF classification'],
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
    const details = document.createElement('span');
    details.textContent = `Available: ${available.length ? available.join(', ') : 'none marked'}. Not available: ${notAvailable.length ? notAvailable.join(', ') : 'none marked'}. Unknown: ${unknown.length ? unknown.join(', ') : 'none'}. No model result is calculated.`;
    modelStatus.append(prefix, details);
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
  renderStudySignals();
  renderExclusions();
  renderSourceLock();
  renderAll();
})();
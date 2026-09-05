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
  const applicabilityInputs = [...document.querySelectorAll('[data-applicability-input]')];
  const modelInputs = [...document.querySelectorAll('[data-model-input]')];
  const caseInputs = [...new Map([...evidenceInputs, ...applicabilityInputs].map(input => [input.id, input])).values()];
  const miscContainer = document.getElementById('misc-evidence');
  const kdContainer = document.getElementById('kd-evidence');
  const contextContainer = document.getElementById('context-evidence');
  const signalContainer = document.getElementById('study-signals');
  const exclusionContainer = document.getElementById('excluded-encoding');
  const sourceLockElement = document.getElementById('source-lock-status');
  const stateElement = document.getElementById('evidence-state');
  const summaryElement = document.getElementById('likelihood-summary');
  const completenessElement = document.getElementById('data-completeness');
  const applicabilityElement = document.getElementById('applicability-state');
  const modelStatus = document.getElementById('model-status');
  const form = document.getElementById('workbench-form');

  function value(inputId) {
    return document.getElementById(inputId)?.value || 'unknown';
  }

  function selectedYes(inputId) {
    return value(inputId) === 'yes';
  }

  function addMetaRow(meta, label, text) {
    const row = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    row.append(strong, text);
    meta.appendChild(row);
  }

  function makeEvidenceGroup(items) {
    const article = document.createElement('article');
    article.className = 'evidence-card evidence-group';

    const heading = document.createElement('h4');
    heading.textContent = items[0].title;
    article.appendChild(heading);

    for (const item of items) {
      const source = sources[item.sourceKey];
      const sourceBlock = document.createElement('section');
      sourceBlock.className = 'evidence-source';
      sourceBlock.dataset.evidenceId = item.id;

      const tier = document.createElement('p');
      tier.className = 'evidence-tier';
      tier.textContent = item.tier;

      const effect = document.createElement('p');
      const effectLabel = document.createElement('strong');
      effectLabel.textContent = 'Published result: ';
      effect.append(effectLabel, item.effect);

      const claim = document.createElement('p');
      claim.textContent = item.claim;

      const meta = document.createElement('div');
      meta.className = 'evidence-meta';
      addMetaRow(meta, 'Source', source.short);
      addMetaRow(meta, 'Population', source.population);
      addMetaRow(meta, 'Design', source.design);
      addMetaRow(meta, 'Limit', item.limitation);
      sourceBlock.append(tier, effect, claim, meta);
      article.appendChild(sourceBlock);
    }
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
    const groups = new Map();
    for (const item of items) {
      if (!groups.has(item.input)) groups.set(item.input, []);
      groups.get(item.input).push(item);
    }
    for (const group of groups.values()) container.appendChild(makeEvidenceGroup(group));
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

  function getApplicability() {
    const outside = [];
    const cautions = [];
    if (value('target-age') === '21plus') outside.push('age is outside the pediatric source populations');
    if (value('icu-level-care') === 'yes') outside.push('ICU-level illness was excluded from the non-severe target phenotype');
    if (value('shock') === 'yes') outside.push('shock was excluded from the 2026 non-severe MIS-C cohort');

    if (value('target-age') === 'unknown') cautions.push('age band is unknown');
    if (value('icu-level-care') === 'unknown') cautions.push('ICU status is unknown');
    if (value('pretreatment') !== 'yes') cautions.push('pre-treatment timing is not confirmed');
    if (value('hospitalized') !== 'yes') cautions.push('hospitalization is not confirmed');
    return { outside, cautions };
  }

  function renderApplicability() {
    const { outside, cautions } = getApplicability();
    applicabilityElement.className = 'applicability-state';
    if (outside.length) {
      applicabilityElement.classList.add('outside');
      applicabilityElement.textContent = `OUTSIDE TARGET PHENOTYPE — ${outside.join('; ')}.`;
    } else if (cautions.length) {
      applicabilityElement.classList.add('limited');
      applicabilityElement.textContent = `LIMITED APPLICABILITY — ${cautions.join('; ')}.`;
    } else {
      applicabilityElement.classList.add('applicable');
      applicabilityElement.textContent = 'TARGET PHENOTYPE APPEARS APPLICABLE — INTERPRETATION REMAINS EXPERIMENTAL';
    }
  }

  function renderCompleteness() {
    const counts = { yes: 0, no: 0, unknown: 0 };
    for (const input of caseInputs) counts[input.value] = (counts[input.value] || 0) + 1;
    completenessElement.textContent = `Case-data completeness: ${counts.yes} present/yes, ${counts.no} assessed absent/no, ${counts.unknown} unknown of ${caseInputs.length} structured fields. Unknown and assessed-absent findings are kept distinct.`;
    return counts;
  }

  function renderEvidence() {
    const selected = evidenceRegistry.filter((item) => selectedYes(item.input));
    const misc = selected.filter((item) => item.direction === 'misc');
    const kd = selected.filter((item) => item.direction === 'kd');
    const context = selected.filter((item) => item.direction === 'context');

    renderList(miscContainer, misc, 'No source-attributed MIS-C-associated findings selected.');
    renderList(kdContainer, kd, 'No source-attributed iKD/KD-associated findings selected.');
    renderList(contextContainer, context, 'No overlap, guideline, or surveillance context selected.');

    const miscFindings = new Set(misc.map(item => item.input));
    const kdFindings = new Set(kd.map(item => item.input));
    const counts = renderCompleteness();
    const applicability = getApplicability();

    stateElement.className = 'evidence-state';
    if (applicability.outside.length) {
      stateElement.textContent = 'OUTSIDE TARGET PHENOTYPE — LIKELIHOOD NOT INTERPRETED';
      stateElement.classList.add('outside');
      summaryElement.textContent = 'The selected case falls outside the source-defined non-severe pediatric comparison. Do not extrapolate this workbench to the patient.';
    } else if (miscFindings.size && kdFindings.size) {
      stateElement.textContent = 'MIXED LITERATURE PATTERN — BOTH PHENOTYPES REPRESENTED';
      stateElement.classList.add('discordant');
      summaryElement.textContent = 'Published associations point in both directions. The available literature does not support a calibrated combined probability for this pattern.';
    } else if (miscFindings.size) {
      stateElement.textContent = 'PUBLISHED PATTERN FAVORS NON-SEVERE MIS-C — QUALITATIVE ONLY';
      stateElement.classList.add('one-sided');
      summaryElement.textContent = 'Selected positive findings align only with MIS-C-associated evidence in this registry. This is a qualitative literature pattern, not a diagnosis or validated probability.';
    } else if (kdFindings.size) {
      stateElement.textContent = 'PUBLISHED PATTERN FAVORS INCOMPLETE KD — QUALITATIVE ONLY';
      stateElement.classList.add('one-sided');
      summaryElement.textContent = 'Selected positive findings align only with incomplete-KD/KD-associated evidence in this registry. This is a qualitative literature pattern, not a diagnosis or validated probability.';
    } else if (counts.unknown === caseInputs.length) {
      stateElement.textContent = 'INSUFFICIENT PATIENT INFORMATION';
      summaryElement.textContent = 'No case information has been entered.';
    } else {
      stateElement.textContent = 'NO POSITIVE DIRECTIONAL FINDINGS SELECTED';
      summaryElement.textContent = 'Assessed-absent findings are not treated as evidence for the opposite diagnosis. This state is not equivalent to low risk or exclusion of either syndrome.';
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
    caseInputs.forEach(updateSelectState);
    modelInputs.forEach(updateSelectState);
    renderApplicability();
    renderEvidence();
    renderModelAvailability();
  }

  caseInputs.forEach((input) => input.addEventListener('change', renderAll));
  modelInputs.forEach((input) => input.addEventListener('change', renderAll));

  form.addEventListener('reset', (event) => {
    event.preventDefault();
    for (const input of caseInputs) input.value = 'unknown';
    for (const input of modelInputs) input.value = 'unknown';
    renderAll();
  });

  document.documentElement.dataset.evidenceVersion = EVIDENCE_VERSION;
  renderStudySignals();
  renderExclusions();
  renderSourceLock();
  renderAll();
})();

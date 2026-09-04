const app = document.getElementById('app');
const STORAGE_KEY = 'g5-science-lab-m6-mini-lab';
const LEARNERS = ['Luke', 'Samantha'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const params = new URLSearchParams(location.search);
let learner = LEARNERS.includes(params.get('learner')) ? params.get('learner') : null;
let root = load();

function blankRecord() { return { prediction: null, beforeMass: '', afterMass: '', observation: '', explanation: null, completedAt: null }; }
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return raw?.version === 1 ? raw : { version: 1, learners: { Luke: blankRecord(), Samantha: blankRecord() } };
  } catch (_) {
    return { version: 1, learners: { Luke: blankRecord(), Samantha: blankRecord() } };
  }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(root)); }
function record() { root.learners[learner] ||= blankRecord(); return root.learners[learner]; }
function shell(content) {
  app.innerHTML = `<div class="course-shell mini-shell"><header class="course-head"><a href="/study/matter-lab.html" class="home-link">← Science Lab</a><div><span>Optional home investigation</span><strong>Closed-system ice</strong></div></header>${content}</div>`;
  requestAnimationFrame(() => app.querySelector('h1,h2')?.focus());
}

function renderPicker() {
  shell(`<main class="learner-screen"><p class="eyebrow">Optional · no mastery penalty</p><h1 tabindex="-1">Who is doing the mini-lab?</h1><p class="lede">This is a lab-notebook activity. It is separate from scored mastery evidence and can be skipped.</p><section class="learner-grid">${LEARNERS.map(name => `<button class="menu-card" data-mini-learner="${name}"><span class="learner-mark ${name.toLowerCase()}">${name[0]}</span><span><strong>${name}</strong><small>${root.learners?.[name]?.prediction ? 'Continue saved mini-lab' : 'Start mini-lab'}</small></span><b>→</b></button>`).join('')}</section></main>`);
}

function materialsMarkup() {
  return `<section class="mini-panel"><h2>Materials</h2><ul><li>1 resealable plastic bag</li><li>1–2 ice cubes</li><li>Kitchen scale that reads grams</li><li>Paper towel</li></ul><p class="safety-note"><strong>Safety:</strong> Use a plastic bag, not glass. Keep the bag sealed after the first measurement. Do not use heat or taste anything. Wipe up water promptly.</p></section>`;
}

function renderPrediction() {
  const r = record();
  shell(`<main class="mini-main"><p class="eyebrow">${esc(learner)} · Step 1 of 3</p><h1 tabindex="-1">Predict before measuring</h1><p class="lede">You will seal ice in a bag, measure the whole closed system, let the ice melt at room temperature, dry the outside of the bag, and measure the same sealed system again.</p>${materialsMarkup()}<section class="mini-panel"><h2>Prediction</h2><p>After all the ice melts, what will happen to the total mass of the sealed bag system?</p><div class="mini-choices">${[['decrease','Decrease'],['same','Stay about the same'],['increase','Increase']].map(([value,label]) => `<button type="button" data-prediction="${value}" aria-pressed="${r.prediction === value}">${label}</button>`).join('')}</div><button class="primary-button" data-mini-action="commit-prediction" ${r.prediction ? '' : 'disabled'}>Commit prediction</button></section><a class="text-button link-button" href="/study/matter-lab.html">Skip and return to Science Lab</a></main>`);
}

function renderMeasure() {
  const r = record();
  shell(`<main class="mini-main"><p class="eyebrow">${esc(learner)} · Step 2 of 3</p><h1 tabindex="-1">Collect the evidence</h1><section class="mini-panel"><h2>Procedure</h2><ol><li>Put the ice in the plastic bag and seal it completely.</li><li>Dry the outside. Measure the entire sealed bag and record the mass.</li><li>Leave the sealed bag at room temperature until the ice melts. Do not open it.</li><li>Dry any condensation from the <em>outside</em> of the bag, then measure the same sealed bag again.</li></ol><p class="safety-note">If the bag leaks or water is spilled, stop and repeat later with a dry, intact bag. Do not heat the bag to speed melting.</p></section><section class="mini-panel"><h2>Data</h2><label>Mass before melting (g)<input inputmode="decimal" type="number" min="0" step="0.1" data-mini-field="beforeMass" value="${esc(r.beforeMass)}"></label><label>Mass after melting (g)<input inputmode="decimal" type="number" min="0" step="0.1" data-mini-field="afterMass" value="${esc(r.afterMass)}"></label><label>What did you notice? <span>(optional)</span><textarea rows="3" data-mini-field="observation" placeholder="For example: ice became liquid; droplets appeared inside the bag.">${esc(r.observation)}</textarea></label><button class="primary-button" data-mini-action="save-data" ${r.beforeMass !== '' && r.afterMass !== '' ? '' : 'disabled'}>Save evidence</button></section></main>`);
}

function renderExplain() {
  const r = record();
  const before = Number(r.beforeMass);
  const after = Number(r.afterMass);
  const difference = Number.isFinite(before) && Number.isFinite(after) ? Math.abs(after - before) : null;
  const dataNote = difference === null ? '' : difference <= 1 ? 'Your two measurements are very close.' : 'Your measurements differ enough that scale resolution, outside water, or a leak may be worth checking before interpreting the result.';
  shell(`<main class="mini-main"><p class="eyebrow">${esc(learner)} · Step 3 of 3</p><h1 tabindex="-1">Explain the evidence</h1><section class="mini-panel evidence-recap"><h2>Your notebook</h2><p><strong>Prediction:</strong> ${esc(r.prediction === 'same' ? 'Mass stays about the same' : r.prediction === 'increase' ? 'Mass increases' : 'Mass decreases')}</p><p><strong>Before:</strong> ${esc(r.beforeMass)} g · <strong>After:</strong> ${esc(r.afterMass)} g</p><p>${esc(dataNote)}</p></section><section class="mini-panel"><h2>Which explanation best uses the closed-system idea?</h2><div class="mini-choices stacked">${[
    ['conserved','Melting changes the state and arrangement of the water particles, but in a sealed system the same matter remains inside.'],
    ['destroyed','Some ice matter is destroyed when it becomes liquid.'],
    ['created','Liquid water has more matter than the same ice, so melting creates mass.']
  ].map(([value,label]) => `<button type="button" data-explanation="${value}" aria-pressed="${r.explanation === value}">${label}</button>`).join('')}</div><button class="primary-button" data-mini-action="finish" ${r.explanation ? '' : 'disabled'}>Finish mini-lab</button></section></main>`);
}

function renderComplete() {
  const r = record();
  const correct = r.explanation === 'conserved';
  shell(`<main class="summary-card mini-summary"><p class="eyebrow">${esc(learner)} · Optional investigation complete</p><h1 tabindex="-1">${correct ? 'You tracked matter through a phase change.' : 'Use the system boundary to revise the explanation.'}</h1><p class="lede">${correct ? 'In a sealed bag, melting changes ice into liquid water without creating or destroying matter. Small measurement differences can come from scale resolution, outside condensation, or leakage.' : 'The bag is the system boundary. If it stays sealed, the water matter remains inside even though its state changes. Your measurements are evidence to interpret, not a reason to make matter appear or disappear.'}</p><p class="mini-integrity">This mini-lab is stored as optional notebook evidence only. It does not add a mastery attempt or change the adaptive score.</p><div class="summary-actions"><a class="primary-button link-button" href="/study/matter-lab.html">Return to Science Lab</a><button class="secondary-button" data-mini-action="restart">Repeat mini-lab</button></div></main>`);
}

function render() {
  if (!learner) return renderPicker();
  const r = record();
  if (r.completedAt) return renderComplete();
  if (!r.prediction || !r.predictionCommittedAt) return renderPrediction();
  if (r.beforeMass === '' || r.afterMass === '' || !r.dataCommittedAt) return renderMeasure();
  return renderExplain();
}

app.addEventListener('click', event => {
  const learnerButton = event.target.closest('[data-mini-learner]');
  if (learnerButton) { learner = learnerButton.dataset.miniLearner; history.replaceState(null, '', `?learner=${encodeURIComponent(learner)}`); return render(); }
  const prediction = event.target.closest('[data-prediction]');
  if (prediction) { record().prediction = prediction.dataset.prediction; save(); return renderPrediction(); }
  const explanation = event.target.closest('[data-explanation]');
  if (explanation) { record().explanation = explanation.dataset.explanation; save(); return renderExplain(); }
  const action = event.target.closest('[data-mini-action]')?.dataset.miniAction;
  if (action === 'commit-prediction' && record().prediction) { record().predictionCommittedAt = new Date().toISOString(); save(); return renderMeasure(); }
  if (action === 'save-data' && record().beforeMass !== '' && record().afterMass !== '') { record().dataCommittedAt = new Date().toISOString(); save(); return renderExplain(); }
  if (action === 'finish' && record().explanation) { record().completedAt = new Date().toISOString(); save(); return renderComplete(); }
  if (action === 'restart') { root.learners[learner] = blankRecord(); save(); return renderPrediction(); }
});

app.addEventListener('input', event => {
  const field = event.target.dataset.miniField;
  if (!field) return;
  record()[field] = event.target.value;
  save();
  if (field === 'beforeMass' || field === 'afterMass') {
    const button = app.querySelector('[data-mini-action="save-data"]');
    if (button) button.disabled = record().beforeMass === '' || record().afterMass === '';
  }
});

render();

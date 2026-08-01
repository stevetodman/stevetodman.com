'use strict';

const $ = id => document.getElementById(id);
const fmtTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const includesAny = (text, terms) => terms.some(term => text.includes(term));

const VARIANTS = [
  {
    id: 'A',
    label: 'Classic closing-window presentation',
    initial: { HR: 168, RR: 62, SpO2: 94, BP: '62/38', Temp: 36.7, Lactate: 3.1 },
    history: {
      feeding: { parent: 'She took less than half of her usual feeds today and sweats while trying to finish a bottle.', nurse: 'Documented intake is under half of expected since this afternoon.' },
      urine: { parent: 'Only one wet diaper since this morning.', nurse: 'Urine output has fallen over the last several hours.' },
      onset: { parent: 'She looked well after discharge, then became sleepier and breathed faster over the last 12 hours.', nurse: 'The decline has been progressive rather than abrupt.' },
      color: { parent: 'Her feet look pale and feel colder than her hands. I have not seen blue lips.', nurse: 'Lower extremities are cooler and more mottled than the upper extremities.' },
      breathing: { parent: 'She breathes fast during feeds but has not been coughing or congested.', nurse: 'Tachypnea is present without prominent secretions or wheezing.' },
      fever: { parent: 'No fever at home.', nurse: 'She has remained afebrile.' },
      birth: { parent: 'She was born at 39 weeks after an uncomplicated pregnancy and delivery.', nurse: 'Term newborn with an uncomplicated nursery course.' },
      screen: { parent: 'We were told the newborn heart and oxygen screens were normal.', nurse: 'Routine newborn screening was documented as passed.' },
      family: { parent: 'No close relative has congenital heart disease or unexplained sudden death.', nurse: 'No relevant family history is documented.' },
      meds: { parent: 'Only vitamin D. No known allergies.', nurse: 'No prescribed medicines other than vitamin D; no known allergies.' }
    },
    exam: {
      appearance: 'Ill-appearing but responsive newborn; weak cry and reduced interest in feeding.',
      respiratory: 'Tachypnea with mild subcostal retractions; lungs are mostly clear without focal crackles or wheeze.',
      cardiac: 'Tachycardic regular rhythm with a soft systolic murmur and gallop.',
      pulses: 'Brachial pulses are 2+; femoral pulses are faint. Feet are cool and mottled with capillary refill about 4 seconds.',
      abdomen: 'Liver edge is enlarged below the right costal margin; abdomen otherwise soft.',
      neuro: 'Responsive to handling but tires quickly; tone is mildly reduced during feeding.',
      fourbp: 'Right arm 68/42, left arm 66/40, right leg 48/28, left leg 46/26.',
      ductalsats: 'Right hand 95%; foot 91%. The difference is present but is not diagnostic by itself.'
    },
    worseningAt: 180,
    severeAt: 300,
    terminalAt: 360
  },
  {
    id: 'B',
    label: 'Subtle early presentation',
    initial: { HR: 158, RR: 54, SpO2: 97, BP: '66/40', Temp: 37.1, Lactate: 2.7 },
    history: {
      feeding: { parent: 'She starts feeds normally, then stops after a few minutes and becomes sweaty.', nurse: 'Feed endurance has fallen, although total intake initially looked only mildly reduced.' },
      urine: { parent: 'Wet diapers are less heavy than yesterday.', nurse: 'Urine output is trending down but has not stopped.' },
      onset: { parent: 'She seemed normal yesterday. Today she is sleepier and takes longer to recover after feeds.', nurse: 'The change has been gradual and easy to underestimate.' },
      color: { parent: 'Her feet sometimes look dusky, but her face stays pink.', nurse: 'Upper-body color is preserved; the legs are intermittently pale and cool.' },
      breathing: { parent: 'She breathes faster after feeding but has no cough or runny nose.', nurse: 'Mild tachypnea without an infectious respiratory pattern.' },
      fever: { parent: 'No measured fever.', nurse: 'Temperature has been normal.' },
      birth: { parent: 'She was born at term without complications.', nurse: 'Term infant; no prenatal cardiac diagnosis.' },
      screen: { parent: 'She passed the oxygen test before discharge.', nurse: 'Pulse-ox screening was documented as passed.' },
      family: { parent: 'No known congenital heart disease in the family.', nurse: 'No first-degree family cardiac history is documented.' },
      meds: { parent: 'Vitamin D only; no allergies.', nurse: 'No active medications other than vitamin D.' }
    },
    exam: {
      appearance: 'Quiet but arousable newborn; color is pink centrally and feeding effort is poor.',
      respiratory: 'Mild tachypnea with clear lungs and little retraction.',
      cardiac: 'Tachycardic regular rhythm; no definite murmur is heard on the first examination.',
      pulses: 'Brachial pulses are normal; femoral pulses are delayed and difficult to palpate. Feet are cooler than hands with capillary refill about 3–4 seconds.',
      abdomen: 'Liver edge is mildly enlarged; abdomen is soft.',
      neuro: 'Arouses appropriately but fatigues with sustained handling.',
      fourbp: 'Right arm 72/44, left arm 70/42, right leg 54/32, left leg 52/30.',
      ductalsats: 'Right hand 98%; foot 95%. Near-normal saturations do not exclude impaired systemic blood flow.'
    },
    worseningAt: 210,
    severeAt: 330,
    terminalAt: 390
  }
];

const HISTORY_MATCHERS = [
  ['feeding', ['feed','bottle','breast','eat','intake','sweat']],
  ['urine', ['urine','wet diaper','diaper','pee','output']],
  ['onset', ['when','start','onset','how long','progress','yesterday','today']],
  ['color', ['color','blue','cyan','pale','dusky','cold','cool','mottl']],
  ['breathing', ['breath','respir','cough','congestion','wheeze']],
  ['fever', ['fever','temperature','infection','sick contact']],
  ['birth', ['birth','pregnan','delivery','gestation','term','prenatal']],
  ['screen', ['screen','pulse ox','newborn test','heart test']],
  ['family', ['family','sudden death','heart disease','congenital']],
  ['meds', ['medication','medicine','drug','allerg']]
];

const EXAM_COMPONENTS = [
  { id: 'appearance', label: 'General appearance and feeding effort' },
  { id: 'respiratory', label: 'Respiratory examination' },
  { id: 'cardiac', label: 'Cardiac auscultation' },
  { id: 'pulses', label: 'Pulses, temperature, and perfusion' },
  { id: 'abdomen', label: 'Abdominal and liver examination' },
  { id: 'neuro', label: 'Neurologic responsiveness and tone' },
  { id: 'fourbp', label: 'Four-limb blood pressures' },
  { id: 'ductalsats', label: 'Preductal and postductal saturations' }
];

const ORDER_CATALOG = [
  { id: 'monitoriv', name: 'Cardiorespiratory monitoring and vascular access', type: 'Task' },
  { id: 'gas', name: 'Blood gas and lactate', type: 'Laboratory' },
  { id: 'cbc', name: 'Complete blood count and metabolic panel', type: 'Laboratory' },
  { id: 'culture', name: 'Blood culture', type: 'Laboratory' },
  { id: 'ecg', name: '12-lead electrocardiogram', type: 'Diagnostic' },
  { id: 'cxr', name: 'Chest radiograph', type: 'Imaging' },
  { id: 'echo', name: 'Urgent transthoracic echocardiogram', type: 'Imaging' },
  { id: 'pge', name: 'Prostaglandin E1 infusion per neonatal critical CHD protocol', type: 'Medication' },
  { id: 'smallfluid', name: 'Small cautious isotonic fluid aliquot with reassessment', type: 'Treatment' },
  { id: 'bigbolus', name: 'Rapid large-volume isotonic fluid bolus', type: 'Treatment' },
  { id: 'oxygen', name: 'Supplemental oxygen', type: 'Treatment' },
  { id: 'antibiotics', name: 'Empiric parenteral antibiotics', type: 'Medication' },
  { id: 'furosemide', name: 'Furosemide', type: 'Medication' },
  { id: 'airway', name: 'Bring airway equipment and respiratory support to bedside', type: 'Task' }
];

const ORDER_META = {
  monitoriv: { domain: 'stabilization', weight: 8, rationale: 'Monitoring, access, and airway readiness support safe stabilization and escalation.', critical: false },
  gas: { domain: 'information', weight: 5, rationale: 'Acid-base status and lactate help characterize impaired perfusion and response.', critical: false },
  echo: { domain: 'diagnostics', weight: 8, rationale: 'Urgent echocardiography confirms arch obstruction, ductal restriction, and ventricular function.', critical: false },
  pge: { domain: 'stabilization', weight: 25, rationale: 'Suspected ductal-dependent systemic blood flow requires urgent prostaglandin therapy while definitive care is arranged.', critical: true },
  airway: { domain: 'stabilization', weight: 4, rationale: 'Airway readiness is important because deterioration and prostaglandin-associated apnea are possible.', critical: false },
  bigbolus: { domain: 'safety', penalty: 15, rationale: 'Large rapid volume expansion can worsen congestion when ventricular dysfunction is present.', critical: false },
  smallfluid: { domain: 'safety', penalty: 0, rationale: 'A cautious aliquot with immediate reassessment may be reasonable in selected shock states but does not replace definitive treatment.', critical: false },
  oxygen: { domain: 'safety', penalty: 0, rationale: 'Oxygen may change saturation but does not correct the obstructed systemic circulation.', critical: false },
  antibiotics: { domain: 'safety', penalty: 0, rationale: 'Sepsis remains an important alternative diagnosis, but empiric antibiotics do not replace cardiac stabilization.', critical: false },
  furosemide: { domain: 'safety', penalty: 4, rationale: 'Diuresis before defining systemic perfusion and preload needs may be poorly prioritized.', critical: false }
};

const TEAM_ROLES = [
  { id: 'nurse', label: 'Bedside nurse', sub: 'Updates, delegated tasks, repeat observations' },
  { id: 'attending', label: 'Supervising attending', sub: 'Urgency, synthesis, escalation decisions' },
  { id: 'cardiology', label: 'Cardiology / cardiac ICU', sub: 'Critical CHD consultation and transfer' },
  { id: 'parent', label: 'Maya’s parent', sub: 'Explanation, uncertainty, next steps' }
];

const SCORE_DOMAINS = [
  { id: 'information', label: 'Information gathering', max: 10 },
  { id: 'exam', label: 'Focused examination', max: 15 },
  { id: 'reasoning', label: 'Clinical reasoning', max: 15 },
  { id: 'stabilization', label: 'Stabilization', max: 30 },
  { id: 'escalation', label: 'Escalation and teamwork', max: 15 },
  { id: 'reassessment', label: 'Reassessment', max: 10 },
  { id: 'family', label: 'Family communication', max: 5 }
];

let state;
let intervalId;

function freshState(variantIndex = 0) {
  const variant = VARIANTS[variantIndex];
  return {
    variantIndex,
    variant,
    started: false,
    running: false,
    ended: false,
    endReason: '',
    time: 0,
    lastTick: null,
    vitals: { ...variant.initial },
    acuity: 'warning',
    history: [],
    historyCategories: new Set(),
    examEvents: [],
    examCounts: {},
    orders: [],
    pending: [],
    results: [],
    teamRole: '',
    teamMessages: [],
    pendingReadback: null,
    readbacks: [],
    reasoning: [],
    pages: [],
    timeline: [],
    flags: {},
    pgeStartedAt: null,
    pgeResponseAt: null,
    pgeResponseCompleted: false,
    escalatedAt: null,
    reassessedAfterPge: false,
    reaction: '',
    futureCommitment: ''
  };
}

function resetState(variantIndex = state?.variantIndex ?? 0) {
  state = freshState(variantIndex);
  clearInterval(intervalId);
  intervalId = setInterval(tick, 250);
  $('intro').classList.remove('hidden');
  $('debriefSection').classList.add('hidden');
  $('criticalBanner').classList.add('hidden');
  resetInputs();
  renderAll();
}

function resetInputs() {
  ['historyInput','teamMessage','problemRepresentation','differential','mostLikely','mustNotMiss','nextPlan','reactionText','futureCommitment','orderSearch'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('historySource')) $('historySource').value = 'parent';
  if ($('confidence')) $('confidence').value = '50';
  if ($('confidenceValue')) $('confidenceValue').textContent = '50%';
}

function addTimeline(text, kind = 'action') {
  state.timeline.unshift({ time: state.time, text, kind });
  renderTimeline();
}

function addResult(title, text, tone = 'neutral') {
  state.results.unshift({ time: state.time, title, text, tone });
  renderResults();
}

function scheduleResult(id, delay, title, build, tone = 'neutral') {
  state.pending.push({ id, due: state.time + delay, title, build, tone });
  renderOrders();
  renderResults();
}

function currentLactate() {
  return Number(state.vitals.Lactate).toFixed(1);
}

function startEncounter() {
  state.started = true;
  state.running = true;
  state.lastTick = Date.now();
  $('intro').classList.add('hidden');
  $('pauseBtn').disabled = false;
  $('endBtn').disabled = false;
  $('askHistoryBtn').disabled = false;
  $('sendTeamBtn').disabled = !state.teamRole;
  $('commitReasoningBtn').disabled = false;
  addTimeline(`Encounter started — ${state.variant.label}.`, 'system');
  renderAll();
}

function tick() {
  if (!state.running || state.ended) return;
  const now = Date.now();
  if (state.lastTick === null) state.lastTick = now;
  const elapsed = Math.floor((now - state.lastTick) / 1000);
  if (elapsed < 1) return;
  state.lastTick += elapsed * 1000;
  advanceScenario(elapsed);
}

function advanceScenario(seconds) {
  for (let i = 0; i < seconds; i++) {
    state.time += 1;
    updatePhysiologyOneSecond();
    processPending();
    triggerTimedEvents();
    if (state.ended) break;
  }
  renderHeader();
  renderVitals();
  renderPages();
  renderResults();
}

function updatePhysiologyOneSecond() {
  if (state.pgeStartedAt === null) {
    if (state.time >= state.variant.worseningAt) {
      state.vitals.Lactate = Math.min(8.8, Number(state.vitals.Lactate) + 0.008);
      if (state.time % 8 === 0) state.vitals.HR = Math.min(196, state.vitals.HR + 1);
      if (state.time % 12 === 0) state.vitals.RR = Math.min(78, state.vitals.RR + 1);
    }
  } else if (!state.pgeResponseCompleted && state.time >= state.pgeResponseAt) {
    completePgeResponse();
  } else if (state.pgeResponseCompleted) {
    const floor = pgeLactateFloor();
    state.vitals.Lactate = Math.max(floor, Number(state.vitals.Lactate) - 0.004);
  }
}

function triggerTimedEvents() {
  const v = state.variant;
  if (state.time >= 75 && !state.flags.eliPage) {
    state.flags.eliPage = true;
    addPage('eli', false, 'Ward nurse: Eli has intermittent desaturation during sleep and increased nasal secretions.');
  }
  if (state.time >= 135 && !state.flags.noraPage) {
    state.flags.noraPage = true;
    addPage('nora', true, 'Microbiology: Nora’s blood culture has flagged positive; the ED team requests direction.');
  }
  if (state.time >= 195 && !state.flags.jamalPage) {
    state.flags.jamalPage = true;
    addPage('jamal', false, 'ED nurse: Jamal’s caregiver is requesting an update about the wait.');
  }
  if (state.time >= v.worseningAt && state.pgeStartedAt === null && !state.flags.worsening) {
    state.flags.worsening = true;
    state.acuity = 'critical';
    state.vitals.BP = state.variantIndex === 0 ? '52/28' : '56/30';
    state.vitals.HR = Math.max(state.vitals.HR, 184);
    state.vitals.RR = Math.max(state.vitals.RR, 70);
    state.vitals.SpO2 = Math.min(state.vitals.SpO2, 91);
    showCritical('Maya is deteriorating: gray appearance, weaker femoral pulses, and worsening lower-body perfusion.');
    addTimeline('Deterioration: systemic perfusion worsens as the ductal window closes.', 'deterioration');
  }
  if (state.time >= v.severeAt && state.pgeStartedAt === null && !state.flags.severe) {
    state.flags.severe = true;
    state.vitals.BP = '44/24';
    state.vitals.HR = 194;
    state.vitals.RR = 76;
    state.vitals.SpO2 = 87;
    showCritical('Maya has severe shock with declining responsiveness. Immediate rescue treatment and escalation are required.');
    addTimeline('Severe shock: responsiveness and perfusion decline.', 'deterioration');
  }
  if (state.time >= v.terminalAt && state.pgeStartedAt === null && !state.ended) {
    state.acuity = 'critical';
    state.vitals.HR = 42;
    state.vitals.RR = 0;
    state.vitals.SpO2 = 68;
    state.vitals.BP = 'unobtainable';
    showCritical('Maya develops cardiopulmonary arrest in this deterministic scenario.');
    endEncounter('Cardiopulmonary arrest after untreated progressive ductal closure.');
  }
}

function showCritical(text) {
  $('criticalBanner').textContent = text;
  $('criticalBanner').classList.remove('hidden');
}

function addPage(patient, urgent, text) {
  state.pages.unshift({ id: `${patient}-${state.time}`, patient, urgent, text, time: state.time, status: 'open', delegatedTo: '' });
  renderPages();
}

function processPending() {
  const ready = state.pending.filter(item => item.due <= state.time);
  if (!ready.length) return;
  state.pending = state.pending.filter(item => item.due > state.time);
  ready.forEach(item => {
    addResult(item.title, item.build(), item.tone);
    const order = state.orders.find(o => o.id === item.id && o.status === 'pending');
    if (order) order.status = 'complete';
    addTimeline(`${item.title} resulted.`, 'result');
  });
}

function askHistory() {
  if (!state.started || state.ended) return;
  const question = $('historyInput').value.trim();
  if (!question) return;
  const source = $('historySource').value;
  const normalized = question.toLowerCase();
  const category = HISTORY_MATCHERS.find(([, terms]) => includesAny(normalized, terms))?.[0];
  let answer;
  if (category) {
    answer = state.variant.history[category][source];
    state.historyCategories.add(category);
  } else {
    answer = source === 'parent'
      ? 'I am not sure. Can you ask me about a specific symptom, change, or part of her history?'
      : 'I do not have additional information on that point. A more focused question may help.';
  }
  state.history.push({ time: state.time, source, question, answer, category: category || 'unmatched' });
  $('historyInput').value = '';
  addTimeline(`Asked ${source === 'parent' ? 'Maya’s parent' : 'the bedside nurse'}: “${question}”`, 'history');
  renderHistory();
}

function performExam(componentId) {
  if (!state.started || state.ended) return;
  const component = EXAM_COMPONENTS.find(x => x.id === componentId);
  if (!component) return;
  state.examCounts[componentId] = (state.examCounts[componentId] || 0) + 1;
  const postPge = state.pgeResponseCompleted;
  let finding = state.variant.exam[componentId];
  if (postPge) finding = postPgeFinding(componentId, finding);
  state.examEvents.unshift({ time: state.time, componentId, label: component.label, finding, postPge });
  if (postPge && ['appearance','pulses','fourbp','abdomen','respiratory'].includes(componentId)) state.reassessedAfterPge = true;
  addTimeline(`${component.label} performed${postPge ? ' during reassessment' : ''}.`, 'exam');
  renderExam();
}

function postPgeFinding(componentId, baseline) {
  const late = state.pgeStartedAt > state.variant.severeAt;
  const map = {
    appearance: late ? 'More responsive than before treatment but still ill-appearing and fatigued.' : 'More alert with stronger cry and improved feeding interest.',
    respiratory: late ? 'Tachypnea persists with moderate retractions.' : 'Respiratory rate is falling and retractions are milder; lungs remain clear.',
    cardiac: 'Tachycardia is improving; gallop is less prominent.',
    pulses: late ? 'Femoral pulses are now detectable but remain weak; feet are warmer with capillary refill about 3 seconds.' : 'Femoral pulses are stronger, feet are warmer, and capillary refill is about 2–3 seconds.',
    abdomen: late ? 'Hepatomegaly persists.' : 'Liver edge remains mildly enlarged but congestion is improving.',
    neuro: late ? 'Responsiveness improves but fatigue remains.' : 'Alertness and tone improve.',
    fourbp: late ? 'Upper-to-lower pressure gradient remains, with modest improvement in leg pressures.' : 'Leg pressures improve, although the structural gradient persists.',
    ductalsats: 'Pre/postductal saturation difference narrows slightly; systemic perfusion must still be judged clinically.'
  };
  return map[componentId] || baseline;
}

function searchOrders() {
  const query = $('orderSearch').value.trim().toLowerCase();
  const container = $('orderResults');
  if (query.length < 2) {
    container.innerHTML = '<p class="placeholder">Type at least 2 characters.</p>';
    return;
  }
  const terms = query.split(/\s+/).filter(Boolean);
  const matches = ORDER_CATALOG.filter(o => terms.every(term => `${o.name} ${o.type}`.toLowerCase().includes(term)));
  container.innerHTML = matches.length ? matches.map(o => {
    const placed = state.orders.some(x => x.id === o.id);
    return `<button class="order-option" type="button" data-order="${o.id}" ${placed || state.ended ? 'disabled' : ''}><span><strong>${esc(o.name)}</strong><small>${esc(o.type)}</small></span><span>${placed ? 'Placed' : 'Select'}</span></button>`;
  }).join('') : '<p class="placeholder">No matching options. Try a broader clinical term.</p>';
}

function placeOrder(orderId) {
  if (!state.started || state.ended || state.orders.some(o => o.id === orderId)) return;
  const order = ORDER_CATALOG.find(o => o.id === orderId);
  if (!order) return;
  const record = { id: orderId, name: order.name, time: state.time, status: 'complete' };
  state.orders.unshift(record);
  addTimeline(`Order placed: ${order.name}.`, 'order');

  switch (orderId) {
    case 'monitoriv':
      addResult('Monitoring and access', 'Continuous monitoring is established, vascular access is obtained, and emergency equipment is available.', 'reassuring');
      break;
    case 'gas':
      record.status = 'pending';
      scheduleResult('gas', 18, 'Blood gas and lactate', () => `Metabolic acidosis is present. Lactate is ${currentLactate()} mmol/L.`, 'abnormal');
      break;
    case 'cbc':
      record.status = 'pending';
      scheduleResult('cbc', 22, 'CBC and metabolic panel', () => 'No single laboratory finding explains the shock. Renal and hepatic perfusion markers are mildly abnormal.', 'neutral');
      break;
    case 'culture':
      record.status = 'pending';
      scheduleResult('culture', 45, 'Blood culture', () => 'No growth at this early time point. Culture remains in process.', 'neutral');
      break;
    case 'ecg':
      record.status = 'pending';
      scheduleResult('ecg', 14, '12-lead ECG', () => 'Sinus tachycardia with neonatal right-ventricular predominance; no primary arrhythmia.', 'neutral');
      break;
    case 'cxr':
      record.status = 'pending';
      scheduleResult('cxr', 20, 'Chest radiograph', () => 'Mild cardiomegaly and pulmonary vascular congestion without focal pneumonia.', 'abnormal');
      break;
    case 'echo':
      record.status = 'pending';
      scheduleResult('echo', 42, 'Urgent echocardiogram', () => 'Severe coarctation with arch hypoplasia, a restrictive ductus, and depressed left-ventricular systolic function.', 'abnormal');
      break;
    case 'pge':
      state.pgeStartedAt = state.time;
      state.pgeResponseAt = state.time + 28;
      addResult('Prostaglandin infusion', 'Infusion started under neonatal critical congenital heart disease protocol. Continuous apnea and cardiorespiratory monitoring are required.', 'neutral');
      break;
    case 'smallfluid':
      addResult('Cautious fluid reassessment', 'A small aliquot is given with immediate reassessment. Blood pressure changes little and definitive treatment remains necessary.', 'neutral');
      break;
    case 'bigbolus':
      state.flags.bigBolus = true;
      state.acuity = 'critical';
      state.vitals.RR = Math.max(state.vitals.RR, 74);
      state.vitals.SpO2 = Math.min(state.vitals.SpO2, 88);
      addResult('Post-bolus reassessment', 'Respiratory distress and hepatomegaly worsen without durable improvement in lower-body perfusion.', 'abnormal');
      showCritical('After rapid large-volume expansion, respiratory distress and congestion worsen.');
      break;
    case 'oxygen':
      state.vitals.SpO2 = Math.min(99, state.vitals.SpO2 + 3);
      addResult('Oxygen response', 'Displayed oxygen saturation rises, but lower-body perfusion and pulse findings do not normalize.', 'neutral');
      break;
    case 'antibiotics':
      addResult('Empiric antibiotics', 'Empiric treatment is started for the sepsis alternative while diagnostic and cardiac stabilization continue.', 'neutral');
      break;
    case 'furosemide':
      state.flags.furosemide = true;
      addResult('Diuretic response', 'No immediate correction of systemic perfusion occurs. Preload and renal perfusion require close reassessment.', 'neutral');
      break;
    case 'airway':
      addResult('Airway readiness', 'Airway equipment and respiratory support are brought to bedside; the team is prepared for apnea or deterioration.', 'reassuring');
      break;
  }
  renderOrders();
  renderVitals();
  searchOrders();
}

function completePgeResponse() {
  state.pgeResponseCompleted = true;
  const delay = state.pgeStartedAt;
  const late = delay > state.variant.severeAt;
  const moderatelyLate = delay > state.variant.worseningAt;
  state.acuity = late ? 'critical' : 'warning';
  state.vitals.HR = late ? 174 : moderatelyLate ? 162 : 150;
  state.vitals.RR = late ? 66 : moderatelyLate ? 58 : 50;
  state.vitals.SpO2 = late ? 92 : 96;
  state.vitals.BP = late ? '56/32' : moderatelyLate ? '64/38' : '70/42';
  state.vitals.Lactate = Math.max(pgeLactateFloor(), Number(state.vitals.Lactate) - (late ? 0.3 : 0.8));
  addResult('Response to prostaglandin', late
    ? `Lower-body perfusion begins to improve, but severe residual shock and lactate ${currentLactate()} mmol/L remain after delayed rescue.`
    : moderatelyLate
      ? `Perfusion improves, but residual acidosis and lactate ${currentLactate()} mmol/L require continued resuscitation and transfer.`
      : `Femoral pulses and lower-body perfusion improve. Lactate begins to fall from ${currentLactate()} mmol/L.`, late ? 'abnormal' : 'reassuring');
  addTimeline('Physiologic response to prostaglandin becomes apparent. Reassessment is required.', 'treatment');
  $('criticalBanner').classList.add('hidden');
  renderVitals();
}

function pgeLactateFloor() {
  if (state.pgeStartedAt === null) return Number(state.vitals.Lactate);
  const delayBeyondWorsening = Math.max(0, state.pgeStartedAt - state.variant.worseningAt);
  const injuryBurden = delayBeyondWorsening * 0.008 + (state.flags.bigBolus ? 0.8 : 0);
  return Math.min(6.8, 2.4 + injuryBurden);
}

function selectTeamRole(roleId) {
  state.teamRole = roleId;
  state.pendingReadback = null;
  $('confirmReadbackBtn').classList.add('hidden');
  $('sendTeamBtn').disabled = !state.started || state.ended;
  renderTeamRoles();
}

function sendTeamMessage() {
  if (!state.teamRole || state.ended) return;
  const text = $('teamMessage').value.trim();
  if (!text) return;
  const role = state.teamRole;
  const normalized = text.toLowerCase();
  const assessmentSignals = includesAny(normalized, ['shock','poor perfusion','weak femoral','coarct','ductal','critical congenital','unstable','gradient']);
  const urgencySignals = includesAny(normalized, ['urgent','immediate','now','emergency','stat','critical']);
  const taskSignals = includesAny(normalized, ['please','start','obtain','repeat','prepare','come','transfer','monitor','confirm']);
  const closedLoopSignals = includesAny(normalized, ['read back','repeat back','confirm','tell me when','notify me']);

  let response;
  let needsReadback = false;
  if (role === 'nurse') {
    response = taskSignals
      ? 'Nurse: “I understand the requested task. I will repeat it back and notify you when it is complete.”'
      : 'Nurse: “What specifically would you like me to do, and how urgently?”';
    needsReadback = taskSignals;
  } else if (role === 'attending') {
    response = assessmentSignals && urgencySignals
      ? 'Attending: “I agree this may be ductal-dependent systemic shock. I am coming now. State what has been started and what you need me to arrange.”'
      : 'Attending: “Give me a one-sentence assessment, degree of urgency, and your immediate plan.”';
  } else if (role === 'cardiology') {
    response = assessmentSignals && urgencySignals
      ? 'Cardiology: “Treat as critical congenital heart disease, continue stabilization, obtain urgent echo, and arrange cardiac ICU transfer. Confirm when prostaglandin and monitoring are in place.”'
      : 'Cardiology: “What findings make this a cardiac emergency, and what stabilization has begun?”';
  } else {
    response = includesAny(normalized, ['concern','heart','circulation','treatment','transfer','uncertain'])
      ? 'Parent: “Thank you for explaining what you are worried about and what is happening next. Is she getting worse right now?”'
      : 'Parent: “I still do not understand what you think is happening or what the next step is.”';
  }

  state.teamMessages.push({ time: state.time, role, text, response, assessmentSignals, urgencySignals, taskSignals, closedLoopSignals });
  if (role === 'cardiology' && assessmentSignals && urgencySignals) state.escalatedAt = state.escalatedAt ?? state.time;
  if (role === 'attending' && assessmentSignals && urgencySignals) state.escalatedAt = state.escalatedAt ?? state.time;
  if (role === 'parent' && includesAny(normalized, ['heart','circulation','treatment','transfer','uncertain'])) state.flags.familyUpdated = true;
  if (needsReadback) {
    state.pendingReadback = { role, text };
    $('confirmReadbackBtn').classList.remove('hidden');
  } else {
    state.pendingReadback = null;
    $('confirmReadbackBtn').classList.add('hidden');
  }
  $('teamMessage').value = '';
  addTimeline(`Message sent to ${TEAM_ROLES.find(r => r.id === role).label}.`, 'communication');
  renderTeamTranscript();
}

function confirmReadback() {
  if (!state.pendingReadback) return;
  state.readbacks.push({ time: state.time, role: state.pendingReadback.role });
  state.teamMessages.push({ time: state.time, role: 'system', text: '', response: 'Closed loop confirmed: the task and urgency were repeated back correctly.' });
  state.pendingReadback = null;
  $('confirmReadbackBtn').classList.add('hidden');
  addTimeline('Closed-loop read-back confirmed.', 'communication');
  renderTeamTranscript();
}

function commitReasoning() {
  if (!state.started || state.ended) return;
  const checkpoint = {
    time: state.time,
    problem: $('problemRepresentation').value.trim(),
    differential: $('differential').value.trim(),
    mostLikely: $('mostLikely').value.trim(),
    mustNotMiss: $('mustNotMiss').value.trim(),
    plan: $('nextPlan').value.trim(),
    confidence: Number($('confidence').value)
  };
  if (![checkpoint.problem, checkpoint.differential, checkpoint.mostLikely, checkpoint.mustNotMiss, checkpoint.plan].some(Boolean)) return;
  state.reasoning.push(checkpoint);
  addTimeline(`Reasoning checkpoint ${state.reasoning.length} committed.`, 'reasoning');
  ['problemRepresentation','differential','mostLikely','mustNotMiss','nextPlan'].forEach(id => $(id).value = '');
  $('confidence').value = '50';
  $('confidenceValue').textContent = '50%';
  renderReasoning();
}

function acknowledgePage(pageId, action) {
  const page = state.pages.find(p => p.id === pageId);
  if (!page || page.status !== 'open') return;
  page.status = action === 'delegate' ? 'delegated' : 'acknowledged';
  page.delegatedTo = action === 'delegate' ? 'covering intern / appropriate team' : '';
  addTimeline(`${page.patient.toUpperCase()} page ${page.status}${page.delegatedTo ? ` to ${page.delegatedTo}` : ''}.`, 'page');
  renderPages();
}

function endEncounter(reason = 'Encounter ended by learner.') {
  if (state.ended) return;
  state.ended = true;
  state.running = false;
  state.endReason = reason;
  $('pauseBtn').disabled = true;
  $('endBtn').disabled = true;
  $('askHistoryBtn').disabled = true;
  $('sendTeamBtn').disabled = true;
  $('commitReasoningBtn').disabled = true;
  addTimeline(reason, 'end');
  renderHeader();
  renderDebrief();
  $('debriefSection').classList.remove('hidden');
  $('debriefSection').scrollTop = 0;
}

function calculateScore() {
  const scores = Object.fromEntries(SCORE_DOMAINS.map(d => [d.id, 0]));
  const misses = [];
  const hasHistory = key => state.historyCategories.has(key);
  const examined = id => (state.examCounts[id] || 0) > 0;
  const ordered = id => state.orders.some(o => o.id === id);
  const firstReasoning = state.reasoning[0];
  const allReasoningText = state.reasoning.map(r => `${r.problem} ${r.differential} ${r.mostLikely} ${r.mustNotMiss} ${r.plan}`.toLowerCase()).join(' ');

  scores.information += Math.min(6, ['feeding','urine','onset','color','breathing','fever'].filter(hasHistory).length);
  if (hasHistory('birth') || hasHistory('screen')) scores.information += 2;
  if (ordered('gas')) scores.information += 2;

  const examCritical = ['appearance','respiratory','pulses','abdomen'];
  scores.exam += examCritical.filter(examined).length * 2;
  if (examined('fourbp')) scores.exam += 4;
  if (examined('cardiac')) scores.exam += 1;
  if (examined('ductalsats')) scores.exam += 2;

  if (firstReasoning) {
    const p = firstReasoning.problem.toLowerCase();
    if (includesAny(p, ['6-day','newborn','neonate'])) scores.reasoning += 2;
    if (includesAny(p, ['poor feeding','tachypnea','feeding'])) scores.reasoning += 2;
    if (includesAny(p, ['shock','poor perfusion','weak femoral','cool legs','differential perfusion'])) scores.reasoning += 3;
  }
  if (includesAny(allReasoningText, ['coarct','ductal-dependent','critical congenital heart','left-sided obstruction'])) scores.reasoning += 4;
  if (includesAny(allReasoningText, ['sepsis','infection'])) scores.reasoning += 2;
  if (includesAny(allReasoningText, ['prostaglandin','pge']) && includesAny(allReasoningText, ['echo','cardiology','icu','transfer'])) scores.reasoning += 2;

  if (ordered('monitoriv')) scores.stabilization += 8;
  if (ordered('airway')) scores.stabilization += 4;
  if (ordered('pge')) {
    scores.stabilization += 18;
    if (state.pgeStartedAt <= state.variant.worseningAt) scores.stabilization += 7;
    else if (state.pgeStartedAt <= state.variant.severeAt) scores.stabilization += 4;
  }
  if (state.flags.bigBolus) scores.stabilization -= 8;
  if (state.flags.furosemide) scores.stabilization -= 2;

  const escalationMessages = state.teamMessages.filter(m => ['attending','cardiology'].includes(m.role));
  if (escalationMessages.some(m => m.assessmentSignals)) scores.escalation += 5;
  if (escalationMessages.some(m => m.urgencySignals)) scores.escalation += 4;
  if (state.escalatedAt !== null) scores.escalation += 4;
  if (state.readbacks.length) scores.escalation += 2;

  if (state.pgeResponseCompleted && state.reassessedAfterPge) scores.reassessment += 8;
  if (state.reasoning.length >= 2) scores.reassessment += 2;

  if (state.flags.familyUpdated) scores.family = 5;

  for (const domain of SCORE_DOMAINS) {
    scores[domain.id] = Math.max(0, Math.min(domain.max, scores[domain.id]));
  }

  if (!examined('pulses')) misses.push({ item: 'Assess femoral pulses and differential perfusion', rationale: 'Pulse and perfusion asymmetry is a high-value clue to obstructed systemic blood flow.', consequence: 'The cardiac shock pattern may remain unrecognized.' });
  if (!examined('fourbp')) misses.push({ item: 'Obtain four-limb blood pressures', rationale: 'An upper-to-lower pressure gradient supports arch obstruction when interpreted with the examination.', consequence: 'A major localization clue was not obtained.' });
  if (!ordered('monitoriv')) misses.push({ item: 'Establish monitoring and vascular access', rationale: ORDER_META.monitoriv.rationale, consequence: 'Rescue treatment and monitoring for deterioration or apnea were less prepared.' });
  if (!ordered('pge')) misses.push({ item: 'Start prostaglandin for suspected ductal-dependent systemic circulation', rationale: ORDER_META.pge.rationale, consequence: state.endReason.includes('arrest') ? 'Progressive ductal closure culminated in cardiopulmonary arrest in this scenario.' : 'Shock continued without definitive physiologic rescue.' });
  if (!ordered('echo')) misses.push({ item: 'Request urgent echocardiography', rationale: ORDER_META.echo.rationale, consequence: 'Anatomic confirmation and definitive planning were delayed.' });
  if (state.escalatedAt === null) misses.push({ item: 'Escalate urgently to attending, cardiology, and cardiac ICU', rationale: 'Critical congenital heart disease requires parallel stabilization and definitive specialty transfer.', consequence: 'Definitive care coordination was not demonstrated.' });
  if (state.pgeResponseCompleted && !state.reassessedAfterPge) misses.push({ item: 'Reassess after treatment', rationale: 'Treatment response and residual shock must be measured rather than assumed.', consequence: 'The learner did not demonstrate whether perfusion improved or whether further support was needed.' });
  if (!state.flags.familyUpdated) misses.push({ item: 'Explain the emergency and plan to Maya’s parent', rationale: 'Clear family communication is part of safe pediatric emergency care.', consequence: 'The caregiver was not given a documented explanation of concern, treatment, or transfer.' });
  if (!state.reasoning.length) misses.push({ item: 'Commit a clinical reasoning checkpoint', rationale: 'Explicit problem representation and differential make the learner’s mental model visible for feedback.', consequence: 'Diagnostic reasoning could not be compared with the expert model.' });

  const total = SCORE_DOMAINS.reduce((sum, d) => sum + scores[d.id], 0);
  const criticalFail = !ordered('pge') || state.escalatedAt === null || state.endReason.includes('arrest');
  const mastery = total >= 80 && !criticalFail && state.reassessedAfterPge;
  return { scores, total, misses, criticalFail, mastery };
}

function reasoningKeywordFeedback(checkpoint) {
  const text = `${checkpoint.problem} ${checkpoint.differential} ${checkpoint.mostLikely} ${checkpoint.mustNotMiss} ${checkpoint.plan}`.toLowerCase();
  const found = [];
  const absent = [];
  const checks = [
    ['newborn age/context', ['newborn','neonate','6-day']],
    ['shock or impaired perfusion', ['shock','poor perfusion','weak femoral','cool legs','mottl']],
    ['ductal-dependent/critical CHD hypothesis', ['coarct','ductal-dependent','critical congenital heart','left-sided obstruction']],
    ['sepsis as alternative', ['sepsis','infection']],
    ['urgent stabilization and escalation', ['prostaglandin','pge','cardiology','icu','echo','transfer']]
  ];
  checks.forEach(([label, terms]) => (includesAny(text, terms) ? found : absent).push(label));
  return { found, absent };
}

function renderAll() {
  renderHeader();
  renderVitals();
  renderHistory();
  renderExam();
  renderOrders();
  renderTeamRoles();
  renderTeamTranscript();
  renderReasoning();
  renderPages();
  renderResults();
  renderTimeline();
}

function renderHeader() {
  $('clock').textContent = fmtTime(state.time);
  $('runState').textContent = state.ended ? 'Complete' : state.running ? 'Running' : state.started ? 'Paused' : 'Not started';
  $('pauseBtn').textContent = state.running ? 'Pause' : 'Resume';
  $('pauseBtn').disabled = !state.started || state.ended;
  $('endBtn').disabled = !state.started || state.ended;
}

function renderVitals() {
  $('vHR').textContent = Math.round(state.vitals.HR);
  $('vRR').textContent = Math.round(state.vitals.RR);
  $('vSpO2').textContent = `${Math.round(state.vitals.SpO2)}%`;
  $('vBP').textContent = state.vitals.BP;
  $('vTemp').textContent = `${Number(state.vitals.Temp).toFixed(1)} °C`;
  $('vLactate').textContent = Number(state.vitals.Lactate).toFixed(1);
  const label = state.acuity === 'critical' ? 'Critical' : state.acuity === 'stable' ? 'Improving' : 'Concerning';
  $('acuityBadge').className = `acuity ${state.acuity}`;
  $('acuityBadge').innerHTML = `<span class="dot"></span><span>${label}</span>`;
  let trajectory = 'No trend established. Gather information and reassess.';
  if (state.flags.severe && state.pgeStartedAt === null) trajectory = 'Severe progressive shock without definitive rescue treatment.';
  else if (state.flags.worsening && state.pgeStartedAt === null) trajectory = 'Perfusion is worsening as the scenario’s ductal window closes.';
  else if (state.pgeStartedAt !== null && !state.pgeResponseCompleted) trajectory = 'Prostaglandin has started; physiologic response is pending. Maintain monitoring and prepare to reassess.';
  else if (state.pgeResponseCompleted && !state.reassessedAfterPge) trajectory = 'Initial response is visible, but focused reassessment has not been documented.';
  else if (state.pgeResponseCompleted && state.reassessedAfterPge) trajectory = 'Perfusion response has been reassessed; residual illness still requires definitive transfer.';
  $('trajectory').textContent = trajectory;
}

function renderHistory() {
  const container = $('historyTranscript');
  if (!state.history.length) {
    container.innerHTML = '<p class="placeholder">No questions asked yet.</p>';
    return;
  }
  container.innerHTML = state.history.map(item => `<div class="message user"><small>${fmtTime(item.time)} · You to ${item.source === 'parent' ? 'parent' : 'nurse'}</small>${esc(item.question)}</div><div class="message response"><small>${item.source === 'parent' ? 'Parent' : 'Nurse'}</small>${esc(item.answer)}</div>`).join('');
}

function renderExam() {
  $('examMenu').innerHTML = EXAM_COMPONENTS.map(c => `<button type="button" data-exam="${c.id}" class="${state.examCounts[c.id] ? 'completed' : ''}" ${!state.started || state.ended ? 'disabled' : ''}><strong>${esc(c.label)}</strong><br><small>${state.examCounts[c.id] ? `Performed ${state.examCounts[c.id]} time${state.examCounts[c.id] > 1 ? 's' : ''}` : 'Not yet performed'}</small></button>`).join('');
  const container = $('examFindings');
  if (!state.examEvents.length) {
    container.innerHTML = '<p class="placeholder">No examination findings documented.</p>';
    return;
  }
  container.innerHTML = state.examEvents.map(e => `<div class="finding"><small>${fmtTime(e.time)} · ${e.postPge ? 'Reassessment' : 'Initial assessment'}</small><strong>${esc(e.label)}</strong><div>${esc(e.finding)}</div></div>`).join('');
}

function renderOrders() {
  const container = $('placedOrders');
  if (!state.orders.length) container.innerHTML = '<p class="placeholder">No orders placed.</p>';
  else container.innerHTML = state.orders.map(o => `<div class="placed-card"><div><strong>${esc(o.name)}</strong><br><small>Placed at ${fmtTime(o.time)}</small></div><span class="${o.status === 'pending' ? 'pending-tag' : 'complete-tag'}">${o.status === 'pending' ? 'Pending' : 'Complete'}</span></div>`).join('');
  $('pendingCount').textContent = `${state.pending.length} pending`;
}

function renderTeamRoles() {
  $('teamRoles').innerHTML = TEAM_ROLES.map(r => `<button type="button" data-role="${r.id}" class="${state.teamRole === r.id ? 'selected' : ''}" ${!state.started || state.ended ? 'disabled' : ''}><strong>${esc(r.label)}</strong><br><small>${esc(r.sub)}</small></button>`).join('');
}

function renderTeamTranscript() {
  const container = $('teamTranscript');
  if (!state.teamMessages.length) {
    container.innerHTML = '<p class="placeholder">Select a team member and communicate directly.</p>';
    return;
  }
  container.innerHTML = state.teamMessages.map(m => {
    if (m.role === 'system') return `<div class="message response"><small>${fmtTime(m.time)} · System</small>${esc(m.response)}</div>`;
    const role = TEAM_ROLES.find(r => r.id === m.role)?.label || m.role;
    return `<div class="message user"><small>${fmtTime(m.time)} · You to ${esc(role)}</small>${esc(m.text)}</div><div class="message response"><small>${esc(role)}</small>${esc(m.response)}</div>`;
  }).join('');
}

function renderReasoning() {
  $('commitReasoningBtn').textContent = `Commit checkpoint ${state.reasoning.length + 1}`;
  const container = $('reasoningHistory');
  if (!state.reasoning.length) {
    container.innerHTML = '<p class="placeholder">No reasoning checkpoint submitted.</p>';
    return;
  }
  container.innerHTML = state.reasoning.map((r, i) => `<div class="reasoning-card"><small>${fmtTime(r.time)} · Checkpoint ${i + 1} · Confidence ${r.confidence}%</small><strong>Problem representation</strong><div>${esc(r.problem || 'Not entered')}</div><strong>Differential</strong><div>${esc(r.differential || 'Not entered')}</div><strong>Most likely</strong><div>${esc(r.mostLikely || 'Not entered')}</div><strong>Must not miss</strong><div>${esc(r.mustNotMiss || 'Not entered')}</div><strong>Plan</strong><div>${esc(r.plan || 'Not entered')}</div></div>`).join('');
}

function renderPages() {
  const open = state.pages.filter(p => p.status === 'open');
  $('pageCount').textContent = `${open.length} open`;
  const container = $('pages');
  if (!state.pages.length) {
    container.innerHTML = '<p class="placeholder">No pages yet.</p>';
    return;
  }
  container.innerHTML = state.pages.map(p => `<div class="page-card ${p.urgent ? 'urgent' : ''}"><small>${fmtTime(p.time)} · ${p.patient.toUpperCase()} · ${p.status}</small><div>${esc(p.text)}</div>${p.status === 'open' && !state.ended ? `<div class="page-actions"><button type="button" data-page="${p.id}" data-page-action="ack">Acknowledge</button><button type="button" data-page="${p.id}" data-page-action="delegate">Delegate</button></div>` : p.delegatedTo ? `<small>Delegated to ${esc(p.delegatedTo)}</small>` : ''}</div>`).join('');
}

function renderResults() {
  $('pendingCount').textContent = `${state.pending.length} pending`;
  const container = $('results');
  const pendingCards = state.pending.map(p => `<div class="result-card neutral"><small>Pending · expected in ${Math.max(0, p.due - state.time)} scenario seconds</small><strong>${esc(p.title)}</strong></div>`).join('');
  const resultCards = state.results.map(r => `<div class="result-card ${r.tone}"><small>${fmtTime(r.time)}</small><strong>${esc(r.title)}</strong><div>${esc(r.text)}</div></div>`).join('');
  container.innerHTML = pendingCards || resultCards ? pendingCards + resultCards : '<p class="placeholder">No results available.</p>';
}

function renderTimeline() {
  $('eventCount').textContent = `${state.timeline.length} events`;
  const container = $('timeline');
  if (!state.timeline.length) {
    container.innerHTML = '<p class="placeholder">The encounter has not started.</p>';
    return;
  }
  container.innerHTML = state.timeline.map(e => `<div class="timeline-item"><small>${fmtTime(e.time)} · ${esc(e.kind)}</small>${esc(e.text)}</div>`).join('');
}

function renderDebrief() {
  const assessment = calculateScore();
  $('debriefOutcome').textContent = state.endReason;
  $('masteryBadge').className = `mastery ${assessment.mastery ? 'met' : 'notmet'}`;
  $('masteryBadge').textContent = assessment.mastery ? `Mastery met · ${assessment.total}/100` : `Mastery not met · ${assessment.total}/100`;

  $('debriefScore').innerHTML = `<h3>2. Weighted performance</h3><table class="score-table"><thead><tr><th>Domain</th><th>Score</th><th>Maximum</th></tr></thead><tbody>${SCORE_DOMAINS.map(d => `<tr><td>${esc(d.label)}</td><td class="${assessment.scores[d.id] >= d.max * .7 ? 'score-positive' : 'score-negative'}">${assessment.scores[d.id]}</td><td>${d.max}</td></tr>`).join('')}</tbody></table><p><strong>Critical failure rule:</strong> ${assessment.criticalFail ? 'Triggered' : 'Not triggered'}. Mastery requires at least 80/100, no critical failure, and documented post-treatment reassessment.</p><p><strong>Time to prostaglandin:</strong> ${state.pgeStartedAt === null ? 'Not started' : fmtTime(state.pgeStartedAt)}. <strong>Time to escalation:</strong> ${state.escalatedAt === null ? 'Not demonstrated' : fmtTime(state.escalatedAt)}.</p>`;

  $('debriefMisses').innerHTML = `<h3>3. Missed or incomplete actions</h3>${assessment.misses.length ? `<table class="miss-table"><thead><tr><th>Gap</th><th>Why it matters</th><th>Observed consequence</th></tr></thead><tbody>${assessment.misses.map(m => `<tr><td>${esc(m.item)}</td><td>${esc(m.rationale)}</td><td>${esc(m.consequence)}</td></tr>`).join('')}</tbody></table>` : '<p>No scored gaps were identified.</p>'}${state.flags.bigBolus ? `<p class="score-negative"><strong>Safety event:</strong> A rapid large-volume bolus worsened congestion and respiratory distress.</p>` : ''}`;

  const expert = 'A term 6-day-old with progressive feeding intolerance, tachypnea, oliguria, differential upper-versus-lower perfusion, weak femoral pulses, hepatomegaly, and rising lactate has shock from suspected ductal-dependent systemic circulation, most concerning for critical coarctation. Immediate priorities are monitoring and access, prostaglandin with apnea readiness, urgent cardiology/cardiac ICU escalation, echocardiography, and serial perfusion reassessment while keeping sepsis in the differential.';
  const reasoningHtml = state.reasoning.length ? state.reasoning.map((r, i) => {
    const feedback = reasoningKeywordFeedback(r);
    return `<div class="comparison"><div><h4>Your checkpoint ${i + 1} at ${fmtTime(r.time)}</h4><p><strong>Problem:</strong> ${esc(r.problem || 'Not entered')}</p><p><strong>Differential:</strong> ${esc(r.differential || 'Not entered')}</p><p><strong>Most likely:</strong> ${esc(r.mostLikely || 'Not entered')}</p><p><strong>Must not miss:</strong> ${esc(r.mustNotMiss || 'Not entered')}</p><p><strong>Plan:</strong> ${esc(r.plan || 'Not entered')}</p><p><strong>Confidence:</strong> ${r.confidence}%</p></div><div><h4>Formative keyword-supported analysis</h4><p><strong>Represented:</strong> ${feedback.found.length ? esc(feedback.found.join(', ')) : 'None of the targeted concepts were detected.'}</p><p><strong>Not detected:</strong> ${feedback.absent.length ? esc(feedback.absent.join(', ')) : 'All targeted concepts were detected.'}</p></div></div>`;
  }).join('') : '<p>No reasoning checkpoint was recorded, so the learner’s mental model cannot be reconstructed.</p>';
  $('debriefReasoning').innerHTML = `<h3>4. Mental-model comparison</h3>${reasoningHtml}<div class="comparison"><div><h4>Expert problem representation</h4><p>${esc(expert)}</p></div><div><h4>Interpretation limit</h4><p>This automated comparison uses transparent keyword rules. It supports reflection but is not a validated assessment of reasoning quality.</p></div></div>`;

  $('debriefTimeline').innerHTML = `<h3>5. Timeline reconstruction</h3><div class="timeline">${state.timeline.slice().reverse().map(e => `<div class="timeline-item"><small>${fmtTime(e.time)} · ${esc(e.kind)}</small>${esc(e.text)}</div>`).join('')}</div>`;
}

function activateTab(tabId) {
  document.querySelectorAll('[role="tab"]').forEach(tab => {
    const active = tab.dataset.tab === tabId;
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    const panel = $(`panel-${tab.dataset.tab}`);
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
}

function bindEvents() {
  $('startBtn').addEventListener('click', startEncounter);
  $('pauseBtn').addEventListener('click', () => {
    if (!state.started || state.ended) return;
    state.running = !state.running;
    state.lastTick = state.running ? Date.now() : null;
    renderHeader();
  });
  $('resetBtn').addEventListener('click', () => resetState(state.variantIndex));
  $('endBtn').addEventListener('click', () => endEncounter('Encounter ended by learner for debrief.'));
  $('askHistoryBtn').addEventListener('click', askHistory);
  $('historyInput').addEventListener('keydown', e => { if (e.key === 'Enter') askHistory(); });
  $('orderSearch').addEventListener('input', searchOrders);
  $('sendTeamBtn').addEventListener('click', sendTeamMessage);
  $('confirmReadbackBtn').addEventListener('click', confirmReadback);
  $('confidence').addEventListener('input', () => $('confidenceValue').textContent = `${$('confidence').value}%`);
  $('commitReasoningBtn').addEventListener('click', commitReasoning);
  $('saveReactionBtn').addEventListener('click', () => { state.reaction = $('reactionText').value.trim(); });
  $('variantBtn').addEventListener('click', () => resetState((state.variantIndex + 1) % VARIANTS.length));
  $('restartBtn').addEventListener('click', () => resetState(state.variantIndex));
  $('futureCommitment').addEventListener('input', () => { state.futureCommitment = $('futureCommitment').value; });

  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) activateTab(tab.dataset.tab);
    const exam = e.target.closest('[data-exam]');
    if (exam) performExam(exam.dataset.exam);
    const order = e.target.closest('[data-order]');
    if (order) placeOrder(order.dataset.order);
    const role = e.target.closest('[data-role]');
    if (role) selectTeamRole(role.dataset.role);
    const page = e.target.closest('[data-page]');
    if (page) acknowledgePage(page.dataset.page, page.dataset.pageAction);
  });
}

bindEvents();
state = freshState(0);
intervalId = setInterval(tick, 250);
renderAll();
window.__PHS_READY__ = true;
window.__PHS_TEST__ = {
  getState: () => state,
  advance: seconds => advanceScenario(seconds),
  placeOrder,
  performExam,
  askHistoryQuestion: (question, source = 'parent') => { $('historyInput').value = question; $('historySource').value = source; askHistory(); },
  end: reason => endEncounter(reason || 'Test end')
};

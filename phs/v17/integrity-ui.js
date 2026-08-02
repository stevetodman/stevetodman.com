'use strict';

renderOrders = function renderOrdersV18() {
  const patient = state.patients[state.selectedId];
  const query = $('orderSearch').value.trim().toLowerCase();
  let items = [];
  if (query.length >= PHS_MIN_ORDER_QUERY) items = patient.orders.filter(order => `${order.name} ${order.type} ${order.id}`.toLowerCase().includes(query));
  if (query.length < PHS_MIN_ORDER_QUERY) {
    $('orderMenu').innerHTML = `<p class="muted">Enter at least ${PHS_MIN_ORDER_QUERY} characters to search orders and treatments.</p>`;
  } else {
    $('orderMenu').innerHTML = items.map(order => {
      const placed = !!orderRecord(state.selectedId, order.id);
      return `<button class="action-card" data-order="${order.id}" ${clinicalDisabled() || placed ? 'disabled' : ''}><b>${esc(order.name)}</b><small>${esc(order.type)} · ${fmtTime(order.attention)} attention · ${fmtTime(order.process)} process${placed ? ' · placed' : ''}</small></button>`;
    }).join('') || '<p class="muted">No matching orders.</p>';
  }
  document.querySelectorAll('[data-order]').forEach(button => button.onclick = () => placeOrder(button.dataset.order));
  $('orderLog').innerHTML = patient.ordersPlaced.length ? patient.ordersPlaced.slice().reverse().map(order => `<div class="feed-item"><small>${fmtTime(order.placedAt)} · ${esc(order.type)}</small><b>${esc(order.name)}</b><div>Status: ${esc(order.status)}</div></div>`).join('') : '<p class="muted">No orders placed.</p>';
};

interpretResult = function interpretResultV18(patientId, resultId, interpretationText) {
  if (!canInteract()) return false;
  const result = state.patients[patientId].results.find(item => item.id === resultId);
  if (!result || result.reviewedAt == null || result.interpretedAt != null) return false;
  const text = String(arguments.length < 3 ? phsDefaultInterpretation(patientId, result) : (interpretationText || '')).trim();
  if (!phsInterpretationQuality(patientId, result, text)) {
    showUrgent('Document a clinically meaningful interpretation and management implication before submitting.');
    return false;
  }
  if (!spendAttention(15, `Interpret result: ${result.title}`, patientId)) return false;
  result.interpretedAt = state.time;
  result.interpretationText = text;
  result.interpretationQuality = true;
  const order = orderRecord(patientId, result.orderId);
  if (order) order.status = 'interpreted';
  addTimeline(`Result interpreted: ${result.title}. Learner interpretation: ${text}`, patientId, 'interpretation');
  renderAll();
  return true;
};

renderResults = function renderResultsV18() {
  const patient = state.patients[state.selectedId];
  let html = patient.results.length ? patient.results.map(result => {
    const interpretation = result.reviewedAt != null && result.requiresInterpretation && result.interpretedAt == null ? `<div class="interpretation-box"><label for="interpretation-${result.id}">Clinical interpretation and management implication</label><textarea id="interpretation-${result.id}" rows="2" data-interpretation-input="${result.id}"></textarea><button data-interpret="${result.id}" ${clinicalDisabled() ? 'disabled' : ''}>Submit interpretation · 0:15</button></div>` : '';
    return `<div class="feed-item ${esc(result.tone)}"><small>${fmtTime(result.availableAt)}</small><b>${esc(result.title)}</b>${result.reviewedAt == null ? '<div class="muted">Result not yet opened.</div>' : `<div>${esc(result.text)}</div>`}<div class="row">${result.reviewedAt == null ? `<button data-review="${result.id}" ${clinicalDisabled() ? 'disabled' : ''}>Review · 0:10</button>` : ''}${result.interpretedAt != null ? '<span class="badge">Interpreted</span>' : ''}</div>${interpretation}${result.interpretationText ? `<div class="muted">Interpretation: ${esc(result.interpretationText)}</div>` : ''}</div>`;
  }).join('') : '<p class="muted">No results available.</p>';
  if (state.selectedId === 'nora' && state.flags.noraJudgmentPrompt && !state.noraJudgment) html += `<div class="feed-item warn"><b>Commit a provisional culture interpretation</b><select id="noraJudgment"><option value="likely pathogen">Likely pathogen</option><option value="indeterminate">Indeterminate</option><option value="likely contaminant">Likely contaminant</option></select><label>Confidence <span id="noraConfidenceLabel">50%</span></label><input id="noraConfidence" type="range" min="0" max="100" value="50"><button id="submitNoraJudgment" class="primary" ${clinicalDisabled() ? 'disabled' : ''}>Commit judgment · 0:20</button></div>`;
  if (state.noraJudgment && state.selectedId === 'nora') html += `<div class="feed-item"><b>Provisional judgment recorded</b><div>${esc(state.noraJudgment.value)} at ${state.noraJudgment.confidence}% confidence</div></div>`;
  $('resultLog').innerHTML = html;
  document.querySelectorAll('[data-review]').forEach(button => button.onclick = () => reviewResult(state.selectedId, button.dataset.review));
  document.querySelectorAll('[data-interpret]').forEach(button => button.onclick = () => {
    const input = $(`interpretation-${button.dataset.interpret}`);
    interpretResult(state.selectedId, button.dataset.interpret, input?.value || '');
  });
  if ($('noraConfidence')) $('noraConfidence').oninput = event => $('noraConfidenceLabel').textContent = `${event.target.value}%`;
  if ($('submitNoraJudgment')) $('submitNoraJudgment').onclick = () => submitNoraJudgment($('noraJudgment').value, $('noraConfidence').value);
};

const phsOriginalSendTeamMessage = sendTeamMessage;
sendTeamMessage = function sendTeamMessageV18(role, message) {
  const patientId = state.selectedId;
  const before = patientId ? state.patients[patientId].teamMessages.length : 0;
  phsOriginalSendTeamMessage(role, message);
  if (!patientId) return;
  const messages = state.patients[patientId].teamMessages;
  if (messages.length > before) {
    const entry = messages[messages.length - 1];
    entry.quality = phsMessageQuality(patientId, role, entry.message);
    entry.qualityAdequate = entry.quality >= 3;
    if (!entry.qualityAdequate) showUrgent('Message sent, but it lacks sufficient assessment, urgency, request, or contingency content for assessment credit.');
    renderAll();
  }
};

renderTeam = function renderTeamV18() {
  phsEnsureStaffState();
  const patient = state.patients[state.selectedId];
  $('roleMenu').innerHTML = TEAM_ROLES.map(role => `<button data-role="${role.id}" class="${state.teamRole === role.id ? 'active' : ''}" ${clinicalDisabled() ? 'disabled' : ''}>${esc(role.label)}</button>`).join('');
  document.querySelectorAll('[data-role]').forEach(button => button.onclick = () => { state.teamRole = button.dataset.role; renderTeam(); });
  $('sendTeamBtn').disabled = clinicalDisabled() || !state.teamRole;
  $('readbackBtn').classList.toggle('hidden', !state.pendingReadback);
  $('readbackBtn').disabled = clinicalDisabled();
  $('teamLog').innerHTML = patient.teamMessages.length ? patient.teamMessages.slice().reverse().map(message => `<div class="feed-item"><small>${fmtTime(message.time)} · ${esc(message.role)}</small><div>${esc(message.message)}</div><div>${message.readback ? 'Read-back confirmed' : 'Read-back not confirmed'} · ${message.qualityAdequate ? 'assessment content adequate' : 'content incomplete'}</div></div>`).join('') : '<p class="muted">No team communication recorded.</p>';
  let delegation = $('delegationPanel');
  if (!delegation) {
    delegation = document.createElement('div');
    delegation.id = 'delegationPanel';
    delegation.className = 'delegation-panel';
    $('teamLog').before(delegation);
  }
  const tasks = phsDelegationTasks(state.selectedId);
  delegation.innerHTML = `<b>Delegate finite staff work</b><p class="muted">Nurse and intern can each perform one task at a time while you continue other work.</p><div class="delegation-grid"><label>Resource<select id="delegationResource"><option value="nurse">Bedside nurse</option><option value="intern">Intern</option></select></label><label>Task<select id="delegationTask"></select></label><button id="delegateBtn" ${clinicalDisabled() ? 'disabled' : ''}>Assign · 0:15</button></div><div class="compact-list">${Object.entries(state.staff).map(([id, resource]) => `<div class="feed-item"><b>${esc(resource.label)}</b><div>${resource.busyUntil > state.time ? `Busy until ${fmtTime(resource.busyUntil)}` : 'Available'}</div></div>`).join('')}</div>`;
  const resourceSelect = $('delegationResource');
  const taskSelect = $('delegationTask');
  const refreshTasks = () => {
    const matching = tasks.filter(task => task.resource === resourceSelect.value);
    taskSelect.innerHTML = matching.map(task => `<option value="${task.id}">${esc(task.label)} · ${fmtTime(task.duration)}</option>`).join('') || '<option value="">No available task</option>';
    $('delegateBtn').disabled = clinicalDisabled() || !matching.length;
  };
  resourceSelect.onchange = refreshTasks;
  refreshTasks();
  $('delegateBtn').onclick = () => phsAssignDelegation(resourceSelect.value, taskSelect.value);
};

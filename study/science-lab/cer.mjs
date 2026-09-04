const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const sameSet = (left = [], right = []) => left.length === right.length && [...left].sort((a,b) => a-b).every((value,index) => value === [...right].sort((a,b) => a-b)[index]);

export function validateCer(cer) {
  if (!cer || !cer.claim || !cer.evidence || !cer.reasoning) throw new Error('CER needs claim, evidence, and reasoning');
  if (!Array.isArray(cer.claim.choices) || !Number.isInteger(cer.claim.answer)) throw new Error('CER claim is invalid');
  if (!Array.isArray(cer.evidence.choices) || !Array.isArray(cer.evidence.answers) || !cer.evidence.answers.length) throw new Error('CER evidence is invalid');
  if (!Array.isArray(cer.reasoning.choices) || !Number.isInteger(cer.reasoning.answer)) throw new Error('CER reasoning is invalid');
  return true;
}

export function cerComplete(cer, response = {}) {
  return Number.isInteger(response.claim) && Number.isInteger(response.reasoning) && Array.isArray(response.evidence) && response.evidence.length === cer.evidence.answers.length;
}

export function scoreCer(cer, response = {}) {
  validateCer(cer);
  const claimCorrect = response.claim === cer.claim.answer;
  const evidenceCorrect = sameSet(response.evidence || [], cer.evidence.answers);
  const reasoningCorrect = response.reasoning === cer.reasoning.answer;
  const score = Number(claimCorrect) + Number(evidenceCorrect) + Number(reasoningCorrect);
  return { claimCorrect, evidenceCorrect, reasoningCorrect, score, max: 3, correct: score === 3 };
}

function componentHint(label, correct, repairHint) {
  if (correct === undefined) return '';
  return `<p class="cer-component-feedback ${correct ? 'secure' : 'repair'}"><strong>${esc(label)}:</strong> ${correct ? 'supported' : esc(repairHint || 'revise this part using the evidence')}</p>`;
}

export function cerBuilderMarkup(cer, response = {}, priorRubric = null) {
  validateCer(cer);
  const selectedEvidence = new Set(response.evidence || []);
  const claim = `<section class="cer-part"><p class="cer-part-label">Claim</p>${componentHint('Claim', priorRubric?.claimCorrect, cer.claim.repairHint)}<div class="choice-list">${cer.claim.choices.map((choice,index) => `<button type="button" class="choice${response.claim === index ? ' selected' : ''}" data-cer-claim="${index}" aria-pressed="${response.claim === index}">${esc(choice)}</button>`).join('')}</div></section>`;
  const evidence = `<section class="cer-part"><p class="cer-part-label">Evidence · choose ${cer.evidence.answers.length}</p>${componentHint('Evidence', priorRubric?.evidenceCorrect, cer.evidence.repairHint)}<div class="choice-list multi">${cer.evidence.choices.map((choice,index) => `<button type="button" class="choice${selectedEvidence.has(index) ? ' selected' : ''}" data-cer-evidence="${index}" aria-pressed="${selectedEvidence.has(index)}">${esc(choice)}</button>`).join('')}</div></section>`;
  const reasoning = `<section class="cer-part"><p class="cer-part-label">Reasoning</p>${componentHint('Reasoning', priorRubric?.reasoningCorrect, cer.reasoning.repairHint)}<div class="choice-list">${cer.reasoning.choices.map((choice,index) => `<button type="button" class="choice${response.reasoning === index ? ' selected' : ''}" data-cer-reasoning="${index}" aria-pressed="${response.reasoning === index}">${esc(choice)}</button>`).join('')}</div></section>`;
  return `<section class="cer-builder" aria-label="Claim Evidence Reasoning builder"><div class="cer-scaffold"><span>C</span><b>Claim</b><span>E</span><b>Evidence</b><span>R</span><b>Reasoning</b></div>${claim}${evidence}${reasoning}</section>`;
}

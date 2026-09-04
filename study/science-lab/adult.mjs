import { SCIENCE_LAB_CONFIG } from './config.mjs';
import { learningStateLabel, normalizeStore, skillStatus } from './core.mjs';

const app = document.getElementById('app');
const matterUnit = SCIENCE_LAB_CONFIG.units.find(unit => unit.id === 'matter');
const matterSkills = matterUnit?.skills || [];
const itemById = new Map(SCIENCE_LAB_CONFIG.items.map(item => [item.id, item]));
const phenomenonById = new Map((SCIENCE_LAB_CONFIG.phenomena || []).map(phenomenon => [phenomenon.id, phenomenon]));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const provenanceOf = attempt => attempt?.provenance || (attempt?.recovery ? 'recovery' : 'independent');

function loadRoot() {
  try { return normalizeStore(JSON.parse(localStorage.getItem(SCIENCE_LAB_CONFIG.storageKey) || 'null')); }
  catch (_) { return normalizeStore(null); }
}

function humanizeTag(tag) {
  if (!tag) return 'None recorded';
  return tag.replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function misconceptionSummary(profile, skill) {
  const misses = (profile.attempts || []).filter(attempt => attempt.skill === skill && provenanceOf(attempt) === 'independent' && !attempt.correct && attempt.misconceptionTag);
  if (!misses.length) return 'None recorded';
  const counts = new Map();
  for (const miss of misses) counts.set(miss.misconceptionTag, (counts.get(miss.misconceptionTag) || 0) + 1);
  const [tag, count] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return count >= 2 ? `${humanizeTag(tag)} · recurring (${count} independent misses)` : `${humanizeTag(misses.at(-1).misconceptionTag)} · recent`;
}

function evidenceSummary(profile, skill) {
  const attempts = (profile.attempts || []).filter(attempt => attempt.skill === skill);
  const independent = attempts.filter(attempt => provenanceOf(attempt) === 'independent');
  return {
    independentCorrect: independent.filter(attempt => attempt.correct).length,
    independentTotal: independent.length,
    delayedCorrect: independent.filter(attempt => attempt.correct && attempt.delayedRetrieval).length,
    transferCorrect: independent.filter(attempt => attempt.correct && attempt.transfer).length
  };
}

function latestCer(profile) {
  const sessions = (profile.sessions || []).filter(session => session.kind === 'phenomenon' && session.cer?.first?.rubric).slice().reverse();
  if (!sessions.length) return null;
  const session = sessions[0];
  const first = session.cer.first;
  const revised = session.cer.revised;
  return {
    phenomenonId: session.phenomenonId,
    independent: `${first.rubric.score}/${first.rubric.max}`,
    guided: revised?.rubric ? `${revised.rubric.score}/${revised.rubric.max}` : null
  };
}

function nextAction(status, skillLabel) {
  if (status.state === 'needs-repair') return `Repair ${skillLabel} with a different context, then recheck independently later.`;
  if (status.state === 'repaired') return `Do not overpractice now; wait for delayed independent retrieval of ${skillLabel}.`;
  if (status.state === 'retained') return `Use a meaningfully different transfer task for ${skillLabel}.`;
  if (status.state === 'transfer-demonstrated') return `Continue spaced independent retrieval before calling ${skillLabel} secure.`;
  if (status.state === 'secure') return `Maintain ${skillLabel} with occasional mixed retrieval.`;
  if (status.state === 'learning') return `Continue short independent ${skillLabel} practice; use hints only after an attempt.`;
  return `Begin ${skillLabel} with short independent practice or the related deep investigation.`;
}

function reasoningSource(attempt) {
  const item = itemById.get(attempt.itemId);
  if (item) return item;
  if (!attempt.phenomenonId || !attempt.phenomenonStep) return null;
  return phenomenonById.get(attempt.phenomenonId)?.steps?.find(step => step.id === attempt.phenomenonStep) || null;
}

function practiceDimensions(profile) {
  const attempts = (profile.attempts || []).filter(attempt => provenanceOf(attempt) === 'independent' && attempt.unit === 'matter');
  const dimensions = new Map();
  for (const attempt of attempts) {
    const source = reasoningSource(attempt);
    if (!source?.sep) continue;
    const value = dimensions.get(source.sep) || { correct: 0, total: 0 };
    value.total += 1;
    if (attempt.correct) value.correct += 1;
    dimensions.set(source.sep, value);
  }
  if (!dimensions.size) return '<p class="muted">No independent SEP evidence yet.</p>';
  return `<ul class="dimension-list">${[...dimensions.entries()].map(([name, value]) => `<li><span>${esc(name)}</span><strong>${value.correct}/${value.total} independent correct</strong></li>`).join('')}</ul>`;
}

function skillCard(profile, skill) {
  const status = skillStatus(profile, skill.id);
  const evidence = evidenceSummary(profile, skill.id);
  return `<article class="adult-skill" data-state="${esc(status.state)}">
    <div class="skill-title"><h3>${esc(skill.label)}</h3><span>${esc(learningStateLabel(status.state))}</span></div>
    <dl>
      <div><dt>Independent</dt><dd>${evidence.independentCorrect}/${evidence.independentTotal} correct</dd></div>
      <div><dt>Delayed retrieval</dt><dd>${evidence.delayedCorrect ? `${evidence.delayedCorrect} successful` : 'Not yet demonstrated'}</dd></div>
      <div><dt>Transfer</dt><dd>${evidence.transferCorrect ? `${evidence.transferCorrect} successful` : 'Not yet demonstrated'}</dd></div>
      <div><dt>Misconception</dt><dd>${esc(misconceptionSummary(profile, skill.id))}</dd></div>
    </dl>
    <p class="next-action"><strong>Next:</strong> ${esc(nextAction(status, skill.label.toLowerCase()))}</p>
  </article>`;
}

function learnerSection(name, profile) {
  const cer = latestCer(profile);
  const attemptCount = (profile.attempts || []).filter(attempt => attempt.unit === 'matter').length;
  return `<section class="learner-evidence" aria-labelledby="${name.toLowerCase()}-heading">
    <div class="learner-evidence-head"><div><p class="eyebrow">Matter evidence</p><h2 id="${name.toLowerCase()}-heading">${esc(name)}</h2></div><span>${attemptCount ? `${attemptCount} recorded Matter attempts` : 'No Matter attempts yet'}</span></div>
    <div class="adult-skill-grid">${matterSkills.map(skill => skillCard(profile, skill)).join('')}</div>
    <div class="adult-evidence-lower">
      <article><h3>Scientific-practice evidence</h3>${practiceDimensions(profile)}</article>
      <article><h3>Latest CER</h3>${cer ? `<p><strong>Independent:</strong> ${esc(cer.independent)} components correct</p><p><strong>Guided revision:</strong> ${esc(cer.guided || 'Not needed / not completed')}</p>` : '<p class="muted">No completed CER yet.</p>'}</article>
    </div>
  </section>`;
}

const root = loadRoot();
app.innerHTML = `<div class="course-shell adult-shell">
  <header class="course-head"><a href="/study/matter-lab.html" class="home-link">← Science Lab</a><div><span>Adult view</span><strong>Matter evidence</strong></div></header>
  <main class="adult-main">
    <p class="eyebrow">Evidence, not a grade</p>
    <h1>Matter learning evidence</h1>
    <p class="lede">Each learner is shown separately. States distinguish independent work from hints, repair, delayed retrieval, and transfer; there is no sibling ranking or pseudo-precise mastery score.</p>
    ${learnerSection('Luke', root.learners.Luke)}
    ${learnerSection('Samantha', root.learners.Samantha)}
    <p class="adult-note">This view summarizes evidence stored on this device. Guided and recovery work can show repair, but they do not by themselves establish secure content mastery.</p>
  </main>
</div>`;

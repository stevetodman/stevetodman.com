(function () {
  'use strict';

  const letters = ['A', 'B', 'C', 'D', 'E'];
  const stackSelect = document.getElementById('stack-select');
  const startButton = document.getElementById('start-stack');
  const stage = document.getElementById('bank-stage');
  const summary = document.getElementById('bank-summary');
  const version = document.getElementById('bank-version');
  const status = document.getElementById('bank-status');

  let manifest;
  let sources;
  let session = null;

  function shuffled(items) {
    const copy = items.map(item => ({ ...item }));
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      const swap = random[0] % (index + 1);
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function el(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.type) node.type = options.type;
    if (options.id) node.id = options.id;
    return node;
  }

  async function loadJson(file) {
    const response = await fetch(file, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load ${file}: ${response.status}`);
    return response.json();
  }

  async function initialize() {
    try {
      [manifest, sources] = await Promise.all([loadJson('manifest.json'), loadJson('sources.json')]);
      version.textContent = `Version ${manifest.version}`;
      status.textContent = manifest.status.replaceAll('-', ' ');
      summary.textContent = `${manifest.question_count} core questions across ${manifest.stack_count} stacks. ${manifest.review.medical_review}.`;

      for (const entry of manifest.stacks) {
        const option = el('option', { text: `Stack ${entry.stack}: ${entry.focus}` });
        option.value = entry.file;
        stackSelect.appendChild(option);
      }
      stackSelect.disabled = false;
      startButton.disabled = false;
    } catch (error) {
      stage.replaceChildren(el('div', { className: 'card bank-error', text: `Question bank could not be loaded. ${error.message}` }));
    }
  }

  async function startStack() {
    startButton.disabled = true;
    stage.replaceChildren(el('div', { className: 'card', text: 'Loading stack…' }));
    try {
      const stack = await loadJson(stackSelect.value);
      session = {
        stack,
        graded: false,
        questions: stack.questions.map(question => ({
          question,
          displayOptions: shuffled(question.options)
        }))
      };
      renderExam();
    } catch (error) {
      stage.replaceChildren(el('div', { className: 'card bank-error', text: `Unable to load stack. ${error.message}` }));
    } finally {
      startButton.disabled = false;
    }
  }

  function renderExam() {
    const form = el('form', { className: 'bank-form', id: 'bank-form' });
    const intro = el('div', { className: 'bank-stack-heading card' });
    intro.append(el('p', { className: 'kicker', text: `Stack ${session.stack.stack}` }));
    intro.append(el('h2', { text: session.stack.focus }));
    intro.append(el('p', { text: 'Select one best answer for every question. Explanations remain hidden until the stack is graded.' }));
    form.append(intro);

    session.questions.forEach(({ question, displayOptions }, questionIndex) => {
      const fieldset = el('fieldset', { className: 'card bank-question' });
      fieldset.dataset.questionId = question.id;
      const legend = el('legend');
      legend.append(el('span', { className: 'bank-number', text: `${questionIndex + 1}` }));
      legend.append(document.createTextNode(` ${question.stem}`));
      fieldset.append(legend);

      const list = el('div', { className: 'bank-option-list' });
      displayOptions.forEach((option, optionIndex) => {
        const label = el('label', { className: 'bank-option' });
        const input = el('input');
        input.type = 'radio';
        input.name = question.id;
        input.value = option.id;
        input.dataset.displayLetter = letters[optionIndex];
        label.append(input);
        label.append(el('span', { className: 'bank-option-letter', text: letters[optionIndex] }));
        label.append(el('span', { text: option.text }));
        list.append(label);
      });
      fieldset.append(list);
      form.append(fieldset);
    });

    const actions = el('div', { className: 'card bank-actions' });
    const message = el('p', { className: 'note', id: 'bank-message' });
    const grade = el('button', { className: 'button', type: 'submit', text: 'Grade stack' });
    actions.append(grade, message);
    form.append(actions);
    form.addEventListener('submit', gradeStack);
    stage.replaceChildren(form);
    window.scrollTo({ top: stage.offsetTop - 20, behavior: 'smooth' });
  }

  function gradeStack(event) {
    event.preventDefault();
    if (!session || session.graded) return;
    const form = event.currentTarget;
    const unanswered = session.questions.filter(({ question }) => !form.querySelector(`input[name="${question.id}"]:checked`));
    const message = document.getElementById('bank-message');
    if (unanswered.length) {
      message.textContent = `Answer all 10 questions before grading. ${unanswered.length} remaining.`;
      form.querySelector(`[data-question-id="${unanswered[0].question.id}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    session.graded = true;
    let score = 0;
    session.questions.forEach(({ question, displayOptions }) => {
      const fieldset = form.querySelector(`[data-question-id="${question.id}"]`);
      const selected = fieldset.querySelector(`input[name="${question.id}"]:checked`).value;
      const correct = selected === question.correct_option_id;
      if (correct) score += 1;
      fieldset.classList.add(correct ? 'bank-correct' : 'bank-incorrect');
      fieldset.querySelectorAll('input').forEach(input => { input.disabled = true; });

      const correctIndex = displayOptions.findIndex(option => option.id === question.correct_option_id);
      const selectedIndex = displayOptions.findIndex(option => option.id === selected);
      const feedback = el('div', { className: 'bank-feedback' });
      feedback.append(el('p', {
        className: 'bank-result-line',
        text: correct
          ? `Correct — ${letters[correctIndex]}.`
          : `Incorrect — you chose ${letters[selectedIndex]}; the best answer is ${letters[correctIndex]}.`
      }));
      feedback.append(el('p', { text: question.rationale }));

      const explanations = el('div', { className: 'bank-explanations' });
      displayOptions.forEach((option, optionIndex) => {
        const detail = el('details');
        const heading = el('summary', { text: `${letters[optionIndex]}. ${option.text}` });
        detail.append(heading);
        detail.append(el('p', { text: question.option_explanations[option.id] }));
        explanations.append(detail);
      });
      feedback.append(explanations);
      feedback.append(el('p', { className: 'bank-objective', text: `Learning objective: ${question.learning_objective}` }));
      feedback.append(el('p', { className: 'bank-pearl', text: `Board pearl: ${question.board_pearl}` }));
      feedback.append(el('p', { className: 'bank-meta', text: `${question.concept} · Difficulty ${question.difficulty} · ${question.cognitive_level}` }));

      const evidence = el('details', { className: 'bank-evidence' });
      evidence.append(el('summary', { text: 'Evidence mapping' }));
      const evidenceList = el('ul');
      question.evidence.forEach(item => {
        const source = sources[item.source_id];
        evidenceList.append(el('li', { text: `${item.claim} — ${source ? source.title : item.source_id}` }));
      });
      evidence.append(evidenceList);
      feedback.append(evidence);
      fieldset.append(feedback);
    });

    const result = el('section', { className: 'card bank-score', id: 'bank-score' });
    result.append(el('p', { className: 'kicker', text: 'Stack result' }));
    result.append(el('h2', { text: `${score}/10` }));
    result.append(el('p', { text: 'Review every option explanation. This draft bank is for self-study and remains pending independent medical/item-writer review.' }));

    const retry = el('button', { className: 'button button-secondary', type: 'button', text: 'Retake with reshuffled choices' });
    retry.addEventListener('click', () => {
      session.questions = session.stack.questions.map(question => ({ question, displayOptions: shuffled(question.options) }));
      session.graded = false;
      renderExam();
    });
    const next = el('button', { className: 'button', type: 'button', text: 'Load next stack' });
    next.addEventListener('click', () => {
      const index = [...stackSelect.options].findIndex(option => option.value === stackSelect.value);
      stackSelect.selectedIndex = (index + 1) % stackSelect.options.length;
      startStack();
    });
    const buttons = el('div', { className: 'bank-score-actions' });
    buttons.append(retry, next);
    result.append(buttons);
    form.prepend(result);
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  startButton.addEventListener('click', startStack);
  initialize();
})();

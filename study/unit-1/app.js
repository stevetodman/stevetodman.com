(function () {
  'use strict';

  var STORAGE_KEY = 'studyhub-word-mission-unit1-v2';
  var TEST_DATES = {
    vocabulary: new Date('2026-09-01T08:00:00'),
    spelling: new Date('2026-09-02T08:00:00')
  };
  var DOMAINS = ['definition', 'synonym', 'antonym', 'spelling'];
  var DOMAIN_LABELS = { definition:'Definitions', synonym:'Synonyms', antonym:'Antonyms', spelling:'Spelling' };

  var WORDS = [
    {
      word:'blunder', pos:'verb · noun',
      definitions:['to make a foolish or careless mistake','a serious or thoughtless mistake'],
      synonyms:['err','foul up','bungle','goof','error','blooper'],
      antonyms:['triumph','succeed','success','hit'],
      example:'I made a blunder when I put salt in the lemonade.',
      spellingSentence:'That careless blunder cost our team a point.'
    },
    {
      word:'cancel', pos:'verb',
      definitions:['to call off or do away with; to cross out so it cannot be used again'],
      synonyms:['stop','discontinue','drop','repeal','revoke'],
      antonyms:['renew','continue','extend','maintain'],
      example:'The team had to cancel practice because of lightning.',
      spellingSentence:'The storm may cancel our outdoor practice.'
    },
    {
      word:'continuous', pos:'adjective',
      definitions:['going on without a stop or break'],
      synonyms:['ongoing','endless','ceaseless','unbroken','constant','perpetual'],
      antonyms:['broken','discontinuous','interrupted'],
      example:'A continuous hum came from the old refrigerator.',
      spellingSentence:'The machine made one continuous sound.'
    },
    {
      word:'distribute', pos:'verb',
      definitions:['to give out in shares; to scatter or spread'],
      synonyms:['divide','share','deal','issue'],
      antonyms:['gather','collect','hold'],
      example:'Maya will distribute one worksheet to each student.',
      spellingSentence:'Please distribute the papers to the whole class.'
    },
    {
      word:'document', pos:'noun · verb',
      definitions:['a written or printed record that gives information or proof','to provide written or printed proof'],
      synonyms:['certificate','deed','prove','establish'],
      antonyms:[],
      example:'The signed document gave proof, and photographs helped document what happened.',
      spellingSentence:'The signed document gave us the information we needed.'
    },
    {
      word:'fragile', pos:'adjective',
      definitions:['easily broken or damaged; requiring special handling or care'],
      synonyms:['weak','frail','breakable','delicate','brittle','flimsy'],
      antonyms:['sturdy','hardy','strong','rugged','tough'],
      example:'The fragile glass ornament needs careful handling.',
      spellingSentence:'The package was marked fragile because it contained glass.'
    },
    {
      word:'myth', pos:'noun',
      definitions:['an old story that explains why something is or how it came to be; something imaginary'],
      synonyms:['legend','fable','tale','fantasy','fairy tale'],
      antonyms:['fact'],
      example:'The class read a Greek myth about a hero and a monster.',
      spellingSentence:'We read a myth about how thunder began.'
    },
    {
      word:'reject', pos:'verb',
      definitions:['to refuse to accept, agree to, believe, or use'],
      synonyms:['deny','discard','junk','scrap','decline','dismiss'],
      antonyms:['take','accept','receive','welcome'],
      example:'The editor may reject a story that does not follow the rules.',
      spellingSentence:'The club may reject an application that is incomplete.'
    },
    {
      word:'scuffle', pos:'verb · noun',
      definitions:['to fight or struggle closely with','a fight or struggle'],
      synonyms:['tussle','roughhouse','battle','brawl','fistfight','clash'],
      antonyms:[],
      example:'A brief scuffle began when both puppies grabbed the same toy.',
      spellingSentence:'A brief scuffle began over the last ball.'
    },
    {
      word:'solitary', pos:'adjective',
      definitions:['living or being alone; being the only one'],
      synonyms:['single','sole','lone'],
      antonyms:['sociable','several','many','numerous'],
      example:'One solitary tree stood in the empty field.',
      spellingSentence:'A solitary bird sat alone on the fence.'
    },
    {
      word:'temporary', pos:'adjective',
      definitions:['lasting or used for a limited time'],
      synonyms:['short-term','passing','brief','momentary'],
      antonyms:['lasting','long-lived','permanent'],
      example:'The library used a temporary entrance during repairs.',
      spellingSentence:'The temporary bridge will be removed next month.'
    },
    {
      word:'veteran', pos:'noun · adjective',
      definitions:['a former member of the armed forces; an experienced person','having much experience in a job or field'],
      synonyms:['expert','professional','experienced','skilled','accomplished'],
      antonyms:['beginner','newcomer','novice','rookie'],
      example:'The veteran firefighter knew how to remain calm.',
      spellingSentence:'The veteran coach had many years of experience.'
    }
  ];

  var app = document.getElementById('app');
  var chip = document.getElementById('profile-chip');
  var toast = document.getElementById('toast');
  var state = loadState();
  var session = null;
  var toastTimer = null;

  function defaultState() {
    return {
      version:2,
      activeId:null,
      learners:[
        { id:'learner-1', name:'Luke', avatar:'🚀', stats:{}, sessions:[], tests:[] },
        { id:'learner-2', name:'Learner 2', avatar:'⭐', stats:{}, sessions:[], tests:[] }
      ]
    };
  }

  function loadState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.learners) || parsed.learners.length !== 2) return defaultState();
      parsed.learners.forEach(function (learner, index) {
        learner.id = learner.id || ('learner-' + (index + 1));
        learner.name = String(learner.name || ('Learner ' + (index + 1))).slice(0, 24);
        learner.avatar = learner.avatar || (index ? '⭐' : '🚀');
        learner.stats = learner.stats && typeof learner.stats === 'object' ? learner.stats : {};
        learner.sessions = Array.isArray(learner.sessions) ? learner.sessions : [];
        learner.tests = Array.isArray(learner.tests) ? learner.tests : [];
      });
      return parsed;
    } catch (_) { return defaultState(); }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { showToast('Progress could not be saved on this device.'); }
  }

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]; });
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/[‐‑‒–—]/g, '-').replace(/\s+/g, ' ').replace(/[.!?,;:]$/g, '');
  }

  function shuffle(items) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
    }
    return copy;
  }

  function currentLearner() {
    return state.learners.find(function (l) { return l.id === state.activeId; }) || null;
  }

  function statKey(word, domain) { return word + '|' + domain; }
  function getStat(learner, word, domain) {
    return learner.stats[statKey(word, domain)] || { attempts:0, correct:0, wrong:0, streak:0, strength:0, correctDays:[], lastAt:null };
  }

  function assignedWords(domain) {
    return WORDS.filter(function (w) { return domain !== 'antonym' || w.antonyms.length; });
  }

  function domainScore(learner, domain) {
    var words = assignedWords(domain);
    if (!words.length) return 0;
    return Math.round(words.reduce(function (sum, w) { return sum + getStat(learner, w.word, domain).strength; }, 0) / words.length);
  }

  function overallScore(learner) {
    return Math.min.apply(null, DOMAINS.map(function (d) { return domainScore(learner, d); }));
  }

  function updateChip() {
    var learner = currentLearner();
    if (!learner) { chip.hidden = true; return; }
    chip.hidden = false;
    chip.innerHTML = '<span class="avatar" aria-hidden="true">' + learner.avatar + '</span><span class="profile-name">' + esc(learner.name) + '</span>';
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2500);
  }

  function dateMessage(date, label) {
    var today = new Date();
    var start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var days = Math.ceil((target - start) / 86400000);
    if (days > 1) return days + ' days to ' + label;
    if (days === 1) return label + ' tomorrow';
    if (days === 0) return label + ' today';
    return label + ' complete';
  }

  function screenHeader(title, subtitle, backAction) {
    return '<div class="screen-head">' +
      '<button class="back-btn" type="button" id="screen-back" aria-label="Go back">←</button>' +
      '<div><h2>' + esc(title) + '</h2>' + (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') + '</div></div>';
  }

  function wireBack(action) {
    var button = document.getElementById('screen-back');
    if (button) button.addEventListener('click', action || showDashboard);
  }

  function showProfilePicker() {
    session = null;
    state.activeId = null;
    saveState();
    updateChip();
    app.innerHTML = '<section class="hero"><p class="eyebrow">Choose your mission</p><h2>Who is studying?</h2>' +
      '<p>Your progress stays separate, even when you share this device.</p></section>' +
      '<div class="profile-grid">' + state.learners.map(function (l) {
        return '<button type="button" class="menu-card learner-card" data-profile="' + esc(l.id) + '">' +
          '<span class="big-avatar" aria-hidden="true">' + l.avatar + '</span><strong>' + esc(l.name) + '</strong>' +
          '<span>' + overallScore(l) + '% ready</span></button>';
      }).join('') + '</div>' +
      '<button type="button" class="ghost-btn" id="parent-from-picker" style="display:block;margin:20px auto 0">Parent settings</button>';
    app.querySelectorAll('[data-profile]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.activeId = button.getAttribute('data-profile'); saveState(); updateChip(); showDashboard();
      });
    });
    document.getElementById('parent-from-picker').addEventListener('click', showParent);
  }

  function showDashboard() {
    var learner = currentLearner();
    if (!learner) { showProfilePicker(); return; }
    session = null;
    updateChip();
    var scores = {};
    DOMAINS.forEach(function (d) { scores[d] = domainScore(learner, d); });
    var overall = overallScore(learner);
    var missionLabel = overall >= 80 ? 'Protect your mastery' : 'Build your weakest skills';
    app.innerHTML = '<section class="hero"><p class="eyebrow">Today’s plan for ' + esc(learner.name) + '</p><h2>' + esc(missionLabel) + '</h2>' +
      '<p>The mission adapts to every answer and brings missed words back later.</p><div class="countdown">' +
      '<span class="date-pill">' + esc(dateMessage(TEST_DATES.vocabulary,'vocabulary')) + '</span>' +
      '<span class="date-pill">' + esc(dateMessage(TEST_DATES.spelling,'spelling')) + '</span></div></section>' +
      '<section class="readiness-card" aria-label="Readiness summary"><div class="readiness-head"><h2>Test readiness</h2><span class="readiness-number">' + overall + '%</span></div>' +
      '<div class="meter"><span style="width:' + overall + '%"></span></div><div class="domain-grid">' +
      DOMAINS.map(function (d) { return '<div class="domain-stat"><strong>' + scores[d] + '%</strong><span>' + DOMAIN_LABELS[d] + '</span></div>'; }).join('') + '</div></section>' +
      '<div class="mode-grid">' +
      '<button type="button" class="menu-card primary" data-mode="daily"><span class="icon" aria-hidden="true">⚡</span><strong>Start today’s mission</strong><span>14 adaptive questions · about 8 minutes</span><span class="badge">Recommended</span></button>' +
      '<button type="button" class="menu-card" data-mode="learn"><span class="icon" aria-hidden="true">🔎</span><strong>Learn the words</strong><span>Exact school definitions and examples</span></button>' +
      '<button type="button" class="menu-card" data-mode="definitions"><span class="icon" aria-hidden="true">💡</span><strong>Definitions</strong><span>Recognize and retrieve meanings</span></button>' +
      '<button type="button" class="menu-card" data-mode="relations"><span class="icon" aria-hidden="true">↔</span><strong>Synonyms &amp; antonyms</strong><span>Identify and produce both</span></button>' +
      '<button type="button" class="menu-card" data-mode="spelling"><span class="icon" aria-hidden="true">🔊</span><strong>Spelling practice</strong><span>Listen, type, correct, repeat</span></button>' +
      '<button type="button" class="menu-card" data-mode="vocab-test"><span class="icon" aria-hidden="true">🧠</span><strong>Vocabulary mock test</strong><span>18 questions · no hints</span></button>' +
      '<button type="button" class="menu-card" data-mode="spelling-test"><span class="icon" aria-hidden="true">✍️</span><strong>Spelling mock test</strong><span>All 12 words · no hints</span></button>' +
      '<button type="button" class="menu-card" data-mode="progress"><span class="icon" aria-hidden="true">📊</span><strong>Progress</strong><span>Find every unfinished skill</span></button>' +
      '<button type="button" class="menu-card" data-mode="parent"><span class="icon" aria-hidden="true">⚙️</span><strong>Parent center</strong><span>Names, backup, and reset</span></button>' +
      '</div>';
    app.querySelectorAll('[data-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        var mode = button.getAttribute('data-mode');
        if (mode === 'learn') showLearn();
        else if (mode === 'progress') showProgress();
        else if (mode === 'parent') showParent();
        else startSession(mode);
      });
    });
  }

  function eligiblePairs(domains) {
    var pairs = [];
    domains.forEach(function (domain) {
      assignedWords(domain).forEach(function (word) { pairs.push({ word:word, domain:domain }); });
    });
    return pairs;
  }

  function adaptivePlan(domains, count) {
    var learner = currentLearner();
    var pairs = eligiblePairs(domains);
    var plan = [];
    domains.forEach(function (domain) {
      var subset = shuffle(pairs.filter(function (p) { return p.domain === domain; })).sort(function (a,b) {
        return getStat(learner,a.word.word,domain).strength - getStat(learner,b.word.word,domain).strength;
      });
      plan = plan.concat(subset.slice(0, Math.min(2, subset.length)));
    });
    var used = new Set(plan.map(function (p) { return p.word.word + '|' + p.domain; }));
    var rest = shuffle(pairs.filter(function (p) { return !used.has(p.word.word + '|' + p.domain); })).sort(function (a,b) {
      var sa = getStat(learner,a.word.word,a.domain).strength + Math.random() * 12;
      var sb = getStat(learner,b.word.word,b.domain).strength + Math.random() * 12;
      return sa - sb;
    });
    plan = plan.concat(rest).slice(0,count);
    while (plan.length < count) plan.push(shuffle(pairs)[0]);
    return shuffle(plan);
  }

  function balancedTestPlan() {
    var plan = [];
    ['definition','synonym','antonym'].forEach(function (domain) {
      plan = plan.concat(shuffle(assignedWords(domain)).slice(0,6).map(function (word) { return {word:word,domain:domain}; }));
    });
    return shuffle(plan);
  }

  function spellingPlan() {
    return shuffle(WORDS).map(function (word) { return {word:word,domain:'spelling'}; });
  }

  function relationTerms(exclude) {
    var all = [];
    WORDS.forEach(function (w) { all = all.concat(w.synonyms,w.antonyms); });
    return Array.from(new Set(all.filter(function (x) { return !exclude.includes(x); })));
  }

  function makeQuestion(pair, index, forceText) {
    var w = pair.word;
    var domain = pair.domain;
    var typed = forceText || domain === 'spelling' || index % 2 === 0;
    if (domain === 'definition') {
      if (typed) return { word:w, domain:domain, kind:'text', prompt:'Which vocabulary word means “' + w.definitions.join('; or ') + '”?', accepted:[w.word], answer:w.word, explanation:w.word + ': ' + w.definitions.join('; ') };
      var defs = WORDS.filter(function (x) { return x.word !== w.word; }).map(function (x) { return x.definitions[0]; });
      return { word:w, domain:domain, kind:'choice', prompt:'Which definition matches <span class="target">' + esc(w.word) + '</span>?', choices:shuffle([w.definitions[0]].concat(shuffle(defs).slice(0,3))), accepted:[w.definitions[0]], answer:w.definitions[0], explanation:w.word + ': ' + w.definitions.join('; ') };
    }
    if (domain === 'synonym' || domain === 'antonym') {
      var list = domain === 'synonym' ? w.synonyms : w.antonyms;
      var otherList = domain === 'synonym' ? w.antonyms : w.synonyms;
      if (typed) return { word:w, domain:domain, kind:'text', prompt:'Type one ' + domain + ' for <span class="target">' + esc(w.word) + '</span>.', accepted:list, answer:list[0], explanation:'School list: ' + list.join(', ') };
      var distractors = Array.from(new Set(otherList.concat(shuffle(relationTerms(list.concat(otherList))).slice(0,5))));
      return { word:w, domain:domain, kind:'choice', prompt:'Which word is ' + (domain === 'antonym' ? 'an' : 'a') + ' ' + domain + ' of <span class="target">' + esc(w.word) + '</span>?', choices:shuffle([list[0]].concat(shuffle(distractors).slice(0,3))), accepted:[list[0]], answer:list[0], explanation:'School list: ' + list.join(', ') };
    }
    return { word:w, domain:'spelling', kind:'text', prompt:'Listen to the word and type its exact spelling.', accepted:[w.word], answer:w.word, explanation:'The correct spelling is ' + w.word + '.', listen:true };
  }

  function startSession(mode) {
    var config;
    if (mode === 'daily') config = { title:'Today’s mission', subtitle:'Your weakest skills come first', plan:adaptivePlan(DOMAINS,14), test:false };
    else if (mode === 'definitions') config = { title:'Definition practice', subtitle:'Meanings in both directions', plan:adaptivePlan(['definition'],12), test:false };
    else if (mode === 'relations') config = { title:'Synonyms & antonyms', subtitle:'Recognition plus unaided recall', plan:adaptivePlan(['synonym','antonym'],16), test:false };
    else if (mode === 'spelling') config = { title:'Spelling practice', subtitle:'All 12 words with corrective repetition', plan:spellingPlan(), test:false };
    else if (mode === 'vocab-test') config = { title:'Vocabulary mock test', subtitle:'18 questions · answers revealed at the end', plan:balancedTestPlan(), test:true };
    else config = { title:'Spelling mock test', subtitle:'12 dictated words · answers revealed at the end', plan:spellingPlan(), test:true };
    session = { mode:mode, title:config.title, subtitle:config.subtitle, test:config.test, index:0, correct:0, answered:false, results:[], questions:config.plan.map(function (pair,i) { return makeQuestion(pair,i,config.test && i % 3 === 0); }), requeues:0 };
    renderQuestion();
  }

  function renderQuestion() {
    if (!session || session.index >= session.questions.length) { finishSession(); return; }
    var q = session.questions[session.index];
    session.answered = false;
    var percent = Math.round((session.index / session.questions.length) * 100);
    app.innerHTML = screenHeader(session.title,session.subtitle) +
      '<div class="session-meta"><span>Question ' + (session.index + 1) + ' of ' + session.questions.length + '</span><span>' + session.correct + ' correct</span></div>' +
      '<div class="session-progress"><span style="width:' + percent + '%"></span></div>' +
      '<section class="question-card"><span class="q-domain">' + DOMAIN_LABELS[q.domain] + '</span><p class="q-prompt">' + q.prompt + '</p>' +
      (q.listen ? '<button type="button" class="listen-btn" id="listen"><span aria-hidden="true">🔊</span> Listen to the word</button><p class="hint-text">It will be used in a sentence, too.</p>' : '') +
      '<div id="answer-area">' + (q.kind === 'choice' ? renderChoices(q) : renderInput(q)) + '</div><div id="feedback-area"></div></section>';
    wireBack(function () { if (confirm('Leave this session? Your completed answers are already saved.')) showDashboard(); });
    if (q.kind === 'choice') wireChoices(q); else wireInput(q);
    if (q.listen) {
      document.getElementById('listen').addEventListener('click', function () { speakSpelling(q.word); });
      setTimeout(function () { speakSpelling(q.word); }, 280);
    }
  }

  function renderChoices(q) {
    return '<div class="choice-list">' + q.choices.map(function (choice) { return '<button type="button" class="choice" data-answer="' + esc(choice) + '">' + esc(choice) + '</button>'; }).join('') + '</div>';
  }

  function renderInput(q) {
    var label = q.domain === 'spelling' ? 'Type the spelling' : 'Type your answer';
    return '<form id="answer-form"><label class="sr-only" for="answer-input">' + label + '</label><div class="answer-row">' +
      '<input class="answer-input" id="answer-input" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" placeholder="' + label + '">' +
      '<button class="submit-btn" type="submit">Check</button></div></form>';
  }

  function wireChoices(q) {
    app.querySelectorAll('.choice').forEach(function (button) {
      button.addEventListener('click', function () { submitAnswer(q,button.getAttribute('data-answer'),button); });
    });
  }

  function wireInput(q) {
    var form = document.getElementById('answer-form');
    var input = document.getElementById('answer-input');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!input.value.trim()) { input.focus(); return; }
      submitAnswer(q,input.value,input);
    });
    if (!q.listen) setTimeout(function () { input.focus(); },80);
  }

  function isAccepted(q, value) {
    var normalized = normalize(value);
    return q.accepted.some(function (answer) { return normalize(answer) === normalized; });
  }

  function recordResult(q, correct, kind) {
    var learner = currentLearner();
    var key = statKey(q.word.word,q.domain);
    var stat = getStat(learner,q.word.word,q.domain);
    var today = new Date().toISOString().slice(0,10);
    stat.attempts += 1;
    stat.lastAt = new Date().toISOString();
    stat.correctDays = Array.isArray(stat.correctDays) ? stat.correctDays : [];
    if (correct) {
      stat.correct += 1; stat.streak += 1;
      var newDay = !stat.correctDays.includes(today);
      if (newDay) stat.correctDays.push(today);
      stat.strength = Math.min(100,(stat.strength || 0) + (kind === 'text' ? 22 : 14) + (newDay ? 8 : 0) + (stat.streak >= 3 ? 5 : 0));
    } else {
      stat.wrong += 1; stat.streak = 0;
      stat.strength = Math.max(0,(stat.strength || 0) - 14);
    }
    learner.stats[key] = stat;
    saveState();
  }

  function submitAnswer(q, value, source) {
    if (session.answered) return;
    session.answered = true;
    var correct = isAccepted(q,value);
    if (correct) session.correct += 1;
    session.results.push({ word:q.word.word, domain:q.domain, correct:correct, given:String(value), answer:q.answer });
    recordResult(q,correct,q.kind);
    if (!correct && !session.test && session.requeues < 4) {
      session.questions.push(makeQuestion({word:q.word,domain:q.domain},session.questions.length,true));
      session.requeues += 1;
    }
    if (session.test) {
      setTimeout(nextQuestion,120);
      return;
    }
    if (q.kind === 'choice') {
      app.querySelectorAll('.choice').forEach(function (button) {
        button.disabled = true;
        if (isAccepted(q,button.getAttribute('data-answer'))) button.classList.add('correct');
      });
      if (!correct && source && source.classList) source.classList.add('wrong');
    } else {
      var input = document.getElementById('answer-input');
      if (input) input.disabled = true;
      var submit = app.querySelector('.submit-btn'); if (submit) submit.disabled = true;
    }
    document.getElementById('feedback-area').innerHTML = '<div class="feedback ' + (correct ? 'good' : 'bad') + '"><strong>' + (correct ? 'Strong retrieval.' : 'Not yet—correct it now.') + '</strong>' + esc(q.explanation) + '</div>' +
      '<button type="button" class="continue-btn" id="continue">Continue</button>';
    document.getElementById('continue').addEventListener('click',nextQuestion);
    document.getElementById('continue').focus();
  }

  function nextQuestion() { session.index += 1; renderQuestion(); }

  function speakSpelling(word) {
    if (!('speechSynthesis' in window)) { showToast('Audio is unavailable in this browser.'); return; }
    window.speechSynthesis.cancel();
    var button = document.getElementById('listen');
    if (button) { button.classList.remove('pulse'); void button.offsetWidth; button.classList.add('pulse'); }
    var first = new SpeechSynthesisUtterance(word.word + '.');
    var second = new SpeechSynthesisUtterance(word.spellingSentence + ' ' + word.word + '.');
    first.lang = second.lang = 'en-US'; first.rate = .78; second.rate = .82;
    window.speechSynthesis.speak(first); window.speechSynthesis.speak(second);
  }

  function finishSession() {
    var learner = currentLearner();
    var total = session.results.length;
    var score = total ? Math.round((session.correct / total) * 100) : 0;
    var misses = session.results.filter(function (r) { return !r.correct; });
    learner.sessions.unshift({ at:new Date().toISOString(), mode:session.mode, score:score, correct:session.correct, total:total });
    learner.sessions = learner.sessions.slice(0,30);
    if (session.test) {
      learner.tests.unshift({ at:new Date().toISOString(), mode:session.mode, score:score, results:session.results });
      learner.tests = learner.tests.slice(0,12);
    }
    saveState();
    var uniqueMisses = [];
    var seen = new Set();
    misses.forEach(function (m) { var key=m.word+'|'+m.domain; if(!seen.has(key)){seen.add(key);uniqueMisses.push(m);} });
    app.innerHTML = '<section class="panel summary"><div class="summary-icon" aria-hidden="true">' + (score >= 85 ? '🏆' : score >= 65 ? '🌱' : '🧭') + '</div>' +
      '<h2>' + (score >= 85 ? 'Mission accomplished' : 'Mission complete') + '</h2><p>' + (session.test ? 'This was an honest readiness check.' : 'Every retrieval made the next one stronger.') + '</p>' +
      '<div class="score-orb" style="--score:' + score + '%" data-score="' + score + '%" aria-label="Score ' + score + ' percent"></div>' +
      (uniqueMisses.length ? '<ul class="weak-list"><li><strong>Review next</strong><span>Skill</span></li>' + uniqueMisses.slice(0,8).map(function (m) { return '<li><strong>' + esc(m.word) + '</strong><span>' + esc(DOMAIN_LABELS[m.domain]) + '</span></li>'; }).join('') + '</ul>' : '<p><strong>No missed skills in this session.</strong></p>') +
      '<div class="button-row" style="margin-top:20px"><button type="button" class="solid-btn" id="summary-home">Back to dashboard</button>' +
      '<button type="button" class="ghost-btn" id="summary-again">Practice again</button></div></section>';
    var finishedMode = session.mode;
    document.getElementById('summary-home').addEventListener('click',showDashboard);
    document.getElementById('summary-again').addEventListener('click',function () { startSession(finishedMode); });
  }

  function showLearn() {
    app.innerHTML = screenHeader('Learn the words','Teacher wording is kept exact') + '<div class="word-list">' + WORDS.map(function (w) {
      return '<article class="word-card"><div class="word-top"><div><h3>' + esc(w.word) + '</h3><span class="pos">' + esc(w.pos) + '</span></div>' +
        '<button type="button" class="speak-mini" data-speak="' + esc(w.word) + '" aria-label="Hear ' + esc(w.word) + '">🔊</button></div>' +
        '<p class="definition">' + esc(w.definitions.join('; ')) + '</p>' +
        '<p class="word-detail"><strong>Synonyms:</strong> ' + esc(w.synonyms.join(', ')) + '</p>' +
        '<p class="word-detail"><strong>Antonyms:</strong> ' + (w.antonyms.length ? esc(w.antonyms.join(', ')) : '<em>Not assigned on the worksheet</em>') + '</p>' +
        '<p class="example">' + esc(w.example) + '</p></article>';
    }).join('') + '</div>';
    wireBack(showDashboard);
    app.querySelectorAll('[data-speak]').forEach(function (button) {
      button.addEventListener('click',function () {
        var word = WORDS.find(function (w) { return w.word === button.getAttribute('data-speak'); });
        if (word) speakSpelling(word);
      });
    });
  }

  function levelClass(score) { return score >= 80 ? 'ready' : score > 0 ? 'learning' : ''; }

  function showProgress() {
    var learner = currentLearner();
    app.innerHTML = screenHeader(learner.name + '’s progress','A green skill is test-ready') +
      '<p class="legend"><span class="dot ready"></span> Ready &nbsp; <span class="dot learning"></span> Learning &nbsp; <span class="dot"></span> Not started</p>' +
      '<div style="overflow-x:auto"><table class="progress-table"><thead><tr><th>Word</th><th>Definition</th><th>Synonym</th><th>Antonym</th><th>Spelling</th></tr></thead><tbody>' +
      WORDS.map(function (w) { return '<tr><td>' + esc(w.word) + '</td>' + DOMAINS.map(function (d) {
        if (d === 'antonym' && !w.antonyms.length) return '<td aria-label="Not assigned">—</td>';
        var score = getStat(learner,w.word,d).strength;
        return '<td aria-label="' + esc(DOMAIN_LABELS[d]) + ' ' + score + ' percent"><span class="dot ' + levelClass(score) + '" title="' + score + '%"></span></td>';
      }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      '<section class="readiness-card" style="margin-top:18px"><div class="readiness-head"><h2>Overall readiness</h2><span class="readiness-number">' + overallScore(learner) + '%</span></div><p class="parent-note">Overall readiness is limited by the weakest required domain, so strong spelling cannot hide weak antonyms.</p></section>';
    wireBack(showDashboard);
  }

  function showParent() {
    chip.hidden = true;
    app.innerHTML = screenHeader('Parent center','Profiles and device backup',currentLearner() ? showDashboard : showProfilePicker) +
      '<section class="panel"><form id="names-form">' + state.learners.map(function (l,index) {
        return '<div class="field"><label for="name-' + index + '">Learner ' + (index + 1) + ' name</label><input id="name-' + index + '" maxlength="24" value="' + esc(l.name) + '"></div>';
      }).join('') + '<button class="solid-btn" type="submit">Save names</button></form></section>' +
      '<h3 class="section-title">Backup</h3><section class="panel"><p class="parent-note">Progress currently lives on this device. Download a backup before changing devices or clearing browser data.</p><div class="button-row" style="justify-content:flex-start">' +
      '<button type="button" class="ghost-btn" id="export">Download backup</button><label class="file-label">Restore backup<input type="file" id="import" accept="application/json"></label></div></section>' +
      '<h3 class="section-title">Reset</h3><section class="panel"><p class="parent-note">Reset removes practice history for one learner only. The other profile is untouched.</p><div class="button-row" style="justify-content:flex-start">' +
      state.learners.map(function (l) { return '<button type="button" class="ghost-btn danger" data-reset="' + esc(l.id) + '">Reset ' + esc(l.name) + '</button>'; }).join('') + '</div></section>';
    wireBack(currentLearner() ? showDashboard : showProfilePicker);
    document.getElementById('names-form').addEventListener('submit',function (event) {
      event.preventDefault();
      state.learners.forEach(function (l,index) { var value=document.getElementById('name-'+index).value.trim(); if(value) l.name=value.slice(0,24); });
      saveState(); updateChip(); showToast('Names saved.'); showParent();
    });
    document.getElementById('export').addEventListener('click',exportBackup);
    document.getElementById('import').addEventListener('change',importBackup);
    app.querySelectorAll('[data-reset]').forEach(function (button) {
      button.addEventListener('click',function () {
        var learner=state.learners.find(function(l){return l.id===button.getAttribute('data-reset');});
        if (learner && confirm('Reset all Unit 1 progress for ' + learner.name + '?')) { learner.stats={};learner.sessions=[];learner.tests=[];saveState();showToast(learner.name+' was reset.');showParent(); }
      });
    });
  }

  function exportBackup() {
    var blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href=url; link.download='word-mission-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},500);
    showToast('Backup downloaded.');
  }

  function importBackup(event) {
    var file = event.target.files && event.target.files[0]; if(!file)return;
    var reader = new FileReader();
    reader.onload=function(){
      try { var parsed=JSON.parse(reader.result); if(parsed.version!==2||!Array.isArray(parsed.learners)||parsed.learners.length!==2)throw new Error('bad'); state=parsed;saveState();showToast('Backup restored.');showProfilePicker(); }
      catch(_){showToast('That is not a valid Word Mission backup.');}
    };
    reader.readAsText(file);
  }

  chip.addEventListener('click',showProfilePicker);
  if (state.activeId && currentLearner()) showDashboard(); else showProfilePicker();
})();

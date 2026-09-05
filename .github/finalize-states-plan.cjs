const fs = require('node:fs');
const path = 'study/us-states.html';
let s = fs.readFileSync(path, 'utf8');

function once(oldText, newText, label) {
  const i = s.indexOf(oldText);
  if (i < 0) throw new Error('Missing patch anchor: ' + label);
  if (s.indexOf(oldText, i + oldText.length) >= 0) throw new Error('Ambiguous patch anchor: ' + label);
  s = s.slice(0, i) + newText + s.slice(i + oldText.length);
}
function all(oldText, newText, expected, label) {
  const parts = s.split(oldText);
  if (parts.length - 1 !== expected) throw new Error(`Expected ${expected} ${label} anchors, found ${parts.length - 1}`);
  s = parts.join(newText);
}

once(
  '/* The active round is snapshotted after every answer so closing the tab or\n   taking a call mid-round does not throw the round away. */',
  `/* A school test run uses the planner's known question count without pretending
   we know an unpublished 40-state classroom subset. Previously practiced states
   are kept in the pool first; any remaining slots are filled neutrally. */
function assessmentTestStates(p, now) {
  var target = quizTargetCount(now);
  if (target >= STATES.length) return STATES.slice();
  var at = now instanceof Date ? now.getTime() : Number(now || Date.now());
  var entries = STATES.map(function(state, index) {
    var st = (p && p.stateStats && p.stateStats[state.code]) || null;
    var seen = st ? (Number(st.correct) || 0) + (Number(st.wrong) || 0) : 0;
    return { state: state, seen: seen, mastered: !!(st && st.mastered), retrieval: retrievalPriority(st, at), index: index, jitter: Math.random() };
  });
  entries.sort(function(a, b) {
    if ((b.seen > 0) !== (a.seen > 0)) return Number(b.seen > 0) - Number(a.seen > 0);
    if (b.mastered !== a.mastered) return Number(b.mastered) - Number(a.mastered);
    if (Math.abs(b.retrieval - a.retrieval) > 0.25) return b.retrieval - a.retrieval;
    if (b.seen !== a.seen) return b.seen - a.seen;
    return a.jitter - b.jitter || a.index - b.index;
  });
  return entries.slice(0, target).map(function(entry) { return entry.state; });
}

/* The active round is snapshotted after every answer so closing the tab or
   taking a call mid-round does not throw the round away. */`,
  'assessmentTestStates insertion'
);

once("      '<span class=\"badge\">Graded &bull; 50 questions</span>' +", "      '<span class=\"badge\">Graded &bull; ' + quizTargetCount() + ' questions</span>' +", 'dynamic test badge');
once("        '<h2>Full Test</h2>' +", "        '<h2>Test Run</h2>' +", 'test title');
once("        '<p>A mix of spelling and map questions covering all 50 states &mdash; just like the real test</p>' +", "        '<p>A graded spelling and map run sized to the current school target</p>' +", 'test description');

once(
`function startTest() {
  cancelAutoAdvance();
  streakCount = 0;
  mode = "test";
  roundLabel = "";
  var pool = shuffle(STATES.slice());
  queue = pool.map(function(s, i) {
    return { code: s.code, name: s.name, type: (i % 2 === 0 ? "spell" : "map") };
  });
  queue = shuffle(queue);
  qIndex = 0;
  score = 0;
  retriedThisRound = {};
  subScore = { spell: 0, spellTotal: 0, map: 0, mapTotal: 0 };
  missed = [];
  renderTestQuestion();
}`,
`function startTest() {
  cancelAutoAdvance();
  streakCount = 0;
  mode = "test";
  roundLabel = "School Test Run";
  var data = loadData();
  var p = data.activeProfile ? data.profiles[data.activeProfile] : emptyProfile();
  var pool = shuffle(assessmentTestStates(p, new Date()));
  queue = pool.map(function(s, i) {
    return { code: s.code, name: s.name, type: (i % 2 === 0 ? "spell" : "map") };
  });
  queue = shuffle(queue);
  qIndex = 0;
  score = 0;
  retriedThisRound = {};
  subScore = { spell: 0, spellTotal: 0, map: 0, mapTotal: 0 };
  missed = [];
  renderTestQuestion();
}`,
  'startTest'
);

all(
  '  var pct = Math.round((qIndex / queue.length) * 100);',
  '  var pct = Math.round((qIndex / queue.length) * 100);\n  var assessmentRun = roundLabel === "School Test Run";',
  2,
  'question renderer'
);

all(
  "    '<div class=\"score-line\"><span>Question ' + (qIndex + 1) + ' of ' + queue.length + '</span><span>' + streakHTML() + ' Score: ' + score + '</span></div>' +",
  "    '<div class=\"score-line\"><span>Question ' + (qIndex + 1) + ' of ' + queue.length + '</span><span>' + (assessmentRun ? 'Test run' : streakHTML() + ' Score: ' + score) + '</span></div>' +",
  2,
  'score line'
);

once(
`    var mres = recordAnswer(s.code, correct);
    bumpStreak(correct);
    celebrate(correct, mres.justMastered);
    animateState("qMap", s.code, correct);`,
`    var mres = recordAnswer(s.code, correct);
    if (!assessmentRun) {
      bumpStreak(correct);
      celebrate(correct, mres.justMastered);
      animateState("qMap", s.code, correct);
    }`,
  'spelling feedback suppression'
);

once(
`    document.getElementById("masteryPips").innerHTML =
      masteryPipsHTML(s.code, mres.justMastered) + (correct ? factLineHTML(s.code) : "");

    var next = makeNextButton(qIndex + 1 >= queue.length ? "See Results" : "Next →", function() {`,
`    document.getElementById("masteryPips").innerHTML = assessmentRun ? "" :
      masteryPipsHTML(s.code, mres.justMastered) + (correct ? factLineHTML(s.code) : "");
    if (assessmentRun) {
      fb.className = "feedback";
      fb.textContent = "Answer recorded.";
      if (pathEl) pathEl.classList.remove("correct", "wrong", "reveal");
    }

    var next = makeNextButton(qIndex + 1 >= queue.length ? "See Results" : "Next →", function() {`,
  'spelling neutral result'
);
once('    if (correct) scheduleAutoAdvance(next.go);', '    if (correct && !assessmentRun) scheduleAutoAdvance(next.go);', 'spelling no auto reveal');

once(
`        var mres = recordAnswer(s.code, correct);
        bumpStreak(correct);
        celebrate(correct, mres.justMastered);
        mapIds.forEach(function(id) {`,
`        var mres = recordAnswer(s.code, correct);
        if (!assessmentRun) {
          bumpStreak(correct);
          celebrate(correct, mres.justMastered);
        }
        mapIds.forEach(function(id) {`,
  'map feedback suppression'
);

once(
`        document.getElementById("masteryPips").innerHTML =
          masteryPipsHTML(s.code, mres.justMastered) + (correct ? factLineHTML(s.code) : "");

        var next = makeNextButton(qIndex + 1 >= queue.length ? "See Results" : "Next →", function() {`,
`        document.getElementById("masteryPips").innerHTML = assessmentRun ? "" :
          masteryPipsHTML(s.code, mres.justMastered) + (correct ? factLineHTML(s.code) : "");
        if (assessmentRun) {
          fb.className = "feedback";
          fb.textContent = "Answer recorded.";
          mapIds.forEach(function(id) {
            document.querySelectorAll('#' + id + ' path.state').forEach(function(el) { el.classList.remove("correct", "wrong", "reveal"); });
          });
        }

        var next = makeNextButton(qIndex + 1 >= queue.length ? "See Results" : "Next →", function() {`,
  'map neutral result'
);
once('        if (correct) scheduleAutoAdvance(next.go, advanceDelayFor(lastFactShown));', '        if (correct && !assessmentRun) scheduleAutoAdvance(next.go, advanceDelayFor(lastFactShown));', 'map no auto reveal');

once(
  '    title: (roundLabel === "Quick Round" ? "Quick Round Results" : "Full Test Results"),',
  '    title: (roundLabel === "Quick Round" ? "Quick Round Results" : roundLabel === "School Test Run" ? "Test Run Results" : "Full Test Results"),',
  'results title'
);

fs.writeFileSync(path, s);
console.log('Patched', path);

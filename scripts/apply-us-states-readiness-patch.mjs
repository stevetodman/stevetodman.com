import { readFile, writeFile } from "node:fs/promises";

// One-time surgical patch: change adaptive state selection without rewriting the child-facing UI.
const path = new URL("../study/us-states.html", import.meta.url);
let source = (await readFile(path, "utf8")).replace(/\r\n/g, "\n");

function replaceOnce(needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`Patch target missing: ${label}`);
  if (source.indexOf(needle, first + needle.length) >= 0) throw new Error(`Patch target not unique: ${label}`);
  source = source.slice(0, first) + replacement + source.slice(first + needle.length);
}

replaceOnce(
`var BOSS_HP = 3;`,
`var BOSS_HP = 3;
var DAY_MS = 24 * 60 * 60 * 1000;

/* Hidden school-readiness target. The planner gives the number of states on
   each quiz, not which states are included, so this never excludes a state.
   It only controls how much new-vs-retrieval practice the existing quick
   round quietly serves. */
function quizTargetCount(now) {
  var d = now instanceof Date ? now : new Date(now || Date.now());
  var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  return key <= "2026-09-09" ? 40 : 50;
}

/* Mastery is an earned achievement and never decays. Retrieval readiness is
   separate: an older correct retrieval or a recent miss raises the chance a
   mastered state will come back into practice. */
function retrievalPriority(st, now) {
  if (!st) return 100;
  var at = Number(now || Date.now());
  var lastSeen = Math.max(0, Number(st.lastSeenAt) || 0);
  var lastCorrect = Math.max(0, Number(st.lastCorrectAt) || 0);
  var last = Math.max(lastSeen, lastCorrect);
  var ageDays = last ? Math.min(30, Math.max(0, (at - last) / DAY_MS)) : 30;
  var missAfterCorrect = Number(st.lastMissAt) > lastCorrect ? 8 : 0;
  return ageDays + Math.min(6, Number(st.wrong) || 0) * 1.5 + missAfterCorrect;
}`,
"readiness helpers"
);

replaceOnce(
`  var familiar = Math.round(n * familiarShare);`,
`  var target = quizTargetCount();
  var masteredCount = (p.masteredOrder || []).length;
  if (masteredCount < target && (acc === null || acc >= 0.5)) familiarShare = Math.min(familiarShare, 0.35);
  var familiar = Math.round(n * familiarShare);`,
"deadline-aware round mix"
);

replaceOnce(
`  var justMastered = false;`,
`  var now = Date.now();
  st.lastSeenAt = now;
  var justMastered = false;`,
"answer recency"
);

replaceOnce(
`    st.correct++;`,
`    st.lastCorrectAt = now;
    st.correct++;`,
"correct recency"
);

replaceOnce(
`    st.wrong++;`,
`    st.lastMissAt = now;
    st.wrong++;`,
"miss recency"
);

replaceOnce(
`function quickRoundStates(p, n) {
  var mastered = [], learning = [];`,
`function quickRoundStates(p, n) {
  var mastered = [], learning = [];
  var now = Date.now();`,
"quick round time anchor"
);

replaceOnce(
`      streak: st ? st.streak : 0,
      jitter: Math.random()`,
`      streak: st ? st.streak : 0,
      retrieval: retrievalPriority(st, now),
      jitter: Math.random()`,
"quick round readiness field"
);

replaceOnce(
`  // Among mastered states, favour the ones practised least recently.
  mastered.sort(function(a, b) { return a.jitter - b.jitter; });`,
`  // Among mastered states, favour stale retrieval and recent misses while
  // keeping earned mastery intact. Randomness only breaks near-ties.
  mastered.sort(function(a, b) {
    if (Math.abs(b.retrieval - a.retrieval) > 0.25) return b.retrieval - a.retrieval;
    return a.jitter - b.jitter;
  });`,
"retrieval-aware mastered sorting"
);

replaceOnce(
`      wrong: Math.max(sa.wrong, sb.wrong),
      mastered: sa.mastered || sb.mastered`,
`      wrong: Math.max(sa.wrong, sb.wrong),
      mastered: sa.mastered || sb.mastered,
      lastSeenAt: Math.max(Number(sa.lastSeenAt) || 0, Number(sb.lastSeenAt) || 0),
      lastCorrectAt: Math.max(Number(sa.lastCorrectAt) || 0, Number(sb.lastCorrectAt) || 0),
      lastMissAt: Math.max(Number(sa.lastMissAt) || 0, Number(sb.lastMissAt) || 0)`,
"cloud timestamp merge"
);

await writeFile(path, source, "utf8");
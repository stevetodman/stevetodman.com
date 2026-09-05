/* School assessment contract for the current 50 States assignment.
   The classroom test always covers all 50 states. The interim requirement is
   40 correct out of 50 by Sep 9; the final requirement is 50/50 by Sep 16.
   Which 40 are correct does not matter. Keep this separate from permanent
   mastery and from the adaptive practice selector. */
(function () {
  "use strict";

  function dateKey(now) {
    var d = now instanceof Date ? now : new Date(now || Date.now());
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function schoolRequiredScore(now) {
    return dateKey(now) < "2026-09-16" ? 40 : 50;
  }

  window.usStatesSchoolRequiredScore = schoolRequiredScore;

  // A test run samples every state. The date changes the score needed, not
  // which states are eligible or how many questions appear.
  window.quizTargetCount = function () { return 50; };
  window.assessmentTestStates = function () { return STATES.slice(); };

  var baseShowMenu = window.showMenu;
  window.showMenu = function () {
    baseShowMenu();
    var card = document.querySelector('.menu-card[data-mode="test"]');
    if (!card) return;
    var required = schoolRequiredScore(new Date());
    var badge = card.querySelector(".badge");
    var description = card.querySelector("p");
    if (badge) badge.textContent = "Graded • 50 questions";
    if (description) {
      description.textContent = required === 50
        ? "All 50 states. Goal: 50/50."
        : "All 50 states. Goal: 40/50 now; any 40 count. Final goal: 50/50 by Sep 16.";
    }
  };

  var baseRenderTestResults = window.renderTestResults;
  window.renderTestResults = function () {
    var schoolRun = roundLabel === "School Test Run";
    baseRenderTestResults();
    if (!schoolRun) return;

    var required = schoolRequiredScore(new Date());
    var met = score >= required;
    var grade = document.querySelector(".results .grade");
    if (grade) {
      grade.textContent = met
        ? "Current school target met: " + score + "/50 (need " + required + "/50)"
        : "Current school target: " + required + "/50 · " + (required - score) + " more needed";
      grade.style.color = met ? "#38a169" : "#dd6b20";
    }
  };

  // The base page boots before this small contract layer loads. Refresh the
  // menu once so the first visible test card reflects the corrected contract.
  window.showMenu();
})();

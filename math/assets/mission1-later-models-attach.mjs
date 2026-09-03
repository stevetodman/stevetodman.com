import { createLaterSkillManipulative } from "./mission1-later-models.mjs?v=20260903-model1";

function install() {
  const main = document.querySelector(".question-main");
  const answerForm = document.querySelector("#answer-form");
  const skillTag = document.querySelector("#skill-tag");
  const questionBody = document.querySelector("#question-body");
  if (!main || !answerForm || !skillTag || !questionBody) return;

  let root = document.createElement("section");
  root.id = "lesson-model";
  root.className = "lesson-model";
  root.hidden = true;
  root.setAttribute("aria-label", "Guided lesson model");
  main.insertBefore(root, answerForm);

  let controller = createLaterSkillManipulative({ root });
  let lastKey = "";

  function freshRoot() {
    const replacement = root.cloneNode(false);
    replacement.hidden = true;
    root.replaceWith(replacement);
    root = replacement;
    controller = createLaterSkillManipulative({ root });
  }

  function refresh() {
    const question = window.MathMissionCurrentQuestion;
    const guided = /\bGuided\b/i.test(skillTag.textContent || "");
    if (!guided || !question) {
      if (!root.hidden || lastKey) {
        controller.reset();
        lastKey = "";
      }
      return;
    }

    const key = `${question.micro}|${question.prompt}|${question.audit?.kind || ""}`;
    if (key === lastKey) return;
    if (lastKey) freshRoot();
    lastKey = key;
    controller.setQuestion({ ...question, assisted: true });
  }

  new MutationObserver(() => queueMicrotask(refresh)).observe(skillTag, { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => queueMicrotask(refresh)).observe(questionBody, { childList: true, subtree: true, characterData: true });
  window.addEventListener("mathmission:question-generated", () => queueMicrotask(refresh));
  refresh();
}

if (typeof document !== "undefined") install();
